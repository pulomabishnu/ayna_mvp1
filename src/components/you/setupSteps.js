import { aynaBeliefs } from '../../utils/aynaBeliefs.js';

/**
 * Her set-up, as a count that starts with what she already did (endowed
 * progress, You audit section 12: "1 of 4 set-up steps done" plus the next
 * step). Every step is read from data she already has; nothing is invented
 * and nothing is pre-ticked. Same list on the website and the app.
 *
 * @param {{ hasAnswers?: boolean, productCount?: number, connectedCount?: number, checkinCount?: number|null }} facts
 * @returns {{ steps: {key: string, label: string, done: boolean}[], done: number, total: number, next: {key: string, label: string}|null }}
 */
export function setupSteps({ hasAnswers = false, productCount = 0, connectedCount = 0, checkinCount = null } = {}) {
  const steps = [
    { key: 'quiz', label: 'Answer the quiz', done: !!hasAnswers },
    { key: 'ecosystem', label: 'Add a product to your ecosystem', done: productCount > 0 },
    { key: 'connect', label: 'Connect health data', done: connectedCount > 0 },
    { key: 'checkin', label: 'Do your first check-in', done: (checkinCount || 0) > 0 },
  ];
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done) || null;
  return { steps, done, total: steps.length, next: next ? { key: next.key, label: next.label } : null };
}

/** "What ayna knows: 6 answers · Apple Health · 2 saved" (You audit section 6). Only parts with something in them. */
export function knowsLine({ answerCount = 0, connectedNames = [], savedCount = 0 } = {}) {
  return [
    answerCount ? `${answerCount} ${answerCount === 1 ? 'answer' : 'answers'}` : null,
    ...connectedNames.filter(Boolean),
    savedCount ? `${savedCount} saved` : null,
  ].filter(Boolean).join(' · ');
}

/** How many things ayna knows from her answers: the same rows "What ayna knows about you" lists, minus the unanswered ones. */
export function countAnswers(intake) {
  if (!intake || typeof intake !== 'object') return 0;
  try { return aynaBeliefs(intake, {}).flatMap((g) => g.rows || []).filter((r) => !r.missing && r.source !== 'connected' && !r.todayField).length; } catch { return 0; }
}

const SOURCE_NAMES = { apple_health: 'Apple Health', oura: 'Oura', fitbit: 'Fitbit', garmin: 'Garmin', whoop: 'Whoop', google_fit: 'Google Fit', health_connect: 'Health Connect', upload: 'Uploaded file', file: 'Uploaded file' };
/** Display names of her connected sources ("Apple Health"). */
export function connectedNames(connected = []) {
  return [...new Set((connected || []).filter((c) => !c?.status || c.status === 'connected').map((c) => SOURCE_NAMES[c?.source] || (c?.source ? String(c.source).replace(/_/g, ' ').replace(/^\w/, (m) => m.toUpperCase()) : null)).filter(Boolean))];
}
