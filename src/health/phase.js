/**
 * Which cycle phase she is probably in, estimated from her own period logs.
 *
 * Method (the same calendar estimate period-tracking apps use): ovulation is
 * placed about 14 days before her next expected period, because the luteal
 * phase is fairly steady at 12 to 14 days while the follicular phase varies
 * (Cleveland Clinic, Luteal Phase and Follicular Phase). It is an estimate,
 * never confirmed ovulation, and never birth control. We say all of that.
 *
 * Copy is plain-language paraphrase of Cleveland Clinic's patient pages,
 * linked from the screen. No claims beyond those pages.
 */

export const PHASE_SOURCES = [
  { label: 'Cleveland Clinic: Follicular phase', url: 'https://my.clevelandclinic.org/health/body/23953-follicular-phase' },
  { label: 'Cleveland Clinic: Luteal phase', url: 'https://my.clevelandclinic.org/health/body/24417-luteal-phase' },
];

export const PHASES = {
  period: {
    name: 'Period',
    what: 'Your uterine lining is shedding. Day 1 of your cycle is the first day of bleeding.',
  },
  follicular: {
    name: 'Follicular phase',
    what: 'Your ovaries are getting an egg ready and estrogen is rising. Some people notice clearer skin and a brighter mood in this phase.',
  },
  ovulation: {
    name: 'Around ovulation',
    what: 'An egg is likely released around now. Pregnancy chances are highest in the five days before ovulation and on the day itself.',
  },
  luteal: {
    name: 'Luteal phase',
    what: 'After ovulation, progesterone rises. Some people notice PMS-like changes such as mood shifts, breast tenderness, bloating or breakouts. Not everyone does.',
  },
};

const LUTEAL_DAYS = 14;

/**
 * @param {{ cycleDay: number|null, avgLength: number|null, periodLength: number, flowToday?: boolean }} c
 * @returns {null | { id, name, what, ovulationDay, windowStart, windowEnd, basis, estimated: true }}
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
  const ovulationDay = Math.max(periodLength + 1, length - LUTEAL_DAYS);
  const windowStart = ovulationDay - 2;
  const windowEnd = ovulationDay + 1;
  let id;
  if (flowToday || cycleDay <= periodLength) id = 'period';
  else if (cycleDay < windowStart) id = 'follicular';
  else if (cycleDay <= windowEnd) id = 'ovulation';
  else id = 'luteal';
  return {
    id,
    ...PHASES[id],
    ovulationDay,
    windowStart,
    windowEnd,
    basis: `An estimate from your last cycles (about ${length} days), placing ovulation about ${LUTEAL_DAYS} days before your next period. Ovulation timing varies, so this can be off. It is not a form of birth control.`,
    estimated: true,
  };
}
