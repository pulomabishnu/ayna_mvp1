/**
 * Start / sync / status for OAuth health providers (Oura today).
 *
 *   POST { action: 'start', provider, categories, returnTo: 'web'|'app', returnPath }
 *        -> { url } to open. The categories she picked are stored with a one-time,
 *           10-minute state nonce; consent is only recorded once she comes back
 *           from the provider (api/health-oauth-callback.js).
 *   POST { action: 'sync', provider }  -> pulls recent daily summaries (Oura: saved)
 *   POST { action: 'live', provider }  -> WHOOP: recent daily rows returned, never saved
 *   GET  ?action=status                -> which providers are switched on in this deployment
 *
 * CSRF: the state is a random 256-bit nonce, stored server-side, bound to the
 * signed-in user, single use and short-lived. A callback with an unknown,
 * reused or expired state is refused.
 */
import { verifyUser } from './_usageLimit.js';
import { hasHealthAccess } from './_healthAccess.js';
import { rateLimit } from './_rateLimit.js';
import { isTokenKeyConfigured, logHealthError, sanitizeCategories } from './_healthStore.js';
import { authorizeUrl, isLiveOnly, isOAuthProvider, liveRows, newNonce, providerConfigured, syncProvider, PROVIDERS } from './_healthProviders.js';

const PROVIDER_CATEGORIES = {
  oura: ['sleep', 'temperature', 'heart', 'activity', 'recovery'],
  whoop: ['sleep', 'temperature', 'heart', 'activity', 'recovery'],
};
const SAFE_PATH = /^\/[A-Za-z0-9/_.=&?-]{0,200}$/;

export function safeReturnPath(p) {
  return typeof p === 'string' && SAFE_PATH.test(p) && !p.startsWith('//') ? p : '/';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  if (req.method === 'GET') {
    if (req.query?.action !== 'status') return res.status(400).json({ error: 'unknown_action' });
    return res.status(200).json({ providers: Object.fromEntries(Object.keys(PROVIDERS).map((p) => [p, providerConfigured(p) && isTokenKeyConfigured()])) });
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'method_not_allowed' }); }

  const { user, error, admin } = await verifyUser(req);
  if (error || !user || !admin) return res.status(error === 'server_misconfigured' ? 503 : 401).json({ error: error || 'auth_required' });
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const provider = String(body.provider || '');
  if (!isOAuthProvider(provider)) return res.status(400).json({ error: 'unsupported_provider' });
  if (!providerConfigured(provider) || !isTokenKeyConfigured()) return res.status(503).json({ error: 'provider_not_configured' });

  try {
    if (['start', 'live', 'sync'].includes(body.action) && !await hasHealthAccess(user, admin)) {
      return res.status(403).json({ error: 'pro_required' });
    }
    if (body.action === 'start') {
      const limited = await rateLimit(`health-oauth-start:${user.id}`, { max: 10, windowSec: 3600 });
      if (!limited.ok) return res.status(429).json({ error: 'rate_limited' });
      const categories = sanitizeCategories(body.categories).filter((c) => PROVIDER_CATEGORIES[provider].includes(c));
      if (!categories.length) return res.status(400).json({ error: 'no_categories' });
      const nonce = newNonce(provider);
      const { error: insertError } = await admin.from('health_oauth_states').insert({
        nonce, user_id: user.id, provider, categories,
        return_to: body.returnTo === 'app' ? 'app' : 'web',
        return_path: safeReturnPath(body.returnPath),
        expires_at: new Date(Date.now() + 10 * 60000).toISOString(),
      });
      if (insertError) throw new Error('state_save_failed');
      return res.status(200).json({ url: authorizeUrl(provider, nonce) });
    }
    if (body.action === 'live') {
      // Live-only providers (WHOOP): rows go straight back to her, never stored.
      if (!isLiveOnly(provider)) return res.status(400).json({ error: 'not_live_provider' });
      const limited = await rateLimit(`health-oauth-live:${user.id}:${provider}`, { max: 30, windowSec: 3600 });
      if (!limited.ok) return res.status(429).json({ error: 'rate_limited' });
      const out = await liveRows(admin, user.id, provider);
      res.setHeader?.('Cache-Control', 'no-store');
      return res.status(200).json({ rows: out.rows });
    }
    if (body.action === 'sync') {
      const limited = await rateLimit(`health-oauth-sync:${user.id}:${provider}`, { max: 12, windowSec: 3600 });
      if (!limited.ok) return res.status(429).json({ error: 'rate_limited' });
      const out = await syncProvider(admin, user.id, provider);
      return res.status(200).json({ ok: true, saved: out.saved || 0, empty: !(out.saved || out.live) });
    }
    return res.status(400).json({ error: 'unknown_action' });
  } catch (e) {
    const code = ['needs_reauth', 'not_connected', 'provider_rate_limited'].includes(e?.message) ? e.message : 'oauth_failed';
    if (code === 'oauth_failed') logHealthError('health-oauth', e?.message);
    return res.status(code === 'not_connected' ? 404 : code === 'needs_reauth' ? 409 : 502).json({ error: code });
  }
}
