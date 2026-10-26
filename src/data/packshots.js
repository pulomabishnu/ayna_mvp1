// Catalog products whose card photo is NOT a packshot (a lifestyle shot, a
// model, a phone screen), measured Oct 26 2026: the photo each card shows
// (productImageOverrides cover, else the catalog image) whose border is not
// near-white on at least 60% of its edge pixels. Explore audit (Oct 25,
// issue 6): Featured shows packshots on plates first; these go after them
// until a real packshot is sourced. 53 products with a remote photo could
// not be measured offline and keep their place. Never edit a photo to fake
// a packshot; replace it with the brand's own.
export const NOT_PACKSHOT = new Set([
  'd-ovia', 'd-soonr',
  'p-tampontribe-organic-tampons', 'p-tampontribe-organic-pads', 'p-tampontribe-pantyliners-bulk-buy', 'p-tampontribe-teen-pads',
  'p-tampontribe-tampons-bulk-buy', 'p-tampontribe-pads-bulk-buy', 'p-tampontribe-menstrual-cup',
  'p-resa-rhythm-bracelet',
]);

/** Pre-order or waitlist: a deposit price or a pre-launch flag on the record. */
export function isPreorder(p) {
  return /deposit/i.test(String(p?.price || '')) || p?.prelaunch === true;
}

/**
 * Featured order (Explore audit issue 6): products she can buy now with a
 * packshot first, then ones whose photo is not a packshot, then pre-orders
 * and waitlists. A stable partition: the order inside each group (the
 * Featured rules, partners first in plain browsing) is kept. Never used for
 * a personal order or a text search.
 */
export function featuredOrder(list = []) {
  const now = []; const lifestyle = []; const later = [];
  for (const p of list) (isPreorder(p) ? later : NOT_PACKSHOT.has(p?.id) ? lifestyle : now).push(p);
  return [...now, ...lifestyle, ...later];
}
