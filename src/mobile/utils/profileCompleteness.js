import { ONBOARDING_WHY } from '../data/onboardingFlow.js';

// Single source of truth for "how complete is this person's health
// profile", used both to show a real percentage on the Profile hub
// (ProfileFlow.jsx) and to decide which intake step to jump back to when
// someone wants to finish it (IntakeScreen.jsx's initialSnapshot/resume
// mode). Keeping one list instead of two prevents them drifting apart.
//
// Operates on quizAnswers.fullHealthIntake, the raw buildSnapshot() output
// mapIntakeToLegacyQuizProfile() (src/utils/healthIntake.js) tucks onto
// quizAnswers, NOT the intake wizard's own EMPTY-shaped state (field names
// differ in a couple of spots, e.g. fsaHsa vs fsaHsaAnswer).
//
// 'trustedBrands' only counts against someone who actually said they stick
// with brands they trust, IntakeScreen.jsx only shows that step at all
// when brandOpenness is one of these two answers, so scoring it against
// everyone else would ding people for a question they were never asked.
function trustedBrandsRelevant(intake) {
  return (
    intake.brandOpenness === 'I mostly stick with brands I already trust'
    || intake.brandOpenness === 'I prefer trusted brands but am open to something new'
  );
}

const FIELDS = [
  { stepId: 'age', check: (i) => !!i.age },
  { stepId: 'lifeStage', check: (i) => Array.isArray(i.lifeStageSelections) && i.lifeStageSelections.length > 0 },
  { stepId: 'zip', check: (i) => !!i.zipcode },
  { stepId: 'support', check: (i) => Array.isArray(i.supportSelections) && i.supportSelections.length > 0 },
  { stepId: 'conditions', check: (i) => Array.isArray(i.diagnosisSelections) && i.diagnosisSelections.length > 0 },
  { stepId: 'allergies', check: (i) => !!i.allergyStatus },
  { stepId: 'medications', check: (i) => !!i.takesCurrent },
  { stepId: 'safety', check: (i) => !!i.safetyConcern },
  { stepId: 'products', check: (i) => Array.isArray(i.productHistory) && i.productHistory.length > 0 },
  { stepId: 'formats', check: (i) => Array.isArray(i.preferredFormats) && i.preferredFormats.length > 0 },
  { stepId: 'priceRange', check: (i) => Array.isArray(i.priceRange) && i.priceRange.length > 0 },
  { stepId: 'brandOpenness', check: (i) => !!i.brandOpenness },
  { stepId: 'trustedBrands', check: (i) => !trustedBrandsRelevant(i) || (Array.isArray(i.trustedBrands) && i.trustedBrands.length > 0) },
  { stepId: 'avoidIngredients', check: (i) => Array.isArray(i.avoidIngredients) && i.avoidIngredients.length > 0 },
  { stepId: 'fsaHsa', check: (i) => !!i.fsaHsa },
  { stepId: 'anythingElse', check: (i) => !!(i.anythingElse && i.anythingElse.trim()) },
];

export function getProfileCompletionPct(intake) {
  if (!intake) return 0;
  const filled = FIELDS.filter(({ check }) => check(intake)).length;
  return Math.round((filled / FIELDS.length) * 100);
}

// The step id IntakeScreen should land on to help someone finish their
// profile, the first still-empty one, in wizard order. null means nothing
// tracked here is missing.
export function getFirstIncompleteStepId(intake) {
  if (!intake) return null;
  const next = FIELDS.find(({ check }) => !check(intake));
  return next ? next.stepId : null;
}

// Every step id still missing an answer, so IntakeScreen can flag each one
// as the person pages through, not just the first.
export function getIncompleteStepIds(intake) {
  if (!intake) return [];
  return FIELDS.filter(({ check }) => !check(intake)).map((f) => f.stepId);
}

// ─── Progressive asks (UX spec section 3: "progressively collect more
// information later"; master prompt section 12, the information gap) ───────
// After the first run, one question at a time on Today for anything she
// skipped or was never asked, safety first. Never a question she already
// answered (or said "prefer not to say" to), and "Not now" keeps it away for
// a while (stored with the Today store's dismiss()).
const answered = (v) => (Array.isArray(v) ? v.filter((x) => String(x ?? '').trim()).length > 0 : String(v ?? '').trim() !== '');
export const PROGRESSIVE_ASKS = [
  { stepId: 'allergies', title: 'Any allergies or sensitivities?', why: ONBOARDING_WHY.allergies, has: (i) => answered(i.allergyStatus) },
  { stepId: 'medications', title: 'Taking any medicines or supplements?', why: ONBOARDING_WHY.medications, has: (i) => answered(i.takesCurrent) },
  { stepId: 'conditions', title: 'Any diagnosed conditions?', why: ONBOARDING_WHY.conditions, has: (i) => answered(i.diagnosisSelections) },
  { stepId: 'goals', title: 'What are your goals with ayna?', why: ONBOARDING_WHY.goals, has: (i) => answered(i.goals) },
  { stepId: 'formats', title: 'Which product formats do you like?', why: ONBOARDING_WHY.formats, has: (i) => answered(i.preferredFormats) },
  { stepId: 'priceRange', title: 'What do you usually spend per item?', why: ONBOARDING_WHY.priceRange, has: (i) => answered(i.priceRange) },
  { stepId: 'avoidIngredients', title: 'Any ingredients to prefer or avoid?', why: ONBOARDING_WHY.avoidIngredients, has: (i) => answered(i.avoidIngredients) },
  { stepId: 'fsaHsa', title: 'Do you use an FSA or HSA?', why: ONBOARDING_WHY.fsaHsa, has: (i) => answered(i.fsaHsa) },
  { stepId: 'products', title: 'What have you tried before?', why: 'What worked and what did not helps us avoid repeats and find better fits.', has: (i) => answered(i.productHistory) },
  { stepId: 'zip', title: 'Want care options near you?', why: 'Your ZIP code is only used to find clinics, telehealth and stores that serve your area. It never changes a match.', has: (i) => answered(i.zipcode) },
];
export const progressiveAskId = (stepId) => `profile_ask:${stepId}`;

/**
 * The one question to ask next, or null. `intake` is fullHealthIntake;
 * `dismissed` is the Today store's DismissedMap; `today` a YYYY-MM-DD day.
 */
export function nextProgressiveAsk(intake, { dismissed = {}, today = '' } = {}) {
  if (!intake || intake.personalizationCompleted !== true) return null;
  for (const ask of PROGRESSIVE_ASKS) {
    if (ask.has(intake)) continue;
    // Skipped just now (first week after setup): not asked again yet.
    const answeredAt = Date.parse(intake.personalizationCompletedAt || '');
    if ((intake.skippedSteps || []).includes(ask.stepId) && Number.isFinite(answeredAt) && today && Date.parse(`${today}T12:00:00`) - answeredAt < 7 * 864e5) continue;
    const d = dismissed[progressiveAskId(ask.stepId)];
    if (d && d.until && (!today || d.until > today)) continue;
    return { id: progressiveAskId(ask.stepId), type: 'ask', stepId: ask.stepId, title: ask.title, why: ask.why };
  }
  return null;
}
