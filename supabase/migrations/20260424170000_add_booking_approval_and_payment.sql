begin;

alter table public.bookings
  add column if not exists approval_status text not null default 'approved',
  add column if not exists is_paid boolean not null default false,
  add column if not exists paid_at timestamptz;

alter table public.bookings
  drop constraint if exists bookings_approval_status_check;

alter table public.bookings
  add constraint bookings_approval_status_check check (
    approval_status in ('pending', 'approved', 'rejected')
  );

create index if not exists idx_bookings_event_approval
  on public.bookings(event_id, approval_status);

commit;
