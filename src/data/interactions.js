/**
 * Safety interaction data and checker for ecosystem products.
 * Used to warn when medications/supplements/products may interact.
 */

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="%23f3f4f6" width="80" height="80" rx="8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="10" font-family="sans-serif">?</text></svg>');

// Normalize name for matching (lowercase, trim, collapse spaces)
function norm(name) {
  if (!name || typeof name !== 'string') return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Keywords that identify a product as containing or being a given ingredient/medication
const INGREDIENT_KEYWORDS = {
  iron: ['iron', 'ferrous', 'ferric', 'ferritin'],
  calcium: ['calcium', 'calcite', 'citrate calcium'],
  magnesium: ['magnesium', 'magnesium citrate', 'glycinate', 'oxide magnesium'],
  zinc: ['zinc'],
  copper: ['copper', 'cupric'],
  vitaminD: ['vitamin d', 'vitamin d3', 'd3', 'cholecalciferol'],
  vitaminK: ['vitamin k', 'vitamin k2', 'k2', 'menaquinone', 'phytonadione'],
  vitaminE: ['vitamin e', 'tocopherol'],
  omega3: ['fish oil', 'omega-3', 'omega 3', 'epa', 'dha', 'fish oil'],
  stJohnsWort: ["st. john's wort", 'st johns wort', 'hypericum'],
  ginkgo: ['ginkgo', 'ginkgo biloba'],
  ginger: ['ginger'],
  turmeric: ['turmeric', 'curcumin'],
  valerian: ['valerian'],
  melatonin: ['melatonin'],
  birthControl: ['birth control', 'oral contraceptive', 'pill', 'nuvaring', 'patch', 'mirena', 'kyleena', 'liletta', 'skyla', 'nexplanon', 'implanon', 'depo'],
  warfarin: ['warfarin', 'coumadin'],
  metformin: ['metformin', 'glucophage'],
  thyroid: ['synthroid', 'levothyroxine', 'levoxyl', 'tirosint', 'thyroid'],
  aspirin: ['aspirin', 'asa'],
  ibuprofen: ['ibuprofen', 'advil', 'motrin'],
  bloodPressure: ['lisinopril', 'amlodipine', 'losartan', 'blood pressure', 'ace inhibitor', 'arb'],
  antidepressant: ['ssri', 'sertraline', 'zoloft', 'fluoxetine', 'prozac', 'lexapro', 'escitalopram', 'venlafaxine', 'effexor', 'bupropion', 'wellbutrin', 'antidepressant'],
};

// Pairs/groups that may interact. Each entry: { match: (product) => boolean or { productNames: [], ingredientKeys: [] }, severity, message }
const INTERACTION_RULES = [
  {
    ingredientKeys: ['calcium', 'iron'],
    severity: 'medium',
    message: 'Calcium can reduce iron absorption. Take iron and calcium at least 2 hours apart, or with food as directed by your provider.',
  },
  {
    ingredientKeys: ['zinc', 'copper'],
    severity: 'low',
    message: 'High-dose zinc long-term can lower copper levels. If you take zinc daily, consider a copper-containing multivitamin or separate copper supplement.',
  },
  {
    ingredientKeys: ['vitaminK', 'warfarin'],
    severity: 'high',
    message: 'Vitamin K can affect how warfarin works. Keep vitamin K intake consistent and tell your doctor about any new supplements.',
  },
  {
    ingredientKeys: ['omega3', 'warfarin'],
    severity: 'medium',
    message: 'Fish oil / omega-3 may slightly increase bleeding risk with blood thinners. Use under medical supervision.',
  },
  {
    ingredientKeys: ['stJohnsWort', 'birthControl'],
    severity: 'high',
    message: "St. John's wort may reduce effectiveness of hormonal birth control. Use backup contraception and discuss with your provider.",
  },
  {
    ingredientKeys: ['stJohnsWort', 'antidepressant'],
    severity: 'high',
    message: "St. John's wort can interact with antidepressants (serotonin syndrome risk). Do not combine without your doctor's approval.",
  },
  {
    ingredientKeys: ['ginkgo', 'warfarin'],
    severity: 'medium',
    message: 'Ginkgo may increase bleeding risk when taken with blood thinners. Discuss with your provider.',
  },
  {
    ingredientKeys: ['ginkgo', 'aspirin'],
    severity: 'low',
    message: 'Ginkgo with aspirin may increase bleeding risk. Discuss with your provider.',
  },
  {
    ingredientKeys: ['melatonin', 'bloodPressure'],
    severity: 'low',
    message: 'Melatonin can sometimes affect blood pressure. If you take blood pressure medication, mention melatonin use to your doctor.',
  },
  {
    ingredientKeys: ['magnesium', 'bloodPressure'],
    severity: 'low',
    message: 'Magnesium can support blood pressure health; large doses may enhance the effect of blood pressure medications. Monitor with your provider.',
  },
];

function getIngredientKeysForProduct(product) {
  const name = norm(product.name || '');
  const category = norm(product.category || '');
  const summary = norm((product.summary || '') + ' ' + (product.ingredients || ''));
  const text = name + ' ' + category + ' ' + summary;
  const keys = [];
  for (const [key, keywords] of Object.entries(INGREDIENT_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) keys.push(key);
  }
  return keys;
}

/**
 * Check a list of ecosystem products for safety interactions.
 * @param {Array<{ id: string, name: string, category?: string, summary?: string, ingredients?: string }>} productList
 * @returns {Array<{ severity: 'low'|'medium'|'high', message: string, productNames: string[] }>}
 */
export function getInteractions(productList) {
  if (!Array.isArray(productList) || productList.length < 2) return [];

  const results = [];
  const keySets = productList.map(p => ({
    name: p.name || 'Unknown',
    keys: getIngredientKeysForProduct(p),
  }));

  for (const rule of INTERACTION_RULES) {
    const required = rule.ingredientKeys;
    const productNames = [];
    for (let i = 0; i < keySets.length; i++) {
      const hasAny = required.some(rk => keySets[i].keys.includes(rk));
      if (hasAny) productNames.push(keySets[i].name);
    }
    if (productNames.length >= 2) {
      results.push({
        severity: rule.severity,
        message: rule.message,
        productNames: [...new Set(productNames)],
      });
    }
  }

  return results;
}

export const PLACEHOLDER_IMAGE_EXPORT = PLACEHOLDER_IMAGE;
