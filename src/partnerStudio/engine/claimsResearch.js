/**
 * Claim research for Health Claim Benchmarking: claims quoted from each
 * product's own page, with what the page cites behind each one.
 *
 * "backing" describes what the page itself offers, never whether the claim is
 * true:
 *   product_study    a study of this product is described on the page
 *   ingredient_study the page cites published research on an ingredient, not this product
 *   unnamed_study    the page refers to studies or testing but names none
 *   none             no source given
 *
 * Checked by hand from the live product pages on the date shown. A brand not
 * listed here has not been researched yet; the page says so instead of guessing.
 */
export const CHECKED = '2026-11-27';

export const BACKING = {
  product_study: { label: 'Study of this product described', short: 'Product study' },
  ingredient_study: { label: 'Ingredient research cited (not this product)', short: 'Ingredient research' },
  unnamed_study: { label: 'Refers to studies, names none', short: 'Unnamed study' },
  none: { label: 'No source given', short: 'No source' },
};

export const TOPICS = {
  dryness: 'Dryness and hydration',
  irritation: 'Itch, irritation and soothing',
  ph_odor: 'pH and odor',
  microbiome: 'Microbiome and good bacteria',
  intimacy: 'Comfort during sex',
  safety: 'Safety and testing',
  clinical: '“Clinically” wording',
};

const NEY = 'https://helloneycher.com/products';
const ALU = 'https://alubri.com/products';

export const PRODUCTS = [
  {
    sku: 'p-neycher-vaginal-moisturizer', brand: 'Neycher', name: 'Neycher Vaginal Moisturizer', url: `${NEY}/vaginal-moisturizer`, price: 35.97, format: '10 suppositories',
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
    sku: 'p-neycher-odor-be-gone', brand: 'Neycher', name: 'Neycher Odor Be Gone', url: `${NEY}/odor-be-gone`, price: 35.97, format: '10 suppositories',
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
    sku: 'p-neycher-hydrobloom-gel', brand: 'Neycher', name: 'Neycher HydroBloom Moisturizing Gel', url: `${NEY}/hydrobloom-moisturizing-gel`, price: 25.97, format: 'Gel',
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
    sku: 'p-alubri-vaginal-moisturizing-gel', brand: 'Alubri', name: 'Alubri Vaginal Moisturizing Gel', url: `${ALU}/vaginal-moisturizing-gel`, price: 29.99, format: 'Gel with applicators',
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
    sku: 'p-alubri-calming-cream', brand: 'Alubri', name: 'Alubri Calming Cream', url: `${ALU}/calming-cream`, price: 29.99, format: 'Cream (0.25% hydrocortisone, OTC)',
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
    sku: 'p-alubri-intimate-serum', brand: 'Alubri', name: 'Alubri Intimate Serum', url: `${ALU}/intimate-serum`, price: 24.99, format: 'Serum',
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
    sku: 'p-oboo-smooth-daily', brand: 'Oboo', name: 'Smooth Daily Vulva Balm', url: 'https://oboo.love/products/smooth-daily-vulva-balm', price: 36, format: 'Balm',
    study: null,
    claims: [
      { text: 'Everyday support for dryness, sensitivity, and discomfort', topic: 'dryness', backing: 'none' },
      { text: 'Locks in hydration with botanical butters and oils', topic: 'dryness', backing: 'none' },
      { text: 'Calms redness, irritation, and flare-ups', topic: 'irritation', backing: 'none' },
      { text: 'No added hormones', topic: 'safety', backing: 'none' },
      { text: '100 percent natural and organic', topic: 'safety', backing: 'none', note: 'No certification named.' },
    ],
  },
];

export const researchedBrands = () => [...new Set(PRODUCTS.map((p) => p.brand))];
export const productsOf = (brand) => PRODUCTS.filter((p) => p.brand === brand);
