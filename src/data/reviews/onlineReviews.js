/**
 * ayna's own summary of what people say online, for products whose team copy has no
 * "What people say" text yet (founder, Nov 10: "find credible reviews ... not bots",
 * Reddit, Trustpilot, retailers, social). Shown next to the team's copy, never instead of it,
 * labelled as ayna's summary (CLAUDE.md: team copy is locked).
 *
 * Rules: every point comes from a page ayna read on `checked`; reviews from people tied to the
 * brand (influencers, friends, investors), incentivized or brand-picked reviews are named as
 * such or left out; thin evidence is said plainly. Not medical evidence.
 *
 * Shape: { [productId]: { points: string[], caveat?: string, sources: { url, label }[], checked } }
 */
const RIF_THINGTESTING = { url: 'https://thingtesting.com/brands/rif-care/reviews', label: 'Thingtesting, Rif Care reviews' };
const RIF_CAVEAT = 'Only a dozen public reviews, and most come from people the page labels as influencers, friends or investors of the brand.';

const VIV_THINGTESTING = { url: 'https://thingtesting.com/brands/viv/reviews', label: 'Thingtesting, Viv reviews' };
const VIV_CAVEAT = 'About two dozen public reviews, all 5 stars. Reviews from people who work for Viv or are friends of the brand were left out.';

const BONAFIDE_TP = { url: 'https://ie.trustpilot.com/review/hellobonafide.com', label: 'Trustpilot, Bonafide' };
const BONAFIDE_CAVEAT = 'Very few independent reviews: 5 on Trustpilot (3.3 of 5), none marked verified. Two of them complain about refunds, returns or hard-to-cancel subscriptions.';

const BRAND_SITE = 'Reviews on the brand’s own site, which the brand hosts and may moderate. No independent reviews were found.';

const PICKED = 'Only a few reviews the brand chose to show on its own site, with no overall rating or count. No independent reviews were found.';

const JOYLUX_TP = { url: 'https://ca.trustpilot.com/review/joylux.com', label: 'Trustpilot, Joylux' };
const JOYLUX_CAVEAT = 'Joylux has 162 Trustpilot reviews (3.9 of 5), but most are about its vFit device, not this product. One reviewer there found the gels sticky.';

const PERELEL_HL = { url: 'https://www.healthline.com/nutrition/perelel-health-review', label: 'Healthline, Perelel review (updated May 2025)' };
const PERELEL_TT = { url: 'https://thingtesting.com/brands/perelel', label: 'Thingtesting, Perelel' };
const PERELEL_BRAND = 'Across Perelel’s packs, reviewers like the once-a-day packets; common complaints are a fishy smell or taste, the price, and the number of pills.';

const APP_STORE = 'App Store ratings are public; the App Store shows only a few written reviews.';

export const ONLINE_REVIEWS = {
  'p-rif-care-organic-cotton-non-applicator-tampons': {
    points: [
      'One reviewer called the tampons affordable, comfortable and absorbent enough for sports.',
      'The same reviewer pointed out they have no applicator, unlike most US tampons.',
    ],
    caveat: RIF_CAVEAT,
    sources: [RIF_THINGTESTING],
    checked: '2026-11-10',
  },
  'p-rif-care-organic-cotton-and-hemp-fiber-menstrual': {
    points: [
      'Most Rif Care reviews are about the pads: comfortable, absorbent, and a few reviewers say their irritation from other brands stopped.',
      'One reviewer said the overnight pads did not leak and asked for a liner size.',
    ],
    caveat: RIF_CAVEAT,
    sources: [RIF_THINGTESTING],
    checked: '2026-11-10',
  },
  'p-rif-care-organic-cotton-and-hemp-fiber-leakproof': {
    points: ['No public reviews of the period underwear itself were found. Reviews of the brand are mostly about its pads.'],
    caveat: RIF_CAVEAT,
    sources: [RIF_THINGTESTING],
    checked: '2026-11-10',
  },
  'p-viv-for-your-v-viv-organic-cotton-tampons': {
    points: [
      'Customers say the tampons don’t shed or come apart and the plant-based applicators go in smoothly, with no leaks.',
      'One said they are hard to find in stores.',
    ],
    caveat: VIV_CAVEAT,
    sources: [VIV_THINGTESTING],
    checked: '2026-11-10',
  },
  'p-viv-for-your-v-viv-menstrual-cup': {
    points: [
      'Customers call the ring-stem design easy and comfortable, with a sturdy pull and few or no leaks.',
    ],
    caveat: VIV_CAVEAT,
    sources: [VIV_THINGTESTING],
    checked: '2026-11-10',
  },
  'p-viv-for-your-v-viv-bamboo-pads-liners': {
    points: [
      'Reviewers call the bamboo pads and liners soft, comfortable and absorbent, and like the compostable wrappers.',
      'One asked for more absorbencies and sizes.',
    ],
    caveat: 'Most reviews of the pads and liners come from people who work for Viv or are friends of the brand.',
    sources: [VIV_THINGTESTING],
    checked: '2026-11-10',
  },
  'p-viv-for-your-v-viv-disc': {
    points: ['No detailed public reviews of the disc itself were found. Reviews of the brand are mostly about its tampons and cup.'],
    caveat: VIV_CAVEAT,
    sources: [VIV_THINGTESTING],
    checked: '2026-11-10',
  },
  'p-bonafide-revaree': {
    points: [
      'On Trustpilot, two reviewers said it works as advertised and worked best of the products they tried.',
      'On HighYa, two of four verified reviewers said dryness and pain eased after several uses; one had burning on the outer skin, and one could not return unused inserts.',
    ],
    caveat: `${BONAFIDE_CAVEAT} The HighYa reviews are from 2019.`,
    sources: [BONAFIDE_TP, { url: 'https://highya.com/revaree-reviews', label: 'HighYa, Revaree reviews' }],
    checked: '2026-11-10',
  },
  'p-bonafide-revaree-plus': {
    points: ['No public reviews of Revaree Plus itself were found. Reviews of the original Revaree are mixed but mostly positive about dryness.'],
    caveat: BONAFIDE_CAVEAT,
    sources: [BONAFIDE_TP],
    checked: '2026-11-10',
  },
  'p-bonafide-thermella': {
    points: ['One Trustpilot reviewer objected to the maltodextrin in a product sold as natural, and warned people watching blood sugar.'],
    caveat: BONAFIDE_CAVEAT,
    sources: [BONAFIDE_TP],
    checked: '2026-11-10',
  },
  'p-bonafide-ristela': {
    points: [
      'On HighYa, 2 of 5 reviewers recommend it (3 of 5 overall): some said it worked, one only after about 2.5 months.',
      'Complaints: large pills, a possible allergic reaction, and no refund for an unopened bottle. A Trustpilot reviewer said the subscription was hard to cancel.',
    ],
    caveat: `${BONAFIDE_CAVEAT} The HighYa reviews are from 2020 to 2022.`,
    sources: [BONAFIDE_TP, { url: 'https://highya.com/ristela-reviews', label: 'HighYa, Ristela reviews' }],
    checked: '2026-11-10',
  },
  'p-kindra-v-relief-serum': {
    points: [
      'About 450 reviews on Kindra’s site average 4.8 of 5. Reviewers say it eased dryness, itching and burning quickly and made sex less painful, including after menopause, radiation or a hysterectomy.',
      'A few said it calmed itching but did not stop it, and that it only works with steady use.',
    ],
    caveat: BRAND_SITE,
    sources: [{ url: 'https://ourkindra.com/products/v-relief-serum', label: 'Kindra, V Relief Serum reviews' }],
    checked: '2026-11-10',
  },
  'p-kindra-boric-acid-suppositories': {
    points: ['Only 4 reviews (4.5 of 5) on Kindra’s site: easy to insert, dissolves without mess, helped with odor and dryness. No complaints listed.'],
    caveat: BRAND_SITE,
    sources: [{ url: 'https://ourkindra.com/products/boric-acid-suppositories-30-counts', label: 'Kindra, Boric Acid Suppositories reviews' }],
    checked: '2026-11-10',
  },
  'p-kindra-v-lube-water-based-lubricant': {
    points: [
      '14 reviews (4.8 of 5) on Kindra’s site: silky, not sticky, no irritation for sensitive skin, no taste or smell, easy to wash off.',
      'One wished it lasted longer before reapplying.',
    ],
    caveat: BRAND_SITE,
    sources: [{ url: 'https://ourkindra.com/products/v-lube-water-based-lubricant', label: 'Kindra, Water-Based V Lube reviews' }],
    checked: '2026-11-10',
  },
  'p-kindra-v-lube-silicone-lubricant': {
    points: ['About 135 reviews (4.8 of 5) on Kindra’s site: smooth, long-lasting, unscented, no stinging, and some say it helps with painful sex.'],
    caveat: BRAND_SITE,
    sources: [{ url: 'https://ourkindra.com/products/v-lube?variant=40865341702224', label: 'Kindra, Silicone V Lube reviews' }],
    checked: '2026-11-10',
  },
  'p-womaness-coco-bliss-external-vaginal-moisturizer': {
    points: ['Reviews on Womaness’s site call it silky and gentle with a pleasant scent that lasts all day; some also use it as a lubricant or on dry elbows and heels.'],
    caveat: PICKED,
    sources: [{ url: 'https://womaness.com/collections/light-leakage-vaginal-dryness/products/coco-bliss', label: 'Womaness, Coco Bliss' }],
    checked: '2026-11-10',
  },
  'p-womaness-daily-v-soothe': {
    points: ['Three reviews on Womaness’s site say it eased long-standing dryness, itching and painful sex, with one use lasting the day.'],
    caveat: PICKED,
    sources: [{ url: 'https://womaness.com/collections/light-leakage-vaginal-dryness/products/daily-v-soothe', label: 'Womaness, Daily V Soothe' }],
    checked: '2026-11-10',
  },
  'p-womaness-melt-for-you-vaginal-inserts': {
    points: ['Womaness shows one 5-star review, from a customer who said she feels normal again after using it.'],
    caveat: PICKED,
    sources: [{ url: 'https://womaness.com/collections/light-leakage-vaginal-dryness/products/melt-for-you', label: 'Womaness, Melt For You' }],
    checked: '2026-11-10',
  },
  'p-stripes-vag-of-honor-vaginal-moisturizer': {
    points: [
      'Several hundred reviews on Stripes’s site average about 4.2 of 5, and 76% would recommend it. Reviewers say a little goes a long way and it isn’t greasy.',
      'About 1 in 12 reviews are 1 or 2 stars, but the site doesn’t show what they say.',
    ],
    caveat: BRAND_SITE,
    sources: [{ url: 'https://stripesbeauty.com/products/vag-of-honor', label: 'Stripes, Vag of Honor reviews' }],
    checked: '2026-11-10',
  },
  'p-stripes-oh-my-glide-intimate-play-oil': {
    points: ['Stripes’s site shows 4.3 of 5 from 365 reviews, with 82% recommending it, but the written reviews shown there are for a different Stripes oil, so we can’t say what people think of this one.'],
    caveat: BRAND_SITE,
    sources: [{ url: 'https://stripesbeauty.com/products/oh-my-glide', label: 'Stripes, Oh My Glide' }],
    checked: '2026-11-10',
  },
  'p-vella-meltwater-vaginal-emollient': {
    points: [
      '82 reviews (4.9 of 5) on Vella’s site call it soothing, cooling and natural-feeling, with no urinary irritation.',
      'One said it doesn’t last long.',
    ],
    caveat: BRAND_SITE,
    sources: [{ url: 'https://vellabio.com/products/water-based-lube', label: 'Vella, Meltwater reviews' }],
    checked: '2026-11-10',
  },
  'p-vella-everslide-personal-lubricant': {
    points: [
      'About 130 reviews (4.9 of 5) on Vella’s site: light but long-lasting, not greasy or sticky, feels natural.',
      'One reviewer preferred the old tube packaging.',
    ],
    caveat: BRAND_SITE,
    sources: [{ url: 'https://vellabio.com/products/lube-for-women', label: 'Vella, Everslide reviews' }],
    checked: '2026-11-10',
  },
  'p-joylux-lets-spin': {
    points: [
      '121 Ulta reviews average 4.4 of 5. Reviewers say it eased discomfort during sex, glides smoothly without being sticky, and suits sensitive skin.',
      'Complaints: one said it dried up within seconds, another that the bottle holds only a few uses for the price.',
    ],
    caveat: 'Ulta shows only a few of the 121 reviews in full.',
    sources: [{ url: 'https://www.ulta.com/p/lets-spin-intimacy-gel-pimprod2048511?sku=2643331', label: 'Ulta, Let’s Spin reviews' }, JOYLUX_TP],
    checked: '2026-11-10',
  },
  'p-joylux-reliefher': {
    points: ['One verified LovelySkin buyer called the melts very soothing and convenient. No other public reviews were found.'],
    caveat: JOYLUX_CAVEAT,
    sources: [{ url: 'https://www.lovelyskin.com/o/joylux-reliefher-vaginal-hydration-melts', label: 'LovelySkin, reliefHER' }, JOYLUX_TP],
    checked: '2026-11-10',
  },
  'p-joylux-juicy-like-a-peach': {
    points: ['No public customer reviews of this gel were found. Joylux’s page shows only its own survey numbers, with no sample size.'],
    caveat: JOYLUX_CAVEAT,
    sources: [JOYLUX_TP],
    checked: '2026-11-10',
  },
  'p-perelel-prenatal-pack-1st-2nd-3rd-trimester': {
    points: [
      'Healthline reports reviews are mostly positive: people like one daily pack, and some say the ginger helped with nausea.',
      'Less happy reviewers mention a fishy taste or smell, the price, and too many pills to keep down.',
    ],
    caveat: 'Healthline summarizes reviews posted on Perelel’s own site and may earn a commission.',
    sources: [PERELEL_HL],
    checked: '2026-11-10',
  },
  'p-perelel-conception-support-pack': {
    points: ['One Thingtesting reviewer said it is on par with other conception supplements they tried, but the separate daily packets create waste.', PERELEL_BRAND],
    caveat: 'Only a handful of public reviews.',
    sources: [PERELEL_TT, PERELEL_HL],
    checked: '2026-11-10',
  },
  'p-perelel-perimenopause-support-pack': {
    points: ['No public reviews of the Perimenopause Support Pack itself were found.', PERELEL_BRAND],
    sources: [PERELEL_HL, PERELEL_TT],
    checked: '2026-11-10',
  },
  'p-perelel-hormonal-balance-support': {
    points: ['No public reviews of the Hormonal Balance Support itself were found.', PERELEL_BRAND],
    sources: [PERELEL_HL, PERELEL_TT],
    checked: '2026-11-10',
  },
  'p-perelel-fertility-support': {
    points: ['No public reviews of the Fertility+ Support itself were found.', PERELEL_BRAND],
    sources: [PERELEL_HL, PERELEL_TT],
    checked: '2026-11-10',
  },
  'p-perelel-mom-multi-support-pack': {
    points: ['No public reviews of the Mom Multi Support Pack itself were found.', PERELEL_BRAND],
    sources: [PERELEL_HL, PERELEL_TT],
    checked: '2026-11-10',
  },
  'p-perelel-daily-iron-ease': {
    points: ['No public reviews of the Daily Iron Ease itself were found.', PERELEL_BRAND],
    sources: [PERELEL_HL, PERELEL_TT],
    checked: '2026-11-10',
  },
  'd-caria-caria-menopause-midlife': {
    points: [
      '4.6 of 5 from about 1,400 App Store ratings. Reviewers like the supportive community, symptom and trigger tracking, short breathing exercises and the amount of information.',
      'One wanted a calendar view to spot symptom patterns.',
    ],
    caveat: APP_STORE,
    sources: [{ url: 'https://apps.apple.com/us/app/id1477621356', label: 'App Store, Caria' }],
    checked: '2026-11-10',
  },
  'd-health-her-health-her-app': {
    points: [
      '4.7 of 5 from about 950 App Store ratings. Reviewers say it helps them understand menopause changes, with practical tips and tracking that works without a period.',
      'Complaints: no good option after a hysterectomy or ablation, few symptom and trigger choices, and no custom entries.',
    ],
    caveat: APP_STORE,
    sources: [{ url: 'https://apps.apple.com/us/app/id1519199698', label: 'App Store, Health & Her' }],
    checked: '2026-11-10',
  },
  'd-stella-stella-menopause-relief': {
    points: ['4.6 of 5 from only 20 App Store ratings, with no written reviews shown.'],
    sources: [{ url: 'https://apps.apple.com/us/app/id1577904186', label: 'App Store, Stella' }],
    checked: '2026-11-10',
  },
  'd-perry-perry-perimenopause-community': {
    points: ['4.9 of 5 from about 240 App Store ratings. Reviewers say the community makes them feel less alone, and like the expert videos, live streams and humor.'],
    caveat: APP_STORE,
    sources: [{ url: 'https://apps.apple.com/us/app/id1544428724', label: 'App Store, perry' }],
    checked: '2026-11-10',
  },
  'd-menolog-listed-as-menelle-perimenopause-tracker': {
    points: ['4.8 of 5 from about 200 App Store ratings. The one written review shown calls it a nice app but wants to add several medications at once.'],
    caveat: APP_STORE,
    sources: [{ url: 'https://apps.apple.com/us/app/id6757102221', label: 'App Store, Menelle' }],
    checked: '2026-11-10',
  },
  'd-function-health-function-health-membership': {
    points: [
      'About 3,100 Trustpilot reviews average 4.5 of 5. Reviewers praise easy booking and blood draws, thorough testing, clear explanations and quick results.',
      'One said the mid-year retest added little. Trustpilot’s summary notes some found staff slow to reach.',
    ],
    caveat: 'Function Health invites customers to review on Trustpilot.',
    sources: [{ url: 'https://ca.trustpilot.com/review/functionhealth.com', label: 'Trustpilot, Function Health' }],
    checked: '2026-11-10',
  },
  'd-twentyeight-health-birth-control-emergency-contr': {
    points: [
      'About 1,000 Trustpilot reviews average 4.5 of 5. Reviewers praise quick, helpful replies, easy online booking, insurance coverage and on-time refills.',
      'About 1 in 5 reviews are 1 star, mostly about late, wrong or missing refills, being passed between staff, and unexpected membership charges.',
    ],
    sources: [{ url: 'https://pl.trustpilot.com/review/twentyeighthealth.com', label: 'Trustpilot, Twentyeight Health' }],
    checked: '2026-11-10',
  },
  'd-lively-lively-period-tracker-cycle': {
    points: ['4.8 of 5 from about 23,000 App Store ratings. The App Store shows no written reviews to summarize.'],
    sources: [{ url: 'https://apps.apple.com/app/id6447674634', label: 'App Store, Lively' }],
    checked: '2026-11-10',
  },
  'p-finch-self-care-pet': {
    points: [
      '4.9 of 5 from about 770,000 App Store ratings. Reviewers say it makes small self-care steps feel easy, with no guilt for missed goals, and like the customization and breathing exercises.',
      'One wished it got more challenging over time. The free version is enough for some; Finch Plus adds more.',
    ],
    caveat: APP_STORE,
    sources: [{ url: 'https://apps.apple.com/us/app/id1528595748', label: 'App Store, Finch' }],
    checked: '2026-11-10',
  },
  'p-ten-percent-happier-happier-meditation-formerly-ten-percent-happier': {
    points: [
      'About 4.8 of 5 on the App Store (over 100,000 reviews) and 4.7 on Google Play, per ChoosingTherapy. Users like the relatable teachers, clear courses and challenges.',
      'The main complaint is price: the free version is very limited and only an annual plan is advertised.',
    ],
    caveat: 'Counts as reported by ChoosingTherapy, which may earn commissions.',
    sources: [{ url: 'https://www.choosingtherapy.com/happier-app-review/', label: 'ChoosingTherapy, Happier review' }],
    checked: '2026-11-10',
  },
  'p-embr-labs-embr-wave-2': {
    points: [
      'A blogger who has used it for over two years says pressing cool during a hot flash takes the edge off within seconds and helps her fall back asleep, but it doesn’t stop flashes or replace treatment. Many of her readers report the same.',
      'Common complaints: the price, sweat under the band, a 2 to 3 day battery, and hard-to-cancel monthly plans (Trustpilot, 6 reviews, half 1-star).',
    ],
    caveat: 'Embr gifted the blogger her Wave 2; she says the review was unpaid. Embr has only 6 Trustpilot reviews.',
    sources: [{ url: 'https://www.wardrobeoxygen.com/embr-wave-review/', label: 'Wardrobe Oxygen, Embr Wave after 2+ years' }, { url: 'https://uk.trustpilot.com/review/embrlabs.com', label: 'Trustpilot, Embr Labs' }],
    checked: '2026-11-10',
  },
  'p-bedjet-3-climate-comfort-sleep-system': {
    points: [
      '144 Trustpilot reviews average 4.3 of 5. Several say it ended or greatly reduced their night sweats, and they like the fast cooling and warming and quick warranty replacements.',
      'Complaints: a fan failing after a few years with no spare parts, cooling only about 10 degrees in a hot room, and slow refunds.',
    ],
    caveat: 'BedJet invites customers to review on Trustpilot.',
    sources: [{ url: 'https://ca.trustpilot.com/review/bedjet.com', label: 'Trustpilot, BedJet' }],
    checked: '2026-11-10',
  },
  'p-komuso-classic-shift-anxiety-breathing-necklace': {
    points: [
      '4.4 of 5 from 42 reviews on REVIEWS.io. Reviewers say slowing their breath through it helps them stay calm, and like the look and weight of the piece.',
      'Complaints were about shipping: no express option, and one overseas delivery took about seven weeks.',
    ],
    caveat: 'Some reviews are marked unverified.',
    sources: [{ url: 'https://www.reviews.io/product-reviews/store/komuso-design/41491349831845', label: 'REVIEWS.io, Komuso Classic Shift' }],
    checked: '2026-11-10',
  },
  'p-topicals-faded-brightening-clearing-serum-unscen': {
    points: [
      'About 800 Sephora UK reviews average 4.4 of 5. Many say it faded dark spots and acne marks, some within a week, and that it absorbs without feeling greasy.',
      'The most common complaint is a strong smell. Others found it drying near the eyes, or slow to work on stubborn dark marks.',
    ],
    caveat: 'These reviews may be of the original version, not the unscented one. Thingtesting reviews from Topicals ambassadors and influencers were left out.',
    sources: [{ url: 'https://www.sephora.co.uk/p/topicals-faded-brightening-and-clearing-serum-30ml', label: 'Sephora UK, Faded reviews' }, { url: 'https://thingtesting.com/brands/topicals/reviews?p=2', label: 'Thingtesting, Topicals reviews' }],
    checked: '2026-11-10',
  },
  'p-seeking-health-dao-enzyme-formerly-histamine-dig': {
    points: [
      'About 900 reviews on Seeking Health’s site average 4.8 of 5, and 97% would recommend it. Reviewers say it eased flushing, headaches and bloating after meals, and use it before eating out or high-histamine foods.',
      'The site’s summary mentions mixed results for some and the cost; the 1 and 2-star reviews aren’t shown.',
    ],
    caveat: `${BRAND_SITE} These are personal reports, not evidence it works.`,
    sources: [{ url: 'https://www.seekinghealth.com/products/dao-enzyme', label: 'Seeking Health, DAO Enzyme reviews' }],
    checked: '2026-11-10',
  },
  'p-o-positiv-uro-urinary-tract-health-capsules': {
    points: ['About 520 reviews on O Positiv’s site average 4.7 of 5. Reviewers say they’ve had fewer UTIs since starting it, some within about two weeks.'],
    caveat: `${BRAND_SITE} The site shows only a few of the reviews and no complaints. These are personal reports, not evidence it works.`,
    sources: [{ url: 'https://opositiv.com/products/uro-urinary-health-capsules', label: 'O Positiv, URO reviews' }],
    checked: '2026-11-10',
  },
  'p-hoolest-verelief-prime': {
    points: [
      '57 Trustpilot reviews average 4.2 of 5. Most say it helps them feel calmer during stress or panic, and a few say they sleep better.',
      'About 1 in 6 are 1 or 2 stars: it didn’t help, plus refund and return fees and slow customer service.',
    ],
    caveat: 'Personal reports, not evidence it works. Hoolest has not replied to negative reviews.',
    sources: [{ url: 'https://ca.trustpilot.com/review/hoolest.com', label: 'Trustpilot, Hoolest' }],
    checked: '2026-11-10',
  },
  'p-heraure-hermag-magnesium': {
    points: ['HerAuré’s site shows 4.8 of 5 from 96 reviews, but no written reviews to summarize.'],
    caveat: BRAND_SITE,
    sources: [{ url: 'https://heraure.com/products/hermag-magnesium-20-in-1-complex', label: 'HerAuré, HerMag' }],
    checked: '2026-11-10',
  },
  'p-popmask-big-hug-self-heating-patches': {
    points: ['Popmask shows three 5-star reviews from people who use the patches every period and say no one can tell they are wearing one.'],
    caveat: PICKED,
    sources: [{ url: 'https://us.popmasklondon.com/products/new-big-hug', label: 'Popmask, Big Hug' }],
    checked: '2026-11-10',
  },
  'p-cean-lymphatic-maternity-compression-romper': {
    points: ['Three 5-star reviews on CEAN’s site call it comfy and firm, flattering, and comfortable as the bump grows. None mention swelling.'],
    caveat: BRAND_SITE,
    sources: [{ url: 'https://cean.com/en-us/products/lymphatic-maternity-romper', label: 'CEAN, Maternity Romper' }],
    checked: '2026-11-10',
  },
  'p-visby-womens-sti-test': {
    points: ['Reviews on Visby’s site say the test was easy, about as simple as a COVID test, with quick results kept private in an app. One had a delay that support helped fix.'],
    caveat: PICKED,
    sources: [{ url: 'https://visby.com/products/visby-womens-at-home-sti-test-kit', label: 'Visby, Women’s STI Test' }],
    checked: '2026-11-10',
  },
  'p-hormona-perimenopause-test-kit-app': {
    points: ['Three verified buyers quoted on Hormona’s site call the test easy, with clear instructions and useful insights in the app.'],
    caveat: PICKED,
    sources: [{ url: 'https://www.hormona.io/products/perimenopause-test', label: 'Hormona, Perimenopause Test' }],
    checked: '2026-11-10',
  },
  'p-queen-of-the-thrones-ritual-starter-liver-castor': {
    points: [
      'About 5,300 reviews on the brand’s site, roughly 4.8 of 5. Reviewers say the pack is comfortable, much less messy than a homemade one, and easy to sleep in.',
      'Complaints: tight or itchy straps, smaller than expected, some oil seeping through, and one saw no change after a week.',
    ],
    caveat: `${BRAND_SITE} Some counted reviews are for related products.`,
    sources: [{ url: 'https://queenofthethrones.com/collections/castor-oil-kits-made-just-for-you/products/castor-oil-pack-and-500ml-oil-bundle', label: 'Queen of the Thrones, Ritual Starter reviews' }],
    checked: '2026-11-10',
  },
  'p-cool-jams-women-s-nightcool-v-neck-nightshirt': {
    points: ['240 reviews on Cool-jams’s site average 4.6 of 5. Reviewers call it soft and airy and say it doesn’t twist in sleep. The 12 low ratings aren’t shown in text.'],
    caveat: BRAND_SITE,
    sources: [{ url: 'https://www.cool-jams.com/products/womens-cooling-moisture-wicking-v-neck-nightshirt', label: 'Cool-jams, NightCool nightshirt reviews' }],
    checked: '2026-11-10',
  },
  'p-buni-bundle': {
    points: [
      '250 reviews on BUNI’s site average 4.9 of 5. Reviewers say the balm eased dryness and sore nipples, absorbs fast with little scent, and that scars looked flatter over weeks.',
      'The main complaint is price, and several say results took 6 to 8 weeks.',
    ],
    caveat: `${BRAND_SITE} Intimate products can’t be returned.`,
    sources: [{ url: 'https://www.bunibody.com/products/buni-bundle?ref=oxaevspm', label: 'BUNI, Bundle reviews' }],
    checked: '2026-11-10',
  },
  'p-mypelvicbra-waistband-extenders': {
    points: [
      'Six reviews on the brand’s site (about 4.8 of 5) say the extenders add comfort and an easier fit without losing support.',
      'One asked for a design that suits fuller figures.',
    ],
    caveat: BRAND_SITE,
    sources: [{ url: 'https://www.mypelvicbra.shop/products/waistband-extenders', label: 'My Pelvic Bra, Waistband Extenders' }],
    checked: '2026-11-10',
  },
};

/**
 * Checked on Nov 10 and found nothing ayna could read and trust: no reviews, only a count with no
 * text, testimonials with no source, pages that block reading, or copycat listing sites.
 */
export const NO_TRUSTED_REVIEWS = [
  'p-oboo-woosh-warming-wand', 'p-oboo-nook', 'p-oboo-smooch', 'p-oboo-woo', 'p-oboo-shoop', 'p-oboo-moon', 'p-oboo-oooh',
  'p-oboo-groove', 'p-oboo-boom', 'p-oboo-smooth-daily', 'p-oboo-smooth-arousal', 'p-oboo-loob-daily', 'p-oboo-loob-arousal',
  'p-oboo-mood-drops', 'p-oboo-cool-spray', 'p-joylux-ilyeo-body', 'p-bonafide-clairvee-vaginal-pre-probiotic',
  'p-natures-bounty-d3-125mcg', 'p-thorne-berberine', 'p-thorne-5-mthf-1-mg', 'p-micro-ingredients-myo-d-chiro-inositol-powder',
  'p-gina-insertion-applicator-refills', 'p-sootheher-elaris-pod', 'p-sootheher-gel-pad-refills', 'p-lim-method-kneeling-pad',
  'p-softdisc', 'p-portable-heating', 'p-happyhead-hair-growth-supplements', 'p-resa-rhythm-bracelet',
];
const NONE_SET = new Set(NO_TRUSTED_REVIEWS);

export function onlineReviewsFor(id) {
  const r = ONLINE_REVIEWS[id];
  if (r && r.points?.length) return r;
  if (NONE_SET.has(id)) return { none: true, points: [], sources: [], checked: '2026-11-10' };
  return null;
}
