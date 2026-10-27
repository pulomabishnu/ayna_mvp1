/**
 * "Your month" (MonthSheet.jsx): the calendar's day markers, from her own data
 * only. At most ONE marker per day, plus "today" (founder: calm, not crowded):
 *
 *   period     a logged period (or bleed) day: her synced flow rows, or her own log (light or more)
 *   estimated  her next period from the existing cycle estimate (insights.js), never a logged day
 *   checkin    a day she checked in (any field in her daily log)
 *
 * Precedence: period, then estimated, then checkin. Days are 'YYYY-MM-DD'.
 */
import { resolveDaily, series } from './dedupe.js';
import { addDays, daysBetweenDays, FLOW_RANK, LOG_FIELDS } from './dailyLog.js';

/** Logged period days: synced flow (level 1 or more) and her own log's flow (light, medium, heavy; spotting is not a period day). */
export function periodDaySet({ rows = [], log = {} } = {}) {
  const out = new Set();
  for (const p of series(resolveDaily(rows || []), 'menstrual_flow')) if (p.value >= 1) out.add(p.day);
  for (const [day, e] of Object.entries(log || {})) if (e && FLOW_RANK[e.flow] >= FLOW_RANK.light) out.add(day);
  return out;
}

/** Days with any check-in answer (null means "not logged"; 0 / "none" are real answers). */
export function checkinDaySet(log = {}) {
  const out = new Set();
  for (const [day, e] of Object.entries(log || {})) if (e && LOG_FIELDS.some((f) => e[f.id] != null)) out.add(day);
  return out;
}

/**
 * The estimated next period: from estimate.day for her own last period length
 * (1 to 8 days; 1 when unknown). Only today or later, never over a logged day.
 */
export function estimatedDaySet(estimate, { today, periodLength = 0, logged = new Set() } = {}) {
  const out = new Set();
  if (!estimate?.day || !today || daysBetweenDays(today, estimate.day) < 0) return out;
  const n = Math.max(1, Math.min(8, Math.round(periodLength) || 1));
  for (let i = 0; i < n; i += 1) {
    const d = addDays(estimate.day, i);
    if (d >= today && !logged.has(d)) out.add(d);
  }
  return out;
}

/** The one marker a day gets. */
export function dayMark(day, { period = new Set(), estimated = new Set(), checkin = new Set() } = {}) {
  if (period.has(day)) return 'period';
  if (estimated.has(day)) return 'estimated';
  if (checkin.has(day)) return 'checkin';
  return null;
}

const pad = (n) => String(n).padStart(2, '0');
export const monthKey = (iso) => iso.slice(0, 7);
export function shiftMonth(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}`;
}

/**
 * The month's cells, Sunday first: leading blanks (null), then one cell per day
 * with its single marker and whether it is today or in the future.
 */
export function monthCells(ym, { today, period, estimated, checkin } = {}) {
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const len = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = Array.from({ length: first }, () => null);
  for (let d = 1; d <= len; d += 1) {
    const day = `${ym}-${pad(d)}`;
    cells.push({ day, n: d, mark: dayMark(day, { period, estimated, checkin }), today: day === today, future: Boolean(today) && day > today });
  }
  return cells;
}

/** Which legend items this month actually shows (max 3, in a fixed order). */
export function legendFor(cells, { hormonalBC = false } = {}) {
  const has = new Set(cells.filter(Boolean).map((c) => c.mark));
  return [
    has.has('period') && { id: 'period', label: hormonalBC ? 'Bleed' : 'Period' },
    has.has('estimated') && { id: 'estimated', label: 'Estimated' },
    has.has('checkin') && { id: 'checkin', label: 'Checked in' },
  ].filter(Boolean);
}

const fieldWords = (e) => LOG_FIELDS
  .filter((f) => e?.[f.id] != null && !(f.id === 'flow' && e.flow === 'none'))
  .map((f) => `${f.label} ${String(f.options[f.values.indexOf(e[f.id])] || '').toLowerCase()}`)
  .filter((s) => !/ $/.test(s));

/**
 * One tapped day in plain lines (one line each): what she logged, the
 * estimate, and any coming-up item on that day. Nothing is made up.
 */
export function dayLines(day, { mark = null, log = {}, coming = [], hormonalBC = false, today } = {}) {
  const lines = [];
  const word = hormonalBC ? 'Bleed' : 'Period';
  if (mark === 'period') lines.push(`${word} logged`);
  const words = fieldWords(log?.[day]);
  if (words.length) lines.push(`Checked in: ${words.join(', ')}`);
  if (mark === 'estimated') lines.push(`${word} expected, estimated`);
  for (const c of coming) if (c.day === day && !(mark === 'estimated' && /estimated/i.test(c.title))) lines.push(c.title);
  if (!lines.length) lines.push(today && day > today ? 'Nothing planned' : 'Nothing logged');
  return lines;
}

/**
 * Coming up for the sheet (max 3): the existing comingUp() items she can act
 * on (restock, next period), without the ovulation range (a calm calendar;
 * the Cycle tab still explains it). With hormonal birth control: "bleed".
 */
export function monthComing(items = [], { hormonalBC = false, max = 3 } = {}) {
  return items
    .filter((c) => !/ovulation/i.test(c.title))
    .map((c) => (hormonalBC ? { ...c, title: c.title.replace(/period/gi, (w) => (w[0] === 'P' ? 'Bleed' : 'bleed')) } : c))
    .slice(0, max);
}
