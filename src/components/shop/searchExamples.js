// Every example search the Shop's Browse placeholder shows ("Try: …"). Kept here, apart from the
// components, so src/utils/search/suggestionChips.test.js can run each one
// through the real search and check it finds relevant products.
import { ROTATING_EXAMPLES } from '../../data/searchPhrases.research.js';

// Grouped by care theme, in life-stage order, for an 18+ audience.
export const SHOP_SEARCH_THEMES = [
    ['magnesium for period cramps', 'organic tampons for a heavy flow', 'period underwear for overnight leaks'],
    ['non-hormonal vaginal moisturizers', 'lubricant for sensitive skin', 'pH-balanced intimate wash'],
    ['prenatal vitamins with choline', 'pregnancy pillow for back pain', 'morning sickness relief'],
    ['postpartum recovery kit', 'wearable breast pump for work', 'nipple balm for breastfeeding'],
    ['pelvic floor trainer for leaks', 'bladder leak pads that stay dry', 'pelvic floor therapy app'],
    ['best perimenopause telehealth provider', 'supplements for perimenopause sleep', 'perimenopause mood and anxiety support'],
    ['hot flash relief without hormones', 'cooling products for night sweats', 'menopause telehealth clinics'],
    ['postmenopausal bone health supplements', 'vaginal dryness after menopause', 'calcium and vitamin D for bone density'],
    ['at-home hormone test', 'sleep support for hormonal changes', 'probiotics for bloating'],
];

// Examples the catalog can't answer well yet (fewer than 3 relevant products in
// the top results; suggestionChips.test.js). They stay out of the rotating hint
// until the catalog covers them, so we never suggest a search that disappoints
// (Aparna, Sep 30). Remove a phrase from this list once its products are added.
export const THIN_IN_CATALOG = new Set([
    'boob pain before period', 'hair falling out after baby', 'period headache', 'morning sickness',
    'low milk supply', 'prenatal vitamins', 'chin hair', 'prenatal vitamins with choline',
    'morning sickness relief', 'wearable breast pump for work', 'hot flash relief without hormones',
    'postmenopausal bone health supplements', 'calcium and vitamin D for bone density',
]);

// Everyday phrasings first (search research, Oct 17), then the themed examples.
export const SHOP_SEARCH_EXAMPLES = [...ROTATING_EXAMPLES.filter((x) => !/poop/.test(x)), ...SHOP_SEARCH_THEMES.flat()]
    .filter((x) => !THIN_IN_CATALOG.has(x));

