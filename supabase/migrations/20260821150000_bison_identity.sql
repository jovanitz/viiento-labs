-- The account's own identity — what a document's business.* tokens resolve
-- to (ADR-0020 §4). One row per account, every field born empty: the app
-- never invents a letterhead. logo_path is a storage path (identity/<id>
-- under the account's private prefix), never a URL and never bytes.
create table if not exists public.bison_identity (
  account_id text primary key,
  name text not null default '',
  address text not null default '',
  phone text not null default '',
  license text not null default '',
  logo_path text not null default '',
  updated_at timestamptz not null default now()
);

-- Fail-closed RLS, same stance as every bison table: only the API's
-- service role reads or writes; no policies on purpose.
alter table public.bison_identity enable row level security;
