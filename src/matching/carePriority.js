// Care-first rules live outside a product score, so every matching surface agrees.
// Clinical sources: ACOG bleeding in pregnancy, https://www.acog.org/womens-health/faqs/bleeding-during-pregnancy
// These are navigation prompts, not a diagnosis or treatment recommendation.
// Asking for period products is not, on its own, a report of bleeding.
// The care-first rule only triggers from a selected bleeding symptom.
const BLEEDING_SYMPTOMS = new Set(['cycle.spotting', 'period.heavy', 'period.light']);
const RELATED_SHELVES = new Set([...BLEEDING_SYMPTOMS, 'period.product_support']);
export function pregnancyBleedingCare(up) {
  const hasBleeding = (up?.healthIntent?.needs || []).some(n => BLEEDING_SYMPTOMS.has(n.id));
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
/**
 * Founder decision (Ameera, Nov 15): some needs get care guidance, not products.
 * Fatigue: no energy supplements or iron by default; sleep products only when she picked a sleep need
 * (that shows on its own sleep shelf). Unexplained abdominal pain: guidance first.
 * Sources read Nov 15: MedlinePlus "Fatigue" (https://medlineplus.gov/ency/article/003088.htm) and
 * "Abdominal pain" (https://medlineplus.gov/ency/article/003120.htm).
 */
export const CARE_GUIDANCE = {
  'energy.fatigue': {
    code: 'fatigue_check',
    text: 'Tiredness has many possible causes, like low iron, thyroid problems, poor sleep or low mood. If rest doesn\u2019t help, a clinician can check, often with a simple blood test. Get help right away if it comes with confusion, dizziness or thoughts of harming yourself.',
    source: { label: 'MedlinePlus: Fatigue', url: 'https://medlineplus.gov/ency/article/003088.htm' },
  },
  'pain.abdominal': {
    code: 'abdominal_check',
    text: 'Most belly pain isn\u2019t serious. If it doesn\u2019t improve in 24 to 48 hours, check with a clinician. Get help right away for sudden, sharp pain or a hard, tender belly. Period cramps, bloating and constipation each have their own options in the quiz.',
    source: { label: 'MedlinePlus: Abdominal pain', url: 'https://medlineplus.gov/ency/article/003120.htm' },
  },
};

export function careFirstForNeed(up, needId) {
  const care = pregnancyBleedingCare(up);
  if (!care) return null;
  return RELATED_SHELVES.has(needId) || needId === 'pain.pelvic' ? care : null;
}

/** The guidance that replaces products on this shelf, or null. A diagnosed iron deficiency keeps the fatigue shelf. */
export function careGuidanceFor(up, needId) {
  const g = CARE_GUIDANCE[needId];
  if (!g) return null;
  if (needId === 'energy.fatigue' && (up?.safety?.conditions || []).some((c) => c.id === 'anemia')) return null;
  return g;
}
