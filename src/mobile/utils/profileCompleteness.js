// Single source of truth for "how complete is this person's health
// profile" — used both to show a real percentage on the Profile hub
// (ProfileFlow.jsx) and to decide which intake step to jump back to when
// someone wants to finish it (IntakeScreen.jsx's initialSnapshot/resume
// mode). Keeping one list instead of two prevents them drifting apart.
//
// Operates on quizAnswers.fullHealthIntake, the raw buildSnapshot() output
// mapIntakeToLegacyQuizProfile() (src/utils/healthIntake.js) tucks onto
// quizAnswers — NOT the intake wizard's own EMPTY-shaped state (field names
// differ in a couple of spots, e.g. fsaHsa vs fsaHsaAnswer).
//
// 'trustedBrands' only counts against someone who actually said they stick
// with brands they trust — IntakeScreen.jsx only shows that step at all
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
  { stepId: 'trust', check: (i) => Array.isArray(i.trustRanking) && i.trustRanking.length > 0 },
  { stepId: 'anythingElse', check: (i) => !!(i.anythingElse && i.anythingElse.trim()) },
];

export function getProfileCompletionPct(intake) {
  if (!intake) return 0;
  const filled = FIELDS.filter(({ check }) => check(intake)).length;
  return Math.round((filled / FIELDS.length) * 100);
}

// The step id IntakeScreen should land on to help someone finish their
// profile — the first still-empty one, in wizard order. null means nothing
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
