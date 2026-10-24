/**
 * "Upload health data": read an export the person picked and turn it into
 * CANDIDATE daily rows she reviews before anything is saved.
 *
 * Runs entirely in the browser/app. The file itself is never uploaded or
 * stored; only the rows she confirms are sent to the server.
 *
 * Supported:
 *   CSV  - a date column plus columns we recognize by name (sleep, steps,
 *          resting heart rate, HRV, temperature, period/flow...)
 *   JSON - an array of records (or { data: [...] }) with a date field and the
 *          same kinds of fields; period start/end ranges (e.g. a cycle-app export)
 *   TXT  - lines like "2026-10-01 sleep 7h 20m" or "Oct 1, 2026: 8,400 steps"
 *
 * Never guesses a diagnosis, never invents a value: anything it can't read is
 * counted as "not recognized" and shown to her as such.
 */
import { METRICS, FLOW_LEVELS } from './metrics.js';

const MAX_ROWS = 2000;

/* ------------------------------- date parsing ------------------------------ */
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n) => String(n).padStart(2, '0');

export function parseDay(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return valid(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); // US m/d/yyyy
  if (m) return valid(+m[3], +m[1], +m[2]);
  m = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (m && MONTHS[m[1].slice(0, 3).toLowerCase()]) return valid(+m[3], MONTHS[m[1].slice(0, 3).toLowerCase()], +m[2]);
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})/);
  if (m && MONTHS[m[2].slice(0, 3).toLowerCase()]) return valid(+m[3], MONTHS[m[2].slice(0, 3).toLowerCase()], +m[1]);
  return null;
}
function valid(y, mo, d) {
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const iso = `${y}-${pad(mo)}-${pad(d)}`;
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) || new Date(t).getUTCDate() !== d ? null : iso;
}

/* ------------------------------ value parsing ------------------------------ */
/** "7h 20m", "7:20", "440 min", "7.3 hours" -> minutes */
export function parseDuration(raw) {
  const s = String(raw).toLowerCase().trim();
  let m = s.match(/^(\d{1,2})\s*h(?:ours?|rs?)?\s*(\d{1,2})?\s*m?(?:in(?:utes?)?)?$/);
  if (m) return +m[1] * 60 + (m[2] ? +m[2] : 0);
  m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return +m[1] * 60 + +m[2];
  m = s.match(/^(\d+(?:\.\d+)?)\s*(?:h|hours?|hrs?)$/);
  if (m) return Math.round(+m[1] * 60);
  m = s.match(/^(\d+(?:\.\d+)?)\s*(?:m|min|mins|minutes?)?$/);
  if (m) return Math.round(+m[1]);
  return null;
}
const num = (raw) => {
  const m = String(raw).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
};
/** Celsius from "36.6", "36.6 °C", "97.9 F" */
export function parseTempC(raw) {
  const s = String(raw);
  const v = num(s);
  if (v == null) return null;
  if (/°?\s*f\b|fahrenheit/i.test(s) || v > 50) return Math.round(((v - 32) * 5 / 9) * 100) / 100;
  return v;
}
export function parseFlow(raw) {
  const s = String(raw).toLowerCase().trim();
  if (/heavy|high|super/.test(s)) return FLOW_LEVELS.heavy;
  if (/medium|moderate|normal/.test(s)) return FLOW_LEVELS.medium;
  if (/light|low|spotting/.test(s)) return FLOW_LEVELS.light;
  if (/^(none|no|0|false)$/.test(s)) return FLOW_LEVELS.none;
  if (/^(yes|true|1|period|bleeding|flow)$/.test(s)) return FLOW_LEVELS.unspecified;
  return null;
}

/* ------------------------- field name -> metric map ------------------------ */
const FIELD_RULES = [
  { re: /(readiness)/, metric: 'readiness_score', parse: num },
  // Scores, goals and percentages are not durations or counts: never read "sleep score 82" as 82 minutes.
  { re: /(score|efficiency|latency|quality|goal|target|percent|%)/, metric: null },
  { re: /^(deep[\s_-]?sleep)/, metric: 'sleep_deep_minutes', parse: parseDuration },
  { re: /^(rem[\s_-]?sleep|rem)$/, metric: 'sleep_rem_minutes', parse: parseDuration },
  { re: /(sleep|asleep|time[\s_-]?asleep|total[\s_-]?sleep)/, metric: 'sleep_minutes', parse: parseDuration },
  { re: /(resting[\s_-]?(heart|hr)|rhr)/, metric: 'resting_hr_bpm', parse: num },
  { re: /(hrv|heart[\s_-]?rate[\s_-]?variability)/, metric: 'hrv_rmssd_ms', parse: num, note: 'HRV method unknown; saved as RMSSD unless you change it' },
  { re: /(avg|average)[\s_-]?(heart|hr)|^heart[\s_-]?rate$/, metric: 'hr_avg_bpm', parse: num },
  { re: /(basal|bbt)/, metric: 'basal_temp_c', parse: parseTempC },
  { re: /(temp(erature)?[\s_-]?(deviation|change|diff))/, metric: 'temp_deviation_c', parse: num },
  { re: /(skin|wrist)[\s_-]?temp/, metric: 'skin_temp_night_c', parse: parseTempC },
  { re: /^steps?$|step[\s_-]?count|daily[\s_-]?steps/, metric: 'steps', parse: num },
  { re: /(active[\s_-]?(energy|calories|kcal))/, metric: 'active_energy_kcal', parse: num },
  { re: /(workout|exercise|training)[\s_-]?(min|time|duration)/, metric: 'workout_minutes', parse: parseDuration },
  { re: /(flow|bleeding|menstruation|period|menses)/, metric: 'menstrual_flow', parse: parseFlow },
];

export function metricForField(field) {
  const f = String(field || '').toLowerCase().trim();
  const rule = FIELD_RULES.find((r) => r.re.test(f));
  return rule?.metric ? rule : null;
}

const DATE_KEYS = /^(date|day|calendar[\s_-]?date|summary[\s_-]?date|start[\s_-]?date|timestamp)$/i;

function candidate(rule, day, raw, origin) {
  const value = rule.parse(raw);
  if (value == null || !Number.isFinite(value)) return null;
  const def = METRICS[rule.metric];
  if (value < def.min || value > def.max) return null;
  return { metric: rule.metric, day, value, label: def.label, unit: def.unit, raw: String(raw).slice(0, 40), note: rule.note || null, origin };
}

/* ---------------------------------- CSV ---------------------------------- */
function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') { if (quoted && line[i + 1] === '"') { cur += '"'; i += 1; } else quoted = !quoted; }
    else if ((ch === ',' || ch === ';' || ch === '\t') && !quoted) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseCsv(text, origin) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { candidates: [], unrecognized: 0, error: 'empty' };
  const header = splitCsvLine(lines[0]);
  const dateIdx = header.findIndex((h) => DATE_KEYS.test(h.trim()));
  if (dateIdx === -1) return { candidates: [], unrecognized: lines.length - 1, error: 'no_date_column' };
  const rules = header.map((h, i) => (i === dateIdx ? null : metricForField(h)));
  const candidates = [];
  let unrecognized = 0;
  for (const line of lines.slice(1, MAX_ROWS + 1)) {
    const cells = splitCsvLine(line);
    const day = parseDay(cells[dateIdx]);
    if (!day) { unrecognized += 1; continue; }
    rules.forEach((rule, i) => {
      if (!rule || cells[i] == null || cells[i] === '') return;
      const c = candidate(rule, day, cells[i], origin);
      if (c) candidates.push(c); else unrecognized += 1;
    });
  }
  return { candidates, unrecognized, ignoredColumns: header.filter((h, i) => i !== dateIdx && !rules[i]) };
}

/* ---------------------------------- JSON --------------------------------- */
function eachDay(start, end, cap = 14) {
  const out = [];
  let t = Date.parse(`${start}T00:00:00Z`);
  const stop = Date.parse(`${end}T00:00:00Z`);
  while (t <= stop && out.length < cap) { out.push(new Date(t).toISOString().slice(0, 10)); t += 86400000; }
  return out;
}

function findRecords(json) {
  if (Array.isArray(json)) return json;
  if (json && typeof json === 'object') {
    for (const key of ['data', 'records', 'days', 'entries', 'items', 'cycles', 'periods']) if (Array.isArray(json[key])) return json[key];
    const arrays = Object.values(json).filter(Array.isArray).sort((a, b) => b.length - a.length);
    if (arrays.length) return arrays[0];
  }
  return [];
}

function parseJson(text, origin) {
  let json;
  try { json = JSON.parse(text); } catch { return { candidates: [], unrecognized: 0, error: 'invalid_json' }; }
  const records = findRecords(json).slice(0, MAX_ROWS);
  const candidates = [];
  let unrecognized = 0;
  for (const rec of records) {
    if (!rec || typeof rec !== 'object') { unrecognized += 1; continue; }
    const keys = Object.keys(rec);
    // Period ranges: { start: '2026-09-01', end: '2026-09-05' } or period_start/period_end.
    const startKey = keys.find((k) => /^(period[\s_-]?)?start([\s_-]?date)?$/i.test(k));
    const endKey = keys.find((k) => /^(period[\s_-]?)?end([\s_-]?date)?$/i.test(k));
    const looksLikePeriod = startKey && endKey && (keys.some((k) => /period|menstru|bleed|cycle/i.test(k)) || /period|cycle|flo|clue/i.test(origin || ''));
    if (looksLikePeriod) {
      const s = parseDay(rec[startKey]);
      const e = parseDay(rec[endKey]);
      if (s && e && e >= s) {
        for (const d of eachDay(s, e)) candidates.push({ metric: 'menstrual_flow', day: d, value: FLOW_LEVELS.unspecified, label: METRICS.menstrual_flow.label, unit: 'flow_level', raw: `${s} to ${e}`, note: null, origin });
      } else unrecognized += 1;
      continue;
    }
    const dateKey = keys.find((k) => DATE_KEYS.test(k));
    const day = dateKey ? parseDay(rec[dateKey]) : null;
    if (!day) { unrecognized += 1; continue; }
    let any = false;
    for (const k of keys) {
      if (k === dateKey) continue;
      const rule = metricForField(k);
      if (!rule) continue;
      const c = candidate(rule, day, rec[k], origin);
      if (c) { candidates.push(c); any = true; }
    }
    if (!any) unrecognized += 1;
  }
  return { candidates, unrecognized };
}

/* ---------------------------------- TXT ---------------------------------- */
function parseTxt(text, origin) {
  const candidates = [];
  let unrecognized = 0;
  for (const line of text.split(/\r?\n/).slice(0, MAX_ROWS)) {
    const l = line.trim();
    if (!l) continue;
    const dateMatch = l.match(/^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\.?\s+\d{4})/);
    const day = dateMatch ? parseDay(dateMatch[1]) : null;
    if (!day) { unrecognized += 1; continue; }
    const rest = l.slice(dateMatch[0].length).replace(/^[\s:,-]+/, '');
    // "<label> <value>" or "<value> <label>"
    const m1 = rest.match(/^([A-Za-z][A-Za-z \-_]+?)[\s:]+(.+)$/);
    const m2 = rest.match(/^([\d.,:]+\s*(?:h|hours?|hrs?|m|min|minutes?|bpm|ms|°?[cf])?(?:\s*\d+\s*m(?:in)?)?)\s+([A-Za-z][A-Za-z \-_]+)$/i);
    let c = null;
    if (m1) { const rule = metricForField(m1[1]); if (rule) c = candidate(rule, day, m1[2], origin); }
    if (!c && m2) { const rule = metricForField(m2[2]); if (rule) c = candidate(rule, day, m2[1], origin); }
    if (c) candidates.push(c); else unrecognized += 1;
  }
  return { candidates, unrecognized };
}

/* --------------------------------- entry --------------------------------- */
export function fileKind(name = '', type = '') {
  const n = name.toLowerCase();
  if (/\.csv$/.test(n) || type === 'text/csv') return 'csv';
  if (/\.json$/.test(n) || type === 'application/json') return 'json';
  if (/\.txt$/.test(n) || type === 'text/plain') return 'txt';
  if (/\.(png|jpe?g|heic|webp)$/.test(n) || type.startsWith('image/')) return 'image';
  if (/\.pdf$/.test(n) || type === 'application/pdf') return 'pdf';
  return null;
}

/** Slug for the app she says the file came from: 'Flo' -> 'flo'. */
export function originFor(declaredApp) {
  const s = String(declaredApp || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  return s || 'manual_import';
}

/**
 * @returns {{ kind, candidates: Array, unrecognized: number, error?: string }}
 * Duplicate (metric, day) candidates keep the first value, so one file can't
 * double count a day either.
 */
export function parseHealthFile({ name, type = '', text, declaredApp }) {
  const kind = fileKind(name, type);
  const origin = originFor(declaredApp);
  if (!kind) return { kind: null, candidates: [], unrecognized: 0, error: 'unsupported_file' };
  if (kind === 'image' || kind === 'pdf') return { kind, candidates: [], unrecognized: 0, error: 'needs_extraction' };
  if (typeof text !== 'string' || !text.trim()) return { kind, candidates: [], unrecognized: 0, error: 'empty' };
  if (text.length > 20 * 1024 * 1024) return { kind, candidates: [], unrecognized: 0, error: 'too_large' };
  const out = kind === 'csv' ? parseCsv(text, origin) : kind === 'json' ? parseJson(text, origin) : parseTxt(text, origin);
  const seen = new Set();
  const candidates = out.candidates.filter((c) => {
    const key = `${c.metric}|${c.day}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { kind, ...out, candidates };
}

/** Categories a set of candidates would need consent for. */
export function categoriesFor(candidates) {
  return [...new Set(candidates.map((c) => METRICS[c.metric]?.category).filter(Boolean))];
}

/**
 * What ayna found in a file, in words (team direction 44): one line per kind
 * of data with how many days and the date range. Describes the file only;
 * never interprets a value, never a diagnosis.
 * @returns {Array<{ metric, label, days, from, to, line }>}
 */
export function foundSummary(rows) {
  const fmt = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const by = new Map();
  for (const r of rows || []) {
    if (!METRICS[r?.metric] || !r.day) continue;
    const g = by.get(r.metric) || { metric: r.metric, label: METRICS[r.metric].label, days: new Set() };
    g.days.add(r.day);
    by.set(r.metric, g);
  }
  return [...by.values()].map((g) => {
    const days = [...g.days].sort();
    const from = days[0]; const to = days[days.length - 1];
    const n = days.length;
    const range = from === to ? `on ${fmt(from)}` : `from ${fmt(from)} to ${fmt(to)}`;
    return { metric: g.metric, label: g.label, days: n, from, to, line: `${g.label}: ${n} ${n === 1 ? 'day' : 'days'} ${range}` };
  });
}
