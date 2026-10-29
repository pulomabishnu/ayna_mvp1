// "Is this still right?" (P1, Oct 29): the health-profile refresh prompt.
//
// Answers that decide safety go stale (userProfile.js RECENCY_RULES:
// pregnancy 280 days, postpartum 365, medicines 180, needs 180). A stale
// pregnancy or medicine answer already HOLDS products that depend on it
// (P0); this prompt is how she clears the hold in one tap, and how ayna
// keeps her picks current. Nothing is changed for her: she confirms
// ("Still right") or opens that question ("Update"). Never from age,
// never from wearable data.
import { buildUserProfile } from '../matching/userProfile.js';
import { needPhrase } from '../matching/ontology.js';
import { stampFactUpdates } from '../matching/factFreshness.js';

export const SNOOZE_KEY = 'ayna_health_refresh_snooze_v1';
export const SNOOZE_DAYS = 14;
const DAY = 86400000;

const months = (days) => {
  if (days == null) return 'a while ago';
  const m = Math.round(days / 30);
  return m <= 1 ? 'about a month ago' : m < 12 ? `${m} months ago` : m < 24 ? 'over a year ago' : `${Math.floor(m / 12)} years ago`;
};

/**
 * The stale answers worth asking about, most safety-relevant first.
 * @returns {{ key: string, title: string, said: string, when: string, step: string }[]}
 */
export function staleFactsFor(quizResults, { now = Date.now() } = {}) {
  if (!quizResults) return [];
  let up;
  try { up = buildUserProfile(quizResults, { now }); } catch { return []; }
  const stale = up.recency?.stale || {};
  const age = up.recency?.factAgeDays || {};
  const stages = up.physiology?.lifeStages || [];
  const out = [];
  if (stale.pregnancy && stages.includes('pregnant')) {
    out.push({ key: 'pregnancy', title: 'Are you still pregnant?', said: up.safety?.trimester ? `You said you were pregnant (trimester ${up.safety.trimester}).` : 'You said you were pregnant.', when: months(age.pregnancy), step: 'lifeStage' });
  }
  if (stale.postpartum && stages.includes('postpartum')) {
    out.push({ key: 'postpartum', title: 'Is your life stage the same?', said: up.safety?.breastfeeding === 'yes' ? 'You said you were postpartum and breastfeeding.' : 'You said you were postpartum.', when: months(age.postpartum), step: 'lifeStage' });
  }
  const meds = (up.safety?.medications || []).filter((m) => m.source !== 'life_stage').map((m) => m.generic || m.raw).filter(Boolean);
  if (stale.medications && meds.length) {
    out.push({ key: 'medications', title: 'Still taking the same medicines?', said: `You listed ${meds.slice(0, 3).join(', ')}${meds.length > 3 ? ' and more' : ''}.`, when: months(age.medications), step: 'medications' });
  }
  const needs = (up.healthIntent?.needs || []).filter((n) => n.explicit).map((n) => needPhrase(n.id));
  if (stale.needs && needs.length) {
    out.push({ key: 'needs', title: 'Still want help with the same things?', said: `You picked ${needs.slice(0, 3).join(', ')}${needs.length > 3 ? ' and more' : ''}.`, when: months(age.needs), step: 'support' });
  }
  return out;
}

/** Her intake with `key` marked as confirmed today (nothing else changes). */
export function confirmFact(intake, key, nowIso = new Date().toISOString()) {
  return stampFactUpdates(intake, intake, nowIso, { confirmed: [key] });
}

export function readSnooze(storage = globalThis.localStorage) {
  try { const v = JSON.parse(storage?.getItem(SNOOZE_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
export function snooze(key, { now = Date.now(), storage = globalThis.localStorage } = {}) {
  const next = { ...readSnooze(storage), [key]: now + SNOOZE_DAYS * DAY };
  try { storage?.setItem(SNOOZE_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
  return next;
}
/** Stale facts not snoozed. */
export function factsToAsk(quizResults, { now = Date.now(), storage = globalThis.localStorage } = {}) {
  const s = readSnooze(storage);
  return staleFactsFor(quizResults, { now }).filter((f) => !(s[f.key] > now));
}
