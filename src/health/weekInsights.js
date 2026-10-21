/**
 * "This week, explained": two or three plain sentences that tie a change in
 * her numbers to her cycle or to her own pattern. This is the part a data
 * store like Apple Health doesn't do: it shows the numbers, ayna reads them
 * against her cycle.
 *
 * Rules (same as insights.js, plus):
 * - Compared ONLY with her own usual: the 28 days before the last 7, at least
 *   10 days of it and at least 4 recent days. Not enough data = no sentence.
 * - Changes below a threshold are not mentioned (3 bpm, 10% HRV, 0.2 °C, 4 of 7
 *   short nights). The thresholds sit at the size of the cycle shifts the
 *   studies below report, so we don't call noise a pattern.
 * - Never a diagnosis. Hedged: "often", "can", "common". Phase words only
 *   when phase.js has an estimate, and never for someone on hormonal birth
 *   control (cycle patterns in RHR, HRV and temperature don't apply then;
 *   Oura, Readiness score cycle consideration).
 * - Every sentence carries its source(s) for the "Why we say this" link.
 * Research notes with quotes: see the commit message and EVIDENCE below.
 */
import { resolveDaily, series } from './dedupe.js';
import { estimatePhase } from './phase.js';
import { fmtMinutes, RECENT_DAYS, BASELINE_DAYS } from './insights.js';

const DAY = 86400000;
const MIN_RECENT = 4;
const MIN_BASELINE = 10;
const toTime = (day) => Date.parse(`${day}T00:00:00Z`);
const isoDay = (t) => new Date(t).toISOString().slice(0, 10);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const daysBetween = (a, b) => Math.round((toTime(b) - toTime(a)) / DAY);
const fmtDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** Sources behind each sentence. Only claims these pages make. */
export const EVIDENCE = {
  // Sleeping pulse rate: +2.1 bpm in the fertile window vs menses, mid-luteal +3.8 bpm vs menses (n=91).
  rhr: { label: 'Shilaih et al. 2017, Scientific Reports', url: 'https://pubmed.ncbi.nlm.nih.gov/28465583/' },
  // Meta-analysis of 37 studies: cardiac vagal activity (HRV) falls from the follicular to the luteal phase, d = -0.39.
  hrv: { label: 'Schmalenberger et al. 2019, J Clin Med (meta-analysis)', url: 'https://www.mdpi.com/2077-0383/8/11/1946' },
  // Oura ring study: late-luteal heart rate +2.49 bpm and skin temperature higher vs menses; sleep largely unchanged.
  oura: { label: 'Alzueta et al. 2022, Int J Womens Health', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9005074/' },
  // BBT rises 0.22 to 0.56 °C after ovulation, stays up, drops a day or two before the period.
  bbt: { label: 'Cleveland Clinic: Basal body temperature', url: 'https://my.clevelandclinic.org/health/articles/21065-basal-body-temperature' },
  // "Self-reported sleep quality ... worsens in some, but not all, women when premenstrual symptoms emerge."
  sleep: { label: 'Baker and Lee 2018, Sleep Medicine Clinics', url: 'https://www.sri.com/publication/biosciences-health-pubs/menstrual-cycle-effects-on-sleep/' },
  // "The pain can start a day or two before your period."
  cramps: { label: 'MedlinePlus: Period pain', url: 'https://medlineplus.gov/periodpain.html' },
  // Luteal phase is fairly steady at 12 to 14 days (how phase.js estimates ovulation).
  luteal: { label: 'Cleveland Clinic: Luteal phase', url: 'https://my.clevelandclinic.org/health/body/24417-luteal-phase' },
};

function windows(points, today) {
  const end = toTime(today);
  const recentStart = end - (RECENT_DAYS - 1) * DAY;
  const baseStart = recentStart - BASELINE_DAYS * DAY;
  return {
    recent: points.filter((p) => toTime(p.day) >= recentStart && toTime(p.day) <= end),
    baseline: points.filter((p) => toTime(p.day) >= baseStart && toTime(p.day) < recentStart),
  };
}

function compare(points, today) {
  const { recent, baseline } = windows(points, today);
  if (recent.length < MIN_RECENT || baseline.length < MIN_BASELINE) return null;
  const recentAvg = mean(recent.map((p) => p.value));
  const usual = mean(baseline.map((p) => p.value));
  return { recent, baseline, recentAvg, usual, delta: recentAvg - usual };
}

const sorted = (pts) => pts.slice().sort((a, b) => a.day.localeCompare(b.day));
const sourcesOf = (pts) => [...new Set(pts.map((p) => p.source).filter(Boolean))];
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * Where she is in her cycle, from her own logs. Null pieces when unknown.
 * @param {object|null} cycle  buildDashboard(...).cycle
 * @param {object|null} estimate  insights cycle section estimate ({ day })
 */
export function cycleContext({ cycle = null, estimate = null, today, hormonalBC = false } = {}) {
  const phase = !hormonalBC && cycle?.cycleDay ? estimatePhase(cycle) : null;
  const daysToPeriod = estimate?.day && today ? daysBetween(today, estimate.day) : null;
  const daysToLuteal = phase?.windowEnd && ['follicular', 'ovulation'].includes(phase.id) ? phase.windowEnd + 1 - cycle.cycleDay : null;
  const ovulationStart = phase?.windowStart && cycle?.lastStart ? isoDay(toTime(cycle.lastStart) + (phase.windowStart - 1) * DAY) : null;
  return { phase, daysToPeriod: daysToPeriod != null && daysToPeriod >= 0 ? daysToPeriod : null, daysToLuteal, ovulationStart };
}

const inDays = (n) => (n <= 0 ? 'today' : n === 1 ? 'tomorrow' : `in about ${n} days`);

/* ----------------------------- Heart: RHR + HRV ---------------------------- */
export function heartInsight(resolved, today, ctx) {
  const rhr = sorted(series(resolved, 'resting_hr_bpm'));
  const hrvMetric = series(resolved, 'hrv_rmssd_ms').length >= series(resolved, 'hrv_sdnn_ms').length ? 'hrv_rmssd_ms' : 'hrv_sdnn_ms';
  const hrv = sorted(series(resolved, hrvMetric));
  const r = compare(rhr, today);
  const h = compare(hrv, today);
  const bpm = r ? Math.round(r.delta) : 0;
  const pct = h && h.usual > 0 ? Math.round((h.delta / h.usual) * 100) : 0;
  const rhrUp = bpm >= 3;
  const rhrDown = bpm <= -3;
  const hrvDown = pct <= -10;
  if (!rhrUp && !rhrDown && !hrvDown) return null;
  const phase = ctx.phase?.id;
  let text;
  const sources = [];
  if (rhrDown && !hrvDown) {
    text = `Your resting heart rate is ${-bpm} bpm below your usual this week.`;
    if (phase === 'period' || phase === 'follicular') { text += ' It often runs lowest around your period.'; sources.push(EVIDENCE.rhr); }
  } else {
    const parts = [];
    if (rhrUp) parts.push(`resting heart rate is ${bpm} bpm above your usual`);
    if (hrvDown) parts.push(`heart rate variability is ${-pct}% ${rhrUp ? 'lower' : 'below your usual'}`);
    text = `Your ${parts.join(' and your ')}.`;
    const both = parts.length > 1;
    if (phase === 'luteal') {
      text += ` ${both ? 'Both are' : "That's"} common in the luteal phase, which you're probably in now.`;
    } else if (ctx.daysToLuteal != null && ctx.daysToLuteal >= 1 && ctx.daysToLuteal <= 5) {
      text += ` ${both ? 'Both are' : "That's"} common in the luteal phase, which starts ${inDays(ctx.daysToLuteal)}.`;
    }
    if (phase === 'luteal' || (ctx.daysToLuteal != null && ctx.daysToLuteal <= 5)) {
      if (rhrUp) sources.push(EVIDENCE.rhr);
      if (hrvDown) sources.push(EVIDENCE.hrv);
      sources.push(EVIDENCE.oura);
    }
  }
  const pts = [...(r ? rhr : []), ...(h ? hrv : [])];
  return {
    id: 'heart',
    metric: rhrUp || rhrDown ? 'resting_hr_bpm' : hrvMetric,
    text,
    basis: `${rhrUp || rhrDown ? `Resting heart rate: ${Math.round(r.recentAvg)} bpm on average over the last 7 days, against ${Math.round(r.usual)} bpm over the 4 weeks before.` : ''}${hrvDown ? `${rhrUp || rhrDown ? ' ' : ''}Heart rate variability: ${Math.round(h.recentAvg)} ms against ${Math.round(h.usual)} ms.` : ''}`,
    sources,
    from: sourcesOf(pts),
    question: rhrUp ? 'Why is my resting heart rate higher this week?' : rhrDown ? 'Why is my resting heart rate lower this week?' : 'Why is my heart rate variability lower this week?',
    signal: rhrUp || hrvDown ? 'heart-up' : 'heart-down',
  };
}

/* ---------------------------------- Sleep ---------------------------------- */
export function sleepInsight(resolved, today, ctx) {
  const pts = sorted(series(resolved, 'sleep_minutes'));
  const c = compare(pts, today);
  if (!c) return null;
  const nights = c.recent.slice(-7);
  const short = nights.filter((p) => p.value <= c.usual - 30).length;
  const long = nights.filter((p) => p.value >= c.usual + 30).length;
  if (short < 4 && long < 4) return null;
  const less = short >= 4;
  const k = less ? short : long;
  let text = `You've slept ${less ? 'less' : 'more'} than usual ${k} of the last ${nights.length} nights, about ${fmtMinutes(c.delta)} ${c.delta < 0 ? 'less' : 'more'} a night on average.`;
  const sources = [];
  const premenstrual = ctx.phase?.id === 'luteal' && ctx.daysToPeriod != null && ctx.daysToPeriod <= 7;
  if (less && premenstrual) {
    text += ' Some people sleep worse in the days before a period, though not everyone does.';
    sources.push(EVIDENCE.sleep, EVIDENCE.oura);
  }
  return {
    id: 'sleep',
    metric: 'sleep_minutes',
    text,
    basis: `Each of the last ${nights.length} nights against your usual of ${fmtMinutes(c.usual)} (the 4 weeks before). A night counts as ${less ? 'less' : 'more'} when it is 30 minutes or more ${less ? 'under' : 'over'} your usual.`,
    sources,
    from: sourcesOf(pts),
    question: less ? 'Why have I been sleeping less this week?' : 'Why am I sleeping more this week?',
    signal: less ? 'sleep-short' : 'sleep-long',
    shortNights: less ? short : 0,
  };
}

/* ------------------------------- Temperature ------------------------------- */
const TEMP_METRICS = ['basal_temp_c', 'temp_deviation_c', 'skin_temp_night_c'];

/**
 * A sustained rise: the most recent run of at least 3 days, each at least
 * 0.15 °C above the 6 days before the run, with the run averaging 0.2 °C or
 * more above them (the "three higher days" rule BBT charting uses).
 */
export function findTempRise(points) {
  const v = points.map((p) => p.value);
  let best = null;
  for (let len = 3; len <= Math.min(20, v.length - 6); len += 1) {
    const start = v.length - len;
    const pre = mean(v.slice(start - 6, start));
    const run = v.slice(start);
    if (run.every((x) => x >= pre + 0.15) && mean(run) - pre >= 0.2) best = { days: len, rise: mean(run.slice(0, 3)) - pre, start: points[start].day };
  }
  return best;
}

export function tempInsight(resolved, today, ctx, { hormonalBC = false } = {}) {
  const metric = TEMP_METRICS.map((m) => ({ m, n: series(resolved, m).length })).sort((a, b) => b.n - a.n)[0];
  if (!metric?.n) return null;
  const all = sorted(series(resolved, metric.m)).filter((p) => toTime(p.day) <= toTime(today));
  // Needs her own baseline too, and a reading in the last 2 days (an old rise isn't "now").
  if (all.length < MIN_BASELINE + 3 || daysBetween(all[all.length - 1].day, today) > 2) return null;
  const rise = findTempRise(all.slice(-40));
  if (!rise) return null;
  const deg = Math.max(0.2, Math.round(rise.rise * 10) / 10).toFixed(1);
  const sources = [EVIDENCE.bbt];
  let text = rise.days <= 4
    ? `Your temperature rose about ${deg}\u00a0°C over the last ${rise.days} days`
    : `Your temperature has stayed about ${deg}\u00a0°C higher for ${rise.days} days, since ${fmtDay(rise.start)}`;
  if (hormonalBC) {
    text += '.';
    sources.length = 0;
  } else {
    text += ', a pattern that often follows ovulation.';
    if (ctx.daysToPeriod != null && ctx.daysToPeriod <= 3) text += ' It usually drops a day or two before a period.';
  }
  return {
    id: 'temperature',
    metric: metric.m,
    text,
    basis: `Each of the last ${rise.days} days was at least 0.15 °C above the 6 days before, from your own readings. Three or more higher days in a row is the pattern temperature charting looks for. Other things can move your temperature too, so treat this as a hint, not a confirmation.`,
    sources,
    from: sourcesOf(all),
    question: 'What does a temperature rise after ovulation mean?',
    signal: 'temp-rise',
  };
}

/* --------------------------------- Period ---------------------------------- */
export function periodInsight(ctx, estimate, cycle) {
  if (ctx.daysToPeriod == null || ctx.daysToPeriod > 5 || ctx.phase?.id === 'period') return null;
  const n = cycle?.lengths?.length || 0;
  return {
    id: 'period',
    metric: 'menstrual_flow',
    text: `Your period is due ${inDays(ctx.daysToPeriod)}${n >= 2 ? `, going by your last ${plural(n, 'cycle')}` : ''}. Cramps can start a day or two before.`,
    basis: `${estimate?.basis || 'From your period logs.'} Estimates can be off by several days.`,
    sources: [EVIDENCE.cramps],
    from: cycle?.sources || [],
    question: 'How can I get ready for my next period?',
    signal: 'period-soon',
  };
}

/**
 * @param {Array} rows   raw daily rows (deduped here)
 * @param {object} opts  { today, cycle, estimate, hormonalBC, preferred, max }
 * @returns {{ insights: Array, ctx: object }}  insights is [] when data is thin.
 */
export function explainWeek(rows, opts = {}) {
  const today = opts.today || isoDay(Date.now());
  const resolved = resolveDaily(rows || [], opts.preferred);
  const ctx = cycleContext({ cycle: opts.cycle, estimate: opts.estimate, today, hormonalBC: opts.hormonalBC });
  const all = [
    heartInsight(resolved, today, ctx),
    sleepInsight(resolved, today, ctx),
    tempInsight(resolved, today, ctx, { hormonalBC: opts.hormonalBC }),
    periodInsight(ctx, opts.estimate, opts.cycle),
  ].filter(Boolean);
  return { insights: all.slice(0, opts.max || 3), ctx };
}

/** "Day 24 · probably luteal phase · period in about 5 days", or null. */
export function cycleLine(cycle, ctx) {
  if (!cycle?.cycleDay) return null;
  const bits = [`Cycle day ${cycle.cycleDay}`];
  if (ctx?.phase) bits.push(ctx.phase.id === 'period' ? 'on your period' : ctx.phase.id === 'ovulation' ? 'probably around ovulation' : `probably in your ${ctx.phase.name.toLowerCase()}`);
  if (ctx?.daysToPeriod != null && ctx.phase?.id !== 'period') bits.push(`period due ${inDays(ctx.daysToPeriod)}`);
  return bits.join(', ');
}

/** True when her quiz says she uses hormonal birth control (cycle patterns then don't apply). */
export function usesHormonalBC(answers) {
  const a = answers?.fullHealthIntake ? { ...answers, ...answers.fullHealthIntake } : answers || {};
  const sel = [...(a.lifeStageSelections || []), ...(a.lifeStage || [])];
  return sel.includes('I use hormonal birth control') || a.hormonalBirthControl === 'Yes';
}
