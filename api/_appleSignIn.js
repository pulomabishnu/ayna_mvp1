/* global process, Buffer */
import crypto from 'node:crypto';

const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';
const DEFAULT_CLIENT_ID = 'co.aynahealth.app';
const TOKEN_TABLE = 'apple_oauth_tokens';

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function readEncryptionKey() {
  const raw = String(process.env.APPLE_TOKEN_ENCRYPTION_KEY || '').trim();
  if (!raw) throw new Error('apple_token_encryption_key_missing');

  if (/^[a-f0-9]{64}$/i.test(raw)) return Buffer.from(raw, 'hex');

  try {
    const decoded = Buffer.from(raw, 'base64');
    if (decoded.length === 32) return decoded;
  } catch {
    // handled below
  }
  throw new Error('apple_token_encryption_key_invalid');
}

function appleConfig() {
  const teamId = String(process.env.APPLE_TEAM_ID || '').trim();
  const keyId = String(process.env.APPLE_KEY_ID || '').trim();
  const privateKey = String(process.env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
  const clientId = String(process.env.APPLE_CLIENT_ID || DEFAULT_CLIENT_ID).trim();
  if (!teamId || !keyId || !privateKey || !clientId) throw new Error('apple_server_credentials_missing');
  return { teamId, keyId, privateKey, clientId };
}

export function createAppleClientSecret(nowSeconds = Math.floor(Date.now() / 1000)) {
  const { teamId, keyId, privateKey, clientId } = appleConfig();
  const header = base64url(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: teamId,
    iat: nowSeconds,
    exp: nowSeconds + 5 * 60,
    aud: 'https://appleid.apple.com',
    sub: clientId,
  }));
  const signingInput = `${header}.${payload}`;
  const signature = crypto.sign('sha256', Buffer.from(signingInput), {
    key: crypto.createPrivateKey(privateKey),
    dsaEncoding: 'ieee-p1363',
  });
  return `${signingInput}.${base64url(signature)}`;
}

export function encryptAppleRefreshToken(token) {
  if (!token) throw new Error('apple_refresh_token_missing');
  const key = readEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(token), 'utf8'), cipher.final()]);
  return {
    encrypted_refresh_token: ciphertext.toString('base64'),
    encryption_iv: iv.toString('base64'),
    encryption_tag: cipher.getAuthTag().toString('base64'),
  };
}

export function decryptAppleRefreshToken(row) {
  if (!row?.encrypted_refresh_token || !row?.encryption_iv || !row?.encryption_tag) {
    throw new Error('apple_refresh_token_record_invalid');
  }
  const key = readEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(row.encryption_iv, 'base64'));
  decipher.setAuthTag(Buffer.from(row.encryption_tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(row.encrypted_refresh_token, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

async function appleFormRequest(url, fields) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
      signal: controller.signal,
    });
    const raw = await response.text();
    let json = null;
    try { json = raw ? JSON.parse(raw) : null; } catch { /* Apple revoke may have no body */ }
    return { ok: response.ok, status: response.status, json };
  } finally {
    clearTimeout(timer);
  }
}

export async function exchangeAppleAuthorizationCode(code) {
  const authCode = String(code || '').trim();
  if (!authCode || authCode.length > 4096) throw new Error('apple_authorization_code_invalid');
  const { clientId } = appleConfig();
  const result = await appleFormRequest(APPLE_TOKEN_URL, {
    client_id: clientId,
    client_secret: createAppleClientSecret(),
    code: authCode,
    grant_type: 'authorization_code',
  });
  if (!result.ok || !result.json?.refresh_token) {
    const error = new Error('apple_authorization_exchange_failed');
    error.status = result.status;
    throw error;
  }
  return result.json.refresh_token;
}

export async function revokeAppleRefreshToken(refreshToken) {
  const { clientId } = appleConfig();
  const result = await appleFormRequest(APPLE_REVOKE_URL, {
    client_id: clientId,
    client_secret: createAppleClientSecret(),
    token: String(refreshToken || ''),
    token_type_hint: 'refresh_token',
  });
  if (!result.ok) {
    const error = new Error('apple_token_revoke_failed');
    error.status = result.status;
    throw error;
  }
  return true;
}

export async function storeAppleRefreshToken(admin, userId, refreshToken) {
  if (!admin || !userId) throw new Error('apple_token_store_context_missing');
  const encrypted = encryptAppleRefreshToken(refreshToken);
  const { error } = await admin.from(TOKEN_TABLE).upsert({
    user_id: userId,
    ...encrypted,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw new Error(`apple_token_store_failed:${error.code || 'db'}`);
}

export async function revokeStoredAppleAuthorization(admin, userId) {
  if (!admin || !userId) return { status: 'not_available' };
  const { data, error } = await admin
    .from(TOKEN_TABLE)
    .select('encrypted_refresh_token, encryption_iv, encryption_tag')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    const missing = error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message || '');
    return { status: missing ? 'store_not_installed' : 'lookup_failed' };
  }
  if (!data) return { status: 'not_available' };

  try {
    const refreshToken = decryptAppleRefreshToken(data);
    await revokeAppleRefreshToken(refreshToken);
    return { status: 'revoked' };
  } catch (e) {
    console.warn('[account-delete] Apple authorization revocation was not completed:', e?.message || 'unknown');
    return { status: 'revoke_failed' };
  }
}
