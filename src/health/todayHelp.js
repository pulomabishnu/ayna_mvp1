/**
 * "What may help today" (founder, Nov 11: "if you log your mood is low or pain or something,
 * ayna should be suggesting things to help today, like products, reads, things you could do
 * physically with scientific backing, instead of saying nothing unusual stands out").
 *
 * Built only from what she logged today. Every tip is a plain line from a .gov page we read
 * (sources below, read Nov 11 2026 unless noted in interventions.js). No diagnosis; each topic
 * says when to see a clinician. Pure: same entry in, same list out.
 */
import { SOURCES } from './interventions.js';
import { diversifyByBrand } from '../matching/diversify.js';

const NIMH_CARE = { label: 'NIMH: Caring for your mental health', url: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health' };
const MEDLINE_FATIGUE = { label: 'MedlinePlus: Fatigue', url: 'https://medlineplus.gov/ency/article/003088.htm' };

export const TODAY_HELP = {
  steady: {
    id: 'steady',
    title: 'For today',
    tips: [
      'A 30-minute walk can boost your mood and your health.',
      'Drink water through the day and eat balanced meals.',
      'Stick to your sleep schedule tonight.',
    ],
    care: 'If something feels off or new, check in with a clinician.',
    sources: [NIMH_CARE],
    read: null,
    shop: null,
  },
  pain: {
    id: 'pain',
    goal: 'pain.menstrual_cramp',
    goalLabel: 'period cramps',
    title: 'For pain today',
    tips: [
      'A heating pad on your lower belly, or a warm bath or shower, can ease period cramps. Wrap it in a towel and never fall asleep with it on.',
      'Pain relievers like ibuprofen or naproxen are a common first option for period pain. Follow the label.',
      'Gentle movement, like a walk, may ease period pain.',
    ],
    care: 'Pain that is severe, new, or stops you doing normal things is worth a call to a clinician today.',
    sources: [SOURCES.medlinePeriodPain],
    read: 'period-pain-when-to-seek-care',
    shop: 'cramp relief',
  },
  mood: {
    id: 'mood',
    goal: 'mood.low',
    goalLabel: 'low mood',
    title: 'For a low mood today',
    tips: [
      'A 30-minute walk can lift your mood.',
      'Reach out to a friend or family member.',
      'Try a relaxation or breathing app, and name a few things you are grateful for.',
    ],
    care: 'If low mood lasts 2 weeks or more, talk to a clinician. In a crisis, call or text 988.',
    sources: [NIMH_CARE],
    read: null,
    shop: 'stress',
  },
  energy: {
    id: 'energy',
    goal: 'energy.fatigue',
    goalLabel: 'low energy',
    title: 'For low energy today',
    tips: [
      'Drink water through the day and eat balanced meals.',
      'A short walk or other exercise can help.',
      'Aim for a full night of sleep tonight.',
    ],
    care: 'Tiredness you can’t explain, or that comes with fever or weight loss, is worth a check with a clinician.',
    sources: [MEDLINE_FATIGUE],
    read: 'iron-deficiency-anemia',
    shop: 'energy',
  },
  sleep: {
    id: 'sleep',
    goal: 'sleep.trouble',
    goalLabel: 'sleep',
    title: 'After a rough night',
    tips: [
      'Go to bed and wake up around the same time each day.',
      'Wind down before bed, and keep the room cool, dark and quiet.',
      'Put your phone away a while before bed.',
    ],
    care: 'If poor sleep keeps going, a clinician can help.',
    sources: [SOURCES.nhlbiInsomnia, SOURCES.medlineSleepHabits, NIMH_CARE],
    read: null,
    shop: 'sleep',
  },
  pms: {
    id: 'pms',
    goal: 'cycle.pms',
    goalLabel: 'PMS',
    title: 'For PMS today',
    tips: [
      'Regular aerobic activity, like a brisk walk, can ease PMS.',
      'Try to get about eight hours of sleep.',
    ],
    care: 'If PMS gets in the way of work or relationships, talk to a clinician.',
    sources: [SOURCES.owhPms],
    read: 'pmdd',
    shop: 'PMS',
  },
};

/**
 * @param {object|null} entry today's log entry (src/health/dailyLog.js)
 * @param {{ pregnant?: boolean, postCycle?: boolean }} ctx
 * @returns {Array<typeof TODAY_HELP[keyof typeof TODAY_HELP]>} up to 2, most pressing first
 */
export function todayHelp(entry, { pregnant = false, postCycle = false } = {}) {
  if (!entry) return [];
  const out = [];
  // Pain in pregnancy goes through the triage questions on Today, never these tips.
  // Period-pain tips only for cramps or pelvic pain (or when she didn't say which kind).
  const crampy = !entry.pain_where || ['cramps', 'pelvic', 'back'].includes(entry.pain_where);
  // Founder, Nov 11 ("I logged and it didn't tell me anything"): mild pain or PMS counts too.
  if (!pregnant && !postCycle && entry.pain >= 1 && crampy) out.push(TODAY_HELP.pain);
  if (entry.mood === 1) out.push(TODAY_HELP.mood);
  if (!pregnant && !postCycle && entry.pms >= 1) out.push(TODAY_HELP.pms);
  if (entry.energy === 1) out.push(TODAY_HELP.energy);
  if (entry.sleep === 1) out.push(TODAY_HELP.sleep);
  // Anything logged and nothing to act on: still one useful line for today, never silence.
  const logged = ['pain', 'flow', 'pms', 'sleep', 'mood', 'skin', 'energy'].some((f) => entry[f] != null);
  if (!out.length && logged) out.push(TODAY_HELP.steady);
  return out.slice(0, 2);
}

/** Her matched products that fit a topic (name, category and needs text). Used by For today and the pop-up. */
export const TOPIC_FITS = {
  pain: /cramp|heat|warm|tens|period pain|menstrual pain/i,
  sleep: /sleep|melatonin|magnesium|night/i,
  energy: /iron|energy|fatigue|b12|ferr/i,
  mood: /stress|mood|calm|anxiety|ashwagandha/i,
  pms: /pms|bloat|premenstrual|cycle support/i,
};
const topicText = (p) => `${p?.name || ''} ${p?.category || ''} ${p?.subcategory || ''} ${Array.isArray(p?.needs) ? p.needs.join(' ') : ''} ${Array.isArray(p?.concerns) ? p.concerns.join(' ') : ''} ${p?.description || ''}`;
export function productsForTopic(topicId, products = [], max = 3) {
  const re = TOPIC_FITS[topicId];
  // One per brand first (matching/diversify.js, Ziegler et al. 2005).
  return re ? diversifyByBrand(products.filter((p) => p?.id && re.test(topicText(p))), max).slice(0, max) : [];
}

/** Fired whenever she saves something in her log (the pop-up listens). */
export const LOG_CHANGED_EVENT = 'ayna:log-changed';
export function announceLogChange(day) {
  try { globalThis.dispatchEvent?.(new CustomEvent(LOG_CHANGED_EVENT, { detail: { day } })); } catch { /* old browser */ }
}
