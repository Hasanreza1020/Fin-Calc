-- StoreFin schema
-- Run this in Supabase SQL editor (or via supabase CLI) on a fresh project.

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";

-- ---------- Enums ----------
do $$ begin
  create type role_t as enum ('owner','staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type category_kind_t as enum ('console','accessory','game','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_condition_t as enum ('new','used');
exception when duplicate_object then null; end $$;

do $$ begin
  create type track_mode_t as enum ('batch','per_unit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type unit_status_t as enum ('in_stock','sold','reserved','returned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type expense_kind_t as enum ('rent','utility','salary','supply','misc');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method_t as enum ('cash','card','transfer','other');
exception when duplicate_object then null; end $$;

-- ---------- Profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role role_t not null default 'staff',
  created_at timestamptz not null default now()
);

-- ---------- Categories ----------
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  kind category_kind_t not null default 'other',
  created_at timestamptz not null default now()
);

-- ---------- Products ----------
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  sku text unique,
  condition product_condition_t not null default 'new',
  track_mode track_mode_t not null default 'batch',
  default_price numeric(12,2) not null default 0,
  default_cost numeric(12,2) not null default 0,
  current_stock numeric(12,2) not null default 0,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_archived_idx on public.products(archived);

-- ---------- Inventory units (per-unit second-hand) ----------
create table if not exists public.inventory_units (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  serial_no text,
  condition_notes text,
  cost numeric(12,2) not null default 0,
  status unit_status_t not null default 'in_stock',
  purchase_id uuid,
  sale_id uuid,
  acquired_at timestamptz not null default now(),
  sold_at timestamptz
);
create index if not exists units_product_idx on public.inventory_units(product_id);
create index if not exists units_status_idx on public.inventory_units(status);

-- ---------- Purchases (money OUT for inventory) ----------
create table if not exists public.purchases (
  id uuid primary key default uuid_generate_v4(),
  supplier_name text,
  purchase_date date not null default current_date,
  total_amount numeric(12,2) not null default 0,
  payment_method payment_method_t not null default 'cash',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default uuid_generate_v4(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid not null references public.products(id),
  inventory_unit_id uuid references public.inventory_units(id) on delete set null,
  quantity numeric(12,2) not null default 1,
  unit_cost numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0
);
create index if not exists pi_purchase_idx on public.purchase_items(purchase_id);
create index if not exists pi_product_idx on public.purchase_items(product_id);

-- ---------- Sales (money IN) ----------
create table if not exists public.sales (
  id uuid primary key default uuid_generate_v4(),
  customer_name text,
  sale_date timestamptz not null default now(),
  total_amount numeric(12,2) not null default 0,
  payment_method payment_method_t not null default 'cash',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  inventory_unit_id uuid references public.inventory_units(id) on delete set null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  unit_cost_at_sale numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0
);
create index if not exists si_sale_idx on public.sale_items(sale_id);
create index if not exists si_product_idx on public.sale_items(product_id);
create index if not exists si_date_idx on public.sales(sale_date);

-- ---------- Expenses & Other Income ----------
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  category expense_kind_t not null default 'misc',
  amount numeric(12,2) not null default 0,
  date date not null default current_date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists exp_date_idx on public.expenses(date);

create table if not exists public.other_income (
  id uuid primary key default uuid_generate_v4(),
  source text not null,
  amount numeric(12,2) not null default 0,
  date date not null default current_date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists oi_date_idx on public.other_income(date);
