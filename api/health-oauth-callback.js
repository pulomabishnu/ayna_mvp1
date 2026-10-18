/**
 * OAuth redirect target for health providers:
 *   https://www.aynahealth.co/api/health-oauth-callback?code=...&state=...
 * (register exactly this as the redirect URI in the provider's developer console).
 *
 * The state nonce is looked up and DELETED before anything else (single use),
 * must belong to a live, unexpired request, and carries the user id and the
 * categories she agreed to. Only then is the code exchanged, the consent
 * recorded and a first sync run. Redirects back with a status only, never data.
 */
import { getServiceClient } from './_usageLimit.js';
import { logHealthError, upsertConnection } from './_healthStore.js';
import { exchangeCode, syncProvider } from './_healthProviders.js';

const APP_SCHEME = 'co.aynahealth.app://health-connected';

function back(res, state, provider, status) {
  const p = encodeURIComponent(provider || '');
  const st = encodeURIComponent(status);
  const path = state?.return_path && state.return_path.startsWith('/') && !state.return_path.startsWith('//') ? state.return_path : '/';
  const target = state?.return_to === 'app'
    ? `${APP_SCHEME}?source=${p}&status=${st}`
    : `${path}${path.includes('?') ? '&' : '?'}health_source=${p}&health_status=${st}`;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.statusCode = 302;
  res.setHeader('Location', target);
  return res.end();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'method_not_allowed' }); }
  const admin = getServiceClient();
  const nonce = typeof req.query?.state === 'string' ? req.query.state : '';
  if (!admin || !/^[A-Za-z0-9_-]{20,100}$/.test(nonce)) return back(res, null, null, 'invalid_state');

  // Claim the state: delete-returning makes it single-use even under a replay race.
  const { data: rows, error } = await admin.from('health_oauth_states').delete().eq('nonce', nonce).select('*');
  const state = rows?.[0];
  if (error || !state) return back(res, null, null, 'invalid_state');
  if (Date.parse(state.expires_at) < Date.now()) return back(res, state, state.provider, 'expired');
  if (req.query?.error || typeof req.query?.code !== 'string') return back(res, state, state.provider, 'declined');

  try {
    await exchangeCode(admin, state.user_id, state.provider, req.query.code);
    await upsertConnection(admin, state.user_id, state.provider, { categories: state.categories, platform: state.return_to === 'app' ? null : 'web' });
    try { await syncProvider(admin, state.user_id, state.provider); } catch { /* connected; the first sync can retry */ }
    return back(res, state, state.provider, 'connected');
  } catch (e) {
    logHealthError('health-oauth-callback', e?.message);
    return back(res, state, state.provider, 'failed');
  }
}
