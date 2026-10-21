import { estimatePhase } from '../../health/phase.js';
import { brandOf } from '../data/brandFallback.js';
import { displayName } from './displayName.js';

/**
 * The dashboard's "Ask ayna about your week" card and "For this phase" row.
 * Everything here is built from her own rows and her own products: a
 * question, a reason or a context line only exists when its data does.
 */

const DAY = 86400000;
const fmtDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DAY);

const METRIC_ORDER = ['sleep', 'heart', 'recovery', 'activity'];
const PERIOD_CATEGORIES = new Set(['pad', 'tampon', 'cup', 'disc', 'period-underwear']);

const isPeriodProduct = (p) => PERIOD_CATEGORIES.has(p?.category);
const isCrampProduct = (p) => (p?.tags || []).includes('cramps') || ['cramp-relief', 'pain-relief'].includes(p?.category);
const isFertilityTest = (p) => p?.category === 'diagnostics' && ((p.tags || []).includes('fertility') || (p.healthFunctions || []).includes('fertility'));
const isSleepProduct = (p) => (p?.tags || []).includes('sleep') || p?.category === 'sleep';

/** Week changes worth a sentence, in a fixed order (sleep first). */
export function weekChanges(ready = []) {
  return METRIC_ORDER
    .map((id) => ready.find((s) => s.id === id))
    .filter((s) => s?.change && s.change.direction && s.change.direction !== 'flat');
}

const heartWord = (s) => (String(s.headline || '').startsWith('Heart rate variability') ? 'heart rate variability' : 'resting heart rate');

function changeSentence(s) {
  const text = s.change.text.replace(/than your usual$/, 'than usual');
  if (s.id === 'heart') return `Your ${heartWord(s)} is ${text}.`;
  if (s.id === 'activity') return `You moved ${text}.`;
  return `${s.title} is ${text}.`;
}

/** One or two plain sentences about her week. Null when there is nothing to say. */
export function weekSummary(ready = []) {
  const changes = weekChanges(ready).slice(0, 2);
  if (changes.length) return changes.map(changeSentence).join(' ');
  return ready.some((s) => METRIC_ORDER.includes(s.id)) ? 'Your numbers are close to your usual this week.' : null;
}

function metricQuestion(s) {
  const down = s.change.direction === 'down';
  if (s.id === 'sleep') return down ? 'Why is my sleep lower this week?' : 'Why am I sleeping more this week?';
  if (s.id === 'heart') return `Why is my ${heartWord(s)} ${down ? 'lower' : 'higher'} this week?`;
  if (s.id === 'recovery') return `Why is my recovery ${down ? 'lower' : 'higher'} this week?`;
  if (s.id === 'activity') return down ? 'Why am I moving less this week?' : null;
  return null;
}

function phaseQuestion(phase) {
  if (!phase) return null;
  if (phase.id === 'period') return 'What helps during my period?';
  if (phase.id === 'ovulation') return 'What should I know around ovulation?';
  return `What helps in the ${phase.id} phase?`;
}

/** Up to three questions, each grounded in a number or date she has. */
export function suggestedQuestions({ cycle = null, estimate = null, ready = [], products = [], today = null } = {}) {
  const phase = cycle?.cycleDay ? estimatePhase(cycle) : null;
  const changes = weekChanges(ready).map(metricQuestion).filter(Boolean);
  const out = [];
  if (changes[0]) out.push(changes[0]);
  if (phase) out.push(phaseQuestion(phase));
  if (phase && products.length) out.push('Which of my products fit this phase?');
  if (changes[1]) out.push(changes[1]);
  if (estimate?.day && today && daysBetween(today, estimate.day) >= 0) out.push('How can I get ready for my next period?');
  return [...new Set(out)].slice(0, 3);
}

/** What the dashboard shows, as plain lines for Ask ayna. */
export function dashboardContext({ cycle = null, estimate = null, ready = [], products = [], insights = [] } = {}) {
  const phase = cycle?.cycleDay ? estimatePhase(cycle) : null;
  const lines = [];
  // What "This week, explained" told her, so the answer starts from the same facts.
  if (insights.length) lines.push(`This week, explained (compared with her own last 4 weeks): ${insights.map((i) => i.text).join(' ')}`);
  if (cycle?.cycleDay) lines.push(`Cycle: day ${cycle.cycleDay}${cycle.avgLength ? ` of about ${cycle.avgLength} days` : ''}${phase ? `, ${phase.name.toLowerCase()} (an estimate from her logs)` : ''}.`);
  if (estimate?.day) lines.push(`Next period estimated around ${fmtDay(estimate.day)}.`);
  ready.filter((s) => METRIC_ORDER.includes(s.id)).forEach((s) => {
    lines.push(`${s.title}: ${s.headline || ''}${s.change?.text ? `. ${s.change.text}` : ''}.`.replace(/\.\./g, '.'));
  });
  if (products.length) {
    lines.push(`Products in her ecosystem: ${products.slice(0, 10).map((p) => `${displayName(p)}${brandOf(p) ? ` by ${brandOf(p)}` : ''} (${String(p.category || 'product').replace(/-/g, ' ')})`).join('; ')}.`);
  }
  return lines.join('\n');
}

/**
 * Products for where she is in her cycle right now, hers first, then her
 * matches. Each group carries one short, general reason. Empty when nothing fits.
 */
export function phasePicks({ cycle = null, estimate = null, ready = [], products = [], matches = [], today = null, limit = 4 } = {}) {
  const phase = cycle?.cycleDay ? estimatePhase(cycle) : null;
  const rules = [];
  const untilPeriod = estimate?.day && today ? daysBetween(today, estimate.day) : null;
  const periodSoon = untilPeriod != null && untilPeriod >= 0 && untilPeriod <= 7;
  if (phase?.id === 'period') {
    rules.push({ test: isCrampProduct, reason: 'For cramps, most common in the first days of a period' });
    rules.push({ test: isPeriodProduct, reason: 'For your period, which is on now' });
  } else if (periodSoon) {
    rules.push({ test: isPeriodProduct, reason: `Your next period is due around ${fmtDay(estimate.day)}` });
    rules.push({ test: isCrampProduct, reason: 'For cramps, which often start a day or two before a period' });
  }
  if (phase && ['follicular', 'ovulation'].includes(phase.id) && phase.windowStart && cycle.lastStart && today) {
    const ws = addDays(cycle.lastStart, phase.windowStart - 1);
    const we = addDays(cycle.lastStart, phase.windowEnd - 1);
    if (daysBetween(today, we) >= 0) rules.push({ test: isFertilityTest, reason: `For your likely ovulation window, ${fmtDay(ws)} to ${fmtDay(we)}` });
  }
  const sleep = ready.find((s) => s.id === 'sleep');
  if (sleep?.change?.direction === 'down') rules.push({ test: isSleepProduct, reason: 'For sleep, which is below your usual this week' });

  const seen = new Set();
  const groups = [];
  let count = 0;
  for (const rule of rules) {
    const items = [];
    for (const p of [...products, ...matches]) {
      if (count + items.length >= limit) break;
      if (!p?.id || seen.has(p.id) || !rule.test(p)) continue;
      seen.add(p.id);
      items.push(p);
    }
    if (items.length) { groups.push({ reason: rule.reason, products: items }); count += items.length; }
    if (count >= limit) break;
  }
  return groups;
}

/**
 * Questions for "Ask ayna about your week", driven by "This week, explained":
 * one per insight (in its order), then her products if any fit this week,
 * then her phase. Up to three, each grounded in something on the screen.
 */
export function weekQuestions({ insights = [], ctx = {}, picks = [] } = {}) {
  const out = insights.map((i) => i.question).filter(Boolean).slice(0, 2);
  if (picks.length) out.push('Which of my products fit this week?');
  if (ctx.phase) out.push(phaseQuestion(ctx.phase));
  return [...new Set(out)].slice(0, 3);
}
