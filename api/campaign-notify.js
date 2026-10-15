/* global process */
/**
 * Hourly cron: emails "your free product is unlocked" to people who just
 * finished every step (or who were waiting for stock and now have some).
 * Each person gets it at most once (reward_notifications primary key).
 *
 * Safety gates, same idea as api/fda-recall.js:
 *   1. CRON_SECRET must be set and sent as the Bearer token.
 *   2. CAMPAIGN_EMAILS_ENABLED must be "1" (and RESEND_API_KEY set), otherwise
 *      this is a dry run: it reports who WOULD be emailed and writes nothing.
 */
import { getServiceClient, rpc, setPrivateHeaders } from './_campaign.js';
import { emailsEnabled, sendCampaignEmail, unlockedEmail } from './_campaignEmail.js';
import { CAMPAIGN_ID } from '../src/utils/freeProductCampaign.js';

export default async function handler(req, res) {
  setPrivateHeaders(res);
  const secret = process.env.CRON_SECRET;
  if (!secret || (req.headers.authorization || '') !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const admin = getServiceClient();
  if (!admin) return res.status(503).json({ error: 'unavailable' });

  try {
    const people = (await rpc(admin, 'campaign_unlocked_to_notify', { p_campaign: CAMPAIGN_ID, p_limit: 200 })) || [];
    if (!emailsEnabled()) return res.status(200).json({ dryRun: true, wouldEmail: people.length });

    let sent = 0;
    let failed = 0;
    for (const person of people) {
      const first = await rpc(admin, 'campaign_mark_notified', { p_campaign: CAMPAIGN_ID, p_user: person.user_id, p_kind: 'unlocked' });
      if (!first) continue;
      const result = await sendCampaignEmail(person.email, unlockedEmail());
      if (result.ok) sent += 1;
      else {
        failed += 1;
        await rpc(admin, 'campaign_unmark_notified', { p_campaign: CAMPAIGN_ID, p_user: person.user_id, p_kind: 'unlocked' });
      }
    }
    return res.status(200).json({ dryRun: false, sent, failed });
  } catch (e) {
    console.error('[campaign-notify]', e?.message, e?.cause?.message || '');
    return res.status(500).json({ error: 'server_error' });
  }
}
