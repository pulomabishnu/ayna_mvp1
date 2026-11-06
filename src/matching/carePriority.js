// Care-first rules live outside a product score, so every matching surface agrees.
// Clinical sources: ACOG bleeding in pregnancy, https://www.acog.org/womens-health/faqs/bleeding-during-pregnancy
// These are navigation prompts, not a diagnosis or treatment recommendation.
const BLEEDING_NEEDS = new Set(['cycle.spotting', 'period.heavy', 'period.light', 'period.product_support']);
export function pregnancyBleedingCare(up) {
  const hasBleeding = (up?.healthIntent?.needs || []).some(n => BLEEDING_NEEDS.has(n.id));
  if (!up?.safety?.pregnant || !hasBleeding) return null;
  const pelvicPain = (up.healthIntent.needs || []).some(n => n.id === 'pain.pelvic');
  return {
    code: 'pregnancy_bleeding',
    source: 'https://www.acog.org/womens-health/faqs/bleeding-during-pregnancy',
    title: 'Pregnancy bleeding needs medical assessment',
    text: pelvicPain
      ? 'Bleeding or spotting with pelvic pain during pregnancy needs prompt medical assessment. Contact your ob-gyn or maternity care team now. Severe pain, heavy bleeding, fainting or dizziness warrants emergency care. ayna cannot determine the cause.'
      : 'Contact your ob-gyn or maternity care team about any bleeding or spotting during pregnancy. Heavy bleeding, severe pain, fainting or dizziness warrants emergency care. ayna cannot determine the cause.',
  };
}
// Do not market symptom-management products as care for active pregnancy bleeding.
// Pelvic pain is also withheld when accompanying bleeding is reported.
export function careFirstForNeed(up, needId) {
  const care = pregnancyBleedingCare(up);
  if (!care) return null;
  return BLEEDING_NEEDS.has(needId) || needId === 'pain.pelvic' ? care : null;
}
