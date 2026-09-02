// Mirrors AREAS in src/components/EcosystemBubbles.jsx: the real
// MACRO_GROUPS taxonomy (minus 'all') plus two ecosystem-only areas.
// Product -> area resolution (resolveArea/resolveEcosystemProductArea in
// that file) is intentionally NOT reimplemented here — deferred until real
// product data is wired in, at which point products should already carry
// an areaKey computed by the real function, not a mobile-local guess.
export const ECOSYSTEM_AREAS = [
  { key: 'period', label: 'Period' },
  { key: 'intimate', label: 'Intimate Care' },
  { key: 'sexual', label: 'Sexual Wellness' },
  { key: 'birth-control', label: 'Birth Control' },
  { key: 'fertility', label: 'Fertility' },
  { key: 'pregnancy', label: 'Pregnancy' },
  { key: 'postpartum', label: 'Postpartum' },
  { key: 'breast', label: 'Breast Care' },
  { key: 'pelvic', label: 'Pelvic' },
  { key: 'menopause', label: 'Menopause' },
  { key: 'hormones', label: 'Hormones' },
  { key: 'skin', label: 'Skin' },
  { key: 'hair', label: 'Hair' },
  { key: 'gut', label: 'Gut' },
  { key: 'sleep-stress', label: 'Sleep + Stress' },
  { key: 'pain-recovery', label: 'Pain + Recovery' },
  { key: 'tests-devices', label: 'Tests + Devices' },
  { key: 'care', label: 'Clinicians' },
  { key: 'supplements', label: 'Supplements' },
];

// Mirrors MAX_SATELLITES in EcosystemBubbles.jsx.
export const MAX_SATELLITES = 6;

// Mirrors CANVAS/CANVAS_H/CENTRE/ORBIT/BUBBLE in EcosystemBubbles.jsx.
export const CANVAS = 560;
export const CANVAS_H = 520;
export const CENTRE = { x: 280, y: 260 };
export const ORBIT = 178;
export const BUBBLE = 128;

// Mirrors seatPosition() in EcosystemBubbles.jsx.
export function seatPosition(index, total) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  return {
    left: CENTRE.x + ORBIT * Math.sin(angle) - BUBBLE / 2,
    top: CENTRE.y - ORBIT * Math.cos(angle) - BUBBLE / 2,
  };
}
