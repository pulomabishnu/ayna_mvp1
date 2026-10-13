// Studio-style product photos (Amazon main-image standard): the item itself on
// pure white, no people, props, text overlays or watermarks, square, centered.
// Each file in public/products/catalog/<id>.webp is the brand packshot, the
// Amazon / Target / Walmart main image, or the catalog's own photo, normalized
// (background flood-filled or masked to pure white, trimmed, ~8% padding,
// 640px square, WebP <= 150KB). Provenance per id: scripts/images/sources.json.
// Regenerate the audit sheet with scripts/images/contact-sheet.py; the browser
// helper that fetched and normalized the photos is scripts/images/browser-lib.js.
//
// Keyed by catalog product id. Only physical products; digital products keep
// their brand imagery. An entry is either the cover path (string) or
// { cover, gallery: [...] } where the gallery holds up to 4 extra clean shots
// (other angles, contents, label / ingredients panel). The cover is always the
// box or the product itself; it is what product cards show.
export const PRODUCT_IMAGE_OVERRIDES = Object.freeze({
  'p-aisle-underwear': '/products/catalog/p-aisle-underwear.webp',
  'p-always-discreet-boutique-liners': '/products/catalog/p-always-discreet-boutique-liners.webp',
  'p-always-infinity': '/products/catalog/p-always-infinity.webp',
  'p-always-liners': '/products/catalog/p-always-liners.webp',
  'p-azo-test': '/products/catalog/p-azo-test.webp',
  'p-b-complex': '/products/catalog/p-b-complex.webp',
  'p-bambody-underwear': {
    cover: '/products/catalog/p-bambody-underwear.webp',
    gallery: [
      '/products/catalog/p-bambody-underwear-2.webp',
    ],
  },
  'p-belly-bandit': '/products/catalog/p-belly-bandit.webp',
  'p-bodily-kit': '/products/catalog/p-bodily-kit.webp',
  'p-bodyform-pad': '/products/catalog/p-bodyform-pad.webp',
  'p-boppy-pillow': '/products/catalog/p-boppy-pillow.webp',
  'p-boric-acid': '/products/catalog/p-boric-acid.webp',
  'p-buni-bundle': '/products/catalog/p-buni-bundle.webp',
  'p-buni-rejuvenate-vulva-balm': '/products/catalog/p-buni-rejuvenate-vulva-balm.webp',
  'p-buni-soothe-nipple-lip-balm': '/products/catalog/p-buni-soothe-nipple-lip-balm.webp',
  'p-buni-transform-scar-body-oil': '/products/catalog/p-buni-transform-scar-body-oil.webp',
  'p-carefree-liners': '/products/catalog/p-carefree-liners.webp',
  'p-citracal-bone-health': {
    cover: '/products/catalog/p-citracal-bone-health.webp',
    gallery: [
      '/products/catalog/p-citracal-bone-health-2.webp',
      '/products/catalog/p-citracal-bone-health-3.webp',
    ],
  },
  'p-cora-disc': '/products/catalog/p-cora-disc.webp',
  'p-cora-organic-pads': '/products/catalog/p-cora-organic-pads.webp',
  'p-cora-organic-tampons': '/products/catalog/p-cora-organic-tampons.webp',
  'p-cora-overnight': '/products/catalog/p-cora-overnight.webp',
  'p-cranberry-supplement': '/products/catalog/p-cranberry-supplement.webp',
  'p-creatine-womens': '/products/catalog/p-creatine-womens.webp',
  'p-cystex': {
    cover: '/products/catalog/p-cystex.webp',
    gallery: [
      '/products/catalog/p-cystex-2.webp',
    ],
  },
  'p-d-mannose-now': '/products/catalog/p-d-mannose-now.webp',
  'p-dame-arc': '/products/catalog/p-dame-arc.webp',
  'p-dear-kate-underwear': '/products/catalog/p-dear-kate-underwear.webp',
  'p-depend-silhouette-underwear': '/products/catalog/p-depend-silhouette-underwear.webp',
  'p-diva-cup': '/products/catalog/p-diva-cup.webp',
  'p-elitone': '/products/catalog/p-elitone.webp',
  'p-elitone-urge': '/products/catalog/p-elitone-urge.webp',
  'p-elvie-trainer': '/products/catalog/p-elvie-trainer.webp',
  'p-estroven-mood': '/products/catalog/p-estroven-mood.webp',
  'p-evening-primrose': '/products/catalog/p-evening-primrose.webp',
  'p-femmycycle': '/products/catalog/p-femmycycle.webp',
  'p-fish-oil': '/products/catalog/p-fish-oil.webp',
  'p-flex-cup': '/products/catalog/p-flex-cup.webp',
  'p-flex-disc': '/products/catalog/p-flex-disc.webp',
  'p-flo-gummies': '/products/catalog/p-flo-gummies.webp',
  'p-frida-mom-kit': '/products/catalog/p-frida-mom-kit.webp',
  'p-gina-insertion-applicator-refills': {
    cover: '/products/catalog/p-gina-insertion-applicator-refills.webp',
    gallery: [
      '/products/catalog/p-gina-insertion-applicator-refills-2.webp',
    ],
  },
  'p-gina-vaginal-moisturizing-glides': {
    cover: '/products/catalog/p-gina-vaginal-moisturizing-glides.webp',
    gallery: [
      '/products/catalog/p-gina-vaginal-moisturizing-glides-2.webp',
      '/products/catalog/p-gina-vaginal-moisturizing-glides-3.webp',
      '/products/catalog/p-gina-vaginal-moisturizing-glides-4.webp',
    ],
  },
  'p-good-clean-love': '/products/catalog/p-good-clean-love.webp',
  'p-good-kitty-uti-biome-shield': {
    cover: '/products/catalog/p-good-kitty-uti-biome-shield.webp',
    gallery: [
      '/products/catalog/p-good-kitty-uti-biome-shield-2.webp',
    ],
  },
  'p-haakaa-pump': '/products/catalog/p-haakaa-pump.webp',
  'p-hanes-period': '/products/catalog/p-hanes-period.webp',
  'p-hatch-oil': '/products/catalog/p-hatch-oil.webp',
  'p-hello-disc': {
    cover: '/products/catalog/p-hello-disc.webp',
    gallery: [
      '/products/catalog/p-hello-disc-2.webp',
    ],
  },
  'p-honeypot-pad': '/products/catalog/p-honeypot-pad.webp',
  'p-honeypot-wash': '/products/catalog/p-honeypot-wash.webp',
  'p-hum-flatter-me': '/products/catalog/p-hum-flatter-me.webp',
  'p-inositol-wholesome': '/products/catalog/p-inositol-wholesome.webp',
  'p-intimate-rose': '/products/catalog/p-intimate-rose.webp',
  'p-intimina-kegel': {
    cover: '/products/catalog/p-intimina-kegel.webp',
    gallery: [
      '/products/catalog/p-intimina-kegel-2.webp',
    ],
  },
  'p-intimina-lily': '/products/catalog/p-intimina-lily.webp',
  'p-kindra-lotion': '/products/catalog/p-kindra-lotion.webp',
  'p-knix-underwear': '/products/catalog/p-knix-underwear.webp',
  'p-kotex-security': '/products/catalog/p-kotex-security.webp',
  'p-kotex-tampon': '/products/catalog/p-kotex-tampon.webp',
  'p-l-pad': '/products/catalog/p-l-pad.webp',
  'p-lansinoh-pads': '/products/catalog/p-lansinoh-pads.webp',
  'p-lelo-sona': '/products/catalog/p-lelo-sona.webp',
  'p-lena-cup': '/products/catalog/p-lena-cup.webp',
  'p-lim-method-bundle': '/products/catalog/p-lim-method-bundle.webp',
  'p-lim-method-kneeling-pad': '/products/catalog/p-lim-method-kneeling-pad.webp',
  'p-lim-method-shoe-covers': '/products/catalog/p-lim-method-shoe-covers.webp',
  'p-livlabs-pippa-fit-kit': '/products/catalog/p-livlabs-pippa-fit-kit.webp',
  'p-livlabs-pippa-starter-kit': '/products/catalog/p-livlabs-pippa-starter-kit.webp',
  'p-lola-pad': '/products/catalog/p-lola-pad.webp',
  'p-lola-tampon': '/products/catalog/p-lola-tampon.webp',
  'p-love-wellness-bloat': '/products/catalog/p-love-wellness-bloat.webp',
  'p-lumma-disc': '/products/catalog/p-lumma-disc.webp',
  'p-luna-wash': '/products/catalog/p-luna-wash.webp',
  'p-lunette-cup': '/products/catalog/p-lunette-cup.webp',
  'p-magnesium-glycinate': '/products/catalog/p-magnesium-glycinate.webp',
  'p-maude-vibe': '/products/catalog/p-maude-vibe.webp',
  'p-modibodi': '/products/catalog/p-modibodi.webp',
  'p-mypelvicbra-classic': '/products/catalog/p-mypelvicbra-classic.webp',
  'p-mypelvicbra-classic-plus': {
    cover: '/products/catalog/p-mypelvicbra-classic-plus.webp',
    gallery: [
      '/products/catalog/p-mypelvicbra-classic-plus-2.webp',
      '/products/catalog/p-mypelvicbra-classic-plus-3.webp',
      '/products/catalog/p-mypelvicbra-classic-plus-4.webp',
    ],
  },
  'p-mypelvicbra-sports': '/products/catalog/p-mypelvicbra-sports.webp',
  'p-mypelvicbra-waistband-extenders': {
    cover: '/products/catalog/p-mypelvicbra-waistband-extenders.webp',
    gallery: [
      '/products/catalog/p-mypelvicbra-waistband-extenders-2.webp',
      '/products/catalog/p-mypelvicbra-waistband-extenders-3.webp',
    ],
  },
  'p-mystery-vibe': '/products/catalog/p-mystery-vibe.webp',
  'p-natracare-pad': '/products/catalog/p-natracare-pad.webp',
  'p-natracare-tampon': '/products/catalog/p-natracare-tampon.webp',
  'p-nature-made-iron-65mg': '/products/catalog/p-nature-made-iron-65mg.webp',
  'p-natures-bounty-d3-125mcg': '/products/catalog/p-natures-bounty-d3-125mcg.webp',
  'p-neycher-botanical-vulva-balm': '/products/catalog/p-neycher-botanical-vulva-balm.webp',
  'p-neycher-goodbye-dryness-bundle': '/products/catalog/p-neycher-goodbye-dryness-bundle.webp',
  'p-neycher-hydrobloom-gel': '/products/catalog/p-neycher-hydrobloom-gel.webp',
  'p-neycher-odor-be-gone': '/products/catalog/p-neycher-odor-be-gone.webp',
  'p-neycher-vaginal-moisturizer': '/products/catalog/p-neycher-vaginal-moisturizer.webp',
  'p-nixit': '/products/catalog/p-nixit.webp',
  'p-ob-original-multipack-40': '/products/catalog/p-ob-original-multipack-40.webp',
  'p-ob-original-multipack-80': '/products/catalog/p-ob-original-multipack-80.webp',
  'p-ob-original-regular-40': '/products/catalog/p-ob-original-regular-40.webp',
  'p-ob-original-super-40': '/products/catalog/p-ob-original-super-40.webp',
  'p-ob-original-super-plus-40': '/products/catalog/p-ob-original-super-plus-40.webp',
  'p-ob-original-ultra-40': '/products/catalog/p-ob-original-ultra-40.webp',
  'p-ob-procomfort-mini-16': '/products/catalog/p-ob-procomfort-mini-16.webp',
  'p-ob-procomfort-mini-32': '/products/catalog/p-ob-procomfort-mini-32.webp',
  'p-ob-tampon': '/products/catalog/p-ob-tampon.webp',
  'p-oboo-boom': '/products/catalog/p-oboo-boom.webp',
  'p-oboo-cool-spray': '/products/catalog/p-oboo-cool-spray.webp',
  'p-oboo-groove': '/products/catalog/p-oboo-groove.webp',
  'p-oboo-loob-arousal': {
    cover: '/products/catalog/p-oboo-loob-arousal.webp',
    gallery: [
      '/products/catalog/p-oboo-loob-arousal-2.webp',
    ],
  },
  'p-oboo-loob-daily': {
    cover: '/products/catalog/p-oboo-loob-daily.webp',
    gallery: [
      '/products/catalog/p-oboo-loob-daily-2.webp',
    ],
  },
  'p-oboo-mood-drops': '/products/catalog/p-oboo-mood-drops.webp',
  'p-oboo-moon': '/products/catalog/p-oboo-moon.webp',
  'p-oboo-nook': {
    cover: '/products/catalog/p-oboo-nook.webp',
    gallery: [
      '/products/catalog/p-oboo-nook-2.webp',
    ],
  },
  'p-oboo-oooh': '/products/catalog/p-oboo-oooh.webp',
  'p-oboo-shoop': '/products/catalog/p-oboo-shoop.webp',
  'p-oboo-smooch': '/products/catalog/p-oboo-smooch.webp',
  'p-oboo-smooth-arousal': '/products/catalog/p-oboo-smooth-arousal.webp',
  'p-oboo-smooth-daily': '/products/catalog/p-oboo-smooth-daily.webp',
  'p-oboo-woo': '/products/catalog/p-oboo-woo.webp',
  'p-oboo-woosh-warming-wand': '/products/catalog/p-oboo-woosh-warming-wand.webp',
  'p-organicup': '/products/catalog/p-organicup.webp',
  'p-organyc-pad': '/products/catalog/p-organyc-pad.webp',
  'p-organyc-tampon': '/products/catalog/p-organyc-tampon.webp',
  'p-pelvic-wand': '/products/catalog/p-pelvic-wand.webp',
  'p-period-co-underwear': '/products/catalog/p-period-co-underwear.webp',
  'p-period-nirvana-disc': {
    cover: '/products/catalog/p-period-nirvana-disc.webp',
    gallery: [
      '/products/catalog/p-period-nirvana-disc-2.webp',
    ],
  },
  'p-phd-wash': '/products/catalog/p-phd-wash.webp',
  'p-playtex-sport': '/products/catalog/p-playtex-sport.webp',
  'p-poise-ultra-thin-moderate': '/products/catalog/p-poise-ultra-thin-moderate.webp',
  'p-portable-heating': '/products/catalog/p-portable-heating.webp',
  'p-probiotics-women': '/products/catalog/p-probiotics-women.webp',
  'p-proof-period': '/products/catalog/p-proof-period.webp',
  'p-proov-balance-bundle': '/products/catalog/p-proov-balance-bundle.webp',
  'p-proov-complete': '/products/catalog/p-proov-complete.webp',
  'p-proov-empower': '/products/catalog/p-proov-empower.webp',
  'p-proov-his-hers': '/products/catalog/p-proov-his-hers.webp',
  'p-proov-path-to-pregnancy': '/products/catalog/p-proov-path-to-pregnancy.webp',
  'p-rael-liners': '/products/catalog/p-rael-liners.webp',
  'p-rael-organic-pad': '/products/catalog/p-rael-organic-pad.webp',
  'p-rael-overnight': '/products/catalog/p-rael-overnight.webp',
  'p-rael-tampon': '/products/catalog/p-rael-tampon.webp',
  'p-remifemin': '/products/catalog/p-remifemin.webp',
  'p-rituals-prenatal': {
    cover: '/products/catalog/p-rituals-prenatal.webp',
    gallery: [
      '/products/catalog/p-rituals-prenatal-2.webp',
    ],
  },
  'p-ruby-cup': '/products/catalog/p-ruby-cup.webp',
  'p-rubylove': '/products/catalog/p-rubylove.webp',
  'p-saalt-cup': '/products/catalog/p-saalt-cup.webp',
  'p-saalt-cup-steamer': '/products/catalog/p-saalt-cup-steamer.webp',
  'p-saalt-disc': '/products/catalog/p-saalt-disc.webp',
  'p-seventh-gen-pad': {
    cover: '/products/catalog/p-seventh-gen-pad.webp',
    gallery: [
      '/products/catalog/p-seventh-gen-pad-2.webp',
    ],
  },
  'p-seventh-gen-tampon': '/products/catalog/p-seventh-gen-tampon.webp',
  'p-silverette-cups': '/products/catalog/p-silverette-cups.webp',
  'p-snoogle-pillow': '/products/catalog/p-snoogle-pillow.webp',
  'p-softdisc': '/products/catalog/p-softdisc.webp',
  'p-sootheher-elaris-pod': '/products/catalog/p-sootheher-elaris-pod.webp',
  'p-sootheher-gel-pad-refills': '/products/catalog/p-sootheher-gel-pad-refills.webp',
  'p-spearmint-pcos': '/products/catalog/p-spearmint-pcos.webp',
  'p-stayfree-ultra': '/products/catalog/p-stayfree-ultra.webp',
  'p-sweet-spot-wipes': '/products/catalog/p-sweet-spot-wipes.webp',
  'p-sweetspot-buff-brighten': '/products/catalog/p-sweetspot-buff-brighten.webp',
  'p-tampax-pure': '/products/catalog/p-tampax-pure.webp',
  'p-tampax-radiant': '/products/catalog/p-tampax-radiant.webp',
  'p-tena-intimates-very-light-liner': '/products/catalog/p-tena-intimates-very-light-liner.webp',
  'p-thermacare': '/products/catalog/p-thermacare.webp',
  'p-thinx': '/products/catalog/p-thinx.webp',
  'p-tomboyx-period': '/products/catalog/p-tomboyx-period.webp',
  'p-u-kotex-pad': '/products/catalog/p-u-kotex-pad.webp',
  'p-uberlube': '/products/catalog/p-uberlube.webp',
  'p-ubiquinol-thorne': '/products/catalog/p-ubiquinol-thorne.webp',
  'p-uqora-control': '/products/catalog/p-uqora-control.webp',
  'p-v-wash': '/products/catalog/p-v-wash.webp',
  'p-veeda-pad': '/products/catalog/p-veeda-pad.webp',
  'p-vio2-mouth-tape': '/products/catalog/p-vio2-mouth-tape.webp',
  'p-vitex': '/products/catalog/p-vitex.webp',
  'p-willow-pump': {
    cover: '/products/catalog/p-willow-pump.webp',
    gallery: [
      '/products/catalog/p-willow-pump-2.webp',
    ],
  },
  'p-winx-pregnancy-tests': '/products/catalog/p-winx-pregnancy-tests.webp',
  'p-winx-uti-daily-defense': '/products/catalog/p-winx-uti-daily-defense.webp',
  'p-winx-uti-pain-relief': '/products/catalog/p-winx-uti-pain-relief.webp',
  'p-winx-uti-test-treat': '/products/catalog/p-winx-uti-test-treat.webp',
  'p-winx-vaginal-health-test-treat': '/products/catalog/p-winx-vaginal-health-test-treat.webp',
  'p-winx-vaginal-probiotic': '/products/catalog/p-winx-vaginal-probiotic.webp',
  'p-womaness-me': '/products/catalog/p-womaness-me.webp',
  'p-wuka-underwear': '/products/catalog/p-wuka-underwear.webp',
  'p-ziggy-disc': '/products/catalog/p-ziggy-disc.webp',
  'p-zinc': '/products/catalog/p-zinc.webp',
});

function entryFor(productOrId) {
  const id = typeof productOrId === 'string' ? productOrId : productOrId?.id;
  if (!id) return null;
  return PRODUCT_IMAGE_OVERRIDES[id] || null;
}

/** The cleaned studio cover photo for a catalog product (or id), or '' when none. */
export function productImageOverride(productOrId) {
  const entry = entryFor(productOrId);
  if (!entry) return '';
  return typeof entry === 'string' ? entry : entry.cover || '';
}

/**
 * Every clean photo for a product, cover first: [cover, ...gallery]. Products
 * without an override fall back to their own `image` (when given an object),
 * so a gallery always has at least the card photo when one exists.
 */
export function productGallery(productOrId) {
  const entry = entryFor(productOrId);
  if (!entry) {
    const own = typeof productOrId === 'object' && productOrId ? String(productOrId.image || '').trim() : '';
    return own ? [own] : [];
  }
  if (typeof entry === 'string') return [entry];
  const list = [entry.cover, ...(entry.gallery || [])].filter(Boolean);
  return [...new Set(list)];
}

/** Returns the product with its image swapped for the studio cover, if any. */
export function withImageOverride(product) {
  const src = productImageOverride(product);
  return src && product ? { ...product, image: src } : product;
}
