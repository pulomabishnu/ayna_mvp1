// ============================================================
// o.b. tampon catalog entries added from verified Amazon affiliate links.
// These are regular catalog products, NOT brand partnerships.
// Official product information is grounded in o.b.'s own US/Germany sites.
// ============================================================

const ORIGINAL_US_MATERIALS =
  'Rayon and/or cotton fiber, polyester, polyethylene, titanium dioxide, PEG-100 stearate, fatty acid polyglycol ester, and string; see current package for the complete formulation.';

const ULTRA_MULTIPACK_MATERIALS =
  'Rayon and/or cotton fiber, polyester, polyethylene, titanium dioxide, fatty acid polyglycol ester, plant-derived oil, and string; see current package for the complete formulation.';

const PROCOMFORT_MATERIALS =
  '100% plant-based tampon core made from viscose fibers; fragrance-free and not chlorine-bleached, per o.b. Germany. See current package for the complete formulation.';

const TAMPON_SAFETY =
  'Use the lowest absorbency needed for your flow, change every 4–8 hours, and never wear longer than 8 hours. Tampon use carries a rare but serious risk of toxic shock syndrome (TSS); follow package warnings and seek urgent medical care for possible TSS symptoms.';

function originalSafety(materials) {
  return {
    fdaStatus: 'Menstrual tampon sold for consumer use; follow the package directions and TSS warning.',
    materials,
    recalls: 'No product-specific recall is listed here; check current FDA/brand recall information before relying on this field.',
    sideEffects: TAMPON_SAFETY,
    opinionAlerts: 'Leak-protection and comfort claims are the manufacturer’s own product claims and are not independent clinical-outcome evidence.',
  };
}

function originalEntry({ id, name, affiliateUrl, url, tags = [], materials = ORIGINAL_US_MATERIALS }) {
  return {
    id,
    name,
    brand: 'o.b.',
    category: 'tampon',
    type: 'physical',
    internal: false,
    healthFunctions: ['menstrual-collection'],
    tags: ['comfort', 'sustainability', ...tags],
    price: 'See Amazon',
    whereToBuy: ['Amazon', 'o.b.'],
    whereToBuyLinks: {
      Amazon: affiliateUrl,
      'o.b.': url,
    },
    url,
    affiliateUrl,
    summary:
      'Applicator-free, fragrance-free o.b. tampon with a rounded tip, all-around expansion, and FLUID-LOCK grooves designed for leak protection. The compact non-applicator format reduces applicator waste.',
    safety: originalSafety(materials),
    clinicianOpinionSource: 'brand',
    clinicianAttribution: 'Product features and usage guidance are sourced from o.b.’s official product information, not an independent clinician endorsement.',
    doctorOpinion:
      'Choose the lowest absorbency that controls your flow and follow the package’s TSS and wear-time instructions. Comfort and leak-protection claims are product-design claims, not proof that one tampon is medically superior for every user.',
    effectiveness:
      'o.b. states that its all-around expansion and FLUID-LOCK grooves are designed to provide a custom fit and reliable leak protection; no independent clinical study of this specific retail SKU is cited here.',
    integrations: [],
    badges: [],
    isEmergingBrand: false,
  };
}

export const OB_PRODUCTS = [
  originalEntry({
    id: 'p-ob-original-multipack-40',
    name: 'o.b. Original Tampons Multi-Pack, 40ct',
    affiliateUrl: 'https://amzn.to/4yrMjNU',
    url: 'https://www.ob-tampons.com/products/ob-tampons-multipack-r-s-s-plus',
    materials: ULTRA_MULTIPACK_MATERIALS,
  }),
  originalEntry({
    id: 'p-ob-original-ultra-40',
    name: 'o.b. Original Tampons Ultra, 40ct',
    affiliateUrl: 'https://amzn.to/4AagB9s',
    url: 'https://www.ob-tampons.com/products/ob-tampons-ultra',
    tags: ['heavy-flow'],
    materials: ULTRA_MULTIPACK_MATERIALS,
  }),
  originalEntry({
    id: 'p-ob-original-regular-40',
    name: 'o.b. Original Tampons Regular, 40ct',
    affiliateUrl: 'https://amzn.to/3TrDwwz',
    url: 'https://www.ob-tampons.com/products/ob-tampons-regular',
  }),
  originalEntry({
    id: 'p-ob-original-super-plus-40',
    name: 'o.b. Original Tampons Super Plus, 40ct',
    affiliateUrl: 'https://amzn.to/4y2lf80',
    url: 'https://www.ob-tampons.com/products/ob-tampons-super-plus',
    tags: ['heavy-flow'],
  }),
  originalEntry({
    id: 'p-ob-original-super-40',
    name: 'o.b. Original Tampons Super, 40ct',
    affiliateUrl: 'https://amzn.to/4xowJBR',
    url: 'https://www.ob-tampons.com/products/ob-tampons-super',
  }),
  originalEntry({
    id: 'p-ob-original-multipack-80',
    name: 'o.b. Original Tampons Multi-Pack, 40ct (Pack of 2)',
    affiliateUrl: 'https://amzn.to/46fTw7Q',
    url: 'https://www.ob-tampons.com/products/ob-tampons-multipack-r-s-s-plus',
    materials: ULTRA_MULTIPACK_MATERIALS,
  }),
  {
    id: 'p-ob-procomfort-mini-32',
    name: 'o.b. ProComfort Mini Tampons, 32ct',
    brand: 'o.b.',
    category: 'tampon',
    type: 'physical',
    internal: false,
    healthFunctions: ['menstrual-collection'],
    tags: ['comfort'],
    price: 'See Amazon',
    whereToBuy: ['Amazon', 'o.b. Germany'],
    whereToBuyLinks: {
      Amazon: 'https://amzn.to/4ipoYrB',
      'o.b. Germany': 'https://www.ob.de/produkte/ob-procomfort/procomfort-mini',
    },
    url: 'https://www.ob.de/produkte/ob-procomfort/procomfort-mini',
    affiliateUrl: 'https://amzn.to/4ipoYrB',
    summary:
      'Mini non-applicator tampon for lighter-flow days. o.b. ProComfort uses a SilkTouch surface, Dynamic Fit design, and interlocking grooves intended to make insertion/removal easier and provide leak protection.',
    safety: {
      fdaStatus: 'Menstrual tampon sold for consumer use; follow the package directions and TSS warning.',
      materials: PROCOMFORT_MATERIALS,
      recalls: 'No product-specific recall is listed here; check current regulator/brand recall information before relying on this field.',
      sideEffects: TAMPON_SAFETY,
      opinionAlerts: 'Comfort and leak-protection claims are sourced from o.b.’s own ProComfort product information.',
    },
    clinicianOpinionSource: 'brand',
    clinicianAttribution: 'Sourced from o.b. Germany’s official ProComfort Mini product information, not an independent clinician endorsement.',
    doctorOpinion:
      'A lower-absorbency mini tampon can be appropriate for lighter flow when it is the minimum absorbency needed. Follow package wear-time and TSS guidance.',
    effectiveness:
      'The brand positions SilkTouch, Dynamic Fit, and interlocking grooves as comfort and leak-protection features; no independent clinical trial of this specific retail SKU is cited here.',
    integrations: [],
    badges: [],
    isEmergingBrand: false,
  },
  {
    id: 'p-ob-procomfort-mini-16',
    name: 'o.b. ProComfort Mini Tampons, 16ct',
    brand: 'o.b.',
    category: 'tampon',
    type: 'physical',
    internal: false,
    healthFunctions: ['menstrual-collection'],
    tags: ['comfort'],
    price: 'See Amazon',
    whereToBuy: ['Amazon', 'o.b. Germany'],
    whereToBuyLinks: {
      Amazon: 'https://amzn.to/4gNI49B',
      'o.b. Germany': 'https://www.ob.de/produkte/ob-procomfort/procomfort-mini',
    },
    url: 'https://www.ob.de/produkte/ob-procomfort/procomfort-mini',
    affiliateUrl: 'https://amzn.to/4gNI49B',
    summary:
      'Mini non-applicator tampon for lighter-flow days. o.b. ProComfort uses a SilkTouch surface, Dynamic Fit design, and interlocking grooves intended to make insertion/removal easier and provide leak protection.',
    safety: {
      fdaStatus: 'Menstrual tampon sold for consumer use; follow the package directions and TSS warning.',
      materials: PROCOMFORT_MATERIALS,
      recalls: 'No product-specific recall is listed here; check current regulator/brand recall information before relying on this field.',
      sideEffects: TAMPON_SAFETY,
      opinionAlerts: 'Comfort and leak-protection claims are sourced from o.b.’s own ProComfort product information.',
    },
    clinicianOpinionSource: 'brand',
    clinicianAttribution: 'Sourced from o.b. Germany’s official ProComfort Mini product information, not an independent clinician endorsement.',
    doctorOpinion:
      'A lower-absorbency mini tampon can be appropriate for lighter flow when it is the minimum absorbency needed. Follow package wear-time and TSS guidance.',
    effectiveness:
      'The brand positions SilkTouch, Dynamic Fit, and interlocking grooves as comfort and leak-protection features; no independent clinical trial of this specific retail SKU is cited here.',
    integrations: [],
    badges: [],
    isEmergingBrand: false,
  },
];
