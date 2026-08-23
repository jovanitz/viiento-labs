-- Issued documents (ADR-0020 §7): emitting is first-class and append-only.
-- Each issue freezes a self-contained snapshot (blocks, values, format,
-- resolved tokens) so a reprint years later reproduces the page exactly;
-- the rendered bytes live in storage at pdf_path. A mistake is voided
-- (optionally superseded), never edited — folio gaps and voids stay on
-- record, silent renumbering cannot happen.
create table if not exists public.bison_issued_documents (
  id uuid primary key,
  account_id text not null,
  entry_id uuid not null,
  client_id uuid not null,
  folio integer not null check (folio >= 1),
  issued_at timestamptz not null,
  issued_by text not null,
  status text not null check (status in ('issued', 'voided')),
  superseded_by uuid,
  pdf_path text not null default '',
  snapshot jsonb not null,
  unique (account_id, folio)
);

create index if not exists bison_issued_documents_entry_idx
  on public.bison_issued_documents (account_id, entry_id, issued_at desc);

-- The folio sequence, one counter per account. Allocation is a single
-- atomic upsert-returning statement — monotonic under concurrency.
create table if not exists public.bison_folio_counters (
  account_id text primary key,
  next integer not null
);

alter table public.bison_issued_documents enable row level security;
alter table public.bison_folio_counters enable row level security;
