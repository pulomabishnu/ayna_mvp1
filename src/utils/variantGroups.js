/**
 * Variant labels like "Seafoam Green / Small" become option groups (Colour: Seafoam Green, ...;
 * Size: Small, Regular) instead of one chip per combination stacked down the page
 * (founder, Oct 27 and Nov 11: "don't just stack things").
 */
const SIZE_WORD = /\d|\b(xs|s|m|l|xl|xxl|small|medium|large|regular|super|light|heavy|mini|plus|size|pack|count|oz|ml|petite|teen)\b/i;

export function variantGroups(labels = []) {
  const clean = labels.map((l) => String(l || '').trim()).filter(Boolean);
  const split = clean.map((l) => l.split(/\s+\/\s+/));
  const pairs = split.filter((s) => s.length === 2);
  if (pairs.length >= 2) {
    const uniq = (i) => [...new Set(pairs.map((s) => s[i]))];
    const a = uniq(0); const b = uniq(1);
    const isSize = (vals) => vals.every((v) => SIZE_WORD.test(v));
    const name = (vals, other) => (isSize(vals) ? 'Size' : isSize(other) ? 'Colour' : 'Option');
    const groups = [{ label: name(a, b), values: a }, { label: name(b, a), values: b }];
    const rest = split.filter((s) => s.length !== 2).map((s) => s.join(' / '));
    if (rest.length) groups.push({ label: 'Also', values: rest });
    return groups;
  }
  return [{ label: clean.some((l) => SIZE_WORD.test(l)) ? 'Size' : 'Options', values: clean }];
}
