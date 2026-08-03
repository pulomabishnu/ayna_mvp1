/**
 * Brand + device-kind hints so searches and copy can target a specific brand within a crowded category
 * (e.g. multiple menstrual cup or tracker brands).
 */

/** Categories where shoppers commonly compare brands of the same device type. */
const MULTI_BRAND_CATEGORIES = new Set([
  'pad',
  'tampon',
  'cup',
  'disc',
  'period-underwear',
  'tracker',
  'supplement',
  'intimate-care',
  'cramp-relief',
  'pelvic-floor',
  'menopause',
  'fitness',
  'mental-health',
  'digital',
  'telehealth',
  'vaginal-health',
]);

const DEVICE_KIND_LABEL = {
  pad: 'menstrual pads',
  tampon: 'tampons',
  cup: 'menstrual cups',
  disc: 'menstrual discs',
  'period-underwear': 'period underwear',
  tracker: 'cycle or health trackers',
  supplement: 'supplements',
  'intimate-care': 'intimate care products',
  'cramp-relief': 'cramp relief devices',
  'pelvic-floor': 'pelvic floor devices',
  menopause: 'menopause products',
  fitness: 'fitness and cycle-synced apps',
  'mental-health': 'mental health apps',
  digital: 'health apps',
  telehealth: 'telehealth services',
  'vaginal-health': 'vaginal health products',
};

/**
 * @param {object} product
 * @returns {{ brandName: string | null, deviceKindLabel: string | null, emphasizeBrandInSearches: boolean }}
 */
export function deriveBrandSearchContext(product) {
  if (!product || typeof product !== 'object') {
    return { brandName: null, deviceKindLabel: null, emphasizeBrandInSearches: false };
  }

  const category = product.category || '';
  const emphasize =
    MULTI_BRAND_CATEGORIES.has(category) ||
    product.emphasizeBrandComparison === true ||
    (typeof product.brand === 'string' && product.brand.trim().length > 0);

  // Only ever use an EXPLICIT brand.
  //
  // This used to fall back to the first two words of the product name whenever
  // `brand` was absent — which is the common path, since only a handful of
  // catalog entries set it. "Organic Cotton Tampons" produced the brand
  // "Organic Cotton", which was then injected into the prompt as
  // "Brand to surface in searches and narrative: Organic Cotton" and rendered
  // to users as "Reddit search: Organic Cotton tampons".
  //
  // A wrong brand is worse than no brand: it sends the reader to results for a
  // company that does not exist. With no brand we simply fall back to
  // category-level searches, which are correct if less specific.
  const brandName =
    typeof product.brand === 'string' && product.brand.trim()
      ? product.brand.trim().slice(0, 56)
      : '';

  const deviceKindLabel = DEVICE_KIND_LABEL[category] || category.replace(/-/g, ' ') || 'this product type';

  return {
    brandName: brandName || null,
    deviceKindLabel,
    emphasizeBrandInSearches: emphasize && !!brandName,
  };
}
