/**
 * Decision engine for Today (master prompt sections 12 to 18, 39, 62, 63,
 * 71, 73, 135, 136; founder clinical review of Oct 24 2026, binding).
 * Rules, not a model. Pure: the same state in gives the same decision out.
 *
 *   decide(state) -> { output, items, empty, debug }
 *
 * Priority order (review): safety > care > symptom support > personalised
 * wellness > requested products. Items are sorted by that tier first.
 *
 *   safety    red flags and the pregnancy pain triage question
 *   care      "get this checked" items
 *   symptom   due follow-ups, the one information-gap question, options
 *   wellness  pattern insights and the daily check-in
 *   products  products inside an approved option, only once she asked
 *
 * Safety and care items are PROTECTED: never cut by the 3-item cap, never
 * faded by novelty decay, never hidden by "Not relevant". All of them show,
 * even if there are more than 3. Other items fill what is left of 3.
 *
 * Inputs (all optional):
 *   today      'YYYY-MM-DD' (pass it; defaults to the latest log day)
 *   logs       daily log entries (src/health/dailyLog.js), array or map by day
 *   tries      tries (src/health/outcomes.js), with or without `status`
 *   patterns   findCyclePatterns() output (src/health/cyclePatterns.js)
 *   profile    buildUserProfile() output (src/matching/userProfile.js)
 *   phase      estimatePhase() output (src/health/phase.js) or null
 *   cycleStarts  known period start days, if any
 *   pregnancyStartDay  'YYYY-MM-DD' when known (cycle patterns before it are not shown)
 *   triage     her answers to today's symptom questions (see TRIAGE_FIELDS)
 *   redFlags   red-flag ids from src/data/matching/redFlags.research.json
 *   seen, dismissed   SeenMap / DismissedMap (markShown, dismiss)
 *   intent     { showOptions?: boolean, need?: string }
 *   readiness  'discovering'|'understanding'|'comparing'|'deciding'|'acting'|...
 *   products   catalog list, used only to attach products inside an approved class
 *   labels     { [tryRef]: 'Plain name' } for follow-up titles
 */
import RED_FLAGS from '../data/matching/redFlags.research.json';
import { addDays, daysBetweenDays, normalizeEntry } from './dailyLog.js';
import { OUTCOMES, OUTCOME_LABELS, tryStatus } from './outcomes.js';
import { cycleStartsFrom, MIN_CYCLES, MIN_SHARE, PATTERN_METRICS } from './cyclePatterns.js';
import { MENSTRUAL_PRODUCT_NEEDS } from '../matching/ontology.js';
import {
  INTERVENTION_CLASSES, INTAKE_NEED_MAP, NEEDS, SOURCES,
  classesForNeed, evaluateClassSafety, isPregnant, isPostCycle, needLabelFor, productsForClass, safetyContextFrom,
} from './interventions.js';

export { addDays };
export const daysBetween = daysBetweenDays;

export const OUTPUTS = ['answer', 'ask_more', 'show_options', 'monitor', 'escalate', 'abstain', 'no_action'];
export const MAX_ITEMS = 3; // attention budget for non-protected items (section 62)
export const NOTHING_TODAY = 'Nothing unusual stands out today';

export const TIERS = { safety: 5, care: 4, symptom: 3, wellness: 2, products: 1 };
const PROTECTED_TIERS = new Set(['safety', 'care']);

// Order inside a tier. NO_ACTION is a real candidate: a non-protected item
// below it is not worth her attention today (section 71).
export const PRIORITY = {
  urgent: 1000,
  prompt: 850,
  routine: 600,
  follow_up: 800,
  ask: 700,
  option: 400,
  insight: 500,
  check_in_empty: 380,
  check_in: 300,
  products: 300,
  no_action: 200,
};

/**
 * RANKING HEURISTICS, not clinical thresholds (review: "fine as UX
 * heuristics"). They only ever touch non-safety, non-care items.
 */
export const RANKING_HEURISTICS = {
  noveltyWindowDays: 7, // an item shown in the last 7 days without a tap fades
  noveltyFactor: 0.5, // per showing in that window
  dismissDays: 30, // "Not relevant" hides a non-safety item for 30 days
  fallbackWindowDays: 90, // need/pattern window when cycle starts are unknown
  previousCycles: 2, // otherwise: the current cycle plus 2 previous cycles
};
export const NOVELTY_WINDOW_DAYS = RANKING_HEURISTICS.noveltyWindowDays;
export const NOVELTY_FACTOR = RANKING_HEURISTICS.noveltyFactor;
export const DISMISS_DAYS = RANKING_HEURISTICS.dismissDays;

/**
 * Everything here that tells her when or how fast to seek care, or that
 * relies on a threshold we chose. Founder: every row needs clinician review
 * before production (section 18; review, last paragraph).
 */
export const CLINICAL_REVIEW_REQUIRED = [
  { id: 'care:pain_today', kind: 'copy+rule', note: 'Severe, new, sudden, worse than usual, stops normal activities, or not easing with usual self-care: care today. "New" and "worse than usual" are computed from her own logs (see painTriggers).' },
  { id: 'care:severe_pattern', kind: 'copy+threshold', note: 'Severe pain on 2 or more days in the window: extra escalation signal, routine care when nothing today triggers.' },
  { id: 'red_flags', kind: 'copy+rule', note: 'Immediate red flags (RED_FLAG_RULES) and their urgent vs prompt levels, including the combinations mapped to rf.ectopic_rupture.' },
  { id: 'ask:pregnancy_triage', kind: 'copy+rule', note: 'Pregnancy pain triage questions and the mapping: red flag, severe, persistent or worsening to care; moderate to routine care plus gentle options; mild to gentle options.' },
  { id: 'care:pregnancy_pain_today', kind: 'copy', note: 'Severe: contact your midwife or maternity unit now (CDC). Constant or worsening: today (ayna policy).' },
  { id: 'care:pregnancy_pain_mention', kind: 'copy', note: 'Moderate pain in pregnancy without red flags: tell your midwife.' },
  { id: 'care:pregnancy_bleeding', kind: 'copy', note: 'Any bleeding logged in pregnancy: contact midwife or clinician.' },
  { id: 'care:postmenopausal_bleeding', kind: 'copy', note: 'Any bleeding logged after menopause: get it checked.' },
  { id: 'care:intake_urgent', kind: 'copy', note: 'Intake urgent answer Yes.' },
  { id: 'care:otc_not_enough', kind: 'copy', note: 'NSAID or acetaminophen recorded as no change.' },
  { id: 'care:reaction', kind: 'copy', note: 'Anything recorded as worse or side effect.' },
  { id: 'heat:pregnancy', kind: 'rule', note: 'Heat advice left out in pregnancy (we could not verify the low-temperature guidance).' },
  { id: 'otc:gates', kind: 'rule', note: 'NSAID and acetaminophen block / consult / ask mapping (interventions.js). Unknown pregnancy stage is treated as 20 weeks or more for NSAIDs.' },
  { id: 'ayna_policy_under_18', kind: 'policy', note: 'ayna safety policy, not an FDA cutoff.' },
];

const READY_STAGES = new Set(['comparing', 'deciding', 'acting']);
const LOG_FIELD_LIST = ['pain', 'flow', 'pms', 'sleep', 'mood', 'skin'];
const FIELD_WORDS = { pain: 'pain', flow: 'flow', pms: 'PMS', sleep: 'sleep', mood: 'mood', skin: 'skin' };
const RED_FLAG_BY_ID = new Map(RED_FLAGS.map((r) => [r.id, r]));
const ACTION_WORDS = { 'call 911': 'Call 911', 'go to ER': 'Go to the ER', 'call your clinician today': 'Call your clinician today' };

// ─── Seen / dismissed maps ─────────────────────────────────────────────────
/**
 * SeenMap:      { [itemId]: { lastShown, shownDays: day[], timesShown, lastInteracted: day|null, signature } }
 * DismissedMap: { [itemId]: { day, reason: 'not_relevant', until: day, signature } }
 * Plain JSON, safe for localStorage or sync. Protected items ignore both.
 */
export function markShown(seen = {}, items = [], today) {
  const next = { ...seen };
  for (const it of items) {
    const prev = next[it.id] || { shownDays: [], timesShown: 0, lastInteracted: null };
    const shownDays = prev.shownDays.includes(today) ? prev.shownDays : [...prev.shownDays, today].slice(-10);
    next[it.id] = { ...prev, lastShown: today, shownDays, timesShown: shownDays.length, signature: it.signature ?? null };
  }
  return next;
}
export function markInteracted(seen = {}, itemId, today) {
  const prev = seen[itemId] || { shownDays: [], timesShown: 0, signature: null };
  return { ...seen, [itemId]: { ...prev, lastInteracted: today } };
}
// "Not useful" reasons (UX spec section 9). dont_show_type also hides the
// item's whole type (key `type:<type>`) for TYPE_DISMISS_DAYS.
export const NOT_USEFUL_REASONS = ['already_knew', 'not_relevant', 'dont_show_type', 'info_changed', 'no_reason'];
export const TYPE_DISMISS_DAYS = 90;
export const typeKey = (type) => `type:${type}`;
/** Store "Not useful" with its reason: the item, plus its type for dont_show_type. */
export function dismissWithReason(dismissed = {}, item, today, reason = 'not_relevant') {
  const why = NOT_USEFUL_REASONS.includes(reason) ? reason : 'not_relevant';
  const next = dismiss(dismissed, item, today, why);
  return why === 'dont_show_type' && item?.type ? dismiss(next, typeKey(item.type), today, why, TYPE_DISMISS_DAYS) : next;
}
export function dismiss(dismissed = {}, itemOrId, today, reason = 'not_relevant', days = DISMISS_DAYS) {
  const id = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
  const signature = typeof itemOrId === 'object' ? itemOrId?.signature ?? null : null;
  return { ...dismissed, [id]: { day: today, reason, until: addDays(today, days), signature } };
}

// ─── Logs and the window ───────────────────────────────────────────────────
function cleanLogs(logs) {
  const list = Array.isArray(logs) ? logs : Object.values(logs || {});
  return list.map(normalizeEntry).filter(Boolean).sort((a, b) => (a.day < b.day ? -1 : 1));
}

/**
 * The window needs and pain history are read over (review, rule 8): the
 * current cycle plus at least 2 previous cycles when cycle starts are known,
 * else the last 90 days (a product heuristic, not a medical standard).
 */
export function needsWindow({ logs = [], cycleStarts = [], today }) {
  const starts = cycleStartsFrom({ log: logs, cycleStarts, today });
  const need = RANKING_HEURISTICS.previousCycles + 1;
  if (starts.length >= need) {
    const from = starts[starts.length - need];
    return { from, to: today, basis: 'cycles', cycles: need };
  }
  return { from: addDays(today, -RANKING_HEURISTICS.fallbackWindowDays + 1), to: today, basis: 'days', days: RANKING_HEURISTICS.fallbackWindowDays };
}
const inWindow = (logs, w) => logs.filter((l) => l.day >= w.from && l.day <= w.to);

// ─── Needs ─────────────────────────────────────────────────────────────────
/**
 * Active wedge needs and why. Sources: 'intake' (she chose it), 'log' (she
 * logged it on several days in the window), 'pattern' (a detected cycle
 * pattern). Browsing, saves, reads and Community activity are never read
 * (section 39: interest is not history). In pregnancy, pain is
 * 'pregnancy_pain', never period pain.
 */
export function activeNeeds({ profile, logs = [], patterns = [], today, cycleStarts = [] }) {
  const entries = cleanLogs(logs);
  const ctx = safetyContextFrom(profile || null);
  const pregnant = isPregnant(ctx);
  // Life stage before anything else (team direction 14): after menopause her
  // logged pain is not period pain and there is no PMS, so only a need she
  // picked herself can bring them up; sleep stays (labelled plainly).
  const postCycle = isPostCycle(ctx);
  const out = {};
  const add = (need, source, detail) => {
    const id = pregnant && need === 'period_pain' ? 'pregnancy_pain' : need;
    if (!NEEDS[id]) return;
    if (postCycle && source !== 'intake' && (id === 'period_pain' || id === 'pms')) return;
    if (postCycle && source === 'intake' && id === 'pms') return;
    out[id] = out[id] || { id, sources: [] };
    out[id].sources.push({ source, detail });
  };
  if (!pregnant) {
    for (const n of profile?.healthIntent?.needs || []) {
      if (n?.explicit && INTAKE_NEED_MAP[n.id]) add(INTAKE_NEED_MAP[n.id], 'intake', n.id);
    }
  }
  const w = needsWindow({ logs: entries, cycleStarts, today });
  const recent = inWindow(entries, w);
  const painDays = recent.filter((l) => l.pain >= 2).length;
  const pmsDays = recent.filter((l) => l.pms >= 2).length;
  const poorSleep = recent.filter((l) => l.sleep === 1).length;
  if (pregnant) {
    // Any pain in the last 3 days counts in pregnancy: triage first.
    if (entries.some((l) => l.pain >= 1 && daysBetweenDays(l.day, today) >= 0 && daysBetweenDays(l.day, today) <= 2)) add('pregnancy_pain', 'log', 'recent pain');
  } else if (painDays >= 2) add('period_pain', 'log', `${painDays} days`);
  if (pmsDays >= 2 && !pregnant) add('pms', 'log', `${pmsDays} days`);
  if (poorSleep >= 3) add('cycle_sleep', 'log', `${poorSleep} nights`);
  for (const p of patterns) {
    const need = needForMetric(p?.metric);
    if (need && strongPattern(p) && p.direction !== 'easier' && !pregnant) add(need, 'pattern', p.id);
  }
  return out;
}
function needForMetric(metric) {
  return { pain: 'period_pain', pms: 'pms', mood: 'pms', sleep: 'cycle_sleep', sleep_minutes: 'cycle_sleep' }[metric] || null;
}
function strongPattern(p) {
  const c = Number(p?.basis?.cycles); const of = Number(p?.basis?.of);
  return Number.isFinite(c) && Number.isFinite(of) && of >= MIN_CYCLES && c >= MIN_CYCLES && c / of >= MIN_SHARE;
}

// ─── Triage and red flags ──────────────────────────────────────────────────
/**
 * Today's symptom answers (from a short triage card). Booleans unless noted.
 *   severity: 'mild'|'moderate'|'severe'
 *   sudden, worseThanUsual, stopsActivities, selfCareNotHelping, persistent, worsening
 *   flags: red-flag codes (RED_FLAG_CODES)
 */
export const TRIAGE_FIELDS = ['severity', 'sudden', 'worseThanUsual', 'stopsActivities', 'selfCareNotHelping', 'persistent', 'worsening', 'flags'];
export const RED_FLAG_CODES = ['fever_pelvic_pain', 'foul_discharge', 'sudden_severe_pain', 'dizzy_faint', 'shoulder_tip_pain', 'heavy_bleeding', 'bleeding', 'fluid_leak', 'regular_contractions'];
// The minimum pregnancy pain questions (review, rule 4).
export const PREGNANCY_TRIAGE_QUESTIONS = [
  { field: 'severity', text: 'How strong is the pain?', options: ['mild', 'moderate', 'severe'] },
  { field: 'flags:bleeding', text: 'Any bleeding?' },
  { field: 'flags:dizzy_faint', text: 'Feeling dizzy or faint?' },
  { field: 'flags:fluid_leak', text: 'Any fluid leaking?' },
  { field: 'flags:regular_contractions', text: 'Regular, painful tightening?' },
  { field: 'worsening', text: 'Is it constant or getting worse?' },
];

const care = (fields) => item({ tier: 'care', ...fields });
const safety = (fields) => item({ tier: 'safety', ...fields });

function rfItem(rfId, extraReason) {
  const rf = RED_FLAG_BY_ID.get(rfId);
  if (!rf) return null;
  const urgent = rf.action === 'call 911' || rf.action === 'go to ER';
  return safety({
    id: `care:${rf.id}`, type: 'care', level: urgent ? 'urgent' : 'prompt',
    priority: urgent ? PRIORITY.urgent : PRIORITY.prompt,
    title: ACTION_WORDS[rf.action] || 'Get care now',
    body: `These can be signs of ${lowerFirst(rf.condition)}: ${rf.signs.map(lowerFirst).join('; ')}.`,
    reason: extraReason || 'You told us about signs that need care now.',
    actions: [{ id: 'get_care', label: ACTION_WORDS[rf.action] || 'Get care' }],
    basis: { kind: 'red_flag', ids: [rf.id], sources: [{ label: 'Source', url: rf.source_url }] },
  });
}

/**
 * Immediate red-flag overrides (review, rule 3). Mapped to
 * redFlags.research.json where an entry exists; otherwise our own rule with
 * its source. Returns safety-tier care items.
 */
export function redFlagItems(flags = [], ctx) {
  const f = new Set(flags);
  const pregnant = isPregnant(ctx);
  const pain = f.has('sudden_severe_pain');
  const bleeding = f.has('bleeding') || f.has('heavy_bleeding');
  const out = [];
  const push = (x) => { if (x && !out.some((o) => o.id === x.id)) out.push(x); };
  // Shoulder tip pain, or dizziness/fainting, with pain or bleeding: possible
  // ruptured ectopic pregnancy (MedlinePlus 000895: rupture symptoms include
  // "Fainting or feeling faint", "Pain in the shoulder area" and "Severe,
  // sharp, and sudden pain in the lower abdomen"; emergency help). An ectopic
  // pregnancy can happen before she knows she is pregnant, so this applies
  // unless she is past menopause.
  if ((f.has('shoulder_tip_pain') || f.has('dizzy_faint')) && (pain || bleeding || f.has('shoulder_tip_pain')) && !ctx.menopause) {
    push(rfItem('rf.ectopic_rupture', 'You told us about pain or bleeding with dizziness or shoulder tip pain.'));
  }
  if (ctx.postpartum && f.has('heavy_bleeding')) push(rfItem('rf.postpartum_hemorrhage', 'You told us about heavy bleeding after giving birth.'));
  // MedlinePlus 003150: contact your provider right away for "Fever and pelvic pain" or "Increased or foul-smelling vaginal discharge". Urgent level is ayna policy.
  if (f.has('fever_pelvic_pain')) push(safety({ id: 'care:fever_pelvic_pain', type: 'care', level: 'urgent', priority: PRIORITY.urgent, title: 'Get care right away', body: 'Fever with pelvic pain needs care right away.', reason: 'You told us you have a fever with pelvic pain.', actions: [{ id: 'get_care', label: 'Get care now' }], basis: { kind: 'red_flag', code: 'fever_pelvic_pain', sources: [SOURCES.medlinePeriodPain] } }));
  if (f.has('foul_discharge')) push(safety({ id: 'care:foul_discharge', type: 'care', level: 'urgent', priority: PRIORITY.urgent, title: 'Get care right away', body: 'More discharge than usual, or discharge that smells bad, needs care right away.', reason: 'You told us about unusual discharge.', actions: [{ id: 'get_care', label: 'Get care now' }], basis: { kind: 'red_flag', code: 'foul_discharge', sources: [SOURCES.medlinePeriodPain] } }));
  if (pregnant) {
    if (bleeding && pain) push(rfItem('rf.ectopic_suspected', 'You told us about pain and bleeding in pregnancy.'));
    // MedlinePlus 003264: "You have any vaginal bleeding during pregnancy. Treat this as a potential emergency."
    if (bleeding) push(safety({ id: 'care:pregnancy_bleeding_now', type: 'care', level: 'prompt', priority: PRIORITY.prompt, title: 'Contact your midwife or maternity unit now', body: 'Bleeding in pregnancy should always be checked.', reason: 'You told us about bleeding in pregnancy.', actions: [{ id: 'get_care', label: 'Find care' }], basis: { kind: 'red_flag', code: 'bleeding', sources: [SOURCES.medlinePregnancyBleeding, SOURCES.cdcMaternalWarningSigns] } }));
    // CDC urgent maternal warning signs: "fluid leaking from the vagina" during pregnancy: seek care immediately;
    // womenshealth.gov: stop exercising and contact your provider for fluid leaking or contractions.
    if (f.has('fluid_leak') || f.has('regular_contractions')) push(safety({ id: 'care:pregnancy_labour_signs', type: 'care', level: 'prompt', priority: PRIORITY.prompt, title: 'Contact your midwife or maternity unit now', body: 'Leaking fluid or regular, painful tightening in pregnancy should be checked now.', reason: f.has('fluid_leak') ? 'You told us about leaking fluid.' : 'You told us about regular, painful tightening.', actions: [{ id: 'get_care', label: 'Find care' }], basis: { kind: 'red_flag', code: f.has('fluid_leak') ? 'fluid_leak' : 'regular_contractions', sources: [SOURCES.cdcMaternalWarningSigns, SOURCES.owhExercisePregnancy] } }));
  }
  // CDC heavy menstrual bleeding: changing a pad or tampon "after less than 2 hours", or soaking one or more "every hour for
  // several hours in a row", is heavy; see a provider. MedlinePlus 007496: contact your provider if bleeding causes
  // "weakness or lightheadedness". Same-day and urgent-with-dizziness levels are ayna policy (conservative).
  if (f.has('heavy_bleeding') && !out.length) push(safety({ id: 'care:heavy_bleeding', type: 'care', level: f.has('dizzy_faint') ? 'urgent' : 'prompt', priority: f.has('dizzy_faint') ? PRIORITY.urgent : PRIORITY.prompt, title: f.has('dizzy_faint') ? 'Get care right away' : 'Get heavy bleeding checked today', body: 'Very heavy bleeding, like changing pads or tampons every hour or two, should be checked.', reason: 'You told us about heavy bleeding.', actions: [{ id: 'get_care', label: 'Find care' }], basis: { kind: 'red_flag', code: 'heavy_bleeding', sources: [SOURCES.cdcHeavyBleeding, SOURCES.medlineVaginalBleeding] } }));
  // MedlinePlus 003150: contact your provider right away for "Sudden or severe pain" (was "today": changed to match).
  if (pain && !out.length) push(safety({ id: 'care:sudden_severe_pain', type: 'care', level: 'prompt', priority: PRIORITY.prompt, title: 'Get sudden or severe pain checked right away', body: 'Sudden or severe pain should be checked right away.', reason: 'You told us the pain is sudden or severe.', actions: [{ id: 'get_care', label: 'Find care' }, { id: 'urgent_signs', label: 'When to get help now' }], basis: { kind: 'red_flag', code: 'sudden_severe_pain', sources: pregnant ? [SOURCES.medlinePeriodPain, SOURCES.cdcMaternalWarningSigns] : [SOURCES.medlinePeriodPain] } }));
  // Dizziness or fainting: CDC lists it as an urgent maternal warning sign ("Seek medical care immediately") during
  // pregnancy and the year after, so then it is "now" (was "today"). Otherwise "today" is ayna policy; MedlinePlus
  // 007496 says contact your provider for bleeding that causes weakness or lightheadedness.
  const dizzyNow = pregnant || ctx.postpartum;
  if (f.has('dizzy_faint') && !out.length) push(safety({ id: 'care:dizzy_faint', type: 'care', level: 'prompt', priority: PRIORITY.prompt, title: dizzyNow ? 'Get dizziness or fainting checked now' : 'Get dizziness or fainting checked today', body: dizzyNow ? 'Feeling dizzy or faint during or after pregnancy should be checked now.' : 'Feeling dizzy or faint with your symptoms should be checked today.', reason: 'You told us you feel dizzy or faint.', actions: [{ id: 'get_care', label: 'Find care' }], basis: { kind: 'red_flag', code: 'dizzy_faint', sources: dizzyNow ? [SOURCES.cdcMaternalWarningSigns] : [SOURCES.medlineVaginalBleeding] } }));
  return out;
}

/**
 * Why today's pain (outside pregnancy) should be checked today. Each trigger
 * alone is enough (review, rule 2). Severe on 2+ days is a pattern signal.
 */
export function painTriggers({ logs, today, triage, tries, window }) {
  const entries = cleanLogs(logs);
  const t = entries.find((l) => l.day === today) || null;
  const tri = triage && triage.day === today ? triage : null;
  const prior = inWindow(entries, window).filter((l) => l.day < today && l.pain != null);
  const triggers = [];
  if (t?.pain === 3 || tri?.severity === 'severe') triggers.push('severe');
  if (tri?.sudden) triggers.push('sudden');
  if (tri?.worseThanUsual) triggers.push('worse_than_usual');
  else if (t?.pain >= 2 && prior.filter((l) => l.pain >= 1).length >= 3 && Math.max(...prior.map((l) => l.pain)) < t.pain) triggers.push('worse_than_usual');
  if (t?.pain >= 2 && prior.length >= 14 && !prior.some((l) => l.pain >= 2)) triggers.push('new');
  if (tri?.stopsActivities) triggers.push('stops_activities');
  const painTries = (tries || []).filter((x) => x && (x.need === 'period_pain' || /pain_relief|heat/.test(String(x.ref))));
  if (tri?.selfCareNotHelping || ((t?.pain ?? 0) >= 2 && painTries.some((x) => x.outcome === 'no_change'))) triggers.push('self_care_not_helping');
  const severeDays = inWindow(entries, window).filter((l) => l.pain === 3).map((l) => l.day);
  return { triggers: [...new Set(triggers)], severeDays, painToday: t?.pain ?? null };
}

const TRIGGER_WORDS = {
  severe: 'it is severe',
  sudden: 'it came on suddenly',
  worse_than_usual: 'it is worse than your usual',
  new: 'it is new for you',
  stops_activities: 'it stops you doing normal things',
  self_care_not_helping: 'your usual self-care is not helping',
};

function careCandidates({ state, ctx, logs, today, tries, window }) {
  const out = [];
  const tri = state.triage && state.triage.day === today ? state.triage : null;
  for (const id of state.redFlags || []) { const x = rfItem(typeof id === 'string' ? id : id?.id); if (x) out.push(x); }
  out.push(...redFlagItems(tri?.flags || [], ctx).filter((x) => !out.some((o) => o.id === x.id)));

  const recent = logs.filter((l) => daysBetweenDays(l.day, today) >= 0 && daysBetweenDays(l.day, today) <= 6);
  const bleeding = recent.filter((l) => l.flow && l.flow !== 'none');
  const pregnant = isPregnant(ctx);

  if (pregnant) {
    // Logged bleeding in pregnancy: always checked. MedlinePlus 003264: light early spotting is "most often nothing to be
    // concerned about", but "Treat this as a potential emergency" and contact your provider right away.
    if (bleeding.length) out.push(care({
      id: 'care:pregnancy_bleeding', type: 'care', level: 'prompt', priority: PRIORITY.prompt,
      title: 'Contact your midwife or clinician about bleeding',
      body: 'You logged bleeding while pregnant. Light bleeding can be common, but it should always be checked.',
      reason: 'You logged bleeding and said you are pregnant.',
      actions: [{ id: 'get_care', label: 'Find care' }, { id: 'urgent_signs', label: 'When to get help now' }],
      basis: { kind: 'log', days: bleeding.map((l) => l.day), sources: [SOURCES.medlinePregnancyBleeding] },
    }));
    const painRecent = recent.filter((l) => l.pain >= 1 && daysBetweenDays(l.day, today) <= 2);
    if (painRecent.length) {
      if (!tri) {
        // Triage before anything else (review, rule 4).
        out.push(safety({
          id: 'ask:pregnancy_triage', type: 'ask', level: 'prompt', priority: PRIORITY.prompt + 50,
          title: 'A few quick questions about this pain',
          body: 'Pain in pregnancy is not treated like period cramps. Your answers tell us whether to point you to care.',
          reason: 'You logged pain and said you are pregnant.',
          actions: [{ id: 'open_triage', label: 'Answer', questions: PREGNANCY_TRIAGE_QUESTIONS }],
          // Questions map to CDC urgent maternal warning signs (bleeding, fluid leaking, dizziness, severe belly pain
          // that doesn't go away) and womenshealth.gov stop signs (contractions).
          basis: { kind: 'triage', days: painRecent.map((l) => l.day), sources: [SOURCES.cdcMaternalWarningSigns, SOURCES.owhExercisePregnancy] },
        }));
      } else if (!(tri.flags || []).length) {
        if (tri.severity === 'severe' || tri.persistent || tri.worsening) {
          // CDC: "Severe belly pain that doesn't go away": seek medical care immediately, so severe pain is "now"
          // (was "today"). Constant or worsening pain that is not severe: "today" is ayna policy.
          const severeNow = tri.severity === 'severe';
          out.push(care({
            id: 'care:pregnancy_pain_today', type: 'care', level: 'prompt', priority: PRIORITY.prompt,
            title: severeNow ? 'Contact your midwife or maternity unit now' : 'Contact your midwife or maternity unit today',
            body: severeNow ? 'Severe pain in pregnancy should be checked now.' : 'Pain in pregnancy that is constant or getting worse should be checked today.',
            reason: tri.severity === 'severe' ? 'You said the pain is severe.' : 'You said the pain is constant or getting worse.',
            actions: [{ id: 'get_care', label: 'Find care' }, { id: 'urgent_signs', label: 'When to get help now' }],
            basis: { kind: 'triage', triage: tri, sources: [SOURCES.cdcMaternalWarningSigns] },
          }));
        } else if (tri.severity === 'moderate') {
          // ayna policy (no .gov page gives a rule for moderate pain): mention it, with the escalation signs.
          out.push(care({
            id: 'care:pregnancy_pain_mention', type: 'care', level: 'routine', priority: PRIORITY.routine,
            title: 'Tell your midwife about this pain',
            body: 'Mention it at your next contact, or sooner if it gets stronger, comes with bleeding or leaking fluid, or you feel faint.',
            reason: 'You said the pain is moderate.',
            actions: [{ id: 'get_care', label: 'Find care' }, { id: 'urgent_signs', label: 'When to get help now' }],
            basis: { kind: 'triage', triage: tri, sources: [SOURCES.cdcMaternalWarningSigns] },
          }));
        }
      }
    }
  } else {
    const { triggers, severeDays, painToday } = painTriggers({ logs, today, triage: tri, tries, window });
    if (triggers.length) {
      out.push(care({
        id: 'care:pain_today', type: 'care', level: 'prompt', priority: PRIORITY.prompt,
        title: 'Get this pain checked today',
        body: 'Pain that is severe, new, sudden, worse than usual, stops you doing normal things or is not easing with your usual self-care should be checked today. If painkillers have not helped, contact your doctor or an urgent care clinic today.',
        reason: `You told us ${listWords(triggers.map((x) => TRIGGER_WORDS[x]))}.`,
        actions: [{ id: 'get_care', label: 'Find care' }, { id: 'urgent_signs', label: 'When to get help now' }, { id: 'care_summary', label: 'Make a summary for my visit' }],
        // MedlinePlus 003150 (sudden or severe pain: right away; treatments not relieving pain: contact provider) and
        // womenshealth.gov period problems (OTC pain medicine not helping, or pain that interferes with work or school:
        // talk to a doctor or nurse). "New" and "worse than usual" as same-day triggers are ayna policy.
        basis: { kind: 'pain_today', triggers, painToday, signals: severeDays.length >= 2 ? ['severe_repeat'] : [], severeDays, sources: [SOURCES.medlinePeriodPain, SOURCES.owhPeriodProblems] },
        signature: triggers.join(','),
      }));
    } else if (severeDays.length >= 2) {
      out.push(care({
        id: 'care:severe_pattern', type: 'care', level: 'routine', priority: PRIORITY.routine,
        title: 'Severe pain keeps coming back',
        body: 'Severe period pain, or periods that become more painful, are worth raising with a doctor.',
        reason: `You logged severe pain on ${severeDays.length} days recently.`,
        actions: [{ id: 'get_care', label: 'Find care' }, { id: 'care_summary', label: 'Make a summary for my visit' }],
        // ayna policy: no .gov page we read says "severe pain on 2+ days"; womenshealth.gov notes some have severe cramps.
        basis: { kind: 'pattern', signal: 'severe_repeat', days: severeDays, sources: [SOURCES.owhPeriodProblems] },
        signature: `severe:${severeDays.length}`,
      }));
    }
  }

  // Bleeding after menopause: get it checked. MedlinePlus 007496: contact your provider if "You have bleeding or spotting
  // after reaching menopause".
  // Also when she picked a bleeding need in setup while in menopause or post-menopause (founder, Oct 24).
  const pickedBleeding = (state.profile?.healthIntent?.needs || []).some((n) => n?.explicit && MENSTRUAL_PRODUCT_NEEDS.has(n.id));
  if (ctx.menopause && (bleeding.length || pickedBleeding)) out.push(care({
    id: 'care:postmenopausal_bleeding', type: 'care', level: 'prompt', priority: PRIORITY.prompt,
    title: 'Get bleeding after menopause checked',
    body: 'Bleeding or spotting 12 months or more after your last period should be checked promptly by an ob-gyn or your clinician. MedlinePlus says to contact your provider about any bleeding or spotting after menopause. ayna does not suggest products for it.',
    reason: bleeding.length ? 'You logged bleeding and said you are in menopause or post-menopause.' : 'In setup you chose period or bleeding support and also menopause or post-menopause.',
    actions: [{ id: 'get_care', label: 'Find care' }],
    basis: { kind: 'log', days: bleeding.map((l) => l.day), sources: [SOURCES.medlineVaginalBleeding] },
  }));
  if (ctx.careFirst) out.push(care({
    id: 'care:intake_urgent', type: 'care', level: 'prompt', priority: PRIORITY.prompt - 20,
    title: 'Check in with a clinician first',
    body: 'You told us something may need care soon. A clinician can help before you try products.',
    reason: 'From your answers.',
    actions: [{ id: 'get_care', label: 'Find care' }, { id: 'urgent_signs', label: 'When to get help now' }],
    basis: { kind: 'intake', field: 'safetyConcern' },
  }));
  for (const t of tries) {
    if (!t?.outcome) continue;
    const cls = INTERVENTION_CLASSES[t.ref];
    if (cls?.drugClass && t.outcome === 'no_change') out.push(care({
      id: `care:otc_not_enough:${t.id}`, type: 'care', level: 'routine', priority: PRIORITY.routine,
      title: 'If pain relievers are not enough, a doctor can help',
      body: 'A doctor can help when ordinary painkillers do not work well enough.',
      reason: `You said ${lowerFirst(cls.label)} made no difference.`,
      actions: [{ id: 'get_care', label: 'Find care' }],
      // womenshealth.gov period problems: if OTC pain medicine such as ibuprofen or naproxen doesn't help, talk to a doctor or nurse.
      basis: { kind: 'outcome', tryId: t.id, drugClass: cls.drugClass, sources: [SOURCES.owhPeriodProblems, SOURCES.medlinePeriodPain] },
    }));
    if (t.outcome === 'side_effect' || t.outcome === 'worse') out.push(care({
      id: `care:reaction:${t.id}`, type: 'care', level: 'routine', priority: PRIORITY.routine,
      title: 'Ask a pharmacist or clinician about what happened',
      body: 'If something you tried made things worse or caused a side effect, it is worth stopping and asking a professional.',
      reason: t.outcome === 'worse' ? 'You said it made things worse.' : 'You said it caused a side effect.',
      actions: [{ id: 'get_care', label: 'Find care' }],
      basis: { kind: 'outcome', tryId: t.id },
    }));
  }
  return out;
}

// ─── Other candidate builders ──────────────────────────────────────────────
function isDue(t, today) {
  if (!t || t.outcome || t.status === 'recorded') return false;
  if (t.status === 'due') return true;
  if (!t.startedDay || !Number(t.horizonDays)) return false;
  return tryStatus({ ...t, horizonDays: Number(t.horizonDays) }, today) === 'due';
}

function followUpCandidates(tries, today, labels) {
  return tries.filter((t) => isDue(t, today)).map((t) => {
    const cls = INTERVENTION_CLASSES[t.ref];
    const name = labels?.[t.ref] || (cls ? lowerFirst(cls.label) : t.kind === 'product' ? 'the product you tried' : 'what you tried');
    const days = t.startedDay ? daysBetweenDays(t.startedDay, today) : null;
    return item({
      id: `follow_up:${t.id}`, tier: 'symptom', type: 'follow_up', priority: PRIORITY.follow_up,
      title: `Did ${name} help?`,
      body: days != null ? `You started ${days} ${days === 1 ? 'day' : 'days'} ago. Your answer shapes what ayna suggests next.` : 'Your answer shapes what ayna suggests next.',
      reason: 'It is time to check how it went.',
      actions: OUTCOMES.map((o) => ({ id: `outcome:${o}`, label: OUTCOME_LABELS[o] })),
      basis: { kind: 'try', tryId: t.id, need: t.need || null, startedDay: t.startedDay, horizonDays: t.horizonDays },
      due: true,
    });
  });
}

function patternTitle(p) {
  const metric = PATTERN_METRICS[p.metric];
  if (!metric) return p.text || 'A pattern in your logs';
  const word = metric.words?.[p.direction] || 'different';
  const when = p.window === 'premenstrual' ? 'before your period' : p.window === 'menstrual' ? 'early in your period' : 'at the same point in your cycle';
  return `${metric.label} is ${word} ${when}`;
}

/**
 * Cycle patterns describe her periods. While she is pregnant they say nothing
 * about now: a pattern observed before the pregnancy started is not shown,
 * and when we don't know when it started, no cycle pattern is shown.
 */
export function patternBeforePregnancy(p, { pregnant, pregnancyStartDay = null } = {}) {
  if (!pregnant) return false;
  if (!pregnancyStartDay) return true;
  const to = p?.observed?.to;
  return !to || to < pregnancyStartDay;
}

function insightCandidates(patterns, removed, pregnancy = {}) {
  const out = [];
  for (const p of patterns) {
    if (!p?.id) continue;
    if (patternBeforePregnancy(p, pregnancy)) {
      removed.push({ id: `insight:${p.id}`, code: 'pregnancy_pattern', reason: pregnancy.pregnancyStartDay ? 'Observed before this pregnancy.' : 'Cycle patterns are not shown while pregnant when the start of the pregnancy is not known.' });
      continue;
    }
    if (!strongPattern(p)) { removed.push({ id: `insight:${p.id}`, code: 'weak_pattern', reason: 'Pattern seen in too few cycles to show.' }); continue; }
    const need = p.direction === 'easier' ? null : needForMetric(p.metric);
    const { cycles, of } = p.basis;
    out.push(item({
      id: `insight:${p.id}`, tier: 'wellness', type: 'insight', priority: PRIORITY.insight + Math.round((cycles / of) * 50),
      title: patternTitle(p),
      body: p.text || '',
      reason: `Seen in ${cycles} of your last ${of} cycles.`,
      actions: [...(need ? [{ id: 'show_options', label: 'Show options', need }] : []), { id: 'not_relevant', label: 'Not relevant' }],
      basis: { kind: 'pattern', patternId: p.id, metric: p.metric, window: p.window, cycles, of, direction: p.direction ?? null, confidence: p.confidence ?? null },
      signature: `${cycles}/${of}:${p.direction ?? ''}`,
      need,
    }));
  }
  return out;
}

function checkInCandidate(logs, today, phase, needs) {
  const todays = logs.find((l) => l.day === today) || null;
  if (!logs.length) {
    return item({
      id: 'check_in:daily', tier: 'wellness', type: 'check_in', priority: PRIORITY.check_in_empty,
      title: 'Start with a quick check-in', body: 'A few taps a day is how ayna learns your patterns.', reason: 'Nothing logged yet.',
      actions: [{ id: 'open_check_in', label: 'Check in' }], basis: { kind: 'log_gap', missing: [...LOG_FIELD_LIST] },
    });
  }
  const relevant = new Set(['sleep', 'mood']);
  if (needs.period_pain || needs.pregnancy_pain || phase?.id === 'period') { relevant.add('pain'); relevant.add('flow'); }
  if (needs.pms || phase?.id === 'luteal') relevant.add('pms');
  const missing = LOG_FIELD_LIST.filter((f) => relevant.has(f) && (todays == null || todays[f] == null));
  if (!missing.length) return null;
  return item({
    id: 'check_in:daily', tier: 'wellness', type: 'check_in', priority: PRIORITY.check_in,
    title: todays ? `Add ${listWords(missing.map((f) => FIELD_WORDS[f]))}` : 'How are you today?',
    body: todays ? 'A couple more taps finishes today.' : 'Log today so your picture stays complete.',
    reason: todays ? 'Today is partly logged.' : 'Today is not logged yet.',
    actions: [{ id: 'open_check_in', label: 'Check in', fields: missing }],
    basis: { kind: 'log_gap', missing },
  });
}

// Information gap (section 12): the single question that would change the
// decision. Pregnancy first, then medicines, conditions, allergies.
const ASK_ORDER = ['pregnancy', 'medications', 'conditions', 'allergies', 'breastfeeding'];
const ASK_COPY = {
  pregnancy: { title: 'Could you be pregnant?', body: 'This changes which pain relievers are suitable.', actions: [{ id: 'answer:pregnancy:no', label: 'No' }, { id: 'answer:pregnancy:yes', label: 'Yes' }, { id: 'answer:pregnancy:not_sure', label: 'Not sure' }] },
  medications: { title: 'Do you take any regular medicines?', body: 'Some, like blood thinners, steroids, water pills and some antidepressants, do not mix well with pain relievers.', actions: [{ id: 'answer:medications:none', label: 'No' }, { id: 'answer:medications:add', label: 'Add medicines' }] },
  conditions: { title: 'Any of these health conditions?', body: 'Stomach ulcers or bleeding, kidney, liver or heart problems, high blood pressure or asthma change which pain relievers are suitable.', actions: [{ id: 'answer:conditions:none', label: 'None of these' }, { id: 'answer:conditions:add', label: 'Add conditions' }] },
  allergies: { title: 'Have you reacted to a pain reliever before?', body: 'For example ibuprofen, naproxen, aspirin or acetaminophen.', actions: [{ id: 'answer:allergies:no', label: 'No' }, { id: 'answer:allergies:yes', label: 'Yes' }] },
  breastfeeding: { title: 'Are you breastfeeding or pumping?', body: 'This changes which pain relievers are suitable.', actions: [{ id: 'answer:breastfeeding:no', label: 'No' }, { id: 'answer:breastfeeding:yes', label: 'Yes' }] },
};

function optionCandidates({ needs, ctx, ready, intent, products, removedBySafety, asks, triagePassed }) {
  const out = [];
  const targetNeeds = intent?.need && NEEDS[intent.need] ? [intent.need === 'period_pain' && isPregnant(ctx) ? 'pregnancy_pain' : intent.need] : Object.keys(needs);
  for (const need of targetNeeds) {
    const preg = need === 'pregnancy_pain';
    classesForNeed(need).forEach((cls, rank) => {
      if (cls.id === 'care') return;
      // "Track it for three cycles" needs a cycle: never for someone without one.
      if (cls.id === 'tracking' && ctx.noCycle && need !== 'pregnancy_pain') return;
      const id = `option:${cls.id}:${need}`;
      const safetyResult = evaluateClassSafety(cls.id, ctx, need);
      if (safetyResult.verdict === 'block') {
        removedBySafety.push({ id, classId: cls.id, drugClass: cls.drugClass, need, reasons: safetyResult.blocks.map(pick) });
        return;
      }
      if (safetyResult.verdict === 'ask') {
        removedBySafety.push({ id, classId: cls.id, drugClass: cls.drugClass, need, reasons: safetyResult.asks.map(pick), pendingAnswer: true });
        safetyResult.asks.forEach((a) => asks.push({ ...a, classId: cls.id, need }));
        return;
      }
      if (preg && !triagePassed) { removedBySafety.push({ id, classId: cls.id, need, reasons: [{ code: 'pregnancy_triage_first', reason: 'Pregnancy pain triage comes first.' }], pendingAnswer: true }); return; }
      if (!ready) return; // options wait until she asks (section 73)
      const consult = safetyResult.verdict === 'consult';
      const summary = (preg && cls.summaryPregnancy) || cls.summary;
      const caution = (preg && cls.cautionPregnancy) || cls.caution;
      const lead = consult ? `Ask a doctor or pharmacist before using this. ${safetyResult.consults.map((c) => c.reason).join(' ')} ` : '';
      out.push(item({
        id, tier: 'symptom', type: 'option', priority: PRIORITY.option - rank * 10,
        title: cls.label,
        body: `${lead}${summary}${caution ? ` ${caution}` : ''}`,
        reason: `For your ${needLabelFor(need, ctx)}.`,
        actions: [
          ...(consult ? [] : [{ id: 'try_this', label: 'Try this', classId: cls.id, need, horizonDays: cls.followUpDays }]),
          { id: 'not_relevant', label: 'Not relevant' },
        ],
        basis: { kind: 'class', classId: cls.id, drugClass: cls.drugClass, need, sources: (preg && cls.sourcesPregnancy) || cls.sources, informationOnly: Boolean(cls.informationOnly), consult: consult ? safetyResult.consults.map(pick) : null },
        classId: cls.id, drugClass: cls.drugClass, need,
      }));
      // Requested products: lowest tier, only for classes that allow them,
      // only products that pass their own label.
      if (cls.productsAllowed) {
        const list = productsForClass(products, cls.id, { ctx, removed: removedBySafety });
        if (list.length) out.push(item({
          id: `products:${cls.id}:${need}`, tier: 'products', type: 'products', priority: PRIORITY.products - rank,
          title: `${cls.label} products`,
          body: 'Products that fit this option. Check each label before use.',
          reason: `You asked to see options for your ${needLabelFor(need, ctx)}.`,
          actions: [{ id: 'see_products', label: 'See products', productIds: list.map((p) => p.id) }, { id: 'not_relevant', label: 'Not relevant' }],
          basis: { kind: 'products', classId: cls.id, need },
          classId: cls.id, need, productIds: list.map((p) => p.id),
        }));
      }
    });
  }
  return out;
}

// ─── decide ────────────────────────────────────────────────────────────────
export function decide(state = {}) {
  const logs = cleanLogs(state.logs);
  const tries = Array.isArray(state.tries) ? state.tries : [];
  const patterns = Array.isArray(state.patterns) ? state.patterns : [];
  const today = state.today || logs.at(-1)?.day || '1970-01-01';
  const seen = state.seen || {};
  const dismissed = state.dismissed || {};
  const ctx = safetyContextFrom(state.profile || null);
  const window = needsWindow({ logs, cycleStarts: state.cycleStarts || [], today });
  const needs = activeNeeds({ profile: state.profile, logs, patterns, today, cycleStarts: state.cycleStarts || [] });
  const ready = Boolean(state.intent?.showOptions) || READY_STAGES.has(state.readiness);
  const tri = state.triage && state.triage.day === today ? state.triage : null;
  const triagePassed = Boolean(tri) && !(tri.flags || []).length && !tri.persistent && !tri.worsening && (tri.severity === 'mild' || tri.severity === 'moderate');

  const removedBySafety = [];
  const asks = [];
  const removedOther = [];
  const candidates = [
    ...careCandidates({ state, ctx, logs, today, tries, window }),
    ...followUpCandidates(tries, today, state.labels),
    ...insightCandidates(patterns, removedOther, { pregnant: isPregnant(ctx), pregnancyStartDay: state.pregnancyStartDay || null }),
  ];
  candidates.push(...optionCandidates({ needs, ctx, ready, intent: state.intent, products: state.products, removedBySafety, asks, triagePassed }));

  if (ready && asks.length) {
    const field = ASK_ORDER.find((f) => asks.some((a) => a.field === f));
    const copy = field && ASK_COPY[field];
    if (copy) {
      const unlocks = [...new Set(asks.filter((a) => a.field === field).map((a) => a.classId))];
      candidates.push(item({
        id: `ask:${field}`, tier: 'symptom', type: 'ask', priority: PRIORITY.ask,
        title: copy.title, body: copy.body,
        reason: `Your answer decides whether ${listWords(unlocks.map((c) => lowerFirst(INTERVENTION_CLASSES[c].label)))} ${unlocks.length > 1 ? 'are' : 'is'} suitable for you.`,
        actions: copy.actions,
        basis: { kind: 'information_gap', field, unlocks },
      }));
    }
  }
  const checkIn = checkInCandidate(logs, today, state.phase || null, needs);
  if (checkIn) candidates.push(checkIn);

  // Suppression and novelty: non-protected items only.
  const suppressed = [];
  const scored = [];
  for (const c of candidates) {
    const isProtected = PROTECTED_TIERS.has(c.tier);
    const d = dismissed[c.id];
    if (!isProtected && d && d.until && daysBetweenDays(today, d.until) > 0 && !(c.signature && d.signature && c.signature !== d.signature)) {
      suppressed.push({ id: c.id, why: 'dismissed', until: d.until });
      continue;
    }
    // "Don't show this type": the whole type stays hidden (never safety or care).
    const dt = dismissed[typeKey(c.type)];
    if (!isProtected && dt && dt.until && daysBetweenDays(today, dt.until) > 0) {
      suppressed.push({ id: c.id, why: 'type_dismissed', until: dt.until });
      continue;
    }
    let priority = c.priority;
    const s = seen[c.id];
    if (s && !isProtected && !c.due && !(ready && (c.type === 'option' || c.type === 'products' || c.type === 'ask'))) {
      const changed = c.signature && s.signature && c.signature !== s.signature;
      const interacted = s.lastInteracted && s.lastShown && daysBetweenDays(s.lastShown, s.lastInteracted) >= 0;
      const recent = (s.shownDays || []).filter((day) => { const n = daysBetweenDays(day, today); return n > 0 && n <= NOVELTY_WINDOW_DAYS; }).length;
      if (!changed && !interacted && recent) {
        priority = c.priority * NOVELTY_FACTOR ** recent;
        suppressed.push({ id: c.id, why: 'novelty', shownRecently: recent, from: c.priority, to: priority });
      }
    }
    scored.push({ ...c, priority });
  }

  const byRank = (a, b) => TIERS[b.tier] - TIERS[a.tier] || b.priority - a.priority || a.id.localeCompare(b.id);
  const protectedItems = scored.filter((c) => PROTECTED_TIERS.has(c.tier)).sort(byRank);
  const others = scored.filter((c) => !PROTECTED_TIERS.has(c.tier) && c.priority > PRIORITY.no_action).sort(byRank);
  const urgent = protectedItems.some((c) => c.level === 'urgent');
  // Urgent care is shown with other safety and care items only.
  const room = urgent ? 0 : Math.max(0, MAX_ITEMS - protectedItems.length);
  const chosen = [...protectedItems, ...others.slice(0, room)];
  const items = chosen.map(publicItem);
  const ranked = [...scored, { id: 'no_action', tier: 'wellness', type: 'no_action', priority: PRIORITY.no_action }].sort(byRank);

  return {
    output: pickOutput({ items, ready, needs, removedBySafety, intent: state.intent }),
    items,
    empty: items.length ? null : NOTHING_TODAY,
    debug: {
      today, window, needs,
      eligible: scored.map((c) => c.id),
      removedBySafety,
      removed: removedOther,
      suppressed,
      ranked: ranked.map((c) => ({ id: c.id, tier: c.tier, type: c.type, priority: c.priority })),
    },
  };
}

function pickOutput({ items, ready, needs, removedBySafety, intent }) {
  const top = items[0];
  if (top?.type === 'care') return 'escalate';
  if (top?.type === 'ask') return 'ask_more';
  const asked = ready && (intent?.need || Object.keys(needs).length);
  const noneLeft = !items.some((i) => i.type === 'option' || i.type === 'ask');
  if (asked && noneLeft && removedBySafety.some((r) => !r.pendingAnswer)) return 'abstain';
  if (!top) return 'no_action';
  if (items.some((i) => i.type === 'option')) return 'show_options';
  if (top.type === 'insight') return 'answer';
  return 'monitor';
}

// ─── helpers ───────────────────────────────────────────────────────────────
function item(fields) {
  return { actions: [], basis: null, reason: '', body: '', signature: null, ...fields };
}
function pick({ code, reason, source }) {
  return { code, reason, source };
}
function publicItem(c) {
  const out = { id: c.id, type: c.type, tier: c.tier, title: c.title, body: c.body, reason: c.reason, actions: c.actions, basis: c.basis };
  for (const k of ['level', 'signature', 'classId', 'drugClass', 'need']) if (c[k]) out[k] = c[k];
  if (c.productIds?.length) out.productIds = c.productIds;
  return out;
}
function lowerFirst(s) {
  const t = String(s || '');
  return /^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}
function listWords(words) {
  const w = words.filter(Boolean);
  if (w.length <= 1) return w[0] || '';
  return `${w.slice(0, -1).join(', ')} and ${w.at(-1)}`;
}
