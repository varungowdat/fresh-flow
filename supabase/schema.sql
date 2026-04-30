create extension if not exists pgcrypto;

-- CUSTOMERS TABLE
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  pin_code text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz not null default now()
);
create unique index if not exists customers_name_idx on public.customers(name);

alter table public.customers enable row level security;

drop policy if exists "Anyone can read customers" on public.customers;
create policy "Anyone can read customers" on public.customers for select to anon, authenticated using (true);

drop policy if exists "Anyone can add customers" on public.customers;
create policy "Anyone can add customers" on public.customers for insert to anon, authenticated with check (true);

drop policy if exists "Anyone can update customers" on public.customers;
create policy "Anyone can update customers" on public.customers for update to anon, authenticated using (true) with check (true);

-- SHOPS TABLE (owner/shopkeeper schema)
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_name text not null,
  phone text,
  shop_name text not null,
  licence_number text,
  fssai_number text,
  location text,
  pin_code text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz not null default now()
);

-- PRODUCTS TABLE (uploaded by owner, visible to customers)
-- shop_id FK connects each product to its owner's shop
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade,
  name text not null,
  category text not null,
  mrp numeric(10, 2) not null check (mrp > 0),
  discount integer not null check (discount between 0 and 90),
  expiry_date date not null,
  quantity integer not null default 1 check (quantity >= 0),
  image_url text,
  is_reserved boolean not null default false,
  fssai_number text,
  created_at timestamptz not null default now()
);

-- RESERVATIONS TABLE (connects customers to owner's products)
-- product_id FK links to the owner's product
-- customer_id FK links to the customer who reserved it
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  expires_at timestamptz not null default (now() + interval '20 minutes'),
  status text not null default 'active' check (status in ('active', 'collected', 'expired', 'released')),
  customer_id uuid references public.customers(id),
  created_at timestamptz not null default now()
);

-- Backfill columns for tables that already existed before this schema version
alter table public.reservations add column if not exists customer_id uuid references public.customers(id);
alter table public.reservations add column if not exists customer_phone text;
alter table public.products add column if not exists fssai_number text;
alter table public.products add column if not exists image_url text;

-- INDEXES for performance
create index if not exists products_shop_id_idx on public.products(shop_id);
create index if not exists products_expiry_date_idx on public.products(expiry_date);
create index if not exists products_category_idx on public.products(category);
create index if not exists reservations_product_id_idx on public.reservations(product_id);
create index if not exists reservations_customer_id_idx on public.reservations(customer_id);
create unique index if not exists shops_owner_shop_idx on public.shops(owner_name, shop_name);
create unique index if not exists one_active_reservation_per_product
  on public.reservations(product_id)
  where status = 'active';

-- =============================================================================
-- ACTIVE_DEALS VIEW
-- This is the core connection between owner and customer schemas:
--   products (owner's inventory) → shops (owner's store info) → reservations
-- Customers query this view to see all available deals from all shops.
-- =============================================================================
drop view if exists public.active_deals;
create or replace view public.active_deals as
select
  p.id,
  p.shop_id,
  s.shop_name as store,
  s.location,
  s.pin_code,
  s.latitude,
  s.longitude,
  p.name,
  p.category,
  p.mrp,
  p.discount,
  round(p.mrp * (1 - p.discount / 100.0), 2) as discounted_price,
  p.expiry_date,
  greatest(p.expiry_date - current_date, 0) as days_left,
  p.quantity,
  p.image_url,
  p.is_reserved,
  p.fssai_number,
  r.expires_at,
  r.customer_name as reserved_by
from public.products p
left join public.shops s on s.id = p.shop_id
left join public.reservations r on r.product_id = p.id and r.status = 'active'
where p.quantity > 0
  and p.expiry_date >= current_date;

-- =============================================================================
-- FUNCTION: Expire old reservations and relist products
-- Called periodically to auto-release expired 20-min reservations.
-- This ensures products cycle back to visible for customers.
-- =============================================================================
create or replace function public.expire_old_reservations()
returns integer
language plpgsql
as $$
declare
  expired_count integer;
begin
  update public.reservations
  set status = 'expired'
  where status = 'active'
    and expires_at <= now();

  get diagnostics expired_count = row_count;

  update public.products p
  set is_reserved = false
  where p.is_reserved = true
    and not exists (
      select 1
      from public.reservations r
      where r.product_id = p.id
        and r.status = 'active'
        and r.expires_at > now()
    );

  return expired_count;
end;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- Open policies for V1 (anon + authenticated can read/write).
-- In production, tighten to: owners can only write their own shop's products,
-- customers can only create reservations for themselves.
-- =============================================================================
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.reservations enable row level security;

-- Shops: anyone can read (customers browse), anyone can create (owner signup)
drop policy if exists "Anyone can read shops" on public.shops;
create policy "Anyone can read shops"
on public.shops for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can add shops" on public.shops;
create policy "Anyone can add shops"
on public.shops for insert
to anon, authenticated
with check (true);

drop policy if exists "Anyone can update shops" on public.shops;
create policy "Anyone can update shops"
on public.shops for update
to anon, authenticated
using (true)
with check (true);

-- Products: anyone can read (customers see deals), anyone can add (owners upload)
drop policy if exists "Anyone can read products" on public.products;
create policy "Anyone can read products"
on public.products for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can add products" on public.products;
create policy "Anyone can add products"
on public.products for insert
to anon, authenticated
with check (true);

drop policy if exists "Anyone can update products" on public.products;
create policy "Anyone can update products"
on public.products for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Anyone can delete products" on public.products;
create policy "Anyone can delete products"
on public.products for delete
to anon, authenticated
using (true);

-- Reservations: anyone can read/add/update (for V1 simplicity)
drop policy if exists "Anyone can add reservations" on public.reservations;
create policy "Anyone can add reservations"
on public.reservations for insert
to anon, authenticated
with check (true);

drop policy if exists "Anyone can read reservations" on public.reservations;
create policy "Anyone can read reservations"
on public.reservations for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can update reservations" on public.reservations;
create policy "Anyone can update reservations"
on public.reservations for update
to anon, authenticated
using (true)
with check (true);

-- NOTE: Views (active_deals) inherit the RLS of the underlying tables.
-- Do NOT create RLS policies on views — they don't support it.
-- Since products + shops have open SELECT policies, the view is readable by all.

-- =============================================================================
-- ENABLE REALTIME
-- This is critical for the owner→customer live connection:
-- When an owner uploads a product, customers see it instantly.
-- Wrapped in exception handler so re-runs don't fail.
-- =============================================================================
do $$
begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then
  null; -- already added
end $$;

do $$
begin
  alter publication supabase_realtime add table public.reservations;
exception when duplicate_object then
  null; -- already added
end $$;

