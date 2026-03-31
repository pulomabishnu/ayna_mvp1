import { getRecommendationExplanation } from '../data/products';

/**
 * Short, profile-aware copy for product modal summaries (client-side; not from LLM).
 */
export function buildProfileTailoring(product, quizResults, healthProfile) {
  const { whyItWorks, considerations } = getRecommendationExplanation(product, quizResults, healthProfile);
  const parts = [];
  if (whyItWorks) parts.push(whyItWorks);
  if (considerations) parts.push(considerations);

  const sens = quizResults?.sensitivities || [];
  const avoid = quizResults?.productsToAvoid || [];
  const mat = (product.safety?.materials || '').toLowerCase();
  const allerg = (product.safety?.allergens || '').toLowerCase();
  const combined = `${mat} ${allerg}`;

  if (sens.includes('Latex allergy') && /latex|natural rubber|\brubber\b/.test(combined)) {
    parts.push(
      '**Sensitivity:** Your profile lists latex allergy—confirm whether this product contains latex or natural rubber before use.'
    );
  }
  if (
    (sens.includes('Fragrance sensitivity') || avoid.some((x) => /fragrance|scent|perfume/i.test(String(x)))) &&
    /fragrance|perfume|parfum|scent/.test(combined)
  ) {
    parts.push(
      '**Sensitivity:** Your profile avoids fragrance; check that this option is unscented or fragrance-free if you need that.'
    );
  }
  if (sens.includes('Synthetic materials') && /polyester|nylon|polyamide|synthetic|spandex|elastane/.test(mat)) {
    parts.push(
      '**Preference:** You prefer to limit synthetics—review materials and consider alternatives if needed.'
    );
  }

  return parts.length ? parts.join(' ') : null;
}
