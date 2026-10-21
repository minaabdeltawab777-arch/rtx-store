-- ====================================================================
-- RTX STORE POS — Database Schema, RLS Policies & Backend Functions
-- Compatible with Supabase / PostgreSQL
-- ====================================================================

-- 1. Enable required extensions
create extension if not exists "uuid-ossp";

-- 2. Profiles Table (Extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  role text not null check (role in ('owner', 'admin', 'cashier')) default 'cashier',
  is_active boolean not null default true,
  permissions jsonb not null default '{
    "canDiscount": true,
    "canViewReports": false,
    "canManageProducts": false,
    "canCancelInvoices": false,
    "canPrintLabels": true,
    "canManageUsers": false
  }'::jsonb,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Categories Table
create table if not exists public.categories (
  id text primary key,
  slug text not null,
  name text not null,
  icon text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

-- 4. Products Table
create table if not exists public.products (
  id text primary key,
  name text not null,
  brand text not null,
  model text not null default '',
  category_id text not null references public.categories(id) on delete restrict,
  sku text not null,
  internal_barcode text unique not null,
  manufacturer_barcode text,
  barcode_to_use text not null default 'internal',
  price numeric(12,2) not null check (price >= 0),
  cost_price numeric(12,2),
  image text,
  condition text not null default 'new',
  stock_tracking boolean not null default true,
  stock_quantity integer not null default 0,
  min_stock_alert integer default 2,
  warranty_months integer default 12,
  short_description text,
  notes text,
  is_serialized boolean not null default false,
  serial_numbers jsonb default '[]'::jsonb,
  specs jsonb not null default '{}'::jsonb,
  custom_specs jsonb not null default '[]'::jsonb,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Invoices Table (Financial Record)
create table if not exists public.invoices (
  id text primary key,
  invoice_number text unique not null,
  created_at timestamptz not null default now(),
  subtotal numeric(12,2) not null,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  amount_received numeric(12,2) not null,
  change_to_return numeric(12,2) not null default 0,
  payment_method text not null default 'cash',
  customer_name text,
  customer_phone text,
  cashier_name text,
  cashier_id uuid references auth.users(id) on delete set null,
  notes text,
  status text not null default 'completed' check (status in ('completed', 'cancelled')),
  cancelled_at timestamptz,
  cancelled_by jsonb,
  cancel_reason text,
  format text not null default 'thermal80',
  is_demo boolean default false
);

-- 6. Invoice Items Table
create table if not exists public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id text not null references public.invoices(id) on delete cascade,
  product_id text not null,
  name text not null,
  brand text not null,
  model text not null default '',
  sku text not null,
  barcode text not null,
  serial_number text,
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  discount numeric(12,2) not null default 0,
  line_total numeric(12,2) not null,
  specs_summary text,
  image text
);

-- 7. Stock Adjustments (Audit Trail)
create table if not exists public.stock_adjustments (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  product_name text not null,
  type text not null check (type in ('in', 'out', 'sale', 'cancel_restore', 'audit')),
  quantity_change integer not null,
  new_quantity integer not null,
  reason text,
  timestamp timestamptz not null default now()
);

-- 8. Store Settings
create table if not exists public.store_settings (
  id text primary key default 'primary_store',
  settings jsonb not null,
  updated_at timestamptz not null default now()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.stock_adjustments enable row level security;
alter table public.store_settings enable row level security;

-- Helper function: Get Current User Role
create or replace function public.current_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper function: Is Current User Admin or Owner
create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select role in ('owner', 'admin') from public.profiles where id = auth.uid() and is_active = true),
    false
  );
$$ language sql security definer stable;

-- Helper function: Check if database has any owner/admin users
create or replace function public.is_first_user()
returns boolean as $$
  select not exists (select 1 from public.profiles where role in ('owner', 'admin'));
$$ language sql security definer stable;

-- PROFILES POLICIES
create policy "Authenticated users can view active profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage all profiles"
  on public.profiles for all
  using (public.is_admin() or public.is_first_user());

-- CATEGORIES POLICIES
create policy "Authenticated users can read categories"
  on public.categories for select
  using (auth.role() = 'authenticated');

create policy "Admins can modify categories"
  on public.categories for all
  using (public.is_admin());

-- PRODUCTS POLICIES
create policy "Authenticated users can view products"
  on public.products for select
  using (auth.role() = 'authenticated');

create policy "Admins can insert and update products"
  on public.products for insert
  with check (public.is_admin());

create policy "Admins can update products or cashiers decrement stock on sale"
  on public.products for update
  using (auth.role() = 'authenticated');

create policy "Admins can delete products"
  on public.products for delete
  using (public.is_admin());

-- INVOICES POLICIES
create policy "Authenticated users can view invoices"
  on public.invoices for select
  using (auth.role() = 'authenticated');

create policy "Cashiers and Admins can create invoices"
  on public.invoices for insert
  with check (auth.role() = 'authenticated');

create policy "Only Admins can update/cancel invoices"
  on public.invoices for update
  using (public.is_admin());

-- NEVER ALLOW HARD DELETE ON INVOICES (Financial protection)
create policy "No one can delete invoices"
  on public.invoices for delete
  using (false);

-- INVOICE ITEMS POLICIES
create policy "Authenticated users can view invoice items"
  on public.invoice_items for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert invoice items"
  on public.invoice_items for insert
  with check (auth.role() = 'authenticated');

-- STOCK ADJUSTMENTS POLICIES
create policy "Authenticated users can view and log stock adjustments"
  on public.stock_adjustments for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert stock adjustments"
  on public.stock_adjustments for insert
  with check (auth.role() = 'authenticated');

-- STORE SETTINGS POLICIES
create policy "Authenticated users can view settings"
  on public.store_settings for select
  using (auth.role() = 'authenticated');

create policy "Admins can update settings"
  on public.store_settings for update
  using (public.is_admin());

create policy "Admins can insert settings"
  on public.store_settings for insert
  with check (public.is_admin());
