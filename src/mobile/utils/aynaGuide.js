export const GUIDE_KEY = 'ayna_guide_v1';
const EMPTY = { memories: [], trials: [], shareWithAsk: false };
const day = (date = new Date()) => new Date(date).toLocaleDateString('en-CA');
const clean = (value, max = 180) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);

export function readGuide(userId, storage = globalThis.localStorage) {
  if (!userId) return { ...EMPTY };
  try {
    const all = JSON.parse(storage?.getItem(GUIDE_KEY) || '{}');
    const value = all?.[userId];
    return {
      memories: Array.isArray(value?.memories) ? value.memories.slice(-30) : [],
      trials: Array.isArray(value?.trials) ? value.trials.slice(-30) : [],
      shareWithAsk: value?.shareWithAsk === true,
    };
  } catch { return { ...EMPTY }; }
}

export function saveGuide(userId, guide, storage = globalThis.localStorage) {
  if (!userId) return false;
  try {
    const all = JSON.parse(storage?.getItem(GUIDE_KEY) || '{}');
    storage?.setItem(GUIDE_KEY, JSON.stringify({ ...all, [userId]: guide }));
    return true;
  } catch { return false; }
}

export function addMemory(guide, note) {
  const text = clean(note);
  if (!text) return guide;
  return { ...guide, memories: [...guide.memories, { id: crypto.randomUUID(), text, added: day() }].slice(-30) };
}

export function removeMemory(guide, id) {
  return { ...guide, memories: guide.memories.filter((item) => item.id !== id) };
}

export function startTrial(guide, { action, goal, baseline, followUpDays = 7 }, now = new Date()) {
  const safeAction = clean(action, 90);
  const safeGoal = clean(goal, 90);
  const score = Number(baseline);
  if (!safeAction || !safeGoal || !Number.isInteger(score) || score < 1 || score > 5) return guide;
  const due = new Date(now);
  due.setDate(due.getDate() + (followUpDays === 14 ? 14 : 7));
  return { ...guide, trials: [...guide.trials, {
    id: crypto.randomUUID(), action: safeAction, goal: safeGoal, baseline: score,
    started: day(now), due: day(due), followUp: null,
  }].slice(-30) };
}

export function completeTrial(guide, id, score, note = '', now = new Date()) {
  const rating = Number(score);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return guide;
  return { ...guide, trials: guide.trials.map((trial) => trial.id === id ? {
    ...trial, followUp: { score: rating, note: clean(note), day: day(now) },
  } : trial) };
}

export function removeTrial(guide, id) {
  return { ...guide, trials: guide.trials.filter((trial) => trial.id !== id) };
}

export function trialResult(trial) {
  if (!trial?.followUp) return null;
  const diff = trial.followUp.score - trial.baseline;
  return diff > 0 ? 'You rated this better at follow-up.' : diff < 0 ? 'You rated this worse at follow-up.' : 'You gave the same rating at follow-up.';
}

export function guideContext(guide) {
  if (!guide?.shareWithAsk) return '';
  const memories = guide.memories.slice(-8).map((m) => m.text);
  const trials = guide.trials.slice(-5).map((t) => `${t.action} for ${t.goal}: ${t.followUp ? `${t.baseline}/5 before, ${t.followUp.score}/5 at follow-up` : `started ${t.started}, follow-up planned ${t.due}`}`);
  return [...(memories.length ? [`Things she chose to remember: ${memories.join('; ')}`] : []), ...(trials.length ? [`Her own try-and-check-back notes (self-reports, not proof of effect): ${trials.join('; ')}`] : [])].join('\n').slice(0, 1200);
}

export function productNotesFromRoutine(products = [], outcomes = {}) {
  return products.flatMap((product) => {
    const entries = Array.isArray(outcomes?.[product.id]) ? outcomes[product.id] : [];
    const latest = entries.slice().sort((a, b) => String(b.day).localeCompare(String(a.day)))[0];
    if (!latest || !['helping', 'same', 'worse'].includes(latest.rating)) return [];
    const rating = { helping: 'helping', same: 'no change yet', worse: 'making it harder' }[latest.rating];
    return [`${clean(product.name || product.title, 80)}: I marked it “${rating}” on ${latest.day}`];
  }).slice(0, 12);
}

export function appointmentSummary({ guide, recap = '', profile = '', productNotes = [], includeRecap = false, now = new Date() }) {
  const lines = ['Ayna appointment summary', `Prepared ${day(now)}`, 'Only the information you chose to include. This is not a diagnosis.', ''];
  if (profile) lines.push('My stated goals and preferences', clean(profile, 800), '');
  if (guide.memories.length) lines.push('Things I want to mention', ...guide.memories.map((m) => `• ${m.text}`), '');
  if (includeRecap && recap) lines.push('Recent app observations', clean(recap, 1200), 'These are observations, not causes or a diagnosis.', '');
  if (guide.trials.length) lines.push('What I tried and reported', ...guide.trials.map((t) => `• ${t.action} for ${t.goal}; started ${t.started}; ${t.baseline}/5 before${t.followUp ? `, ${t.followUp.score}/5 on ${t.followUp.day}${t.followUp.note ? `; ${t.followUp.note}` : ''}` : `; follow-up planned ${t.due}`}.`), '');
  if (productNotes.length) lines.push('My product check-ins', ...productNotes.map((note) => `• ${clean(note, 180)}`), 'Self-reports, not evidence a product caused the change.', '');
  lines.push('Questions for my clinician', '• What should I track or ask about next?', '• Do any of these changes need evaluation?');
  return lines.join('\n');
}
