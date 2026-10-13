// Plain-language definitions for terms people may not know. General education,
// not medical advice. Shown on long-press in the quiz.
export const GLOSSARY = {
  Perimenopause: 'The years before menopause when hormones start shifting. Periods can become irregular.',
  Menopause: 'When periods have stopped for 12 months in a row, usually in your late 40s or 50s.',
  'Post-menopause': 'The years after menopause.',
  PMS: 'Premenstrual syndrome. mood or body changes in the week or two before a period.',
  PMDD: 'Premenstrual dysphoric disorder. a severe form of PMS that strongly affects mood.',
  PCOS: 'Polycystic ovary syndrome. a hormone condition that can cause irregular periods, acne or extra hair growth.',
  Endometriosis: 'Tissue like the uterine lining grows outside the uterus, often causing pelvic pain.',
  Adenomyosis: 'Uterine lining tissue grows into the muscle wall of the uterus, which can cause heavy, painful periods.',
  Fibroids: 'Non-cancerous growths in the uterus that can cause heavy bleeding or pressure.',
  BV: 'Bacterial vaginosis. an imbalance of vaginal bacteria, often with a fishy odor.',
  UTI: 'Urinary tract infection. often burning when you pee and needing to go a lot.',
  STI: 'Sexually transmitted infection.',
  Vulvodynia: 'Ongoing pain or burning at the vulva with no clear cause.',
  Vaginismus: 'Involuntary tightening of vaginal muscles that makes penetration painful or difficult.',
  Libido: 'Sex drive.',
  Incontinence: 'Leaking urine you can’t control, for example when you cough or laugh.',
  Postpartum: 'The time after giving birth.',
  Lactation: 'Making breast milk.',
  Trimester: 'A pregnancy is split into three trimesters of about three months each.',
  Ovulation: 'When an ovary releases an egg. the most fertile time of the cycle.',
  Contraception: 'Birth control.',
  'Hormonal birth control': 'Birth control that uses hormones, like the pill, patch, ring, shot, implant or hormonal IUD.',
  Spotting: 'Light bleeding outside your period.',
  'Diastasis recti': 'A gap between the belly muscles, common after pregnancy.',
  Prolapse: 'When pelvic organs drop and press into the vagina, often felt as heaviness.',
  Parabens: 'Preservatives used in some personal-care products.',
  Phthalates: 'Chemicals used in some plastics and fragrances.',
  Sulfates: 'Foaming cleansers, like SLS, used in some washes.',
  FSA: 'Flexible Spending Account. pre-tax money for health costs, usually through work.',
  HSA: 'Health Savings Account. pre-tax savings for health costs, paired with a high-deductible plan.',
  Telehealth: 'Seeing a clinician by video or chat instead of in person.',
};

const TERMS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
const escape = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RE = new RegExp(`\\b(${TERMS.map(escape).join('|')})s?\\b`, 'i');

import { OPTION_INFO, OPTION_INFO_BY_STEP } from './optionInfo.js';

/** Definition for a whole quiz option, or for the first hard word inside any text. */
export function defineOption(text, stepType) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  const scoped = OPTION_INFO_BY_STEP[stepType]?.[t];
  if (scoped) return { term: t, definition: scoped };
  if (OPTION_INFO[t]) return { term: t, definition: OPTION_INFO[t] };
  return findTerm(t);
}

/** First glossary term found in `text`, or null. */
export function findTerm(text) {
  const m = String(text || '').match(RE);
  if (!m) return null;
  const key = TERMS.find((t) => t.toLowerCase() === m[1].toLowerCase());
  return key ? { term: key, definition: GLOSSARY[key] } : null;
}
