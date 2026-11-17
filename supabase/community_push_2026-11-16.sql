-- Nov 16: community activity as phone notifications (api/_communityPush.js). Adds one nullable column so each
-- notification is pushed at most once. Idempotent; drops nothing. Rows older than this stay unpushed but are
-- outside the 2-hour window the sweep reads, so nothing old is sent.
alter table public.community_notifications add column if not exists pushed_at timestamptz;
create index if not exists community_notifications_unpushed_idx on public.community_notifications (created_at) where pushed_at is null;
