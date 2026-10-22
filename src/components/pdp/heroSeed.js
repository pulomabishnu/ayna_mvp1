// What a product page shows above the fold, worked out at build time
// (scripts/prerender.mjs writes it into each product page as JSON). The site
// paints this hero (ProductHeroPreview) while the catalog and the product page
// code load, then ProductModal takes over with the same photo, name and price.
// Every value comes from the same helpers ProductModal uses, so the two match.
import { galleryImages, breadcrumbs } from './commerce.js';
import { buildGlance, categoryLabel, perUnitLabel } from './glance.js';
import { heroPriceView } from './heroPrice.js';
import { firstSentence } from './sentences.js';
import { attributeBadges, noDash } from './evidenceModel.js';
import { priceParts } from '../../data/passport/priceParts.js';
import { getAynaRating } from '../../data/aynaReviews.js';
import { getVariantSelection } from '../../utils/productVariantSelection.js';
import { productImageAlt } from '../../utils/seoMeta.js';
import { productHref } from '../../utils/productRoute.js';

export function buildHeroSeed(product) {
  if (!product?.id || !product?.name) return null;
  const choice = getVariantSelection(product, product.defaultVariantId || '');
  const displayName = String(choice.displayName || product.name || '').replace(/\s*—\s*/g, ', ');
  const variantImage = choice.variant ? (choice.image || '') : null;
  const images = variantImage != null ? (variantImage ? [variantImage] : []) : galleryImages(product);
  const aynaData = { ratings: [], reviews: [] };
  const glance = buildGlance(product, { details: null, aynaData, aynaRating: getAynaRating(product, aynaData) });
  const basePrice = priceParts(product);
  const price = choice.hasVariants && choice.variant?.priceLabel
    ? { known: true, main: choice.variant.priceLabel, sub: '', isPlaceholder: false }
    : basePrice;
  const perUnit = choice.hasVariants || /\b(bundle|kit|set|starter)\b/i.test(String(product.name || '')) ? '' : perUnitLabel(product);
  const brand = glance?.brand && glance.brand.toLowerCase() !== String(product.name).toLowerCase() ? glance.brand : '';
  const showBrand = brand && !String(displayName || '').toLowerCase().startsWith(String(brand).toLowerCase());
  return {
    path: productHref(product),
    id: product.id,
    name: displayName,
    brand: showBrand ? brand : '',
    // Brand · category tag above the name, as ProductModal shows it (main #73).
    tag: [brand || product.brand, categoryLabel(product)].filter(Boolean).join(' · '),
    image: images[0] || '',
    alt: productImageAlt({ ...product, name: displayName }, 0, images.length),
    thumbs: images.length > 1 ? images.map((src, i) => ({ src, alt: productImageAlt(product, i, images.length) })) : [],
    badges: attributeBadges(product, glance).map((b) => ({ id: b.id, label: b.label, note: b.note || '' })),
    lead: firstSentence(noDash(String(product.summary || '').replace(/\s*\(see [^()]+\)/i, '')), { min: 20, max: 420 }),
    price: heroPriceView(product, { price, perUnit, glance, brand }),
    crumbs: breadcrumbs(product).map((c) => ({ label: c.label, href: c.href || '', kind: c.kind })),
  };
}
