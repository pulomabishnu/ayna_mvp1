// ============================================================
// Ayna Reviews — User ratings and reviews
// Supabase is durable; browser fallback is active-tab only.
// ============================================================

const STORAGE_KEY = 'ayna_reviews';

function loadFromStorage() {
  try {
    if (typeof window === 'undefined') return {};
    const sessionRaw = window.sessionStorage.getItem(STORAGE_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      if (parsed && typeof parsed === 'object') return parsed;
    }

    // One-time migration from older builds that persisted free-text reviews in
    // localStorage. Preserve the data for this tab, then remove the persistent copy.
    const legacyRaw = window.localStorage.getItem(STORAGE_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      if (parsed && typeof parsed === 'object') {
        try { window.sessionStorage.setItem(STORAGE_KEY, legacyRaw); } catch (_) {}
        try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
        return parsed;
      }
    }
  } catch (_) {}
  return {};
}

function saveToStorage(data) {
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    }
  } catch (_) {}
}

/**
 * Load all Ayna reviews from the active-tab cache.
 * @returns {{ [productId: string]: { ratings: number[], reviews: { text: string, date?: string }[] } }}
 */
export function loadAynaReviews() {
  return loadFromStorage();
}

/**
 * Replace the session cache with the server's copy after a Supabase load.
 *
 * addRating/addReview mutate the cached object and the caller upserts the whole
 * object as the user's row. Hydrating first prevents a second device from
 * overwriting older reviews with only the newest rating/review.
 */
export function hydrateAynaReviews(serverReviews) {
  if (!serverReviews || typeof serverReviews !== 'object') return loadFromStorage();
  saveToStorage(serverReviews);
  return serverReviews;
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
