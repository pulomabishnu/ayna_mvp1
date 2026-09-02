// Central, reusable evidence for catalog products.
//
// IMPORTANT:
// - These sources support an intervention/category unless explicitly stated otherwise.
// - Mapping a product here does NOT mean the product itself was clinically validated.
// - Partner status, commission, sponsorship, and Browse placement must never affect evidence.
// - Keep product-specific claims separate from category/adjacent evidence.

export const CATALOG_EVIDENCE = {
  menstrualProducts: {
    scientific: [
      {
        url: 'https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use',
        text: 'FDA: Menstrual Product Options, Facts, and Safe Use',
        summary: 'FDA guidance covers pads, period underwear, cups, and discs, including how these menstrual-product categories work and their safety considerations. This is category/regulatory evidence and does not validate any specific brand or SKU.',
        justification: 'Current FDA menstrual-product guidance; category-level evidence.'
      }
    ]
  },

  menstrualCupsDiscs: {
    scientific: [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/31324419/',
        text: 'Menstrual Cup Use, Leakage, Acceptability, Safety, and Availability',
        summary: 'A systematic review and meta-analysis evaluated menstrual cups for leakage, acceptability, and safety. This is category-level evidence; it does not validate Flex Cup or Softdisc specifically, and evidence for discs is more indirect.',
        justification: 'Peer-reviewed systematic review and meta-analysis; category/adjacent evidence.'
      },
      {
        url: 'https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use',
        text: 'FDA: Menstrual Product Options, Facts, and Safe Use',
        summary: 'FDA consumer guidance describes menstrual cups and discs as internal menstrual-collection products and discusses safe use. This is category/regulatory evidence, not product-specific validation.',
        justification: 'Current FDA guidance; category-level evidence.'
      }
    ]
  },

  vulvarExternalCare: {
    scientific: [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/36458568/',
        text: 'Vulvar Contact Dermatitis Systematic Review',
        summary: 'A systematic review identifies fragrances, preservatives, cosmetic constituents, and other exposures as potential vulvar allergens or irritants. This supports cautious external-care guidance but does not validate a specific wipe, wash, or balm.',
        justification: 'Peer-reviewed systematic review; category-level safety evidence.'
      }
    ]
  },

  vaginalMoisturizers: {
    scientific: [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/39250810/',
        text: 'Vaginal Moisturizers for Genitourinary Syndrome of Menopause: Systematic Review',
        summary: 'A systematic review evaluated randomized trials of vaginal moisturizers and other treatments for genitourinary syndrome of menopause. This is intervention-level evidence and does not validate a specific moisturizer product.',
        justification: 'Peer-reviewed systematic review; category-level evidence.'
      },
      {
        url: 'https://www.acog.org/womens-health/faqs/vulvovaginal-health',
        text: 'ACOG: Vulvovaginal Health',
        summary: 'ACOG notes that over-the-counter vaginal moisturizers and lubricants can help relieve vaginal dryness and painful sex. This is clinical-guidance-level evidence, not product-specific validation.',
        justification: 'Clinical guidance from ACOG; category-level evidence.'
      }
    ]
  },

  vaginalHyaluronicAcid: {
    scientific: [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/41773428/',
        text: 'Hyaluronic Acid for Vaginal Health: Systematic Review and Meta-Analysis',
        summary: 'A 2026 systematic review and meta-analysis evaluated vaginal hyaluronic acid for postmenopausal vaginal health outcomes. This is ingredient/intervention-level evidence and does not validate Neycher HydroBloom specifically.',
        justification: 'Peer-reviewed systematic review and meta-analysis; ingredient-level evidence.'
      }
    ]
  },

  boricAcidLimitedUse: {
    scientific: [
      {
        url: 'https://www.cdc.gov/std/treatment-guidelines/candidiasis.htm',
        text: 'CDC: Vulvovaginal Candidiasis Treatment Guidelines',
        summary: 'CDC guidance includes vaginal boric acid for a limited recurrent non-albicans vulvovaginal candidiasis scenario after other management. It does not support broad odor, routine pH-balancing, BV-prevention, or general wellness claims for a specific boric-acid product.',
        justification: 'CDC clinical guidance; limited category-level evidence with important scope restrictions.'
      }
    ]
  },

  utiDipstickTesting: {
    scientific: [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/16880133/',
        text: 'Urinary Dipstick Tests for UTI: Systematic Review',
        summary: 'A systematic review evaluated leukocyte-esterase and nitrite urine dipstick testing in adults. This supports the underlying test category but does not independently validate the Winx-branded test or telehealth service.',
        justification: 'Peer-reviewed systematic review; category-level diagnostic evidence.'
      }
    ]
  },

  recurrentUtiSupplements: {
    scientific: [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/37947276/',
        text: 'Cranberries for Preventing Urinary Tract Infections',
        summary: 'A Cochrane systematic review evaluated cranberry products for UTI prevention. This is ingredient/category-level evidence and does not validate the Good Kitty finished formulation.',
        justification: 'Cochrane systematic review; ingredient-level evidence.'
      },
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/38587819/',
        text: 'D-Mannose for Prevention of Recurrent UTI: Randomized Clinical Trial',
        summary: 'A large randomized trial found daily D-mannose did not reduce recurrent UTI in the studied population. This is important contrary evidence and means D-mannose should not be presented as established prevention for this specific supplement.',
        justification: 'Peer-reviewed randomized clinical trial; ingredient-level contrary evidence.'
      }
    ]
  },

  incontinenceAbsorbentProducts: {
    scientific: [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/17443507/',
        text: 'Absorbent Products for Light Urinary Incontinence in Women',
        summary: 'A Cochrane review compared absorbent-product designs for women with light urinary incontinence. This supports bladder-leak absorbent products as containment tools but does not validate any specific Poise, Always, Depend, or TENA SKU.',
        justification: 'Cochrane systematic review; category-level evidence.'
      },
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/18547500/',
        text: 'Comparative Evaluation of Incontinence Product Designs',
        summary: 'Clinical trials compared absorbent-product designs for urinary incontinence and found meaningful differences in leakage, comfort, discretion, and user preference. This is category-level evidence, not specific-brand validation.',
        justification: 'Peer-reviewed comparative clinical evidence; category-level evidence.'
      }
    ]
  }
};

export const PRODUCT_EVIDENCE_KEYS = {
  'p-sweet-spot-wipes': ['vulvarExternalCare'],

  'p-u-kotex-pad': ['menstrualProducts'],
  'p-rael-overnight': ['menstrualProducts'],
  'p-flex-cup': ['menstrualCupsDiscs'],
  'p-softdisc': ['menstrualCupsDiscs'],
  'p-aisle-underwear': ['menstrualProducts'],

  'p-winx-uti-test-treat': ['utiDipstickTesting'],

  'p-neycher-vaginal-moisturizer': ['vaginalMoisturizers'],
  'p-neycher-odor-be-gone': ['boricAcidLimitedUse'],
  'p-neycher-hydrobloom-gel': ['vaginalMoisturizers', 'vaginalHyaluronicAcid'],
  'p-neycher-botanical-vulva-balm': ['vulvarExternalCare'],
  'p-neycher-goodbye-dryness-bundle': ['vaginalMoisturizers', 'vulvarExternalCare'],

  'p-good-kitty-uti-biome-shield': ['recurrentUtiSupplements'],

  'p-poise-ultra-thin-moderate': ['incontinenceAbsorbentProducts'],
  'p-always-discreet-boutique-liners': ['incontinenceAbsorbentProducts'],
  'p-depend-silhouette-underwear': ['incontinenceAbsorbentProducts'],
  'p-tena-intimates-very-light-liner': ['incontinenceAbsorbentProducts']
};

function existingScientificLinks(product) {
  const scientific = product?.verificationLinks?.scientific;
  if (!scientific) return [];
  if (Array.isArray(scientific)) return scientific;
  if (Array.isArray(scientific.links)) return scientific.links;
  if (scientific.url) return [scientific];
  return [];
}

export function applyCatalogEvidence(product) {
  if (!product) return product;

  // Never overwrite hand-curated/product-specific scientific evidence.
  if (existingScientificLinks(product).length) return product;

  const keys = PRODUCT_EVIDENCE_KEYS[product.id] || [];
  if (!keys.length) return product;

  const links = keys.flatMap((key) => CATALOG_EVIDENCE[key]?.scientific || []);

  if (!links.length) return product;

  return {
    ...product,
    verificationLinks: {
      ...(product.verificationLinks || {}),
      scientific: { links }
    }
  };
}
