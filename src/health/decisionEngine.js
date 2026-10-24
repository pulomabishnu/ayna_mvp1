/**
 * Decision engine for Today (master prompt sections 12 to 18, 62, 63, 71,
 * 73, 135, 136). Rules, not a model. Pure: same state in, same decision out.
 *
 *   decide(state) -> { output, items, debug }
 *
 * Order of work:
 *   1. Work out which wedge needs are active, from what she chose in the
 *      intake, what she logged and detected patterns. Never from browsing,
 *      saves or reading (section 39: interest is not history).
 *   2. Build candidates of every type: care, due follow-ups, insights,
 *      the one question that would change the decision, options, a check-in
 *      and NO_ACTION.
 *   3. Safety is a hard gate: blocked classes are removed (debug says why).
 *      Care is never gated, and red-flag care outranks everything.
 *   4. Suppression: "Not relevant" dismissals hide an item for a period;
 *      novelty decay lowers items shown recently that she did not act on.
 *   5. Rank, keep what beats NO_ACTION, cap at 3. Zero items is allowed.
 *
 * Inputs (all optional):
 *   today      'YYYY-MM-DD' (defaults to the latest log day, else 1970-01-01; pass it)
 *   logs       [{ day, pain:0-3|null, flow, pms:0-3|null, sleep:1-3|null, mood:1-3|null, skin:1-3|null }]
 *   tries      [{ id, kind, ref, need, startedDay, horizonDays, status, outcome }]
 *   patterns   [{ id, metric, window, text, basis:{ cycles, of }, direction }]
 *   profile    buildUserProfile() output (src/matching/userProfile.js)
 *   phase      estimatePhase() output (src/health/phase.js) or null
 *   redFlags   red-flag ids she reported (src/data/matching/redFlags.research.json)
 *   seen       SeenMap (see markShown); dismissed: DismissedMap (see dismiss)
 *   intent     { showOptions?: boolean, need?: 'period_pain'|'pms'|'cycle_sleep' }
 *   readiness  'discovering'|'understanding'|'comparing'|'deciding'|'acting'|'experiencing'|'evaluating'
 *   products   catalog list, used only to attach products inside an approved class
 *   labels     { [tryRef]: 'Plain name' } for follow-up titles
 */
import RED_FLAGS from '../data/matching/redFlags.research.json';
import {
  INTERVENTION_CLASSES, INTAKE_NEED_MAP, NEEDS, SOURCES,
  classesForNeed, evaluateClassSafety, productsForClass, safetyContextFrom,
} from './interventions.js';

export const OUTPUTS = ['answer', 'ask_more', 'show_options', 'monitor', 'escalate', 'abstain', 'no_action'];
export const MAX_ITEMS = 3;
export const NOTHING_TODAY = 'Nothing unusual stands out today';

// Base priorities. Higher wins. NO_ACTION is a real candidate: anything that
// ends up below it is not worth her attention today (section 71).
export const PRIORITY = {
  care_urgent: 1000,
  care_prompt: 850,
  follow_up: 800,
  ask: 700,
  care_routine: 600,
  insight: 500,
  option: 400,
  check_in_empty: 380,
  check_in: 300,
  no_action: 200,
};

// Novelty decay (section 63).
export const NOVELTY_WINDOW_DAYS = 7;
export const NOVELTY_FACTOR = 0.5; // per showing in the window without interaction
// "Not relevant" hides an item for this long (section 44 style explicit feedback).
export const DISMISS_DAYS = 30;

const RECENT_DAYS = 45; // log window for "recurring" needs
const READY_STAGES = new Set(['comparing', 'deciding', 'acting']);
const LOG_FIELDS = ['pain', 'flow', 'pms', 'sleep', 'mood', 'skin'];
const FIELD_WORDS = { pain: 'pain', flow: 'flow', pms: 'PMS', sleep: 'sleep', mood: 'mood', skin: 'skin' };
const OUTCOMES = ['helpful', 'no_change', 'worse', 'side_effect', 'unsure', 'stopped'];
const OUTCOME_LABELS = { helpful: 'Helped', no_change: 'No change', worse: 'Worse', side_effect: 'Side effect', unsure: 'Not sure yet', stopped: 'Stopped' };
const RED_FLAG_BY_ID = new Map(RED_FLAGS.map((r) => [r.id, r]));

// ─── Dates ─────────────────────────────────────────────────────────────────
const DAY_MS = 86400000;
const toMs = (day) => Date.parse(`${day}T00:00:00Z`);
export function daysBetween(a, b) {
  const x = toMs(a); const y = toMs(b);
  return Number.isFinite(x) && Number.isFinite(y) ? Math.round((y - x) / DAY_MS) : null;
}
export function addDays(day, n) {
  const ms = toMs(day);
  return Number.isFinite(ms) ? new Date(ms + n * DAY_MS).toISOString().slice(0, 10) : null;
}

// ─── Seen / dismissed maps ─────────────────────────────────────────────────
/**
 * SeenMap:      { [itemId]: { lastShown: day, shownDays: day[], timesShown: n, lastInteracted: day|null, signature: string|null } }
 * DismissedMap: { [itemId]: { day, reason: 'not_relevant', until: day, signature: string|null } }
 * Both are plain JSON so callers can keep them in localStorage or sync them.
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
export function dismiss(dismissed = {}, itemOrId, today, reason = 'not_relevant', days = DISMISS_DAYS) {
  const id = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
  const signature = typeof itemOrId === 'object' ? itemOrId?.signature ?? null : null;
  return { ...dismissed, [id]: { day: today, reason, until: addDays(today, days), signature } };
}

// ─── Needs ─────────────────────────────────────────────────────────────────
const recentLogs = (logs, today) => logs.filter((l) => {
  const d = daysBetween(l.day, today);
  return d != null && d >= 0 && d <= RECENT_DAYS;
});

/**
 * Active wedge needs and why. Sources: 'intake' (she chose it), 'log' (she
 * logged it on several days), 'pattern' (a detected cycle pattern).
 * Browsing, saves, reads and Community activity are never read here.
 */
export function activeNeeds({ profile, logs = [], patterns = [], today }) {
  const out = {};
  const add = (need, source, detail) => {
    if (!NEEDS[need]) return;
    out[need] = out[need] || { id: need, sources: [] };
    out[need].sources.push({ source, detail });
  };
  for (const n of profile?.healthIntent?.needs || []) {
    if (n?.explicit && INTAKE_NEED_MAP[n.id]) add(INTAKE_NEED_MAP[n.id], 'intake', n.id);
  }
  const recent = recentLogs(logs, today);
  const painDays = recent.filter((l) => l.pain >= 2).length;
  const pmsDays = recent.filter((l) => l.pms >= 2).length;
  const poorSleep = recent.filter((l) => l.sleep === 1).length;
  if (painDays >= 2) add('period_pain', 'log', `${painDays} days`);
  if (pmsDays >= 2) add('pms', 'log', `${pmsDays} days`);
  if (poorSleep >= 3) add('cycle_sleep', 'log', `${poorSleep} nights`);
  for (const p of patterns) {
    const need = needForMetric(p?.metric);
    if (need && strongPattern(p)) add(need, 'pattern', p.id);
  }
  return out;
}
function needForMetric(metric) {
  return { pain: 'period_pain', flow: null, pms: 'pms', sleep: 'cycle_sleep', mood: 'pms' }[metric] || null;
}
function strongPattern(p) {
  const c = Number(p?.basis?.cycles); const of = Number(p?.basis?.of);
  return Number.isFinite(c) && Number.isFinite(of) && of >= 2 && c >= 2 && c / of >= 0.5;
}

// ─── Care rules (section 18) ───────────────────────────────────────────────
const ACTION_WORDS = { 'call 911': 'Call 911', 'go to ER': 'Go to the ER', 'call your clinician today': 'Call your clinician today' };

function careCandidates({ redFlags = [], ctx, logs, today, tries }) {
  const out = [];
  // Reported red flags: urgent, never suppressed or decayed.
  for (const raw of redFlags) {
    const id = typeof raw === 'string' ? raw : raw?.id;
    const rf = RED_FLAG_BY_ID.get(id);
    if (!rf) continue;
    const urgent = rf.action === 'call 911' || rf.action === 'go to ER';
    out.push(item({
      id: `care:${rf.id}`, type: 'care', level: urgent ? 'urgent' : 'prompt',
      priority: urgent ? PRIORITY.care_urgent : PRIORITY.care_prompt,
      title: ACTION_WORDS[rf.action] || 'Get care now',
      body: `These can be signs of ${lowerFirst(rf.condition)}: ${rf.signs.map(lowerFirst).join('; ')}.`,
      reason: 'You told us about signs that need care now.',
      actions: [{ id: 'get_care', label: ACTION_WORDS[rf.action] || 'Get care' }],
      basis: { kind: 'red_flag', ids: [rf.id], sources: [{ label: 'Source', url: rf.source_url }] },
      sticky: true,
    }));
  }
  const recent = recentLogs(logs, today);
  const bleeding = recent.filter((l) => l.flow && l.flow !== 'none');
  // Bleeding in pregnancy: contact midwife or GP (nidirect, adapted from NHS).
  if ((ctx.pregnancy === 'pregnant') && bleeding.length) {
    out.push(item({
      id: 'care:pregnancy_bleeding', type: 'care', level: 'prompt', priority: PRIORITY.care_prompt,
      title: 'Contact your midwife or clinician about bleeding',
      body: 'You logged bleeding while pregnant. Light bleeding can be common, but it should always be checked.',
      reason: 'You logged bleeding and said you are pregnant.',
      actions: [{ id: 'get_care', label: 'Find care' }, { id: 'urgent_signs', label: 'When to get help now' }],
      basis: { kind: 'log', days: bleeding.map((l) => l.day), sources: [SOURCES.nhsPregnancyBleeding] },
      sticky: true,
    }));
  }
  // Pain while pregnant: care leads instead of period-pain options.
  const painDays = recent.filter((l) => l.pain >= 2);
  if (ctx.pregnancy === 'pregnant' && painDays.length) {
    out.push(item({
      id: 'care:pregnancy_pain', type: 'care', level: 'prompt', priority: PRIORITY.care_prompt - 10,
      title: 'Tell your midwife or clinician about this pain',
      body: 'Belly pain in pregnancy is worth checking, especially if it is on one side or comes with bleeding.',
      reason: 'You logged pain and said you are pregnant.',
      actions: [{ id: 'get_care', label: 'Find care' }, { id: 'urgent_signs', label: 'When to get help now' }],
      basis: { kind: 'log', days: painDays.map((l) => l.day), sources: [SOURCES.nhsPregnancyBleeding, { label: 'NHS: Ectopic pregnancy symptoms', url: RED_FLAG_BY_ID.get('rf.ectopic_suspected')?.source_url }] },
      sticky: true,
    }));
  }
  // Bleeding after menopause: get it checked by a GP (NHS).
  if (ctx.menopause && bleeding.length) {
    out.push(item({
      id: 'care:postmenopausal_bleeding', type: 'care', level: 'prompt', priority: PRIORITY.care_prompt,
      title: 'Get bleeding after menopause checked',
      body: 'The NHS says any bleeding after menopause should be checked by a doctor, even if it is light or happened once.',
      reason: 'You logged bleeding and said you are in menopause or post-menopause.',
      actions: [{ id: 'get_care', label: 'Find care' }],
      basis: { kind: 'log', days: bleeding.map((l) => l.day), sources: [SOURCES.nhsPostmenopausalBleeding] },
      sticky: true,
    }));
  }
  // She answered "Yes" to the urgent question in the intake (careFirst).
  if (ctx.careFirst) {
    out.push(item({
      id: 'care:intake_urgent', type: 'care', level: 'prompt', priority: PRIORITY.care_prompt - 20,
      title: 'Check in with a clinician first',
      body: 'You told us something may need care soon. A clinician can help before you try products.',
      reason: 'From your answers.',
      actions: [{ id: 'get_care', label: 'Find care' }, { id: 'urgent_signs', label: 'When to get help now' }],
      basis: { kind: 'intake', field: 'safetyConcern' },
    }));
  }
  // Severe period pain on several days: see a GP (NHS period pain).
  const severe = recent.filter((l) => l.pain === 3);
  if (ctx.pregnancy !== 'pregnant' && severe.length >= 2) {
    out.push(item({
      id: 'care:severe_period_pain', type: 'care', level: 'routine', priority: PRIORITY.care_routine,
      title: 'Severe pain is worth a visit',
      body: 'The NHS suggests seeing a GP for severe period pain, or if your usual pain changes.',
      reason: `You logged severe pain on ${severe.length} days recently.`,
      actions: [{ id: 'get_care', label: 'Find care' }, { id: 'care_summary', label: 'Make a summary for my visit' }],
      basis: { kind: 'log', days: severe.map((l) => l.day), sources: [SOURCES.nhsPeriodPain] },
      signature: `severe:${severe.length}`,
    }));
  }
  // Pain relievers did not help, or caused a problem.
  for (const t of tries) {
    if (t?.status !== 'recorded') continue;
    if (t.ref === 'otc_pain_relief' && t.outcome === 'no_change') {
      out.push(item({
        id: `care:otc_not_enough:${t.id}`, type: 'care', level: 'routine', priority: PRIORITY.care_routine,
        title: 'If pain relievers are not enough, a GP can help',
        body: 'The NHS says a GP can help when ordinary painkillers do not work well enough.',
        reason: 'You said pain relievers made no difference.',
        actions: [{ id: 'get_care', label: 'Find care' }],
        basis: { kind: 'outcome', tryId: t.id, sources: [SOURCES.nhsPeriodPain] },
      }));
    }
    if (t.outcome === 'side_effect' || t.outcome === 'worse') {
      out.push(item({
        id: `care:reaction:${t.id}`, type: 'care', level: 'routine', priority: PRIORITY.care_routine,
        title: 'Ask a pharmacist or clinician about what happened',
        body: 'If something you tried made things worse or caused a side effect, it is worth stopping and asking a professional.',
        reason: t.outcome === 'worse' ? 'You said it made things worse.' : 'You said it caused a side effect.',
        actions: [{ id: 'get_care', label: 'Find care' }],
        basis: { kind: 'outcome', tryId: t.id },
      }));
    }
  }
  return out;
}

// ─── Other candidate builders ──────────────────────────────────────────────
function isDue(t, today) {
  if (!t || t.status === 'recorded') return false;
  if (t.status === 'due') return true;
  const elapsed = daysBetween(t.startedDay, today);
  return t.status === 'pending' && elapsed != null && Number(t.horizonDays) > 0 && elapsed >= Number(t.horizonDays);
}

function followUpCandidates(tries, today, labels) {
  return tries.filter((t) => isDue(t, today)).map((t) => {
    const name = labels?.[t.ref] || (INTERVENTION_CLASSES[t.ref] ? lowerFirst(INTERVENTION_CLASSES[t.ref].label) : t.kind === 'product' ? 'the product you tried' : 'what you tried');
    const days = daysBetween(t.startedDay, today);
    return item({
      id: `follow_up:${t.id}`, type: 'follow_up', priority: PRIORITY.follow_up,
      title: `Did ${name} help?`,
      body: days != null ? `You started ${days} ${days === 1 ? 'day' : 'days'} ago. Your answer shapes what ayna suggests next.` : 'Your answer shapes what ayna suggests next.',
      reason: 'It is time to check how it went.',
      actions: OUTCOMES.map((o) => ({ id: `outcome:${o}`, label: OUTCOME_LABELS[o] })),
      basis: { kind: 'try', tryId: t.id, need: t.need || null, startedDay: t.startedDay, horizonDays: t.horizonDays },
      due: true,
    });
  });
}

const METRIC_WORDS = { sleep: 'sleep', pain: 'pain', pms: 'PMS', mood: 'mood', skin: 'skin', flow: 'flow' };
function patternTitle(p) {
  const word = METRIC_WORDS[p.metric];
  if (!word) return p.text || 'A pattern in your logs';
  const before = /pre|luteal|before/i.test(String(p.window || ''));
  if (before) return p.direction === 'up' ? `Your ${word} rises before your period` : p.direction === 'down' ? `Your ${word} dips before your period` : `Your ${word} changes before your period`;
  return `Your ${word} follows your cycle`;
}

function insightCandidates(patterns, removed) {
  const out = [];
  for (const p of patterns) {
    if (!p?.id) continue;
    if (!strongPattern(p)) { removed.push({ id: `insight:${p.id}`, code: 'weak_pattern', reason: 'Pattern seen in too few cycles to show.' }); continue; }
    const need = needForMetric(p.metric);
    const { cycles, of } = p.basis;
    out.push(item({
      id: `insight:${p.id}`, type: 'insight', priority: PRIORITY.insight + Math.round((cycles / of) * 50),
      title: patternTitle(p),
      body: p.text || '',
      reason: `Seen in ${cycles} of your last ${of} cycles.`,
      actions: [
        ...(need ? [{ id: 'show_options', label: 'Show options', need }] : []),
        { id: 'not_relevant', label: 'Not relevant' },
      ],
      basis: { kind: 'pattern', patternId: p.id, metric: p.metric, window: p.window, cycles, of, direction: p.direction ?? null },
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
      id: 'check_in:daily', type: 'check_in', priority: PRIORITY.check_in_empty,
      title: 'Start with a quick check-in',
      body: 'A few taps a day is how ayna learns your patterns.',
      reason: 'Nothing logged yet.',
      actions: [{ id: 'open_check_in', label: 'Check in' }],
      basis: { kind: 'log_gap', missing: [...LOG_FIELDS] },
    });
  }
  // Fields that matter today: sleep and mood always, plus what her needs and phase point to.
  const relevant = new Set(['sleep', 'mood']);
  if (needs.period_pain || phase?.id === 'period') { relevant.add('pain'); relevant.add('flow'); }
  if (needs.pms || phase?.id === 'luteal') relevant.add('pms');
  const missing = [...relevant].filter((f) => todays == null || todays[f] == null);
  if (!missing.length) return null;
  const ordered = LOG_FIELDS.filter((f) => missing.includes(f));
  return item({
    id: 'check_in:daily', type: 'check_in', priority: PRIORITY.check_in,
    title: todays ? `Add ${listWords(ordered.map((f) => FIELD_WORDS[f]))}` : 'How are you today?',
    body: todays ? 'A couple more taps finishes today.' : 'Log today so tomorrow’s picture is complete.',
    reason: todays ? 'Today is partly logged.' : 'Today is not logged yet.',
    actions: [{ id: 'open_check_in', label: 'Check in', fields: ordered }],
    basis: { kind: 'log_gap', missing: ordered },
  });
}

// Information gap (section 12): the single question that would change the
// decision. Order: pregnancy first, then medicines, conditions, allergies.
const ASK_ORDER = ['pregnancy', 'medications', 'conditions', 'allergies', 'breastfeeding', 'ttc'];
const ASK_COPY = {
  pregnancy: { title: 'Could you be pregnant?', body: 'This changes which pain relievers are suitable.', actions: [{ id: 'answer:pregnancy:no', label: 'No' }, { id: 'answer:pregnancy:yes', label: 'Yes' }, { id: 'answer:pregnancy:not_sure', label: 'Not sure' }] },
  medications: { title: 'Do you take any regular medicines?', body: 'Some, like blood thinners, antidepressants and blood pressure medicines, do not mix well with ibuprofen.', actions: [{ id: 'answer:medications:none', label: 'No' }, { id: 'answer:medications:add', label: 'Add medicines' }] },
  conditions: { title: 'Any of these health conditions?', body: 'Stomach ulcers, kidney, liver or heart problems, a bleeding problem, high blood pressure or asthma change which pain relievers are suitable.', actions: [{ id: 'answer:conditions:none', label: 'None of these' }, { id: 'answer:conditions:add', label: 'Add conditions' }] },
  allergies: { title: 'Have you reacted to pain relievers before?', body: 'For example ibuprofen, aspirin or naproxen.', actions: [{ id: 'answer:allergies:no', label: 'No' }, { id: 'answer:allergies:yes', label: 'Yes' }] },
  breastfeeding: { title: 'Are you breastfeeding or pumping?', body: 'This changes which pain relievers are suitable.', actions: [{ id: 'answer:breastfeeding:no', label: 'No' }, { id: 'answer:breastfeeding:yes', label: 'Yes' }] },
  ttc: { title: 'Check with a pharmacist first', body: 'You are trying to conceive, and ibuprofen may not be suitable. A pharmacist can suggest what fits.', actions: [{ id: 'got_it', label: 'Got it' }] },
};

// ─── Options from intervention classes ─────────────────────────────────────
function optionCandidates({ needs, ctx, ready, intent, products, removedBySafety, asks }) {
  const out = [];
  const targetNeeds = intent?.need && NEEDS[intent.need] ? [intent.need] : Object.keys(needs);
  for (const need of targetNeeds) {
    classesForNeed(need).forEach((cls, rank) => {
      if (cls.id === 'care') return; // care has its own rules
      const id = `option:${cls.id}:${need}`;
      const safety = evaluateClassSafety(cls.id, ctx);
      if (safety.verdict === 'block') {
        removedBySafety.push({ id, classId: cls.id, need, reasons: safety.blocks.map(({ code, reason, source }) => ({ code, reason, source })) });
        return;
      }
      if (safety.verdict === 'ask') {
        // Unknown is never treated as safe: hold the option back and ask.
        removedBySafety.push({ id, classId: cls.id, need, reasons: safety.asks.map(({ code, reason, source }) => ({ code, reason, source })), pendingAnswer: true });
        safety.asks.forEach((a) => asks.push({ ...a, classId: cls.id, need }));
        return;
      }
      if (!ready) return; // options wait until she asks for them (section 73)
      const attach = cls.productsAllowed ? productsForClass(products, cls.id).map((p) => p.id) : [];
      out.push(item({
        id, type: 'option', priority: PRIORITY.option - rank * 10,
        title: cls.label,
        body: cls.caution ? `${cls.summary} ${cls.caution}` : cls.summary,
        reason: `For your ${NEEDS[need].label}.`,
        actions: [
          { id: 'try_this', label: 'Try this', classId: cls.id, need, horizonDays: cls.followUpDays },
          ...(attach.length ? [{ id: 'see_products', label: 'See products', productIds: attach }] : []),
          { id: 'not_relevant', label: 'Not relevant' },
        ],
        basis: { kind: 'class', classId: cls.id, need, sources: cls.sources, informationOnly: Boolean(cls.informationOnly) },
        classId: cls.id, need, productIds: attach,
      }));
    });
  }
  return out;
}

// ─── decide ────────────────────────────────────────────────────────────────
export function decide(state = {}) {
  const logs = (Array.isArray(state.logs) ? state.logs : []).filter((l) => l && l.day);
  const tries = Array.isArray(state.tries) ? state.tries : [];
  const patterns = Array.isArray(state.patterns) ? state.patterns : [];
  const today = state.today || logs.map((l) => l.day).sort().at(-1) || '1970-01-01';
  const seen = state.seen || {};
  const dismissed = state.dismissed || {};
  const ctx = safetyContextFrom(state.profile || null);
  const needs = activeNeeds({ profile: state.profile, logs, patterns, today });
  const ready = Boolean(state.intent?.showOptions) || READY_STAGES.has(state.readiness);

  const removedBySafety = [];
  const asks = [];
  const removedOther = [];
  const candidates = [
    ...careCandidates({ redFlags: state.redFlags || [], ctx, logs, today, tries }),
    ...followUpCandidates(tries, today, state.labels),
    ...insightCandidates(patterns, removedOther),
  ];
  const options = optionCandidates({ needs, ctx, ready, intent: state.intent, products: state.products, removedBySafety, asks });
  candidates.push(...options);

  // The one question, only when an answer would change what we can show:
  // she wants options and a class is waiting on it.
  if (ready && asks.length) {
    const field = ASK_ORDER.find((f) => asks.some((a) => a.field === f));
    const copy = field && ASK_COPY[field];
    if (copy) {
      const unlocks = [...new Set(asks.filter((a) => a.field === field).map((a) => a.classId))];
      candidates.push(item({
        id: `ask:${field}`, type: 'ask', priority: PRIORITY.ask,
        title: copy.title, body: copy.body,
        reason: `Your answer decides whether ${listWords(unlocks.map((c) => lowerFirst(INTERVENTION_CLASSES[c].label)))} ${unlocks.length > 1 ? 'are' : 'is'} suitable for you.`,
        actions: copy.actions,
        basis: { kind: 'information_gap', field, unlocks, sources: [SOURCES.nhsIbuprofen] },
      }));
    }
  }

  const checkIn = checkInCandidate(logs, today, state.phase || null, needs);
  if (checkIn) candidates.push(checkIn);

  // Suppression and novelty.
  const suppressed = [];
  const scored = [];
  for (const c of candidates) {
    const d = dismissed[c.id];
    if (!c.sticky && d && d.until && daysBetween(today, d.until) > 0 && !(c.signature && d.signature && c.signature !== d.signature)) {
      suppressed.push({ id: c.id, why: 'dismissed', until: d.until });
      continue;
    }
    let priority = c.priority;
    const s = seen[c.id];
    // Exempt from decay: red-flag care, due follow-ups, and options she just asked for.
    if (s && !c.sticky && !c.due && !(ready && c.type === 'option')) {
      const changed = c.signature && s.signature && c.signature !== s.signature;
      const interacted = s.lastInteracted && daysBetween(s.lastShown, s.lastInteracted) >= 0;
      const recent = (s.shownDays || []).filter((day) => { const n = daysBetween(day, today); return n != null && n > 0 && n <= NOVELTY_WINDOW_DAYS; }).length;
      if (!changed && !interacted && recent) {
        priority = c.priority * NOVELTY_FACTOR ** recent;
        suppressed.push({ id: c.id, why: 'novelty', shownRecently: recent, from: c.priority, to: priority });
      }
    }
    scored.push({ ...c, priority });
  }

  const noAction = { id: 'no_action', type: 'no_action', priority: PRIORITY.no_action };
  const ranked = [...scored, noAction].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  const cut = ranked.findIndex((c) => c.id === 'no_action');
  const winners = ranked.slice(0, cut);
  // Red-flag care is shown alone: nothing should compete with it.
  const urgent = winners.filter((c) => c.level === 'urgent');
  const chosen = (urgent.length ? urgent : winners).slice(0, MAX_ITEMS);
  const items = chosen.map(publicItem);

  const output = pickOutput({ items, ready, needs, removedBySafety, intent: state.intent });
  return {
    output,
    items,
    empty: items.length ? null : NOTHING_TODAY,
    debug: {
      today,
      needs,
      eligible: scored.map((c) => c.id),
      removedBySafety,
      removed: removedOther,
      suppressed,
      ranked: ranked.map((c) => ({ id: c.id, type: c.type, priority: c.priority })),
    },
  };
}

function pickOutput({ items, ready, needs, removedBySafety, intent }) {
  const top = items[0];
  // She asked for options, safety removed some, and none are left to show:
  // say we cannot safely suggest more, rather than nothing (section 17).
  const askedNeed = ready && (intent?.need || Object.keys(needs).length);
  const noOptionsLeft = !items.some((i) => i.type === 'option' || i.type === 'ask');
  if (askedNeed && noOptionsLeft && removedBySafety.some((r) => !r.pendingAnswer) && (!top || top.type !== 'care')) return 'abstain';
  if (!top) return 'no_action';
  if (top.type === 'care') return 'escalate';
  if (top.type === 'ask') return 'ask_more';
  if (items.some((i) => i.type === 'option')) return 'show_options';
  if (top.type === 'insight') return 'answer';
  return 'monitor'; // follow-up or check-in on top
}

// ─── helpers ───────────────────────────────────────────────────────────────
function item(fields) {
  return { actions: [], basis: null, reason: '', body: '', signature: null, ...fields };
}
function publicItem(c) {
  const { id, type, title, body, reason, actions, basis } = c;
  const out = { id, type, title, body, reason, actions, basis };
  if (c.level) out.level = c.level;
  if (c.signature) out.signature = c.signature;
  if (c.productIds?.length) out.productIds = c.productIds;
  if (c.classId) out.classId = c.classId;
  if (c.need) out.need = c.need;
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
