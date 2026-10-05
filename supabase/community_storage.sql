-- Storage for community photos (review/post photos, avatars, playlist covers).
--
-- SUPABASE ONLY: needs the `storage` schema Supabase provides. Not part of
-- scripts/test-migrations.sh (a bare Postgres has no storage schema). Apply
-- after community.sql. Idempotent.
--
-- Paths:
--   posts/<random uuid>.jpg     — post/review photos. Deliberately NOT under a
--                                 user-id folder: an anonymous post's photo URL
--                                 must not contain the author's id.
--   avatars/<user id>/<uuid>.jpg — profile photos (public profile anyway).
--   covers/<random uuid>.jpg     — playlist covers.
--
-- The client re-encodes every image through a canvas before upload
-- (src/utils/community/imageUpload.js), which strips EXIF — including GPS
-- location — and caps the size.
--
-- storage.objects.owner is set by Supabase to the uploader, so a moderator can
-- still trace an upload; it is not exposed in the public URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-media', 'community-media', true, 3145728, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists community_media_insert on storage.objects;
create policy community_media_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'community-media'
    and (
      (storage.foldername(name))[1] in ('posts', 'covers')
      or ((storage.foldername(name))[1] = 'avatars' and (storage.foldername(name))[2] = auth.uid()::text)
    )
  );

drop policy if exists community_media_delete_own on storage.objects;
create policy community_media_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'community-media' and owner = auth.uid());
