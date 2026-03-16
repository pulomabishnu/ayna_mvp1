// ============================================================
// Ayna Reviews — User ratings and reviews (localStorage)
// ============================================================

const STORAGE_KEY = 'ayna_reviews';

function loadFromStorage() {
  try {
    const raw = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (_) {}
  return {};
}

function saveToStorage(data) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (_) {}
}

/**
 * Load all Ayna reviews from storage.
 * @returns {{ [productId: string]: { ratings: number[], reviews: { text: string, date?: string }[] } }}
 */
export function loadAynaReviews() {
  return loadFromStorage();
}

/**
 * Add a rating for a product. Returns the updated full reviews object.
 * @param {string} productId
 * @param {number} rating 1–5
 * @returns {{ [productId: string]: { ratings: number[], reviews: { text: string, date?: string }[] } }}
 */
export function addRating(productId, rating) {
  const data = loadFromStorage();
  const entry = data[productId] || { ratings: [], reviews: [] };
  const ratings = [...(entry.ratings || []), Math.min(5, Math.max(1, Number(rating)))];
  data[productId] = { ...entry, ratings };
  saveToStorage(data);
  return data;
}

/**
 * Add a review for a product. Returns the updated full reviews object.
 * @param {string} productId
 * @param {string} text
 * @returns {{ [productId: string]: { ratings: number[], reviews: { text: string, date?: string }[] } }}
 */
export function addReview(productId, text) {
  const data = loadFromStorage();
  const entry = data[productId] || { ratings: [], reviews: [] };
  const reviews = [...(entry.reviews || []), { text: String(text || '').trim(), date: new Date().toISOString() }];
  data[productId] = { ...entry, reviews };
  saveToStorage(data);
  return data;
}

/**
 * Get the Ayna-computed rating for a product, or null if no Ayna ratings.
 * Falls back to product.userRating when displaying; this function returns only Ayna-derived rating.
 * @param {object} product
 * @param {{ ratings?: number[], reviews?: object[] } | null | undefined} aynaData
 * @returns {number | null}
 */
export function getAynaRating(product, aynaData) {
  const ratings = aynaData?.ratings;
  if (!ratings || !Array.isArray(ratings) || ratings.length === 0) return null;
  const sum = ratings.reduce((a, b) => a + Number(b), 0);
  return sum / ratings.length;
}
