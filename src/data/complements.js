/**
 * "Goes with what you own" (founder, Nov 3: you have a Saalt Cup, ayna shows
 * the Saalt Steamer in your Daily Rundown: add it or not). Curated by hand,
 * one pair at a time, each from a page someone read. Never inferred, never a
 * health claim, never anything to do with partners, prices or commission.
 *
 *   for:        product ids she may own (any one is enough)
 *   product:    the product to suggest
 *   line:       what the brand says it's for (plain words, sourced)
 *   note:       an honest note, sourced, when the product is optional
 *
 * Read Nov 3 2026:
 * - saalt.com/products/saalt-steamer: "sanitize a menstrual cup or disc", "cup or
 *   disc sold separately", brand claim "as effective as boiling" (not repeated here).
 * - fda.gov menstrual cups: "washing with soap and water and placing them in
 *   boiling water for one to two minutes".
 */
export const COMPLEMENTS = [
  {
    for: ['p-saalt-cup', 'p-saalt-disc'],
    product: 'p-saalt-cup-steamer',
    line: 'Saalt makes it to clean their cup and disc with steam.',
    note: 'Optional. The FDA says soap, water and 1 to 2 minutes in boiling water clean a cup too.',
    sources: [
      { url: 'https://saalt.com/products/saalt-steamer', title: 'Saalt Steamer (brand page)' },
      { url: 'https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups', title: 'FDA: Menstrual cups' },
    ],
    verifiedAt: '2026-11-03',
  },
];
