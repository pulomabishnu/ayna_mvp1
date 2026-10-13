import { ALL_PRODUCTS, getProductMatchDetailsForProduct, getSelectedNeeds, getMatchCareFlags } from '../data/products.js';
import { LEGACY_CONCERN_NEEDS, needIdForOption } from '../matching/ontology.js';
import { LEGACY_CONCERN_BY_ITEM } from '../mobile/data/intakeModel.js';

// Instant local tiers for the ecosystem, built on the matching engine
// (src/matching): each concern area is scored on the specific needs she
// selected inside it, a product only appears if it is eligible and scores
// >= 50 (exploratory) for one of those needs, and a concern with few
// qualifying products gets fewer tiers rather than weaker ones.
const MIN_TIER_SCORE = 50;

// Concern areas of the first web intake (keys are also what the LLM route and
// MyEcosystem key shelves by). Matching no longer uses `tags`/`categories`:
// each concern's products come from the engine needs it contains
// (LEGACY_CONCERN_BY_ITEM for current answers, LEGACY_CONCERN_NEEDS for older
// saved profiles). `tags` still order concerns (concernRelevanceScore).
// Exported: api/llm-recommendations.js scopes its per-concern catalog slice
// with these same keys/tags/categories.
export const CONCERN_CONFIG = [
  { key: 'Period care (pads, tampons, cups, discs, underwear)', tags: ['heavy-flow', 'leaks', 'cramps'], categories: ['pad', 'liner', 'tampon', 'cup', 'disc', 'period-underwear', 'cramp-relief'] },
  { key: 'Cramp and pain relief (devices, supplements, heat)', tags: ['cramps'], categories: ['cramp-relief', 'supplement'] },
  { key: 'Hormone balance (supplements, lifestyle)', tags: ['pcos', 'irregular', 'bloating'], categories: ['supplement'] },
  { key: 'Hormonal bloating', tags: ['bloating', 'bloat'], categories: ['supplement'] },
  { key: 'PCOS management (supplements, telehealth, apps)', tags: ['pcos'], categories: ['supplement', 'telehealth', 'tracker'] },
  { key: 'Endometriosis management (supplements, devices, telehealth)', tags: ['endometriosis', 'cramps'], categories: ['supplement', 'telehealth', 'cramp-relief'] },
  { key: 'Fertility and conception (supplements, trackers, telehealth)', tags: ['fertility'], categories: ['supplement', 'tracker', 'telehealth'] },
  // Real feedback from a beta tester (Theresa Mahon, 2026-08-25): "Fertility
  // and conception isn't comprehensive enough", the catalog already carries
  // 13 'pregnancy' and 5 'postpartum' category products (maternity support,
  // nursing cups, etc.) with no concern checkbox that could ever surface
  // them, since neither category was referenced by any existing entry here.
  { key: 'Pregnancy support (prenatal vitamins, trackers, comfort)', tags: ['pregnancy', 'prenatal'], categories: ['pregnancy'] },
  { key: 'Postpartum recovery (nursing, healing, comfort)', tags: ['postpartum', 'nursing', 'recovery'], categories: ['postpartum'] },
  { key: 'UTI support', tags: ['uti'], categories: ['supplement', 'telehealth', 'diagnostics'] },
  { key: 'STI support', tags: ['sti', 'std', 'sexual-health'], categories: ['telehealth', 'diagnostics'] },
  { key: 'Gut and vaginal health (probiotics, pH balance)', tags: ['vaginal-health', 'probiotic', 'ph-balance'], categories: ['supplement', 'intimate-care'] },
  { key: 'Perimenopause and menopause support', tags: ['menopause'], categories: ['menopause', 'supplement', 'telehealth'] },
  { key: 'Sexual health and comfort (lubricants, pelvic floor)', tags: ['pelvic-floor'], categories: ['sex-tech', 'intimate-care', 'pelvic-floor', 'pelvic-floor-trainer', 'pelvic-floor-exerciser'] },
  { key: 'Mental health and cycle mood support', tags: ['mood', 'anxiety'], categories: ['mental-health'] },
  { key: 'Sleep and energy', tags: ['sleep', 'energy'], categories: ['sleep', 'supplement'] },
  // No live product currently carries category 'skin'/'skincare'/'hair'/'haircare', a real
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

function buildMatchExplanation(needMatch, details) {
    const cautions = new Set((details?.considerations || []).map((c) => String(c.text).replace(/\.$/, '')));
    const reasons = (needMatch?.explanations || [])
        .filter((text) => !cautions.has(text) && text !== 'Not a substitute for getting checked')
        .slice(0, 3);
    if (reasons.length > 0) return `${reasons.join('. ')}.`;
    if (details?.reasons?.length) return details.reasons.slice(0, 3).join(' ');
    return 'Matches a need you selected. Add more to your health profile for more personal picks.';
}

function textForSafety(product) {
  return [product?.safety?.materials, product?.safety?.allergens, product?.safety?.sideEffects, product?.summary]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

// catalogEvidence.js rewrites a bare "No recalls" to this neutral reminder.
// It is not a recall and must not drop the product from every tier.
const NEUTRAL_RECALL_NOTE = 'check current regulator and manufacturer recall notices';

function hasRecall(product) {
  const recalls = String(product?.safety?.recalls || '').toLowerCase();
  if (recalls.includes('⚠️')) return true;
  if (recalls.includes(NEUTRAL_RECALL_NOTE)) return false;
  return recalls.includes('recall') && !recalls.includes('no recalls');
}

function includesAny(text, terms) {
  return terms.some((t) => text.includes(t));
}

function productDisliked(product, dislikedList) {
  const n = String(product?.name || '').toLowerCase();
  return dislikedList.some((d) => n.includes(String(d || '').toLowerCase()));
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

/** The engine need ids that belong to one concern area for this person. */
function concernNeedIds(concern, intake) {
    const selected = new Set(getSelectedNeeds(intake).map((n) => n.id));
    const profile = intakeProfile(intake);
    const ids = new Set();
    asArray(profile?.supportSelections).forEach((item) => {
        const mapped = asArray(LEGACY_CONCERN_BY_ITEM[item]);
        const id = needIdForOption(item);
        if (id && mapped.includes(concern.key)) ids.add(id);
    });
    (LEGACY_CONCERN_NEEDS[concern.key] || []).forEach((id) => { if (selected.has(id)) ids.add(id); });
    return [...ids].filter((id) => selected.has(id));
}

/** Best eligible need match for this concern, or null. */
function concernMatch(product, intake, needIds) {
    const details = getProductMatchDetailsForProduct(product, intake);
    if (details?.eligible === false) return { details, match: null };
    const match = (details?.needMatches || [])
        .filter((m) => needIds.includes(m.needId) && m.relevant && !m.filtered && m.score >= MIN_TIER_SCORE)
        .sort((x, y) => y.score - x.score)[0] || null;
    return { details, match };
}

function buildDiverseTiers(products, intake, concern, limit = 5) {
    const profile = intakeProfile(intake);
    const disliked = [
        ...asArray(profile?.dislikedProducts),
        ...asArray(profile?.avoidRepeat),
    ];
    const needIds = concernNeedIds(concern, intake);
    if (!needIds.length) return [];

    const ranked = products
        .filter(Boolean)
        .filter((product) => !productDisliked(product, disliked))
        .filter((product) => !hasRecall(product))
        .map((product) => ({ product, ...concernMatch(product, intake, needIds) }))
        .filter((row) => row.match)
        .map((row) => ({ ...row, key: row.match.score + fsaHsaBonus(row.product, intake) }))
        .sort((a, b) => b.key - a.key);

    const groups = new Map();
    ranked.forEach((row) => {
        const key = solutionTypeKey(row.product);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
    });

    return [...groups.entries()]
        .map(([key, rows]) => ({ key, rows, score: rows[0].key }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((group, index) => {
            const top = group.rows[0];
            return {
                id: `tier-${group.key}-${index + 1}`,
                name: solutionTypeLabel(group.key, concern),
                subcategory: solutionTypeLabel(group.key, concern),
                product: top.product,
                matchExplanation: buildMatchExplanation(top.match, top.details),
                safetyFlags: [...safetyNotes(top.product, intake), ...(top.details?.considerations || []).map((c) => c.text)],
                alternatives: group.rows.slice(1, 3).map((row) => row.product),
                needId: top.match.needId,
                score: top.match.score,
                tier: top.match.tier,
            };
        });
}

// Same field-name fallback pattern as Discovery.jsx's eligibility filter
// the catalog has both camelCase and snake_case rows depending on when a
// product was added.
function fsaHsaEligibility(product) {
    const combined = product?.fsaHsaEligible === true || product?.fsa_hsa_eligible === true;
    return {
        fsa: combined || product?.fsaEligible === true || product?.fsa_eligible === true,
        hsa: combined || product?.hsaEligible === true || product?.hsa_eligible === true,
    };
}

function fsaHsaAccount(intake) {
    const profile = intakeProfile(intake);
    const answer = { FSA: 'fsa', HSA: 'hsa', Both: 'both' }[profile?.fsaHsaAnswer] || profile?.fsaHsa || intake?.fsaHsa || '';
    return String(answer).toLowerCase();
}

// FSA/HSA is a tie-break only (engine spec): +1.5 ranking points, never part
// of the displayed match. 94 vs 93-and-eligible can flip; 94 vs 55 never does.
function fsaHsaBonus(product, intake) {
    const account = fsaHsaAccount(intake);
    const eligible = fsaHsaEligibility(product);
    const ok = (account === 'fsa' && eligible.fsa) || (account === 'hsa' && eligible.hsa) || (account === 'both' && (eligible.fsa || eligible.hsa));
    return ok ? 1.5 : 0;
}

/**
 * Ranking key for a product within a concern: the engine's best score for
 * the concern's needs (or the product's best need when the concern has no
 * mapped needs) plus the FSA/HSA tie-break. -1 when excluded.
 */
export function scoreProduct(product, intake, concern) {
    const details = getProductMatchDetailsForProduct(product, intake);
    if (!details?.eligible) return -1;
    const needIds = concern?.key && LEGACY_CONCERN_NEEDS[concern.key] ? concernNeedIds(concern, intake) : [];
    const concernScore = needIds.length
        ? Math.max(0, ...(details.needMatches || []).filter((m) => needIds.includes(m.needId)).map((m) => m.score))
        : details.percent == null ? 0 : details.percent;
    return concernScore + fsaHsaBonus(product, intake);
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
  if (String(asArray(intake?.tryingToConceive)[0] || '').toLowerCase() === 'yes' && /ashwagandha|retinol|high-dose vitamin a/i.test(safetyText)) {
    notes.push('Trying to conceive: verify this supplement with a provider before use in preconception/pregnancy.');
  }
  return notes;
}

function concernRelevanceScore(concern, intake) {
  let score = 0;
  const selected = selectedConcerns(intake);
  if (selected.includes(concern.key)) score += 20;
  if ((intake?.conditions || []).includes('PCOS') && concern.tags.includes('pcos')) score += 8;
  if ((intake?.conditions || []).includes('endometriosis') && concern.tags.includes('endometriosis')) score += 8;
  if (((intake?.conditions || []).includes('perimenopause') || (intake?.conditions || []).includes('menopause')) && concern.tags.includes('menopause')) score += 8;
  if (String(intake?.tryingToConceive || '').toLowerCase() === 'yes' && concern.tags.includes('fertility')) score += 7;
  if ((intake?.symptoms || []).includes('cramps') && concern.tags.includes('cramps')) score += 5;
  if ((intake?.symptoms || []).includes('bloating') && concern.tags.includes('bloating')) score += 4;
  if ((intake?.flowLevel || '').toLowerCase().includes('heavy') && concern.tags.includes('heavy-flow')) score += 6;
  if ((intake?.menstrualCycle === 'yes' || intake?.menstrualCycle === 'irregular') && concern.key.startsWith('Period care')) score += 9;
  if ((intake?.menstrualCycle === 'yes' || intake?.menstrualCycle === 'irregular') && concern.tags.includes('leaks')) score += 4;
  if ((intake?.goals || []).includes('find a provider') && concern.key.includes('Telehealth')) score += 4;
  return score;
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

function selectedConcernKeys(intake) {
    const selected = selectedConcerns(intake);
    if (selected.length) return selected;
    const profile = intakeProfile(intake);
    return [...new Set(asArray(profile?.supportSelections).flatMap((item) => asArray(LEGACY_CONCERN_BY_ITEM[item])))];
}

const CARE_NOTE_FOR_NEED = {
    uti_right_now: (ids) => ids.some((id) => id.startsWith('urinary.')),
    uti_first_time: (ids) => ids.some((id) => id.startsWith('urinary.')),
    severe_pain: (ids) => ids.includes('pain.menstrual_cramp'),
    very_heavy_flow: (ids) => ids.some((id) => id.startsWith('period.')),
    symptom_check: (ids) => ids.some((id) => ['urinary.burning', 'vaginal.discharge', 'sexual.sti'].includes(id)),
    pregnancy_unknown: () => true,
    breastfeeding_unknown: () => true,
    urgent_yes: () => true,
    urgent_not_sure: () => true,
};

export function generateTieredRecommendations(intake = {}) {
    const selected = selectedConcernKeys(intake);
    if (selected.length === 0) return [];

    const concerns = CONCERN_CONFIG
        .map((c) => ({ concern: c, score: concernRelevanceScore(c, intake) }))
        .filter(({ concern }) => selected.includes(concern.key))
        .sort((a, b) => b.score - a.score)
        .map(({ concern }) => concern);

    const careFlags = getMatchCareFlags(intake);

    return concerns.slice(0, 20).map((concern) => {
        const tiers = buildDiverseTiers(ALL_PRODUCTS, intake, concern, 5);
        const needIds = concernNeedIds(concern, intake);

        const notes = [];
        const profile = intakeProfile(intake);
        const numericPain = Number(String(profile?.painLevel || ''));
        if (Number.isFinite(numericPain) && numericPain >= 8) {
            notes.push('Pain level is 8 or higher: include telehealth and suggest speaking to a provider.');
        }
        careFlags.notes
            .filter((note) => CARE_NOTE_FOR_NEED[note.code]?.(needIds))
            .forEach((note) => notes.push(note.text));

        // The concern key is a UI grouping (navigation only). Headers should
        // name what she actually selected: "Night sweats", not "Perimenopause
        // and menopause support" for someone who never shared that stage.
        const needLabels = getSelectedNeeds(intake).filter((n) => needIds.includes(n.id)).map((n) => n.label);
        return {
            concern: concern.key,
            displayLabel: needLabels.length ? needLabels.join(', ') : concern.key,
            needLabels,
            prompt: buildRecommendationPrompt(intake, concern.key),
            tiers,
            notes: [...new Set(notes)],
            needIds,
            careFirst: careFlags.careFirst,
            careProminent: careFlags.careProminent && notes.length > 0,
        };
    });
}
