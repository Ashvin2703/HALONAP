create table public.order_push_keys (
 singleton boolean primary key default true check(singleton),
 keys jsonb not null
);
create table public.order_push_devices (
 endpoint text primary key,
 admin_id uuid not null references public.review_admins(user_id) on delete cascade,
 subscription jsonb not null,
 enrolled_at timestamptz not null default now()
);
create table public.order_push_deliveries (
 order_id uuid references public.customer_orders(id) on delete cascade,
 endpoint text references public.order_push_devices(endpoint) on delete cascade,
 claimed_at timestamptz not null default now(),
 sent boolean not null default false,
 primary key(order_id,endpoint)
);
alter table public.order_push_keys enable row level security;
alter table public.order_push_devices enable row level security;
alter table public.order_push_deliveries enable row level security;
revoke all on public.order_push_keys,public.order_push_devices,public.order_push_deliveries from public,anon,authenticated;
grant select,insert,update,delete on public.order_push_keys,public.order_push_devices,public.order_push_deliveries to service_role;
create function public.claim_order_push(p_order uuid,p_endpoint text) returns boolean
language sql security invoker set search_path=public,pg_temp as $$
 with claimed as (
 insert into order_push_deliveries(order_id,endpoint) values(p_order,p_endpoint)
 on conflict(order_id,endpoint) do update set claimed_at=now()
 where not order_push_deliveries.sent and order_push_deliveries.claimed_at < now()-interval '1 minute'
 returning 1) select exists(select from claimed)
$$;
revoke all on function public.claim_order_push(uuid,text) from public,anon,authenticated;
grant execute on function public.claim_order_push(uuid,text) to service_role;
