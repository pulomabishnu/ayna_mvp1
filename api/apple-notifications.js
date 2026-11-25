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
    const out = await handleAppleNotification(admin, body.signedPayload);
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
