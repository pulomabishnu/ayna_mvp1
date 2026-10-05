/**
 * Community data access. Every read of other people's posts/comments/playlists
 * goes through the community_feed_* views (supabase/community.sql), which mask
 * anonymous authors at the database level. Nothing here sends health-profile
 * data anywhere: match percentages are computed in the browser by the caller.
 *
 * All functions take the Supabase client first (same convention as
 * reviewsStore.js / ecosystemStore.js) and throw on error.
 */

export const PAGE_SIZE = 20;

const FRIENDLY_ERRORS = {
  community_rate_limited: "You're posting a lot right now — take a breather and try again in a bit.",
  community_post_unavailable: "This post isn't available anymore.",
  community_too_many_products: 'You can tag up to 3 products.',
  community_playlist_full: 'Playlists can hold up to 50 products.',
  community_blocked: "You can't do that with this person.",
  community_friend_request_not_addressee: 'Only the person you asked can accept.',
  community_username_reserved: 'That username is reserved. Try another.',
  community_username_clinician: "Usernames can't suggest you're a doctor or clinician.",
  community_username_abuse: "That username isn't allowed.",
  community_username_format: 'Use 3–24 letters, numbers, dots or underscores (not at the start or end).',
  community_username_cooldown: 'You can change your username once every 30 days.',
  community_display_name_reserved: "Display names can't suggest you're ayna staff.",
  community_media_full: 'You can add up to 4 photos.',
  community_media_not_found: "That photo didn't finish uploading. Try again.",
  community_guest_unavailable: "Posting without an account isn't available right now. Log in to post.",
};

export function friendlyError(error) {
  const msg = String(error?.message || error || '');
  for (const [code, text] of Object.entries(FRIENDLY_ERRORS)) {
    if (msg.includes(code)) return text;
  }
  if (error?.code === '23505') return 'That already exists.';
  if (error?.code === '23503') return "That product isn't in the ayna catalog.";
  if (/row-level security|permission denied/i.test(msg)) return "You don't have access to do that.";
  return 'Something went wrong. Please try again.';
}

function check({ data, error }) {
  if (error) throw error;
  return data;
}

/** Strip characters that are syntax inside PostgREST filter strings. */
export function sanitizeSearch(q) {
  return String(q || '').replace(/[%_\\,()*:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

// ── Profiles ────────────────────────────────────────────────────────────────

export async function getMyCommunityProfile(supabase, userId) {
  return check(await supabase.from('community_profiles').select('*').eq('user_id', userId).maybeSingle());
}

export async function upsertCommunityProfile(supabase, userId, { username, displayName, bio, avatarUrl, publicInterests }) {
  const row = {
    user_id: userId,
    username: String(username || '').trim().toLowerCase(),
    display_name: String(displayName || '').trim(),
    bio: bio ? String(bio).trim() : null,
    // A storage path (avatars/<uid>/<uuid>.jpg), never a full URL — see community.sql.
    avatar_url: avatarUrl || null,
  };
  if (Array.isArray(publicInterests)) row.public_interests = [...new Set(publicInterests)].slice(0, 8);
  // Insert or update explicitly: an upsert would need UPDATE on user_id, which
  // authenticated deliberately doesn't have.
  const existing = check(await supabase.from('community_profiles').select('user_id').eq('user_id', userId).maybeSingle());
  if (existing) {
    const { user_id: _omit, ...patch } = row;
    return check(await supabase.from('community_profiles').update(patch).eq('user_id', userId).select('*').single());
  }
  return check(await supabase.from('community_profiles').insert(row).select('*').single());
}

export async function setAvatarPath(supabase, userId, path) {
  return check(await supabase.from('community_profiles').update({ avatar_url: path || null }).eq('user_id', userId).select('*').single());
}

export async function isUsernameTaken(supabase, username, exceptUserId) {
  const rows = check(await supabase.from('community_profiles').select('user_id').eq('username', String(username).toLowerCase()).limit(1));
  return (rows || []).some((r) => r.user_id !== exceptUserId);
}

export async function getProfileByUsername(supabase, username) {
  return check(await supabase.from('community_profiles').select('*').eq('username', String(username).toLowerCase()).maybeSingle());
}

export async function getProfilesByIds(supabase, ids) {
  const unique = [...new Set((ids || []).filter(Boolean))];
  if (!unique.length) return new Map();
  const rows = check(await supabase.from('community_profiles').select('user_id, username, display_name, avatar_url').in('user_id', unique));
  return new Map((rows || []).map((r) => [r.user_id, r]));
}

export async function getProfileStats(supabase, userId) {
  const rows = check(await supabase.rpc('community_profile_stats', { target: userId }));
  const row = Array.isArray(rows) ? rows[0] : rows;
  return { followers: row?.followers || 0, following: row?.following || 0, friends: row?.friends || 0 };
}

// ── Posts ───────────────────────────────────────────────────────────────────

/**
 * One keyset page of the feed. `cursor` is the last row of the previous page.
 *   kind: 'question' | 'review' | 'post' | null
 *   authorIds: restrict to these (Following / Friends). Anonymous posts have a
 *              null author_id in the view, so they can never match this filter.
 *   sort: 'recent' | 'helpful'
 */
export async function listFeedPosts(supabase, { kind = null, authorIds = null, productId = null, topic = null, mineOnly = false, savedOnly = false, sort = 'recent', cursor = null, limit = PAGE_SIZE } = {}) {
  if (authorIds && authorIds.length === 0) return [];
  let q = supabase.from('community_feed_posts').select('*');
  if (kind) q = q.eq('kind', kind);
  if (authorIds) q = q.in('author_id', authorIds);
  if (productId) {
    const safeId = String(productId).replace(/[^A-Za-z0-9_-]/g, '');
    q = q.or(`product_id.eq.${safeId},tagged_product_ids.cs.{${safeId}}`);
  }
  if (topic) q = q.contains('topics', [topic]);
  if (mineOnly) q = q.eq('is_mine', true);
  if (savedOnly) q = q.eq('viewer_saved', true);
  if (sort === 'helpful') {
    q = q.order('helpful_count', { ascending: false }).order('created_at', { ascending: false }).order('id', { ascending: false });
    if (cursor) q = q.range(cursor.offset, cursor.offset + limit - 1);
    else q = q.range(0, limit - 1);
    return check(await q) || [];
  }
  q = q.order('created_at', { ascending: false }).order('id', { ascending: false });
  if (cursor?.created_at) {
    q = q.or(`created_at.lt."${cursor.created_at}",and(created_at.eq."${cursor.created_at}",id.lt.${cursor.id})`);
  }
  return check(await q.limit(limit)) || [];
}

export function nextCursor(rows, sort, prevCursor) {
  if (!rows.length) return null;
  if (sort === 'helpful') return { offset: (prevCursor?.offset || 0) + rows.length };
  const last = rows[rows.length - 1];
  return { created_at: last.created_at, id: last.id };
}

export async function getFeedPost(supabase, postId) {
  return check(await supabase.from('community_feed_posts').select('*').eq('id', postId).maybeSingle());
}

export async function createPost(supabase, userId, { kind, body, topics = [], isAnonymous = false, productId = null, rating = null, wouldRecommend = null, photoUrl = null, taggedProductIds = [], media = [] }) {
  const row = {
    author_id: userId,
    kind,
    body: String(body || '').trim(),
    topics: [...new Set(topics)].slice(0, 5),
    is_anonymous: Boolean(isAnonymous),
    photo_url: photoUrl || null,
  };
  if (kind === 'review') {
    row.product_id = productId;
    row.rating = rating;
    row.would_recommend = wouldRecommend;
  }
  const post = check(await supabase.from('community_posts').insert(row).select('id').single());
  const tags = [...new Set(taggedProductIds.filter((id) => id && id !== productId))].slice(0, 3);
  if (tags.length) {
    const { error } = await supabase.from('community_post_products')
      .insert(tags.map((product_id, position) => ({ post_id: post.id, product_id, position })));
    if (error) {
      // Don't leave a half-written post behind.
      await supabase.from('community_posts').delete().eq('id', post.id);
      throw error;
    }
  }
  const photos = (media || []).filter((m) => m?.path).slice(0, 4);
  if (photos.length) {
    const { error } = await supabase.from('community_post_media').insert(photos.map((m, position) => ({
      post_id: post.id, storage_path: m.path, width: m.width || null, height: m.height || null, position,
    })));
    if (error) {
      await supabase.from('community_posts').delete().eq('id', post.id);
      throw error;
    }
  }
  return post;
}

export async function updatePostBody(supabase, postId, body) {
  check(await supabase.from('community_posts').update({ body: String(body).trim() }).eq('id', postId));
}

export async function deletePost(supabase, postId) {
  check(await supabase.from('community_posts').delete().eq('id', postId));
}

// ── Comments ────────────────────────────────────────────────────────────────

export async function listComments(supabase, postId) {
  return check(await supabase.from('community_feed_comments').select('*').eq('post_id', postId)
    .order('created_at', { ascending: true }).limit(500)) || [];
}

export async function createComment(supabase, userId, { postId, parentId = null, body, productId = null, isAnonymous = false }) {
  return check(await supabase.from('community_comments').insert({
    post_id: postId,
    parent_id: parentId,
    author_id: userId,
    body: String(body || '').trim(),
    product_id: productId || null,
    is_anonymous: Boolean(isAnonymous),
  }).select('id').single());
}

export async function deleteComment(supabase, commentId) {
  check(await supabase.from('community_comments').delete().eq('id', commentId));
}

// ── Helpful / save / hide ──────────────────────────────────────────────────

export async function setHelpful(supabase, userId, { postId = null, commentId = null }, on) {
  if (on) {
    const { error } = await supabase.from('community_helpful_votes').insert({ user_id: userId, post_id: postId, comment_id: commentId });
    if (error && error.code !== '23505') throw error;
  } else {
    let q = supabase.from('community_helpful_votes').delete().eq('user_id', userId);
    q = postId ? q.eq('post_id', postId) : q.eq('comment_id', commentId);
    check(await q);
  }
}

export async function setSaved(supabase, userId, postId, on) {
  if (on) {
    const { error } = await supabase.from('community_saved_posts').insert({ user_id: userId, post_id: postId });
    if (error && error.code !== '23505') throw error;
  } else {
    check(await supabase.from('community_saved_posts').delete().eq('user_id', userId).eq('post_id', postId));
  }
}

export async function hidePost(supabase, userId, postId) {
  const { error } = await supabase.from('community_hidden_posts').insert({ user_id: userId, post_id: postId });
  if (error && error.code !== '23505') throw error;
}

// ── Social graph ───────────────────────────────────────────────────────────

export async function listFollowingIds(supabase, userId) {
  const rows = check(await supabase.from('community_follows').select('followee_id').eq('follower_id', userId).limit(1000));
  return (rows || []).map((r) => r.followee_id);
}

export async function listFollowers(supabase, userId, limit = 100) {
  const rows = check(await supabase.from('community_follows').select('follower_id').eq('followee_id', userId)
    .order('created_at', { ascending: false }).limit(limit));
  return (rows || []).map((r) => r.follower_id);
}

export async function setFollowing(supabase, userId, targetId, on) {
  if (on) {
    const { error } = await supabase.from('community_follows').insert({ follower_id: userId, followee_id: targetId });
    if (error && error.code !== '23505') throw error;
  } else {
    check(await supabase.from('community_follows').delete().eq('follower_id', userId).eq('followee_id', targetId));
  }
}

/** All of the viewer's own friendship rows (RLS only returns rows they're in). */
export async function listMyFriendships(supabase) {
  return check(await supabase.from('community_friend_requests').select('*').limit(1000)) || [];
}

export function friendshipState(rows, userId, otherId) {
  const row = (rows || []).find((r) =>
    (r.requester_id === userId && r.addressee_id === otherId) || (r.requester_id === otherId && r.addressee_id === userId));
  if (!row) return { state: 'none', row: null };
  if (row.status === 'accepted') return { state: 'friends', row };
  return { state: row.requester_id === userId ? 'requested' : 'incoming', row };
}

export function friendIdsFrom(rows, userId) {
  return (rows || []).filter((r) => r.status === 'accepted')
    .map((r) => (r.requester_id === userId ? r.addressee_id : r.requester_id));
}

export async function sendFriendRequest(supabase, userId, targetId) {
  return check(await supabase.from('community_friend_requests').insert({ requester_id: userId, addressee_id: targetId }).select('*').single());
}

export async function acceptFriendRequest(supabase, requestId) {
  check(await supabase.from('community_friend_requests').update({ status: 'accepted' }).eq('id', requestId));
}

export async function removeFriendship(supabase, requestId) {
  check(await supabase.from('community_friend_requests').delete().eq('id', requestId));
}

export async function listBlockedIds(supabase, userId) {
  const rows = check(await supabase.from('community_blocks').select('blocked_id').eq('blocker_id', userId));
  return (rows || []).map((r) => r.blocked_id);
}

export async function setBlocked(supabase, userId, targetId, on) {
  if (on) {
    const { error } = await supabase.from('community_blocks').insert({ blocker_id: userId, blocked_id: targetId });
    if (error && error.code !== '23505') throw error;
  } else {
    check(await supabase.from('community_blocks').delete().eq('blocker_id', userId).eq('blocked_id', targetId));
  }
}

// ── Playlists ──────────────────────────────────────────────────────────────

/** section: 'recent' | 'popular' | 'friends' | 'mine' | 'saved' | 'owner' */
export async function listPlaylists(supabase, { section = 'recent', ownerIds = null, limit = 20, offset = 0 } = {}) {
  let q = supabase.from('community_feed_playlists').select('*');
  if (section === 'mine') q = q.eq('is_mine', true);
  else if (section === 'saved') q = q.eq('viewer_saved', true);
  else if (ownerIds) {
    if (!ownerIds.length) return [];
    q = q.in('owner_id', ownerIds).eq('visibility', 'public');
  } else q = q.eq('visibility', 'public').gt('item_count', 0);
  if (section === 'popular') q = q.order('save_count', { ascending: false });
  q = q.order('updated_at', { ascending: false }).range(offset, offset + limit - 1);
  return check(await q) || [];
}

export async function getPlaylist(supabase, playlistId) {
  return check(await supabase.from('community_feed_playlists').select('*').eq('id', playlistId).maybeSingle());
}

export async function listPlaylistItems(supabase, playlistId) {
  return check(await supabase.from('community_playlist_items').select('product_id, note, position, added_at')
    .eq('playlist_id', playlistId).order('position').order('added_at')) || [];
}

export async function createPlaylist(supabase, userId, { title, description = '', visibility = 'public', coverUrl = null }) {
  return check(await supabase.from('community_playlists').insert({
    owner_id: userId,
    title: String(title).trim(),
    description: String(description || '').trim() || null,
    visibility,
    cover_url: coverUrl,
  }).select('*').single());
}

export async function updatePlaylist(supabase, playlistId, patch) {
  const row = {};
  if ('title' in patch) row.title = String(patch.title).trim();
  if ('description' in patch) row.description = String(patch.description || '').trim() || null;
  if ('visibility' in patch) row.visibility = patch.visibility;
  if ('coverUrl' in patch) row.cover_url = patch.coverUrl;
  check(await supabase.from('community_playlists').update(row).eq('id', playlistId));
}

export async function deletePlaylist(supabase, playlistId) {
  check(await supabase.from('community_playlists').delete().eq('id', playlistId));
}

export async function addToPlaylist(supabase, playlistId, productId, note = null) {
  const { error } = await supabase.from('community_playlist_items').insert({
    playlist_id: playlistId, product_id: productId, note: note || null, position: Date.now() % 2147483647,
  });
  if (error && error.code !== '23505') throw error;
}

export async function removeFromPlaylist(supabase, playlistId, productId) {
  check(await supabase.from('community_playlist_items').delete().eq('playlist_id', playlistId).eq('product_id', productId));
}

export async function setPlaylistSaved(supabase, userId, playlistId, on) {
  if (on) {
    const { error } = await supabase.from('community_playlist_saves').insert({ user_id: userId, playlist_id: playlistId });
    if (error && error.code !== '23505') throw error;
  } else {
    check(await supabase.from('community_playlist_saves').delete().eq('user_id', userId).eq('playlist_id', playlistId));
  }
}

// ── Recommendations ────────────────────────────────────────────────────────

export async function sendRecommendations(supabase, userId, productId, recipientIds, note = '') {
  const rows = recipientIds.map((recipient_id) => ({ sender_id: userId, recipient_id, product_id: productId, note: note.trim() || null }));
  check(await supabase.from('community_product_recommendations').insert(rows));
}

export async function getRecommendation(supabase, id) {
  return check(await supabase.from('community_product_recommendations').select('*').eq('id', id).maybeSingle());
}

export async function listReceivedRecommendations(supabase, userId, limit = 30) {
  return check(await supabase.from('community_product_recommendations').select('*').eq('recipient_id', userId)
    .order('created_at', { ascending: false }).limit(limit)) || [];
}

export async function markRecommendationSeen(supabase, id) {
  check(await supabase.from('community_product_recommendations').update({ seen_at: new Date().toISOString() }).eq('id', id).is('seen_at', null));
}

// ── Notifications ──────────────────────────────────────────────────────────

export async function listNotifications(supabase, limit = 40) {
  return check(await supabase.from('community_notifications').select('*').order('created_at', { ascending: false }).limit(limit)) || [];
}

export async function countUnreadNotifications(supabase) {
  const { count, error } = await supabase.from('community_notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
  if (error) throw error;
  return count || 0;
}

export async function markNotificationsRead(supabase) {
  check(await supabase.from('community_notifications').update({ read_at: new Date().toISOString() }).is('read_at', null));
}

// ── Reports ────────────────────────────────────────────────────────────────

export async function fileReport(supabase, userId, { targetType, postId = null, commentId = null, playlistId = null, reportedUserId = null, reason, details = '' }) {
  const { error } = await supabase.from('community_reports').insert({
    reporter_id: userId,
    target_type: targetType,
    post_id: postId,
    comment_id: commentId,
    playlist_id: playlistId,
    reported_user_id: reportedUserId,
    reason,
    details: String(details || '').trim().slice(0, 1000) || null,
  });
  if (error) throw error;
}

// ── Search ─────────────────────────────────────────────────────────────────

export async function searchCommunity(supabase, rawQuery, limit = 8) {
  const q = sanitizeSearch(rawQuery);
  if (q.length < 2) return { people: [], posts: [], playlists: [] };
  const like = `%${q}%`;
  const [people, posts, playlists] = await Promise.all([
    supabase.from('community_profiles').select('user_id, username, display_name, avatar_url, bio')
      .or(`username.ilike.${like},display_name.ilike.${like}`).limit(limit),
    supabase.from('community_feed_posts').select('*').ilike('body', like)
      .order('created_at', { ascending: false }).limit(limit * 2),
    supabase.from('community_feed_playlists').select('*').eq('visibility', 'public').ilike('title', like)
      .order('save_count', { ascending: false }).limit(limit),
  ]);
  return { people: check(people) || [], posts: check(posts) || [], playlists: check(playlists) || [] };
}
