begin;

alter table public.events
  add column if not exists total_slots integer not null default 4,
  add column if not exists booked_slots integer not null default 0;

-- Backfill total slots from legacy per-skill rows.
with req_totals as (
  select event_id, greatest(1, max(slots_needed)) as total_slots
  from public.event_skill_requirements
  group by event_id
)
update public.events e
set total_slots = r.total_slots
from req_totals r
where e.id = r.event_id;

-- Backfill booked slots from active bookings to keep source-of-truth consistent.
with booking_totals as (
  select event_id, count(*)::integer as booked_slots
  from public.bookings
  where status = 'booked'
  group by event_id
)
update public.events e
set booked_slots = b.booked_slots
from booking_totals b
where e.id = b.event_id;

update public.events
set booked_slots = greatest(0, least(booked_slots, total_slots));

-- Keep active/closed state aligned with global slots.
update public.events
set status = 'closed'
where status = 'active' and booked_slots >= total_slots;

update public.events
set status = 'active'
where status = 'closed' and booked_slots < total_slots;

alter table public.events
  drop constraint if exists events_total_slots_positive,
  drop constraint if exists events_booked_slots_non_negative,
  drop constraint if exists events_booked_slots_lte_total_slots;

alter table public.events
  add constraint events_total_slots_positive check (total_slots > 0),
  add constraint events_booked_slots_non_negative check (booked_slots >= 0),
  add constraint events_booked_slots_lte_total_slots check (booked_slots <= total_slots);

-- Skill table now acts as tags only.
alter table public.event_skill_requirements
  drop column if exists slots_needed,
  drop column if exists slots_booked;

alter table public.event_skill_requirements
  drop constraint if exists event_skill_requirements_event_id_skill_level_key;

alter table public.event_skill_requirements
  add constraint event_skill_requirements_event_id_skill_level_key
  unique (event_id, skill_level);

create index if not exists idx_event_skill_requirements_event_id
  on public.event_skill_requirements(event_id);

-- Keep RPC signatures for app compatibility; slot accounting is global per event.
create or replace function public.increment_slots_booked(p_event_id uuid, p_skill_level text)
returns void
language plpgsql
security definer
as $$
begin
  update public.events
  set booked_slots = booked_slots + 1,
      status = case
        when booked_slots + 1 >= total_slots then 'closed'
        else status
      end
  where id = p_event_id
    and booked_slots < total_slots;
end;
$$;

create or replace function public.decrement_slots_booked(p_event_id uuid, p_skill_level text)
returns void
language plpgsql
security definer
as $$
begin
  update public.events
  set booked_slots = greatest(0, booked_slots - 1),
      status = case
        when status = 'closed' and greatest(0, booked_slots - 1) < total_slots then 'active'
        else status
      end
  where id = p_event_id;
end;
$$;

commit;
