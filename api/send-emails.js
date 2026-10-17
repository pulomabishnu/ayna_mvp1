/* global process */
/**
 * /api/send-emails: notification emails, run by Vercel cron (vercel.json).
 *
 *   ?mode=instant  hourly: community updates for people who chose "As it happens",
 *                  and new ayna announcements for everyone with announcements on.
 *   ?mode=weekly   Sundays: one roundup of unread community updates for people on
 *                  "Weekly roundup" (the default).
 *   &dry=1         counts only, nothing sent or written.
 *
 * Same CRON_SECRET Bearer auth as /api/fda-recall's sweep. Each person's
 * choices come from public.email_preferences (defaults when they have no row:
 * src/utils/emailPrefs.js). Every send is claimed first in public.email_sends,
 * so an update is never emailed twice, and a failed send is released to retry.
 * EMAILS_PAUSED=1 in Vercel turns every run into a dry run (kill switch).
 */
import { createClient } from '@supabase/supabase-js';
import { normalizeEmailPrefs } from '../src/utils/emailPrefs.js';
import { communityEmail, announcementEmail, sendBatch } from './_email.js';

const MAX_EMAILS_PER_RUN = 500;
const HOUR = 3600 * 1000;

let _admin = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

async function listUsers(admin) {
  const out = new Map();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const users = data?.users || [];
    for (const u of users) if (u.email && u.email_confirmed_at) out.set(u.id, u.email);
    if (users.length < 1000) break;
  }
  return out;
}

async function prefsFor(admin, ids) {
  const map = new Map();
  const list = [...ids];
  for (let i = 0; i < list.length; i += 500) {
    const { data, error } = await admin.from('email_preferences').select('user_id, prefs, unsubscribed_all').in('user_id', list.slice(i, i + 500));
    if (error) throw error;
    for (const r of data || []) map.set(r.user_id, { prefs: normalizeEmailPrefs(r.prefs), off: Boolean(r.unsubscribed_all) });
  }
  return (id) => map.get(id) || { prefs: normalizeEmailPrefs(null), off: false };
}

async function namesFor(admin, ids) {
  const names = new Map();
  if (!ids.size) return names;
  const { data } = await admin.from('community_profiles').select('user_id, display_name, username').in('user_id', [...ids]);
  for (const p of data || []) names.set(p.user_id, p.display_name || (p.username ? `@${p.username}` : 'Someone'));
  return names;
}

/** Claims (user, kind, ref) rows; returns the refs this run now owns. */
async function claim(admin, rows) {
  if (!rows.length) return new Set();
  const { data, error } = await admin.from('email_sends').upsert(rows, { onConflict: 'user_id,kind,ref', ignoreDuplicates: true }).select('user_id, kind, ref');
  if (error) throw error;
  return new Set((data || []).map((r) => `${r.user_id}|${r.kind}|${r.ref}`));
}

async function release(admin, rows) {
  for (const r of rows) await admin.from('email_sends').delete().eq('user_id', r.user_id).eq('kind', r.kind).eq('ref', r.ref);
}

export async function runEmailJob(admin, { mode, dry, now = Date.now(), send = sendBatch } = {}) {
  const summary = { mode, dry, community: 0, announcements: 0, sent: 0, failed: 0, skipped: 0 };
  const emails = await listUsers(admin);
  const jobs = []; // { email, claims: [{user_id, kind, ref}] }

  // Community updates: unread, not from yourself, at least 10 minutes old (time to see them in the app first).
  const since = new Date(now - (mode === 'weekly' ? 7 * 24 * HOUR : 3 * HOUR)).toISOString();
  const until = new Date(now - 10 * 60 * 1000).toISOString();
  const { data: notes, error: nErr } = await admin.from('community_notifications')
    .select('id, recipient_id, actor_id, type, created_at, read_at')
    .gte('created_at', since).lte('created_at', until).is('read_at', null)
    .order('created_at', { ascending: false }).limit(5000);
  if (nErr) throw nErr;
  const byUser = new Map();
  for (const n of notes || []) {
    if (!n.recipient_id || n.recipient_id === n.actor_id) continue;
    if (!byUser.has(n.recipient_id)) byUser.set(n.recipient_id, []);
    byUser.get(n.recipient_id).push(n);
  }

  // Announcements go out once, within about 15 minutes of posting (5-minute room for a quick edit; the job runs every 10 minutes).
  let anns = [];
  if (mode === 'instant') {
    const { data, error } = await admin.from('community_announcements').select('id, title, body, created_at')
      .gte('created_at', new Date(now - 48 * HOUR).toISOString()).lte('created_at', new Date(now - 5 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true }).limit(5);
    if (error && !/does not exist|schema cache/i.test(error.message || '')) throw error;
    anns = data || [];
  }

  const pref = await prefsFor(admin, new Set([...byUser.keys(), ...(anns.length ? emails.keys() : [])]));
  const actorIds = new Set((notes || []).map((n) => n.actor_id).filter(Boolean));
  const names = await namesFor(admin, actorIds);

  for (const [userId, list] of byUser) {
    const to = emails.get(userId);
    const p = pref(userId);
    const wants = to && !p.off && p.prefs.community && (mode === 'weekly' ? p.prefs.communityFreq === 'weekly' : p.prefs.communityFreq === 'instant');
    if (!wants) { summary.skipped += 1; continue; }
    jobs.push({ kind: 'community', userId, to, list, claims: list.map((n) => ({ user_id: userId, kind: 'community', ref: String(n.id) })) });
  }
  for (const ann of anns) {
    for (const [userId, to] of emails) {
      const p = pref(userId);
      if (p.off || !p.prefs.announcements) { summary.skipped += 1; continue; }
      jobs.push({ kind: 'announcement', userId, to, ann, claims: [{ user_id: userId, kind: 'announcement', ref: String(ann.id) }] });
    }
  }

  const batch = jobs.slice(0, MAX_EMAILS_PER_RUN);
  if (dry) {
    summary.community = batch.filter((j) => j.kind === 'community').length;
    summary.announcements = batch.filter((j) => j.kind === 'announcement').length;
    return summary;
  }

  const owned = await claim(admin, batch.flatMap((j) => j.claims));
  const ready = [];
  for (const j of batch) {
    const mine = j.claims.filter((c) => owned.has(`${c.user_id}|${c.kind}|${c.ref}`));
    if (!mine.length) continue;
    if (j.kind === 'community') {
      const fresh = j.list.filter((n) => owned.has(`${j.userId}|community|${n.id}`));
      ready.push({ j, mine, email: communityEmail({ to: j.to, userId: j.userId, notes: fresh, names, weekly: mode === 'weekly' }) });
      summary.community += 1;
    } else {
      ready.push({ j, mine, email: announcementEmail({ to: j.to, userId: j.userId, ann: j.ann }) });
      summary.announcements += 1;
    }
  }
  if (!ready.length) return summary;
  // 100 per Resend batch; a failed batch releases its claims so the next run retries it.
  for (let i = 0; i < ready.length; i += 100) {
    const chunk = ready.slice(i, i + 100);
    const r = await send(chunk.map((x) => x.email));
    summary.sent += r.sent;
    summary.failed += r.failed;
    if (r.failed) await release(admin, chunk.flatMap((x) => x.mine));
  }
  return summary;
}

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || (req.headers.authorization || '') !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const mode = req.query?.mode === 'weekly' ? 'weekly' : 'instant';
  const dry = req.query?.dry === '1' || process.env.EMAILS_PAUSED === '1';
  if (!dry && !process.env.RESEND_API_KEY) return res.status(503).json({ error: 'RESEND_API_KEY not configured' });
  const admin = getAdmin();
  if (!admin) return res.status(503).json({ error: 'not_configured' });
  try {
    const summary = await runEmailJob(admin, { mode, dry });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, ...summary });
  } catch (e) {
    console.error('[send-emails] failed:', e?.message);
    return res.status(500).json({ error: 'send_failed', message: e?.message });
  }
}
