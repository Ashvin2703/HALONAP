-- Free standard delivery always starts at two masks: free_delivery_threshold_pence = 2 x price_pence.
-- Enforced in the database so every way of changing the price (Admin Settings, the price API, SQL) keeps it in step.
-- Safe to re-run.
begin;
alter table public.store_settings drop constraint if exists store_settings_free_delivery_threshold_pence_check;
alter table public.store_settings add constraint store_settings_free_delivery_threshold_pence_check
 check (free_delivery_threshold_pence >= 0 and free_delivery_threshold_pence <= 200000);
create or replace function halonap_private.free_delivery_two_masks() returns trigger
 language plpgsql set search_path = '' as $$
begin
 if new.price_pence is not null then new.free_delivery_threshold_pence := new.price_pence * 2; end if;
 return new;
end $$;
drop trigger if exists store_settings_free_delivery_two_masks on public.store_settings;
create trigger store_settings_free_delivery_two_masks before insert or update on public.store_settings
 for each row execute function halonap_private.free_delivery_two_masks();
update public.store_settings set free_delivery_threshold_pence = price_pence * 2 where id and price_pence is not null;
commit;
