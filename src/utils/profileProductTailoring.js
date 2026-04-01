import { getRecommendationExplanation } from '../data/products';

function shortFitLine(whyItWorks) {
  if (!whyItWorks) return null;
  const t = whyItWorks.replace(/^Why it could work:\s*/i, '').replace(/\s*Also aligned with signals from your imported health data \(not a diagnosis\)\.?\s*/i, ' ').trim();
  return t ? `**Fit:** ${t}` : null;
}

function shortConsideration(considerations) {
  if (!considerations) return null;
  return considerations.replace(/^Consideration:\s*/i, '**Heads-up:** ');
}

/**
 * Short, profile-aware copy for product modal (client-side). Kept brief for buying decisions.
 */
export function buildProfileTailoring(product, quizResults, healthProfile) {
  const { whyItWorks, considerations } = getRecommendationExplanation(product, quizResults, healthProfile);
  const parts = [];
  const fit = shortFitLine(whyItWorks);
  if (fit) parts.push(fit);
  const cons = shortConsideration(considerations);
  if (cons) parts.push(cons);

  const sens = quizResults?.sensitivities || [];
  const avoid = quizResults?.productsToAvoid || [];
  const mat = (product.safety?.materials || '').toLowerCase();
  const allerg = (product.safety?.allergens || '').toLowerCase();
  const combined = `${mat} ${allerg}`;

  if (sens.includes('Latex allergy') && /latex|natural rubber|\brubber\b/.test(combined)) {
    parts.push('**Heads-up:** You noted latex allergy—check the label for latex or rubber.');
  }
  if (
    (sens.includes('Fragrance sensitivity') || avoid.some((x) => /fragrance|scent|perfume/i.test(String(x)))) &&
    /fragrance|perfume|parfum|scent/.test(combined)
  ) {
    parts.push('**Heads-up:** You avoid fragrance—confirm this product is unscented if you need that.');
  }
  if (sens.includes('Synthetic materials') && /polyester|nylon|polyamide|synthetic|spandex|elastane/.test(mat)) {
    parts.push('**Heads-up:** You prefer fewer synthetics—check materials.');
  }

  return parts.length ? parts.join(' ') : null;
}
