/**
 * Real shopper activity from the ayna app (PostHog), per product. Server-only:
 * the benchmark build copies it into the admin-only snapshot, so these counts
 * never ship in the public website bundle.
 *
 * Each number is how many different people did that thing with the product
 * between ENG_FROM and ENG_TO: saw its card in a list, opened the card, opened
 * the full product page, or clicked through to buy (buy now or a retailer
 * link). ayna team accounts (is_internal) and detected bots are excluded. Only
 * these four counts are kept: no people, dates, locations, answers or health
 * data. Card views were tracked from Oct 28 and product pages from Oct 26.
 *
 * Refresh: re-run the PostHog query saved in the Partner Studio project doc and
 * replace the rows (id|seen|opened|detail|buy).
 */
export const ENG_FROM = '2026-08-29';
export const ENG_TO = '2026-11-27';

const RAW = `d-connect-pelvic-floor-fitness|17|15|3|5
d-twentyeight-health-birth-control-emergency-contr|1|0|0|0
p-aisle-underwear|0|0|1|0
p-alubri-calming-cream|2|3|4|0
p-alubri-intimate-serum|2|1|1|0
p-alubri-moisture-renewal-kit|3|1|1|0
p-alubri-rejuvenate-restore-kit|2|1|0|0
p-alubri-vaginal-moisturizing-gel|1|1|2|0
p-alubri-vaginal-wellness-kit|1|2|2|1
p-alubri-vulva-balm|4|1|2|1
p-always-discreet-boutique-liners|0|1|0|0
p-always-infinity|1|13|7|4
p-always-liners|2|0|0|0
p-bambody-underwear|1|0|0|0
p-bodyform-pad|1|1|0|1
p-boric-acid|1|0|0|0
p-buni-rejuvenate-vulva-balm|11|9|0|0
p-carefree-liners|3|0|1|0
p-cbb-perfect-ph-probiotic-gummies|1|0|0|0
p-cora-disc|0|2|0|0
p-cora-organic-pads|1|1|1|3
p-cora-organic-tampons|0|2|1|1
p-cranberry-supplement|1|2|0|0
p-d-mannose-now|0|1|0|1
p-dame-arc|1|10|0|1
p-dear-kate-underwear|1|0|0|0
p-depend-silhouette-underwear|0|3|0|2
p-diva-cup|1|0|0|0
p-elitone|3|7|1|2
p-elitone-urge|3|6|1|2
p-elvie-trainer|1|17|0|3
p-femmycycle|0|0|1|0
p-fish-oil|3|1|0|0
p-flex-cup|1|0|0|0
p-flex-disc|2|4|1|0
p-flo-gummies|1|8|1|0
p-gina-insertion-applicator-refills|1|3|0|1
p-gina-starter-kit|3|5|3|0
p-gina-vaginal-moisturizing-glides|3|6|1|1
p-good-clean-love|2|2|1|1
p-good-kitty-uti-biome-shield|0|4|0|0
p-goodbug-good-down-there|1|1|2|0
p-hanes-period|0|2|1|2
p-hello-disc|1|1|0|0
p-honeypot-pad|3|10|0|3
p-honeypot-wash|2|3|0|2
p-intimate-rose|0|2|0|1
p-intimina-kegel|0|2|0|0
p-joylux-juicy-like-a-peach|2|6|4|0
p-joylux-lets-spin|0|1|0|0
p-joylux-reliefher|1|2|2|1
p-joylux-revitalizher|1|0|0|0
p-joylux-shebar|3|1|1|1
p-joylux-vfit|1|0|0|0
p-joylux-vfit-plus|1|0|1|0
p-kindra-lotion|0|1|0|0
p-l-pad|1|2|0|0
p-lelo-sona|1|2|0|0
p-lena-cup|1|1|0|0
p-lim-method-bundle|8|3|1|1
p-lim-method-kneeling-pad|15|7|3|0
p-lim-method-shoe-covers|12|5|1|1
p-livi-after-sex-absorption-device|4|2|2|0
p-lola-pad|5|9|1|5
p-lola-tampon|3|9|2|2
p-love-wellness-intimate-skin-support|3|2|4|1
p-lumma-disc|0|1|0|0
p-luna-wash|3|2|0|0
p-lunette-cup|1|1|1|0
p-magnesium-glycinate|2|5|0|1
p-maude-vibe|0|1|0|0
p-modibodi|1|0|1|0
p-momotaro-bath-body-tonic|6|1|0|0
p-momotaro-daily-probiotic|5|2|3|0
p-momotaro-hydrosol-toner|4|1|1|0
p-momotaro-salve|8|2|1|1
p-momotaro-urinary-tract-supplement|3|0|0|0
p-monistat-3-combo|2|1|1|0
p-mypelvicbra-classic|1|5|0|0
p-mypelvicbra-classic-plus|2|4|0|0
p-mypelvicbra-sports|1|5|1|2
p-mypelvicbra-waistband-extenders|1|4|0|0
p-mystery-vibe|0|1|0|0
p-natracare-tampon|3|0|1|0
p-naya-applicator-kit|2|1|1|1
p-naya-regular-tampons|2|0|0|0
p-neycher-hydrobloom-gel|14|10|0|1
p-neycher-odor-be-gone|7|7|1|2
p-neycher-vaginal-moisturizer|6|14|1|1
p-nixit|0|1|0|0
p-ob-original-multipack-40|1|0|1|0
p-ob-original-multipack-80|0|0|1|0
p-ob-original-regular-40|1|0|1|0
p-ob-original-super-40|0|0|1|0
p-ob-original-super-plus-40|0|1|0|0
p-ob-original-ultra-40|1|0|1|0
p-ob-procomfort-mini-16|0|0|1|0
p-ob-procomfort-mini-32|0|1|2|0
p-ob-tampon|1|1|0|0
p-oboo-groove|1|0|0|0
p-oboo-loob-arousal|2|0|0|0
p-oboo-loob-daily|1|3|1|0
p-oboo-moon|0|2|0|0
p-oboo-oooh|1|0|0|0
p-oboo-shoop|0|1|0|0
p-oboo-smooch|0|1|0|0
p-oboo-smooth-arousal|1|1|1|0
p-oboo-smooth-daily|2|2|0|2
p-oboo-woo|0|1|0|0
p-oboo-woosh-warming-wand|1|5|1|1
p-organicup|1|0|0|0
p-organyc-pad|2|1|0|0
p-organyc-tampon|2|0|0|0
p-pelvic-wand|0|3|1|1
p-period-co-underwear|1|1|0|0
p-phd-wash|2|1|0|0
p-poise-ultra-thin-moderate|0|3|1|0
p-portable-heating|1|1|0|1
p-probiotics-women|1|0|0|0
p-proof-period|1|4|3|1
p-rael-liners|1|0|0|0
p-rael-organic-pad|2|9|2|2
p-rael-overnight|0|1|0|0
p-ruby-cup|1|0|1|0
p-rubylove|0|0|1|0
p-saalt-cup|1|0|1|0
p-saalt-cup-steamer|0|2|1|1
p-saalt-disc|0|2|0|0
p-seventh-gen-pad|2|1|1|0
p-seventh-gen-tampon|1|0|1|0
p-sootheher-elaris-pod|8|6|0|0
p-sootheher-gel-pad-refills|14|9|0|0
p-stayfree-ultra|1|0|0|0
p-sweet-spot-wipes|2|0|0|0
p-sweetspot-buff-brighten|2|0|0|0
p-tampax-pure|0|2|0|0
p-tampax-radiant|1|1|0|0
p-tampontribe-organic-pads|1|0|0|0
p-tampontribe-organic-tampons|0|0|1|0
p-tampontribe-pads-bulk-buy|1|1|0|0
p-tampontribe-pantyliners-bulk-buy|0|2|0|0
p-tampontribe-reusable-pads|1|0|0|0
p-taro-clotrimazole-7|3|0|0|0
p-thermacare|0|3|0|1
p-thinx|0|3|1|0
p-uberlube|0|2|1|1
p-uqora-control|2|3|0|1
p-v-wash|2|1|0|0
p-veeda-pad|2|2|1|0
p-vella-everslide-personal-lubricant|1|0|0|0
p-viboos-heating-pad|1|0|0|0
p-winx-uti-daily-defense|3|2|2|1
p-winx-vaginal-probiotic|6|1|1|1
p-womaness-melt-for-you-vaginal-inserts|1|0|0|0
p-wuka-underwear|0|6|0|4`;

export const ENGAGEMENT = new Map(RAW.split('\n').map((line) => {
  const [id, seen, opened, detail, buy] = line.split('|');
  return [id, { seen: +seen, opened: +opened, detail: +detail, buy: +buy }];
}));
