// Display helpers for the matching engine output (getProductMatchDetailsForProduct,
// getNeedMatchesForProduct, getEcosystemSeedFromQuiz). Shared by the website and
// the app so both say the same thing. Pure functions, no copy is invented here:
// every line is a short label for a field the engine already returns.

export const MIN_BADGE_SCORE = 50;

// ASK2 copy. A match states WHAT matched (her inputs), never WHY she has a
// symptom, and never claims certainty we do not have.
export const BASED_ON_LINE = 'Based on what you\u2019ve shared';
export const PROFILE_HINT = 'Add more to your health profile for more personal picks';
export const RESTRICTED_LINE = 'Add a safety detail to see this match';
// products.js puts this sentence first in `considerations` for restricted
// matches; views that show their own restricted box drop it.
export const RESTRICTED_CONSIDERATION = /^Safety not checked yet/;

const TIER_WORDS = { excellent: 'Excellent', strong: 'Strong', exploratory: 'Worth a look', browse: 'Browse' };

/** Engine tiers: excellent 80+, strong 65+, exploratory 50+, browse under 50. */
export function tierOf(score) {
  const s = Number(score) || 0;
  if (s >= 80) return 'excellent';
  if (s >= 65) return 'strong';
  if (s >= 50) return 'exploratory';
  return 'browse';
}

export function tierWord(tier, score) {
  return TIER_WORDS[tier] || TIER_WORDS[tierOf(score)];
}

/** "Cramps or period pain" -> "Cramps"; "Vaginal dryness" stays. */
export function shortNeedLabel(label) {
  const text = String(label || '').trim();
  const first = text.split(/\s+or\s+|\s*\(|,\s*/i)[0].trim();
  return first || text;
}

/** "82% for period cramps" from details or a need match. */
export function needHeadline(score, phrase) {
  if (!Number.isFinite(score)) return '';
  return phrase ? `${score}% for ${phrase}` : `${score}% match`;
}

function bestNeed(details, needId = null) {
  const list = details?.needMatches || [];
  if (needId) {
    const focus = list.find((m) => m.needId === needId && m.relevant);
    if (focus) return focus;
  }
  return list.find((m) => m.needId === details?.needId) || list[0] || null;
}

/**
 * Card badge: a need score, only when she has a profile and it is 50+.
 * Pass { needId } on a need shelf so the badge names that shelf's need and
 * shows its score (never a different need than the shelf it sits on).
 * @returns {{ percent: number, phrase: string, needId: string, label: string, basedOn: string, restricted: boolean, confidenceLevel: string|null } | null}
 */
export function matchBadge(details, { needId = null } = {}) {
  if (!details || details.matchStatus !== 'scored' || details.eligible === false) return null;
  const best = bestNeed(details, needId);
  const percent = needId && best?.needId === needId ? best.score : details.percent;
  if (!Number.isFinite(percent) || percent < MIN_BADGE_SCORE) return null;
  const phrase = best?.phrase || '';
  return {
    percent,
    phrase,
    needId: best?.needId || details.needId || null,
    label: needHeadline(percent, phrase),
    basedOn: BASED_ON_LINE,
    restricted: details.eligibility === 'restricted' || Boolean(best?.restricted),
    confidenceLevel: best?.confidenceLevel || details.confidence || null,
  };
}

/**
 * The why view, from the engine's own fields:
 *   reasons   what matched ("Matches the night sweats you selected")
 *   basedOn   the inputs it used ("Night sweats (you selected)")
 *   hint      soft prompt when confidence is limited, null when high
 *   restricted / missing  a safety detail is needed before we recommend it
 */
export function whyMatch(details) {
  if (!details) return { reasons: [], basedOn: [], hint: null, restricted: false, missing: [], considerations: [] };
  return {
    reasons: (details.reasonDetails || []).map((r) => r.text).filter(Boolean),
    basedOn: (details.basedOn || []).map((b) => b.text).filter(Boolean),
    // One action at a time: a restricted match already asks for the safety detail.
    hint: details.matchStatus === 'scored' && details.confidence !== 'high' && details.eligibility !== 'restricted' ? (details.profileHint || PROFILE_HINT) : null,
    restricted: details.eligibility === 'restricted',
    missing: details.missingSafetyText || [],
    considerations: (details.considerations || []).filter((c) => !RESTRICTED_CONSIDERATION.test(String(c.text || ''))),
  };
}

/** Per-need rows for her selected needs, best first. */
export function needBreakdown(details) {
  return (details?.needMatches || []).map((m) => ({
    needId: m.needId,
    label: m.label,
    short: shortNeedLabel(m.label),
    phrase: m.phrase,
    score: m.relevant ? m.score : 0,
    tier: m.relevant ? m.tier : 'browse',
    word: m.restricted ? 'Needs a safety detail' : m.relevant && m.score > 0 ? tierWord(m.tier, m.score) : 'Not for this',
    restricted: Boolean(m.restricted),
  }));
}

// Short notes for what lowered the engine's confidence (same codes as score.js).
const CONFIDENCE_NOTES = {
  pregnancy_unknown: 'Pregnancy safety not on file',
  ttc_pregnancy_unknown: 'Pregnancy safety not on file',
  pregnancy_caution: 'Check pregnancy use with a clinician',
  ttc_pregnancy_contraindicated: 'Not for use in pregnancy',
  breastfeeding_unknown: 'Breastfeeding safety not on file',
  breastfeeding_caution: 'Check breastfeeding use with a clinician',
  medication_unknown: 'Medication fit not reviewed',
  medication_caution: 'Check with your medicines',
  allergen_unknown: 'Allergen status not on file',
  allergen_variant: 'Some versions contain an allergen',
  broad_allergy_class: 'Check the full ingredient list',
  unresolved_allergy: 'Check the label for your allergy',
  allergy_status_unsure: 'Check the label',
  leave_out_unknown: 'Ingredients not fully on file',
  low_metadata: 'Limited product data',
  urgent_not_sure_high_risk: 'Check with a clinician first',
  pain_varies: 'Your pain varies',
  similar_reaction_caution: 'Similar to a past reaction',
  flow_contradiction: 'Period answers need a check',
  stage_needs_clarification: 'Life stage needs a check',
  unusual_combination: 'Life stage is less common at your age',
  medications_not_shared: 'Medicines not on file',
  pregnancy_status_unknown: 'Life stage not on file',
  pregnancy_reported: 'Confirm your life stage',
  allergy_status_unknown: 'Allergies not on file',
  answer_contradiction: 'Some answers conflict',
  stale_answers: 'Some answers are from a while ago',
  stale_pregnancy: 'Pregnancy answer is from a while ago',
  stale_medications: 'Medicine list is from a while ago',
  interpretation_uncertain: 'We were not sure how to read what you typed',
  age_unknown_age_limited: 'Age not on file',
};

/** Short confidence notes for the best need, deduped. */
export function confidenceNotes(details, product = null) {
  const best = bestNeed(details);
  const codes = (best?.confidenceReasons || []).map((r) => r.code);
  const notes = codes.map((c) => CONFIDENCE_NOTES[c]).filter(Boolean);
  if (product?.evidenceStrength === 'limited') notes.push('Limited evidence');
  return [...new Set(notes)];
}

/** "Not shown because you said this made things worse" for excluded products. */
export function exclusionLines(details) {
  const reasons = details?.excludedBecause || [];
  return reasons.map((raw) => {
    const text = String(raw || '').replace(/\.$/, '').trim();
    if (!text) return '';
    if (/^(you|a clinician)\b/i.test(text)) return `Not shown because ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
    return `Not shown: ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  }).filter(Boolean);
}

/** Which engine claim a badge or tag asserts (null when it asserts none). */
export function claimForBadge(text) {
  const t = String(text || '').toLowerCase();
  if (/pregnan/.test(t) && /safe|ok|friendly/.test(t)) return 'pregnancy_safe';
  if (/medication|drug interaction/.test(t) && /compatib|safe|ok/.test(t)) return 'medication_compatible';
  if (/fragrance|unscented/.test(t)) return 'fragrance_free';
  if (/latex/.test(t)) return 'latex_free';
  if (/hormone[- ]free|non[- ]hormonal/.test(t)) return 'hormones_free';
  const m = t.match(/([a-z]+)[- ]free\b/) || t.match(/avoid ([a-z]+)/);
  if (m) return `${m[1].replace(/s$/, '')}_free`;
  return null;
}

/** True when the engine says this claim cannot be made for her. */
export function isClaimBlocked(text, blockedClaims) {
  if (!Array.isArray(blockedClaims) || blockedClaims.length === 0) return false;
  const claim = claimForBadge(text);
  if (!claim) return false;
  return blockedClaims.some((b) => b === claim || b.replace(/s_free$/, '_free') === claim.replace(/s_free$/, '_free'));
}

/** Care notes to show as a banner (urgent first). */
export function careNotes(careFlags) {
  return (careFlags?.notes || []).map((n) => n.text).filter(Boolean);
}

/** Behavior object for the engine, from the maps the screens already hold. */
export function behaviorFrom({ saved, omitted, inEcosystem } = {}) {
  return { behavior: { saved: saved || {}, omitted: omitted || {}, inEcosystem: inEcosystem || {} } };
}
