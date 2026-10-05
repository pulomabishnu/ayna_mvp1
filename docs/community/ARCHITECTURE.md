# ayna Community — architecture blueprint (A–Q)

Status: Phase 1 built on `feature/community` (PR #34). Not on `main`.

**Phase 1 shipped:** guest browsing (no login wall), guest anonymous posting /
commenting / photo uploads / reports via Supabase anonymous sign-in on a
separate client, account nudges instead of walls, "What would you like to
share?" create menu, discussion type, Post as (profile vs Anonymous), up to 4
photos per post (media table), like (discussions) vs helpful (questions,
reviews, answers), Edit Profile with photo crop/compress/remove, public
interests, hardened usernames (reserved, impersonation, abuse, cooldown, live
availability), viewer-scoped helper functions (closed the block/friendship
oracle). Existing: For You/Following, product attachments with viewer match,
comments + replies, saves, follows, friends, playlists, reports, blocks,
notifications. Tested: SQL behaviour suite (guest A/B takeover, anonymous
masking, signed-out reads, usernames, media), 22 raw-HTTP guest checks,
browser journeys, 320–1366 px.

**Still to do:** enable anonymous sign-ins in Supabase; CAPTCHA + stale-guest
purge before public launch; Phase 2+ items below (polls, private profiles,
topics pages, mentions, video, admin dashboard).
Grounded in the code as it stands; where this conflicts with the earlier
"Community requires an account" build, the new requirement wins (guests can
browse and post anonymously).

---

## A. Existing codebase audit

| Area | What's there |
|---|---|
| Framework | React 19 + Vite 7, plain JS/JSX. Hand-rolled routing in `src/App.jsx` (`VIEW_TO_PATH`/`PATH_TO_VIEW`, `pushState`/`popstate`). `/community/*` is sub-routed inside `Community.jsx` (`src/utils/community/route.js`). Capacitor iOS/Android wrappers. |
| Hosting / API | Vercel. ~31 serverless functions in `/api` (no new ones are needed for Community — it talks to Supabase directly under RLS). `/api/products` serves `product_catalog`. |
| Product data | Canonical `public.product_catalog` (Postgres, `id text`) seeded from `supabase/seed/product_catalog.sql`; client catalog in `src/data/products.js` + `/api/products`. Community references `product_catalog(id)` with FKs — a post can't tag a product that doesn't exist. |
| Auth | Supabase Auth (email/password, Google, Apple; implicit flow; `AuthCallback.jsx`). One client from `getSupabaseClient()` (`src/utils/supabaseClient.js`). `App.jsx` owns `user` via `onAuthStateChange`. |
| Health profile | `health_intakes`, `user_health_profiles` (owner-only RLS). Quiz answers drive personalization; never read by Community tables. |
| Recommendation / match % | `getProfileMatchPercentForProduct(product, quizResults, healthProfile)` in `src/data/products.js`; null when no basis, 0 when safety-ineligible. `getProfileInterestSignals()` (added for Community) exposes tags/life-stage for feed ranking — computed in the viewer's browser only. |
| Supabase setup | Idempotent flat SQL in `/supabase`, local harness `scripts/test-migrations.sh` + `_verify.sql` + `_community_behaviour_test.sql`, `expected-schema.json` diffed by `scripts/diff-schema.mjs`. |
| Current RLS (Community) | `supabase/community.sql`: base tables are own-rows-only; other people's posts/comments/playlists are read through security-definer, `security_barrier` views (`community_feed_posts/comments/playlists`) that null every author field on anonymous rows. Counters/notifications via security-definer triggers; column-level UPDATE grants; rate-limit + cap triggers. **Authenticated-only today.** |
| Storage | `supabase/community_storage.sql`: bucket `community-media` (public read, 3 MB, jpeg/webp/png). Uploads re-encoded client-side through canvas (strips EXIF) in `imageUpload.js`. |
| PostHog | `posthog-js`, consent handled in `main.jsx`. Community uses `trackCommunity()` with a property allowlist (no topics, text, product ids, match %). |
| PRISM | Model calls only. Community makes no model calls, so nothing to wire (re-check if moderation ever calls a model). |
| Relevant components | `Community.jsx`, `CommunityFeed`, `CommunityPostCard`, `CommunityComposer`, `ProductPicker`, `PostThread`, `Profile`, `Playlists`, `Social` (profile setup, report, recommend, notifications), `CommunitySearch`, `CommunityProductActions` (product page), `MobileTabBar`. |

## B. Gap analysis

**Already exists (keep):** navigation + bottom tab bar, For You / Following / Q&A / Reviews / Playlists feeds with keyset pagination and viewer-side ranking, questions, reviews tied to catalog products, product tagging with viewer match %, anonymous posting for accounts, comments + one level of replies, helpful votes, saves, hides, follows, friends, friend product recommendations, playlists (public/private), notifications, reports, blocks, search, account export.

**Needs extension:**
- Read access for signed-out visitors (views + profiles + playlist items granted to `anon`).
- Guest identity for anonymous guest posts/comments/reports.
- Usernames: reserved names, impersonation and profanity checks, change cooldown.
- Edit Profile: photo upload/crop/remove, public interests (separate from health data).
- "Post as" selector (replaces the anonymous toggle).
- Discussion as a named type (today's `post` kind, relabelled).
- Multiple images per post (media table).
- Likes: same vote table, labelled **like** on discussions and **helpful** on questions/reviews/answers.
- Helper functions that took arbitrary user ids (`community_is_blocked(a,b)`, `community_are_friends(a,b)`) were callable by any signed-in user — an oracle on other people's blocks/friendships. Replace with viewer-scoped helpers.

**Must be new (later phases):** polls, video, topic pages, @mentions, hashtags table, private profiles + follow requests, mute, notification batching, admin moderation dashboard, verified profiles, product-page "what the community is saying", feature flag.

**Must not be rebuilt:** auth, product catalog, match engine, design system, routing.

## C. Information architecture

```
Bottom bar (phone) / top nav (desktop): Home · Browse · Community · Ecosystem
/community                      For You (default)
/community?tab=following        Following        (account)
/community?tab=questions        Q&A
/community?tab=reviews          Reviews  (sort: helpful / recent)
/community?tab=playlists        Playlists shelves
/community?product=<id>         Feed filtered to one product
/community/post/<id>            Post thread (comments, replies)
/community/u/<username>         Profile (posts · reviews · playlists)
/community/me                   Own profile → Edit profile
/community/playlist/<id>        Playlist
/community/search?q=            Search (posts, people, playlists, products→Browse)
/community/notifications        Notifications (account)
/community/rec/<id>             Friend recommendation
Header: title/back · search · bell (account) · avatar/“log in” · +
+ → “What would you like to share?” discussion · question · review* · playlist* · photo
   (* account)
```

## D. Guest vs account permission matrix

| Action | Guest | Account | Account, anonymous post | Account, public post |
|---|---|---|---|---|
| Browse feeds, posts, comments | ✅ | ✅ | — | — |
| Search | ✅ | ✅ | — | — |
| Post discussion / question | ✅ as Anonymous only | ✅ | shows "Anonymous" | shows name + @username |
| Comment / reply | ✅ as Anonymous only | ✅ | "Anonymous" (+ "OP" in own thread) | name |
| Review a product | 🔒 account | ✅ | allowed, "Anonymous" | allowed |
| Playlist (create) | 🔒 | ✅ public/private | n/a (playlists are tied to a profile) | ✅ |
| Poll | Phase 2 | Phase 2 | Phase 2 | Phase 2 |
| Like / helpful | 🔒 | ✅ (not on own content) | — | — |
| Save | 🔒 | ✅ | — | — |
| Follow | 🔒 | ✅ | can't follow an anonymous author | ✅ |
| Friend | 🔒 | ✅ | can't friend an anonymous author | ✅ |
| Notifications | none | ✅ | actor shown as "Someone" | actor named |
| Match % | 🔒 "see your match" | ✅ viewer's own, computed client-side | same | same |
| Profile | view public | own profile, edit | never linked to the post | linked |
| Media (photos) | ✅ own uploads | ✅ | ✅ | ✅ |
| Video | Phase 3 | Phase 3 | Phase 3 | Phase 3 |
| Share link | ✅ | ✅ | URL is `/post/<id>`, no author | same |
| Report | ✅ | ✅ | — | — |
| Edit/delete own content | ✅ while the guest session lasts on that device | ✅ | ✅ | ✅ |

All rows enforced in Postgres (RLS + triggers), not only in the UI.

## E. User flows

- **Guest posting:** Community → + → discussion/question → write → (optional product, photos) → Post. First write lazily creates a Supabase *anonymous* session on a separate guest client → insert with `is_anonymous = true` (enforced) → thread opens. Card shows "Anonymous · you" only to that device.
- **Account public posting:** + → type → "Post as: [avatar] Name @username" (default) → Post.
- **Account anonymous posting:** same, tap "Anonymous" in Post as. Stored with the real `author_id`; views null it for everyone.
- **Signup:** existing ayna auth → first account-only action opens the profile sheet (display name, username with live availability, optional photo, "skip photo for now").
- **Edit profile:** avatar → Edit profile → photo (crop square, compress, upload / remove), name, username (cooldown), bio, public interests.
- **Question:** + → Ask a question → topics (optional) → Post → answers in thread, marked helpful.
- **Review:** + → Review a product (account) → product picker → stars, would-recommend, text → Post → appears on product's community filter.
- **Playlist:** + → playlist (account) → title, visibility → add products from picker → share.
- **Friend request:** profile → Add friend → recipient notified → accept → friends-only recommendations unlocked.
- **Product discovery:** product card in post → product page (existing modal) → add to ecosystem / browse.
- **Video:** Phase 3.
- **Report:** ⋯ → Report → reason → stored; reporter never learns the anonymous author.

## F. Database architecture (Phase 1 deltas in **bold**)

Existing tables (see `supabase/community.sql`): `community_profiles`, `community_posts` (polymorphic: `kind` question | review | post[=discussion]), `community_post_products`, `community_comments`, `community_helpful_votes` (likes + helpful), `community_saved_posts`, `community_hidden_posts`, `community_follows`, `community_friend_requests`, `community_blocks`, `community_playlists`, `community_playlist_items`, `community_playlist_saves`, `community_product_recommendations`, `community_notifications`, `community_reports`.

Choice: one polymorphic `community_posts` table. Reviews are posts with `product_id/rating/would_recommend` and a check constraint. Playlists are their own entity. Polls (Phase 2) = `community_poll_options` + `community_poll_votes (primary key (poll_id, user_id))` hanging off a `kind = 'poll'` post. Video (Phase 3) = rows in the media table with `kind = 'video'`.

Phase 1 additions:
- **`community_profiles.public_interests text[]`** (topic keys, ≤ 8, user-chosen) and **`username_changed_at timestamptz`**.
- **`community_post_media`** `(id uuid pk, post_id → community_posts on delete cascade, owner_id uuid default auth.uid() → auth.users on delete cascade, kind text check in ('image'), storage_path text check like 'posts/<owner>/%', width int, height int, position smallint, status text check in ('published','pending','removed') default 'published', created_at)`; ≤ 4 per post (trigger); index `(post_id, position)`.
- **`community_reserved_usernames`**-equivalent logic in a trigger function (list + patterns).
- Guest identity uses `auth.users` rows created by Supabase anonymous sign-in (`is_anonymous = true`), so every existing `author_id uuid not null references auth.users on delete cascade` still holds — exactly one ownership mode, no nullable `guest_session_id` column needed.

Deletion: user delete cascades everything they own; products are `on delete restrict` (catalog rows can't vanish from under reviews); soft moderation via `status` (`visible/hidden/removed`), author delete is hard delete.

## G. Anonymous identity architecture

**Decision: Supabase anonymous sign-ins on a separate guest client.**

Options weighed:

| | Supabase anonymous auth | Custom guest token via `/api` |
|---|---|---|
| Ownership | Real `auth.uid()`; every RLS policy, trigger, rate limit and FK works unchanged | Server must sign/verify its own token; every write goes through the service role, RLS can't help |
| Code | ~1 client + policy tweaks | New API routes, own crypto, own rate limiting, duplicated validation |
| Security | JWT carries `is_anonymous: true`; restrictive policies cap what guests can do | Service-role writes = one bug away from writing anyone's rows |
| Upgrade path | Supabase can link an anonymous user to an email/OAuth identity later (Phase 2) | Manual migration |
| Costs | Must be **enabled in Supabase dashboard**; adds `auth.users` rows (purge stale ones with a cron); sign-in endpoint is IP rate-limited by Supabase and should get CAPTCHA (Turnstile) before launch | — |
| Risk to the rest of ayna | If done on the main client, the app would think a guest is "logged in" and start syncing quiz data to them | — |

Mitigation for the last row: the guest session lives on a **second Supabase client with its own `storageKey`** (`ayna-community-guest`) and `detectSessionInUrl: false`, created lazily the first time a guest actually posts. `App.jsx`, AuthGate, sync, and account pages never see it. When a real account is signed in, Community uses the main client; the guest session is left on the device so the guest can still manage those posts if they sign out again, but the posts are never linked to the account.

Guarantees:
- Guest rows: `author_id` = guest uid. Restrictive policies force `is_anonymous = true`, only `kind in ('post','question')`, and block every account-only table (votes, saves, follows, friends, blocks, playlists, recommendations, profiles). Lower rate limits (5 posts/h, 20 comments/h).
- Guest B can't edit/delete Guest A's rows: different `auth.uid()`; own-rows policies.
- Account anonymous rows: real `author_id` stored; base table select is own-rows-only; views return `author_id = null` and null profile fields; `is_mine` is computed per viewer (true only for the author). Notifications from anonymous actions have `actor_id = null`. Blocks never filter anonymous content (otherwise blocking would reveal authorship).
- Nothing identifying in URLs (`/community/post/<post id>`), DOM, or analytics (`is_anonymous` boolean only).
- Moderators read base tables with the service role (server-side only).

## H. Privacy + RLS policy strategy

1. Base tables: own rows only (`author_id = auth.uid()`), column-level UPDATE grants (no counters, no status, no `is_anonymous`, no `author_id`).
2. Public reads only through masking views, now granted to `anon` and `authenticated`. Viewer fields (`is_mine`, `viewer_saved`, …) are false when `auth.uid()` is null.
3. `community_is_guest()` = `coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)`. **Restrictive** policies (`as restrictive`) on account-only tables: `using/with check (not community_is_guest())`. Restrictive policies AND with the existing ones, so they can only narrow access.
4. Viewer-scoped helpers `community_viewer_blocked(other)` / `community_viewer_is_friend(other)` replace two-argument helpers in client-reachable SQL; the two-argument versions stay for definer triggers but lose client EXECUTE.
5. Notifications: no client INSERT; written by definer triggers; never sent to guest users.
6. Private playlists: owner-only in table policy and view. Private profiles: Phase 2 (policy on profile-scoped content keyed on an approved follow, tested by direct requests).
7. Storage: `community-media` write paths `posts/<auth.uid()>/…` (guests allowed) and `avatars/<auth.uid()>/…` (accounts only); MIME + 3 MB enforced by the bucket; delete own folder only. No anon (keyless) uploads.

## I. Feed architecture

- **For You:** recent visible posts (keyset pages of 20) re-ranked client-side by `rankForYou` with configurable `FOR_YOU_WEIGHTS`: topic/tag overlap with the viewer's private profile signals (never shown), viewer match % of tagged products, helpful/comment engagement, recency decay, life-stage suppression (e.g. period content for postmenopausal viewers), author diversity (penalise consecutive same author), safety (0% / safety-ineligible products never boosted). Guests: recency + engagement only.
- **Following:** posts by followed users + friends, non-anonymous only (an anonymous post never appears as "from someone you follow").
- **Questions / Reviews / Playlists:** kind filters; reviews sort helpful/recent; playlists as shelves (yours, made for you, friends, trending, fresh, saved).
- **Videos:** Phase 3 (media rows with `kind = 'video'`).

## J. Product integration

- **Post → product:** `community_post_products` (≤ 3) + review `product_id`, FK to `product_catalog`. Picker searches the real catalog only. Card shows viewer's own match % (guest: "see your match").
- **Product → community:** product modal slot (`CommunityProductActions`): write a review, add to playlist, recommend, "see posts" → `/community?product=<id>`. Phase 2: inline "What the community is saying".
- **Friend → product:** friends-only recommendations with notification; recipient sees their own match.
- **Personalization → product:** match computed in the viewer's browser from their own profile; never stored, never sent to analytics, never visible to others.

## K. Component architecture

```
Community (router, header, guest/account client switch)
├─ useCommunityCore → CommunityContext (supabase client, user, guest, me, match, requireAccount, requireActor, toast, overlays)
├─ CommunityFeed → CommunityPostCard → AuthorLine, CommunityProductPreview, PostMedia, OverflowMenu
├─ CreateMenu ("What would you like to share?") → CommunityComposer → PostAsSelector, ProductPicker, MediaPicker
├─ PostThread → CommunityPostCard + Comment list/composer
├─ Profile → EditProfileSheet (AvatarCropper) / ProfileSetupSheet
├─ Playlists (Cover, PlaylistCard, Shelf, PlaylistPage, AddToPlaylistSheet)
├─ Social (ReportSheet, RecommendSheet, RecommendationPage, NotificationsPage, AccountNudgeSheet)
└─ CommunitySearch
CommunityProductActions (product modal)   MobileTabBar (site-wide)
```

## L. API / data architecture

All in `src/utils/community/communityStore.js` (Supabase JS, RLS-enforced). Reads: `listFeedPosts({kind, cursor, authorIds, productId, topic})`, `getPost`, `listComments`, `getProfileByUsername`, `getProfileStats` (rpc), `listFollowing`, `getFriendState`, `listPlaylists`, `getPlaylist(+items)`, `searchPosts/People/Playlists`, `listNotifications`, `countUnreadNotifications`, `checkUsernameAvailable`. Mutations: `upsertCommunityProfile`, `uploadAvatar/removeAvatar`, `createPost({…, media, productIds})`, `updatePost`, `deletePost`, `createComment`, `deleteComment`, `setHelpful`, `setSaved`, `hidePost`, `follow/unfollow`, `sendFriendRequest/respond/remove`, `block/unblock`, `createPlaylist/addItem/removeItem/savePlaylist`, `recommendProduct`, `markNotificationsRead`, `report`. Guest session: `ensureGuestSession()` in `guestClient.js`.

## M. Media architecture

- **Images (Phase 1):** pick → canvas re-encode to JPEG (max 1600 px, ~0.82 quality; strips EXIF/GPS) → upload to `community-media/posts/<uid>/<uuid>.jpg` → `community_post_media` row with path + dimensions. Up to 4 per post. Avatars: square crop (zoom + drag) → 512 px JPEG → `avatars/<uid>/<uuid>.jpg`; remove = clear `avatar_url` + delete object.
- **Access:** bucket is public-read by unguessable path (needed for share previews); moderation removal sets `status = 'removed'` (view hides it) and deletes the object server-side.
- **Video (Phase 3):** separate private bucket, ≤ 60 s / 50 MB, MIME sniffed, server-side thumbnail + transcode via a queue, status `pending` until processed/reviewed, then published.
- **Moderation statuses:** `published | pending | removed` (media), `visible | hidden | removed` (posts/comments).

## N. Moderation architecture

- **Reports:** reasons (spam, harassment, medical misinformation, dangerous advice, self-harm risk, impersonation, sexual content, other) → `community_reports`; reporter sees only their own; no reported user id needed for content reports.
- **Blocks:** two-way hide of named content, profiles, follows, friend requests, comments; never applied to anonymous content (de-anonymization oracle). Anonymous content → "Hide".
- **Guest abuse:** Supabase IP rate limit on anonymous sign-in, CAPTCHA before public launch, lower per-guest write limits, purge stale anonymous users; moderators can remove content and delete the guest user (cascades).
- **Anonymous abuse:** author id retained internally → account-level enforcement.
- **Health misinformation:** report reason + `hidden` status; community content is labelled as personal experience, never as medical advice; social popularity never boosts safety-ineligible products.
- **Admin dashboard (Phase 4):** server-side only, service role behind an admin check; review queue on `community_reports`, actions set `status`.
- **Video review (Phase 3):** `pending` until reviewed.

## O. Analytics (PostHog, allowlisted props only: kind, source, section, is_anonymous, has_product, has_photo, item_count, result_count, sort, filter)

`community_viewed`, `community_feed_tab_changed`, `community_post_created`, `community_anonymous_post_created`, `community_guest_post_created`, `community_comment_created`, `community_helpful_toggled`, `community_saved`, `community_followed`, `community_friend_requested`, `community_playlist_created`, `community_product_opened`, `community_search`, `community_report_submitted`, `community_profile_edited`, `community_account_nudge_shown`, `community_account_nudge_clicked`. Never: text, topics, product ids, match %, usernames, user ids of authors.

## P. Implementation roadmap

Phase 1 (now): (1) SQL: viewer-scoped helpers, anon read grants, guest restrictive policies, guest rate limits, notification skip for guests, username rules + cooldown, public interests, media table, storage paths — with behaviour tests. (2) Guest client + `ensureGuestSession`. (3) Community shell without the login wall; account nudges instead. (4) Create menu + Post as + discussion label + multi-image. (5) Like vs helpful labels. (6) Edit profile + avatar crop. (7) Direct-request security tests (guest A/B, anonymous author, anon reads). (8) Build, lint, vitest, e2e, responsive check.
Phase 2: polls, private profiles + follow requests, topic pages, @mentions, follow question, product-page community block, mute, guest→account linking.
Phase 3: video, video feed, hashtags, notification batching, people discovery.
Phase 4: admin dashboard, verified profiles, CAPTCHA, feature flag, realtime.

## Q. Risks

- **Security:** guest sign-in spam (needs CAPTCHA + purge job before public launch); anonymous sign-ins must be enabled in the Supabase dashboard or guest posting stays off (UI degrades to "log in to post").
- **Privacy:** any new view/column that joins `author_id` must mask on `is_anonymous` — covered by behaviour tests; topic labels are health data (kept out of analytics); public interests are opt-in only.
- **Performance:** views use correlated subqueries for viewer flags; fine at MVP scale, move to RPC + materialized counters past ~100k posts. Client-side For You ranking works on 20–60 post windows only.
- **Moderation:** no automated image moderation in Phase 1; public bucket means removed images must be deleted, not just hidden.
- **Data integrity:** catalog FK `on delete restrict` — retiring a product needs a soft "discontinued" flag rather than a delete.
- **UX:** guests losing edit rights on another device or after clearing storage (stated in the composer); too many nudges — nudge only on account-only taps, never on scroll.
