import { RESTORED_SCIENTIFIC_EVIDENCE } from './restoredScientificEvidence.js';
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
,
  vaginalPhTesting: {
    scientific: [
      {
        url: 'https://www.cdc.gov/std/treatment-guidelines/bv.htm',
        text: 'CDC: Bacterial Vaginosis Diagnostic Considerations',
        summary: 'CDC guidance includes vaginal pH above 4.5 as one component of the Amsel criteria for bacterial vaginosis. pH alone does not diagnose BV or distinguish every cause of vaginal symptoms.',
        justification: 'CDC clinical guidance; diagnostic-category evidence, not validation of a specific home test.'
      },
      {
        url: 'https://www.cdc.gov/std/treatment-guidelines/candidiasis.htm',
        text: 'CDC: Vulvovaginal Candidiasis Diagnostic Considerations',
        summary: 'CDC guidance notes that vulvovaginal candidiasis is generally associated with vaginal pH below 4.5 and requires appropriate clinical or laboratory evaluation. This does not validate a specific home pH test.',
        justification: 'CDC clinical guidance; diagnostic-category evidence.'
      }
    ]
  },

  homePregnancyTests: {
    scientific: [
      {
        url: 'https://www.fda.gov/medical-devices/home-use-tests/pregnancy',
        text: 'FDA: Home Pregnancy Tests',
        summary: 'FDA guidance explains that home pregnancy tests detect urinary hCG and that accuracy depends on timing, instructions, and interpretation. This supports the test category but does not independently verify Winx accuracy claims.',
        justification: 'FDA home-use diagnostic guidance; category-level evidence.'
      }
    ]
  },

  phenazopyridineUrinaryPain: {
    scientific: [
      {
        url: 'https://dailymed.nlm.nih.gov/dailymed/getFile.cfm?setid=faf6b5c0-6ff5-482c-9ad5-a7bef92afd56&type=pdf',
        text: 'DailyMed: Stix Maximum Strength Urinary Pain Relief Drug Facts',
        summary: 'The FDA-label repository identifies the Stix urinary pain-relief product as an OTC phenazopyridine hydrochloride drug for urinary pain symptoms. Symptom relief does not treat the underlying infection.',
        justification: 'Official DailyMed drug-label record for the product under its prior Stix branding.'
      }
    ]
  },

  vaginalProbiotics: {
    scientific: [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/31299136/',
        text: 'Lactobacilli Vaginal Probiotics: Systematic Review',
        summary: 'A systematic review found promising but heterogeneous and generally low-quality evidence for Lactobacillus probiotic approaches in vaginal dysbiosis. Findings do not validate a specific oral or vaginal probiotic product.',
        justification: 'Peer-reviewed systematic review; category-level evidence with important limitations.'
      },
      {
        url: 'https://www.cdc.gov/std/treatment-guidelines/bv.htm',
        text: 'CDC: Bacterial Vaginosis Treatment Guidelines',
        summary: 'CDC notes that available probiotic studies do not support probiotic products as replacement or adjunctive therapy for bacterial vaginosis. This is important contrary clinical guidance.',
        justification: 'CDC clinical guidance; contrary category-level evidence.'
      }
    ]
  },

  sexualWellnessVibration: {
    scientific: [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/38668760/',
        text: 'Vibrator Use and Women\'s Pelvic Health: Prospective Pilot Study',
        summary: 'A small prospective pilot associated regular vibrator use with improvements in several sexual and genitourinary outcomes. The study is limited and does not validate any specific Oboo device.',
        justification: 'Peer-reviewed prospective pilot study; limited category-level evidence.'
      }
    ]
  },

  analSexualSafety: {
    scientific: [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/37842551/',
        text: 'Anogenital Injury After Consensual Intercourse: Systematic Review',
        summary: 'A systematic review documents that anogenital injury can occur after consensual sexual activity. This is safety-context evidence only and does not establish benefit or clinical efficacy for an anal training kit.',
        justification: 'Peer-reviewed systematic review; adjacent safety evidence.'
      }
    ]
  },

  herbalSexualFunction: {
    scientific: [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/31881322/',
        text: 'Herbal Supplements Marketed as Female Aphrodisiacs: Evidence Review',
        summary: 'A review found little to no clinical evidence supporting many plant ingredients marketed for female libido disorders and highlighted major problems with botanical consistency. This does not validate the Oboo tincture.',
        justification: 'Peer-reviewed review; category-level evidence emphasizing uncertainty.'
      }
    ]
  },

  vasomotorCooling: {
    scientific: [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/37252752/',
        text: '2023 Menopause Society Nonhormone Therapy Position Statement',
        summary: 'The Menopause Society evidence review does not recommend cooling techniques as proven treatment for vasomotor symptoms because efficacy evidence is insufficient. A cooling spray may feel temporarily cooling, but this source does not establish clinical hot-flash treatment efficacy.',
        justification: 'Evidence-based professional-society position statement; contrary category-level evidence.'
      }
    ]
  },

  pelvicFloorMuscleTraining: {
    scientific: [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/30704907/',
        text: 'Pelvic Floor Muscle Training for Urinary Incontinence: Cochrane Review',
        summary: 'A Cochrane systematic review supports pelvic floor muscle training for women with stress, urgency, or mixed urinary incontinence. Evidence supports PFMT generally and does not validate the Connect program specifically.',
        justification: 'Peer-reviewed Cochrane systematic review; intervention-level evidence.'
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
,
  'p-winx-vaginal-health-test-treat': ['vaginalPhTesting'],
  'p-winx-pregnancy-tests': ['homePregnancyTests'],
  'p-winx-uti-pain-relief': ['phenazopyridineUrinaryPain'],
  'p-winx-vaginal-probiotic': ['vaginalProbiotics'],
  'p-winx-uti-daily-defense': ['recurrentUtiSupplements'],

  'p-oboo-nook': ['sexualWellnessVibration'],
  'p-oboo-smooch': ['sexualWellnessVibration'],
  'p-oboo-woo': ['sexualWellnessVibration'],
  'p-oboo-shoop': ['sexualWellnessVibration'],
  'p-oboo-moon': ['analSexualSafety'],
  'p-oboo-oooh': ['sexualWellnessVibration'],
  'p-oboo-groove': ['sexualWellnessVibration'],
  'p-oboo-boom': ['sexualWellnessVibration'],
  'p-oboo-smooth-daily': ['vulvarExternalCare'],
  'p-oboo-smooth-arousal': ['vulvarExternalCare'],
  'p-oboo-loob-daily': ['vaginalMoisturizers'],
  'p-oboo-loob-arousal': ['vaginalMoisturizers'],
  'p-oboo-mood-drops': ['herbalSexualFunction'],
  'p-oboo-cool-spray': ['vasomotorCooling'],
  'd-connect-pelvic-floor-fitness': ['pelvicFloorMuscleTraining']

};

export const PRIVACY_REVIEW_REQUIRED_IDS = new Set([
  'd-clue',
  'd-nurx-bc',
  'd-wisp-bc',
  'd-hers',
  'd-midi-health',
  'd-natural-cycles',
  'd-glow',
  'd-maven',
  'd-tia',
  'd-ppd',
  'd-initio',
  'd-apple-health',
  'd-visana',
  'd-evernow'
]);

function applyPrivacyReviewGuardrail(product) {
  if (!PRIVACY_REVIEW_REQUIRED_IDS.has(product?.id)) return product;

  return {
    ...product,
    privacy: {
      dataStorage: 'Review the provider current privacy policy for data storage details.',
      sellsData: 'Review the provider current privacy policy for data sharing and sale disclosures.',
      hipaa: 'Review the provider current privacy notices for applicable privacy protections.',
      keyPolicy: 'Privacy practices can change. Verify the provider current policy before sharing sensitive health information.'
    }
  };
}

function applyRecallReviewGuardrail(product) {
  const recalls = String(product?.safety?.recalls || '').trim();

  if (!/^(no|no known) recalls?\.?$/i.test(recalls)) return product;

  return {
    ...product,
    safety: {
      ...(product.safety || {}),
      recalls: 'Check current regulator and manufacturer recall notices.'
    }
  };
}

function hasEvidenceScope(link) {
  const text = `${link?.text || ''} ${link?.summary || ''} ${link?.justification || ''}`.toLowerCase();
  return /product|specific|category|general|intervention|adjacent|does not validate|not specific|not validate/.test(text);
}

function addConservativeEvidenceScope(link) {
  if (!link || hasEvidenceScope(link)) return link;

  return {
    ...link,
    justification: [
      link.justification,
      'Conservative ayna classification: category or adjacent evidence only; this source does not validate this specific product.'
    ].filter(Boolean).join(' ')
  };
}

function applyEvidenceScopeGuardrail(product) {
  const scientific = product?.verificationLinks?.scientific;
  if (!scientific) return product;

  let scopedScientific = scientific;

  if (Array.isArray(scientific)) {
    scopedScientific = scientific.map(addConservativeEvidenceScope);
  } else if (Array.isArray(scientific.links)) {
    scopedScientific = {
      ...scientific,
      links: scientific.links.map(addConservativeEvidenceScope)
    };
  } else if (scientific.url) {
    scopedScientific = addConservativeEvidenceScope(scientific);
  }

  return {
    ...product,
    verificationLinks: {
      ...(product.verificationLinks || {}),
      scientific: scopedScientific
    }
  };
}

function applyRatingSourceGuardrail(product) {
  if (product?.userRating == null || product?.userRatingSourceUrl) return product;

  return {
    ...product,
    userRating: null
  };
}

function hasCommunitySource(product) {
  if (product?.communityReviewSourceUrl) return true;

  const community = product?.verificationLinks?.community;
  if (!community) return false;

  if (Array.isArray(community)) return community.some((link) => link?.url);
  if (Array.isArray(community.links)) return community.links.some((link) => link?.url);
  if (community.url) return true;

  return false;
}

function applyCommunitySourceGuardrail(product) {
  if (!product?.communityReview || hasCommunitySource(product)) return product;

  return {
    ...product,
    communityReview: null
  };
}


const CLINICIAN_SYNTHESIS_BY_ID = {
  'p-oboo-nook': 'Limited category-level research suggests vibrator use may support sexual function and some pelvic-health outcomes, but the evidence is small and does not validate this specific device.',
  'p-oboo-smooch': 'Limited category-level research suggests vibrator use may support sexual function and some pelvic-health outcomes, but the evidence is small and does not validate this specific device.',
  'p-oboo-woo': 'Limited category-level research suggests vibrator use may support sexual function and some pelvic-health outcomes, but the evidence is small and does not validate this specific device.',
  'p-oboo-shoop': 'Limited category-level research suggests vibrator use may support sexual function and some pelvic-health outcomes, but the evidence is small and does not validate this specific device.',
  'p-oboo-moon': 'Evidence does not establish this kit as a treatment. Anal insertion can cause tissue injury, so gradual use, adequate lubrication, and stopping with pain or bleeding are important safety considerations.',
  'p-oboo-oooh': 'Limited category-level research suggests vibrator use may support sexual function and some pelvic-health outcomes, but the evidence is small and does not validate this specific device.',
  'p-oboo-groove': 'Limited category-level research suggests vibrator use may support sexual function and some pelvic-health outcomes, but the evidence is small and does not validate this specific device.',
  'p-oboo-boom': 'Limited category-level research suggests vibrator use may support sexual function and some pelvic-health outcomes, but the evidence is small and does not validate this specific device.',
  'p-oboo-smooth-daily': 'Vulvar skin can be sensitive to cosmetic ingredients. Product-specific benefit has not been established, and use should be stopped if irritation develops.',
  'p-oboo-smooth-arousal': 'Vulvar skin can be sensitive to cosmetic ingredients. Product-specific benefit has not been established, and use should be stopped if irritation develops.',
  'p-oboo-loob-daily': 'Vaginal moisturizers and lubricants are recognized options for dryness and painful sex, but the evidence is category-level and does not validate this specific formula.',
  'p-oboo-loob-arousal': 'Vaginal moisturizers and lubricants are recognized options for dryness and painful sex, but the evidence is category-level and does not validate this specific formula.',
  'p-oboo-mood-drops': 'Evidence for herbal products marketed for female libido is inconsistent and often ingredient-specific. This tincture has not been independently clinically validated.',
  'p-oboo-cool-spray': 'Cooling may feel temporarily soothing, but evidence-based menopause guidance does not support cooling techniques as a proven treatment for vasomotor symptoms.',
  'd-connect-pelvic-floor-fitness': 'Pelvic floor muscle training is evidence-based for some forms of urinary incontinence. Evidence for PFMT generally does not establish outcomes for this specific digital program.'
};

function applyClinicianSynthesisGuardrail(product) {
  if (!product || product.doctorOpinion) return product;

  const synthesis = CLINICIAN_SYNTHESIS_BY_ID[product.id];
  if (!synthesis) return product;

  return {
    ...product,
    clinicianOpinionSource: 'ayna-synthesis',
    clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
    doctorOpinion: synthesis
  };
}

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

  const guardedProduct = applyRatingSourceGuardrail(applyCommunitySourceGuardrail(applyEvidenceScopeGuardrail(applyRecallReviewGuardrail(applyPrivacyReviewGuardrail(applyClinicianSynthesisGuardrail(product))))));

  // Never overwrite hand-curated/product-specific scientific evidence.
  if (existingScientificLinks(guardedProduct).length) return guardedProduct;

  // Restore scientific sources that existed on this branch before the main merge
  // when main left the corresponding verification-links array empty.
  const restoredLinks = RESTORED_SCIENTIFIC_EVIDENCE[guardedProduct.id] || [];
  if (restoredLinks.length) {
    return {
      ...guardedProduct,
      verificationLinks: {
        ...(guardedProduct.verificationLinks || {}),
        scientific: {
          links: restoredLinks.map(addConservativeEvidenceScope)
        }
      }
    };
  }

  const keys = PRODUCT_EVIDENCE_KEYS[guardedProduct.id] || [];
  if (!keys.length) return guardedProduct;

  const links = keys.flatMap((key) => CATALOG_EVIDENCE[key]?.scientific || []);
  if (!links.length) return guardedProduct;

  return {
    ...guardedProduct,
    verificationLinks: {
      ...(guardedProduct.verificationLinks || {}),
      scientific: { links }
    }
  };
}
