import { ALL_PRODUCTS, getProductMatchDetailsForProduct } from '../data/products';

// `categories` used to be dead data — nothing ever read it, only `tags` did,
// and several entries used category names ('app', 'device') that don't
// exist anywhere in the real taxonomy (src/data/products.js's
// CATEGORY_LABELS), so those concerns could only ever match via a `tags`
// coincidence. Now used as a second, OR'd matching path below (see
// generateTieredRecommendations) — category is a controlled, always-present
// field, unlike free-text tags, so it's the more reliable signal. Rewritten
// against the real current category taxonomy (2026-08-25).
const CONCERN_CONFIG = [
  { key: 'Period care (pads, tampons, cups, discs, underwear)', tags: ['heavy-flow', 'leaks'], categories: ['pad', 'tampon', 'cup', 'disc', 'period-underwear'] },
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
  return `USER PROFILE:
- Age: ${intake?.age || 'unknown'}
- Primary concerns: ${selectedConcerns(intake).join(', ') || 'none provided'}
- Other concerns: ${asArray(intake?.customConcerns).join(', ') || 'none provided'}
- Conditions: ${asArray(intake?.conditions).join(', ') || 'none provided'}
- Cycle: menstrual cycle=${intake?.menstrualCycle || 'unknown'}, average cycle length=${intake?.averageCycleLength || 'unknown'}, average period length=${intake?.averagePeriodLength || 'unknown'}
- Flow: ${intake?.flowLevel || 'unknown'}, Pain: ${intake?.painLevel || 'unknown'}/10
- Symptoms: ${asArray(intake?.symptoms).join(', ') || 'none provided'}
- Preferences: ${asArray(intake?.productPreferences).join(', ') || 'none provided'}
- Currently uses: ${asArray(intake?.currentProducts).join(', ') || 'none listed'} WHEN ADDING THESE TO THE ECOSYSTEM, DON'T GENERATE A NEW PRODUCT CARD. for example, IF A USER TYPES IN ALWAYS PADS, JUST USE A PRODUCT CARD THAT ALREADY EXISTS AND ADD THE CLOSEST MATCH IN OUR DATABASE.
- Has tried and disliked: ${asArray(intake?.dislikedProducts).join(', ') || 'none listed'} because ${intake?.dislikedReason || 'no reason provided'}
- Goals: ${asArray(intake?.goals).join(', ') || 'none provided'}

TASK:
For the concern area [${concern}], generate three recommendation tiers:

TIER 1 - IMMEDIATE PHYSICAL PRODUCT
Recommend the single best physical product for this user. Explain in 2-3 sentences exactly why it fits her specific profile, conditions, and preferences. Flag any ingredients or materials to be aware of given her conditions.

TIER 2 - SUPPLEMENT OR WELLNESS PRODUCT
Recommend the single best supplement, vitamin, or wellness product for this concern. Explain why it is appropriate for her specific conditions. Note any interactions with medications or conditions she should be aware of.

TIER 3 - DIGITAL OR TELEHEALTH OPTION
Recommend the best app, telehealth service, or digital resource for this concern. Explain why it is relevant to her situation specifically.

RULES:
- Never recommend a product the user has already tried and disliked
- Always flag if a product contains ingredients that may worsen her conditions
- If the user has endometriosis, always flag products with synthetic fragrances, dioxins, or hormone-disrupting materials
- If the user has PCOS, prioritize products that support hormone balance
- If the user has heavy flow, always prioritize capacity and leak protection above all else
- Always explain the WHY behind every recommendation in plain language
- Never be generic. Every recommendation must reference at least one specific detail from her profile`;
}

export function generateTieredRecommendations(intake = {}) {
  const selected = selectedConcerns(intake);
  if (selected.length === 0) return [];
  const concerns = CONCERN_CONFIG
    .map((c) => ({ concern: c, score: concernRelevanceScore(c, intake) }))
    .filter(({ concern }) => selected.includes(concern.key))
    .sort((a, b) => b.score - a.score)
    .map(({ concern }) => concern);
  // This only bounds an instant, purely local preview shown while the real
  // per-concern LLM generation runs and then fully replaces it (see
  // MyEcosystem.jsx) — capping it below what a user can actually select
  // made the preview drop care areas that the final ecosystem still
  // included seconds later, reading as a bug rather than a loading state.
  // 20 comfortably covers every CONCERN_AREAS checkbox (16) plus derived
  // concerns; it's a sanity ceiling, not a real limit in practice.
  const scopedConcerns = concerns.slice(0, 20);

  return scopedConcerns.map((concern) => {
    const concernPool = ALL_PRODUCTS.filter((p) => {
      const tags = p.tags || [];
      const category = p.category || '';
      return concern.tags.some((tag) => tags.includes(tag)) || concern.categories.includes(category);
    });

    const chosen = new Set();
    const tier1Candidates = selectTierCandidates(concernPool, intake, concern, 'physical', chosen, 4);
    if (tier1Candidates[0]) chosen.add(tier1Candidates[0].id);
    const tier2Candidates = selectTierCandidates(concernPool, intake, concern, 'supplement', chosen, 4);
    if (tier2Candidates[0]) chosen.add(tier2Candidates[0].id);
    const tier3Candidates = selectTierCandidates(concernPool, intake, concern, 'digital', chosen, 4);
    const tier1 = tier1Candidates[0] || null;
    const tier2 = tier2Candidates[0] || null;
    const tier3 = tier3Candidates[0] || null;

    const notes = [];
    const painLevel = Number(intake?.painLevel || 0);
    if (painLevel >= 8) {
      notes.push('Pain level is 8 or higher: include telehealth and suggest speaking to a provider.');
    }

    return {
      concern: concern.key,
      prompt: buildRecommendationPrompt(intake, concern.key),
      tiers: [
        tier1 ? {
          id: 'tier-physical',
          name: 'TIER 1 - IMMEDIATE PHYSICAL PRODUCT',
          subcategory: buildSubcategoryLabel(concern, 'physical'),
          product: tier1,
          matchExplanation: buildMatchExplanation(tier1, intake, concern, 'physical'),
          safetyFlags: safetyNotes(tier1, intake),
          alternatives: tier1Candidates.slice(1, 4),
        } : null,
        tier2 ? {
          id: 'tier-supplement',
          name: 'TIER 2 - SUPPLEMENT OR WELLNESS PRODUCT',
          subcategory: buildSubcategoryLabel(concern, 'supplement'),
          product: tier2,
          matchExplanation: buildMatchExplanation(tier2, intake, concern, 'supplement'),
          safetyFlags: safetyNotes(tier2, intake),
          alternatives: tier2Candidates.slice(1, 4),
        } : null,
        tier3 ? {
          id: 'tier-digital',
          name: 'TIER 3 - DIGITAL OR TELEHEALTH OPTION',
          subcategory: buildSubcategoryLabel(concern, 'digital'),
          product: tier3,
          matchExplanation: buildMatchExplanation(tier3, intake, concern, 'digital'),
          safetyFlags: safetyNotes(tier3, intake),
          alternatives: tier3Candidates.slice(1, 4),
        } : null,
      ].filter(Boolean),
      notes,
    };
  });
}
