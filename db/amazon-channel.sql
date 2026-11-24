-- HALONAP Admin Studio: Amazon UK channel figures, entered by hand from Seller Central.
-- Safe to re-run.
begin;
create table if not exists public.amazon_inventory (
 colour text primary key check (colour in ('Black','Pink','Grey')),
 fba_stock integer check (fba_stock is null or fba_stock >= 0),
 updated_at timestamptz not null default now()
);
create table if not exists public.amazon_sales (
 month date primary key check (extract(day from month) = 1),
 units integer not null default 0 check (units >= 0),
 revenue_pence integer not null default 0 check (revenue_pence >= 0),
 updated_at timestamptz not null default now()
);
insert into public.amazon_inventory(colour) values ('Black'),('Pink'),('Grey') on conflict do nothing;
alter table public.amazon_inventory enable row level security;
alter table public.amazon_sales enable row level security;
revoke all on public.amazon_inventory, public.amazon_sales from anon, authenticated;
grant select, insert, update on public.amazon_inventory, public.amazon_sales to authenticated;
grant all on public.amazon_inventory, public.amazon_sales to service_role;
drop policy if exists "Admin Amazon stock" on public.amazon_inventory;
create policy "Admin Amazon stock" on public.amazon_inventory for all to authenticated
 using (exists(select 1 from public.review_admins where user_id=(select auth.uid())))
 with check (exists(select 1 from public.review_admins where user_id=(select auth.uid())));
drop policy if exists "Admin Amazon sales" on public.amazon_sales;
create policy "Admin Amazon sales" on public.amazon_sales for all to authenticated
 using (exists(select 1 from public.review_admins where user_id=(select auth.uid())))
 with check (exists(select 1 from public.review_admins where user_id=(select auth.uid())));
commit;
