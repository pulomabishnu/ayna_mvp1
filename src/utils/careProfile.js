/**
 * One reading of the health profile for every page that shows it back
 * (Doctor prep, You, safety alerts), so the same answer never reads two
 * different ways. Reads the full intake when present, else the legacy shape.
 */
const EXCLUSIVE = /^(none that i know of|prefer not to say|not sure|no)$/i;
const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => String(x || '').trim()).filter(Boolean);

export function getCareProfile(quizResults) {
  const q = quizResults || {};
  const intake = q.fullHealthIntake && typeof q.fullHealthIntake === 'object' ? q.fullHealthIntake : q;
  const diagnoses = arr(intake.diagnosisSelections?.length ? intake.diagnosisSelections : intake.conditions).filter((d) => !EXCLUSIVE.test(d));
  const diagWords = diagnoses.map((d) => d.toLowerCase());
  const frustrations = arr(q.frustrations);
  // Symptoms and needs: what she wants help with, minus anything that is a diagnosis.
  const symptoms = frustrations.filter((f) => !diagWords.some((d) => f.toLowerCase().includes(d) || d.includes(f.toLowerCase().replace(/ symptoms$/, ''))));
  const goals = arr(intake.goals);
  const allergyStatus = String(intake.allergyStatus || '').trim();
  const allergies = allergyStatus === 'Yes' ? arr(intake.allergyItems) : arr(intake.allergies);
  const takes = String(intake.takesCurrent || '').trim();
  const medications = takes === 'Yes' || !takes ? arr(intake.currentMedicationItems?.length ? intake.currentMedicationItems : intake.currentMedications) : [];
  const prefs = arr(q.preference);
  const mustBe = prefs.map((p) => (/fragrance-free/i.test(p) ? 'Fragrance-free' : p.replace(/^\w/, (c) => c.toUpperCase())));
  return {
    age: q.age || intake.age || null,
    diagnoses,
    symptoms,
    goals,
    allergies,
    allergyStatus,
    medications,
    medicationStatus: takes,
    mustBe,
    prefersFragranceFree: prefs.some((p) => /fragrance-free/i.test(p)),
  };
}

export default getCareProfile;
