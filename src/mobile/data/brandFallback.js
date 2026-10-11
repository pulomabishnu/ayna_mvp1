// Brand for older catalog entries that have no `brand` field. Every value is
// the brand already written at the start of that product's own name — nothing
// new is asserted. Display-only: the shared product data is untouched.
// Products whose name IS the brand (e.g. "Calm", "DivaCup") map to that name.
export const BRAND_FALLBACK = {
  'p-always-infinity': 'Always', 'p-rael-organic-pad': 'Rael', 'p-honeypot-pad': 'The Honey Pot', 'p-saalt-cup': 'Saalt',
  'p-flex-disc': 'Flex', 'p-thinx': 'Thinx', 'p-magnesium-glycinate': 'Nature Made', 'p-ubiquinol-thorne': 'Thorne',
  'd-clue': 'Clue', 'd-stardust': 'Stardust', 'd-balance-menopause': 'Balance', 'p-natracare-pad': 'Natracare',
  'p-organyc-pad': 'Organyc', 'p-veeda-pad': 'Veeda', 'p-l-pad': 'L.', 'p-tampax-pure': 'Tampax',
  'p-natracare-tampon': 'Natracare', 'p-organyc-tampon': 'Organyc', 'p-diva-cup': 'DivaCup', 'p-lunette-cup': 'Lunette',
  'p-june-cup': 'June', 'p-nixit': 'Nixit', 'p-cora-disc': 'Cora', 'p-modibodi': 'Modibodi', 'p-rubylove': 'Ruby Love',
  'p-probiotics-women': 'Garden of Life', 'p-evening-primrose': 'NOW Foods', 'p-vitex': 'Gaia Herbs', 'p-fish-oil': 'Nordic Naturals',
  'p-b-complex': 'Thorne', 'p-cranberry-supplement': 'AZO', 'p-zinc': 'Garden of Life', 'p-boric-acid': 'The Honey Pot',
  'p-azo-test': 'AZO', 'p-good-clean-love': 'Good Clean Love', 'p-flo-gummies': 'Flo', 'p-hum-flatter-me': 'HUM Nutrition',
  'p-thermacare': 'ThermaCare', 'p-portable-heating': 'Comfytemp', 'p-elvie-trainer': 'Elvie', 'p-intimate-rose': 'Intimate Rose',
  'p-honeypot-wash': 'The Honey Pot', 'd-natural-cycles': 'Natural Cycles', 'd-ovia': 'Ovia Health', 'd-glow': 'Glow',
  'd-maven': 'Maven Clinic', 'd-tia': 'Tia', 'd-ppd': 'Planned Parenthood Direct', 'd-betterhelp': 'BetterHelp',
  'd-headspace': 'Headspace', 'd-calm': 'Calm', 'd-initio': 'Inito', 'd-oura': 'Oura', 'd-apple-health': 'Apple Health',
  'd-eight-sleep': 'Eight Sleep', 'p-frida-mom-kit': 'Frida Mom', 'p-lansinoh-pads': 'Lansinoh', 'p-rituals-prenatal': 'Ritual',
  'p-belly-bandit': 'Belly Bandit', 'p-maude-vibe': 'Maude', 'p-uberlube': 'Uberlube', 'p-v-wash': 'V-Wash',
  'p-sweet-spot-wipes': 'SweetSpot Labs', 'p-kindra-lotion': 'Kindra', 'p-citracal-bone-health': 'Citracal', 'd-peanut': 'Peanut',
  'd-bloom': 'Bloom', 'd-visana': 'Visana Health', 'd-flutter': 'Flutter', 'd-menolabs': 'MenoLabs', 'p-intimina-lily': 'Intimina',
  'p-hello-disc': 'Hello', 'p-saalt-disc': 'Saalt', 'p-knix-underwear': 'Knix', 'p-bambody-underwear': 'Bambody',
  'p-haakaa-pump': 'Haakaa', 'p-silverette-cups': 'Silverette', 'p-hatch-oil': 'Hatch', 'p-willow-pump': 'Willow',
  'p-boppy-pillow': 'Boppy', 'p-snoogle-pillow': 'Leachco', 'p-dame-arc': 'Dame', 'p-lelo-sona': 'LELO',
  'p-mystery-vibe': 'MysteryVibe', 'p-queen-v-pop': 'Queen V', 'p-phd-wash': 'pH-D Feminine Health', 'p-gennev-care': 'Gennev',
  'p-womaness-me': 'Womaness', 'd-evernow': 'Evernow', 'p-kotex-security': 'Kotex', 'p-stayfree-ultra': 'Stayfree',
  'p-seventh-gen-pad': 'Seventh Generation', 'p-u-kotex-pad': 'U by Kotex', 'p-bodyform-pad': 'Bodyform', 'p-rael-overnight': 'Rael',
  'p-cora-overnight': 'Cora', 'p-carefree-liners': 'Carefree', 'p-always-liners': 'Always', 'p-rael-liners': 'Rael',
  'p-playtex-sport': 'Playtex', 'p-kotex-tampon': 'U by Kotex', 'p-ob-tampon': 'OB', 'p-tampax-radiant': 'Tampax',
  'p-seventh-gen-tampon': 'Seventh Generation', 'p-rael-tampon': 'Rael', 'p-lena-cup': 'Lena', 'p-ruby-cup': 'Ruby Cup',
  'p-organicup': 'OrganiCup', 'p-femmycycle': 'FemmyCycle', 'p-flex-cup': 'Flex', 'p-ziggy-disc': 'Ziggy',
  'p-lumma-disc': 'Lumma', 'p-softdisc': 'Softdisc', 'p-period-nirvana-disc': 'Period Nirvana', 'p-aisle-underwear': 'Aisle',
  'p-period-co-underwear': 'Period.co', 'p-wuka-underwear': 'Wuka', 'p-tomboyx-period': 'TomboyX', 'p-dear-kate-underwear': 'Dear Kate',
  'p-proof-period': 'Proof', 'p-hanes-period': 'Hanes',
};

/** The product's brand: its own field, else the brand at the start of its name. */
export function brandOf(product) {
  return String(product?.brand || BRAND_FALLBACK[product?.id] || '').trim();
}
