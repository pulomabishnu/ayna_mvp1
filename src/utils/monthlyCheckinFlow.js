/**
 * Pure helpers behind src/components/MonthlyCheckin.jsx: which steps show,
 * how last month's answers prefill this month, and the answers object that
 * goes to onComplete and to monthly_checkins.answers.
 */
import { monthKey } from './monthlyCheckinStore';

export const ANSWERS_VERSION = 1;

export const ROUTINE_GREAT = 'Great. No changes';
export const SCREENING_FOCUS = 'Remind me about Pap / STI screenings';

export const PRODUCT_VERDICTS = [
  ['helped', 'Helped'],
  ['no_change', 'No change'],
  ['worse', 'Made it worse'],
];
const VERDICT_VALUES = new Set(PRODUCT_VERDICTS.map(([v]) => v));

export const SAFETY_OPTIONS = ['Yes', 'No', 'Not sure'];

const SCREENING_FIELDS = ['sexuallyActive', 'lastSTI', 'lastPap'];

/**
 * Steps in order. Products only when the ecosystem has any; focus only when
 * the routine isn't "great"; screening only when asked for; the safety
 * question always, last.
 */
export function computeCheckinSteps({ howIsRoutine, focusAreas = [], hasProducts = false }) {
  const steps = ['routine'];
  if (hasProducts) steps.push('products');
  const showFocus = !!howIsRoutine && howIsRoutine !== ROUTINE_GREAT;
  if (showFocus) steps.push('focus');
  if (showFocus && focusAreas.includes(SCREENING_FOCUS)) steps.push('screening');
  steps.push('safety');
  return steps;
}

/**
 * Initial wizard state. `prior` is a previous check-in's answers (last month,
 * or this month's when updating it). Verdicts are kept only for products
 * still in the ecosystem. The safety question is never prefilled: it asks
 * about right now.
 */
export function buildInitialCheckinState(prior = null, productIds = []) {
  const p = prior && typeof prior === 'object' ? prior : {};
  const ids = new Set(productIds);
  const productVerdicts = {};
  if (p.productVerdicts && typeof p.productVerdicts === 'object') {
    Object.entries(p.productVerdicts).forEach(([id, v]) => {
      if (ids.has(id) && VERDICT_VALUES.has(v)) productVerdicts[id] = v;
    });
  }
  const screening = {};
  SCREENING_FIELDS.forEach((f) => { screening[f] = typeof p[f] === 'string' ? p[f] : ''; });
  return {
    howIsRoutine: typeof p.howIsRoutine === 'string' ? p.howIsRoutine : '',
    focusAreas: Array.isArray(p.focusAreas) ? p.focusAreas.filter((x) => typeof x === 'string') : [],
    productVerdicts,
    screening,
    safetyConcern: '',
  };
}

/** True when a prior check-in carried anything into the initial state. */
export function hasPrefill(state) {
  return !!(state?.howIsRoutine || state?.focusAreas?.length || Object.keys(state?.productVerdicts || {}).length);
}

/**
 * The answers object. Keeps every field the old payload had (App.jsx,
 * TrackedItems and Screenings read newSymptoms / lastSTI / lastPap /
 * focusAreas) and adds productVerdicts, safetyConcern and month.
 * `focusToSymptom` is MonthlyCheckin's FOCUS_TO_SYMPTOM map.
 */
export function buildCheckinAnswers(state, { products = [], focusToSymptom = {}, now = new Date() } = {}) {
  const great = state.howIsRoutine === ROUTINE_GREAT;
  const focusAreas = great ? [] : [...(state.focusAreas || [])];
  const askedScreening = focusAreas.includes(SCREENING_FOCUS);
  const currentIds = new Set(products.map((p) => p.id));
  const productVerdicts = {};
  Object.entries(state.productVerdicts || {}).forEach(([id, v]) => {
    if (currentIds.has(id) && VERDICT_VALUES.has(v)) productVerdicts[id] = v;
  });
  const productNames = {};
  Object.keys(productVerdicts).forEach((id) => {
    const p = products.find((x) => x.id === id);
    if (p?.name) productNames[id] = String(p.name).slice(0, 120);
  });
  return {
    version: ANSWERS_VERSION,
    month: monthKey(now),
    howIsRoutine: state.howIsRoutine,
    focusAreas,
    newSymptoms: focusAreas.map((o) => focusToSymptom[o]).filter(Boolean),
    sexuallyActive: askedScreening ? state.screening?.sexuallyActive || '' : '',
    lastSTI: askedScreening ? state.screening?.lastSTI || '' : '',
    lastPap: askedScreening ? state.screening?.lastPap || '' : '',
    productVerdicts,
    productNames,
    safetyConcern: state.safetyConcern || '',
  };
}

/** Counts for the summary screen. */
export function summarizeVerdicts(productVerdicts = {}) {
  const out = { helped: 0, no_change: 0, worse: 0 };
  Object.values(productVerdicts || {}).forEach((v) => { if (v in out) out[v] += 1; });
  return out;
}
