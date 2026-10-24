/**
 * "Your week on ayna" (UX spec 10): the same story format, from her own week.
 * Counts and plain comparisons only: "Here's what changed." No streaks, no
 * goals hit or missed, no outcome scoring (outcomes are counted as recorded,
 * never as good or bad).
 */
import { addDays } from '../../health/dailyLog.js';

const LABELS = {
  pain: ['none', 'mild', 'moderate', 'severe'],
  pms: ['none', 'mild', 'moderate', 'severe'],
  sleep: [null, 'rough', 'okay', 'good'],
  mood: [null, 'low', 'okay', 'good'],
};
const NAMES = { pain: 'Pain', pms: 'PMS', sleep: 'Sleep', mood: 'Mood', skin: 'Skin', flow: 'Flow' };
const FIELDS = ['pain', 'flow', 'pms', 'sleep', 'mood', 'skin'];
export const WEEKLY_MIN_DAYS = 3;

const range = (today, from, to) => Array.from({ length: to - from + 1 }, (_, i) => addDays(today, -(from + i)));
const values = (log, days, f) => days.map((d) => log?.[d]?.[f]).filter((v) => typeof v === 'number');
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const word = (f, v) => LABELS[f]?.[Math.round(v)] || null;

/** Week = the last 7 days including today; the week before = the 7 days before that. */
export function buildWeeklyRecap({ today, log = {}, tries = [], patterns = [], saved = [] } = {}) {
  const week = range(today, 0, 6);
  const before = range(today, 7, 13);
  const logged = week.filter((d) => log?.[d] && FIELDS.some((f) => log[d][f] != null));
  if (logged.length < WEEKLY_MIN_DAYS) return { cards: [] };
  const cards = [{ key: `weekly:opening:${today}`, category: 'frame', kind: 'opening', kicker: 'Your week on ayna', title: 'Your week on ayna', body: 'Here is what changed.' }];
  cards.push({ key: 'weekly:days', category: 'week', kind: 'stat', kicker: 'This week', title: `You logged ${logged.length} of 7 days.`, body: 'Only you can see this.' });

  const counts = FIELDS.map((f) => [f, week.filter((d) => log?.[d]?.[f] != null).length]).sort((a, b) => b[1] - a[1]);
  if (counts[0][1] >= WEEKLY_MIN_DAYS) cards.push({ key: 'weekly:most', category: 'week', kind: 'stat', kicker: 'Most tracked', title: `You tracked ${NAMES[counts[0][0]].toLowerCase()} most, on ${counts[0][1]} days.` });

  const changes = [];
  for (const f of ['pain', 'pms', 'sleep', 'mood']) {
    const a = values(log, week, f); const b = values(log, before, f);
    if (a.length < WEEKLY_MIN_DAYS || b.length < WEEKLY_MIN_DAYS) continue;
    const wa = word(f, mean(a)); const wb = word(f, mean(b));
    if (wa && wb && wa !== wb) changes.push(`${NAMES[f]} was mostly ${wa} this week, and ${wb} the week before.`);
  }
  if (changes.length) cards.push({ key: 'weekly:changes', category: 'week', kind: 'list', kicker: "Here's what changed", title: 'Compared with the week before', lines: changes.slice(0, 3), body: 'Changes in your own logs, not a diagnosis.' });

  if (patterns.length) cards.push({ key: 'weekly:patterns', category: 'week', kind: 'stat', kicker: 'Patterns', title: `ayna sees ${patterns.length} ${patterns.length === 1 ? 'pattern' : 'patterns'} across your cycles.`, body: 'Each one is based on at least 3 cycles you logged.' });

  const started = tries.filter((t) => t?.startedDay && week.includes(t.startedDay)).length;
  const recorded = tries.filter((t) => t?.recordedDay && week.includes(t.recordedDay)).length;
  if (started || recorded) {
    const parts = [started ? `started ${started} ${started === 1 ? 'thing' : 'things'} to try` : null, recorded ? `told ayna how ${recorded} ${recorded === 1 ? 'thing' : 'things'} went` : null].filter(Boolean);
    cards.push({ key: 'weekly:tries', category: 'week', kind: 'stat', kicker: 'What you tried', title: `You ${parts.join(' and ')}.`, body: 'Your answers shape what ayna suggests next.' });
  }
  const savedWeek = saved.filter((p) => p?.savedAt && week.includes(String(p.savedAt).slice(0, 10))).length;
  if (savedWeek) cards.push({ key: 'weekly:saved', category: 'week', kind: 'stat', kicker: 'Saved', title: `You saved ${savedWeek} ${savedWeek === 1 ? 'thing' : 'things'} this week.` });

  cards.push({ key: `weekly:closing:${today}`, category: 'frame', kind: 'closing', kicker: 'Done', title: 'That is your week.', body: 'A new recap comes next week.' });
  return { cards };
}
