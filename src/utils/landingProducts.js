const PERIOD_CATEGORIES = new Set(['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'liner', 'cramp-relief']);

export function productMatchesCareArea(product, area) {
  if (['p-nature-made-iron-65mg', 'p-natures-bounty-d3-125mcg'].includes(product.id)) return false;
  if (area.label === 'Period care') return PERIOD_CATEGORIES.has(product.category);
  const tags = [...(product.tags || []), ...(product.healthFunctions || [])];
  if (area.label === 'PCOS') return tags.some(tag => ['pcos', 'pcos-management'].includes(tag));
  if (area.label === 'UTI support') return tags.some(tag => ['uti', 'uti-prevention'].includes(tag));
  const text = [product.name, product.category, ...tags].filter(Boolean).join(' ').toLowerCase();
  return area.terms.some(term => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text));
}

export function selectCabinetProducts(owned, recommended, examples, signedIn) {
  // Never pad a real user's cabinet with products they have not added.
  const pool = owned.length ? owned : recommended.length ? recommended : signedIn ? [] : examples;
  const seen = new Set();
  return pool.filter(product => {
    if (!product?.id || seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  }).slice(0, 4);
}

export function careAreasForProfile(areas, intake) {
  const stages = [intake?.lifeStage, intake?.lifeStages, intake?.lifeStageSelections].flat().filter(Boolean).join(' ');
  if (!/post[- ]?menopaus|^menopause$/i.test(stages)) return areas;
  const priority = ['Menopause', 'Bone health', 'Strength + muscle', 'Sleep + energy', 'Gut health', 'Skin + hair'];
  const irrelevant = new Set(['Period care', 'PCOS', 'Fertility', 'Pregnancy', 'Postpartum']);
  return areas.filter(area => !irrelevant.has(area.label)).sort((a, b) => {
    const rank = label => priority.includes(label) ? priority.indexOf(label) : priority.length;
    return rank(a.label) - rank(b.label);
  });
}
