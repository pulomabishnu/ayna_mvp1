/**
 * Ayna user ratings and anonymous reviews.
 * Stored in localStorage. Used to compute product ratings and display community reviews.
 */

const STORAGE_KEY = 'ayna_product_reviews';

/** @returns {{ [productId: string]: { ratings: number[], reviews: { text: string, date: string }[] } }} */
export function loadAynaReviews() {
  try {
    const raw = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const out = {};
    for (const [id, data] of Object.entries(parsed)) {
      if (!data || typeof data !== 'object') continue;
      const ratings = Array.isArray(data.ratings) ? data.ratings.filter(r => typeof r === 'number' && r >= 1 && r <= 5) : [];
      const reviews = Array.isArray(data.reviews)
        ? data.reviews.filter(r => r && typeof r.text === 'string' && r.text.trim())
        : [];
      out[id] = { ratings, reviews };
    }
    return out;
  } catch (_) {
    return {};
  }
}

/** Persist reviews to localStorage */
export function saveAynaReviews(data) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (_) {}
}

/** Add a rating for a product (1–5). Caller should merge with existing data. */
export function addRating(productId, rating) {
  const data = loadAynaReviews();
  const entry = data[productId] || { ratings: [], reviews: [] };
  entry.ratings = [...(entry.ratings || []), Math.min(5, Math.max(1, Math.round(rating)))];
  data[productId] = entry;
  saveAynaReviews(data);
  return data;
}

/** Add an anonymous review. */
export function addReview(productId, text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return loadAynaReviews();
  const data = loadAynaReviews();
  const entry = data[productId] || { ratings: [], reviews: [] };
  entry.reviews = [...(entry.reviews || []), { text: trimmed, date: new Date().toISOString() }];
  data[productId] = entry;
  saveAynaReviews(data);
  return data;
}

/**
 * Compute Ayna rating for a product.
 * Combines base userRating (from product data) with Ayna user ratings.
 * @param {object} product - Product with optional userRating
 * @param {{ ratings: number[] }} aynaData - Ayna user ratings for this product
 * @returns {number} 0–5 rating
 */
export function getAynaRating(product, aynaData) {
  const base = product?.userRating != null ? Number(product.userRating) : null;
  const aynaRatings = aynaData?.ratings || [];
  if (aynaRatings.length === 0) return base != null ? base : null;
  const aynaAvg = aynaRatings.reduce((a, b) => a + b, 0) / aynaRatings.length;
  if (base == null) return Math.round(aynaAvg * 10) / 10;
  // Weight: 70% Ayna users, 30% base (external) when we have Ayna data
  const combined = aynaAvg * 0.7 + base * 0.3;
  return Math.round(combined * 10) / 10;
}
