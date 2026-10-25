// Research pass 6 (Oct 25 2026): pregnancy and breastfeeding facts for the
// products that were held back for missing product data (scratchpad holds.csv).
// Each fact is what the source says, quoted, with its URL and the date checked.
// stage_status is the reviewer's reading of that sentence: 'caution' for
// "consult / ask your doctor before use if pregnant or breastfeeding",
// 'ok' only from a .gov source that says so (src/matching/productProfile.js).
// A source that says nothing is NOT recorded: the fact stays unknown, never "safe".
//
// Checked and silent (left unknown on purpose):
//   p-oboo-cool-spray, p-oboo-loob-daily, p-oboo-loob-arousal: oboo.love product
//     pages and the Peri-Me-Oh-My kit page have no pregnancy or breastfeeding
//     statement (checked 2026-10-25).
//   p-cbb-13-in-1-womens-gummies: the product is not on curvybodybears.com's
//     own pages we could reach; retailers are not an allowed source.
//   p-metamucil-psyllium-orange (pregnancy, brand): metamucil.com label and both
//     FAQ pages say nothing about pregnancy; the .gov fact below is used instead.

const D = '2026-10-25';
const NEXT = '2027-04-23';
const BY = 'ayna research pass (AI-assisted), needs human sign-off';

/** One sourced fact: the quote, where it came from, and the reviewer's reading. */
const f = (value, source, source_url, source_type, stage_status) => ({ value, source, source_url, source_type, stage_status, verified_at: D });
const head = (notes) => ({ qa_status: 'in_review', reviewed_by: BY, reviewed_at: D, last_checked: D, next_review_due: NEXT, notes });

const MEDLINE_PSYLLIUM = 'https://medlineplus.gov/druginfo/meds/a601104.html';
const LACTMED_B6 = 'https://www.ncbi.nlm.nih.gov/sites/books/NBK593298/';

export default {
  'p-arrae-mb-1': {
    ...head('Brand MB-1 guide FAQ.'),
    facts: {
      'safety.pregnancy': f('Brand FAQ: "It’s best to consult your healthcare provider if you are pregnant or breastfeeding."', 'Arrae: The Complete Guide to MB-1 (FAQ)', 'https://www.arrae.com/blogs/arrae-journal/the-complete-guide-to-mb-1-everything-you-need-to-know', 'brand', 'caution'),
      'safety.breastfeeding': f('Brand FAQ: "It’s best to consult your healthcare provider if you are pregnant or breastfeeding."', 'Arrae: The Complete Guide to MB-1 (FAQ)', 'https://www.arrae.com/blogs/arrae-journal/the-complete-guide-to-mb-1-everything-you-need-to-know', 'brand', 'caution'),
    },
  },
  'p-goodbug-good-down-there': {
    ...head('Brand product page warning list.'),
    facts: {
      'safety.pregnancy': f('Brand page: recommends "consulting your Health Practitioner before incorporating Good Down There if you" "Are pregnant or lactating".', 'The Good Bug: Good Down There product page', 'https://thegoodbug.com/products/good-down-there-for-vaginal-health', 'brand', 'caution'),
      'safety.breastfeeding': f('Brand page: recommends "consulting your Health Practitioner before incorporating Good Down There if you" "Are pregnant or lactating".', 'The Good Bug: Good Down There product page', 'https://thegoodbug.com/products/good-down-there-for-vaginal-health', 'brand', 'caution'),
    },
  },
  'p-momotaro-urinary-tract-supplement': {
    ...head('Brand product page disclaimer.'),
    facts: {
      'safety.pregnancy': f('Brand page: "Consult your healthcare provider before use if pregnant, breastfeeding, or taking medication."', 'Momotaro Apotheca: Urinary Tract & Pelvic Health Supplement', 'https://momotaroapotheca.com/products/the-uti-supplement', 'brand', 'caution'),
      'safety.breastfeeding': f('Brand page: "Consult your healthcare provider before use if pregnant, breastfeeding, or taking medication."', 'Momotaro Apotheca: Urinary Tract & Pelvic Health Supplement', 'https://momotaroapotheca.com/products/the-uti-supplement', 'brand', 'caution'),
    },
  },
  'p-rugby-vitamin-b6-25': {
    ...head('LactMed vitamin B6 (revised 2025-03-15). The 25 mg tablet is below the 100 to 200 mg doses LactMed discusses.'),
    facts: {
      'safety.breastfeeding': f('LactMed: "Vitamin B6 (pyridoxine) is an essential nutrient in the human diet and is naturally found in human milk." Paraphrased: higher doses of 100 to 200 mg daily have not been studied in lactation, but LactMed says they would not be expected to expose breastfed infants to a harmful amount.', 'NIH NLM LactMed: Vitamin B6', LACTMED_B6, 'regulatory', 'ok'),
    },
  },
  'p-metamucil-psyllium-orange': {
    ...head('MedlinePlus psyllium (revised 2024-06-20); the brand label is silent on pregnancy.'),
    facts: {
      'safety.pregnancy': f('MedlinePlus: "tell your doctor if you are pregnant, plan to become pregnant, or are breast-feeding." "If you become pregnant while taking psyllium, call your doctor."', 'MedlinePlus: Psyllium', MEDLINE_PSYLLIUM, 'regulatory', 'caution'),
    },
  },
  'p-miralax-peg-3350': {
    ...head('Brand Drug Facts label on miralax.com.'),
    facts: {
      'safety.pregnancy': f('Drug Facts label: "If pregnant or breast feeding, ask a health professional before use."', 'MiraLAX product page (Drug Facts warnings)', 'https://www.miralax.com/products/miralax', 'brand', 'caution'),
      'safety.breastfeeding': f('Drug Facts label: "If pregnant or breast feeding, ask a health professional before use."', 'MiraLAX product page (Drug Facts warnings)', 'https://www.miralax.com/products/miralax', 'brand', 'caution'),
    },
  },
};
