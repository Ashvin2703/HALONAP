-- HALONAP live chat: customers talk to the quick-answer bot, then ask for a person.
-- Customers never touch these tables directly; /api/live-chat uses the service role and a
-- per-chat secret. Admins (review_admins) read chats, accept them and reply from Admin Studio.
-- Safe to re-run.
begin;

create table if not exists public.live_chats (
 id uuid primary key default gen_random_uuid(),
 token_hash text not null,
 customer_name text not null check (length(customer_name) between 1 and 120),
 customer_email text check (customer_email is null or length(customer_email) <= 254),
 topic text check (topic is null or length(topic) <= 80),
 status text not null default 'waiting' check (status in ('waiting','active','closed')),
 agent_id uuid,
 agent_name text check (agent_name is null or length(agent_name) <= 80),
 created_at timestamptz not null default now(),
 accepted_at timestamptz,
 closed_at timestamptz,
 closed_by text check (closed_by is null or closed_by in ('customer','agent')),
 last_ring_at timestamptz,
 customer_seen_at timestamptz not null default now(),
 ip_hash text
);
alter table public.live_chats add column if not exists ip_hash text;
create index if not exists live_chats_status_created on public.live_chats (status, created_at);

create table if not exists public.live_chat_messages (
 id bigint generated always as identity primary key,
 chat_id uuid not null references public.live_chats(id) on delete cascade,
 sender text not null check (sender in ('customer','agent','bot','system')),
 body text not null check (length(body) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index if not exists live_chat_messages_chat on public.live_chat_messages (chat_id, id);

alter table public.live_chats enable row level security;
alter table public.live_chat_messages enable row level security;
revoke all on public.live_chats, public.live_chat_messages from anon, authenticated;
grant select on public.live_chats to authenticated;
grant update (status, agent_id, agent_name, accepted_at, closed_at, closed_by) on public.live_chats to authenticated;
grant select, insert on public.live_chat_messages to authenticated;
grant all on public.live_chats, public.live_chat_messages to service_role;

drop policy if exists "Admins read chats" on public.live_chats;
create policy "Admins read chats" on public.live_chats for select to authenticated
 using (exists (select 1 from public.review_admins where user_id = (select auth.uid())));
drop policy if exists "Admins update chats" on public.live_chats;
create policy "Admins update chats" on public.live_chats for update to authenticated
 using (exists (select 1 from public.review_admins where user_id = (select auth.uid())))
 with check (exists (select 1 from public.review_admins where user_id = (select auth.uid())));
drop policy if exists "Admins read chat messages" on public.live_chat_messages;
create policy "Admins read chat messages" on public.live_chat_messages for select to authenticated
 using (exists (select 1 from public.review_admins where user_id = (select auth.uid())));
drop policy if exists "Admins reply in chats" on public.live_chat_messages;
create policy "Admins reply in chats" on public.live_chat_messages for insert to authenticated
 with check (sender = 'agent' and exists (select 1 from public.review_admins where user_id = (select auth.uid())));

commit;
