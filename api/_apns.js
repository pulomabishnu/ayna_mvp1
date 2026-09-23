/* global process, Buffer */
/**
 * Apple Push Notification service (APNs) sender — token-based auth (.p8 key),
 * HTTP/2, no third-party dependency.
 *
 * Env (Vercel):
 *   APNS_KEY_P8     contents of the AuthKey_XXXXXXXXXX.p8 file (the whole
 *                   "-----BEGIN PRIVATE KEY-----" block; literal \n is fine)
 *   APNS_KEY_ID     the 10-character Key ID shown next to the key in Apple
 *                   Developer → Keys
 *   APNS_TEAM_ID    Apple Team ID (defaults to the app's team, KCVVLA6MCA)
 *   APNS_BUNDLE_ID  defaults to co.aynahealth.app
 *   APNS_ENV        'production' (default — TestFlight + App Store builds) or
 *                   'development' (only for builds run straight from Xcode)
 */
import crypto from 'node:crypto';
import http2 from 'node:http2';

const DEFAULT_TEAM_ID = 'KCVVLA6MCA';
const DEFAULT_BUNDLE_ID = 'co.aynahealth.app';

export function apnsConfigured() {
  return Boolean(process.env.APNS_KEY_P8 && process.env.APNS_KEY_ID);
}

function apnsHost() {
  return process.env.APNS_ENV === 'development'
    ? 'https://api.sandbox.push.apple.com'
    : 'https://api.push.apple.com';
}

function privateKey() {
  const raw = String(process.env.APNS_KEY_P8 || '').replace(/\\n/g, '\n').trim();
  return crypto.createPrivateKey(raw);
}

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

// Apple accepts a provider token for up to 60 min and rejects refreshing it
// more than once per 20 min, so cache it for 40.
let cachedJwt = { token: null, at: 0 };
export function providerToken(now = Date.now()) {
  if (cachedJwt.token && now - cachedJwt.at < 40 * 60 * 1000) return cachedJwt.token;
  const header = b64url(JSON.stringify({ alg: 'ES256', kid: process.env.APNS_KEY_ID }));
  const claims = b64url(JSON.stringify({ iss: process.env.APNS_TEAM_ID || DEFAULT_TEAM_ID, iat: Math.floor(now / 1000) }));
  const signature = crypto.sign('sha256', Buffer.from(`${header}.${claims}`), { key: privateKey(), dsaEncoding: 'ieee-p1363' });
  cachedJwt = { token: `${header}.${claims}.${b64url(signature)}`, at: now };
  return cachedJwt.token;
}

export function _resetApnsForTests() {
  cachedJwt = { token: null, at: 0 };
}

/** APNs reasons that mean the token is dead and should be deleted. */
export const DEAD_TOKEN_REASONS = new Set(['BadDeviceToken', 'Unregistered', 'DeviceTokenNotForTopic']);

/**
 * Send one alert to many device tokens over a single HTTP/2 connection.
 * Resolves to [{ deviceToken, ok, status, reason }] — never throws for a
 * per-token failure.
 */
export async function sendPush(deviceTokens, { title, body, data = {} }, { connect = http2.connect } = {}) {
  const tokens = [...new Set((deviceTokens || []).filter(Boolean))];
  if (!tokens.length) return [];
  if (!apnsConfigured()) return tokens.map((deviceToken) => ({ deviceToken, ok: false, status: 0, reason: 'apns_not_configured' }));

  const payload = JSON.stringify({ aps: { alert: { title, body }, sound: 'default' }, ...data });
  const jwt = providerToken();
  const topic = process.env.APNS_BUNDLE_ID || DEFAULT_BUNDLE_ID;
  const client = connect(apnsHost());
  client.on('error', () => {});

  const sendOne = (deviceToken) => new Promise((resolve) => {
    let status = 0;
    let raw = '';
    let req;
    try {
      req = client.request({
        ':method': 'POST',
        ':path': `/3/device/${deviceToken}`,
        authorization: `bearer ${jwt}`,
        'apns-topic': topic,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      });
    } catch (e) {
      resolve({ deviceToken, ok: false, status: 0, reason: e?.message || 'request_failed' });
      return;
    }
    const timer = setTimeout(() => { try { req.close(); } catch { /* closed */ } resolve({ deviceToken, ok: false, status: 0, reason: 'timeout' }); }, 10000);
    req.on('response', (headers) => { status = Number(headers[':status']) || 0; });
    req.setEncoding('utf8');
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      clearTimeout(timer);
      let reason = '';
      try { reason = raw ? JSON.parse(raw).reason || '' : ''; } catch { reason = raw.slice(0, 80); }
      resolve({ deviceToken, ok: status === 200, status, reason });
    });
    req.on('error', (e) => { clearTimeout(timer); resolve({ deviceToken, ok: false, status, reason: e?.message || 'stream_error' }); });
    req.end(payload);
  });

  try {
    return await Promise.all(tokens.map(sendOne));
  } finally {
    try { client.close(); } catch { /* already closed */ }
  }
}

/**
 * Push to every registered device of `userId`, deleting tokens Apple reports
 * as dead. Returns { sent, failed, devices }.
 */
export async function pushToUser(admin, userId, message) {
  const { data: rows, error } = await admin.from('device_tokens').select('device_token').eq('user_id', userId).eq('platform', 'ios');
  if (error || !rows?.length) return { sent: 0, failed: 0, devices: 0 };
  const results = await sendPush(rows.map((r) => r.device_token), message);
  const dead = results.filter((r) => r.status === 410 || DEAD_TOKEN_REASONS.has(r.reason)).map((r) => r.deviceToken);
  if (dead.length) await admin.from('device_tokens').delete().in('device_token', dead);
  const failures = results.filter((r) => !r.ok);
  if (failures.length) console.warn('[apns] failures:', failures.map((f) => `${f.status} ${f.reason}`).join(', '));
  return { sent: results.filter((r) => r.ok).length, failed: failures.length, devices: rows.length };
}
