import { ALL_PRODUCTS, getProductMatchDetailsForProduct } from '../data/products.js';

// `categories` used to be dead data — nothing ever read it, only `tags` did,
// and several entries used category names ('app', 'device') that don't
// exist anywhere in the real taxonomy (src/data/products.js's
// CATEGORY_LABELS), so those concerns could only ever match via a `tags`
// coincidence. Now used as a second, OR'd matching path below (see
// generateTieredRecommendations) — category is a controlled, always-present
// field, unlike free-text tags, so it's the more reliable signal. Rewritten
// against the real current category taxonomy (2026-08-25).
const CONCERN_CONFIG = [
  { key: 'Period care (pads, tampons, cups, discs, underwear)', tags: ['heavy-flow', 'leaks', 'cramps'], categories: ['pad', 'liner', 'tampon', 'cup', 'disc', 'period-underwear', 'cramp-relief'] },
  { key: 'Cramp and pain relief (devices, supplements, heat)', tags: ['cramps'], categories: ['cramp-relief', 'supplement'] },
  { key: 'Hormone balance (supplements, lifestyle)', tags: ['pcos', 'irregular', 'bloating'], categories: ['supplement'] },
  { key: 'Hormonal bloating', tags: ['bloating', 'bloat'], categories: ['supplement'] },
  { key: 'PCOS management (supplements, telehealth, apps)', tags: ['pcos'], categories: ['supplement', 'telehealth', 'tracker'] },
  { key: 'Endometriosis management (supplements, devices, telehealth)', tags: ['endometriosis', 'cramps'], categories: ['supplement', 'telehealth', 'cramp-relief'] },
  { key: 'Fertility and conception (supplements, trackers, telehealth)', tags: ['fertility'], categories: ['supplement', 'tracker', 'telehealth'] },
  // Real feedback from a beta tester (Theresa Mahon, 2026-08-25): "Fertility
  // and conception isn't comprehensive enough" — the catalog already carries
  // 13 'pregnancy' and 5 'postpartum' category products (maternity support,
  // nursing cups, etc.) with no concern checkbox that could ever surface
  // them, since neither category was referenced by any existing entry here.
  { key: 'Pregnancy support (prenatal vitamins, trackers, comfort)', tags: ['pregnancy', 'prenatal'], categories: ['pregnancy'] },
  { key: 'Postpartum recovery (nursing, healing, comfort)', tags: ['postpartum', 'nursing', 'recovery'], categories: ['postpartum'] },
  { key: 'UTI support', tags: ['uti'], categories: ['supplement', 'telehealth', 'diagnostics'] },
  { key: 'STI support', tags: ['sti', 'std', 'sexual-health'], categories: ['telehealth', 'diagnostics'] },
  { key: 'Gut and vaginal health (probiotics, pH balance)', tags: ['vaginal-health', 'probiotic', 'ph-balance'], categories: ['supplement', 'intimate-care'] },
  { key: 'Perimenopause and menopause support', tags: ['menopause'], categories: ['menopause', 'supplement', 'telehealth'] },
  { key: 'Sexual health and comfort (lubricants, pelvic floor)', tags: ['pelvic-floor'], categories: ['sex-tech', 'intimate-care', 'pelvic-floor'] },
  { key: 'Mental health and cycle mood support', tags: ['mood', 'anxiety'], categories: ['mental-health'] },
  { key: 'Sleep and energy', tags: ['sleep', 'energy'], categories: ['sleep', 'supplement'] },
  // No live product currently carries category 'skin'/'skincare'/'hair'/'haircare' — a real
  // catalog gap, not a mapping bug. Left correct so this activates the moment one exists; the
  // LLM-backed final generation (api/llm-recommendations.js) isn't limited to this static
  // catalog and can still surface a real product via live search grounding in the meantime.
  { key: 'Skin and hair (hormone-related)', tags: ['skin', 'hair'], categories: ['skin', 'skincare', 'hair', 'haircare'] },
  { key: 'Telehealth and provider matching', tags: [], categories: ['telehealth'] },
];

const ENDOMETRIOSIS_FLAGS = ['synthetic fragrance', 'dioxins', 'chlorine bleaching', 'bpa'];
const PCOS_HORMONE_FLAGS = ['phthalate', 'paraben', 'bpa', 'synthetic fragrance'];

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function selectedConcerns(intake) {
  if (Array.isArray(intake?.primaryConcerns) && intake.primaryConcerns.length > 0) return intake.primaryConcerns;
  if (intake?.primaryConcern) return [intake.primaryConcern];
  return [];
}

function lowerList(arr = []) {
  return asArray(arr).map((x) => String(x || '').toLowerCase());
}

function buildSubcategoryLabel(concern, tierType) {
  const key = String(concern?.key || '').toLowerCase();
  if (key.includes('uti')) {
    if (tierType === 'physical') return 'UTI Prevention';
    if (tierType === 'supplement') return 'UTI Symptom Support';
    return 'UTI Care Access';
  }
  if (key.includes('period care')) {
    if (tierType === 'physical') return 'Period Products';
    if (tierType === 'supplement') return 'Cycle Support';
    return 'Period Tracking & Telehealth';
  }
  if (key.includes('pcos')) {
    if (tierType === 'physical') return 'Daily PCOS Support Tools';
    if (tierType === 'supplement') return 'Hormone Balance Support';
    return 'PCOS Digital & Telehealth Support';
  }
  if (key.includes('endometriosis')) {
    if (tierType === 'physical') return 'Pain & Flare Comfort';
    if (tierType === 'supplement') return 'Inflammation & Symptom Support';
    return 'Specialist Care Access';
  }
  if (tierType === 'physical') return 'Immediate Product Support';
  if (tierType === 'supplement') return 'Supplement or Wellness Support';
  return 'Digital or Telehealth Support';
}

function buildMatchExplanation(product, intake, concern, tierType) {
  const details = getProductMatchDetailsForProduct(product, intake);

  const reasons = Array.isArray(details?.reasons)
    ? details.reasons.filter(Boolean).slice(0, 3)
    : [];

  if (reasons.length > 0) {
    return reasons.join(' ');
  }

  if (details?.healthMatch != null) {
    return 'This product was ranked using your health profile, preferences, and the available evidence for this product.';
  }

  return 'This product is relevant to this care area, but there is not enough profile information to give a highly personalized explanation yet.';
}

function textForSafety(product) {
  return [product?.safety?.materials, product?.safety?.allergens, product?.safety?.sideEffects, product?.summary]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function hasRecall(product) {
  const recalls = String(product?.safety?.recalls || '').toLowerCase();
  return recalls.includes('⚠️') || (recalls.includes('recall') && !recalls.includes('no recalls'));
}

function includesAny(text, terms) {
  return terms.some((t) => text.includes(t));
}

function productDisliked(product, dislikedList) {
  const n = String(product?.name || '').toLowerCase();
  return dislikedList.some((d) => n.includes(String(d || '').toLowerCase()));
}

function hasReliabilityConcern(product) {
  const source = String(product?.clinicianOpinionSource || '').toLowerCase();
  if (source === 'brand' || source === 'mixed') return true;

  const concernText = [
    product?.safety?.opinionAlerts,
    product?.communityReview,
    product?.doctorOpinion,
    product?.summary,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/less scientific|split opinions|polarized|class-action|not robust|unreliable|incentivized/.test(concernText)) {
    return true;
  }
  return false;
}

function hasIndependentClinicianOpinion(product) {
  const source = String(product?.clinicianOpinionSource || '').toLowerCase();
  const attribution = String(product?.clinicianAttribution || '').trim();
  const doctorOpinion = String(product?.doctorOpinion || '').trim();
  // Accept: explicit independent source with attribution, OR any product with a substantive doctor opinion
  return (source === 'independent' && attribution.length > 0) || doctorOpinion.length > 20;
}

function isSupplementProduct(product) {
  const category = String(product?.category || '').toLowerCase();
  const tags = (product?.tags || []).map((t) => String(t || '').toLowerCase());
  return category.includes('supplement') || category.includes('vitamin') || category.includes('wellness') || tags.includes('supplement');
}

function isDigitalOrTelehealthProduct(product) {
  const type = String(product?.type || 'physical').toLowerCase();
  const category = String(product?.category || '').toLowerCase();
  return type === 'digital' || category.includes('telehealth') || category.includes('app') || category.includes('tracker');
}

function matchesTierType(product, tierType) {
  if (tierType === 'physical') return String(product?.type || 'physical').toLowerCase() === 'physical' && !isSupplementProduct(product);
  if (tierType === 'supplement') return isSupplementProduct(product);
  if (tierType === 'digital') return isDigitalOrTelehealthProduct(product);
  return false;
}

function intakeProfile(intake) {
  return intake?.fullHealthIntake && typeof intake.fullHealthIntake === 'object'
    ? intake.fullHealthIntake
    : intake;
}

function solutionTypeKey(product) {
  const category = String(product?.category || '').toLowerCase();
  const name = String(product?.name || '').toLowerCase();
  const summary = String(product?.summary || '').toLowerCase();
  const text = `${name} ${summary}`;

  if (category === 'pad') return 'pad';
  const isIncontinenceLiner =
    category === 'incontinence'
    || /incontinence|bladder leak|urinary leak/.test(text);

  if (
    category === 'liner'
    || (!isIncontinenceLiner && /menstrual liner|period liner|panty liner/.test(text))
  ) {
    return 'liner';
  }
  if (category === 'tampon') return 'tampon';
  if (category === 'cup') return 'cup';
  if (category === 'disc') return 'disc';
  if (category === 'period-underwear') return 'period-underwear';
  if (category === 'cramp-relief' || /cramp|heating pad|heat wrap|tens/.test(text)) return 'cramp-relief';

  if (isSupplementProduct(product)) return 'supplement';

  if (isDigitalOrTelehealthProduct(product)) {
    if (category.includes('telehealth')) return 'telehealth';
    if (category.includes('tracker')) return 'tracker';
    if (category.includes('app')) return 'app';
    return `digital-${category || 'service'}`;
  }

  if (category) return category;

  return String(product?.type || 'physical').toLowerCase();
}

function solutionTypeLabel(key, concern) {
  const labels = {
    pad: 'Pads',
    liner: 'Liners for spotting or light days',
    tampon: 'Tampons',
    cup: 'Menstrual cups',
    disc: 'Menstrual discs',
    'period-underwear': 'Period underwear',
    'cramp-relief': 'Cramp relief',
    supplement: 'Supplement or wellness support',
    telehealth: 'Telehealth care',
    tracker: 'Tracking tool',
    app: 'Digital support',
  };

  if (labels[key]) return labels[key];

  if (['physical', 'supplement', 'digital'].includes(key)) {
    return buildSubcategoryLabel(concern, key);
  }

  return String(key || 'Product')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function periodPainIsRelevant(intake) {
  const profile = intakeProfile(intake);
  const pain = String(profile?.periodPain || profile?.painLevel || '').toLowerCase();

  if (pain && !['none', 'not sure', '0'].includes(pain)) return true;

  const support = [
    ...asArray(profile?.supportSelections),
    ...asArray(profile?.primaryConcerns),
    ...asArray(profile?.symptoms),
  ].map((value) => String(value || '').toLowerCase());

  return support.some((value) => /cramp|period pain|pelvic pain/.test(value));
}

function candidateAllowedForConcern(product, intake, concern) {
  const concernKey = String(concern?.key || '').toLowerCase();
  const solutionKey = solutionTypeKey(product);

  if (concernKey.includes('period care') && solutionKey === 'cramp-relief') {
    return periodPainIsRelevant(intake);
  }

  return true;
}

function buildDiverseTiers(products, intake, concern, limit = 5) {
  const profile = intakeProfile(intake);
  const disliked = [
    ...asArray(profile?.dislikedProducts),
    ...asArray(profile?.avoidRepeat),
  ];

  const ranked = products
    .filter(Boolean)
    .filter((product) => !productDisliked(product, disliked))
    .filter((product) => !hasRecall(product))
    .filter((product) => candidateAllowedForConcern(product, intake, concern))
    .filter((product) => getProductMatchDetailsForProduct(product, intake)?.eligible !== false)
    .sort((a, b) => scoreProduct(b, intake, concern) - scoreProduct(a, intake, concern));

  const groups = new Map();

  ranked.forEach((product) => {
    const key = solutionTypeKey(product);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  });

  return [...groups.entries()]
    .map(([key, candidates]) => ({
      key,
      product: candidates[0],
      alternatives: candidates.slice(1, 3),
      score: scoreProduct(candidates[0], intake, concern),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((group, index) => ({
      id: `tier-${group.key}-${index + 1}`,
      name: solutionTypeLabel(group.key, concern),
      subcategory: solutionTypeLabel(group.key, concern),
      product: group.product,
      matchExplanation: buildMatchExplanation(group.product, intake, concern, group.key),
      safetyFlags: safetyNotes(group.product, intake),
      alternatives: group.alternatives,
    }));
}

// Same field-name fallback pattern as Discovery.jsx's eligibility filter —
// the catalog has both camelCase and snake_case rows depending on when a
// product was added.
function fsaHsaEligibility(product) {
  const combined = product?.fsaHsaEligible === true || product?.fsa_hsa_eligible === true;
  return {
    fsa: combined || product?.fsaEligible === true || product?.fsa_eligible === true,
    hsa: combined || product?.hsaEligible === true || product?.hsa_eligible === true,
  };
}

export function scoreProduct(product, intake, concern) {
  const details = getProductMatchDetailsForProduct(product, intake);
  if (!details?.eligible) return -1;
  return details?.percent == null ? 0 : details.percent;
}

function safetyNotes(product, intake) {
  const notes = [];
  const safetyText = textForSafety(product);
  const conditions = asArray(intake?.conditions);
  if (conditions.includes('endometriosis') && includesAny(safetyText, ENDOMETRIOSIS_FLAGS)) {
    notes.push('Contains materials that may be problematic for endometriosis (synthetic fragrance/dioxins/chlorine/BPA).');
  }
  if (conditions.includes('PCOS') && includesAny(safetyText, PCOS_HORMONE_FLAGS)) {
    notes.push('Contains ingredients/materials with potential hormone-disrupting concerns for PCOS.');
  }
  if (asArray(intake?.tryingToConceive)[0] === 'yes' && /ashwagandha|retinol|high-dose vitamin a/i.test(safetyText)) {
    notes.push('Trying to conceive: verify this supplement with a provider before use in preconception/pregnancy.');
  }
  return notes;
}

function isRelevantConcern(concern, intake) {
  const selected = selectedConcerns(intake);
  if (selected.includes(concern.key)) return true;
  const tags = concern.tags;
  if ((intake?.conditions || []).includes('PCOS') && tags.includes('pcos')) return true;
  if ((intake?.conditions || []).includes('endometriosis') && tags.includes('endometriosis')) return true;
  if ((intake?.conditions || []).includes('perimenopause') || (intake?.conditions || []).includes('menopause')) {
    if (tags.includes('menopause')) return true;
  }
  if ((intake?.tryingToConceive || '') === 'yes' && tags.includes('fertility')) return true;
  if ((intake?.symptoms || []).includes('cramps') && tags.includes('cramps')) return true;
  if ((intake?.goals || []).includes('find a provider') && concern.key.includes('Telehealth')) return true;
  if ((intake?.menstrualCycle === 'yes' || intake?.menstrualCycle === 'irregular') && concern.key.startsWith('Period care')) return true;
  return false;
}

function concernRelevanceScore(concern, intake) {
  let score = 0;
  const selected = selectedConcerns(intake);
  if (selected.includes(concern.key)) score += 20;
  if ((intake?.conditions || []).includes('PCOS') && concern.tags.includes('pcos')) score += 8;
  if ((intake?.conditions || []).includes('endometriosis') && concern.tags.includes('endometriosis')) score += 8;
  if (((intake?.conditions || []).includes('perimenopause') || (intake?.conditions || []).includes('menopause')) && concern.tags.includes('menopause')) score += 8;
  if ((intake?.tryingToConceive || '') === 'yes' && concern.tags.includes('fertility')) score += 7;
  if ((intake?.symptoms || []).includes('cramps') && concern.tags.includes('cramps')) score += 5;
  if ((intake?.symptoms || []).includes('bloating') && concern.tags.includes('bloating')) score += 4;
  if ((intake?.flowLevel || '').toLowerCase().includes('heavy') && concern.tags.includes('heavy-flow')) score += 6;
  if ((intake?.menstrualCycle === 'yes' || intake?.menstrualCycle === 'irregular') && concern.key.startsWith('Period care')) score += 9;
  if ((intake?.menstrualCycle === 'yes' || intake?.menstrualCycle === 'irregular') && concern.tags.includes('leaks')) score += 4;
  if ((intake?.goals || []).includes('find a provider') && concern.key.includes('Telehealth')) score += 4;
  return score;
}

function selectTierProduct(products, intake, concern, tierType, alreadyChosen = new Set()) {
  const disliked = asArray(intake?.dislikedProducts);
  const candidates = products
    .filter((p) => !alreadyChosen.has(p.id))
    .filter((p) => !productDisliked(p, disliked))
    .filter((p) => !hasRecall(p))
    .filter((p) => getProductMatchDetailsForProduct(p, intake)?.eligible !== false)
    .filter((p) => {
      if (tierType === 'physical') return (p.type || 'physical') === 'physical';
      return (p.type || 'physical') === 'digital' || p.category === 'supplement';
    })
    .sort((a, b) => scoreProduct(b, intake, concern) - scoreProduct(a, intake, concern));

  return candidates[0] || null;
}

function selectTierCandidates(products, intake, concern, tierType, alreadyChosen = new Set(), limit = 4) {
  const disliked = asArray(intake?.dislikedProducts);
  return products
    .filter((p) => !alreadyChosen.has(p.id))
    .filter((p) => !productDisliked(p, disliked))
    .filter((p) => !hasRecall(p))
    .filter((p) => getProductMatchDetailsForProduct(p, intake)?.eligible !== false)
    .filter((p) => matchesTierType(p, tierType))
    .sort((a, b) => scoreProduct(b, intake, concern) - scoreProduct(a, intake, concern))
    .slice(0, limit);
}

export function buildRecommendationPrompt(intake, concern) {
  const profile = intakeProfile(intake);

  const conditions =
    Array.isArray(profile?.diagnosisSelections) && profile.diagnosisSelections.length > 0
      ? profile.diagnosisSelections
      : asArray(intake?.conditions);

  const medications =
    Array.isArray(profile?.currentMedicationItems) && profile.currentMedicationItems.length > 0
      ? profile.currentMedicationItems
      : asArray(intake?.currentMedications);

  const formats =
    Array.isArray(profile?.preferredFormats) && profile.preferredFormats.length > 0
      ? profile.preferredFormats
      : asArray(intake?.productPreferences);

  const support =
    Array.isArray(profile?.supportSelections) && profile.supportSelections.length > 0
      ? profile.supportSelections
      : selectedConcerns(intake);

  return `USER PROFILE:
- Age: ${profile?.age || intake?.age || 'unknown'}
- Life stage: ${asArray(profile?.lifeStageSelections).join(', ') || 'not provided'}
- Support needs: ${support.join(', ') || 'none provided'}
- Diagnosed conditions: ${conditions.join(', ') || 'none provided'}
- Period flow: ${profile?.periodFlow || intake?.flowLevel || 'not applicable/not provided'}
- Period pain: ${profile?.periodPain || intake?.painLevel || 'not applicable/not provided'}
- UTI frequency: ${profile?.utiFrequency || 'not applicable/not provided'}
- Preferred formats: ${formats.join(', ') || 'none provided'}
- Price range: ${asArray(profile?.priceRange).join(', ') || 'not provided'}
- Medications, supplements, vitamins, or hormonal birth control: ${medications.join(', ') || 'none provided'}
- Products to avoid repeating: ${asArray(profile?.avoidRepeat || intake?.dislikedProducts).join(', ') || 'none provided'}

TASK:
For the concern area [${concern}], identify 3 to 5 genuinely distinct, safe, relevant solution types whenever enough strong options exist.

RULES:
- Safety and contraindications come first.
- Do not force physical, supplement, digital, or telehealth categories just for variety.
- Prefer one strong primary option per meaningfully different solution type.
- A different brand of essentially the same product is an alternative, not a new primary recommendation.
- If fewer than 3 strong distinct options exist, return fewer rather than adding weak or irrelevant products.
- Respect the user's format, price, and other shopping preferences when clinically appropriate.
- Never recommend something the user explicitly said to avoid or previously reacted badly to.
- For period care, use flow, spotting, pain, and internal-product preference to diversify appropriately.
- Always explain why each recommendation fits the user's actual profile in plain language.`;
}

export function generateTieredRecommendations(intake = {}) {
  const selected = selectedConcerns(intake);
  if (selected.length === 0) return [];

  const concerns = CONCERN_CONFIG
    .map((c) => ({ concern: c, score: concernRelevanceScore(c, intake) }))
    .filter(({ concern }) => selected.includes(concern.key))
    .sort((a, b) => b.score - a.score)
    .map(({ concern }) => concern);

  const scopedConcerns = concerns.slice(0, 20);

  return scopedConcerns.map((concern) => {
    const concernPool = ALL_PRODUCTS.filter((product) => {
      const tags = product.tags || [];
      const category = product.category || '';

      if (concern.key.startsWith('Period care')) {
        const allowedPeriodTypes = new Set([
          'pad',
          'liner',
          'tampon',
          'cup',
          'disc',
          'period-underwear',
          'cramp-relief',
        ]);

        return allowedPeriodTypes.has(solutionTypeKey(product));
      }

      return concern.tags.some((tag) => tags.includes(tag))
        || concern.categories.includes(category);
    });

    const tiers = buildDiverseTiers(concernPool, intake, concern, 5);

    const notes = [];
    const profile = intakeProfile(intake);
    const pain = String(profile?.periodPain || profile?.painLevel || '');
    const numericPain = Number(pain);

    if (Number.isFinite(numericPain) && numericPain >= 8) {
      notes.push('Pain level is 8 or higher: include telehealth and suggest speaking to a provider.');
    }

    return {
      concern: concern.key,
      prompt: buildRecommendationPrompt(intake, concern.key),
      tiers,
      notes,
    };
  });
}
