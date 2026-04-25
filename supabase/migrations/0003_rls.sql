-- StoreFin Row Level Security
-- All authenticated users can read/write transactions; only owner can delete or manage staff.

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.inventory_units enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.expenses enable row level security;
alter table public.other_income enable row level security;

-- Helper: is current user owner?
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'owner'
  );
$$;

-- ---------- profiles ----------
drop policy if exists "profiles select all" on public.profiles;
create policy "profiles select all" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles update self or owner" on public.profiles;
create policy "profiles update self or owner" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_owner())
  with check (id = auth.uid() or public.is_owner());

drop policy if exists "profiles delete owner" on public.profiles;
create policy "profiles delete owner" on public.profiles
  for delete to authenticated using (public.is_owner());

-- ---------- generic helper to add CRUD policies ----------
-- We allow full read/insert/update for any authenticated user;
-- only owner can delete from transactional tables.

-- categories
drop policy if exists "cat select" on public.categories;
create policy "cat select" on public.categories for select to authenticated using (true);
drop policy if exists "cat insert" on public.categories;
create policy "cat insert" on public.categories for insert to authenticated with check (true);
drop policy if exists "cat update" on public.categories;
create policy "cat update" on public.categories for update to authenticated using (true) with check (true);
drop policy if exists "cat delete owner" on public.categories;
create policy "cat delete owner" on public.categories for delete to authenticated using (public.is_owner());

-- products
drop policy if exists "prod select" on public.products;
create policy "prod select" on public.products for select to authenticated using (true);
drop policy if exists "prod insert" on public.products;
create policy "prod insert" on public.products for insert to authenticated with check (true);
drop policy if exists "prod update" on public.products;
create policy "prod update" on public.products for update to authenticated using (true) with check (true);
drop policy if exists "prod delete owner" on public.products;
create policy "prod delete owner" on public.products for delete to authenticated using (public.is_owner());

-- inventory_units
drop policy if exists "iu select" on public.inventory_units;
create policy "iu select" on public.inventory_units for select to authenticated using (true);
drop policy if exists "iu insert" on public.inventory_units;
create policy "iu insert" on public.inventory_units for insert to authenticated with check (true);
drop policy if exists "iu update" on public.inventory_units;
create policy "iu update" on public.inventory_units for update to authenticated using (true) with check (true);
drop policy if exists "iu delete owner" on public.inventory_units;
create policy "iu delete owner" on public.inventory_units for delete to authenticated using (public.is_owner());

-- purchases / purchase_items
drop policy if exists "p select" on public.purchases;
create policy "p select" on public.purchases for select to authenticated using (true);
drop policy if exists "p insert" on public.purchases;
create policy "p insert" on public.purchases for insert to authenticated with check (true);
drop policy if exists "p update" on public.purchases;
create policy "p update" on public.purchases for update to authenticated using (true) with check (true);
drop policy if exists "p delete owner" on public.purchases;
create policy "p delete owner" on public.purchases for delete to authenticated using (public.is_owner());

drop policy if exists "pi select" on public.purchase_items;
create policy "pi select" on public.purchase_items for select to authenticated using (true);
drop policy if exists "pi insert" on public.purchase_items;
create policy "pi insert" on public.purchase_items for insert to authenticated with check (true);
drop policy if exists "pi update" on public.purchase_items;
create policy "pi update" on public.purchase_items for update to authenticated using (true) with check (true);
drop policy if exists "pi delete owner" on public.purchase_items;
create policy "pi delete owner" on public.purchase_items for delete to authenticated using (public.is_owner());

-- sales / sale_items
drop policy if exists "s select" on public.sales;
create policy "s select" on public.sales for select to authenticated using (true);
drop policy if exists "s insert" on public.sales;
create policy "s insert" on public.sales for insert to authenticated with check (true);
drop policy if exists "s update" on public.sales;
create policy "s update" on public.sales for update to authenticated using (true) with check (true);
drop policy if exists "s delete owner" on public.sales;
create policy "s delete owner" on public.sales for delete to authenticated using (public.is_owner());

drop policy if exists "si select" on public.sale_items;
create policy "si select" on public.sale_items for select to authenticated using (true);
drop policy if exists "si insert" on public.sale_items;
create policy "si insert" on public.sale_items for insert to authenticated with check (true);
drop policy if exists "si update" on public.sale_items;
create policy "si update" on public.sale_items for update to authenticated using (true) with check (true);
drop policy if exists "si delete owner" on public.sale_items;
create policy "si delete owner" on public.sale_items for delete to authenticated using (public.is_owner());

-- expenses / other_income
drop policy if exists "exp select" on public.expenses;
create policy "exp select" on public.expenses for select to authenticated using (true);
drop policy if exists "exp insert" on public.expenses;
create policy "exp insert" on public.expenses for insert to authenticated with check (true);
drop policy if exists "exp update" on public.expenses;
create policy "exp update" on public.expenses for update to authenticated using (true) with check (true);
drop policy if exists "exp delete owner" on public.expenses;
create policy "exp delete owner" on public.expenses for delete to authenticated using (public.is_owner());

drop policy if exists "oi select" on public.other_income;
create policy "oi select" on public.other_income for select to authenticated using (true);
drop policy if exists "oi insert" on public.other_income;
create policy "oi insert" on public.other_income for insert to authenticated with check (true);
drop policy if exists "oi update" on public.other_income;
create policy "oi update" on public.other_income for update to authenticated using (true) with check (true);
drop policy if exists "oi delete owner" on public.other_income;
create policy "oi delete owner" on public.other_income for delete to authenticated using (public.is_owner());
