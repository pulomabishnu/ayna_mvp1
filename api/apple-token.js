import { verifyUser } from './_usageLimit.js';
import { exchangeAppleAuthorizationCode, storeAppleRefreshToken } from './_appleSignIn.js';

function privateHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

export default async function handler(req, res) {
  privateHeaders(res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { user, error, admin } = await verifyUser(req);
  if (!user || !admin) {
    return res.status(error === 'auth_required' || error === 'invalid_session' ? 401 : 503).json({
      error: error || 'auth_required',
    });
  }

  const body = typeof req.body === 'string' ? (() => {
    try { return JSON.parse(req.body); } catch { return {}; }
  })() : (req.body || {});
  const authorizationCode = typeof body.authorizationCode === 'string' ? body.authorizationCode.trim() : '';
  if (!authorizationCode || authorizationCode.length > 4096) {
    return res.status(400).json({ error: 'authorization_code_required' });
  }

  try {
    const refreshToken = await exchangeAppleAuthorizationCode(authorizationCode);
    await storeAppleRefreshToken(admin, user.id, refreshToken);
    return res.status(200).json({ ok: true, stored: true });
  } catch (e) {
    // Never return or log the authorization grant, refresh token, private key,
    // Apple provider response body, or encryption key.
    console.warn('[apple-token] secure Apple token capture unavailable:', e?.message || 'unknown');
    const configError = /credentials_missing|encryption_key_(missing|invalid)/.test(e?.message || '');
    const storeError = /^apple_token_store_failed/.test(e?.message || '');
    return res.status(configError || storeError ? 503 : 502).json({
      error: configError ? 'apple_token_config_required' : storeError ? 'apple_token_store_unavailable' : 'apple_token_exchange_failed',
    });
  }
}
