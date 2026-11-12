/**
 * Your goals, with this week's progress (founder, Nov 11: the goals feature discussed with Puloma;
 * research she shared: goal-gradient effect, "never start at zero", celebrate small wins).
 *
 * A goal is a need she chose (quiz or "Make it a goal"). Progress comes only from her own log for
 * the last 7 days, the same log the calendar and For today use. Each goal counts "good days":
 *   sleep    -> nights logged Okay or Good
 *   pain     -> days pain logged None or Mild
 *   energy   -> days energy logged Okay or Good
 *   mood     -> days mood logged Okay or Good
 *   PMS      -> days PMS logged None or Mild
 *   anything else -> days she checked in at all
 * Pure: same log in, same numbers out. No diagnosis, no scores beyond counts of her own entries.
 */
import { addDays } from './dailyLog.js';

const RULES = [
  { test: /^sleep\./, field: 'sleep', good: (v) => v >= 2, unit: 'good nights', topic: 'sleep' },
  { test: /^(pain\.|cramps?)/, field: 'pain', good: (v) => v <= 1, unit: 'low-pain days', topic: 'pain' },
  { test: /^(energy\.|fatigue)/, field: 'energy', good: (v) => v >= 2, unit: 'good-energy days', topic: 'energy' },
  { test: /^(mood\.|stress\.|anxiety)/, field: 'mood', good: (v) => v >= 2, unit: 'good-mood days', topic: 'mood' },
  { test: /^cycle\.pms/, field: 'pms', good: (v) => v <= 1, unit: 'easy PMS days', topic: 'pms' },
];
const TOPIC_RULE = Object.fromEntries(RULES.map((r) => [r.topic, r]));
/** Was this logged day a good day for the topic? null when that field wasn't logged. */
export function goodDay(topic, entry) {
  const r = TOPIC_RULE[topic];
  const v = r && entry ? entry[r.field] : null;
  return v == null ? null : r.good(v);
}
const LOG_FIELDS = ['pain', 'flow', 'pms', 'sleep', 'mood', 'skin', 'energy'];

/** @returns {{ id, label, good, logged, of, unit, topic, line }} */
export function goalProgress(goal, log = {}, today) {
  const rule = RULES.find((r) => r.test.test(String(goal?.id || ''))) || null;
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, -i));
  let good = 0;
  let logged = 0;
  for (const d of days) {
    const e = log?.[d];
    if (!e) continue;
    if (rule) {
      const v = e[rule.field];
      if (v == null) continue;
      logged += 1;
      if (rule.good(v)) good += 1;
    } else if (LOG_FIELDS.some((f) => e[f] != null)) {
      logged += 1;
      good += 1;
    }
  }
  const unit = rule ? rule.unit : 'check-in days';
  const line = logged === 0
    ? 'Log how it went today to start this week.'
    : good === 0 ? `You logged ${logged} ${logged === 1 ? 'day' : 'days'}. Keep going, it shows the pattern.`
      : `${good} ${unit} this week${good >= 5 ? '. Great week.' : '.'}`;
  return { id: goal.id, label: goal.label || goal.id, good, logged, of: 7, unit, topic: rule?.topic || null, line };
}

export function goalsProgress(goals = [], log = {}, today) {
  return goals.filter((g) => g?.id).map((g) => goalProgress(g, log, today));
}
