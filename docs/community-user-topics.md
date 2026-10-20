# Community: user-created topics (deferred)

Status: designed, not built. Community ships with the curated ayna topics
only (`src/utils/community/topics.js`), plus a "Suggest a topic" sheet that
emails and texts the team (`api/suggestions.js`, kind `topic`).

## When to turn this on

Build it once a few curated topics have steady daily posts, for example at
least three topics with a new post most days for two weeks running. Before
that, user topics split a small community into empty rooms. Until then,
suggestions tell us which curated topics to add next.

## What users get

- Create a topic: name (3 to 40 characters), short description (up to 200),
  a cover, and styling.
- Cover: upload a photo (existing `uploadCommunityImage`, folder `covers`) or
  pick a brand colour background: butter `#ffedac`, espresso `#3e2723`,
  sky `#769ebe`, pink `#f7badd`.
- Title font: DM Serif Display 400 or DM Sans 700. Text colour from the same
  four brand colours. A live preview card shows the result while editing.
- Contrast check: a text and background pair must reach 4.5:1 (WCAG AA for
  body text). Pairs that fail are disabled in the picker with a short reason,
  for example butter text on butter or pink. With a photo cover the title sits
  on an espresso or butter scrim so it always passes. Computed with the WCAG
  relative luminance formula; the same function runs on the server trigger.
- Audience:
  - Public: anyone can find, follow and post.
  - Friends only: visible and joinable by the creator's accepted friends
    (`community_friend_requests`, status accepted, which is always mutual).
  - Private: hidden from browse; join only through an invite link the
    creator shares; only members see posts.
- Co-owners: the creator can add collaborators who can edit the topic and
  moderate posts in it. Only the creator can delete the topic or remove
  co-owners.
- Topic page: cover, description, member count, posts, Join or Leave, Share
  invite (private), and for owners Edit and Delete.
- Posting: the composer gets a "Post in" picker (curated and joined topics).
- Curated topics stay the default and are marked as ayna topics. User topics
  show "by @handle".

## Safety (health community)

- Names and descriptions go through `checkCommunityText`
  (`src/utils/communityRules.js`) on the client and the same rules in a
  database trigger. Cover photos use the existing image checks
  (`checkImageFile`, storage path ownership trigger).
- Clinician or ayna impersonation in names is blocked with the username rules
  (`community_username_problem` patterns).
- Report topic (adds `topic` to `community_reports.target_type`); reported
  topics can be set to `hidden` by the team.
- Owners and co-owners can remove posts in their topic (sets the post's
  topic_id to null and hides it from the topic, it stays the author's post).
- Rate limit: 3 new topics per account per day, enforced in a before insert
  trigger (`community_rate_limited`), and no topics from guest sessions.
- Private topics never appear in search, feeds or counts for non-members.

## Schema outline

One idempotent migration, `supabase/community_topics_<date>.sql`:

- `community_topics`: id, slug (unique), name, description, cover_image_url,
  cover_color, title_font (`serif` or `sans`), text_color, visibility
  (`public` | `friends` | `private`), invite_code (unique, private only),
  created_by, created_at, updated_at, status (`visible` | `hidden`).
- `community_topic_members`: topic_id, user_id, role (`owner` | `coowner` |
  `member`), joined_at; primary key (topic_id, user_id).
- `community_posts.topic_id` (nullable, on delete set null) plus an index.
- `community_feed_posts` gains topic_id and hides posts of topics the viewer
  cannot see.
- RLS: public visible topics readable by all; friends topics by the
  creator's friends and members; private topics and their posts only by
  members. Insert by authenticated users with created_by = auth.uid().
  Update by owner and co-owners, delete by owner. Members insert and delete
  their own membership (not for private topics, which join through
  `join_topic_by_code(code)`, a security definer function).
- Same conventions as community.sql: status column, security definer helpers
  with `set search_path = ''`, restrictive no-guest policies.

## App behaviour before the migration runs

The screen probes `community_topics` once. If the table is missing
(PostgREST `PGRST205` or Postgres `42P01`, see `isMissingSchemaError` in
`communityStore.js`), it hides create and join and keeps curated pods
working exactly as today.

## Tests to write with it

- Contrast rule: every brand pair, pass and fail.
- Invite code join flow at the store layer.
- Graceful degradation when the tables do not exist.
