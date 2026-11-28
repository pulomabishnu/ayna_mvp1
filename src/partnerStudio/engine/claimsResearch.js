/**
 * Claim research for Health Claim Benchmarking: claims quoted from each
 * product's own page, with what the page cites behind each one.
 *
 * "backing" describes what the page itself offers, never whether the claim is
 * true:
 *   product_study    a study of this product is described on the page
 *   ingredient_study the page cites published research on an ingredient or method, not this product
 *   unnamed_study    the page refers to studies, testing or experts but names none
 *   none             no source given
 *
 * Checked by hand from the live product pages on the date shown. A brand not
 * listed here has not been researched yet; the page says so instead of guessing.
 * A line is only credited to a source the page ties to it. `where` notes when a
 * claim sits somewhere other than the visible product copy. Products are only
 * compared within the same Phase 1 category.
 *
 * Pilot brands (team sync, Nov 25 2026): GoodCycle, LiM Method, Neycher, BUNI.
 */
export const CHECKED = '2026-11-27';

export const BACKING = {
  product_study: { label: 'Study of this product described', short: 'Product study' },
  ingredient_study: { label: 'Research on an ingredient or method cited (not this product)', short: 'Ingredient or method research' },
  unnamed_study: { label: 'Refers to studies, testing or experts, names none', short: 'Unnamed source' },
  none: { label: 'No source given', short: 'No source' },
};

export const TOPICS = {
  dryness: 'Dryness and hydration',
  irritation: 'Itch, irritation and soothing',
  ph_odor: 'pH and odor',
  microbiome: 'Microbiome and good bacteria',
  intimacy: 'Comfort during sex',
  pms: 'PMS, cramps and cycle support',
  pelvic_floor: 'Pelvic floor strength and bladder control',
  pregnancy: 'Pregnancy and postpartum',
  safety: 'Safety and testing',
  experts: 'Doctor or expert backing',
  clinical: '“Clinically” and “science” wording',
  accuracy: 'Listing accuracy',
};

const NEY = 'https://helloneycher.com/products';
const ALU = 'https://alubri.com/products';

export const PRODUCTS = [
  {
    sku: 'p-neycher-vaginal-moisturizer', category: 'intimate-care', brand: 'Neycher', name: 'Neycher Vaginal Moisturizer', url: `${NEY}/vaginal-moisturizer`, price: 35.97, format: '10 suppositories',
    study: 'Page describes a 20-woman, about 1-month, non-randomized, uncontrolled study funded by the brand (ref. FT.CE.110, PDF linked).',
    claims: [
      { text: 'Lasting relief from vaginal dryness and the discomfort it brings, including during sex.', topic: 'dryness', backing: 'none', note: 'The page doesn’t tie this line to its study.' },
      { text: '90% reported improved hydration', topic: 'dryness', backing: 'product_study', note: '20-woman uncontrolled study; dryness 12 to 1 of 20.' },
      { text: '100% no longer reported burning and stinging', topic: 'irritation', backing: 'product_study', note: '20-woman uncontrolled study; 12 to 0.' },
      { text: '89% reported dryness during intimacy improvement', topic: 'intimacy', backing: 'product_study', note: '20-woman uncontrolled study; 11 to 1.' },
      { text: 'Hyaluronic acid relieves vaginal dryness as effectively as vaginal estrogen, without hormones.', topic: 'dryness', backing: 'ingredient_study', source: { label: 'dos Santos et al., J Sex Med 2021', url: 'https://doi.org/10.1016/j.jsxm.2020.10.016' }, note: 'Systematic review of hyaluronic acid in general.' },
      { text: 'Lactic acid keeps the vagina at its naturally acidic, protective pH.', topic: 'ph_odor', backing: 'ingredient_study', source: { label: 'Tachedjian et al., Res Microbiol 2017', url: 'https://doi.org/10.1016/j.resmic.2017.04.001' } },
      { text: 'Matched to your natural vaginal pH.', topic: 'ph_odor', backing: 'none' },
      { text: 'Supports vaginal renewal over time.', topic: 'dryness', backing: 'none' },
      { text: 'Biocompatibility-tested, non-irritating, and non-sensitizing.', topic: 'safety', backing: 'unnamed_study', note: 'No test report named.' },
      { text: 'Clinically recommended.', topic: 'clinical', backing: 'none', note: 'No clinician or guideline named.' },
      { text: 'Clinically studied.', topic: 'clinical', backing: 'product_study', note: 'Refers to the 20-woman study.' },
    ],
  },
  {
    sku: 'p-neycher-odor-be-gone', category: 'intimate-care', brand: 'Neycher', name: 'Neycher Odor Be Gone', url: `${NEY}/odor-be-gone`, price: 35.97, format: '10 suppositories',
    study: null,
    claims: [
      { text: 'Controls odor, soothes discomfort, supports healthy pH.', topic: 'ph_odor', backing: 'none' },
      { text: 'Multi-action freshness for odor, pH, and yeast balance.', topic: 'ph_odor', backing: 'none' },
      { text: 'It targets odor and brings your pH back into balance from the first use', topic: 'ph_odor', backing: 'none' },
      { text: 'Many women feel fresher within hours, with the full effect over the first one to three days.', topic: 'ph_odor', backing: 'none' },
      { text: 'We use 300 mg of boric acid, half the 600 mg standard in most boric acid products, so it is gentler from the start.', topic: 'safety', backing: 'none', note: 'The 600 mg standard is not sourced.' },
      { text: 'Deep hydration that lasts', topic: 'dryness', backing: 'none' },
      { text: 'Hormone-free and non-irritating.', topic: 'safety', backing: 'none' },
      { text: 'Biocompatibility-tested.', topic: 'safety', backing: 'unnamed_study', note: 'No test report named.' },
      { text: 'Clinically recommended', topic: 'clinical', backing: 'none', note: 'No clinician or guideline named.' },
      { text: 'Clinically recognized ingredients that fully support vaginal health.', topic: 'clinical', backing: 'unnamed_study', note: 'Page says “all studied ingredients” but names no studies.' },
    ],
  },
  {
    sku: 'p-neycher-hydrobloom-gel', category: 'intimate-care', brand: 'Neycher', name: 'Neycher HydroBloom Moisturizing Gel', url: `${NEY}/hydrobloom-moisturizing-gel`, price: 25.97, format: 'Gel',
    study: null,
    claims: [
      { text: 'Lasting hydration, inside and out', topic: 'dryness', backing: 'none' },
      { text: 'Hyaluronic acid draws in lasting moisture', topic: 'dryness', backing: 'ingredient_study', source: { label: 'dos Santos et al., J Sex Med 2021', url: 'https://doi.org/10.1016/j.jsxm.2020.10.016' }, note: 'Review of hyaluronic acid in general.' },
      { text: 'Aloe vera relieves vaginal dryness as effectively as estrogen, without hormones.', topic: 'dryness', backing: 'ingredient_study', source: { label: 'Poordast et al., J Ethnopharmacol 2020', url: 'https://doi.org/10.1016/j.jep.2020.113760' }, note: 'Trial of an aloe vaginal cream, not this gel.' },
      { text: 'Calming relief for sensitive skin', topic: 'irritation', backing: 'none' },
      { text: 'Calendula calms sensitive skin and supports its natural recovery.', topic: 'irritation', backing: 'ingredient_study', source: { label: 'De Angelis et al., J Matern Fetal Neonatal Med 2020', url: 'https://doi.org/10.1080/14767058.2020.1770219' }, note: 'Trial on perineal healing.' },
      { text: 'Balanced pH for freshness and odor control', topic: 'ph_odor', backing: 'none' },
      { text: 'Biocompatibility-tested, non-irritating, and non-sensitizing.', topic: 'safety', backing: 'unnamed_study', note: 'No test report named.' },
      { text: 'Clinically recognized ingredients that fully support vaginal health.', topic: 'clinical', backing: 'unnamed_study' },
    ],
  },
  {
    sku: 'p-alubri-vaginal-moisturizing-gel', category: 'intimate-care', brand: 'Alubri', name: 'Alubri Vaginal Moisturizing Gel', url: `${ALU}/vaginal-moisturizing-gel`, price: 29.99, format: 'Gel with applicators',
    study: 'Page footnotes an independent, IRB-approved study of 51 menopausal women, twice weekly for one month. No name or link.',
    claims: [
      { text: 'Clinically proven internal vaginal moisturizer with up to 72 hours of hydration.', topic: 'dryness', backing: 'product_study', note: '51-woman study footnoted, not named or linked.' },
      { text: 'A single application demonstrated a 64% increase in vaginal hydration at 72 hours.', topic: 'dryness', backing: 'product_study', note: 'Footnoted study is multi-week; single-application source not stated.' },
      { text: '94% said their vagina feels moisturized.', topic: 'dryness', backing: 'product_study', note: 'Self-reported, same unnamed study.' },
      { text: 'It’s also proven to balance the vaginal microbiome.', topic: 'microbiome', backing: 'unnamed_study' },
      { text: 'Supporting Lactobacillus may help protect against recurrent infections, bacterial vaginosis, and/or imbalance.', topic: 'microbiome', backing: 'none' },
      { text: 'Dermatologist and gynecologist tested, non-irritating, and safe for sensitive skin.', topic: 'safety', backing: 'unnamed_study', note: 'No testing body named.' },
      { text: 'Clinically proven', topic: 'clinical', backing: 'product_study', note: 'Unnamed 51-woman study.' },
    ],
  },
  {
    sku: 'p-alubri-calming-cream', category: 'intimate-care', brand: 'Alubri', name: 'Alubri Calming Cream', url: `${ALU}/calming-cream`, price: 29.99, format: 'Cream (0.25% hydrocortisone, OTC)',
    study: 'Page describes an independent, third-party study of 53 women over 24 hours (self-reported). No name or link.',
    claims: [
      { text: 'Immediately relieves itching and irritation.', topic: 'irritation', backing: 'none' },
      { text: '94% said skin feels soothed.', topic: 'irritation', backing: 'product_study', note: '53-woman, 24-hour, self-reported.' },
      { text: '96% said skin felt nourished and conditioned.', topic: 'dryness', backing: 'product_study', note: '53-woman, 24-hour, self-reported.' },
      { text: 'In studies, it increased Lactobacillus (good bacteria) and decreased Gardnerella vaginalis (bad bacteria).', topic: 'microbiome', backing: 'unnamed_study' },
      { text: 'Hypoallergenic, non-irritating, and safe for sensitive skin.', topic: 'safety', backing: 'none' },
      { text: 'Clinically proven', topic: 'clinical', backing: 'unnamed_study', note: 'Not tied to a named study.' },
    ],
  },
  {
    sku: 'p-alubri-intimate-serum', category: 'intimate-care', brand: 'Alubri', name: 'Alubri Intimate Serum', url: `${ALU}/intimate-serum`, price: 24.99, format: 'Serum',
    study: 'Page footnotes an IRB-approved study (gravimetric hydration) and a 50-woman, 2-week perception study. No name or link.',
    claims: [
      { text: 'Instantly delivers a 152% increase in vulvar hydration', topic: 'dryness', backing: 'product_study', note: 'Footnote says measured 72 hours after one application.' },
      { text: '94% said skin felt hydrated', topic: 'dryness', backing: 'product_study', note: '50-woman, 2-week, self-reported.' },
      { text: '90% said skin felt soothed and nourished', topic: 'irritation', backing: 'product_study', note: '50-woman, 2-week, self-reported.' },
      { text: 'Restores your skin’s natural moisture barrier, improving intimate comfort and confidence.', topic: 'intimacy', backing: 'none' },
      { text: 'Inulin helps promote a healthy microbiome', topic: 'microbiome', backing: 'none' },
      { text: 'Clinically proven', topic: 'clinical', backing: 'product_study', note: 'Unnamed footnoted studies.' },
    ],
  },
  {
    sku: 'p-oboo-smooth-daily', category: 'intimate-care', brand: 'Oboo', name: 'Smooth Daily Vulva Balm', url: 'https://oboo.love/products/smooth-daily-vulva-balm', price: 36, format: 'Balm',
    study: null,
    claims: [
      { text: 'Everyday support for dryness, sensitivity, and discomfort', topic: 'dryness', backing: 'none' },
      { text: 'Locks in hydration with botanical butters and oils', topic: 'dryness', backing: 'none' },
      { text: 'Calms redness, irritation, and flare-ups', topic: 'irritation', backing: 'none' },
      { text: 'No added hormones', topic: 'safety', backing: 'none' },
      { text: '100 percent natural and organic', topic: 'safety', backing: 'none', note: 'No certification named.' },
    ],
  },
  {
    sku: 'p-buni-rejuvenate-vulva-balm', category: 'intimate-care', brand: 'BUNI', name: 'BUNI REJUVENATE Vulva Balm', url: 'https://www.bunibody.com/products/buni-vulva-balm', price: 42.9, format: '1.7 oz airless pump',
    study: null,
    claims: [
      { text: 'Relieves Dryness, Itching & Irritation', topic: 'irritation', backing: 'none' },
      { text: 'Comfort During Intimacy', topic: 'intimacy', backing: 'none' },
      { text: 'pH-Balanced Formula', topic: 'ph_odor', backing: 'none' },
      { text: 'Prevent Ingrown Hairs', topic: 'irritation', backing: 'none' },
      { text: 'Holds 1000x its weight in water.', topic: 'dryness', backing: 'none', note: 'About hyaluronic acid; no source given.' },
      { text: 'Safe for sensitive skin', topic: 'safety', backing: 'none' },
      { text: 'Developed by OB/GYNs and dermatologists with ingredients chosen for real results.', topic: 'experts', backing: 'unnamed_study', note: 'No doctor named.' },
      { text: 'Backed By Science', topic: 'clinical', backing: 'none', note: 'Section heading; no study or reference under it.' },
      { text: 'This scar treatment blends Retinyl Palmitate, Snail Secretion, organic oils and antioxidants', topic: 'accuracy', backing: 'none', where: 'Page metadata (search results and link previews)', note: 'Describes a scar treatment with ingredients that are not in this balm’s ingredient list. Looks copied from the scar oil.' },
    ],
  },
  {
    sku: 'p-goodcycle-dailybasis', category: 'period-care', brand: 'GoodCycle', name: 'DailyBasis by GoodCycle', url: 'https://takegoodcycle.com/products/daily-basis', price: 45, format: 'Daily powder stick packs (Replenish + Balance)',
    study: null,
    refs: { label: 'References page lists 45 nutrient and ingredient papers (for example magnesium and B6 for PMS, ginger for period pain), none on DailyBasis itself', url: 'https://takegoodcycle.com/pages/references' },
    claims: [
      { text: 'designed to support what the body needs most during each phase of the menstrual cycle.', topic: 'pms', backing: 'none', note: 'A separate References page lists 45 nutrient and ingredient papers; none is tied to this line and none studies DailyBasis.' },
      { text: 'Reduced Inflammation & PMS Symptom Relief*', topic: 'pms', backing: 'none', where: 'Science page' },
      { text: 'Deliver critical nutrients to ease common PMS symptoms through the latter half of your cycle.', topic: 'pms', backing: 'none', where: 'Science page' },
      { text: 'Replenish nutrients lost during menstruation and support healthy ovulation.', topic: 'pms', backing: 'none', where: 'Science page' },
      { text: 'Daily Energy & Mood Balance*', topic: 'pms', backing: 'none', where: 'Science page' },
      { text: '70% of menstruating women experience cycle-related nutrient deficiencies.', topic: 'pms', backing: 'none', where: 'Science page', note: 'No source for the 70% figure.' },
      { text: 'Nutrient deficiencies can cause hormonal imbalances, that increase the likelihood and severity of conditions like PMS, infertility, and diabetes.', topic: 'pms', backing: 'none', where: 'Science page' },
      { text: 'OBGYN Formulated', topic: 'experts', backing: 'unnamed_study', note: 'Badge. The page quotes Dr Miranda Naylor, DO, but does not say who formulated it.' },
      { text: '3rd Party Tested', topic: 'safety', backing: 'unnamed_study', note: 'No lab or results named.' },
    ],
  },
  {
    sku: 'p-flo-gummies', category: 'period-care', brand: 'FLO', name: 'FLO PMS Gummy Vitamins', url: 'https://opositiv.com/products/flo-pms-gummy-vitamins', price: 31.99, format: '60 gummies (30 days)',
    study: null,
    claims: [
      { text: 'for hormonal breakouts, bloating, and cramps*', topic: 'pms', backing: 'none' },
      { text: 'The tasty, scientifically-designed vitamin for PMS.*', topic: 'clinical', backing: 'none' },
      { text: 'Chasteberry has been shown to promote healthy hormone levels to help smooth out mood swings', topic: 'pms', backing: 'unnamed_study', note: '“Has been shown”, no study named.' },
      { text: 'research has found that vitamin B6 may play a key role in relieving the emotional effects of PMS.', topic: 'pms', backing: 'unnamed_study', note: 'No study named.' },
      { text: 'Lemon balm is best known for its calming qualities and has been traditionally used for cramp relief', topic: 'pms', backing: 'none', note: 'Traditional-use wording.' },
      { text: 'We recommend 2-3 months of consistent daily use for best results.*', topic: 'pms', backing: 'none' },
    ],
  },
  {
    sku: 'p-lim-method-bundle', category: 'bladder-pelvic', brand: 'LiM Method', name: 'The LiM Bundle', url: 'https://www.limmethod.com/products/the-lim-bundle-2', price: 199.95, format: 'Sliding board, mat, accessories + 7 video sessions',
    refs: { label: 'Citations page lists 2 trials of pelvic floor exercise in pregnancy and 1 clinic page, none on LiM itself', url: 'https://www.limmethod.com/pages/citations' },
    study: 'Citations page mentions a 2025 consumer survey run by the company (98% said they felt more educated about connecting to their pelvic floor). Not peer reviewed and not about outcomes.',
    claims: [
      { text: 'Research shows that training the pelvic floor muscles before pregnancy', topic: 'pregnancy', backing: 'ingredient_study', source: { label: 'Szumilewicz et al., Front Physiol 2019', url: 'https://doi.org/10.3389/fphys.2018.01867' }, note: 'Sentence continues on the page. Its Citations page lists trials of pelvic floor exercise in pregnancy, not of LiM.' },
      { text: 'Properly exercising the pelvic floor throughout pregnancy can contribute to smoother labor and fewer postpartum complications', topic: 'pregnancy', backing: 'none' },
      { text: 'With consistent practice, common pelvic floor-related concerns like incontinence and painful sex can heal', topic: 'pelvic_floor', backing: 'none', note: 'Treatment outcome claim with no source.' },
      { text: 'Targets all layers of pelvic floor muscles', topic: 'pelvic_floor', backing: 'none', where: 'Comparison table' },
      { text: 'Both preventative & reactive', topic: 'pelvic_floor', backing: 'none', where: 'Comparison table' },
      { text: 'Working in this position will create stability in your pelvic floor muscles, core, and lower body.', topic: 'pelvic_floor', backing: 'none' },
      { text: 'Natural & non-invasive (no inserts needed, low risk)', topic: 'safety', backing: 'none', where: 'Comparison table' },
    ],
  },
  {
    sku: 'p-elvie-trainer', category: 'bladder-pelvic', brand: 'Elvie', name: 'Elvie Trainer', url: 'https://www.elvie.com/en-us/shop/elvie-trainer', price: 199, format: 'Insertable sensor + app (biofeedback)',
    study: null,
    claims: [
      { text: 'the gold standard of Kegel training', topic: 'pelvic_floor', backing: 'none', note: 'Refers to biofeedback; no source on the page.' },
      { text: 'Take charge of your pelvic floor with expert-designed care from home.', topic: 'experts', backing: 'unnamed_study', note: 'No expert named on this page.' },
      { text: 'award-winning Kegel trainer designed to make pelvic floor exercises effective and fun.', topic: 'pelvic_floor', backing: 'none', where: 'Page metadata (search results and link previews)' },
      { text: 'completely covered in medical grade silicone with no exposed parts, so it is safe to use with the coil or IUD.', topic: 'safety', backing: 'none', where: 'FAQ' },
    ],
  },
];

export const researchedBrands = () => [...new Set(PRODUCTS.map((p) => p.brand))];
export const productsOf = (brand) => PRODUCTS.filter((p) => p.brand === brand);
/** Researched products from other brands in the same category, for comparison. */
export const rivalsOf = (product) => PRODUCTS.filter((p) => p.brand !== product.brand && p.category === product.category);
