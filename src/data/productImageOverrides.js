// Studio-style product photos (Amazon main-image standard): the item itself on
// pure white, no people, props, text overlays or watermarks, square, centered.
// Each file in public/products/catalog/<id>.webp was either
//   - cleaned: the catalog's own photo with its light studio backdrop removed
//     to pure white and re-framed (square 640px, ~8% padding), or
//   - replaced: the catalog photo showed a person, a lifestyle scene, a
//     banner/promo text or the wrong item, so it was swapped for the brand's
//     own packshot (brand store) or the Amazon main image of the same product.
// Provenance (source URL + previous URL per id): scripts/images/sources.json.
// Regenerate the audit sheet with scripts/images/contact-sheet.py.
//
// Keyed by catalog product id. Only physical products; digital products keep
// their brand imagery.
export const PRODUCT_IMAGE_OVERRIDES = Object.freeze({
  'p-aisle-underwear': '/products/catalog/p-aisle-underwear.webp',
  'p-always-liners': '/products/catalog/p-always-liners.webp',
  'p-boric-acid': '/products/catalog/p-boric-acid.webp',
  'p-buni-bundle': '/products/catalog/p-buni-bundle.webp',
  'p-buni-rejuvenate-vulva-balm': '/products/catalog/p-buni-rejuvenate-vulva-balm.webp',
  'p-buni-soothe-nipple-lip-balm': '/products/catalog/p-buni-soothe-nipple-lip-balm.webp',
  'p-cora-disc': '/products/catalog/p-cora-disc.webp',
  'p-cora-organic-pads': '/products/catalog/p-cora-organic-pads.webp',
  'p-cora-organic-tampons': '/products/catalog/p-cora-organic-tampons.webp',
  'p-cora-overnight': '/products/catalog/p-cora-overnight.webp',
  'p-creatine-womens': '/products/catalog/p-creatine-womens.webp',
  'p-cystex': '/products/catalog/p-cystex.webp',
  'p-dear-kate-underwear': '/products/catalog/p-dear-kate-underwear.webp',
  'p-diva-cup': '/products/catalog/p-diva-cup.webp',
  'p-elvie-trainer': '/products/catalog/p-elvie-trainer.webp',
  'p-estroven-mood': '/products/catalog/p-estroven-mood.webp',
  'p-flex-cup': '/products/catalog/p-flex-cup.webp',
  'p-flex-disc': '/products/catalog/p-flex-disc.webp',
  'p-hatch-oil': '/products/catalog/p-hatch-oil.webp',
  'p-honeypot-wash': '/products/catalog/p-honeypot-wash.webp',
  'p-intimina-lily': '/products/catalog/p-intimina-lily.webp',
  'p-kindra-lotion': '/products/catalog/p-kindra-lotion.webp',
  'p-knix-underwear': '/products/catalog/p-knix-underwear.webp',
  'p-kotex-security': '/products/catalog/p-kotex-security.webp',
  'p-lena-cup': '/products/catalog/p-lena-cup.webp',
  'p-lim-method-kneeling-pad': '/products/catalog/p-lim-method-kneeling-pad.webp',
  'p-lim-method-shoe-covers': '/products/catalog/p-lim-method-shoe-covers.webp',
  'p-livlabs-pippa-fit-kit': '/products/catalog/p-livlabs-pippa-fit-kit.webp',
  'p-livlabs-pippa-starter-kit': '/products/catalog/p-livlabs-pippa-starter-kit.webp',
  'p-love-wellness-bloat': '/products/catalog/p-love-wellness-bloat.webp',
  'p-lumma-disc': '/products/catalog/p-lumma-disc.webp',
  'p-lunette-cup': '/products/catalog/p-lunette-cup.webp',
  'p-maude-vibe': '/products/catalog/p-maude-vibe.webp',
  'p-mypelvicbra-classic-plus': '/products/catalog/p-mypelvicbra-classic-plus.webp',
  'p-mypelvicbra-waistband-extenders': '/products/catalog/p-mypelvicbra-waistband-extenders.webp',
  'p-mystery-vibe': '/products/catalog/p-mystery-vibe.webp',
  'p-neycher-botanical-vulva-balm': '/products/catalog/p-neycher-botanical-vulva-balm.webp',
  'p-neycher-goodbye-dryness-bundle': '/products/catalog/p-neycher-goodbye-dryness-bundle.webp',
  'p-neycher-hydrobloom-gel': '/products/catalog/p-neycher-hydrobloom-gel.webp',
  'p-neycher-odor-be-gone': '/products/catalog/p-neycher-odor-be-gone.webp',
  'p-neycher-vaginal-moisturizer': '/products/catalog/p-neycher-vaginal-moisturizer.webp',
  'p-nixit': '/products/catalog/p-nixit.webp',
  'p-oboo-boom': '/products/catalog/p-oboo-boom.webp',
  'p-oboo-cool-spray': '/products/catalog/p-oboo-cool-spray.webp',
  'p-oboo-groove': '/products/catalog/p-oboo-groove.webp',
  'p-oboo-loob-arousal': '/products/catalog/p-oboo-loob-arousal.webp',
  'p-oboo-loob-daily': '/products/catalog/p-oboo-loob-daily.webp',
  'p-oboo-mood-drops': '/products/catalog/p-oboo-mood-drops.webp',
  'p-oboo-moon': '/products/catalog/p-oboo-moon.webp',
  'p-oboo-nook': '/products/catalog/p-oboo-nook.webp',
  'p-oboo-oooh': '/products/catalog/p-oboo-oooh.webp',
  'p-oboo-shoop': '/products/catalog/p-oboo-shoop.webp',
  'p-oboo-smooch': '/products/catalog/p-oboo-smooch.webp',
  'p-oboo-smooth-arousal': '/products/catalog/p-oboo-smooth-arousal.webp',
  'p-oboo-smooth-daily': '/products/catalog/p-oboo-smooth-daily.webp',
  'p-oboo-woo': '/products/catalog/p-oboo-woo.webp',
  'p-oboo-woosh-warming-wand': '/products/catalog/p-oboo-woosh-warming-wand.webp',
  'p-organicup': '/products/catalog/p-organicup.webp',
  'p-pelvic-wand': '/products/catalog/p-pelvic-wand.webp',
  'p-period-co-underwear': '/products/catalog/p-period-co-underwear.webp',
  'p-probiotics-women': '/products/catalog/p-probiotics-women.webp',
  'p-rael-organic-pad': '/products/catalog/p-rael-organic-pad.webp',
  'p-remifemin': '/products/catalog/p-remifemin.webp',
  'p-ruby-cup': '/products/catalog/p-ruby-cup.webp',
  'p-saalt-cup': '/products/catalog/p-saalt-cup.webp',
  'p-silverette-cups': '/products/catalog/p-silverette-cups.webp',
  'p-snoogle-pillow': '/products/catalog/p-snoogle-pillow.webp',
  'p-softdisc': '/products/catalog/p-softdisc.webp',
  'p-sootheher-elaris-pod': '/products/catalog/p-sootheher-elaris-pod.webp',
  'p-sootheher-gel-pad-refills': '/products/catalog/p-sootheher-gel-pad-refills.webp',
  'p-tampax-pure': '/products/catalog/p-tampax-pure.webp',
  'p-tampax-radiant': '/products/catalog/p-tampax-radiant.webp',
  'p-thermacare': '/products/catalog/p-thermacare.webp',
  'p-u-kotex-pad': '/products/catalog/p-u-kotex-pad.webp',
  'p-uqora-control': '/products/catalog/p-uqora-control.webp',
  'p-vio2-mouth-tape': '/products/catalog/p-vio2-mouth-tape.webp',
  'p-wuka-underwear': '/products/catalog/p-wuka-underwear.webp',
});

/** The cleaned studio photo for a catalog product id, or '' when none. */
export function productImageOverride(productOrId) {
  const id = typeof productOrId === 'string' ? productOrId : productOrId?.id;
  if (!id) return '';
  return PRODUCT_IMAGE_OVERRIDES[id] || '';
}

/** Returns the product with its image swapped for the studio photo, if any. */
export function withImageOverride(product) {
  const src = productImageOverride(product);
  return src && product ? { ...product, image: src } : product;
}
