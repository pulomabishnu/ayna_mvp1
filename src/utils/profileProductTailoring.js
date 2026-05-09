import { getRecommendationExplanation } from '../data/products';
import { KNOWLEDGE_BY_CONDITION } from '../data/knowledge/menstrualHealthKnowledge.js';

function shortFitLine(whyItWorks) {
  if (!whyItWorks) return null;
  const t = whyItWorks.replace(/^Why it could work:\s*/i, '').replace(/\s*Also aligned with signals from your imported health data \(not a diagnosis\)\.?\s*/i, ' ').trim();
  return t ? `**Fit:** ${t}` : null;
}

function shortConsideration(considerations) {
  if (!considerations) return null;
  return considerations.replace(/^Consideration:\s*/i, '**Heads-up:** ');
}

// Ingredient safety flags derived from clinical knowledge base
function getIngredientSafetyFlags(product, conditions = [], sensitivities = [], productsToAvoid = []) {
  const flags = [];
  const mat = (product.safety?.materials || product.summary || '').toLowerCase();
  const allerg = (product.safety?.allergens || '').toLowerCase();
  const combined = `${mat} ${allerg} ${(product.tags || []).join(' ').toLowerCase()}`;
  const normalizedConditions = (conditions || []).map((c) => String(c));
  const hasPcos = normalizedConditions.some((c) => c.toLowerCase() === 'pcos');
  const hasEndo = normalizedConditions.some((c) => c.toLowerCase() === 'endometriosis');
  const hasKnowledgeForHormoneConditions = !!(KNOWLEDGE_BY_CONDITION.endometriosis || KNOWLEDGE_BY_CONDITION.PCOS);

  const isFragranceFree = /fragrance[\s-]free|unscented|no[\s-]fragrance|scent[\s-]free/i.test(combined);

  if (hasEndo) {
    if (!isFragranceFree && /\bfragrance\b|\bperfume\b|\bparfum\b|\bscent\b/.test(combined)) {
      flags.push('**⚠️ Endometriosis flag:** Contains synthetic fragrance - may act as an endocrine disruptor. Choose fragrance-free alternatives.');
    }
    if (/chlorine|bleach|conventional cotton/.test(combined)) {
      flags.push('**⚠️ Endometriosis flag:** May contain dioxin residues from chlorine bleaching. Consider organic alternatives.');
    }
    if (/bpa|bisphenol/.test(combined)) {
      flags.push('**⚠️ Endometriosis flag:** Contains BPA - an endocrine disruptor. Choose BPA-free options.');
    }
  }

  if (hasPcos) {
    if ((!isFragranceFree && /\bfragrance\b|\bperfume\b|\bparfum\b/.test(combined)) || /\bparaben\b|\bphthalate\b/.test(combined)) {
      flags.push('**⚠️ PCOS flag:** Contains potential endocrine disruptors (fragrance/parabens). Minimize EDC exposure with PCOS.');
    }
  }

  if (product.type !== 'digital' && /vitamin a|retinol|retinyl/i.test(combined)) {
    flags.push('**⚠️ TTC/Pregnancy flag:** High-dose vitamin A (retinol) is teratogenic. Consult your clinician if trying to conceive.');
  }

  if ((sensitivities || []).includes('Latex allergy') && /latex|natural rubber|\brubber\b/.test(combined)) {
    flags.push('**⚠️ Allergy flag:** You noted latex allergy - this product may contain latex or rubber. Check label carefully.');
  }

  if (
    ((sensitivities || []).includes('Fragrance sensitivity') || (productsToAvoid || []).some((x) => /fragrance|scent|perfume/i.test(String(x)))) &&
    /fragrance|perfume|parfum|scent/.test(combined)
  ) {
    flags.push('**⚠️ Sensitivity flag:** You avoid fragrance - confirm this product is fragrance-free before purchasing.');
  }

  if (normalizedConditions.some((c) => /vaginismus|vulvodynia|interstitial cystitis/i.test(c)) && /glycerin|glycerol/.test(combined)) {
    flags.push('**⚠️ Sensitivity flag:** Contains glycerin - may trigger irritation for vulvodynia or yeast-prone users.');
  }

  if (!hasKnowledgeForHormoneConditions) return flags;

  return flags;
}

export function buildProfileTailoring(product, quizResults, healthProfile) {
  const { whyItWorks, considerations } = getRecommendationExplanation(product, quizResults, healthProfile);
  const parts = [];
  const fit = shortFitLine(whyItWorks);
  if (fit) parts.push(fit);
  const cons = shortConsideration(considerations);
  if (cons) parts.push(cons);

  const conditions = [
    ...(quizResults?.fullHealthIntake?.conditions || []),
    ...(healthProfile?.conditions || []),
  ].filter(Boolean);
  const sens = quizResults?.sensitivities || [];
  const avoid = quizResults?.productsToAvoid || [];
  const safetyFlags = getIngredientSafetyFlags(product, conditions, sens, avoid);
  parts.push(...safetyFlags);

  return parts.length ? parts.join('\n') : null;
}

export { getIngredientSafetyFlags };
