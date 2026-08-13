insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'appurape-private',
  'appurape-private',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
