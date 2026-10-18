begin;
alter table public.customer_orders add column if not exists refunded_pence integer not null default 0 check (refunded_pence >= 0);
alter table public.customer_orders add column if not exists refund_status text;
alter table public.customer_orders add column if not exists attribution jsonb not null default '{}'::jsonb;
alter table public.customer_orders add column if not exists inventory_issue text;
revoke update on public.customer_orders from authenticated, anon;
grant update (fulfillment_status,tracking_number,dispatched_at) on public.customer_orders to authenticated;
create table if not exists public.store_settings (
 id boolean primary key default true check(id),
 announcement text not null check(length(announcement)<=200),
 support_email text not null check(length(support_email)<=254 and support_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 updated_at timestamptz not null default now()
);
alter table public.store_settings enable row level security;
revoke all on public.store_settings from anon,authenticated;
grant select on public.store_settings to anon,authenticated;
grant update (announcement,support_email,updated_at) on public.store_settings to authenticated;
grant all on public.store_settings to service_role;
create policy "Public storefront settings" on public.store_settings for select to anon,authenticated using (true);
create policy "Admin settings changes" on public.store_settings for update to authenticated using (exists(select 1 from public.review_admins where user_id=(select auth.uid()))) with check (exists(select 1 from public.review_admins where user_id=(select auth.uid())));
insert into public.store_settings(id,announcement,support_email) values(true,'✦ FREE UK DELIVERY OVER £70 · 30-DAY RETURNS ✦','hello@halonap.com') on conflict do nothing;
create table if not exists public.marketing_campaigns (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 1 and 100),
 source text not null check(source ~ '^[a-zA-Z0-9_-]{1,80}$'),
 medium text not null check(medium ~ '^[a-zA-Z0-9_-]{1,80}$'),
 campaign text not null unique check(campaign ~ '^[a-zA-Z0-9_-]{1,80}$'),
 created_at timestamptz not null default now()
);
alter table public.marketing_campaigns enable row level security;
revoke all on public.marketing_campaigns from anon,authenticated;
grant select,insert,update,delete on public.marketing_campaigns to authenticated;
grant all on public.marketing_campaigns to service_role;
create policy "Admin campaigns" on public.marketing_campaigns for all to authenticated using(exists(select 1 from public.review_admins where user_id=(select auth.uid()))) with check(exists(select 1 from public.review_admins where user_id=(select auth.uid())));
-- Service-only invoker RPC: paid orders must be visible even if stock was changed after checkout opened.
create or replace function public.record_paid_halonap_order(p_order jsonb) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_session text:=p_order->>'stripe_session_id'; v_items jsonb:=p_order->'items'; v_item jsonb; v_colour text; v_qty integer; v_stock integer; v_existing uuid; v_order uuid; v_totals jsonb:='{}'; v_key text; v_issue text:='';
begin
 if v_session is null or length(v_session)<8 or jsonb_typeof(v_items) is distinct from 'array' or jsonb_array_length(v_items)=0 or p_order->>'payment_status' is distinct from 'paid' then raise exception 'Invalid paid order'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_session,0));
 select id into v_existing from customer_orders where stripe_session_id=v_session;
 if v_existing is not null then return jsonb_build_object('created',false,'order_id',v_existing); end if;
 for v_item in select value from jsonb_array_elements(v_items) loop
  v_colour:=v_item->>'colour';
  if v_colour is null or v_colour not in ('Black','Pink','Grey') or coalesce(v_item->>'quantity','') !~ '^[0-9]{1,3}$' then raise exception 'Invalid product'; end if;
  v_qty:=(v_item->>'quantity')::int;
  if v_qty<1 or v_qty>99 then raise exception 'Invalid quantity'; end if;
  v_totals:=jsonb_set(v_totals,array[v_colour],to_jsonb(coalesce((v_totals->>v_colour)::int,0)+v_qty));
 end loop;
 for v_key in select jsonb_object_keys(v_totals) order by 1 loop
  select stock_quantity into v_stock from product_inventory where colour=v_key for update;
  if not found then raise exception 'Missing inventory'; end if;
  if v_stock is not null and v_stock<(v_totals->>v_key)::int then v_issue:=v_issue||v_key||' stock shortfall; '; end if;
 end loop;
 insert into customer_orders(user_id,stripe_session_id,order_number,items,total_pence,currency,payment_status,customer_name,customer_email,customer_phone,shipping_address,attribution,inventory_issue)
 values(nullif(p_order->>'user_id','')::uuid,v_session,p_order->>'order_number',v_items,(p_order->>'total_pence')::int,p_order->>'currency','paid',p_order->>'customer_name',p_order->>'customer_email',p_order->>'customer_phone',p_order->'shipping_address',coalesce(p_order->'attribution','{}'),nullif(v_issue,'')) returning id into v_order;
 for v_key in select jsonb_object_keys(v_totals) order by 1 loop
  update product_inventory set stock_quantity=case when stock_quantity is null then null else greatest(0,stock_quantity-(v_totals->>v_key)::int) end,updated_at=now() where colour=v_key;
 end loop;
 return jsonb_build_object('created',true,'order_id',v_order);
end $$;
revoke all on function public.record_paid_halonap_order(jsonb) from public,anon,authenticated;
grant execute on function public.record_paid_halonap_order(jsonb) to service_role;
commit;
