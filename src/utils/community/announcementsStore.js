/**
 * Announcements from the ayna team, plus verified team badges.
 * Schema: supabase/migrations/20261013120000_community_announcements.sql.
 * Until that migration runs, every read resolves to an empty result
 * (`available: false`) instead of throwing, so the UI shows an empty state.
 * Same convention as communityStore.js: the Supabase client comes first.
 */

export const ANNOUNCEMENT_TITLE_MAX = 120;
export const ANNOUNCEMENT_BODY_MAX = 4000;
export const ANNOUNCEMENT_REPLY_MAX = 1000;
export const ANNOUNCEMENT_ATTACH_MAX = 8;

/** Missing table / function (migration not run yet) or a stub client. */
export function isMissingSchema(error) {
  if (!error) return false;
  const msg = String(error.message || error || '');
  return error.code === '42P01' || error.code === '42883' || error.code === 'PGRST202' || error.code === 'PGRST205'
    || /does not exist|could not find the (table|function)|schema cache/i.test(msg);
}

function rowsOrEmpty({ data, error }) {
  if (error) {
    if (isMissingSchema(error)) return { rows: [], available: false };
    throw error;
  }
  return { rows: Array.isArray(data) ? data : [], available: true };
}

/** Map<user_id, title> for verified team accounts. Never throws. */
export async function listTeamBadges(supabase) {
  try {
    const { data, error } = await supabase.rpc('community_team_badges');
    if (error || !Array.isArray(data)) return new Map();
    return new Map(data.filter((r) => r?.user_id && r?.title).map((r) => [r.user_id, r.title]));
  } catch {
    return new Map();
  }
}

export async function listAnnouncements(supabase, { limit = 20 } = {}) {
  try {
    return rowsOrEmpty(await supabase.from('community_announcements').select('*')
      .order('created_at', { ascending: false }).limit(limit));
  } catch (e) {
    if (isMissingSchema(e)) return { rows: [], available: false };
    throw e;
  }
}

/** { [announcementId]: { count, mine } } */
export async function listAnnouncementReactions(supabase, ids, userId) {
  if (!ids?.length) return {};
  const { rows } = rowsOrEmpty(await supabase.from('community_announcement_reactions')
    .select('announcement_id, user_id').in('announcement_id', ids).limit(5000));
  const out = {};
  for (const r of rows) {
    const k = r.announcement_id;
    out[k] = out[k] || { count: 0, mine: false };
    out[k].count += 1;
    if (userId && r.user_id === userId) out[k].mine = true;
  }
  return out;
}

/** { [announcementId]: replyCount } */
export async function countAnnouncementReplies(supabase, ids) {
  if (!ids?.length) return {};
  const { rows } = rowsOrEmpty(await supabase.from('community_announcement_replies')
    .select('announcement_id').in('announcement_id', ids).limit(5000));
  const out = {};
  for (const r of rows) out[r.announcement_id] = (out[r.announcement_id] || 0) + 1;
  return out;
}

export async function setAnnouncementReaction(supabase, userId, announcementId, on) {
  if (on) {
    const { error } = await supabase.from('community_announcement_reactions').insert({ announcement_id: announcementId, user_id: userId });
    if (error && error.code !== '23505') throw error;
  } else {
    const { error } = await supabase.from('community_announcement_reactions').delete()
      .eq('announcement_id', announcementId).eq('user_id', userId);
    if (error) throw error;
  }
}

export async function listAnnouncementReplies(supabase, announcementId) {
  const { rows } = rowsOrEmpty(await supabase.from('community_announcement_replies').select('*')
    .eq('announcement_id', announcementId).order('created_at', { ascending: true }).limit(300));
  return rows;
}

export async function createAnnouncementReply(supabase, userId, announcementId, body) {
  const { data, error } = await supabase.from('community_announcement_replies')
    .insert({ announcement_id: announcementId, author_id: userId, body: String(body || '').trim().slice(0, ANNOUNCEMENT_REPLY_MAX) })
    .select('id').single();
  if (error) throw error;
  return data;
}

/** Keep only the fields each attachment type needs, and only http(s) links. */
export function cleanAttachments(list) {
  const safeUrl = (u) => { try { const x = new URL(String(u || '').trim()); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };
  return (list || []).map((a) => {
    if (!a?.type) return null;
    const title = String(a.title || '').trim().slice(0, 120);
    if (a.type === 'link') {
      const url = safeUrl(a.url);
      if (!url) return null;
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(a.date || '')) ? a.date : null;
      return { type: 'link', url, title: title || new URL(url).hostname.replace(/^www\./, ''), ...(date ? { date } : {}) };
    }
    if (!['playlist', 'product', 'read'].includes(a.type) || !a.id) return null;
    return { type: a.type, id: String(a.id), title };
  }).filter(Boolean).slice(0, ANNOUNCEMENT_ATTACH_MAX);
}

export async function createAnnouncement(supabase, userId, { title, body = '', media = [], attachments = [] }) {
  const row = {
    author_id: userId,
    title: String(title || '').trim().slice(0, ANNOUNCEMENT_TITLE_MAX),
    body: String(body || '').trim().slice(0, ANNOUNCEMENT_BODY_MAX) || null,
    media: (media || []).filter((m) => m?.path).slice(0, 4).map((m) => ({ path: m.path, width: m.width || null, height: m.height || null })),
    attachments: cleanAttachments(attachments),
  };
  const { data, error } = await supabase.from('community_announcements').insert(row).select('*').single();
  if (error) {
    if (isMissingSchema(error)) throw new Error('Announcements aren’t set up yet. Run the announcements migration first.');
    throw error;
  }
  return data;
}

export async function deleteAnnouncement(supabase, id) {
  const { error } = await supabase.from('community_announcements').delete().eq('id', id);
  if (error) throw error;
}
