-- StoreFin triggers
-- Auto-create profile on signup, first signup = owner.
-- Auto-adjust stock on purchase/sale insert/delete.

-- ---------- Profile auto-create ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
begin
  select count(*) = 0 into is_first from public.profiles;
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when is_first then 'owner'::role_t else 'staff'::role_t end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ---------- Stamp created_by ----------
create or replace function public.stamp_created_by()
returns trigger
language plpgsql
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_purchases_created_by on public.purchases;
create trigger trg_purchases_created_by
before insert on public.purchases
for each row execute procedure public.stamp_created_by();

drop trigger if exists trg_sales_created_by on public.sales;
create trigger trg_sales_created_by
before insert on public.sales
for each row execute procedure public.stamp_created_by();

drop trigger if exists trg_exp_created_by on public.expenses;
create trigger trg_exp_created_by
before insert on public.expenses
for each row execute procedure public.stamp_created_by();

drop trigger if exists trg_oi_created_by on public.other_income;
create trigger trg_oi_created_by
before insert on public.other_income
for each row execute procedure public.stamp_created_by();

-- ---------- Adjust stock on purchase_items ----------
create or replace function public.adjust_stock_on_purchase()
returns trigger
language plpgsql
as $$
declare
  mode track_mode_t;
begin
  if (tg_op = 'INSERT') then
    select track_mode into mode from public.products where id = new.product_id;
    if mode = 'batch' then
      update public.products
        set current_stock = current_stock + new.quantity
        where id = new.product_id;
    else
      -- per-unit: mark the unit as in stock if linked
      if new.inventory_unit_id is not null then
        update public.inventory_units
          set status = 'in_stock', purchase_id = new.purchase_id
          where id = new.inventory_unit_id;
      end if;
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    select track_mode into mode from public.products where id = old.product_id;
    if mode = 'batch' then
      update public.products
        set current_stock = current_stock - old.quantity
        where id = old.product_id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_pi_stock on public.purchase_items;
create trigger trg_pi_stock
after insert or delete on public.purchase_items
for each row execute procedure public.adjust_stock_on_purchase();

-- ---------- Adjust stock on sale_items ----------
create or replace function public.adjust_stock_on_sale()
returns trigger
language plpgsql
as $$
declare
  mode track_mode_t;
begin
  if (tg_op = 'INSERT') then
    select track_mode into mode from public.products where id = new.product_id;
    if mode = 'batch' then
      update public.products
        set current_stock = current_stock - new.quantity
        where id = new.product_id;
    else
      if new.inventory_unit_id is not null then
        update public.inventory_units
          set status = 'sold', sale_id = new.sale_id, sold_at = now()
          where id = new.inventory_unit_id;
      end if;
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    select track_mode into mode from public.products where id = old.product_id;
    if mode = 'batch' then
      update public.products
        set current_stock = current_stock + old.quantity
        where id = old.product_id;
    else
      if old.inventory_unit_id is not null then
        update public.inventory_units
          set status = 'in_stock', sale_id = null, sold_at = null
          where id = old.inventory_unit_id;
      end if;
    end if;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_si_stock on public.sale_items;
create trigger trg_si_stock
after insert or delete on public.sale_items
for each row execute procedure public.adjust_stock_on_sale();

-- ---------- Maintain purchase/sale total_amount from line items ----------
create or replace function public.recalc_purchase_total()
returns trigger
language plpgsql
as $$
declare
  pid uuid := coalesce(new.purchase_id, old.purchase_id);
begin
  update public.purchases
    set total_amount = coalesce((
      select sum(line_total) from public.purchase_items where purchase_id = pid
    ), 0)
    where id = pid;
  return null;
end;
$$;

drop trigger if exists trg_pi_total on public.purchase_items;
create trigger trg_pi_total
after insert or update or delete on public.purchase_items
for each row execute procedure public.recalc_purchase_total();

create or replace function public.recalc_sale_total()
returns trigger
language plpgsql
as $$
declare
  sid uuid := coalesce(new.sale_id, old.sale_id);
begin
  update public.sales
    set total_amount = coalesce((
      select sum(line_total) from public.sale_items where sale_id = sid
    ), 0)
    where id = sid;
  return null;
end;
$$;

drop trigger if exists trg_si_total on public.sale_items;
create trigger trg_si_total
after insert or update or delete on public.sale_items
for each row execute procedure public.recalc_sale_total();
