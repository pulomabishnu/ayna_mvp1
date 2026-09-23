/* global process */
/**
 * POST /api/push-test — sends the signed-in user a test notification on
 * every device registered to their account. Backs the "Send a test
 * notification" button in the app's Channels screen, so anyone can confirm
 * push works end to end without waiting for a real recall.
 */
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from './_usageLimit.js';
import { apnsConfigured, pushToUser } from './_apns.js';
import { getClientIp, rateLimit } from './_rateLimit.js';

let _admin = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { user, error } = await verifyUser(req);
  if (!user) return res.status(401).json({ error: error || 'unauthorized' });

  const admin = getAdmin();
  if (!admin) return res.status(500).json({ error: 'server_misconfigured' });
  if (!apnsConfigured()) return res.status(503).json({ error: 'push_not_configured' });

  const limit = await rateLimit(`push-test:${user.id}:${getClientIp(req)}`, { max: 5, windowSec: 600, failClosed: false });
  if (!limit.ok) return res.status(429).json({ error: 'rate_limited' });

  const result = await pushToUser(admin, user.id, {
    title: 'ayna notifications are on',
    body: "This is a test. You'll get alerts here if a product you track has a safety recall.",
    data: { type: 'test' },
  });
  if (!result.devices) return res.status(404).json({ error: 'no_device_registered' });
  if (!result.sent) return res.status(502).json({ error: 'push_failed', ...result });
  return res.status(200).json({ ok: true, ...result });
}
