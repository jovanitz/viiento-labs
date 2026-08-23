-- The client photo persists as a STORAGE PATH (clients/<id>/<fileId> in the
-- private bison-files bucket), never a URL — signed URLs are minted per read
-- by the API. Rename the never-populated photo_url column to say so.
alter table public.bison_clients
  rename column photo_url to photo_path;
