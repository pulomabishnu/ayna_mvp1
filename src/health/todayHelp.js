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

const NIMH_CARE = { label: 'NIMH: Caring for your mental health', url: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health' };
const MEDLINE_FATIGUE = { label: 'MedlinePlus: Fatigue', url: 'https://medlineplus.gov/ency/article/003088.htm' };

export const TODAY_HELP = {
  pain: {
    id: 'pain',
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
  if (!pregnant && !postCycle && entry.pain >= 2 && crampy) out.push(TODAY_HELP.pain);
  if (entry.mood === 1) out.push(TODAY_HELP.mood);
  if (!pregnant && !postCycle && entry.pms >= 2) out.push(TODAY_HELP.pms);
  if (entry.energy === 1) out.push(TODAY_HELP.energy);
  if (entry.sleep === 1) out.push(TODAY_HELP.sleep);
  return out.slice(0, 2);
}
