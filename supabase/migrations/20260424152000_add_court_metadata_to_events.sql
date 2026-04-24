begin;

alter table public.events
  add column if not exists court_id uuid references public.courts(id) on delete set null,
  add column if not exists court_address text;

-- Backfill address from current location when legacy rows have no dedicated address.
update public.events
set court_address = location
where court_address is null;

create index if not exists idx_events_court_id on public.events(court_id);

commit;
