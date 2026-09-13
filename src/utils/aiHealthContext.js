function compact(value, maxItems = 12) {
  if (Array.isArray(value)) return value.filter(Boolean).slice(0, maxItems);
  if (typeof value === 'string') return value.trim().slice(0, 500);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return undefined;
}

function ageRange(age) {
  const n = Number.parseInt(age, 10);
  if (!Number.isFinite(n)) return undefined;
  if (n < 25) return '18-24';
  if (n < 35) return '25-34';
  if (n < 45) return '35-44';
  if (n < 55) return '45-54';
  if (n < 65) return '55-64';
  return '65+';
}

function put(target, key, value) {
  const next = compact(value);
  if (next === undefined || next === '' || (Array.isArray(next) && next.length === 0)) return;
  target[key] = next;
}

/**
 * Builds the smallest useful health context for a user-requested AI feature.
 * Direct account identifiers, contact information, ZIP/location, insurance,
 * FSA/HSA and unrelated free text are deliberately never included.
 */
export function buildAiHealthContext(source, question = '') {
  const raw = source?.fullHealthIntake || source || {};
  if (!raw || typeof raw !== 'object') return {};

  const out = {};
  const range = ageRange(raw.age);
  if (range) out.ageRange = range;

  for (const key of [
    'lifeStage',
    'menstrualCycle',
    'conditions',
    'symptoms',
    'primaryConcerns',
    'goals',
    'sensitivities',
    'allergies',
    'productPreferences',
    'productsToAvoid',
    'painLevel',
  ]) put(out, key, raw[key]);

  const q = String(question || '').toLowerCase();
  const needsMedicationContext = /interact|interaction|medication|medicine|drug|supplement|safe with|contraindicat/.test(q);
  const needsPregnancyContext = /pregnan|postpartum|breastfeed|trying to conceive|ttc|fertil/.test(q);

  if (needsMedicationContext) {
    put(out, 'currentMedications', raw.currentMedications || raw.medications);
    put(out, 'currentSupplements', raw.currentSupplements || raw.supplements);
  }
  if (needsPregnancyContext) {
    put(out, 'pregnancyStatus', raw.pregnancyStatus || raw.pregnancy);
    put(out, 'postpartumStatus', raw.postpartumStatus || raw.postpartum);
    put(out, 'breastfeeding', raw.breastfeeding);
  }

  return out;
}
