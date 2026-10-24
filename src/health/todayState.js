/**
 * Builds decide()'s state (src/health/decisionEngine.js) from her real data:
 * the daily log, her tries, cross-cycle patterns, her intake profile, the
 * cycle phase, and Today's own memory (seen, dismissed, triage, answers).
 * Pure: no storage, no network. The hook (useToday.js) feeds it.
 *
 * Interest is not history (section 39): browsing, saves and Community
 * activity are never passed in.
 */
import { buildUserProfile } from '../matching/userProfile.js';
import { findCyclePatterns } from './cyclePatterns.js';
import { estimatePhase } from './phase.js';

const UNKNOWN = new Set(['skipped', 'not_sure', 'prefer_not', 'unknown', undefined, null]);

function skeletonProfile() {
  return {
    healthIntent: { needs: [] },
    physiology: { lifeStages: [] },
    safety: {
      pregnancyStatus: 'unknown', trimester: null, ttc: false, breastfeeding: 'unknown',
      allergyStatus: 'unknown', allergies: [], medications: [], medicationsState: 'skipped',
      conditions: [], conditionsState: 'skipped', age: null, underSupportedAge: false, careFirst: false, careProminent: false,
    },
  };
}

/**
 * Quick safety answers she gave on Today fill in what the intake left
 * unknown. They never overwrite an answer she already gave in the intake.
 * "Not sure" about pregnancy is treated as possibly pregnant (never safe).
 * "Yes" to medicines, conditions or allergies opens her answers instead
 * (a yes without the detail would read as safe), so it is not stored here.
 */
export function applyTodayAnswers(profile, answers = {}) {
  if (!answers || !Object.keys(answers).length) return profile;
  const base = profile || skeletonProfile();
  const s = { ...base.safety };
  if (s.pregnancyStatus === 'unknown') {
    if (answers.pregnancy === 'no') s.pregnancyStatus = 'not_indicated';
    else if (answers.pregnancy === 'yes') s.pregnancyStatus = 'pregnant';
    else if (answers.pregnancy === 'not_sure') s.pregnancyStatus = 'reported';
  }
  if (UNKNOWN.has(s.medicationsState) && answers.medications === 'none') s.medicationsState = 'explicit_no';
  if (UNKNOWN.has(s.conditionsState) && answers.conditions === 'none') s.conditionsState = 'explicit_no';
  if (s.allergyStatus !== 'yes' && s.allergyStatus !== 'no' && answers.allergies === 'no') s.allergyStatus = 'no';
  if (s.breastfeeding === 'unknown' && (answers.breastfeeding === 'yes' || answers.breastfeeding === 'no')) s.breastfeeding = answers.breastfeeding;
  return { ...base, safety: s };
}

export function profileFromIntake(intake) {
  if (!intake || typeof intake !== 'object' || !Object.keys(intake).length) return null;
  try { return buildUserProfile(intake); } catch { return null; }
}

/** Days with anything logged (for the coarse history bucket in analytics). */
export function daysLogged(log) {
  return Object.values(log || {}).filter((e) => e && ['pain', 'flow', 'pms', 'sleep', 'mood', 'skin'].some((f) => e[f] != null)).length;
}

export function buildTodayState({
  today, log = {}, tries = [], intake = null, profile = null, healthRows = [], cycle = null, hormonalBC = false,
  store = {}, intent = null, products = [], cycleStarts = [],
} = {}) {
  const prof = applyTodayAnswers(profile || profileFromIntake(intake), store.answers || {});
  const entries = Object.values(log || {});
  let patterns = [];
  try { patterns = findCyclePatterns({ log, healthRows, cycleStarts, today, hormonalBC }); } catch { patterns = []; }
  const labels = {};
  for (const t of tries) {
    const p = t?.kind === 'product' ? products.find((x) => x?.id === t.ref) : null;
    if (p?.name) labels[t.ref] = p.name;
  }
  return {
    today,
    logs: entries,
    tries,
    patterns,
    profile: prof,
    phase: cycle?.cycleDay ? estimatePhase(cycle) : null,
    cycleStarts,
    triage: store.triage && store.triage.day === today ? store.triage : null,
    seen: store.seen || {},
    dismissed: store.dismissed || {},
    intent,
    products,
    labels,
  };
}
