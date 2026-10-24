/**
 * Your Daily Rundown: which story cards to show today (UX spec 7 to 9).
 * Pure: the same inputs give the same cards. Built ONLY from real data:
 * decide()'s items, her cross-cycle patterns, her daily log, her tries,
 * connected health rows, her matches (one engine), saved items, Library
 * reads and Community items handed in. A card exists only when it passes
 * its relevance rule, never just because data exists.
 *
 * Order (spec 9): safety / meaningful health context, active goals, recent
 * changes, current symptoms, patterns, education, recommendations, saved,
 * community, extras. Safety and care cards always come first and are never
 * rotated away, capped, or hidden by "Not useful".
 *
 * Wording: may / could / pattern / based on your data. Never a diagnosis.
 */
import { addDays, daysBetweenDays } from '../../health/dailyLog.js';
import { cycleStartsFrom, cyclesFrom, PATTERN_METRICS } from '../../health/cyclePatterns.js';
import { READ_SUMMARIES } from '../../data/readPicks.js';

export const CATEGORY_RANK = {
  safety: 1, goal: 2, change: 3, symptom: 4, pattern: 5, education: 6, match: 7, saved: 8, community: 9, win: 10,
};
export const CATEGORIES = Object.keys(CATEGORY_RANK);
// Ranking heuristics, not clinical thresholds.
export const RUNDOWN_RULES = {
  maxContentCards: 6,
  rotateCategories: ['education', 'match', 'saved', 'community', 'win'], // not two days running
  patternRepeatDays: 3, // a pattern card shows at most 2 of any 3 days
  sleepChangeMinutes: 45, // last night vs her recent average
  sleepMinNights: 7,
  matchMinPercent: 50,
  savedMinDays: 3,
  winMinDays: 3,
};

const WEDGE_TO_INTAKE_NEED = { period_pain: ['pain.menstrual_cramp', 'pain.pelvic'], pms: ['cycle.pms', 'mood.pmdd', 'mood.cycle_related'], cycle_sleep: ['sleep.trouble'] };
const EDUCATION_BY_NEED = { period_pain: 'period-pain-when-to-seek-care' };
const CHECKIN_BY_NEED = {
  period_pain: { field: 'pain', title: 'How is your pain today?' },
  pms: { field: 'pms', title: 'How is PMS today?' },
  cycle_sleep: { field: 'sleep', title: 'How did you sleep?' },
};
const FIELD_OPTIONS = {
  pain: { values: [0, 1, 2, 3], labels: ['None', 'Mild', 'Moderate', 'Severe'] },
  pms: { values: [0, 1, 2, 3], labels: ['None', 'Mild', 'Moderate', 'Severe'] },
  sleep: { values: [1, 2, 3], labels: ['Rough', 'Okay', 'Good'] },
  mood: { values: [1, 2, 3], labels: ['Low', 'Okay', 'Good'] },
};

const weekday = (day) => new Date(`${day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
const fmtMinutes = (m) => `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, '0')}m`;

function suppressed(memory, card, today) {
  const nu = memory?.notUseful || {};
  const byKey = nu[`key:${card.key}`];
  const byCat = nu[`category:${card.category}`];
  const live = (x) => x && x.until && x.until > today;
  return live(byKey) ? 'not_useful' : live(byCat) ? 'type_hidden' : null;
}

function shownOn(memory, key, today, days) {
  const list = memory?.shown?.[key] || [];
  return list.filter((d) => { const n = daysBetweenDays(d, today); return n > 0 && n <= days; }).length;
}
function categoryShownYesterday(memory, category, today) {
  return (memory?.shownCategories?.[addDays(today, -1)] || []).includes(category);
}

/** Days to her next period, from her logged period starts (null when unknown). */
export function cyclePosition(log, today) {
  const starts = cycleStartsFrom({ log, today });
  const cycles = cyclesFrom(starts, today).filter((c) => c.complete).slice(-6);
  if (!starts.length || cycles.length < 2) return null;
  const avg = Math.round(cycles.reduce((n, c) => n + daysBetweenDays(c.start, c.next), 0) / cycles.length);
  const last = starts.at(-1);
  const cycleDay = daysBetweenDays(last, today) + 1;
  if (cycleDay < 1 || cycleDay > avg + 7) return null;
  return { cycleDay, avgLength: avg, daysToNext: avg - cycleDay + 1 };
}

/** Last night's sleep against her own recent average, from connected rows. */
export function sleepChange(healthRows, today) {
  const rows = (healthRows || []).filter((r) => r?.metric === 'sleep_minutes' && Number(r.value) > 0 && r.day <= today);
  const byDay = new Map();
  for (const r of rows) byDay.set(r.day, Math.max(byDay.get(r.day) || 0, Number(r.value)));
  const lastNight = byDay.get(today) ?? byDay.get(addDays(today, -1));
  const lastDay = byDay.has(today) ? today : addDays(today, -1);
  const prior = [...byDay.entries()].filter(([d]) => d < lastDay && daysBetweenDays(d, lastDay) <= 21).map(([, v]) => v);
  if (lastNight == null || prior.length < RUNDOWN_RULES.sleepMinNights) return null;
  const avg = prior.reduce((a, b) => a + b, 0) / prior.length;
  return { lastNight, avg, diff: lastNight - avg, nights: prior.length };
}

/**
 * @param {object} input
 *   today, decision (decide() output), patterns, log (map), healthRows,
 *   needs (decision.debug.needs), matches: [{ product, percent, why, evidence }]
 *   already scored by the one engine (caller), saved: [product], reads (bool:
 *   Library available), community: [{ id, title, count, topic }] (real items only),
 *   memory (rundownStore), hasCare
 * @returns {{ cards: object[], skipped: object[] }}
 */
export function buildRundown(input = {}) {
  const { today, decision = { items: [] }, patterns = [], log = {}, healthRows = [], matches = [], saved = [], reads = false, community = [], memory = {} } = input;
  const needs = Object.keys(decision?.debug?.needs || {});
  const cards = [];
  const skipped = [];
  const add = (card) => { cards.push(card); };

  // 1. Safety and care: every decide() care/safety item, always first.
  for (const it of decision.items || []) {
    if (it.tier === 'safety' || it.tier === 'care') {
      add({ key: it.id, category: 'safety', protected: true, kind: 'care', kicker: it.level === 'urgent' ? 'Get help now' : 'Worth acting on', title: it.title, body: it.body, reason: it.reason, sources: it.basis?.sources || [], item: it });
    }
  }
  const hasCare = cards.length > 0;

  // 2. Active goals: a follow-up that is due.
  for (const it of decision.items || []) {
    if (it.type === 'follow_up') add({ key: it.id, category: 'goal', kind: 'followup', kicker: 'Something you tried', title: it.title, body: it.body, item: it });
  }

  // 3. Recent change: connected sleep well below her own recent average.
  const sc = sleepChange(healthRows, today);
  if (sc && sc.diff <= -RUNDOWN_RULES.sleepChangeMinutes) {
    add({
      key: `change:sleep:${today}`, category: 'change', kind: 'text', kicker: 'Your focus today',
      title: 'Sleep may matter a little more today.',
      body: 'You slept less than your recent average last night.',
      facts: [{ k: 'Recent average', v: fmtMinutes(sc.avg) }, { k: 'Last night', v: fmtMinutes(sc.lastNight) }],
      basisLine: 'Why ayna noticed: your connected sleep data.',
      ask: 'Why might my sleep be shorter than usual?',
    });
  } else if (sc) skipped.push({ key: 'change:sleep', why: 'within_usual' });

  // 4. Current symptoms: one micro check-in for her top need, if today is not logged for it.
  const todays = log?.[today] || {};
  const checkNeed = needs.find((n) => CHECKIN_BY_NEED[n] && todays[CHECKIN_BY_NEED[n].field] == null);
  if (checkNeed) {
    const c = CHECKIN_BY_NEED[checkNeed];
    add({ key: `checkin:${c.field}:${today}`, category: 'symptom', kind: 'checkin', kicker: 'Your check-in', title: c.title, field: c.field, options: FIELD_OPTIONS[c.field], body: 'One tap. It goes into your log and shapes tomorrow.' });
  }
  // No need yet: no check-in card here (Today's own check-in item covers it).

  // 5. Patterns: cycle context when she is about to enter a window where a
  //    pattern usually shows; otherwise the pattern insights decide() chose.
  const pos = cyclePosition(log, today);
  const usedPatterns = new Set();
  for (const p of patterns) {
    if (!p?.id || p.direction !== 'harder') continue;
    const m = PATTERN_METRICS[p.metric];
    if (!m || !pos) continue;
    const soon = p.window === 'premenstrual' ? pos.daysToNext >= 1 && pos.daysToNext <= 4 : p.window === 'menstrual' ? pos.daysToNext <= 1 || pos.cycleDay <= 2 : false;
    if (!soon) continue;
    usedPatterns.add(p.id);
    const when = p.window === 'premenstrual' ? 'the days before your period' : 'the first days of your period';
    add({
      key: `pattern:${p.id}`, category: 'pattern', kind: 'text', kicker: 'Your cycle',
      title: `You may be coming up to ${when}, when your ${m.label.toLowerCase()} has usually been ${m.words.harder}.`,
      body: p.text,
      basisLine: `Based on your cycle tracking and check-ins, in ${p.basis.cycles} of your last ${p.basis.of} cycles. A pattern, not a prediction.`,
      ask: `Why might my ${m.label.toLowerCase()} change before my period?`,
      signature: `${p.basis.cycles}/${p.basis.of}`,
    });
  }
  for (const it of decision.items || []) {
    if (it.type !== 'insight' || usedPatterns.has(it.basis?.patternId)) continue;
    add({ key: it.id, category: 'pattern', kind: 'text', kicker: 'A pattern in your logs', title: it.title, body: it.body, basisLine: it.reason, ask: 'What could explain this pattern?', signature: it.signature });
  }

  // 6. Education: one Library read for her most pressing need.
  const eduNeed = needs.find((n) => EDUCATION_BY_NEED[n]);
  if (reads && eduNeed && READ_SUMMARIES[EDUCATION_BY_NEED[eduNeed]]) {
    const id = EDUCATION_BY_NEED[eduNeed];
    add({ key: `education:${id}`, category: 'education', kind: 'read', kicker: 'Something to know', title: READ_SUMMARIES[id].title, body: READ_SUMMARIES[id].teaser, readId: id });
  }

  // 7. Recommendation: her best match for a need she has right now, never next to care.
  if (!hasCare) {
    const wanted = new Set(needs.flatMap((n) => WEDGE_TO_INTAKE_NEED[n] || []));
    const best = matches.filter((m) => m?.product && wanted.has(m.needId) && m.percent >= RUNDOWN_RULES.matchMinPercent).sort((a, b) => b.percent - a.percent)[0];
    if (best) add({ key: `match:${best.product.id}`, category: 'match', kind: 'match', kicker: 'Matched to you', title: 'One of your matches fits what you logged', match: best });
  }

  // 8. Saved: something she saved at least a few days ago.
  const oldSaved = saved.filter((p) => p?.id && (!p.savedAt || daysBetweenDays(String(p.savedAt).slice(0, 10), today) >= RUNDOWN_RULES.savedMinDays));
  const savedPick = oldSaved.find((p) => shownOn(memory, `saved:${p.id}`, today, 7) === 0);
  if (savedPick) add({ key: `saved:${savedPick.id}`, category: 'saved', kind: 'saved', kicker: 'You saved this', title: 'Still thinking about this?', product: savedPick });

  // 9. Community: only real items handed in.
  const cm = community.find((c) => c?.id && c?.title);
  if (cm) add({ key: `community:${cm.id}`, category: 'community', kind: 'community', kicker: 'Community', title: cm.count ? `${cm.count} people are talking about this` : 'People are talking about this', body: cm.title, communityItem: cm, footnote: 'Experiences differ. The same symptom can have different causes.' });

  // 10. Extra: a plain count of her own check-ins this week.
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, -i)).filter((d) => log?.[d] && Object.keys(FIELD_OPTIONS).concat('flow', 'skin').some((f) => log[d][f] != null));
  if (days.length >= RUNDOWN_RULES.winMinDays) add({ key: `win:checkins:${today}`, category: 'win', kind: 'stat', kicker: 'Your week', title: `You checked in ${days.length} ${days.length === 1 ? 'day' : 'days'} this week.`, body: 'Each one makes your patterns clearer.' });

  // Relevance memory: Not useful, rotation, repeat limits. Never for safety.
  const kept = [];
  for (const c of cards) {
    if (c.protected) { kept.push(c); continue; }
    const s = suppressed(memory, c, today);
    if (s) { skipped.push({ key: c.key, why: s }); continue; }
    if (RUNDOWN_RULES.rotateCategories.includes(c.category) && categoryShownYesterday(memory, c.category, today)) { skipped.push({ key: c.key, why: 'rotated' }); continue; }
    if (c.category === 'pattern' && shownOn(memory, c.key, today, RUNDOWN_RULES.patternRepeatDays) >= 2 && memory?.signatures?.[c.key] === c.signature) { skipped.push({ key: c.key, why: 'repeated' }); continue; }
    kept.push(c);
  }
  kept.sort((a, b) => CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category]);
  const protectedCards = kept.filter((c) => c.protected);
  const rest = kept.filter((c) => !c.protected).slice(0, Math.max(0, RUNDOWN_RULES.maxContentCards - protectedCards.length));
  const content = [...protectedCards, ...rest];
  if (!content.length) return { cards: [], skipped };
  const opening = { key: `opening:${today}`, category: 'frame', kind: 'opening', kicker: 'Your daily rundown', title: `Your ${weekday(today)} rundown`, body: 'Here is your health in 60 seconds.' };
  const closing = { key: `closing:${today}`, category: 'frame', kind: 'closing', kicker: 'Done', title: 'That is your rundown.', body: 'Come back tomorrow for a new one.' };
  return { cards: [opening, ...content, closing], skipped };
}
