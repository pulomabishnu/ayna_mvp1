import { describe, expect, it } from 'vitest';
import { searchProducts } from './index.js';
import { ALL_PRODUCTS, isTeenProduct } from '../../data/products.js';
import { POPULAR_SEARCHES } from '../../data/searchSynonyms.js';
import { NEED_STICKERS, FAMILIAR_PHRASES } from '../../components/shop/shopNeeds.js';
import { SHOP_SEARCH_EXAMPLES } from '../../components/shop/searchExamples.js';
import { HOME_SEARCH_HINTS } from '../../components/shop/homeSearchHints.js';

// Every search the Shop offers people (need stickers, "Does this sound
// familiar?" phrases, the "Try: …" placeholder, the home search hints and the
// "try …" fallbacks) must find at least 3 relevant products near the top.
// Aparna (Sep 30): the "Hair thinning" chip showed unrelated products first.
const TOP = 8;
const MIN = 3;

// What each kind of search is for: product categories, or words in its tags.
const CRAMPS = { cats: ['cramp-relief', 'medication'], tags: /cramp/ };
const FLOW = { cats: ['pad', 'tampon', 'cup', 'disc', 'period-underwear'], tags: /heavy-flow|leaks/ };
const PERIOD = { cats: ['pad', 'tampon', 'cup', 'disc', 'period-underwear'] };
const VAGINAL = { cats: ['intimate-care', 'diagnostics'], tags: /vaginal|yeast|odor/ };
const DRYNESS = { cats: ['intimate-care', 'sex-tech'], tags: /moistur|lubric|dryness/ };
const BLOAT = { tags: /bloat|gut|probiotic|digest/ };
const MENO = { cats: ['menopause'], tags: /menopause|perimenopause|hot.?flash|night.?sweat/ };
const SLEEP = { cats: ['sleep'], tags: /sleep/ };
const PMOS = { tags: /pcos|pmos|inositol/ };
const UTI = { tags: /\buti\b|urinary/ };
const LEAKS = { cats: ['incontinence', 'pelvic-floor', 'pelvic-floor-trainer', 'pelvic-floor-exerciser'], tags: /bladder|incontinence/ };
const PELVIC = { cats: ['pelvic-floor', 'pelvic-floor-trainer', 'pelvic-floor-exerciser', 'pelvic-health'], tags: /pelvic/ };
const POSTPARTUM = { cats: ['postpartum'], tags: /postpartum|nursing|lactation|breastfeed/ };
const PREGNANCY = { cats: ['pregnancy'], tags: /pregnan|prenatal/ };
const FERTILITY = { cats: ['fertility'], tags: /fertility|ovulation/ };
const ACNE = { cats: ['skincare'], tags: /acne/ };
const HAIR = { cats: ['hair', 'haircare'], tags: /\bhair\b|thinning|shedding/ };
const TELEHEALTH = { cats: ['telehealth'] };
const PMS = { tags: /\bpms\b|cramp|bloat|breast-tenderness|mood/ };

const INTENTS = {
  cramps: CRAMPS, 'bad cramps': CRAMPS, 'magnesium for period cramps': CRAMPS,
  'heavy flow': FLOW, 'heavy flow overnight': FLOW, 'organic tampons for a heavy flow': FLOW,
  'period underwear': PERIOD, 'period underwear for overnight leaks': PERIOD, 'first period kit': PERIOD,
  'organic pads': { cats: ['pad'] }, 'pad rash': { cats: ['pad'] }, 'postpartum pads': { cats: ['pad', 'postpartum'] },
  'spotting between periods': { cats: ['pad', 'period-underwear', 'tracker'] },
  'itchy down there': VAGINAL, 'brown discharge': VAGINAL, 'vaginal odor after period': VAGINAL,
  'ph-balanced intimate wash': { cats: ['intimate-care'] },
  'dry during sex': DRYNESS, 'vaginal dryness': DRYNESS, 'non-hormonal vaginal moisturizers': DRYNESS,
  'vaginal dryness after menopause': DRYNESS, 'lubricant for sensitive skin': DRYNESS, lube: DRYNESS,
  'sperm friendly lube': DRYNESS,
  'period bloating': BLOAT, 'probiotics for bloating': BLOAT,
  'hot flashes': MENO, 'hot flashes at night': MENO, 'hot flash relief without hormones': MENO,
  'night sweats': { cats: ['menopause', 'sleep'], tags: MENO.tags }, 'cooling products for night sweats': { cats: ['menopause', 'sleep'], tags: MENO.tags },
  menopause: MENO, 'meno belly': MENO, 'menopause brain fog': MENO, 'joint pain menopause': MENO,
  'perimenopause mood and anxiety support': MENO,
  'menopause telehealth clinics': TELEHEALTH, 'best perimenopause telehealth provider': TELEHEALTH,
  sleep: SLEEP, 'sleep and stress': SLEEP, 'cant sleep before period': SLEEP,
  'supplements for perimenopause sleep': SLEEP, 'sleep support for hormonal changes': SLEEP,
  pmos: PMOS, 'pmos support': PMOS, 'pmos hair growth': PMOS,
  uti: UTI, 'uti burning': UTI,
  'bladder leaks': LEAKS, 'leaking when i sneeze': LEAKS, 'bladder leak pads that stay dry': LEAKS,
  'pelvic floor': PELVIC, 'pelvic floor trainer for leaks': PELVIC, 'pelvic floor therapy app': PELVIC,
  'postpartum recovery kit': POSTPARTUM, 'c section recovery': POSTPARTUM, 'cracked nipples': POSTPARTUM,
  'nipple balm for breastfeeding': POSTPARTUM, 'wearable breast pump for work': POSTPARTUM, 'low milk supply': POSTPARTUM,
  'pregnancy pillow for back pain': PREGNANCY, 'pregnancy safe skincare': PREGNANCY,
  'prenatal vitamins': { cats: ['supplement'], tags: /pregnan|prenatal/, both: true },
  'prenatal vitamins with choline': { cats: ['supplement'], tags: /pregnan|prenatal/, both: true },
  pregnancy: PREGNANCY, 'morning sickness': { tags: /nausea|morning-sickness/ }, 'morning sickness relief': { tags: /nausea|morning-sickness/ },
  'trying to conceive': FERTILITY, 'ovulation test': FERTILITY,
  'hormonal acne': ACNE, 'hormonal acne chin': ACNE,
  'hair falling out after baby': HAIR,
  'chin hair': { tags: /pcos|pmos|hirsut|facial-hair|hair-removal/ },
  'boob pain before period': { tags: /breast-tenderness/ },
  pms: PMS, 'pms mood swings': { cats: ['mental-health'], tags: /\bpms\b|mood/ },
  'low sex drive': { cats: ['sex-tech'], tags: /libido|sexual/ },
  'tired on my period': { tags: /energy|fatigue|iron/ },
  'period headache': { cats: ['medication', 'cramp-relief'], tags: /headache|migraine/ },
  'endo belly': { tags: /endometriosis/ },
  'at-home hormone test': { cats: ['diagnostics'] },
  'postmenopausal bone health supplements': { tags: /bone|calcium|vitamin-d/ },
  'calcium and vitamin d for bone density': { tags: /bone|calcium|vitamin-d/ },
};

const shown = (p) => !p.hidden && !isTeenProduct(p);
function fits(p, intent) {
  const cat = (intent.cats || []).includes(p.category);
  const tag = intent.tags ? intent.tags.test([...(p.tags || []), ...(p.healthFunctions || [])].join(' ').toLowerCase()) : false;
  return intent.both ? cat && tag : cat || tag;
}

const CHIPS = [...new Set([
  ...NEED_STICKERS.map((n) => n.query), ...FAMILIAR_PHRASES, ...SHOP_SEARCH_EXAMPLES, ...HOME_SEARCH_HINTS, ...POPULAR_SEARCHES,
].map((q) => q.trim()))];

describe('every Shop search suggestion finds relevant products', () => {
  it('has an intent written for every chip and example', () => {
    expect(CHIPS.filter((q) => !INTENTS[q.toLowerCase()])).toEqual([]);
  });
  it(`returns at least ${MIN} relevant products in the top ${TOP} for each one`, () => {
    const weak = [];
    for (const q of CHIPS) {
      const intent = INTENTS[q.toLowerCase()];
      if (!intent) continue;
      const top = searchProducts(q, ALL_PRODUCTS).filter(shown).slice(0, TOP);
      const good = top.filter((p) => fits(p, intent));
      if (good.length < MIN) weak.push(`${q}: ${good.length} of ${top.length} (${top.map((p) => p.name).join(' | ')})`);
    }
    expect(weak).toEqual([]);
  }, 240000);
});
