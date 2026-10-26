/**
 * Data -> action (team direction 1, 2, 45, 46; UX spec 22).
 *
 * Every health change ayna shows reads the same way:
 *   What changed      (against her own recent pattern, never a bare number)
 *   What it may affect
 *   What you can do   (1 or 2 actions, from the intervention classes)
 *   See data          (the numbers, the basis, the sources; the chart sits here)
 *
 * Something worth checking leads (a flag), in plain, non-alarmist words:
 * "worth checking", "different from your recent pattern", "you may want to
 * discuss this with a clinician". ayna never diagnoses.
 *
 * Founder rule (Oct 24 2026): clinical claims are checked only against .gov
 * pages. Every page below was opened on Oct 24 2026; the quote each line rests
 * on sits next to it. Pure functions: no network, no storage, no model.
 */
import { INTERVENTION_CLASSES, SOURCES as CLASS_SOURCES, evaluateClassSafety } from './interventions.js';
import { EVIDENCE } from './weekInsights.js';

export const STORY_SOURCES = {
  // "You might have trouble learning, focusing, and reacting." "Sleep deficiency also can make
  // you feel frustrated, cranky, or worried in social situations."
  nhlbiSleep: { label: 'NIH NHLBI: Sleep deprivation and deficiency', url: 'https://www.nhlbi.nih.gov/health/sleep-deprivation' },
  // Immediate benefits: "Improves sleep quality", "Reduces feelings of anxiety".
  cdcActivity: { label: 'CDC: Health benefits of physical activity for adults', url: 'https://www.cdc.gov/physical-activity-basics/health-benefits/adults.html' },
  // "A fast pulse may signal an infection or dehydration." A resting heart rate that is
  // continually high: "Talk to your health care provider about this." Adults 60 to 100.
  medlinePulse: { label: 'MedlinePlus: Pulse', url: 'https://medlineplus.gov/ency/article/003399.htm' },
  owhCycle: EVIDENCE.cycle,
  owhTemp: EVIDENCE.bbt,
  owhPms: CLASS_SOURCES.owhPms,
  medlinePeriodPain: EVIDENCE.cramps,
};

const cls = (id) => INTERVENTION_CLASSES[id];

/** An action from an intervention class, or null when its gates say no for what we know. */
function classAction(classId, { text = null, sources = null, safetyCtx = null } = {}) {
  const c = cls(classId);
  if (!c) return null;
  if (evaluateClassSafety(classId, safetyCtx || {}).verdict !== 'pass') return null;
  return { id: classId, label: c.label, text: text || c.summary, sources: sources || c.sources };
}

/** A plain step that is about her own data (no health claim, so no source needed). */
const step = (id, label, text) => ({ id, label, text, sources: [] });

const CLINICIAN = 'You may want to discuss this with a clinician.';

/**
 * @param {object} insight  one item from explainWeek(...).insights
 * @param {object} [opts]   { safetyCtx, hormonalBC }
 * @returns {null | { id, signal, flag, changed, affects, affectsSources, actions, data }}
 */
export function insightStory(insight, { safetyCtx = null, hormonalBC = false } = {}) {
  if (!insight) return null;
  const cyclePart = (insight.sources || []).length > 0;
  let changed; let affects; let affectsSources = []; let actions = []; let flag = null;

  switch (insight.signal) {
    case 'sleep-short':
      changed = 'You have slept less than your recent pattern';
      affects = 'Focus and mood. Short sleep can make it harder to focus and can leave you feeling cranky or worried.';
      affectsSources = [STORY_SOURCES.nhlbiSleep];
      if (cyclePart) { affects += ' Sleep problems can also be part of PMS in the week or two before a period.'; affectsSources.push(STORY_SOURCES.owhPms); }
      actions = [
        classAction('sleep_routine', { safetyCtx }),
        classAction('movement', { safetyCtx, text: 'Being active during the day can improve sleep quality. A walk counts.', sources: [STORY_SOURCES.cdcActivity] }),
      ];
      break;
    case 'sleep-long':
      changed = 'You have slept more than your recent pattern';
      affects = 'Maybe nothing. Notice how your days feel. Sleeping too much or too little can be part of PMS for some people.';
      affectsSources = [STORY_SOURCES.owhPms];
      actions = [
        step('look_again', 'Keep tracking', 'Keep your sleep data coming for another week to see whether this is a short stretch.'),
        classAction('sleep_routine', { safetyCtx }),
      ];
      break;
    case 'heart-up': {
      const hrvOnly = insight.metric !== 'resting_hr_bpm';
      changed = hrvOnly ? 'Your heart rate variability is lower than your recent pattern' : 'Your resting heart rate is higher than your recent pattern';
      affects = hrvOnly
        ? 'How recovered you feel is hard to read from this alone. Looking at it next to your sleep and cycle helps.'
        // Everyday causes first; infection only as "if you also feel unwell" (dashboard audit 7.6, 9.1).
        // Same MedlinePlus line as before: "A fast pulse may signal an infection or dehydration."
        : 'How you feel day to day. Not drinking enough can make your resting pulse faster. If you also feel unwell, it can come with an infection.';
      affectsSources = hrvOnly ? [] : [STORY_SOURCES.medlinePulse];
      actions = [
        step('look_together', 'Look at it with your sleep', 'Compare the same days with your sleep and cycle in See data.'),
        step('keep_tracking', 'Keep tracking', 'Give it another week. One week of change is not a pattern yet.'),
      ];
      if (!hrvOnly && insight.rhrRecent != null && insight.rhrRecent > 100) {
        flag = { level: 'check', text: `Worth checking. Your resting heart rate has been above 100 most of this week. MedlinePlus says a resting heart rate that stays high is worth talking to a provider about. ${CLINICIAN}`, sources: [STORY_SOURCES.medlinePulse] };
        actions = [step('care', 'Talk to a clinician', 'Bring the dates and readings from See data.'), actions[0]];
      }
      break;
    }
    case 'heart-down':
      changed = 'Your resting heart rate is lower than your recent pattern';
      affects = 'ayna cannot tell why from this alone. If you also feel dizzy or faint, talk to a clinician.';
      affectsSources = [STORY_SOURCES.medlinePulse];
      actions = [step('keep_tracking', 'Keep tracking', 'Keep your data coming to see whether this pattern continues.')];
      break;
    case 'steps-lower':
      changed = 'You have moved less than your recent pattern';
      affects = 'Sleep and stress. Being active can improve sleep quality and ease feelings of anxiety.';
      affectsSources = [STORY_SOURCES.cdcActivity];
      actions = [
        classAction('movement', { safetyCtx, text: 'Gentle movement counts. A walk on a day that suits you is a good start.', sources: [STORY_SOURCES.cdcActivity] }),
        step('look_back', 'Look back at the week', 'Think about whether your schedule, energy or routine changed on those days.'),
      ];
      break;
    case 'cycle-shorter':
      changed = 'Your last cycle came sooner than your recent pattern';
      affects = 'When to expect your next period. Cycle length can be different from month to month.';
      affectsSources = [STORY_SOURCES.owhCycle];
      actions = [
        classAction('tracking', { safetyCtx }),
        step('dates', 'Check the dates', 'Make sure your period start dates are right. One missed log can shorten a cycle.'),
      ];
      if (insight.latestDays != null && insight.latestDays < 24) {
        flag = { level: 'check', text: `Worth checking. This cycle was shorter than 24 days. womenshealth.gov suggests talking to a doctor or nurse about cycles shorter than 24 days. ${CLINICIAN}`, sources: [STORY_SOURCES.owhCycle] };
        actions = [classAction('care', { safetyCtx, text: 'A doctor, nurse or gynecologist can look at your dates with you.', sources: [STORY_SOURCES.owhCycle] }), actions[0]];
      }
      break;
    case 'temp-rise':
      changed = 'Your temperature is higher than your recent pattern';
      affects = hormonalBC
        ? 'ayna cannot tell why from this alone. Poor sleep, alcohol and fever can move your temperature too.'
        : 'Where you are in your cycle. A small rise often follows ovulation, though it does not show exactly when. Poor sleep, alcohol and fever can move it too.';
      affectsSources = [STORY_SOURCES.owhTemp];
      actions = [
        classAction('tracking', { safetyCtx, text: 'Keep logging your cycle and temperature. Over a few cycles your own pattern gets clearer.', sources: [STORY_SOURCES.owhTemp] }),
      ];
      break;
    case 'period-soon':
      changed = 'Your period may be close';
      affects = 'Cramps can start a day or two before your period.';
      affectsSources = [STORY_SOURCES.medlinePeriodPain];
      actions = [
        classAction('heat', { safetyCtx }),
        step('ready', 'Get your period products ready', 'Check your routine before the expected date.'),
      ];
      break;
    default:
      changed = 'Something is different from your recent pattern';
      affects = 'ayna cannot tell why from this alone.';
      actions = [step('keep_tracking', 'Keep tracking', 'Keep your data coming to see how this develops.')];
  }

  return {
    id: insight.id,
    signal: insight.signal,
    flag,
    changed,
    affects,
    affectsSources,
    actions: actions.filter(Boolean).slice(0, 2),
    data: { text: insight.text, basis: insight.basis, sources: insight.sources || [], from: insight.from || [] },
  };
}

/** Stories for a list of insights, anything worth checking first (order otherwise kept). */
export function insightStories(insights, opts) {
  const all = (insights || []).map((i) => ({ insight: i, story: insightStory(i, opts) })).filter((x) => x.story);
  return [...all.filter((x) => x.story.flag), ...all.filter((x) => !x.story.flag)];
}

/**
 * A metric tile or chart headline in words: how the last 7 days compare with
 * her own usual. The number goes underneath, never as the headline.
 * @param {{ metric, delta, usual }} chart  from buildDashboard
 * @param {(metric, delta) => boolean} isFlat
 */
export function metricHeadline(chart, isFlat) {
  if (!chart || chart.delta == null || chart.usual == null) return 'Still learning your usual';
  if (isFlat(chart.metric, chart.delta)) return 'In your usual range';
  const up = chart.delta > 0;
  if (chart.metric === 'sleep_minutes') return up ? 'More sleep than usual' : 'Less sleep than usual';
  if (chart.metric === 'steps') return up ? 'More active than usual' : 'Less active than usual';
  return up ? 'Higher than your usual' : 'Lower than your usual';
}
