/**
 * Her data, first, in the Daily Rundown (founder, Oct 24 23:29): period day
 * and days left (or where she is in her cycle), last night's sleep against
 * her usual, steps this week against her usual, heart signals when present,
 * and what changed since yesterday. Research: scratchpad/RUNDOWN_DATA_RESEARCH.md.
 *
 * Pure. Every number comes from her own rows or log; a missing source means
 * the card is skipped or shows how much more data it needs ("3 of 7 nights"),
 * never a placeholder number. Thresholds here are ranking heuristics against
 * her own baseline, not health targets, and no card claims what a change
 * means medically. The cycle phase is always labelled an estimate and uses
 * the .gov method in src/health/phase.js.
 */
import { addDays, daysBetweenDays, FLOW_RANK } from '../../health/dailyLog.js';
import { resolveDaily, series } from '../../health/dedupe.js';
import { estimatePhase, PHASE_SOURCES } from '../../health/phase.js';

export const DATA_RULES = {
  maxDataCards: 4,
  periodMinPast: 2, // earlier periods needed for "days left"
  periodLen: { min: 2, max: 10 }, // a logged period counted toward her usual
  periodMergeGap: 2, // bleeding days this close are one period (one missed log)
  periodOpenDays: 3, // last bleeding day within this many days: maybe still on
  cycleLen: { min: 21, max: 45 },
  cycleMinPast: 2, // complete cycles for a phase estimate
  sleepMinNights: 7,
  sleepWindowDays: 21,
  sleepChangeMinutes: 45,
  stepsMinDays: 10,
  stepsWindowDays: 28,
  stepsGood: 1.0, // yesterday at or above her usual
  stepsLow: 0.8, // under 80% of her usual
};

export const FMT = {
  minutes: (m) => (Math.round(m) < 60 ? `${Math.round(m)}m` : `${Math.floor(Math.round(m) / 60)}h ${String(Math.round(m) % 60).padStart(2, '0')}m`),
  steps: (n) => Math.round(n).toLocaleString('en-US'),
};
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const weekdayShort = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

/* ------------------------------- period -------------------------------- */

/** Days with bleeding (light or more; spotting never counts) and days she said "none". */
function flowDays(log, healthRows, today) {
  const bleed = new Set();
  const none = new Set();
  for (const e of Object.values(log || {})) {
    if (!e?.day || e.day > today) continue;
    if (e.flow && FLOW_RANK[e.flow] >= FLOW_RANK.light) bleed.add(e.day);
    else if (e.flow === 'none' || e.flow === 'spotting') none.add(e.day);
  }
  for (const r of healthRows || []) {
    if (r?.metric !== 'menstrual_flow' || !r.day || r.day > today) continue;
    if (Number(r.value) >= 1) bleed.add(r.day);
  }
  for (const d of bleed) none.delete(d);
  return { bleed, none };
}

/** Periods as runs of bleeding days (one missed day allowed), oldest first. */
export function periodsFrom(bleed) {
  const days = [...bleed].sort();
  const out = [];
  for (const d of days) {
    const cur = out.at(-1);
    if (cur && daysBetweenDays(cur.end, d) <= DATA_RULES.periodMergeGap) { cur.end = d; cur.days += 1; } else out.push({ start: d, end: d, days: 1 });
  }
  return out.map((p) => ({ ...p, length: daysBetweenDays(p.start, p.end) + 1 }));
}

/**
 * Where she is: on her period (sure or not), off it, or no period logged.
 * `answer` is today's "Are you still on your period?" answer, if any.
 * @returns {{ state: 'none'|'on'|'unsure'|'off', ... }}
 */
export function periodStatus({ log = {}, healthRows = [], today, answer = null } = {}) {
  const { bleed, none } = flowDays(log, healthRows, today);
  const periods = periodsFrom(bleed);
  if (!periods.length) return { state: 'none', periods };
  const cur = periods.at(-1);
  const past = periods.slice(0, -1).filter((p) => p.length >= DATA_RULES.periodLen.min && p.length <= DATA_RULES.periodLen.max).slice(-6);
  const usual = past.length >= DATA_RULES.periodMinPast ? Math.round(mean(past.map((p) => p.length))) : null;
  const day = daysBetweenDays(cur.start, today) + 1;
  const base = { periods, cur, past, usual, day };
  const since = daysBetweenDays(cur.end, today); // days since the last bleeding day
  const off = (why, endedDay = cur.end) => ({ ...base, state: 'off', why, length: daysBetweenDays(cur.start, endedDay) + 1 });

  if (bleed.has(today)) return { ...base, state: 'on', sure: true, why: 'logged_today' };
  if (none.has(today)) return off('logged_none_today');
  if (since > DATA_RULES.periodOpenDays || day > 12) return off('ended');
  // Any day after the last bleeding day logged as none: it ended.
  for (let k = 1; k <= since; k += 1) if (none.has(addDays(cur.end, k))) return off('logged_none');
  if (answer === 'yes') return { ...base, state: 'on', sure: true, why: 'answered_yes', askFlow: true };
  if (answer === 'ended') return off('answered_ended', addDays(today, -1));
  const reasons = [];
  if (cur.days === 1) reasons.push('one_day_logged');
  if (since >= 2) reasons.push('gap');
  if (usual && day > usual) reasons.push('past_usual');
  if (answer === 'unsure') return { ...base, state: 'unsure', answered: true, reasons };
  if (!reasons.length) return { ...base, state: 'on', sure: false, why: 'logged_yesterday' };
  return { ...base, state: 'unsure', answered: false, reasons };
}

/** Day tiles for the strip: done (logged), gap (not logged), today, maybe, ahead (predicted). */
export function periodStrip(st, { bleed } = {}) {
  const total = Math.max(st.usual || 0, st.day, 1);
  return Array.from({ length: Math.min(total, 12) }, (_, i) => {
    const n = i + 1;
    const d = addDays(st.cur.start, i);
    if (n < st.day) return { n, kind: bleed?.has(d) ? 'done' : 'gap' };
    if (n === st.day) return { n, kind: st.state === 'unsure' ? 'maybe' : 'today' };
    return { n, kind: 'ahead' };
  });
}

/** Her cycle lengths from period starts (complete cycles only, 21 to 45 days). */
export function cycleLengths(periods) {
  const out = [];
  for (let i = 1; i < periods.length; i += 1) {
    const len = daysBetweenDays(periods[i - 1].start, periods[i].start);
    if (len >= DATA_RULES.cycleLen.min && len <= DATA_RULES.cycleLen.max) out.push(len);
  }
  return out.slice(-6);
}

const CHECK_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'ended', label: 'No, ended yesterday' },
  { value: 'unsure', label: 'Not sure' },
];
const FLOW_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

/**
 * The period / cycle card. One key for the day, so answering the check-in
 * turns the same card into its answer.
 */
export function periodCard({ log, healthRows, today, answer, hormonalBC = false, quiet = false, cycleNeed = false } = {}) {
  if (quiet) return null;
  const { bleed } = flowDays(log, healthRows, today);
  const st = periodStatus({ log, healthRows, today, answer });
  const key = `data:period:${today}`;
  const basisPeriods = st.past?.length ? `based on your last ${plural(st.past.length, 'period')}` : '';
  const common = { key, category: 'data', topic: 'cycle', kind: 'period', tone: 'pink' };

  if (st.state === 'none') {
    if (!cycleNeed) return null;
    return {
      ...common, kind: 'cycle', tone: 'butter', kicker: 'Your cycle', title: 'Log your period to get predictions.',
      body: 'Once you log two periods, ayna can tell you which day you are on, about how many days are left, and where you are in your cycle.',
      followUps: ['How do I log my period?'], empty: true,
    };
  }

  if (st.state === 'on' || st.state === 'unsure') {
    const strip = periodStrip(st, { bleed });
    const left = st.usual ? Math.max(0, st.usual - st.day) : null;
    const flowAsk = st.state === 'on' && st.askFlow && !log?.[today]?.flow ? { title: 'How heavy is it today?', options: FLOW_OPTIONS } : null;
    if (st.state === 'unsure' && !st.answered) {
      const why = st.reasons.includes('past_usual') ? `You are past your usual ${st.usual} days and nothing is logged for today.`
        : st.reasons.includes('gap') ? `You last logged flow ${plural(daysBetweenDays(st.cur.end, today), 'day')} ago.`
          : 'You have logged one day so far.';
      return {
        ...common, kicker: 'Quick check', title: 'Are you still on your period?', body: why,
        check: { options: CHECK_OPTIONS }, strip, day: st.day, usual: st.usual,
        basisLine: 'Your answer goes into your daily log, and the rest of your rundown adjusts.',
        followUps: [],
        explain: { kind: 'period', state: 'asking', day: st.day },
      };
    }
    if (st.state === 'unsure') {
      return {
        ...common, kicker: 'Your period', title: `Maybe day ${st.day} of your period.`,
        body: 'No problem. If it is still going, log your flow later today and ayna will update this.',
        strip, day: st.day, usual: st.usual,
        followUps: [`Is it normal for my period to stop and start?`],
        explain: { kind: 'period', state: 'unsure', day: st.day },
      };
    }
    let title = `Day ${st.day} of your period.`;
    let body;
    let followUps;
    if (st.usual == null) {
      body = `Log ${st.past.length ? 'one more period' : 'two periods'} and ayna can tell you about how many days are left.`;
      followUps = [`What can help on day ${st.day} of my period?`];
    } else if (left > 0) {
      body = `About ${plural(left, 'day')} left, ${basisPeriods}.`;
      followUps = [`What can help on day ${st.day} of my period?`];
    } else if (st.day === st.usual) {
      body = `Your periods have usually lasted about ${st.usual} days, so this may be the last day, ${basisPeriods}.`;
      followUps = [`What can help on day ${st.day} of my period?`];
    } else {
      body = `That is longer than your usual ${st.usual} days, ${basisPeriods}.`;
      followUps = [`Is a ${st.day}-day period normal for me?`];
    }
    return {
      ...common, kicker: 'Your period', title, body, strip, day: st.day, usual: st.usual, left,
      flowAsk, note: st.why === 'answered_yes' ? 'Saved. ayna will count today as a period day.' : null,
      basisLine: st.usual ? 'From your period logs. Periods vary, so this can be off.' : 'From your period logs.',
      followUps,
      explain: { kind: 'period', state: 'on', day: st.day, usual: st.usual, left },
    };
  }

  // Off her period: where she is in her cycle, as an estimate.
  const lengths = cycleLengths(st.periods);
  const lastStart = st.cur.start;
  const cycleDay = daysBetweenDays(lastStart, today) + 1;
  const endedNote = st.why === 'answered_ended' || st.why === 'logged_none_today' ? `Your period lasted ${plural(st.length, 'day')}. ` : '';
  const answeredNote = st.why === 'answered_ended' || st.why === 'logged_none_today' ? 'Saved to your log.' : null;
  if (lengths.length < DATA_RULES.cycleMinPast || hormonalBC) {
    if (cycleDay > DATA_RULES.cycleLen.max + 15) return null;
    return {
      ...common, kind: 'cycle', tone: 'sky', kicker: 'Your cycle', title: `Cycle day ${cycleDay}.`,
      body: hormonalBC ? `${endedNote}Counted from the start of your last logged period.` : `${endedNote}Counted from your last logged period. Log your next period too, and ayna can estimate where you are in your cycle.`,
      cycleDay, note: answeredNote,
      followUps: [`What happens around day ${cycleDay} of a cycle?`],
      explain: { kind: 'cycle', cycleDay },
    };
  }
  const avg = Math.round(mean(lengths));
  const phase = estimatePhase({ cycleDay, avgLength: avg, periodLength: st.cur.length });
  const daysToNext = avg - cycleDay + 1;
  const basis = `Based on your last ${plural(lengths.length, 'cycle')} (about ${avg} days).`;
  if (!phase) {
    return {
      ...common, kind: 'cycle', tone: 'sky', kicker: 'Your cycle', title: `Cycle day ${cycleDay}.`,
      body: `${endedNote}Your cycles have usually been about ${avg} days, so this one is running longer. Cycles change from month to month.`,
      cycleDay, avgLength: avg, note: answeredNote, basisLine: basis,
      followUps: ['Why might my cycle be longer this month?'],
      explain: { kind: 'cycle', cycleDay, avgLength: avg, late: true },
    };
  }
  const next = daysToNext > 0 ? ` Your next period may start in about ${plural(daysToNext, 'day')}.` : ' Your next period may start about now.';
  return {
    ...common, kind: 'cycle', tone: 'sky', kicker: 'Your cycle, an estimate',
    title: `Cycle day ${cycleDay}. ${phase.id === 'ovulation' ? 'In your possible ovulation days.' : `Probably ${phase.name.toLowerCase()}.`}`,
    body: `${endedNote}${next.trim()}`,
    more: phase.what,
    cycleDay, avgLength: avg, periodLength: st.cur.length, phase: { id: phase.id, name: phase.name, windowStart: phase.windowStart, windowEnd: phase.windowEnd },
    note: answeredNote,
    basisLine: phase.basis,
    sources: PHASE_SOURCES,
    followUps: [phase.id === 'luteal' ? 'What happens after ovulation?' : phase.id === 'ovulation' ? 'What are possible ovulation days?' : 'What happens before ovulation?'],
    explain: { kind: 'cycle', cycleDay, avgLength: avg, phase: phase.id, daysToNext },
  };
}

/* -------------------------------- sleep -------------------------------- */

export function sleepData(healthRows, today) {
  const byDay = new Map();
  for (const r of healthRows || []) if (r?.metric === 'sleep_minutes' && Number(r.value) > 0 && r.day <= today) byDay.set(r.day, Math.max(byDay.get(r.day) || 0, Number(r.value)));
  const lastDay = byDay.has(today) ? today : byDay.has(addDays(today, -1)) ? addDays(today, -1) : null;
  if (!lastDay) return null;
  const prior = [...byDay.entries()].filter(([d]) => d < lastDay && daysBetweenDays(d, lastDay) <= DATA_RULES.sleepWindowDays).sort(([a], [b]) => (a < b ? -1 : 1));
  const lastNight = byDay.get(lastDay);
  const nightBefore = byDay.get(addDays(lastDay, -1)) ?? null;
  if (prior.length < DATA_RULES.sleepMinNights) return { lastNight, lastDay, nights: prior.length, usual: null, nightBefore };
  const usual = mean(prior.map(([, v]) => v));
  return { lastNight, lastDay, nights: prior.length, usual, diff: lastNight - usual, pct: Math.round((lastNight / usual) * 100), nightBefore };
}

export const SLEEP_SOURCES = {
  effects: { label: 'NHLBI: How sleep deficiency affects your health', url: 'https://www.nhlbi.nih.gov/health/sleep-deprivation/health-effects' },
  habits: { label: 'NHLBI: Healthy sleep habits', url: 'https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits' },
};

export function sleepCard(healthRows, today) {
  const s = sleepData(healthRows, today);
  if (!s) return null;
  const key = `data:sleep:${today}`;
  const common = { key, category: 'data', topic: 'sleep', kind: 'sleep', tone: 'ink', kicker: 'Last night', seeData: { tab: 'sleep' }, lastNight: s.lastNight, usual: s.usual };
  if (s.usual == null) {
    return {
      ...common, title: `You slept ${FMT.minutes(s.lastNight)}.`,
      body: `ayna learns your usual after ${DATA_RULES.sleepMinNights} nights (${s.nights} so far), then shows how last night compares.`,
      nights: s.nights, learning: true,
      basisLine: 'From your connected sleep data.',
      followUps: ['How much sleep do adults need?'],
      explain: { kind: 'sleep_data', lastNight: s.lastNight },
    };
  }
  const usualLine = `Your usual: ${FMT.minutes(s.usual)}.`;
  const sleepBasis = `Your usual is your average over your last ${s.nights} nights, from your connected sleep data.`;
  if (s.diff <= -DATA_RULES.sleepChangeMinutes) {
    return {
      ...common, pct: s.pct,
      title: `You slept ${FMT.minutes(s.lastNight)}, about ${FMT.minutes(-s.diff)} less than usual.`,
      body: usualLine,
      changed: `Last night: ${FMT.minutes(s.lastNight)}, about ${FMT.minutes(-s.diff)} less than your recent average of ${FMT.minutes(s.usual)}.`,
      mayAffect: 'Short sleep can make it harder to focus, react and manage emotions.',
      canDo: 'Go to bed and wake up at the same time, and keep any nap to 20 minutes or less, earlier in the afternoon.',
      sources: [SLEEP_SOURCES.effects, SLEEP_SOURCES.habits],
      basisLine: `Why ayna noticed: ${sleepBasis}`,
      ask: 'Why might my sleep be shorter than usual?',
      followUps: ['Why was my sleep shorter last night?', 'What can I do about my energy today?'],
      explain: { kind: 'sleep', lastNight: s.lastNight, avg: s.usual, nights: s.nights },
    };
  }
  if (s.diff >= DATA_RULES.sleepChangeMinutes) {
    return {
      ...common, pct: s.pct,
      title: `You slept ${FMT.minutes(s.lastNight)}, about ${FMT.minutes(s.diff)} more than usual.`,
      body: usualLine, basisLine: sleepBasis,
      followUps: ['Why did I sleep longer last night?'],
      explain: { kind: 'sleep_data', lastNight: s.lastNight, avg: s.usual, longer: true },
    };
  }
  return {
    ...common, pct: s.pct,
    title: `You slept ${FMT.minutes(s.lastNight)}, close to your usual.`,
    body: usualLine, basisLine: 'From your connected sleep data.',
    followUps: ['How has my sleep been this week?'],
    explain: { kind: 'sleep_data', lastNight: s.lastNight, avg: s.usual },
  };
}

/* -------------------------------- steps -------------------------------- */

export function stepsData(healthRows, today) {
  const pts = series(resolveDaily(healthRows || []), 'steps');
  if (!pts.length) return null;
  const byDay = new Map(pts.filter((p) => p.day <= today).map((p) => [p.day, Number(p.value)]));
  const week = Array.from({ length: 7 }, (_, i) => { const day = addDays(today, i - 6); return { day, label: weekdayShort(day), value: byDay.has(day) ? byDay.get(day) : null, today: day === today }; });
  if (!week.some((d) => d.value != null)) return null;
  const y = addDays(today, -1);
  const base = [];
  for (let i = 1; i <= DATA_RULES.stepsWindowDays; i += 1) { const v = byDay.get(addDays(y, -i)); if (v != null) base.push(v); }
  const usual = base.length >= DATA_RULES.stepsMinDays ? mean(base) : null;
  const yesterday = byDay.has(y) ? byDay.get(y) : null;
  const dayBefore = byDay.get(addDays(y, -1)) ?? null;
  return { week, usual, baseDays: base.length, yesterday, dayBefore, ratio: usual && yesterday != null ? yesterday / usual : null };
}

/** The line under the chart, from yesterday against her own usual. */
export function stepsMessage(d, { gentle = false } = {}) {
  if (!d || d.ratio == null) return null;
  if (d.ratio >= DATA_RULES.stepsGood) return { level: 'good', title: 'You did great, keep it up.' };
  if (d.ratio >= DATA_RULES.stepsLow) return { level: 'steady', title: 'Close to your usual. Keep it going.' };
  return gentle ? { level: 'gentle', title: 'Take it at your own pace today.' } : { level: 'low', title: 'Move a little more today.' };
}

export function stepsCard(healthRows, today, { gentle = false } = {}) {
  const d = stepsData(healthRows, today);
  if (!d) return null;
  const key = `data:steps:${today}`;
  const msg = stepsMessage(d, { gentle });
  const common = { key, category: 'data', topic: 'steps', kind: 'steps', tone: 'butter', kicker: 'Your steps', week: d.week, usual: d.usual, seeData: { tab: 'activity' } };
  if (d.usual == null) {
    return {
      ...common, title: 'Your steps this week.',
      body: `ayna learns your usual after ${DATA_RULES.stepsMinDays} days of steps (${d.baseDays} so far).`,
      learning: true, followUps: ['How active have I been this week?'],
      explain: { kind: 'steps', learning: true },
    };
  }
  const yLine = d.yesterday != null ? `Yesterday: ${FMT.steps(d.yesterday)}. Your usual: about ${FMT.steps(d.usual)}.` : `Your usual: about ${FMT.steps(d.usual)} a day.`;
  return {
    ...common, level: msg?.level || null,
    title: msg ? msg.title : 'Your steps this week.',
    body: yLine,
    basisLine: `Your usual: your daily average over the 4 weeks before yesterday (${d.baseDays} days). Today shows steps so far.`,
    followUps: [msg && (msg.level === 'low' || msg.level === 'gentle') ? 'How can I fit in a little more movement today?' : 'How do my steps compare with last month?'],
    explain: { kind: 'steps', yesterday: d.yesterday, usual: Math.round(d.usual), level: msg?.level || null },
  };
}

/* ---------------------------- since yesterday --------------------------- */

export function deltaCard(healthRows, today) {
  const rows = [];
  const s = sleepData(healthRows, today);
  if (s && s.nightBefore != null) {
    const d = s.lastNight - s.nightBefore;
    rows.push({ id: 'sleep', label: 'Sleep', value: FMT.minutes(s.lastNight), change: Math.abs(d) < 10 ? 'about the same' : `${d > 0 ? '+' : '-'}${FMT.minutes(Math.abs(d))}`, dir: Math.abs(d) < 10 ? 'flat' : d > 0 ? 'up' : 'down' });
  }
  const st = stepsData(healthRows, today);
  if (st && st.yesterday != null && st.dayBefore != null) {
    const d = st.yesterday - st.dayBefore;
    rows.push({ id: 'steps', label: 'Steps', value: FMT.steps(st.yesterday), change: Math.abs(d) < 300 ? 'about the same' : `${d > 0 ? '+' : '-'}${FMT.steps(Math.abs(d))}`, dir: Math.abs(d) < 300 ? 'flat' : d > 0 ? 'up' : 'down' });
  }
  const hr = new Map((healthRows || []).filter((r) => r?.metric === 'resting_hr_bpm' && r.day <= today).map((r) => [r.day, Number(r.value)]));
  const hDay = hr.has(today) ? today : hr.has(addDays(today, -1)) ? addDays(today, -1) : null;
  if (hDay && hr.has(addDays(hDay, -1))) {
    const d = Math.round(hr.get(hDay) - hr.get(addDays(hDay, -1)));
    rows.push({ id: 'rhr', label: 'Resting heart rate', value: `${Math.round(hr.get(hDay))} bpm`, change: d === 0 ? 'the same' : `${d > 0 ? '+' : '-'}${Math.abs(d)} bpm`, dir: d === 0 ? 'flat' : d > 0 ? 'up' : 'down' });
  }
  if (rows.length < 2) return null;
  return {
    key: `data:delta:${today}`, category: 'data', kind: 'delta', tone: 'pink', kicker: 'Since yesterday',
    title: 'What changed since yesterday.', deltas: rows,
    basisLine: 'Each one against the day before, from your connected data. Day to day changes are normal.',
    followUps: ['What changed from yesterday?'],
    explain: { kind: 'delta', rows: rows.map((r) => `${r.label} ${r.change}`) },
  };
}
