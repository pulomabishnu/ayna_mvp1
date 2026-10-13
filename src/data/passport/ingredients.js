/**
 * Canonical ingredient ids + aliases (spec 7). The same ingredient shows up
 * under many names ("magnesium bisglycinate", "Mg glycinate"); matching and
 * safety filters should compare ids, never raw strings.
 *
 * Each entry: id, name (display), aliases (lower-case strings or regexes),
 * classes (what kind of thing it is, used by safety filters), and
 * glossary (a glossary term that explains it, when one exists).
 *
 * Only ingredients that appear in the current catalog are listed. Add more as
 * passports are verified; never guess a dose or a property here.
 */
export const INGREDIENTS = [
  // Minerals and vitamins
  { id: 'magnesium', name: 'Magnesium', aliases: ['magnesium glycinate', 'magnesium bisglycinate', 'magnesium citrate', 'magnesium oxide', 'magnesium malate', 'magnesium l-threonate', 'mg glycinate'], classes: ['mineral'] },
  { id: 'magnesium-stearate', name: 'Magnesium stearate', aliases: ['magnesium stearate'], classes: ['excipient'] },
  { id: 'zinc', name: 'Zinc', aliases: ['zinc', 'whole food zinc', 'zinc picolinate', 'zinc gluconate'], classes: ['mineral'] },
  { id: 'iron', name: 'Iron', aliases: ['iron', 'ferrous bisglycinate', 'ferrous sulfate', 'iron bisglycinate'], classes: ['mineral'] },
  { id: 'iron-powder', name: 'Iron powder (heat pack)', aliases: ['iron powder'], classes: ['device-material'] },
  { id: 'calcium', name: 'Calcium', aliases: ['calcium citrate', 'calcium carbonate', 'calcium'], classes: ['mineral'] },
  { id: 'vitamin-d', name: 'Vitamin D', aliases: ['vitamin d3', 'vitamin d', 'cholecalciferol', 'd3'], classes: ['vitamin'] },
  { id: 'vitamin-b6', name: 'Vitamin B6', aliases: ['vitamin b6', 'b6', 'pyridoxine', 'pyridoxal 5-phosphate', 'p5p'], classes: ['vitamin'] },
  { id: 'vitamin-b12', name: 'Vitamin B12', aliases: ['vitamin b12', 'methylcobalamin', 'methylcobalamin b12', 'cyanocobalamin', 'b12'], classes: ['vitamin'] },
  { id: 'folate', name: 'Folate', aliases: ['folate', 'folic acid', 'methylfolate', 'l-methylfolate', '5-mthf', 'mthf folate', 'mthf'], classes: ['vitamin'] },
  { id: 'vitamin-c', name: 'Vitamin C', aliases: ['vitamin c', 'ascorbic acid'], classes: ['vitamin'] },
  { id: 'vitamin-e', name: 'Vitamin E', aliases: ['vitamin e', 'tocopherol', 'tocopheryl acetate'], classes: ['vitamin'] },
  { id: 'vitamin-a', name: 'Vitamin A', aliases: ['vitamin a', 'retinyl palmitate', 'retinol'], classes: ['vitamin'] },
  { id: 'b-vitamins', name: 'B vitamins', aliases: ['thiamine', 'riboflavin', 'biotin', 'niacin'], classes: ['vitamin'] },
  { id: 'choline', name: 'Choline', aliases: ['choline'], classes: ['nutrient'] },
  { id: 'niacinamide', name: 'Niacinamide', aliases: ['niacinamide'], classes: ['vitamin', 'topical-active'] },

  // PCOS / cycle supplements
  { id: 'myo-inositol', name: 'Myo-inositol', aliases: ['myo-inositol', 'myo inositol', 'myoinositol'], classes: ['supplement-active'], glossary: 'Inositol' },
  { id: 'd-chiro-inositol', name: 'D-chiro-inositol', aliases: ['d-chiro inositol', 'd-chiro-inositol', 'dci'], classes: ['supplement-active'], glossary: 'Inositol' },
  { id: 'vitex', name: 'Vitex (chasteberry)', aliases: ['vitex', 'vitex agnus-castus', 'chasteberry', 'chaste tree', 'chasteberry extract', 'chasteberry (vitex)'], classes: ['botanical', 'hormone-active'] },
  { id: 'spearmint', name: 'Spearmint', aliases: ['spearmint', 'spearmint leaf'], classes: ['botanical'] },
  { id: 'black-cohosh', name: 'Black cohosh', aliases: ['black cohosh', 'black cohosh extract'], classes: ['botanical', 'hormone-active'] },
  { id: 'soy-isoflavones', name: 'Soy isoflavones', aliases: ['soy isoflavones', 'isoflavones'], classes: ['botanical', 'phytoestrogen', 'allergen-soy'], glossary: 'Phytoestrogen' },
  { id: 'dong-quai', name: 'Dong quai', aliases: ['dong quai'], classes: ['botanical', 'hormone-active'] },
  { id: 'evening-primrose', name: 'Evening primrose oil', aliases: ['evening primrose oil', 'gla'], classes: ['botanical', 'oil'] },
  { id: 'ashwagandha', name: 'Ashwagandha', aliases: ['ashwagandha', 'withania somnifera', 'ksm-66'], classes: ['botanical', 'adaptogen'], glossary: 'Adaptogen' },
  { id: 'rhodiola', name: 'Rhodiola', aliases: ['rhodiola', 'rhodiola rosea'], classes: ['botanical', 'adaptogen'], glossary: 'Adaptogen' },
  { id: 'maca', name: 'Maca', aliases: ['maca'], classes: ['botanical', 'adaptogen'], glossary: 'Adaptogen' },
  { id: 'bacopa', name: 'Bacopa', aliases: ['bacopa'], classes: ['botanical'] },
  { id: 'pycnogenol', name: 'Pine bark extract', aliases: ['pycnogenol', 'pine bark extract'], classes: ['botanical'] },
  { id: 'progesterone', name: 'Progesterone', aliases: ['progesterone', 'bioidentical progesterone'], classes: ['hormone'] },
  { id: 'creatine', name: 'Creatine', aliases: ['creatine', 'creatine monohydrate'], classes: ['supplement-active'] },
  { id: 'ubiquinol', name: 'CoQ10 (ubiquinol)', aliases: ['ubiquinol', 'coq10', 'coenzyme q10', 'ubiquinone'], classes: ['supplement-active'] },
  { id: 'omega-3', name: 'Omega-3 (EPA/DHA)', aliases: ['fish oil', 'omega-3', 'omega-3 dha', 'dha', 'epa', 'epa/dha'], classes: ['oil', 'allergen-fish'] },

  // Gut, urinary and vaginal health
  { id: 'd-mannose', name: 'D-mannose', aliases: ['d-mannose', 'd mannose'], classes: ['supplement-active'] },
  { id: 'cranberry', name: 'Cranberry (PACs)', aliases: ['cranberry', 'cranberry extract', 'proanthocyanidins', 'pacs', 'pacran', 'pacran cranberry whole fruit powder', 'cranberry whole fruit powder'], classes: ['botanical'] },
  { id: 'probiotic', name: 'Probiotic', aliases: ['probiotic blend', 'probiotics', /lactobacillus [a-z]+/, /\bl\. [a-z]+/, /bifidobacterium [a-z]+/], classes: ['probiotic'], glossary: 'Probiotic strain' },
  { id: 'inulin', name: 'Inulin (prebiotic fiber)', aliases: ['inulin'], classes: ['fiber'] },
  { id: 'digestive-enzymes', name: 'Digestive enzymes', aliases: ['digestive enzymes', 'amylase', 'protease', 'lipase', 'papain'], classes: ['enzyme'] },
  { id: 'boric-acid', name: 'Boric acid', aliases: ['boric acid'], classes: ['vaginal-active'] },
  { id: 'hyaluronic-acid', name: 'Hyaluronic acid', aliases: ['hyaluronic acid', 'sodium hyaluronate'], classes: ['humectant'] },
  { id: 'polycarbophil', name: 'Polycarbophil', aliases: ['polycarbophil'], classes: ['bioadhesive'] },
  { id: 'lactic-acid', name: 'Lactic acid', aliases: ['lactic acid'], classes: ['acid'] },
  { id: 'methenamine', name: 'Methenamine', aliases: ['methenamine'], classes: ['drug-active'] },
  { id: 'sodium-salicylate', name: 'Sodium salicylate', aliases: ['sodium salicylate'], classes: ['drug-active', 'nsaid-like'], glossary: 'NSAID' },
  { id: 'phenazopyridine', name: 'Phenazopyridine', aliases: ['phenazopyridine', 'phenazopyridine hydrochloride'], classes: ['drug-active'] },
  { id: 'chlorhexidine', name: 'Chlorhexidine', aliases: ['chlorhexidine'], classes: ['antiseptic'] },
  { id: 'ibuprofen', name: 'Ibuprofen', aliases: ['ibuprofen'], classes: ['drug-active', 'nsaid'], glossary: 'NSAID' },
  { id: 'naproxen', name: 'Naproxen', aliases: ['naproxen', 'naproxen sodium'], classes: ['drug-active', 'nsaid'], glossary: 'NSAID' },

  // Botanicals in washes, balms, teas
  { id: 'ginger', name: 'Ginger', aliases: ['ginger', 'ginger root'], classes: ['botanical'] },
  { id: 'turmeric', name: 'Turmeric', aliases: ['turmeric', 'curcumin'], classes: ['botanical'] },
  { id: 'fennel', name: 'Fennel', aliases: ['fennel seed', 'fennel'], classes: ['botanical'] },
  { id: 'dandelion', name: 'Dandelion root', aliases: ['dandelion root', 'dandelion'], classes: ['botanical'] },
  { id: 'lemon-balm', name: 'Lemon balm', aliases: ['lemon balm'], classes: ['botanical'] },
  { id: 'peppermint', name: 'Peppermint', aliases: ['peppermint', 'peppermint leaf'], classes: ['botanical'] },
  { id: 'hibiscus', name: 'Hibiscus', aliases: ['hibiscus', 'hibiscus extract'], classes: ['botanical'] },
  { id: 'tea-tree-oil', name: 'Tea tree oil', aliases: ['tea tree oil', 'tea tree leaf oil'], classes: ['essential-oil', 'botanical'] },
  { id: 'lavender', name: 'Lavender', aliases: ['lavender', 'lavender flower water'], classes: ['essential-oil', 'botanical', 'fragrance-source'] },
  { id: 'chamomile', name: 'Chamomile', aliases: ['chamomile', 'chamomile extract', 'chamomile flower extract'], classes: ['botanical'] },
  { id: 'calendula', name: 'Calendula', aliases: ['calendula', 'calendula flower extract'], classes: ['botanical'] },
  { id: 'aloe', name: 'Aloe vera', aliases: ['aloe', 'aloe vera', 'aloe leaf juice'], classes: ['botanical'] },
  { id: 'licorice', name: 'Licorice root (glycyrrhetinic acid)', aliases: ['glycyrrhetinic acid', 'licorice root'], classes: ['botanical'] },
  { id: 'coconut-oil', name: 'Coconut oil', aliases: ['coconut oil'], classes: ['oil', 'allergen-tree-nut-adjacent'] },
  { id: 'olive-oil', name: 'Olive oil', aliases: ['olive oil'], classes: ['oil'] },
  { id: 'beeswax', name: 'Beeswax', aliases: ['beeswax'], classes: ['wax', 'animal-derived'] },
  { id: 'honey', name: 'Honey and propolis', aliases: ['honey', 'propolis'], classes: ['animal-derived'] },
  { id: 'glycerin', name: 'Glycerin', aliases: ['glycerin', 'glycerine', 'glycerol'], classes: ['humectant'] },
  { id: 'menthol', name: 'Menthol', aliases: ['menthol'], classes: ['topical-active'] },
  { id: 'salicylic-acid', name: 'Salicylic acid', aliases: ['salicylic acid'], classes: ['acid'] },
  { id: 'glycolic-acid', name: 'Glycolic acid', aliases: ['glycolic acid'], classes: ['acid'] },

  // Preservatives, fragrance, dyes
  { id: 'fragrance', name: 'Fragrance', aliases: ['fragrance', 'parfum', 'perfume', 'essential oils', 'essential-oils'], classes: ['fragrance'] },
  { id: 'parabens', name: 'Parabens', aliases: ['paraben', 'parabens', 'methylparaben', 'propylparaben'], classes: ['preservative'] },
  { id: 'potassium-sorbate', name: 'Potassium sorbate', aliases: ['potassium sorbate'], classes: ['preservative'] },
  { id: 'gelatin', name: 'Gelatin', aliases: ['gelatin', 'gelatin capsule', 'gelatin softgel'], classes: ['capsule', 'animal-derived'] },
  { id: 'cellulose-capsule', name: 'Plant cellulose capsule', aliases: ['cellulose capsule', 'hpmc', 'vegetable capsule'], classes: ['capsule'] },
  { id: 'lactose', name: 'Lactose', aliases: ['lactose'], classes: ['excipient', 'allergen-dairy'] },

  // Materials
  { id: 'organic-cotton', name: 'Organic cotton', aliases: ['organic cotton', '100% organic cotton', 'organic certified cotton'], classes: ['material', 'fiber'] },
  { id: 'cotton', name: 'Cotton', aliases: ['cotton', 'cotton cover'], classes: ['material', 'fiber'] },
  { id: 'viscose', name: 'Viscose / rayon', aliases: ['viscose', 'rayon', 'bamboo from viscose', 'bamboo viscose'], classes: ['material', 'fiber'] },
  { id: 'polyethylene', name: 'Polyethylene', aliases: ['polyethylene', 'pe', 'bio-pe'], classes: ['material', 'plastic'] },
  { id: 'polypropylene', name: 'Polypropylene', aliases: ['polypropylene', 'pp'], classes: ['material', 'plastic'] },
  { id: 'wood-pulp', name: 'Wood pulp', aliases: ['wood pulp', 'fluff pulp'], classes: ['material'] },
  { id: 'superabsorbent-polymer', name: 'Superabsorbent polymer', aliases: ['absorbent polymer', 'superabsorbent polymer', 'sap'], classes: ['material'] },
  { id: 'silicone', name: 'Silicone', aliases: ['medical-grade silicone', 'medical grade silicone', 'food-grade silicone', '100% food-grade silicone', 'silicone'], classes: ['material'] },
  { id: 'tpe', name: 'TPE (thermoplastic elastomer)', aliases: ['tpe', 'thermoplastic elastomer'], classes: ['material'] },
  { id: 'latex', name: 'Latex', aliases: ['latex', 'natural rubber latex'], classes: ['material', 'allergen-latex'] },
  { id: 'spandex', name: 'Spandex', aliases: ['spandex', 'elastane', 'lycra'], classes: ['material', 'fiber'] },
  { id: 'polyester', name: 'Polyester', aliases: ['polyester', 'polyester fiberfill', 'polyester fiber'], classes: ['material', 'fiber'] },
  { id: 'silver', name: 'Silver', aliases: ['925 silver', 'sterling silver'], classes: ['material'] },
  { id: 'adhesive', name: 'Adhesive', aliases: ['adhesive'], classes: ['material'] },
];

const BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));

function norm(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // drop parentheticals: "hyaluronic acid (10 mg)"
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|g|iu|b cfu|billion cfu|cfu|%)\b/g, ' ')
    .replace(/^(?:organic|pure|standardized|certified)\s+/, '')
    .replace(/[^a-z0-9./\- ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Canonical id for an ingredient string, or null when it is not in the
 * registry (unknown stays unknown, it is never guessed).
 */
export function canonicalizeIngredient(name) {
  const n = norm(name);
  if (!n) return null;
  // Exact alias first, then the longest alias contained in the phrase.
  let best = null;
  for (const ing of INGREDIENTS) {
    for (const a of ing.aliases) {
      if (typeof a === 'string') {
        if (n === a) return ing.id;
        const re = new RegExp(`(^|[^a-z0-9])${a.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}($|[^a-z0-9])`);
        if (re.test(n) && (!best || a.length > best.len)) best = { id: ing.id, len: a.length };
      } else if (a.test(n) && (!best || 6 > best.len)) {
        best = { id: ing.id, len: 6 };
      }
    }
  }
  return best ? best.id : null;
}

export function getIngredient(id) {
  return BY_ID.get(id) || null;
}

/** Split a free-text ingredient list into items. Keeps the raw text for each. */
export function splitIngredientList(text) {
  const t = String(text || '').replace(/\n+/g, ', ');
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of t) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if ((ch === ',' || ch === ';') && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out
    .map((s) => s.replace(/^\s*(?:and|plus)\s+/i, '').replace(/\.\s*$/, '').trim())
    .filter((s) => s && s.length < 160);
}

/**
 * Structured ingredient rows from free text: { raw, id, name, classes, amount }.
 * amount is only read when the text states one ("200mg"); it is never inferred.
 */
export function parseIngredients(text) {
  return splitIngredientList(text).map((raw) => {
    const id = canonicalizeIngredient(raw);
    const ing = id ? getIngredient(id) : null;
    const amount = (raw.match(/\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|g|iu)\b/i) || [])[0] || null;
    return { raw, id, name: ing?.name || null, classes: ing?.classes || [], amount };
  });
}

/** Ingredient ids in a text, deduped (for safety filters and aliases). */
export function ingredientIds(text) {
  return [...new Set(parseIngredients(text).map((r) => r.id).filter(Boolean))];
}
