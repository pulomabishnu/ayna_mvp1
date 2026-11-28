import { getServiceClient } from './_usageLimit.js';
import { handleAppleNotification } from './_proApple.js';
import { AppleJwsError } from './_appleJws.js';

/**
 * App Store Server Notifications V2 for ayna Pro bought in the iPhone app.
 * Set this URL (https://www.aynahealth.co/api/apple-notifications) for both Production and
 * Sandbox in App Store Connect › App Information › App Store Server Notifications.
 * Apple signs every message, so nothing here needs a secret: a message that doesn't verify
 * against Apple's root certificate is refused.
 */
/* global process */
// Same publishable key and host as the Stripe webhook's billing events. Never blocks or fails the notification.
async function sendPosthog({ event, properties }) {
  const key = process.env.POSTHOG_PROJECT_KEY || process.env.VITE_PUBLIC_POSTHOG_KEY;
  const host = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';
  if (!key) return;
  try {
    await fetch(`${host.replace(/\/$/, '')}/capture/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: key, event, timestamp: new Date().toISOString(), properties }) });
  } catch { /* analytics never blocks */ }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ error: 'invalid_request' }); }
  if (typeof body.signedPayload !== 'string') return res.status(400).json({ error: 'invalid_request' });
  const admin = getServiceClient();
  if (!admin) return res.status(503).json({ error: 'unavailable' });
  try {
    const { analytics, ...out } = await handleAppleNotification(admin, body.signedPayload);
    if (analytics) await sendPosthog(analytics);
    return res.status(200).json({ ok: true, ...out });
  } catch (e) {
    if (e instanceof AppleJwsError) {
      // Signed by Apple but not one of ours (another product, an Xcode receipt): nothing to do.
      if (['bundle', 'product', 'environment', 'fields'].includes(e.reason)) return res.status(200).json({ ok: true, handled: false, reason: e.reason });
      return res.status(400).json({ error: 'invalid_signature' });
    }
    // 5xx: Apple retries later.
    return res.status(500).json({ error: 'temporarily_unavailable' });
  }
}
