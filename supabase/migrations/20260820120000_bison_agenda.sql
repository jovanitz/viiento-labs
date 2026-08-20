-- Bison agenda: appointments (vertical:bison).
--
-- The day grid's storage, extracted from the approved prototype's
-- semantics: a calendar `date` (never an instant — timezones must not
-- shear a booking across days) + minutes-of-day + duration; status is
-- binary (owner's decision 2026-08-03: on the books or off them);
-- rescheduling MUTATES in place (the Reorder mode commits batches of
-- moves); overlaps are legal here — free/strict/cascade are UI policy.
-- `client_name` is denormalized at booking time so a day renders without
-- joins; `client_id` keeps the link to the record.
--
-- Same posture as the rest of bison: RLS enabled with no policies
-- (fail-closed); the API's service connection enforces tenancy in the
-- application layer.

create table public.bison_appointments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  client_id uuid not null references public.bison_clients (id) on delete cascade,
  client_name text not null,
  service text not null,
  staff_name text not null default '',
  date date not null,
  start_min int not null check (start_min >= 0 and start_min < 1440),
  duration_minutes int not null
    check (duration_minutes > 0 and start_min + duration_minutes <= 1440),
  status text not null check (status in ('confirmed', 'canceled')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The agenda read: one account's day, by start time.
create index bison_appointments_day_idx
  on public.bison_appointments (account_id, date, start_min);

-- The roster's visit facts: confirmed visits grouped per client.
create index bison_appointments_client_idx
  on public.bison_appointments (account_id, client_id, date)
  where status = 'confirmed';

alter table public.bison_appointments enable row level security;
