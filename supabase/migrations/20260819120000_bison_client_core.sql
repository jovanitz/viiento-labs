-- Bison client core: templates, clients, timeline entries (vertical:bison).
--
-- The dynamic-form model decided with the owner (2026-08-19): the capture
-- schema is a DOCUMENT (`blocks jsonb`), never EAV rows or per-template
-- tables — the query pattern is "this client's timeline by date", not
-- cross-field search (a GIN index can arrive later if that ever changes).
-- A filled entry stores a DENORMALIZED copy of every captured field
-- (`fields jsonb`: [{blockId, label, value}]) plus the template's identity,
-- so entries are self-contained and immune to later template edits.
--
-- File values are references, never content: a `file` field's value holds an
-- encoded FileRef {name, mime, size, storagePath} pointing into Supabase
-- Storage — bytes never land in these tables.
--
-- Tables are prefixed `bison_`: the vertical axis (ADR-0019) made explicit in
-- the one shared migrations dir. RLS is enabled with NO policies (deny-all
-- for anon/authenticated); the API's service connection bypasses it and the
-- application layer enforces authorization — same posture as access/billing.

-- templates -------------------------------------------------------------------
create table public.bison_templates (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  description text not null default '',
  icon text not null,
  color text not null,
  kind text not null check (kind in ('default', 'custom')),
  blocks jsonb not null default '[]'::jsonb
    check (jsonb_typeof(blocks) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Gallery order: defaults first, then customs by name.
create index bison_templates_account_idx
  on public.bison_templates (account_id, kind, name);

-- clients ---------------------------------------------------------------------
create table public.bison_clients (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  phone text not null default '',
  photo_url text,
  channels jsonb not null default
    '{"telegram": "not_connected", "whatsapp": "not_connected"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bison_clients_account_idx
  on public.bison_clients (account_id, name);

-- timeline entries --------------------------------------------------------------
-- template_id is a SOFT reference on purpose: the entry carries its own copy
-- of everything it needs (fields + template identity), and deleting a
-- template someday must never take a client's clinical/legal record with it.
create table public.bison_timeline_entries (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  client_id uuid not null references public.bison_clients (id) on delete cascade,
  template_id uuid not null,
  template_name text not null,
  icon text not null,
  color text not null,
  at timestamptz not null,
  summary text not null default '',
  fields jsonb not null default '[]'::jsonb
    check (jsonb_typeof(fields) = 'array'),
  created_at timestamptz not null default now()
);

-- The timeline read: one client, newest first.
create index bison_timeline_entries_client_idx
  on public.bison_timeline_entries (client_id, at desc);

-- RLS: fail closed (no policies). Service connection only.
alter table public.bison_templates enable row level security;
alter table public.bison_clients enable row level security;
alter table public.bison_timeline_entries enable row level security;

-- storage ---------------------------------------------------------------------
-- Private bucket for captured files (images, documents, signatures). No
-- storage policies: reads/writes go through the API's service key, which
-- hands short-lived signed URLs to clients (FileStorage port).
insert into storage.buckets (id, name, public)
values ('bison-files', 'bison-files', false)
on conflict (id) do nothing;
