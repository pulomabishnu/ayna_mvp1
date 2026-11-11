/**
 * The daily ayna fact (founder, Nov 11: "maybe put a daily ayna fact in the rundown").
 * Each line is quoted from a .gov page we read on Nov 11 2026, with its source.
 * One a day, the same for everyone that day, in order.
 */
const CYCLE = { label: 'womenshealth.gov: Your menstrual cycle', url: 'https://womenshealth.gov/menstrual-cycle/your-menstrual-cycle' };
const PMS = { label: 'womenshealth.gov: Premenstrual syndrome (PMS)', url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' };
const MIND = { label: 'NIMH: Caring for your mental health', url: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health' };

export const DAILY_FACTS = [
  { id: 'cycle-range', text: 'A normal cycle lasts between 24 and 38 days. 28 days is typical, but every body is different.', source: CYCLE },
  { id: 'pms-common', text: 'Over 90% of women say they get some premenstrual symptoms, like bloating, headaches or moodiness.', source: PMS },
  { id: 'blood-amount', text: 'The average period is about two to three tablespoons of blood.', source: CYCLE },
  { id: 'walk-mood', text: 'Just 30 minutes of walking a day can boost your mood.', source: MIND },
  { id: 'lifetime', text: 'On average, women get a period for about 40 years of their life.', source: CYCLE },
  { id: 'calcium-pms', text: 'Studies show calcium can help reduce some PMS symptoms, such as fatigue and cravings.', source: PMS },
  { id: 'heavier-young', text: 'Periods are often heavier in your teens and usually get lighter in your 20s and 30s.', source: CYCLE },
  { id: 'sleep-pms', text: 'Too little sleep can make PMS symptoms like moodiness worse.', source: PMS },
  { id: 'menopause-12', text: 'Menopause is when you have not had a period for 12 months in a row.', source: CYCLE },
  { id: 'pmdd', text: 'Fewer than 5% of women get PMDD, a more severe form of PMS. It is treatable.', source: PMS },
  { id: 'pms-30s', text: 'Women in their 30s are the most likely to have PMS.', source: PMS },
  { id: 'gratitude', text: 'Reminding yourself daily of things you are grateful for is one way to care for your mental health.', source: MIND },
];

const dayNumber = (iso) => Math.floor(Date.parse(`${iso}T12:00:00Z`) / 86400000);

/** Today's fact. */
export function factFor(today) {
  const n = dayNumber(today);
  if (!Number.isFinite(n)) return DAILY_FACTS[0];
  return DAILY_FACTS[((n % DAILY_FACTS.length) + DAILY_FACTS.length) % DAILY_FACTS.length];
}
