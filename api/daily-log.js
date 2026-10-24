/**
 * Her daily log and tries, synced from her devices.
 *
 *   GET  ?from=YYYY-MM-DD&to=YYYY-MM-DD   her log entries in range (default the last 400 days) and all her tries
 *   POST { entries: [...], tries: [...] }  upsert; merged with what's stored, newest per field-day / per try wins
 *
 * - Signed-in accounts only (guests are refused by verifyUserWithRls).
 * - Runs with her own JWT and the public key, never the service role, so the
 *   owner-only RLS in supabase/daily_log_2026-10-24.sql applies on top of
 *   the checks here.
 * - Provenance is fixed server-side: source 'self_report', method 'manual'.
 * - If the tables don't exist yet (SQL not run), answers 503 { error: 'not_ready' }
 *   and the client keeps everything on the device and retries later.
 * - Rate limited per account. Responses are private and never cached.
 * - Values are never logged and never go to analytics.
 */
import { verifyUserWithRls } from './_userScopedSupabase.js';
import { rateLimit } from './_rateLimit.js';
import { addDays, isDay, LOG_FIELD_IDS, LOG_METHOD, LOG_SOURCE, mergeLogs, normalizeEntry } from '../src/health/dailyLog.js';
import { mergeTries, normalizeTry } from '../src/health/outcomes.js';

const MAX_ENTRIES = 400;
const MAX_TRIES = 200;
const MAX_RANGE_DAYS = 731;
const DEFAULT_DAYS = 400;
const CLOCK_SKEW_MS = 5 * 60 * 1000;

const LOG_COLUMNS = `day, ${LOG_FIELD_IDS.join(', ')}, field_at, updated_at`;
const TRY_COLUMNS = 'id, kind, ref, need, intervention_kind, started_day, horizon_days, outcome, recorded_day, note, removed, updated_at';

export function isMissingSchema(error) {
  const code = String(error?.code || '');
  return ['42P01', '42703', 'PGRST200', 'PGRST204', 'PGRST205'].includes(code)
    || /does not exist|schema cache|could not find the (table|column)/i.test(String(error?.message || ''));
}

class DbError extends Error {
  constructor(error) { super('db'); this.db = error; }
}

/** A device clock far in the future must not win every merge forever. */
function clampStamp(iso, nowMs) {
  return Date.parse(iso) > nowMs + CLOCK_SKEW_MS ? new Date(nowMs).toISOString() : iso;
}

export function cleanEntries(list, nowMs = Date.now()) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const raw of list.slice(0, MAX_ENTRIES)) {
    const e = normalizeEntry(raw);
    if (!e) continue;
    e.updatedAt = clampStamp(e.updatedAt, nowMs);
    if (e.fieldAt) for (const k of Object.keys(e.fieldAt)) e.fieldAt[k] = clampStamp(e.fieldAt[k], nowMs);
    out.push(e);
  }
  return out;
}

export function cleanTries(list, nowMs = Date.now()) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const raw of list.slice(0, MAX_TRIES)) {
    const t = normalizeTry(raw);
    if (!t) continue;
    t.updatedAt = clampStamp(t.updatedAt, nowMs);
    out.push(t);
  }
  return out;
}

export function rowToEntry(r) {
  return normalizeEntry({ ...r, updatedAt: r.updated_at, fieldAt: r.field_at });
}

export function entryToRow(e, userId) {
  const row = { user_id: userId, day: e.day, field_at: e.fieldAt || {}, source: LOG_SOURCE, method: LOG_METHOD, updated_at: e.updatedAt, synced_at: new Date().toISOString() };
  for (const id of LOG_FIELD_IDS) row[id] = e[id];
  return row;
}

export function rowToTry(r) {
  return normalizeTry({
    id: r.id, kind: r.kind, ref: r.ref, need: r.need, interventionKind: r.intervention_kind, startedDay: r.started_day,
    horizonDays: r.horizon_days, outcome: r.outcome, recordedDay: r.recorded_day, note: r.note, removed: r.removed === true, updatedAt: r.updated_at,
  });
}

export function tryToRow(t, userId) {
  return {
    user_id: userId, id: t.id, kind: t.kind, ref: t.ref, need: t.need, intervention_kind: t.interventionKind || null,
    started_day: t.startedDay, horizon_days: t.horizonDays, outcome: t.outcome, recorded_day: t.recordedDay, note: t.note,
    removed: t.removed === true, source: LOG_SOURCE, method: LOG_METHOD, updated_at: t.updatedAt, synced_at: new Date().toISOString(),
  };
}

async function q(promise) {
  const { data, error } = await promise;
  if (error) throw new DbError(error);
  return data || [];
}

async function saveEntries(client, userId, entries) {
  if (!entries.length) return 0;
  const days = entries.map((e) => e.day);
  const existing = await q(client.from('user_daily_log').select(LOG_COLUMNS).eq('user_id', userId).in('day', days));
  const merged = mergeLogs(existing.map(rowToEntry).filter(Boolean), entries);
  const rows = days.filter((d, i) => days.indexOf(d) === i).map((d) => entryToRow(merged[d], userId));
  await q(client.from('user_daily_log').upsert(rows, { onConflict: 'user_id,day' }));
  return rows.length;
}

async function saveTries(client, userId, tries) {
  if (!tries.length) return 0;
  const ids = [...new Set(tries.map((t) => t.id))];
  const existing = await q(client.from('user_tries').select(TRY_COLUMNS).eq('user_id', userId).in('id', ids));
  const merged = mergeTries(existing.map(rowToTry).filter(Boolean), tries);
  const rows = ids.map((id) => tryToRow(merged[id], userId));
  await q(client.from('user_tries').upsert(rows, { onConflict: 'user_id,id' }));
  return rows.length;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { user, error: authError, client } = await verifyUserWithRls(req);
  if (authError || !user || !client) {
    const status = authError === 'auth_required' || authError === 'invalid_session' ? 401 : 503;
    return res.status(status).json({ error: authError || 'auth_required' });
  }
  const userId = user.id;

  const limited = await rateLimit(`daily-log:${req.method}:${userId}`, { max: 120, windowSec: 3600 });
  if (!limited.ok) {
    if (limited.retryAfterSec) res.setHeader('Retry-After', String(limited.retryAfterSec));
    return res.status(429).json({ error: 'rate_limited' });
  }

  try {
    if (req.method === 'GET') {
      const today = new Date().toISOString().slice(0, 10);
      const to = isDay(req.query?.to) ? req.query.to : today;
      let from = isDay(req.query?.from) ? req.query.from : addDays(to, -DEFAULT_DAYS);
      if (from > to) return res.status(400).json({ error: 'bad_range' });
      if (addDays(from, MAX_RANGE_DAYS) < to) from = addDays(to, -MAX_RANGE_DAYS);
      const [logRows, tryRows] = await Promise.all([
        q(client.from('user_daily_log').select(LOG_COLUMNS).eq('user_id', userId).gte('day', from).lte('day', to).order('day', { ascending: true })),
        q(client.from('user_tries').select(TRY_COLUMNS).eq('user_id', userId).order('started_day', { ascending: true })),
      ]);
      return res.status(200).json({ entries: logRows.map(rowToEntry).filter(Boolean), tries: tryRows.map(rowToTry).filter(Boolean) });
    }

    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'bad_request' }); }
    }
    if ((body.entries != null && !Array.isArray(body.entries)) || (body.tries != null && !Array.isArray(body.tries))) {
      return res.status(400).json({ error: 'bad_request' });
    }
    if ((body.entries?.length || 0) > MAX_ENTRIES || (body.tries?.length || 0) > MAX_TRIES) return res.status(413).json({ error: 'too_many' });
    const nowMs = Date.now();
    const entries = cleanEntries(body.entries, nowMs);
    const tries = cleanTries(body.tries, nowMs);
    const savedEntries = await saveEntries(client, userId, entries);
    const savedTries = await saveTries(client, userId, tries);
    return res.status(200).json({
      ok: true,
      saved: { entries: savedEntries, tries: savedTries },
      rejected: { entries: (body.entries?.length || 0) - entries.length, tries: (body.tries?.length || 0) - tries.length },
    });
  } catch (e) {
    if (e instanceof DbError && isMissingSchema(e.db)) return res.status(503).json({ error: 'not_ready' });
    console.error('[daily-log] failed:', e instanceof DbError ? e.db?.code : e?.message);
    return res.status(500).json({ error: 'daily_log_failed' });
  }
}
