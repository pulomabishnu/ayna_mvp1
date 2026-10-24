// "What helped last time?" answered from her own record of what she tried,
// on the device, not by the language model (master prompt sections 8, 56,
// 57, 161). It only repeats what she reported, says how many times, and never
// claims a cause. With nothing recorded it says so (abstain) instead of
// guessing.

import { OUTCOME_LABELS, dueDay, fromGuideTrials, readTries, withStatus } from '../health/outcomes.js';
import { todayKey } from '../health/dailyLog.js';

const HISTORY_INTENT = [
  /\bwhat\s+(?:has\s+)?(?:helped|worked)\b/i,
  /\bwhat\s+did\s+i\s+(?:try|use)\b/i,
  /\bwhat\s+(?:have\s+i|i\s+have|i(?:'|’)ve)\s+(?:tried|used)\b/i,
  /\b(?:helped|worked)\s+(?:me\s+)?(?:last\s+time|before)\b/i,
  /\bmy\s+(?:tries|trials|check[- ]?ins|history)\b/i,
];

// Topic words in her question -> words to look for in what she tried.
const TOPICS = [
  { re: /\b(cramp|cramps|period pain|pelvic pain|pain)\b/i, words: ['cramp', 'pain', 'heat', 'thermacare', 'heating'] },
  { re: /\b(sleep|insomnia|tired)\b/i, words: ['sleep', 'insomnia', 'melatonin', 'magnesium'] },
  { re: /\b(pms|mood|irritab)/i, words: ['pms', 'mood', 'pmdd'] },
  { re: /\b(heavy|flow|bleed|leak)/i, words: ['heavy', 'flow', 'bleed', 'leak', 'pad', 'cup', 'underwear', 'tampon', 'disc'] },
  { re: /\b(skin|acne|breakout)/i, words: ['skin', 'acne', 'breakout'] },
  { re: /\b(uti|bladder|urinary)/i, words: ['uti', 'urinary', 'bladder', 'cranberry', 'd-mannose'] },
];

export function isHistoryQuestion(text) {
  const t = String(text || '');
  return t.length <= 200 && HISTORY_INTENT.some((re) => re.test(t));
}

const fmtDay = (d) => {
  const [y, m, day] = String(d).split('-').map(Number);
  if (!y) return String(d);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * @param {string} text
 * @param {{ tries: object[], productName?: (id: string) => string|null, today?: string }} ctx
 * @returns {{ answer: string, followUps: object[] } | null} null when it isn't a history question.
 */
export function answerHistoryQuestion(text, { tries = [], productName = () => null, today = todayKey(), guide = false } = {}) {
  if (!isHistoryQuestion(text)) return null;
  const label = (t) => (t.kind === 'product' ? productName(t.ref) || 'A product' : t.ref);
  const all = tries.filter((t) => t && !t.removed).map((t) => (t.status ? t : withStatus(t, today)));

  const topic = TOPICS.find((x) => x.re.test(text));
  const about = (t) => `${label(t)} ${t.need || ''} ${t.ref}`.toLowerCase();
  const onTopic = topic ? all.filter((t) => topic.words.some((w) => about(t).includes(w))) : all;
  const list = onTopic.length ? onTopic : all;
  const widened = topic && !onTopic.length && all.length > 0;

  if (!all.length) {
    return {
      followUps: guide ? [{ type: 'open_guide', page: 'trial' }] : [],
      answer: 'You haven’t recorded anything you tried yet, so I can’t say what helped you. When you try something, mark it in your routine or start a “Try & check back”, and I’ll ask you how it went at the right time.',
    };
  }

  const recorded = list.filter((t) => t.outcome).sort((a, b) => String(b.recordedDay).localeCompare(String(a.recordedDay)));
  const waiting = list.filter((t) => !t.outcome);
  const group = (o) => recorded.filter((t) => t.outcome === o);
  const line = (t) => `- ${label(t)}${t.need && t.kind === 'action' ? ` for ${t.need}` : ''}, ${OUTCOME_LABELS[t.outcome].toLowerCase()} on ${fmtDay(t.recordedDay)}`;

  const parts = [];
  if (widened) parts.push('Nothing you recorded matches that, so here is everything you’ve tried.');
  const helpful = group('helpful');
  if (helpful.length) parts.push(`You marked ${helpful.length === 1 ? 'this' : 'these'} as helpful:\n${helpful.slice(0, 5).map(line).join('\n')}`);
  else if (recorded.length) parts.push('You haven’t marked anything as helpful yet.');
  const other = recorded.filter((t) => t.outcome !== 'helpful');
  if (other.length) parts.push(`Other things you reported:\n${other.slice(0, 5).map(line).join('\n')}`);
  if (waiting.length) {
    const w = waiting.slice(0, 4).map((t) => `- ${label(t)}: ${t.status === 'due' ? 'ready for your check-in now' : `check back around ${fmtDay(dueDay(t))}`}`);
    parts.push(`Still too early to tell${waiting.length > 4 ? ' (showing 4)' : ''}:\n${w.join('\n')}`);
  }
  parts.push('This is only what you reported, not proof that something caused the change.');
  return { followUps: [], answer: parts.join('\n\n') };
}

/** Reads her tries (and old guide trials) only when a history question comes in. */
export async function localHistoryAnswer(text, { guideTrials = [], guide = false } = {}) {
  if (!isHistoryQuestion(text)) return null;
  const { getProductById } = await import('../data/products.js');
  const tries = [...readTries(), ...fromGuideTrials(guideTrials)];
  return answerHistoryQuestion(text, { tries, guide, productName: (id) => getProductById(id)?.name || null });
}
