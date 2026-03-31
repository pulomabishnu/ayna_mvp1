import { ALL_PRODUCTS } from './products';
import { inferTagsFromHealthProfile } from '../utils/healthDataProfile';

const FRUSTRATION_TO_TAG = {
  'Heavy flow': 'heavy-flow',
  'Painful cramps': 'cramps',
  'Hormonal bloating': 'bloating',
  'Irregular cycles': 'irregular',
  'Leaks & staining': 'leaks',
  'General discomfort': 'discomfort',
  'Not sure if products are safe': 'safety-concern',
  'Recurrent UTIs': 'uti',
  'PCOS symptoms': 'pcos',
  'Pelvic pain': 'pelvic-floor',
  'Menopause symptoms': 'menopause',
  'Endometriosis': 'endometriosis',
  'Fertility / TTC': 'fertility',
  'Pregnancy': 'pregnancy',
  'Postpartum recovery': 'postpartum',
};

/**
 * Quiz frustrations + imported health / wearable text → same tag universe as getRecommendations.
 * @param {object|null|undefined} quizResults
 * @param {object|null|undefined} healthProfile
 */
export function getMergedRecommendationTags(quizResults, healthProfile) {
  const tags = new Set(inferTagsFromHealthProfile(healthProfile));
  (quizResults?.frustrations || []).forEach((f) => {
    const t = FRUSTRATION_TO_TAG[f];
    if (t) tags.add(t);
  });
  return tags;
}

/**
 * Telehealth / virtual-care products from the catalog that match the user’s tags, with a generic fallback.
 */
export function getMatchingTelehealthProducts(quizResults, healthProfile, limit = 4) {
  const tags = getMergedRecommendationTags(quizResults, healthProfile);
  const telehealth = ALL_PRODUCTS.filter((p) => p.category === 'telehealth');
  if (tags.size === 0) return telehealth.slice(0, limit);

  const scored = telehealth
    .map((p) => {
      let score = 0;
      (p.tags || []).forEach((t) => {
        if (tags.has(t)) score += 2;
      });
      (p.healthFunctions || []).forEach((h) => {
        if (tags.has(h)) score += 1;
      });
      return { product: p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return telehealth.slice(0, limit);
  return scored.slice(0, limit).map((x) => x.product);
}

/**
 * Government and nonprofit search links (zip improves local clinic finders).
 * @param {string} zipCode - 5-digit US zip when available
 */
export function getCareResourceBundle(quizResults, healthProfile, zipCode) {
  const zip = String(zipCode || '').replace(/\D/g, '').slice(0, 5);
  const tags = getMergedRecommendationTags(quizResults, healthProfile);
  const frustrations = quizResults?.frustrations || [];

  const lines = [];
  if (frustrations.length) lines.push(`Focus areas: ${frustrations.slice(0, 8).join(', ')}.`);
  if (tags.size > 0) lines.push(`Signals we use for matching include: ${[...tags].slice(0, 12).join(', ')}.`);

  const intro =
    lines.length > 0
      ? `Based on your conversation, quiz, and any records or wearable notes you imported, you may want both products and professional support. ${lines.join(' ')} Ayna does not endorse specific clinics; verify insurance, scope of practice, and credentials.`
      : 'Add your symptoms in the quiz or chat, import health records or wearable summaries under My Account, and save a zip code so clinic finders can start near you.';

  const hrssaZip = zip ? `https://findahealthcenter.hrsa.gov/?zip=${encodeURIComponent(zip)}` : 'https://findahealthcenter.hrsa.gov/';

  const clinicLinks = [
    {
      href: hrssaZip,
      label: 'HRSA — Find a health center',
      hint: zip ? `Federally qualified health centers near ${zip}.` : 'Search by address or zip for sliding-scale and low-cost care.',
    },
    {
      href: 'https://www.plannedparenthood.org/health-center',
      label: 'Planned Parenthood — health centers',
      hint: 'Enter your zip on their site for nearby locations.',
    },
    {
      href: 'https://www.plannedparenthood.org/get-care',
      label: 'Planned Parenthood — get care (telehealth & in-person)',
      hint: 'Reproductive and sexual health visits online or in person.',
    },
  ];

  const telehealthLinks = [
    {
      href: 'https://www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/index.html',
      label: 'HHS — Understanding HIPAA (telehealth privacy)',
      hint: 'How health information may be used in virtual visits.',
    },
    {
      href: 'https://medlineplus.gov/',
      label: 'MedlinePlus (NIH)',
      hint: 'Trusted patient education before or between visits.',
    },
  ];

  if (tags.has('uti') || frustrations.some((f) => f.includes('UTI'))) {
    telehealthLinks.unshift({
      href: 'https://medlineplus.gov/urinarytractinfections.html',
      label: 'MedlinePlus — Urinary tract infections',
      hint: 'When to seek care for recurrent or complicated UTIs.',
    });
  }
  if (tags.has('menopause') || frustrations.some((f) => f.includes('Menopause'))) {
    telehealthLinks.unshift({
      href: 'https://www.nia.nih.gov/health/menopause',
      label: 'NIH — Menopause overview',
      hint: 'Symptoms and discussion points for a clinician.',
    });
  }

  return {
    zip,
    intro,
    clinicLinks,
    telehealthLinks,
    catalogTelehealth: getMatchingTelehealthProducts(quizResults, healthProfile, 5),
  };
}
