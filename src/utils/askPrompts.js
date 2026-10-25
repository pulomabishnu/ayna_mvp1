/**
 * The "Ask ayna" sheet on Home (team sync, Oct 25): 3 or 4 prompts tied to
 * her data, each with the one-line fact it comes from ("You slept 5h 40m,
 * less than your usual 7h 00m" -> "Why was my sleep so low?"). Pure: Today's
 * context in (src/utils/askToday.js, built on this device), prompts out.
 * Nothing is invented: a prompt only appears when its fact exists.
 *
 * Signed out, only prompts ayna answers on this phone (askToday, askHistory,
 * askMatch) are offered, so every one works without an account.
 *
 * @returns {Array<{ question: string, reason: string, local: boolean, health?: string }>}
 *   health: the fact as text, sent to ayna's AI only with her health opt-in.
 */
import { getAskHealthPref } from '../health/askHealthPref.js';

const fmt = (m) => `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, '0')}m`;

export function homePrompts({ ctx = null, signedIn = false, hasProfile = false, max = 4 } = {}) {
  const out = [];
  const add = (p) => { if (p && !out.some((x) => x.question === p.question)) out.push(p); };
  const cards = (ctx?.rundown || []).filter((c) => c?.explain);
  const s = ctx?.signals || {};
  for (const c of cards) {
    const e = c.explain;
    if (e.kind === 'sleep' && Number.isFinite(e.lastNight) && Number.isFinite(e.avg)) {
      const reason = `You slept ${fmt(e.lastNight)} last night, less than your usual ${fmt(e.avg)}.`;
      add(signedIn ? { question: 'Why was my sleep so low?', reason, local: false, health: reason } : { question: 'Why was my sleep flagged?', reason, local: true });
    } else if (e.kind === 'signal' && e.what) {
      add({ question: `Why was my ${String(e.what).toLowerCase()} flagged?`, reason: `${e.what}: ${e.last}, outside your usual ${e.low} to ${e.high}.`, local: true });
    } else if (e.kind === 'log' && e.field && e.word) {
      const reason = `Yesterday your ${e.field} was ${e.word}${e.usual ? `; usually it is ${e.usual}` : ''}.`;
      const question = ['sleep', 'mood'].includes(e.field) ? 'What can I do about my energy today?' : `What can help with ${e.field} today?`;
      // Answered on this phone from the card when signed out (askToday.js localItemAnswer).
      add({ question, reason, local: true, health: reason });
    }
  }
  const focus = (ctx?.focus || []).find((f) => f?.title);
  if (focus) add({ question: 'What should I focus on today?', reason: focus.title, local: true });
  if (s.hasRundown) add({ question: 'Explain my Daily Rundown', reason: 'From today’s rundown, on this phone.', local: true });
  if (s.hasYesterdayLog) add({ question: 'What changed from yesterday?', reason: 'From what you logged yesterday and today.', local: true });
  if (s.hasHistory) add({ question: 'What helped last time?', reason: 'From what you recorded trying.', local: true });
  if (hasProfile) add({ question: 'Explain my top match', reason: 'From your health profile, the % and why.', local: true });
  add({ question: 'What should I focus on today?', reason: 'From your log and data on this phone.', local: true });
  return out.filter((p) => signedIn || p.local).slice(0, max);
}

/** "Ask why" under a fact: the question to ask, and the fact as context. */
export function askWhyFor(fact) {
  const t = String(fact || '').trim().replace(/\.$/, '');
  return t ? `Why might this be? ${t}.` : 'Why might this be?';
}

/** A prompt as an Ask request: the fact goes along only with her health opt-in. */
export function askFromPrompt(p) {
  if (!p?.health) return { question: p.question };
  return { question: p.question, usesHealth: true, buildContext: (on) => (on ? p.health : ''), context: getAskHealthPref()?.on ? p.health : '' };
}
