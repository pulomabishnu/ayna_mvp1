/**
 * "Trending on ayna" weekly rotation (requested 2026-10-01).
 *
 * The lineup changes once a week, starting 2026-10-01, and shows one product
 * per care area — the same areas as the Browse filters (Period, Intimate Care,
 * Pelvic, Menopause, ...). Areas used to be raw categories, which let period
 * products fill most of the grid, since pads, tampons, cups, discs, period
 * underwear, cup steamers, and cramp relief are each their own category
 * (changed 2026-10-04). It's fully deterministic — every visitor sees the same
 * lineup on the same day, with no server state — by walking a fixed, shuffled
 * area order 8 slots at a time, wrapping around. Each time an area comes back
 * around it shows its next product, so an area that appears in back-to-back
 * weeks always shows a different product. Areas with fewer than two eligible
 * products sit out, since they'd show the same product every time.
 *
 * Adding products or categories to the catalog reshuffles future weeks; that's
 * fine — the guarantees above still hold for whatever the catalog is.
 */
import { CATEGORY_LABELS, MACRO_GROUPS } from '../data/products.js';
import { isPlaceholderProductImage } from './resolveProductImage.js';
import { hasFlaggedRecall } from './productSafetyAlert.js';

// Trending is focused on women's health right now, so beauty (skin and hair)
// products stay out of it — requested 2026-10-01. They're still on Browse.
const BEAUTY_CATEGORIES = new Set(['skin', 'skincare', 'body-care', 'hair', 'haircare']);

export function isBeautyProduct(product) {
  return BEAUTY_CATEGORIES.has(product?.category);
}

export const TRENDING_START = new Date(2026, 9, 1); // 2026-10-01, local time
export const TRENDING_SIZE = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const SHUFFLE_SEED = 20261001;

/** Weeks elapsed since TRENDING_START, by local calendar date (0 for any earlier date). */
export function trendingWeekIndex(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Math.round absorbs the hour lost/gained across a DST change.
  const days = Math.round((today - TRENDING_START) / (WEEK_MS / 7));
  return Math.max(0, Math.floor(days / 7));
}

/** The shopper-facing category name, so 'skin' and 'skincare' count as one category. */
export function trendingCategoryLabel(product) {
  const raw = product?.category || 'other';
  return String(CATEGORY_LABELS[raw] || raw).replace(/^[^\w]+\s*/, '');
}

/**
 * The care area a product belongs to: the first Browse filter group whose
 * categories include the product's category, or the category's own label for
 * categories no group covers (e.g. Supplements).
 */
export function trendingAreaLabel(product) {
  const group = MACRO_GROUPS.find((g) => g.id !== 'all' && g.categories.includes(product?.category));
  return group ? group.label : trendingCategoryLabel(product);
}

function isTrendingEligible(product) {
  return Boolean(
    product?.id
    && product?.name
    && !product.internal
    && !isBeautyProduct(product)
    && !product.requiresPrescription
    && (product.type || 'physical') === 'physical'
    && !isPlaceholderProductImage(product.image)
    && !hasFlaggedRecall(product.safety?.recalls),
  );
}

// Small seeded PRNG (mulberry32) so the shuffle is the same for everyone.
function seededRandom(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(items, seed) {
  const out = [...items];
  const rand = seededRandom(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * @returns {{ product: object, label: string }[]} this week's lineup — up to
 *   TRENDING_SIZE products, each from a different care area. `label` is the
 *   uppercase category eyebrow shown on the tile (e.g. PADS).
 */
export function getWeeklyTrendingLineup(products, now = new Date()) {
  const byArea = new Map();
  products.filter(isTrendingEligible).forEach((product) => {
    const area = trendingAreaLabel(product);
    if (!byArea.has(area)) byArea.set(area, []);
    byArea.get(area).push(product);
  });
  for (const [area, list] of byArea) if (list.length < 2) byArea.delete(area);

  const areas = seededShuffle([...byArea.keys()].sort(), SHUFFLE_SEED);
  const count = areas.length;
  if (!count) return [];
  const slots = Math.min(TRENDING_SIZE, count);
  const week = trendingWeekIndex(now);

  return Array.from({ length: slots }, (_, slot) => {
    const position = week * slots + slot;
    const area = areas[position % count];
    const pool = seededShuffle(
      byArea.get(area).sort((a, b) => String(a.id).localeCompare(String(b.id))),
      SHUFFLE_SEED + area.length,
    );
    const lap = Math.floor(position / count);
    const product = pool[lap % pool.length];
    return { product, label: trendingCategoryLabel(product).toUpperCase() };
  });
}

/**
 * Orders an already-filtered list for the returning-user Trending grid:
 * this week's lineup first, then everything else in a week-seeded order, so
 * the grid also changes weekly.
 */
export function orderByWeeklyTrending(list, lineup, now = new Date()) {
  const lineupRank = new Map(lineup.map(({ product }, i) => [product.id, i]));
  const rest = seededShuffle(
    list.filter((product) => !lineupRank.has(product.id)),
    SHUFFLE_SEED + trendingWeekIndex(now),
  );
  const first = list
    .filter((product) => lineupRank.has(product.id))
    .sort((a, b) => lineupRank.get(a.id) - lineupRank.get(b.id));
  return [...first, ...rest];
}

/**
 * First `limit` products from `list`, skipping any product already taken and
 * any group already taken. `groupOf` defaults to the shopper-facing category;
 * pass trendingAreaLabel for one product per care area.
 */
export function takeDistinctCategories(list, limit = TRENDING_SIZE, groupOf = trendingCategoryLabel) {
  const seenIds = new Set();
  const seenCategories = new Set();
  const out = [];
  for (const product of list) {
    if (out.length >= limit) break;
    const category = groupOf(product);
    if (seenIds.has(product.id) || seenCategories.has(category)) continue;
    seenIds.add(product.id);
    seenCategories.add(category);
    out.push(product);
  }
  return out;
}
