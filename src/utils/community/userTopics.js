/**
 * User-created Community topics: data access (website and app share it).
 *
 * Tables, view and functions: supabase/community_user_topics_2026-10-21.sql.
 * Until that migration runs, probeUserTopics() reports { available: false }
 * and the screens hide create, join and topic pages; curated topics and
 * "Suggest a topic" keep working exactly as before.
 *
 * Reads go through the community_feed_topics view, which never exposes the
 * creator of an anonymous topic. Creating and editing go through
 * /api/community-topics (full rules + rate limit on the server), with the
 * database triggers as the backstop.
 */
import { isMissingSchemaError, friendlyError, PAGE_SIZE } from './communityStore.js';
import { apiUrl } from '../apiUrl.js';
import { fetchWithTimeout } from '../network.js';
import { TOPIC_ERRORS } from './topicRules.js';

export { TOPIC_ERRORS };

export function topicError(error) {
  const msg = String(error?.message || error || '');
  for (const [code, text] of Object.entries(TOPIC_ERRORS)) {
    if (msg.includes(code)) return text;
  }
  return friendlyError(error);
}

const COLUMNS = 'id, slug, name, description, cover_image_url, cover_color, title_font, text_color, visibility, status, creator_anonymous, created_by, creator_username, creator_display_name, is_mine, my_role, member_count, post_count, created_at, updated_at';

function check({ data, error }) {
  if (error) throw error;
  return data;
}

/** One cheap read: is the migration in? { available, error? } */
export async function probeUserTopics(supabase) {
  if (!supabase) return { available: false };
  try {
    const { error } = await supabase.from('community_feed_topics').select('id').limit(1);
    if (!error) return { available: true };
    if (isMissingSchemaError(error)) return { available: false };
    return { available: false, error };
  } catch (error) {
    return { available: false, error };
  }
}

/**
 * section: 'browse' (visible public topics), 'mine' (topics she runs or
 * joined), 'friends' (friends-only topics she can see).
 * Returns { available, rows }.
 */
export async function listUserTopics(supabase, { section = 'browse', limit = 30 } = {}) {
  if (!supabase) return { available: false, rows: [] };
  let q = supabase.from('community_feed_topics').select(COLUMNS);
  if (section === 'mine') q = q.not('my_role', 'is', null);
  else if (section === 'friends') q = q.eq('visibility', 'friends').eq('status', 'visible');
  else q = q.eq('visibility', 'public').eq('status', 'visible');
  q = section === 'browse' ? q.order('member_count', { ascending: false }).order('created_at', { ascending: false }) : q.order('updated_at', { ascending: false });
  const { data, error } = await q.limit(limit);
  if (error) {
    if (isMissingSchemaError(error)) return { available: false, rows: [] };
    throw error;
  }
  return { available: true, rows: data || [] };
}

export async function getUserTopic(supabase, { id = null, slug = null } = {}) {
  if (!id && !slug) return null;
  let q = supabase.from('community_feed_topics').select(COLUMNS);
  q = id ? q.eq('id', id) : q.eq('slug', String(slug).toLowerCase().replace(/[^a-z0-9-]/g, ''));
  const { data, error } = await q.maybeSingle();
  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  return data || null;
}

/** Posts in one topic, newest first (keyset like listFeedPosts). */
export async function listTopicPosts(supabase, topicId, { cursor = null, limit = PAGE_SIZE } = {}) {
  let q = supabase.from('community_feed_posts').select('*').eq('topic_id', topicId)
    .order('created_at', { ascending: false }).order('id', { ascending: false });
  if (cursor?.created_at) q = q.or(`created_at.lt."${cursor.created_at}",and(created_at.eq."${cursor.created_at}",id.lt.${cursor.id})`);
  return check(await q.limit(limit)) || [];
}

async function authHeader(supabase) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('community_guest_unavailable');
  return { Authorization: `Bearer ${token}` };
}

/** Create or edit through the API. Returns the saved topic row. */
async function callTopicApi(supabase, payload) {
  const headers = { 'Content-Type': 'application/json', ...(await authHeader(supabase)) };
  const res = await fetchWithTimeout(apiUrl('/api/community-topics'), { method: 'POST', headers, body: JSON.stringify(payload) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || 'That didn’t save. Try again in a moment.');
    err.status = res.status;
    err.field = data?.field || null;
    throw err;
  }
  return data.topic;
}

export function createUserTopic(supabase, form) {
  return callTopicApi(supabase, { action: 'create', ...form });
}

export function updateUserTopic(supabase, topicId, form) {
  return callTopicApi(supabase, { action: 'update', topicId, ...form });
}

export async function deleteUserTopic(supabase, topicId) {
  const rows = check(await supabase.from('community_topics').delete().eq('id', topicId).select('id'));
  if (!rows?.length) throw new Error('community_not_topic_owner');
}

export async function joinUserTopic(supabase, userId, topicId) {
  const { error } = await supabase.from('community_topic_members').insert({ topic_id: topicId, user_id: userId });
  if (error && error.code !== '23505') throw error;
}

export async function leaveUserTopic(supabase, userId, topicId) {
  check(await supabase.from('community_topic_members').delete().eq('topic_id', topicId).eq('user_id', userId));
}

/** Owner only: members with their roles. */
export async function listTopicMembers(supabase, topicId) {
  return check(await supabase.from('community_topic_members').select('user_id, role, joined_at')
    .eq('topic_id', topicId).order('joined_at').limit(200)) || [];
}

export async function setTopicCoowner(supabase, topicId, userId, on) {
  check(await supabase.from('community_topic_members').update({ role: on ? 'coowner' : 'member' }).eq('topic_id', topicId).eq('user_id', userId));
}

export async function removeTopicMember(supabase, topicId, userId) {
  check(await supabase.from('community_topic_members').delete().eq('topic_id', topicId).eq('user_id', userId));
}

/** Owner or co-owner takes a post out of the topic (it stays the author's post). */
export async function removePostFromTopic(supabase, postId) {
  return check(await supabase.rpc('community_remove_post_from_topic', { pid: postId }));
}

export async function getTopicInviteCode(supabase, topicId, { rotate = false } = {}) {
  const { data, error } = await supabase.rpc('community_topic_invite_code', { tid: topicId, rotate });
  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  return typeof data === 'string' ? data : null;
}

const INVITE_CODE_RE = /^[a-z0-9]{16,40}$/;

export function parseTopicInviteCode(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  let code = raw;
  if (/[/?=]/.test(raw)) {
    try { code = new URL(raw, 'https://www.aynahealth.co').searchParams.get('join-topic') || ''; } catch { return null; }
  }
  code = code.toLowerCase();
  return INVITE_CODE_RE.test(code) ? code : null;
}

export function topicInviteLink(code, origin = 'https://www.aynahealth.co') {
  const clean = parseTopicInviteCode(code);
  return clean ? `${String(origin).replace(/\/+$/, '')}/community?join-topic=${clean}` : null;
}

/** { ok: true, topicId } or { ok: false, reason: 'invalid' | 'unavailable' | 'signin', message }. */
export async function joinTopicByCode(supabase, code) {
  const clean = parseTopicInviteCode(code);
  if (!clean) return { ok: false, reason: 'invalid', message: TOPIC_ERRORS.community_invite_invalid };
  const { data, error } = await supabase.rpc('join_topic_by_code', { code: clean });
  if (error) {
    if (isMissingSchemaError(error)) return { ok: false, reason: 'unavailable', message: 'Community topics aren’t switched on yet.' };
    const msg = String(error.message || '');
    if (msg.includes('community_guest_unavailable')) return { ok: false, reason: 'signin', message: 'Sign in to join this topic.' };
    if (msg.includes('community_invite_invalid')) return { ok: false, reason: 'invalid', message: TOPIC_ERRORS.community_invite_invalid };
    throw error;
  }
  return data ? { ok: true, topicId: data } : { ok: false, reason: 'invalid', message: TOPIC_ERRORS.community_invite_invalid };
}

export async function reportUserTopic(supabase, userId, topicId, reason = 'other', details = '') {
  const { error } = await supabase.from('community_reports').insert({
    reporter_id: userId, target_type: 'topic', topic_id: topicId, reason, details: String(details || '').trim().slice(0, 1000) || null,
  });
  if (error) throw error;
}

/** Who can do what in a topic, from the view row. */
export function topicPermissions(topic, userId) {
  const role = topic?.my_role || null;
  const signedIn = Boolean(userId);
  const owner = role === 'owner' || Boolean(topic?.is_mine);
  const manager = owner || role === 'coowner';
  const member = Boolean(role);
  const live = topic?.status === 'visible';
  return {
    owner,
    manager,
    member,
    canEdit: manager,
    canDelete: owner,
    canChangeAudience: owner,
    canManageCoowners: owner,
    canRemovePosts: manager,
    canShareInvite: manager && topic?.visibility === 'private',
    canJoin: signedIn && !member && live && topic?.visibility !== 'private',
    canLeave: signedIn && member && !owner,
    canPost: signedIn && topic?.status !== 'hidden' && (member || (live && topic?.visibility === 'public')),
    canReport: signedIn && !owner,
  };
}

/** "by @alice", "by a member" (anonymous) or "" (curated topics). */
export function topicByline(topic) {
  if (!topic) return '';
  if (topic.creator_anonymous && !topic.is_mine) return 'Started by a member';
  if (topic.is_mine) return topic.creator_anonymous ? 'Started by you, shown as a member' : 'Started by you';
  return topic.creator_username ? `Started by @${topic.creator_username}` : 'Started by a member';
}

export function memberCountLabel(n) {
  const count = Number(n) || 0;
  return `${count} ${count === 1 ? 'member' : 'members'}`;
}
