/**
 * Connected health data: one authenticated route for everything that isn't an
 * OAuth redirect (those are in api/health-oauth.js).
 *
 *   GET                                 her connections + last 120 days of daily rows
 *   POST { action: 'connect', source, categories, platform }    turn on a phone source (consent logged)
 *   POST { action: 'update', source, categories }               change what she shares (removed categories are deleted)
 *   POST { action: 'pause' | 'resume', source }                 stop / restart syncing, keep data
 *   POST { action: 'disconnect', source, deleteData }           stop syncing; optionally delete what ayna stored
 *   POST { action: 'sync', source, rows }                       daily rows from Apple Health / Health Connect
 *   POST { action: 'import', declaredApp, fileKind, categories, rows }   rows she confirmed from an upload
 *   POST { action: 'delete_all' }                               delete every health row ayna holds for her
 *   POST { action: 'request_source', name, note }               "Request another app or wearable"
 *   POST { action: 'records_saved' | 'records_deleted', types, count }
 *        Apple Health Records consent log. The records stay on her phone;
 *        only the record TYPES and a count are logged, never a name.
 *
 * Responses never echo health values back except on GET (her own data, to her).
 * Health data never goes to analytics, logs, LLMs or brands from here.
 */
import { sendSuggestionEmail, TEAM_EMAILS } from './suggestions.js';
import { verifyUser } from './_usageLimit.js';
import { rateLimit } from './_rateLimit.js';
import {
  deleteSourceData, getConnection, listConnections, logHealthError, readMetrics, recordEvent,
  saveMetrics, sanitizeCategories, setConnectionState, upsertConnection,
} from './_healthStore.js';
import { revokeProvider } from './_healthProviders.js';
import { sendTeamAlert } from './_twilio.js';

const DEVICE_SOURCES = new Set(['apple_health', 'health_connect']);
const RECORD_TYPES = new Set(['allergy', 'condition', 'medication']);
const OAUTH_SOURCES = new Set(['oura', 'whoop', 'strava', 'garmin']);
const ALL_SOURCES = new Set([...DEVICE_SOURCES, ...OAUTH_SOURCES, 'manual_import']);
const MAX_ROWS = 5000;

function privateHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

const cleanText = (v, max) => (typeof v === 'string' ? [...v].filter((ch) => ch.charCodeAt(0) >= 32).join('').replace(/\s+/g, ' ').trim().slice(0, max) : '');

export default async function handler(req, res) {
  privateHeaders(res);
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const { user, error, admin } = await verifyUser(req);
  if (error || !user || !admin) {
    return res.status(error === 'server_misconfigured' || error === 'auth_error' ? 503 : 401).json({ error: error || 'auth_required' });
  }
  const userId = user.id;

  try {
    if (req.method === 'GET') {
      const [connections, rows] = await Promise.all([listConnections(admin, userId), readMetrics(admin, userId)]);
      return res.status(200).json({ connections, rows });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const action = String(body.action || '');
    const source = String(body.source || '');

    if (action === 'records_saved' || action === 'records_deleted') {
      const types = [...new Set((Array.isArray(body.types) ? body.types : []).filter((t) => RECORD_TYPES.has(t)))];
      const count = Number.isInteger(body.count) && body.count >= 0 && body.count <= 1000 ? body.count : null;
      if (action === 'records_saved' && !types.length) return res.status(400).json({ error: 'no_types' });
      await recordEvent(admin, userId, 'apple_health_records', action, { categories: types, platform: 'ios', rowsAffected: count });
      return res.status(200).json({ ok: true });
    }

    if (action === 'request_source') {
      const name = cleanText(body.name, 60);
      const note = cleanText(body.note, 280) || null;
      if (!name) return res.status(400).json({ error: 'name_required' });
      const limited = await rateLimit(`health-req:${userId}`, { max: 10, windowSec: 86400 });
      if (!limited.ok) return res.status(429).json({ error: 'rate_limited' });
      const { error: insertError } = await admin.from('health_source_requests').insert({ user_id: userId, source_name: name, note });
      if (insertError) throw new Error('request_save_failed');
      // Tell the founders. Only what she typed; no name, email or health data.
      // Saved either way: an email failure never loses the request.
      const emailed = await sendSuggestionEmail(sourceRequestEmail({ name, note }));
      // And a short team text (no identity, no note). Never fails the request.
      await sendTeamAlert(`new app or wearable request: ${name}`);
      return res.status(200).json({ ok: true, emailed });
    }

    if (action === 'delete_all') {
      if (body.confirm !== 'DELETE') return res.status(400).json({ error: 'confirmation_required' });
      const connections = await listConnections(admin, userId);
      for (const c of connections) {
        if (OAUTH_SOURCES.has(c.source)) await revokeProvider(admin, userId, c.source).catch((e) => logHealthError('delete_all.revoke', e?.message));
      }
      const { count, error: delError } = await admin.from('health_daily_metrics').delete({ count: 'exact' }).eq('user_id', userId);
      if (delError) throw new Error('metric_delete_failed');
      const { error: importError } = await admin.from('health_imports').delete().eq('user_id', userId);
      if (importError) throw new Error('import_delete_failed');
      // Connections go too, so nothing re-uploads on the next auto-sync.
      const { error: connError } = await admin.from('health_connections').delete().eq('user_id', userId);
      if (connError) throw new Error('connection_delete_failed');
      await recordEvent(admin, userId, 'all', 'all_data_deleted', { rowsAffected: count || 0 });
      return res.status(200).json({ ok: true, deleted: count || 0 });
    }

    if (!ALL_SOURCES.has(source) && action !== 'import') return res.status(400).json({ error: 'unknown_source' });

    if (action === 'connect') {
      if (!DEVICE_SOURCES.has(source)) return res.status(400).json({ error: OAUTH_SOURCES.has(source) ? 'use_oauth' : 'unsupported' });
      const categories = sanitizeCategories(body.categories);
      if (!categories.length) return res.status(400).json({ error: 'no_categories' });
      const platform = body.platform === 'ios' || body.platform === 'android' ? body.platform : null;
      if ((source === 'apple_health' && platform !== 'ios') || (source === 'health_connect' && platform !== 'android')) {
        return res.status(400).json({ error: 'wrong_platform' });
      }
      const out = await upsertConnection(admin, userId, source, { categories, platform });
      return res.status(200).json({ ok: true, ...out });
    }

    if (action === 'update') {
      const existing = await getConnection(admin, userId, source);
      if (!existing || existing.status === 'disconnected') return res.status(404).json({ error: 'not_connected' });
      const categories = sanitizeCategories(body.categories);
      if (!categories.length) return res.status(400).json({ error: 'no_categories' });
      const out = await upsertConnection(admin, userId, source, { categories, platform: existing.platform, status: existing.status === 'paused' ? 'paused' : 'connected' });
      return res.status(200).json({ ok: true, ...out });
    }

    if (action === 'pause' || action === 'resume') {
      const existing = await getConnection(admin, userId, source);
      if (!existing || existing.status === 'disconnected') return res.status(404).json({ error: 'not_connected' });
      await setConnectionState(admin, userId, source, action === 'pause' ? { sync_enabled: false, status: 'paused' } : { sync_enabled: true, status: 'connected' });
      await recordEvent(admin, userId, source, action === 'pause' ? 'sync_paused' : 'sync_resumed', { categories: existing.categories });
      return res.status(200).json({ ok: true });
    }

    if (action === 'disconnect') {
      const existing = await getConnection(admin, userId, source);
      const deleteData = body.deleteData === true;
      let revoked = null;
      if (OAUTH_SOURCES.has(source)) {
        revoked = await revokeProvider(admin, userId, source).then(() => true).catch((e) => { logHealthError('disconnect.revoke', e?.message); return false; });
      }
      if (existing) {
        await setConnectionState(admin, userId, source, { status: 'disconnected', sync_enabled: false, categories: [], last_synced_at: null });
        await recordEvent(admin, userId, source, 'consent_withdrawn', { categories: existing.categories });
      }
      let deleted = 0;
      if (deleteData) {
        deleted = await deleteSourceData(admin, userId, source);
        await recordEvent(admin, userId, source, 'data_deleted', { rowsAffected: deleted });
      }
      return res.status(200).json({ ok: true, deleted, revoked, systemSettingsReminder: DEVICE_SOURCES.has(source) });
    }

    if (action === 'sync') {
      if (!DEVICE_SOURCES.has(source)) return res.status(400).json({ error: 'server_syncs_this_source' });
      const limited = await rateLimit(`health-sync:${userId}:${source}`, { max: 30, windowSec: 3600 });
      if (!limited.ok) return res.status(429).json({ error: 'rate_limited' });
      if (!Array.isArray(body.rows) || body.rows.length > MAX_ROWS) return res.status(400).json({ error: 'bad_rows' });
      const result = await saveMetrics(admin, userId, source, body.rows);
      if (result.saved > 0) await setConnectionState(admin, userId, source, { last_synced_at: new Date().toISOString(), last_error_code: null });
      return res.status(200).json({ ok: true, saved: result.saved, rejected: result.errors });
    }

    if (action === 'import') {
      const limited = await rateLimit(`health-import:${userId}`, { max: 20, windowSec: 86400 });
      if (!limited.ok) return res.status(429).json({ error: 'rate_limited' });
      if (!Array.isArray(body.rows) || !body.rows.length || body.rows.length > MAX_ROWS) return res.status(400).json({ error: 'bad_rows' });
      const categories = sanitizeCategories(body.categories);
      if (!categories.length) return res.status(400).json({ error: 'no_categories' });
      const fileKind = ['image', 'csv', 'json', 'txt', 'pdf', 'manual'].includes(body.fileKind) ? body.fileKind : 'manual';
      const declaredApp = cleanText(body.declaredApp, 60) || null;
      // Upload consent is per import and adds to (never silently widens) earlier upload consent.
      const existing = await getConnection(admin, userId, 'manual_import');
      const merged = sanitizeCategories([...(existing && existing.status !== 'disconnected' ? existing.categories : []), ...categories]);
      await upsertConnection(admin, userId, 'manual_import', { categories: merged, platform: body.platform === 'ios' || body.platform === 'android' ? body.platform : 'web' });
      const { data: imp, error: impError } = await admin.from('health_imports').insert({ user_id: userId, declared_app: declaredApp, file_kind: fileKind }).select('id').single();
      if (impError) throw new Error('import_save_failed');
      const rows = body.rows.map((r) => ({ ...r, method: 'user_entered' }));
      const result = await saveMetrics(admin, userId, 'manual_import', rows, { importId: imp.id });
      await admin.from('health_imports').update({ rows_saved: result.saved }).eq('id', imp.id);
      await setConnectionState(admin, userId, 'manual_import', { last_synced_at: new Date().toISOString() });
      await recordEvent(admin, userId, 'manual_import', 'import_confirmed', { categories, rowsAffected: result.saved });
      return res.status(200).json({ ok: true, saved: result.saved, rejected: result.errors });
    }

    return res.status(400).json({ error: 'unknown_action' });
  } catch (e) {
    logHealthError('health-data', e?.message);
    return res.status(500).json({ error: 'health_data_failed' });
  }
}

const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function sourceRequestEmail({ name, note }) {
  const lines = [['App or wearable', name], ['Note', note]].filter(([, v]) => v);
  return {
    from: process.env.SUGGESTION_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL || 'Ayna <puloma@aynahealth.co>',
    to: TEAM_EMAILS(),
    subject: `App or wearable request: ${name}`,
    text: `Someone asked ayna to connect an app or wearable.\n\n${lines.map(([k, v]) => `${k}: ${v}`).join('\n')}\n`,
    html: `<p>Someone asked ayna to connect an app or wearable.</p><table cellpadding="4">${lines.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join('')}</table>`,
  };
}
