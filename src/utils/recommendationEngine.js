import { ALL_PRODUCTS } from '../data/products';

const CONCERN_CONFIG = [
  { key: 'Period care (pads, tampons, cups, discs, underwear)', tags: ['heavy-flow', 'leaks'], categories: ['pad', 'tampon', 'cup', 'disc', 'underwear'] },
  { key: 'Cramp and pain relief (devices, supplements, heat)', tags: ['cramps', 'pelvic-floor'], categories: ['supplement', 'device', 'app'] },
  { key: 'Hormone balance (supplements, lifestyle)', tags: ['pcos', 'irregular', 'bloating'], categories: ['supplement', 'app'] },
  { key: 'PCOS management (supplements, telehealth, apps)', tags: ['pcos'], categories: ['supplement', 'app', 'telehealth'] },
  { key: 'Endometriosis management (supplements, devices, telehealth)', tags: ['endometriosis', 'cramps'], categories: ['supplement', 'device', 'telehealth'] },
  { key: 'Fertility and conception (supplements, trackers, telehealth)', tags: ['fertility'], categories: ['supplement', 'app', 'telehealth'] },
  { key: 'Gut and vaginal health (probiotics, pH balance)', tags: ['uti'], categories: ['supplement'] },
  { key: 'Perimenopause and menopause support', tags: ['menopause'], categories: ['supplement', 'app', 'telehealth'] },
  { key: 'Sexual health and comfort (lubricants, pelvic floor)', tags: ['pelvic-floor'], categories: ['device', 'supplement'] },
  { key: 'Mental health and cycle mood support', tags: ['comfort'], categories: ['app', 'supplement'] },
  { key: 'Sleep and energy', tags: ['comfort'], categories: ['supplement', 'app'] },
  { key: 'Skin and hair (hormone-related)', tags: ['pcos', 'bloating'], categories: ['supplement'] },
  { key: 'Telehealth and provider matching', tags: ['uti', 'pcos', 'endometriosis', 'fertility', 'menopause'], categories: ['telehealth', 'app'] },
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

  if (/less scientific|split opinions|polarized|class-action|not robust|unreliable|incentivized|affiliate|sponsored/.test(concernText)) {
    return true;
  }
  return false;
}

function scoreProduct(product, intake, concern) {
  const tags = new Set(product?.tags || []);
  let score = 0;
  concern.tags.forEach((tag) => {
    if (tags.has(tag)) score += 4;
  });
  if ((intake?.flowLevel || '').toLowerCase().includes('heavy') && tags.has('heavy-flow')) score += 8;
  if ((intake?.conditions || []).includes('PCOS') && tags.has('pcos')) score += 6;
  if ((intake?.conditions || []).includes('endometriosis') && tags.has('endometriosis')) score += 6;
  if ((intake?.productPreferences || []).includes('organic') && tags.has('organic')) score += 2;
  if ((intake?.productPreferences || []).includes('budget-conscious') && tags.has('cost')) score += 2;
  if ((intake?.productPreferences || []).includes('sustainable/eco-friendly') && tags.has('sustainability')) score += 2;
  if ((intake?.preferredProductTypes || []).length > 0) {
    const rawType = String(product?.category || '').toLowerCase();
    if ((intake.preferredProductTypes || []).some((p) => rawType.includes(String(p).replace('menstrual ', '').slice(0, 5)))) {
      score += 2;
    }
  }
  return score;
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
    .filter((p) => !hasReliabilityConcern(p))
    .filter((p) => {
      if (tierType === 'physical') return (p.type || 'physical') === 'physical';
      return (p.type || 'physical') === 'digital' || p.category === 'supplement';
    })
    .sort((a, b) => scoreProduct(b, intake, concern) - scoreProduct(a, intake, concern));

  return candidates[0] || null;
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
  const concerns = CONCERN_CONFIG
    .map((c) => ({ concern: c, score: concernRelevanceScore(c, intake) }))
    .filter(({ concern, score }) => score > 0 || isRelevantConcern(concern, intake))
    .sort((a, b) => b.score - a.score)
    .map(({ concern }) => concern);
  const fallbackConcern = selectedConcerns(intake)[0] || intake?.primaryConcern;
  const scopedConcerns = concerns.length > 0
    ? concerns.slice(0, 5)
    : CONCERN_CONFIG.filter((c) => c.key === fallbackConcern);

  return scopedConcerns.map((concern) => {
    const concernPool = ALL_PRODUCTS.filter((p) => {
      const tags = p.tags || [];
      return concern.tags.some((tag) => tags.includes(tag));
    });

    const chosen = new Set();
    const tier1 = selectTierProduct(concernPool, intake, concern, 'physical', chosen);
    if (tier1) chosen.add(tier1.id);
    const tier2 = selectTierProduct(concernPool, intake, concern, 'supplement', chosen);
    if (tier2) chosen.add(tier2.id);
    const tier3 = selectTierProduct(concernPool, intake, concern, 'digital', chosen);

    const notes = [];
    const painLevel = Number(intake?.painLevel || 0);
    if (painLevel >= 8) {
      notes.push('Pain level is 8 or higher: include telehealth and suggest speaking to a provider.');
    }

    return {
      concern: concern.key,
      prompt: buildRecommendationPrompt(intake, concern.key),
      tiers: [
        tier1 ? { name: 'TIER 1 - IMMEDIATE PHYSICAL PRODUCT', product: tier1, safetyFlags: safetyNotes(tier1, intake) } : null,
        tier2 ? { name: 'TIER 2 - SUPPLEMENT OR WELLNESS PRODUCT', product: tier2, safetyFlags: safetyNotes(tier2, intake) } : null,
        tier3 ? { name: 'TIER 3 - DIGITAL OR TELEHEALTH OPTION', product: tier3, safetyFlags: safetyNotes(tier3, intake) } : null,
      ].filter(Boolean),
      notes,
    };
  });
}
