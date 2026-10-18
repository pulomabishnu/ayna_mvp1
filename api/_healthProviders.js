/* global process */
/**
 * OAuth health providers, server side. Only providers with a real, permitted
 * integration live here (see docs/wearables-ehr-integration.md):
 *
 *   oura    OAuth 2.0, server-side flow. Needs OURA_CLIENT_ID / OURA_CLIENT_SECRET.
 *           New Oura apps are capped at 10 users until Oura approves them.
 *   whoop   OAuth 2.0. Needs WHOOP_CLIENT_ID / WHOOP_CLIENT_SECRET. WHOOP's terms
 *           forbid keeping copies of WHOOP data, so WHOOP is read LIVE and never
 *           saved (liveRows below). 10 members until WHOOP approves a higher tier.
 *   garmin  not implemented: needs Garmin Connect Developer Program approval.
 *   strava  not implemented: Strava's API Policy doesn't allow ayna's use.
 *
 * Tokens are AES-256-GCM encrypted (api/_healthStore.js). Nothing here logs a
 * token, a code, a provider response body, or a health value.
 */
import crypto from 'node:crypto';
import { ouraRows, OURA_ENDPOINTS, OURA_SCOPES } from '../src/health/providers/oura.js';
import { whoopRows, WHOOP_ENDPOINTS, WHOOP_SCOPES } from '../src/health/providers/whoop.js';
import { cleanRows } from '../src/health/metrics.js';
import {
  deleteTokens, getConnection, loadTokens, logHealthError, saveMetrics, saveTokens, setConnectionState,
} from './_healthStore.js';

const TIMEOUT_MS = 15000;

export const PROVIDERS = {
  oura: {
    authorizeUrl: 'https://cloud.ouraring.com/oauth/authorize',
    tokenUrl: 'https://api.ouraring.com/oauth/token',
    revokeUrl: 'https://api.ouraring.com/oauth/revoke',
    apiBase: 'https://api.ouraring.com/v2/usercollection/',
    scopes: OURA_SCOPES,
    clientId: () => process.env.OURA_CLIENT_ID,
    clientSecret: () => process.env.OURA_CLIENT_SECRET,
    stores: true,
  },
  whoop: {
    authorizeUrl: 'https://api.prod.whoop.com/oauth/oauth2/auth',
    tokenUrl: 'https://api.prod.whoop.com/oauth/oauth2/token',
    apiBase: 'https://api.prod.whoop.com/developer',
    scopes: WHOOP_SCOPES,
    clientId: () => process.env.WHOOP_CLIENT_ID,
    clientSecret: () => process.env.WHOOP_CLIENT_SECRET,
    // WHOOP requires a self-generated state to be exactly 8 characters.
    stateLength: 8,
    stores: false,
  },
};

export const isLiveOnly = (provider) => PROVIDERS[provider]?.stores === false;

export const isOAuthProvider = (p) => Object.hasOwn(PROVIDERS, p);

export function providerConfigured(provider) {
  const p = PROVIDERS[provider];
  return Boolean(p && p.clientId() && p.clientSecret());
}

export function redirectUri() {
  const base = String(process.env.HEALTH_OAUTH_REDIRECT_BASE || 'https://www.aynahealth.co').replace(/\/+$/, '');
  return `${base}/api/health-oauth-callback`;
}

/** One-time OAuth state. WHOOP needs exactly 8 characters; others get 256 bits. */
export function newNonce(provider) {
  if (PROVIDERS[provider]?.stateLength === 8) return crypto.randomBytes(6).toString('base64url');
  return crypto.randomBytes(32).toString('base64url');
}

export function authorizeUrl(provider, state) {
  const p = PROVIDERS[provider];
  const url = new URL(p.authorizeUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', p.clientId());
  url.searchParams.set('redirect_uri', redirectUri());
  url.searchParams.set('scope', p.scopes.join(' '));
  url.searchParams.set('state', state);
  return url.toString();
}

async function timedFetch(url, init) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); } finally { clearTimeout(t); }
}

async function tokenRequest(provider, fields) {
  const p = PROVIDERS[provider];
  const body = new URLSearchParams({ ...fields, client_id: p.clientId(), client_secret: p.clientSecret() });
  const res = await timedFetch(p.tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!res.ok) throw new Error(res.status === 400 || res.status === 401 ? 'token_rejected' : 'token_http_error');
  const data = await res.json();
  if (!data?.access_token) throw new Error('token_missing');
  return data;
}

export async function exchangeCode(admin, userId, provider, code) {
  const data = await tokenRequest(provider, { grant_type: 'authorization_code', code, redirect_uri: redirectUri() });
  const scopes = typeof data.scope === 'string' ? data.scope.split(/[\s,]+/).filter(Boolean) : PROVIDERS[provider].scopes;
  await saveTokens(admin, userId, provider, { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in, scopes });
  return { scopes };
}

/** A valid access token, refreshing it if it is about to expire. Oura refresh tokens are single-use. */
async function accessToken(admin, userId, provider) {
  const t = await loadTokens(admin, userId, provider);
  if (!t) throw new Error('not_connected');
  if (!t.expiresAt || t.expiresAt - Date.now() > 5 * 60000) return t.accessToken;
  if (!t.refreshToken) throw new Error('needs_reauth');
  try {
    const data = await tokenRequest(provider, { grant_type: 'refresh_token', refresh_token: t.refreshToken, ...(provider === 'whoop' ? { scope: 'offline' } : {}) });
    await saveTokens(admin, userId, provider, { accessToken: data.access_token, refreshToken: data.refresh_token || null, expiresIn: data.expires_in, scopes: t.scopes });
    return data.access_token;
  } catch (e) {
    if (e?.message === 'token_rejected') throw new Error('needs_reauth');
    throw e;
  }
}

const isoDay = (t) => new Date(t).toISOString().slice(0, 10);

async function fetchOuraCollection(token, endpoint, startDay, endDay) {
  const all = [];
  let next = null;
  for (let page = 0; page < 20; page += 1) {
    const url = new URL(`${PROVIDERS.oura.apiBase}${endpoint}`);
    url.searchParams.set('start_date', startDay);
    url.searchParams.set('end_date', endDay);
    if (next) url.searchParams.set('next_token', next);
    const res = await timedFetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) throw new Error('needs_reauth');
    // 403: usually no active Oura membership or a data type she didn't allow. Skip that collection.
    if (res.status === 403) return all;
    if (res.status === 429) throw new Error('provider_rate_limited');
    if (!res.ok) throw new Error('provider_http_error');
    const body = await res.json();
    all.push(...(Array.isArray(body?.data) ? body.data : []));
    next = body?.next_token || null;
    if (!next) break;
  }
  return all;
}

async function fetchWhoopCollection(token, path, startIso) {
  const all = [];
  let next = null;
  for (let page = 0; page < 12; page += 1) {
    const url = new URL(`${PROVIDERS.whoop.apiBase}${path}`);
    url.searchParams.set('start', startIso);
    url.searchParams.set('limit', '25');
    if (next) url.searchParams.set('nextToken', next);
    const res = await timedFetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) throw new Error('needs_reauth');
    if (res.status === 403) return all; // scope not granted
    if (res.status === 429) throw new Error('provider_rate_limited');
    if (!res.ok) throw new Error('provider_http_error');
    const body = await res.json();
    all.push(...(Array.isArray(body?.records) ? body.records : []));
    next = body?.next_token || body?.nextToken || null;
    if (!next) break;
  }
  return all;
}

/**
 * WHOOP: fetch the last ~6 weeks LIVE and return the consented daily rows.
 * Nothing is written to the database except the connection's sync time.
 */
export async function liveRows(admin, userId, provider) {
  if (provider !== 'whoop') throw new Error('unsupported_provider');
  const connection = await getConnection(admin, userId, provider);
  if (!connection || connection.status === 'disconnected') throw new Error('not_connected');
  if (!connection.sync_enabled) return { rows: [] };
  try {
    const token = await accessToken(admin, userId, provider);
    const startIso = new Date(Date.now() - 42 * 86400000).toISOString();
    const [sleep, recovery, workout] = await Promise.all([
      fetchWhoopCollection(token, WHOOP_ENDPOINTS.sleep, startIso),
      fetchWhoopCollection(token, WHOOP_ENDPOINTS.recovery, startIso),
      fetchWhoopCollection(token, WHOOP_ENDPOINTS.workout, startIso),
    ]);
    const { rows } = cleanRows(whoopRows({ sleep, recovery, workout }), { allowedCategories: connection.categories, source: 'whoop' });
    await setConnectionState(admin, userId, provider, { status: 'connected', last_synced_at: new Date().toISOString(), last_error_code: null });
    return { rows };
  } catch (e) {
    const code = ['needs_reauth', 'not_connected', 'provider_rate_limited'].includes(e?.message) ? e.message : 'sync_failed';
    if (code === 'needs_reauth') await setConnectionState(admin, userId, provider, { status: 'needs_reauth', last_error_code: code }).catch(() => {});
    else if (code !== 'not_connected') await setConnectionState(admin, userId, provider, { status: 'error', last_error_code: code }).catch(() => {});
    logHealthError(`live.${provider}`, code);
    throw new Error(code);
  }
}

/** Pull recent daily summaries and save the consented ones. */
export async function syncProvider(admin, userId, provider, { days } = {}) {
  if (isLiveOnly(provider)) { const out = await liveRows(admin, userId, provider); return { saved: 0, live: out.rows.length }; }
  if (provider !== 'oura') throw new Error('unsupported_provider');
  const connection = await getConnection(admin, userId, provider);
  if (!connection || connection.status === 'disconnected') throw new Error('not_connected');
  if (!connection.sync_enabled) return { saved: 0, skipped: 'paused' };
  try {
    const token = await accessToken(admin, userId, provider);
    const span = days || (connection.last_synced_at ? 14 : 90);
    const end = Date.now() + 86400000; // Oura's end_date is exclusive
    const startDay = isoDay(end - (span + 1) * 86400000);
    const endDay = isoDay(end);
    const payloads = {};
    for (const endpoint of OURA_ENDPOINTS) payloads[endpoint] = await fetchOuraCollection(token, endpoint, startDay, endDay);
    const result = await saveMetrics(admin, userId, provider, ouraRows(payloads));
    await setConnectionState(admin, userId, provider, { status: 'connected', last_synced_at: new Date().toISOString(), last_error_code: null });
    return { saved: result.saved };
  } catch (e) {
    const code = ['needs_reauth', 'not_connected', 'provider_rate_limited'].includes(e?.message) ? e.message : 'sync_failed';
    if (code === 'needs_reauth') await setConnectionState(admin, userId, provider, { status: 'needs_reauth', last_error_code: code }).catch(() => {});
    else if (code !== 'not_connected') await setConnectionState(admin, userId, provider, { status: 'error', last_error_code: code }).catch(() => {});
    logHealthError(`sync.${provider}`, code);
    throw new Error(code);
  }
}

/** Revoke ayna's access at the provider (best effort) and delete stored tokens either way. */
export async function revokeProvider(admin, userId, provider) {
  if (!isOAuthProvider(provider)) { await deleteTokens(admin, userId, provider).catch(() => {}); return; }
  let tokens = null;
  try { tokens = await loadTokens(admin, userId, provider); } catch { /* key missing or row unreadable: still delete */ }
  try {
    if (tokens?.accessToken && provider === 'whoop') {
      const res = await timedFetch(`${PROVIDERS.whoop.apiBase}/v2/user/access`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokens.accessToken}` } });
      if (!res.ok && res.status !== 401) logHealthError('revoke.whoop', `http_${res.status}`);
    }
    if (tokens?.accessToken && provider === 'oura') {
      const url = new URL(PROVIDERS.oura.revokeUrl);
      url.searchParams.set('access_token', tokens.accessToken);
      const res = await timedFetch(url, { method: 'POST' });
      if (!res.ok && res.status !== 400 && res.status !== 401) logHealthError('revoke.oura', `http_${res.status}`);
    }
  } finally {
    await deleteTokens(admin, userId, provider);
  }
}
