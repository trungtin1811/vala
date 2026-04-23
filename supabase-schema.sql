-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (mirrors Supabase Auth users)
create table public.users (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null unique,
    phone text,
    display_name text not null,
    avatar_url text,
    bio text,
    skill_level text check (
        skill_level in (
            'weak_minus',
            'weak_plus',
            'medium_plus',
            'medium_advanced_plus',
            'advanced_minus',
            'advanced_plus',
            'expert_plus'
        )
    ),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Events table
create table public.events (
    id uuid primary key default uuid_generate_v4 (),
    host_id uuid not null references public.users (id) on delete cascade,
    title text not null,
    description text,
    location text not null,
    latitude double precision,
    longitude double precision,
    event_date date not null,
    event_time time not null,
    event_end_time time,
    event_end_date date,
    status text not null default 'active' check (
        status in (
            'active',
            'closed',
            'completed',
            'cancelled'
        )
    ),
    token_cost int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Event skill requirements
create table public.event_skill_requirements (
    id uuid primary key default uuid_generate_v4 (),
    event_id uuid not null references public.events (id) on delete cascade,
    skill_level text not null check (
        skill_level in (
            'weak_minus',
            'weak_plus',
            'medium_plus',
            'medium_advanced_plus',
            'advanced_minus',
            'advanced_plus',
            'expert_plus'
        )
    ),
    slots_needed int not null check (slots_needed > 0),
    slots_booked int not null default 0 check (slots_booked >= 0)
);

-- Bookings
create table public.bookings (
    id uuid primary key default uuid_generate_v4 (),
    event_id uuid not null references public.events (id) on delete cascade,
    member_id uuid not null references public.users (id) on delete cascade,
    skill_level text not null check (
        skill_level in (
            'weak_minus',
            'weak_plus',
            'medium_plus',
            'medium_advanced_plus',
            'advanced_minus',
            'advanced_plus',
            'expert_plus'
        )
    ),
    status text not null default 'booked' check (
        status in (
            'booked',
            'cancelled',
            'completed'
        )
    ),
    booked_at timestamptz not null default now(),
    unique (event_id, member_id)
);

-- Teams (for auto-divide feature)
create table public.teams (
    id uuid primary key default uuid_generate_v4 (),
    event_id uuid not null references public.events (id) on delete cascade,
    team_name text not null,
    members uuid [] not null default '{}',
    created_at timestamptz not null default now()
);

-- RPC: increment slots_booked
create or replace function public.increment_slots_booked(p_event_id uuid, p_skill_level text)
returns void language plpgsql security definer as $$
begin
  update public.event_skill_requirements
  set slots_booked = slots_booked + 1
  where event_id = p_event_id and skill_level = p_skill_level
    and slots_booked < slots_needed;

  -- Auto-close event if all slots are filled
  if not exists (
    select 1 from public.event_skill_requirements
    where event_id = p_event_id and slots_booked < slots_needed
  ) then
    update public.events set status = 'closed' where id = p_event_id;
  end if;
end;
$$;

-- RPC: decrement slots_booked
create or replace function public.decrement_slots_booked(p_event_id uuid, p_skill_level text)
returns void language plpgsql security definer as $$
begin
  update public.event_skill_requirements
  set slots_booked = greatest(0, slots_booked - 1)
  where event_id = p_event_id and skill_level = p_skill_level;

  -- Re-open event if it was closed and now has slots
  update public.events set status = 'active'
  where id = p_event_id and status = 'closed';
end;
$$;

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger users_updated_at before update on public.users for each row execute function update_updated_at();

create trigger events_updated_at before update on public.events for each row execute function update_updated_at();

-- Row Level Security
alter table public.users enable row level security;

alter table public.events enable row level security;

alter table public.event_skill_requirements enable row level security;

alter table public.bookings enable row level security;

alter table public.teams enable row level security;

-- Users: anyone can read, only owner can update
create policy "users_read_all" on public.users for
select using (true);

create policy "users_insert_own" on public.users for insert
with
    check (auth.uid () = id);

create policy "users_update_own" on public.users
for update
    using (auth.uid () = id);

-- Events: anyone can read active events, only host can modify
create policy "events_read_all" on public.events for
select using (true);

create policy "events_insert_auth" on public.events for insert
with
    check (auth.uid () = host_id);

create policy "events_update_host" on public.events
for update
    using (auth.uid () = host_id);

create policy "events_delete_host" on public.events for delete using (auth.uid () = host_id);

-- Skill requirements: anyone reads, host writes
create policy "skill_req_read_all" on public.event_skill_requirements for
select using (true);

create policy "skill_req_insert_host" on public.event_skill_requirements for insert
with
    check (
        auth.uid () = (
            select host_id
            from public.events
            where
                id = event_id
        )
    );

create policy "skill_req_update_host" on public.event_skill_requirements
for update
    using (
        auth.uid () = (
            select host_id
            from public.events
            where
                id = event_id
        )
    );

create policy "skill_req_delete_host" on public.event_skill_requirements for delete using (
    auth.uid () = (
        select host_id
        from public.events
        where
            id = event_id
    )
);

-- Bookings: member and host can read; auth users can insert their own
create policy "bookings_read" on public.bookings for
select using (
        auth.uid () = member_id
        or auth.uid () = (
            select host_id
            from public.events
            where
                id = event_id
        )
    );

create policy "bookings_insert_auth" on public.bookings for insert
with
    check (auth.uid () = member_id);

create policy "bookings_update" on public.bookings
for update
    using (
        auth.uid () = member_id
        or auth.uid () = (
            select host_id
            from public.events
            where
                id = event_id
        )
    );

-- Teams: event participants and host can read, host can write
create policy "teams_read" on public.teams for
select using (
        auth.uid () = (
            select host_id
            from public.events
            where
                id = event_id
        )
    );

create policy "teams_write" on public.teams for all using (
    auth.uid () = (
        select host_id
        from public.events
        where
            id = event_id
    )
);

-- Courts (user-owned venues)
create table public.courts (
    id uuid primary key default uuid_generate_v4 (),
    owner_id uuid not null references public.users (id) on delete cascade,
    name text not null,
    address text,
    latitude double precision,
    longitude double precision,
    created_at timestamptz not null default now()
);

alter table public.courts enable row level security;

create policy "courts_read_own" on public.courts for
select using (auth.uid () = owner_id);

create policy "courts_insert_own" on public.courts for insert
with
    check (auth.uid () = owner_id);

create policy "courts_update_own" on public.courts
for update
    using (auth.uid () = owner_id);

create policy "courts_delete_own" on public.courts for delete using (auth.uid () = owner_id);

-- Migration: update skill_level CHECK to new 15-level system
-- alter table public.users drop constraint if exists users_skill_level_check;
-- alter table public.users add constraint users_skill_level_check check (skill_level in (
--   'yeu','yeu_plus','yeu_minus','tby','tby_plus','tby_minus',
--   'tb','tb_plus','tb_minus','kha','kha_plus','kha_minus','gioi','gioi_plus','gioi_minus'
-- ));
-- alter table public.event_skill_requirements drop constraint if exists event_skill_requirements_skill_level_check;
-- alter table public.event_skill_requirements add constraint event_skill_requirements_skill_level_check check (skill_level in (
--   'yeu','yeu_plus','yeu_minus','tby','tby_plus','tby_minus',
--   'tb','tb_plus','tb_minus','kha','kha_plus','kha_minus','gioi','gioi_plus','gioi_minus'
-- ));

-- Migration: add lat/lng to events (run if table already exists)
-- alter table public.events add column if not exists latitude double precision;
-- alter table public.events add column if not exists longitude double precision;

-- Migration: add pricing fields to events
-- alter table public.events add column if not exists price_min double precision;
-- alter table public.events add column if not exists price_max double precision;
-- alter table public.events add column if not exists split_evenly boolean not null default false;