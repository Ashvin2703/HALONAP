create table public.order_activity (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.customer_orders(id) on delete cascade,
 created_at timestamptz not null default now(),
 kind text not null, detail text not null check(length(detail) between 1 and 4000)
);
create index on public.order_activity(order_id,created_at);
create table public.order_returns (
 order_id uuid primary key references public.customer_orders(id),
 stage text not null default 'Requested' check(stage in ('Requested','Received','Inspected','Closed')),
 reason text not null check(length(reason) between 1 and 2000), created_at timestamptz not null default now()
);
create table public.support_inbox (
 id uuid primary key default gen_random_uuid(), source_key text not null unique,
 email text not null, subject text not null, body text not null, message_id text,
 created_at timestamptz not null
);
create index on public.support_inbox(email,created_at);
create table public.support_replies (
 id uuid primary key, email text not null, subject text not null, body text not null,
 state text not null default 'pending', created_at timestamptz not null default now()
);
create index on public.support_replies(email,created_at);
do $$
declare tbl text;
begin
 foreach tbl in array array['order_activity','order_returns','support_inbox','support_replies'] loop
  execute format('alter table public.%I enable row level security',tbl);
  execute format('revoke all on public.%I from public, anon, authenticated',tbl);
  execute format('grant select on public.%I to authenticated',tbl);
  execute format('grant all on public.%I to service_role',tbl);
  execute format('create policy admin_read on public.%I for select to authenticated using(exists(select from public.review_admins where user_id=(select auth.uid())))',tbl);
 end loop;
end $$;
grant insert(order_id,kind,detail) on public.order_activity to authenticated;
create policy admin_note on public.order_activity for insert to authenticated with check(kind='Note' and exists(select from public.review_admins where user_id=(select auth.uid())));
grant insert(order_id,reason),update(stage) on public.order_returns to authenticated;
create policy admin_return_create on public.order_returns for insert to authenticated with check(exists(select from public.review_admins where user_id=(select auth.uid())));
create policy admin_return_update on public.order_returns for update to authenticated using(exists(select from public.review_admins where user_id=(select auth.uid()))) with check(exists(select from public.review_admins where user_id=(select auth.uid())));
create schema if not exists halonap_private;
create function halonap_private.record_activity() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='order_returns' then
  if tg_op='INSERT' or old.stage is distinct from new.stage then
   insert into public.order_activity(order_id,kind,detail) values(new.order_id,'Return',new.stage);
  end if;
 else
  if new.fulfillment_status is distinct from old.fulfillment_status then
   insert into public.order_activity(order_id,kind,detail) values(new.id,'Fulfilment',coalesce(new.fulfillment_status,'Pending'));
  end if;
  if new.tracking_number is distinct from old.tracking_number then
   insert into public.order_activity(order_id,kind,detail) values(new.id,'Tracking',coalesce(new.tracking_number,'Removed'));
  end if;
  if new.refunded_pence is distinct from old.refunded_pence or new.refund_status is distinct from old.refund_status then
   insert into public.order_activity(order_id,kind,detail) values(new.id,'Refund',concat(coalesce(new.refund_status,'Updated'),' · ',new.currency,' ',coalesce(new.refunded_pence,0)/100.0));
  end if;
 end if;
 return new;
end $$;
revoke all on function halonap_private.record_activity() from public,anon,authenticated;
create trigger capture_order_changes after update of fulfillment_status,tracking_number,refunded_pence,refund_status on public.customer_orders for each row execute function halonap_private.record_activity();
create trigger capture_return_changes after insert or update on public.order_returns for each row execute function halonap_private.record_activity();
