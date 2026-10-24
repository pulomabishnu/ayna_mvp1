/**
 * Quick safety answers she gives on Today stay on this device unless she taps
 * "Save to your health profile". This file says which answers can be written
 * into her quiz answers as they are, and builds the patched snapshot.
 *
 * Only an answer that means exactly the same thing as a quiz answer is
 * written directly. The rest open that quiz question instead, so she answers
 * it in full there:
 *   pregnancy yes        -> life stage "I am pregnant"            (direct)
 *   medicines none       -> "Taking anything?" No                  (direct)
 *   breastfeeding yes/no -> "Are you breastfeeding or pumping?"     (direct)
 *   pregnancy no         -> open Life stage (no "not pregnant" answer exists there)
 *   conditions none      -> open Conditions (Today asked about a few, not all)
 *   allergies no         -> open Allergies (Today asked about pain relievers only)
 *   pregnancy not sure   -> stays on this device
 */
import { toggleLifeStageSelection } from '../mobile/data/intakeModel.js';

export const STEP_FOR_FIELD = { pregnancy: 'lifeStage', medications: 'medications', conditions: 'conditions', allergies: 'allergies', breastfeeding: 'lifeStage' };
export const ANSWER_FIELDS = ['pregnancy', 'medications', 'conditions', 'allergies', 'breastfeeding'];

const SENTENCE = {
  'pregnancy:yes': 'You said you are pregnant.',
  'pregnancy:no': 'You said you are not pregnant.',
  'medications:none': 'You said you do not take regular medicines.',
  'conditions:none': 'You said you have none of the conditions we asked about.',
  'allergies:no': 'You said you have not reacted to a pain reliever.',
  'breastfeeding:yes': 'You said you are breastfeeding or pumping.',
  'breastfeeding:no': 'You said you are not breastfeeding.',
};

/**
 * How one Today answer can reach her profile:
 *   { kind: 'direct', text } | { kind: 'open_step', step, text } | null (device only)
 */
export function saveOptionFor(field, value) {
  const key = `${field}:${value}`;
  const text = SENTENCE[key];
  if (!text) return null;
  if (key === 'pregnancy:yes' || key === 'medications:none' || field === 'breastfeeding') return { kind: 'direct', text };
  return { kind: 'open_step', step: STEP_FOR_FIELD[field], text };
}

const arr = (v) => (Array.isArray(v) ? v : []);
const unskip = (snap, step) => ({ ...snap, skippedSteps: arr(snap.skippedSteps).filter((s) => s !== step) });

/** Her intake snapshot with this answer written in, or null when it can't be written directly. */
export function patchIntakeWithTodayAnswer(snapshot, field, value) {
  if (!snapshot || typeof snapshot !== 'object' || saveOptionFor(field, value)?.kind !== 'direct') return null;
  if (field === 'pregnancy') {
    const current = arr(snapshot.lifeStageSelections).length ? arr(snapshot.lifeStageSelections) : (snapshot.lifeStage ? [snapshot.lifeStage] : []);
    const next = current.includes('I am pregnant') ? current : toggleLifeStageSelection(current, 'I am pregnant');
    return unskip({ ...snapshot, lifeStageSelections: next, lifeStage: next[0] || '' }, 'lifeStage');
  }
  if (field === 'medications') return unskip({ ...snapshot, takesCurrent: 'No', currentMedicationItems: [], currentMedications: '' }, 'medications');
  if (field === 'breastfeeding') return { ...snapshot, breastfeedingStatus: value === 'yes' ? 'Yes' : 'No' };
  return null;
}
