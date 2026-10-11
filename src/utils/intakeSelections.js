const PERIOD_STATES = ['I get periods regularly', 'My periods are irregular', 'I do not currently get periods'];
const MENOPAUSE_STATES = ['I am in perimenopause', 'I am in menopause', 'I am post-menopause'];

export function normalizeAge(value) {
  if (value == null || String(value).trim() === '') return null;
  const age = Number(value);
  return Number.isInteger(age) && age >= 18 && age <= 120 ? age : null;
}

export function selectLifeStage(current, value) {
  if (current.includes(value)) return current.filter((item) => item !== value);
  const conflicts = new Set();
  if (PERIOD_STATES.includes(value)) PERIOD_STATES.forEach((item) => conflicts.add(item));
  if (MENOPAUSE_STATES.includes(value)) MENOPAUSE_STATES.forEach((item) => conflicts.add(item));
  if (['I am in menopause', 'I am post-menopause'].includes(value)) {
    PERIOD_STATES.slice(0, 2).forEach((item) => conflicts.add(item));
    ['I am pregnant', 'I am trying to conceive'].forEach((item) => conflicts.add(item));
  }
  if (PERIOD_STATES.slice(0, 2).includes(value)) {
    ['I am in menopause', 'I am post-menopause'].forEach((item) => conflicts.add(item));
  }
  if (value === 'I am pregnant') ['I am postpartum', 'I am trying to conceive', ...MENOPAUSE_STATES.slice(1)].forEach((item) => conflicts.add(item));
  if (value === 'I am postpartum' || value === 'I am trying to conceive') conflicts.add('I am pregnant');
  return [...current.filter((item) => !conflicts.has(item)), value];
}

export function normalizeLifeStages(values) {
  return [...new Set(values || [])].reduce((selected, value) => selectLifeStage(selected, value), []);
}
