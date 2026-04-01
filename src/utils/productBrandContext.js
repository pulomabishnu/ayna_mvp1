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

  let brandName = '';
  if (typeof product.brand === 'string' && product.brand.trim()) {
    brandName = product.brand.trim();
  } else {
    const rawName = (product.name || '').trim();
    const beforeParen = rawName.split(/\(|–|—/)[0].trim();
    const words = beforeParen.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      brandName = '';
    } else if (words.length === 1) {
      brandName = words[0];
    } else {
      brandName = `${words[0]} ${words[1]}`.slice(0, 56);
    }
  }

  const deviceKindLabel = DEVICE_KIND_LABEL[category] || category.replace(/-/g, ' ') || 'this product type';

  return {
    brandName: brandName || null,
    deviceKindLabel,
    emphasizeBrandInSearches: emphasize && !!brandName,
  };
}
