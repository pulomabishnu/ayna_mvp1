/**
 * The parts of the dashboard a data store like Apple Health doesn't do,
 * each computed from her own rows, her quiz and the catalog. Nothing is
 * invented: every block returns null (and is hidden) when its data is thin.
 *
 * - phaseCompare: this phase so far against the SAME cycle days of her last
 *   cycles (Whoop plots metrics by phase; here it is one plain comparison).
 * - normalRanges: her cycle and period lengths next to the FIGO 2018 normal
 *   menstrual parameters ("is this normal?"), never a diagnosis.
 * - goalsCovered: each goal she chose in the quiz, the products in her
 *   Ecosystem graded for it (needMap.research grade), or the best match if
 *   none. Works with no health data at all.
 * - effectChecks: for a sleep product she added herself (it carries
 *   addedAt), her sleep before and since, with the caveat that a before and
 *   after can't show cause.
 */
import { resolveDaily, series } from './dedupe.js';
import { periodStarts, fmtMinutes } from './insights.js';
import { estimatePhase } from './phase.js';
import { fitFor, LEVEL_WORD } from './weekPicks.js';
import { EVIDENCE } from './weekInsights.js';
import { NEED_BY_ID, needPhrase } from '../matching/ontology.js';

const DAY = 86400000;
const toTime = (day) => Date.parse(`${day}T00:00:00Z`);
const isoDay = (t) => new Date(t).toISOString().slice(0, 10);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const fmtDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** FIGO 2018 normal menstrual parameters (non-pregnant, reproductive years), as tabled by the MSD Manual. */
export const FIGO = { label: 'FIGO 2018 normal menstrual parameters (MSD Manual)', url: 'https://www.msdmanuals.com/professional/multimedia/table/normal-menstrual-parameters' };

const COMPARE = [
  { metric: 'resting_hr_bpm', label: 'Resting heart rate', flat: 2, fmt: (v) => `${Math.round(v)} bpm` },
  { metric: 'sleep_minutes', label: 'Sleep', flat: 20, fmt: (v) => fmtMinutes(v) },
  { metric: 'hrv_rmssd_ms', label: 'Heart rate variability', flat: 0.1, pct: true, fmt: (v) => `${Math.round(v)} ms` },
  { metric: 'hrv_sdnn_ms', label: 'Heart rate variability', flat: 0.1, pct: true, fmt: (v) => `${Math.round(v)} ms` },
  { metric: 'temp_deviation_c', label: 'Temperature', flat: 0.15, fmt: (v) => `${v > 0 ? '+' : v < 0 ? '-' : ''}${Math.abs(v).toFixed(2)}\u00a0°C` },
  { metric: 'basal_temp_c', label: 'Temperature', flat: 0.15, fmt: (v) => `${v.toFixed(2)}\u00a0°C` },
];
const PHASE_WORD = { period: 'period', follicular: 'follicular phase', ovulation: 'ovulation window', luteal: 'luteal phase' };

/** First cycle day of the phase she is in now. */
function phaseStartDay(phase, periodLength) {
  if (phase.id === 'period') return 1;
  if (phase.id === 'follicular') return Math.max(periodLength, 1) + 1;
  if (phase.id === 'ovulation') return phase.windowStart;
  return phase.windowEnd + 1;
}

/**
 * @returns null | { title, days: [from, to], cycles, rows: [{ label, now, usual, word }] }
 */
export function phaseCompare(rows, { today, cycle, hormonalBC = false, preferred } = {}) {
  if (hormonalBC || !cycle?.cycleDay || !cycle.lastStart) return null;
  const phase = estimatePhase(cycle);
  if (!phase) return null;
  const from = phaseStartDay(phase, cycle.periodLength || 5);
  const to = cycle.cycleDay;
  if (to - from + 1 < 3) return null;
  const resolved = resolveDaily(rows || [], preferred);
  const starts = periodStarts(series(resolved, 'menstrual_flow')).filter((d) => d < cycle.lastStart);
  const prev = starts.slice(-3).map((s, i, a) => ({ start: s, next: a[i + 1] || cycle.lastStart }));
  if (prev.length < 2) return null;
  const inRange = (pts, start, next) => pts.filter((p) => {
    const t = toTime(p.day);
    return t >= toTime(start) + (from - 1) * DAY && t <= toTime(start) + (to - 1) * DAY && t < toTime(next) && t <= toTime(today);
  }).map((p) => p.value);
  const out = [];
  const seen = new Set();
  for (const c of COMPARE) {
    if (seen.has(c.label)) continue;
    const pts = series(resolved, c.metric);
    if (!pts.length) continue;
    const now = inRange(pts, cycle.lastStart, isoDay(toTime(today) + DAY));
    const past = prev.map((p) => inRange(pts, p.start, p.next)).filter((v) => v.length >= 3).map(mean);
    if (now.length < 3 || past.length < 2) continue;
    seen.add(c.label);
    const n = mean(now);
    const u = mean(past);
    const d = n - u;
    const flat = c.pct ? Math.abs(d) < c.flat * Math.abs(u) : Math.abs(d) < c.flat;
    out.push({ metric: c.metric, label: c.label, now: c.fmt(n), usual: c.fmt(u), word: flat ? 'About the same' : d > 0 ? (c.metric === 'sleep_minutes' ? 'Longer' : 'Higher') : (c.metric === 'sleep_minutes' ? 'Shorter' : 'Lower'), cycles: past.length });
  }
  if (!out.length) return null;
  const cycles = Math.min(...out.map((r) => r.cycles));
  return {
    title: `This ${PHASE_WORD[phase.id]} vs your last ${cycles}`,
    phase: phase.id,
    days: [from, to],
    cycles,
    rows: out,
    note: `Cycle days ${from} to ${to} of this cycle, against the same days of your last ${cycles} cycles. Phase days are an estimate from your period logs.`,
  };
}

/** Days of flow in a row from each period start. */
function periodLengths(flow) {
  const set = new Set(flow.filter((p) => p.value >= 1).map((p) => p.day));
  return periodStarts(flow).map((s) => {
    let n = 0;
    while (n < 15 && set.has(isoDay(toTime(s) + n * DAY))) n += 1;
    return n;
  });
}

/**
 * Her numbers next to the typical ranges. Hidden on hormonal birth control
 * (those bleeds are withdrawal bleeds, not cycles these ranges describe).
 * @returns null | { rows: [{ label, value, typical, ok }], source }
 */
export function normalRanges(rows, { today, hormonalBC = false, preferred } = {}) {
  if (hormonalBC) return null;
  const flow = series(resolveDaily(rows || [], preferred), 'menstrual_flow').filter((p) => !today || p.day <= today);
  const starts = periodStarts(flow);
  const lengths = starts.slice(1).map((d, i) => Math.round((toTime(d) - toTime(starts[i])) / DAY)).filter((n) => n >= 10 && n <= 90).slice(-6);
  const out = [];
  if (lengths.length >= 2) {
    const lo = Math.min(...lengths);
    const hi = Math.max(...lengths);
    out.push({ id: 'length', label: 'Cycle length', value: lo === hi ? `${lo} days` : `${lo} to ${hi} days`, typical: '24 to 38 days', ok: lo >= 24 && hi <= 38 });
    if (lengths.length >= 3) out.push({ id: 'variation', label: 'Change between cycles', value: `${hi - lo} ${hi - lo === 1 ? 'day' : 'days'}`, typical: 'up to 7 to 9 days', ok: hi - lo <= 9 });
  }
  // Only finished periods (the last one may still be going).
  const pl = periodLengths(flow).slice(0, -1).filter((n) => n > 0).slice(-6);
  if (pl.length >= 2) {
    const lo = Math.min(...pl);
    const hi = Math.max(...pl);
    out.push({ id: 'period', label: 'Period length', value: lo === hi ? `${lo} days` : `${lo} to ${hi} days`, typical: 'up to 8 days', ok: hi <= 8 });
  }
  if (!out.length) return null;
  return {
    rows: out,
    count: lengths.length,
    allOk: out.every((r) => r.ok),
    note: out.every((r) => r.ok)
      ? `From your last ${lengths.length || pl.length} logged cycles. Everything is inside the typical ranges.`
      : 'One cycle can fall outside these ranges. If it keeps happening, it is worth mentioning to a clinician.',
    source: FIGO,
  };
}

/** A short name for a goal she chose. */
export function goalLabel(needId) {
  return NEED_BY_ID[needId]?.option || needPhrase(needId);
}

/**
 * Each goal she chose, with what in her Ecosystem is graded for it.
 * @returns Array<{ needId, label, owned: [{ product, level }], match: { product, level } | null }>
 */
export function goalsCovered({ needIds = [], products = [], matches = [], limit = 4 } = {}) {
  const out = [];
  for (const needId of needIds) {
    if (out.length >= limit) break;
    const owned = products.map((p) => ({ product: p, fit: fitFor(p, needId) })).filter((x) => x.fit?.graded)
      .sort((a, b) => b.fit.level - a.fit.level).slice(0, 2).map((x) => ({ product: x.product, level: x.fit.level }));
    const ownedIds = new Set(products.map((p) => p?.id));
    const m = owned.length ? null : matches.filter((p) => !ownedIds.has(p?.id)).map((p) => ({ product: p, fit: fitFor(p, needId) })).filter((x) => x.fit?.graded)
      .sort((a, b) => b.fit.level - a.fit.level)[0];
    if (!owned.length && !m) continue;
    out.push({ needId, label: goalLabel(needId), owned, match: m ? { product: m.product, level: m.fit.level } : null });
  }
  return out;
}

/** Metric that can show a before and after for a product's need. Sleep only: the one place a nightly number maps to the need. */
const EFFECT_METRIC = { 'sleep.trouble': 'sleep_minutes' };

/**
 * Before and since for products she added herself (addedAt) that are graded for sleep.
 * @returns Array<{ product, text, caveat, sources }>
 */
export function effectChecks(rows, { today, products = [], preferred } = {}) {
  const resolved = resolveDaily(rows || [], preferred);
  const out = [];
  for (const p of products) {
    if (!p?.addedAt) continue;
    const added = String(p.addedAt).slice(0, 10);
    for (const [needId, metric] of Object.entries(EFFECT_METRIC)) {
      if (!fitFor(p, needId)?.graded) continue;
      const pts = series(resolved, metric);
      const before = pts.filter((x) => toTime(x.day) >= toTime(added) - 14 * DAY && toTime(x.day) < toTime(added)).map((x) => x.value);
      const after = pts.filter((x) => toTime(x.day) > toTime(added) && toTime(x.day) <= toTime(today)).map((x) => x.value);
      if (before.length < 7 || after.length < 5) continue;
      const b = mean(before);
      const a = mean(after);
      const d = a - b;
      const change = Math.abs(d) < 15 ? 'about the same as' : `${fmtMinutes(d)} ${d > 0 ? 'more than' : 'less than'}`;
      out.push({
        product: p,
        text: `Added ${fmtDay(added)}. Since then you've slept ${fmtMinutes(a)} a night, ${change} the 2 weeks before (${fmtMinutes(b)}).`,
        caveat: 'A before and after can’t show the product caused it. Sleep also shifts with your cycle, stress and routine.',
        sources: [{ ...EVIDENCE.sleep, label: 'Source' }],
      });
    }
  }
  return out.slice(0, 2);
}

/** "What ayna adds to Apple Health": one sentence each, with her own counts where they exist. */
export function aynaAdds({ insights = [], picks = [], products = [], needIds = [], phaseName = null } = {}) {
  const graded = products.filter((p) => needIds.some((n) => fitFor(p, n)?.graded)).length;
  return [
    { id: 'data', label: 'Your data', text: insights.length ? `${insights.length === 1 ? 'One change' : `${insights.length} changes`} explained${phaseName ? ` against your ${phaseName}` : ' against your cycle'}.` : 'Read against your cycle and your own usual.' },
    { id: 'evidence', label: 'Evidence', text: graded ? `${graded} of your products graded for your goals, studies linked.` : 'Every product graded Limited, Some or Strong.' },
    { id: 'products', label: 'Your products', text: picks.length ? `${picks.length} ${picks.length === 1 ? 'pick' : 'picks'} for this week, each with a reason.` : 'Matched to the goals you told us.' },
    { id: 'community', label: 'Community', text: 'Members\u2019 notes on the same products.' },
  ];
}
