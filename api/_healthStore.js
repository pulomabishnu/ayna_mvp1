/* global process, Buffer */
/**
 * Server-side store for connected health data (supabase/health_data.sql).
 *
 * Every write to health tables goes through here with the service role, so
 * consent and validation are enforced on the server and can't be skipped by a
 * modified client. Rules:
 *   - A metric is saved only if its category is in the categories the person
 *     turned on for that source (cleanRows + the connection row).
 *   - Errors are logged as short codes only. Never values, never provider
 *     response bodies, never tokens.
 *   - OAuth tokens are AES-256-GCM encrypted with HEALTH_TOKEN_ENCRYPTION_KEY.
 */
import crypto from 'node:crypto';
import { cleanRows, NOTICE_VERSION, CATEGORIES, SOURCE_IDS, METRICS, LIVE_ONLY_SOURCES } from '../src/health/metrics.js';

export const HEALTH_SOURCES = SOURCE_IDS;
export const VALID_CATEGORIES = Object.keys(CATEGORIES);

export function sanitizeCategories(input) {
  const set = new Set(Array.isArray(input) ? input.filter((c) => VALID_CATEGORIES.includes(c)) : []);
  return VALID_CATEGORIES.filter((c) => set.has(c));
}

/** Logs a health-feature failure as a code only. */
export function logHealthError(where, code) {
  // Our own errors are short snake_case codes. Anything else (a library or
  // provider message) could carry a value, so it is logged as 'unexpected'.
  const safe = /^[a-z0-9_]{1,60}$/.test(String(code || '')) ? code : 'unexpected';
  console.error(`[health] ${where}: ${safe}`);
}

/* ------------------------------ token crypto ------------------------------ */
function readKey() {
  const raw = String(process.env.HEALTH_TOKEN_ENCRYPTION_KEY || '').trim();
  if (!raw) throw new Error('health_token_key_missing');
  if (/^[a-f0-9]{64}$/i.test(raw)) return Buffer.from(raw, 'hex');
  const decoded = Buffer.from(raw, 'base64');
  if (decoded.length === 32) return decoded;
  throw new Error('health_token_key_invalid');
}

export function isTokenKeyConfigured() {
  try { readKey(); return true; } catch { return false; }
}

export function encryptSecret(plain) {
  const key = readKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return { ciphertext: ciphertext.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64') };
}

export function decryptSecret(ciphertext, iv, tag) {
  const key = readKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8');
}

export async function saveTokens(admin, userId, provider, { accessToken, refreshToken, expiresIn, scopes, providerUserId }) {
  const access = encryptSecret(accessToken);
  const refresh = refreshToken ? encryptSecret(refreshToken) : null;
  const { error } = await admin.from('health_oauth_tokens').upsert({
    user_id: userId,
    provider,
    encrypted_access_token: access.ciphertext,
    encryption_iv: access.iv,
    encryption_tag: access.tag,
    encrypted_refresh_token: refresh?.ciphertext || null,
    refresh_iv: refresh?.iv || null,
    refresh_tag: refresh?.tag || null,
    scopes: Array.isArray(scopes) ? scopes : [],
    expires_at: expiresIn ? new Date(Date.now() + Number(expiresIn) * 1000).toISOString() : null,
    provider_user_id: providerUserId ? String(providerUserId).slice(0, 80) : null,
  }, { onConflict: 'user_id,provider' });
  if (error) throw new Error('token_save_failed');
}

export async function loadTokens(admin, userId, provider) {
  const { data, error } = await admin.from('health_oauth_tokens').select('*').eq('user_id', userId).eq('provider', provider).maybeSingle();
  if (error) throw new Error('token_load_failed');
  if (!data) return null;
  return {
    accessToken: decryptSecret(data.encrypted_access_token, data.encryption_iv, data.encryption_tag),
    refreshToken: data.encrypted_refresh_token ? decryptSecret(data.encrypted_refresh_token, data.refresh_iv, data.refresh_tag) : null,
    expiresAt: data.expires_at ? Date.parse(data.expires_at) : null,
    scopes: data.scopes || [],
  };
}

export async function deleteTokens(admin, userId, provider) {
  await admin.from('health_oauth_tokens').delete().eq('user_id', userId).eq('provider', provider);
}

/* ------------------------------ connections ------------------------------ */
export async function getConnection(admin, userId, source) {
  const { data, error } = await admin.from('health_connections').select('*').eq('user_id', userId).eq('source', source).maybeSingle();
  if (error) throw new Error('connection_load_failed');
  return data || null;
}

export async function listConnections(admin, userId) {
  const { data, error } = await admin.from('health_connections')
    .select('source,status,sync_enabled,categories,platform,last_synced_at,last_error_code,notice_version,created_at,updated_at')
    .eq('user_id', userId);
  if (error) throw new Error('connection_list_failed');
  return data || [];
}

export async function recordEvent(admin, userId, source, action, { categories = [], platform = null, rowsAffected = null } = {}) {
  const { error } = await admin.from('health_data_events').insert({
    user_id: userId, source, action, categories, notice_version: NOTICE_VERSION, platform, rows_affected: rowsAffected,
  });
  if (error) throw new Error('event_write_failed');
}

/** Turn a source on (or change its categories). Writes the consent log first. */
export async function upsertConnection(admin, userId, source, { categories, platform = null, status = 'connected' }) {
  const clean = sanitizeCategories(categories);
  if (!clean.length) throw new Error('no_categories');
  const existing = await getConnection(admin, userId, source);
  const action = existing && existing.status !== 'disconnected' ? 'consent_updated' : 'consent_granted';
  await recordEvent(admin, userId, source, action, { categories: clean, platform });
  const { error } = await admin.from('health_connections').upsert({
    user_id: userId, source, status, sync_enabled: true, categories: clean, platform,
    notice_version: NOTICE_VERSION, last_error_code: null,
  }, { onConflict: 'user_id,source' });
  if (error) throw new Error('connection_save_failed');

  // Narrowing consent stops future collection AND removes what was collected
  // for the categories she turned off.
  if (existing?.categories?.length) {
    const removed = existing.categories.filter((c) => !clean.includes(c));
    if (removed.length) await deleteMetricsForCategories(admin, userId, source, removed);
  }
  return { source, categories: clean, action };
}

export async function setConnectionState(admin, userId, source, patch) {
  const { error } = await admin.from('health_connections').update(patch).eq('user_id', userId).eq('source', source);
  if (error) throw new Error('connection_update_failed');
}

/* -------------------------------- metrics -------------------------------- */
const METRIC_CATEGORY = Object.fromEntries(Object.entries(METRICS).map(([id, m]) => [id, m.category]));

/**
 * Validate and save daily rows for one source. Rows for categories she didn't
 * turn on are dropped (and counted), never saved.
 */
export async function saveMetrics(admin, userId, source, inputs, { importId = null } = {}) {
  // Provider terms forbid keeping copies (WHOOP): never written, whatever the caller.
  if (LIVE_ONLY_SOURCES.includes(source)) return { saved: 0, errors: { live_only_source: 1 } };
  const connection = await getConnection(admin, userId, source);
  if (!connection || connection.status === 'disconnected') return { saved: 0, errors: { not_connected: 1 } };
  if (!connection.sync_enabled) return { saved: 0, errors: { sync_paused: 1 } };
  const { rows, errors } = cleanRows(inputs, { allowedCategories: connection.categories, source });
  if (!rows.length) return { saved: 0, errors };
  const payload = rows.map((r) => ({ user_id: userId, ...r, import_id: importId, notice_version: connection.notice_version || NOTICE_VERSION, synced_at: new Date().toISOString() }));
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await admin.from('health_daily_metrics').upsert(payload.slice(i, i + 500), { onConflict: 'user_id,source,origin,metric,day' });
    if (error) throw new Error('metric_save_failed');
  }
  return { saved: rows.length, errors };
}

export async function deleteMetricsForCategories(admin, userId, source, categories) {
  const metrics = Object.entries(METRIC_CATEGORY).filter(([, c]) => categories.includes(c)).map(([id]) => id);
  if (!metrics.length) return 0;
  const { count, error } = await admin.from('health_daily_metrics').delete({ count: 'exact' }).eq('user_id', userId).eq('source', source).in('metric', metrics);
  if (error) throw new Error('metric_delete_failed');
  return count || 0;
}

export async function deleteSourceData(admin, userId, source) {
  const { count, error } = await admin.from('health_daily_metrics').delete({ count: 'exact' }).eq('user_id', userId).eq('source', source);
  if (error) throw new Error('metric_delete_failed');
  if (source === 'manual_import') await admin.from('health_imports').delete().eq('user_id', userId);
  return count || 0;
}

export async function readMetrics(admin, userId, { days = 120 } = {}) {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const { data, error } = await admin.from('health_daily_metrics')
    .select('source,origin,metric,day,value,unit,method')
    .eq('user_id', userId).gte('day', since).order('day', { ascending: true }).limit(20000);
  if (error) throw new Error('metric_read_failed');
  return (data || []).map((r) => ({ ...r, value: Number(r.value) }));
}

export { NOTICE_VERSION };
