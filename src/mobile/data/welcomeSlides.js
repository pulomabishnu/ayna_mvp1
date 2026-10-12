import { GLOSSARY } from '../../data/glossary.js';

// Shared content for the welcome carousel on the website and the app.
// The daily fact is a plain-language definition from the reviewed glossary,
// picked by date so everyone sees the same one on a given day.

export const TEAM_PHOTO = '/team/ayna-founders.jpg';
export const TEAM_CAPTION = 'Built by women who wanted better answers.';

const FACT_TERMS = [
  'PCOS', 'endometriosis', 'fibroids', 'adenomyosis', 'perimenopause', 'menopause',
  'PMDD', 'vaginismus', 'vulvodynia', 'interstitial cystitis', 'ovarian cysts',
  'anemia / iron deficiency', 'UTI', 'Osteoporosis', 'BRCA1/BRCA2',
];

export function getDailyFact(date = new Date()) {
  const terms = FACT_TERMS.filter((t) => GLOSSARY[t]);
  if (!terms.length) return null;
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  const term = terms[day % terms.length];
  const label = term.includes(' / ') ? term.split(' / ')[0] : term;
  return { term: label.charAt(0).toUpperCase() + label.slice(1), text: GLOSSARY[term] };
}
