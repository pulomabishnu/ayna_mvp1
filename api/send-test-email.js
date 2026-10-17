/* global process */
/**
 * POST /api/send-test-email: sends the signed-in founder a sample of each
 * notification email (community roundup + an announcement) to her own
 * address, so the team can check sending works and how the emails look.
 * Only the three ayna team accounts (src/utils/aynaTeam.js), with a
 * confirmed email, can use it, and it only ever emails the caller.
 */
import { verifyUser } from './_usageLimit.js';
import { teamMemberForEmail } from '../src/utils/aynaTeam.js';
import { communityEmail, announcementEmail, sendBatch } from './_email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const { user, error } = await verifyUser(req);
  if (!user) return res.status(401).json({ error: error || 'auth_required' });
  if (!user.email_confirmed_at || !teamMemberForEmail(user.email)) return res.status(403).json({ error: 'team_only' });
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'RESEND_API_KEY not configured' });
  const names = new Map([['a', 'Eliz'], ['b', 'Puloma'], ['c', 'A member']]);
  const sample = [
    communityEmail({ to: user.email, userId: user.id, weekly: true, names, notes: [{ actor_id: 'a', type: 'follow' }, { actor_id: 'b', type: 'comment' }, { actor_id: 'c', type: 'helpful' }] }),
    announcementEmail({ to: user.email, userId: user.id, ann: { title: 'Test: an ayna announcement', body: 'This is a **test** of announcement emails.\n- Bold, __underline__ and lists come through\n- The links at the bottom unsubscribe you for real' } }),
  ].map((e) => ({ ...e, subject: `[Test] ${e.subject}` }));
  try {
    const r = await sendBatch(sample);
    if (r.failed) return res.status(502).json({ error: 'send_failed' });
    return res.status(200).json({ ok: true, sent: r.sent, to: user.email });
  } catch (e) {
    console.error('[send-test-email] failed:', e?.message);
    return res.status(500).json({ error: 'send_failed' });
  }
}
