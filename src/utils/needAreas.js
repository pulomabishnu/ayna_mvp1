// Her areas on the Save sheet (QA3 M11): the labels of the needs she picked
// ("Heavy periods", "Hot flashes"), from the same selected-needs logic the
// matcher uses, in her order. Never product categories ("Virtual care").
// `select` is getSelectedNeeds (data/products.js on the app, data/catalog.js
// on the website), passed in so each side keeps its own loading.

/** ['Heavy periods', 'Hot flashes'] for her answers, [] when none or not loaded. */
export function needAreaLabels(answers, select, limit = 4) {
  if (!answers || typeof select !== 'function') return [];
  try {
    return [...new Set((select(answers) || []).map((n) => String(n?.label || '').trim()).filter(Boolean))].slice(0, limit);
  } catch {
    return [];
  }
}

/** "3 picks · 2 areas" (no em dash). */
export function picksAreasLine(picks, areas) {
  const n = Number(picks) || 0;
  const a = Number(areas) || 0;
  return `${n} ${n === 1 ? 'pick' : 'picks'}${a ? ` · ${a} ${a === 1 ? 'area' : 'areas'}` : ''}`;
}
