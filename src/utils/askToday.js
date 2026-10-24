/**
 * Ask ayna questions about her day, answered on this device from what Today
 * already worked out (her log, the decision items and the Daily Rundown).
 * Nothing here is sent to the model: Ask's health data stays opt-in, and
 * these answers don't need it. When there is nothing to say, ayna says so
 * instead of guessing (abstain).
 *
 * Today publishes its context with setTodayAskContext() (memory only, this
 * tab); Ask reads it through localTodayAnswer().
 */

let current = null;

/**
 * ctx: {
 *   today, signals: { hasRundown, hasYesterdayLog, lowSleepOrEnergy, hasRecentChanges, hasHistory },
 *   focus: [{ title, reason }],                       decide() items, in order
 *   rundown: [{ category, title, changed, canDo, explain }],  content cards
 *   log: { today: entry|null, yesterday: entry|null },
 *   recent: [string]                                   plain week-on-week change lines
 * }
 */
export function setTodayAskContext(ctx) { current = ctx || null; }
export function getTodayAskContext() { return current; }

const KINDS = [
  ['focus', /\bwhat should i (focus on|pay attention to)\b.*\btoday\b|\bfocus on today\b/i],
  ['explain_rundown', /\b(explain|walk me through|what('s| is) in) my (daily )?rundown\b/i],
  ['yesterday', /\bwhat changed (from|since) yesterday\b/i],
  ['recent', /\bwhat changed recently\b|\bwhat('s| has) changed lately\b/i],
  ['flagged', /\bwhy (was|is) my (.+?) flagged\b/i],
];

export function todayQuestionKind(text) {
  const s = String(text || '').trim();
  for (const [kind, re] of KINDS) if (re.test(s)) return kind;
  return null;
}

const FIELD_WORDS = {
  pain: ['None', 'Mild', 'Moderate', 'Severe'], pms: ['None', 'Mild', 'Moderate', 'Severe'],
  sleep: [null, 'Rough', 'Okay', 'Good'], mood: [null, 'Low', 'Okay', 'Good'], skin: [null, 'Flared', 'Okay', 'Clear'],
  flow: { none: 'None', spotting: 'Spotting', light: 'Light', medium: 'Medium', heavy: 'Heavy' },
};
const FIELD_NAMES = { pain: 'Pain', flow: 'Flow', pms: 'PMS', sleep: 'Sleep', mood: 'Mood', skin: 'Skin' };
const word = (f, v) => (v == null ? null : FIELD_WORDS[f]?.[v] ?? null);
const NOTE = 'From your own log and data on this device. Not a diagnosis.';

function answerYesterday(ctx) {
  const t = ctx?.log?.today || {}; const y = ctx?.log?.yesterday || {};
  const lines = [];
  for (const f of Object.keys(FIELD_NAMES)) {
    const a = word(f, y[f]); const b = word(f, t[f]);
    if (a && b && a !== b) lines.push(`- ${FIELD_NAMES[f]}: ${a.toLowerCase()} yesterday, ${b.toLowerCase()} today.`);
    else if (a && b) lines.push(`- ${FIELD_NAMES[f]}: ${b.toLowerCase()}, the same as yesterday.`);
  }
  if (!lines.length) {
    const none = !Object.values(y).some((v) => v != null) ? 'yesterday' : 'today';
    return { answer: `There's nothing to compare yet: you haven't logged ${none}. Check in and ask again.` };
  }
  return { answer: `Here's what you logged:\n${lines.join('\n')}\n\n${NOTE}` };
}

function answerFocus(ctx) {
  const items = (ctx?.focus || []).slice(0, 3);
  if (!items.length) return { answer: `Nothing unusual stands out today. Your log and connected data look like your usual.\n\n${NOTE}` };
  return { answer: `Here's what stands out today:\n${items.map((it, i) => `${i + 1}. **${it.title}**${it.reason ? ` ${it.reason}` : ''}`).join('\n')}\n\n${NOTE}` };
}

function answerRundown(ctx) {
  const cards = (ctx?.rundown || []).filter((c) => c?.title);
  if (!cards.length) return { answer: `Your Daily Rundown is empty today: nothing in your log or connected data stood out from your usual.\n\n${NOTE}` };
  return { answer: `Your Daily Rundown today:\n${cards.map((c) => `- **${c.title}**${c.changed ? ` ${c.changed}` : ''}${c.canDo ? ` What you can do: ${c.canDo}` : ''}`).join('\n')}\n\n${NOTE}` };
}

function answerRecent(ctx) {
  const lines = [...(ctx?.recent || []), ...(ctx?.rundown || []).filter((c) => c?.category === 'change' && c.changed).map((c) => c.changed)];
  if (!lines.length) return { answer: `Nothing has clearly changed in your log or connected data lately.\n\n${NOTE}` };
  return { answer: `What changed recently:\n${[...new Set(lines)].slice(0, 5).map((l) => `- ${l}`).join('\n')}\n\n${NOTE}` };
}

function answerFlagged(text, ctx) {
  const what = String(text).match(KINDS.find(([k]) => k === 'flagged')[1])?.[2]?.toLowerCase() || '';
  const cards = (ctx?.rundown || []).filter((c) => c?.explain);
  const card = cards.find((c) => (c.explain.kind === 'sleep' && /sleep/.test(what)) || (c.explain.what && what.includes(c.explain.what.toLowerCase())) || (c.explain.field && what.includes(c.explain.field.toLowerCase())));
  if (!card) return { answer: `ayna didn't flag ${what || 'that'} today, so there's nothing to explain.` };
  const e = card.explain;
  const fmt = (m) => `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, '0')}m`;
  if (e.kind === 'sleep') return { answer: `Last night you slept ${fmt(e.lastNight)}, about ${fmt(Math.abs(e.avg - e.lastNight))} less than your average of ${fmt(e.avg)} over your last ${e.nights} nights of connected sleep data. ayna flags a night that is 45 minutes or more below your own average. That's all it means: it is not a diagnosis.` };
  if (e.kind === 'signal') return { answer: `${e.what} was ${e.last}, outside your recent range of ${e.low} to ${e.high} (from ${e.n} days of your connected data). ayna flags a reading that is well outside your own range. It doesn't say why.` };
  if (e.kind === 'log') return { answer: `Yesterday you logged your ${e.field} as ${e.word}. Usually it is closer to ${e.usual}. ayna flags a check-in that is clearly off your own usual.` };
  return null;
}

export function answerTodayQuestion(text, ctx = current) {
  const kind = todayQuestionKind(text);
  if (!kind) return null;
  if (!ctx) return { answer: "ayna doesn't have today's picture on this device yet. Open Today, check in, and ask again." };
  if (kind === 'focus') return answerFocus(ctx);
  if (kind === 'explain_rundown') return answerRundown(ctx);
  if (kind === 'yesterday') return answerYesterday(ctx);
  if (kind === 'recent') return answerRecent(ctx);
  if (kind === 'flagged') return answerFlagged(text, ctx);
  return null;
}

/** Same shape as localMatchAnswer / localHistoryAnswer: { answer, followUps } or null. */
export async function localTodayAnswer(text) {
  const r = answerTodayQuestion(text);
  return r ? { followUps: [], ...r } : null;
}
