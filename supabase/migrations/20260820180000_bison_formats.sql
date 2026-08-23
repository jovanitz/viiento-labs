-- Bison documents: formats — the printed page's wrapper (ADR-0021).
--
-- Theme, paper, letterhead/footer TOKENS (never typed text, ADR-0020 §4)
-- and toggled marks. The body is never stored: it derives from the
-- template's capture schema. Shipped formats stay product artifacts in the
-- app; this table holds only the business's rows — `shipped_key` marks a
-- copy-on-write override of a shipped starting point (same provenance
-- pattern as roles.template_key). RLS fail-closed like the rest of bison.

create table public.bison_formats (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  theme_id text not null,
  paper text not null check (paper in ('letter', 'a4', 'half-letter')),
  header_tokens jsonb not null default '[]'::jsonb
    check (jsonb_typeof(header_tokens) = 'array'),
  footer_tokens jsonb not null default '[]'::jsonb
    check (jsonb_typeof(footer_tokens) = 'array'),
  marks jsonb not null default '[]'::jsonb
    check (jsonb_typeof(marks) = 'array'),
  shipped_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bison_formats_account_idx
  on public.bison_formats (account_id, created_at);

alter table public.bison_formats enable row level security;
