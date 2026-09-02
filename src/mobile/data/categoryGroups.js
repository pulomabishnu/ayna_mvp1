// id/label copied from MACRO_GROUPS in src/data/products.js — the site's
// real user-facing category taxonomy (used as Discovery's filter chips).
// Colors here are presentational only; the real data has no color mapping.
// NOTE: this file intentionally does NOT reimplement itemMatchesMacroGroup
// (the real category+keyword matching logic in Discovery.jsx) — that stays
// deferred until the mobile app wires in real product data, at which point
// it should be reused from there rather than reimplemented.
export const CATEGORY_GROUPS = [
  { id: 'all', label: 'All', color: '#A2603C' },
  { id: 'period', label: 'Period', color: '#C0761F' },
  { id: 'intimate', label: 'Intimate Care', color: '#B0537A' },
  { id: 'sexual', label: 'Sexual Wellness', color: '#9C4F6E' },
  { id: 'birth-control', label: 'Birth Control', color: '#6B5B95' },
  { id: 'fertility', label: 'Fertility', color: '#4E3866' },
  { id: 'pregnancy', label: 'Pregnancy', color: '#7E9C7A' },
  { id: 'postpartum', label: 'Postpartum', color: '#8A6A3C' },
  { id: 'breast', label: 'Breast Care', color: '#C77B7B' },
  { id: 'pelvic', label: 'Pelvic', color: '#5C7A4A' },
  { id: 'menopause', label: 'Menopause', color: '#A2603C' },
  { id: 'hormones', label: 'Hormones', color: '#3F7A6A' },
  { id: 'skin', label: 'Skin', color: '#C98A4B' },
  { id: 'hair', label: 'Hair', color: '#B08968' },
  { id: 'gut', label: 'Gut', color: '#5C7A4A' },
  { id: 'sleep-stress', label: 'Sleep + Stress', color: '#242A52' },
  { id: 'pain-recovery', label: 'Pain + Recovery', color: '#A2603C' },
  { id: 'tests-devices', label: 'Tests + Devices', color: '#78716C' },
];
