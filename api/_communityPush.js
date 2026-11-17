/**
 * Community activity as phone notifications (Nov 16, founder: "if someone follows you or interacts with your
 * post you get a notification"). Runs in the 15-minute cron (api/today-reminders.js). Reads community
 * notifications from the last two hours that haven't been pushed, sends one push per row (who did what, never
 * what a post says), and marks each row pushed_at so it is never sent twice. Respects her notification
 * preferences (notifications off, quiet hours: those rows are marked and dropped, not sent late).
 * Schema: supabase/community_push_2026-11-16.sql (adds pushed_at).
 */
import { pushToUser } from './_apns.js';

const TEXT = {
  follow: (w) => `${w} followed you.`,
  friend_request: (w) => `${w} sent you a friend request.`,
  friend_accepted: (w) => `${w} accepted your friend request.`,
  comment: (w) => `${w} replied to your post.`,
  reply: (w) => `${w} replied to you.`,
  helpful: (w) => `${w} found your post helpful.`,
  playlist_saved: (w) => `${w} saved your playlist.`,
  recommendation: (w) => `${w} recommended a product to you.`,
};

/** Pure (tested): the push for one row, or null for a type we don't push. */
export function communityPushFor(row, actor = null) {
  const make = TEXT[row?.type];
  if (!make) return null;
  const who = actor?.display_name || (actor?.username ? `@${actor.username}` : 'Someone');
  return { title: 'ayna community', body: make(who), data: { route: 'community' } };
}

export async function communitySweep(admin, { now = Date.now(), push = pushToUser, prefsFor, inQuiet } = {}) {
  const stats = { found: 0, sent: 0, dropped: 0 };
  const since = new Date(now - 2 * 3600000).toISOString();
  const { data: rows, error } = await admin.from('community_notifications')
    .select('id, recipient_id, actor_id, type, created_at').is('pushed_at', null).gte('created_at', since)
    .order('created_at', { ascending: true }).limit(300);
  if (error) return { ...stats, error: 'not_ready' }; // column not added yet: nothing to do
  if (!rows?.length) return stats;
  stats.found = rows.length;
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))];
  const { data: people } = actorIds.length ? await admin.from('community_profiles').select('user_id, username, display_name').in('user_id', actorIds) : { data: [] };
  const byId = new Map((people || []).map((p) => [p.user_id, p]));
  const prefs = prefsFor ? await prefsFor(admin, [...new Set(rows.map((r) => r.recipient_id))]) : new Map();
  for (const row of rows) {
    const p = prefs.get(row.recipient_id) || {};
    const msg = communityPushFor(row, byId.get(row.actor_id));
    const quiet = inQuiet ? inQuiet(p, now) : false;
    let sent = false;
    if (msg && p.notificationsEnabled !== false && !quiet) {
      try { const r = await push(admin, row.recipient_id, msg); sent = r?.sent > 0; } catch { sent = false; }
    }
    await admin.from('community_notifications').update({ pushed_at: new Date(now).toISOString() }).eq('id', row.id);
    if (sent) stats.sent += 1; else stats.dropped += 1;
  }
  return stats;
}
