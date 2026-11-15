/**
 * Temperature unit for display. Stored values stay in °C (metrics.js); people in the US read °F
 * (Nov 14 sweep: Home said "0.3 °C higher" while Coming up said "0.4 to 0.8 °F"). Decided once from the
 * device locale; tests and servers without a locale get °C, as before.
 */
let override = null;
/** For tests: 'C', 'F' or null (locale). */
export function setTempUnit(u) { override = u; }

export function tempUnit() {
  if (override) return override;
  const lang = typeof navigator !== 'undefined' && navigator.language ? navigator.language : '';
  if (typeof window === 'undefined' || !lang) return 'C';
  // Vitest's DOM reports en-US too; keep °C there unless a test asks for °F.
  if (typeof process !== 'undefined' && process.env?.VITEST) return 'C';
  return /-(US|LR|MM)$/i.test(lang) ? 'F' : 'C';
}

/** A change in temperature (°C in): "0.5 °F" or "0.3 °C". */
export function tempDelta(c, places = 1) {
  const f = tempUnit() === 'F';
  const v = f ? c * 1.8 : c;
  return `${Math.abs(v).toFixed(places)} °${f ? 'F' : 'C'}`;
}

/** A reading (°C in): "98.2 °F" or "36.8 °C". */
export function tempReading(c, places = 1) {
  const f = tempUnit() === 'F';
  return `${(f ? c * 9 / 5 + 32 : c).toFixed(places)} °${f ? 'F' : 'C'}`;
}
