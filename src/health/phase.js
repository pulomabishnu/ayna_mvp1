/**
 * Which part of her cycle she is probably in, estimated from her own period logs.
 *
 * Method (Oct 24 2026, founder rule: .gov sources only). Ovulation is never
 * placed on one day. womenshealth.gov: "the time between ovulation and when
 * the next period starts can be anywhere from one week (7 days)" to 19 days,
 * and cycle length "might be different from month-to-month". NICHD:
 * "Ovulation can occur anywhere between 10 and 21 days after the first day of
 * a woman's menstrual cycle." So the possible ovulation days run from 19 to 7
 * days before her next expected period, and every phase is shown as a range
 * with that uncertainty. Before the range ovulation has probably not happened
 * yet; after it, it probably has. It is never birth control. Replaces the
 * Cleveland Clinic "about 14 days before your period" method (not .gov).
 */

export const PHASE_SOURCES = [
  { label: 'womenshealth.gov: Your menstrual cycle', url: 'https://womenshealth.gov/menstrual-cycle/your-menstrual-cycle' },
  { label: 'NICHD: Menstruation and menstrual problems', url: 'https://www.nichd.nih.gov/health/topics/factsheets/menstruation' },
];

// Copy only says what the pages above (and womenshealth.gov PMS) say.
export const PHASES = {
  period: {
    name: 'Period',
    what: 'Your uterine lining is shedding. Day 1 of your cycle is the first day of bleeding.',
  },
  follicular: {
    name: 'Before ovulation',
    what: 'Your uterine lining builds up again. Ovulation has probably not happened yet this cycle.',
  },
  ovulation: {
    name: 'Possible ovulation days',
    what: 'Ovulation could happen on any of these days, and it varies from cycle to cycle. Pregnancy is most likely from sex in the three days before ovulation and on the day itself.',
  },
  luteal: {
    name: 'After ovulation',
    what: 'Ovulation has probably happened. If you are not pregnant, estrogen and progesterone fall and your period starts. Some people notice PMS symptoms in the week or two before a period. Not everyone does.',
  },
};

// womenshealth.gov: ovulation comes 7 to 19 days before the next period.
export const OVULATION_TO_PERIOD = { min: 7, max: 19 };


/**
 * @param {{ cycleDay: number|null, avgLength: number|null, periodLength: number, flowToday?: boolean }} c
 * @returns {null | { id, name, what, windowStart, windowEnd, basis, estimated: true }}
 * windowStart..windowEnd are the possible ovulation days (cycle days), never one day.
 */
export function estimatePhase({ cycleDay, avgLength, periodLength = 0, flowToday = false } = {}) {
  if (!cycleDay || cycleDay < 1) return null;
  const length = avgLength && avgLength >= 21 && avgLength <= 45 ? avgLength : null;
  // Without at least two logged cycles we don't know her length, so no ovulation estimate.
  if (!length) {
    if (flowToday || cycleDay <= Math.max(periodLength, 1)) return { id: 'period', ...PHASES.period, basis: 'From your period logs.', estimated: true };
    return null;
  }
  // Well past her usual length: the next period may be late or this cycle is longer. No phase guess.
  if (cycleDay > length + 7) return null;
  const windowStart = Math.max(periodLength + 1, length - OVULATION_TO_PERIOD.max);
  const windowEnd = Math.max(windowStart, length - OVULATION_TO_PERIOD.min);
  let id;
  if (flowToday || cycleDay <= periodLength) id = 'period';
  else if (cycleDay < windowStart) id = 'follicular';
  else if (cycleDay <= windowEnd) id = 'ovulation';
  else id = 'luteal';
  return {
    id,
    ...PHASES[id],
    windowStart,
    windowEnd,
    basis: `An estimate from your last cycles (about ${length} days). Ovulation can come anywhere from 7 to 19 days before the next period, so ayna shows a range of days (about day ${windowStart} to day ${windowEnd}), not one day. Cycles also change from month to month, so this can be off. It is not a form of birth control.`,
    estimated: true,
  };
}
