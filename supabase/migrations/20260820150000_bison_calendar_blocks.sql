-- Bison agenda: calendar blocks — blocked time (vertical:bison).
--
-- Extracted from the approved prototype's Block-time model: a block is a
-- concrete date RANGE (one day or a vacation run) or a RECURRING weekly
-- pattern (every day / specific weekdays, 0 = Sunday, no end date). Every
-- scheduling rule treats a block as a wall; deleting a recurring block
-- removes its whole series. An all-day block is stored normalized to the
-- full day span. RLS fail-closed, same posture as the rest of bison.

create table public.bison_calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  label text not null,
  all_day boolean not null default false,
  start_min int not null check (start_min >= 0 and start_min < 1440),
  end_min int not null check (end_min > start_min and end_min <= 1440),
  kind text not null check (kind in ('range', 'recurring')),
  -- range blocks: both set; recurring blocks: both null.
  range_start date,
  range_end date,
  -- recurring blocks: null = daily; else the weekday set (0 = Sunday).
  weekdays int[],
  created_at timestamptz not null default now(),
  constraint bison_calendar_blocks_shape check (
    (kind = 'range' and range_start is not null and range_end is not null
      and weekdays is null)
    or (kind = 'recurring' and range_start is null and range_end is null)
  )
);

create index bison_calendar_blocks_account_idx
  on public.bison_calendar_blocks (account_id);

alter table public.bison_calendar_blocks enable row level security;
