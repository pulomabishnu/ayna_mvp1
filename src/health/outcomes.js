/**
 * One model for every "try": a routine product check-in (routineOutcome.js),
 * a try-and-check-back trial (src/mobile/utils/aynaGuide.js), or a product
 * outcome.
 *
 * Contract (the decision engine codes against this, keep it stable):
 *   try: { id, kind: 'product'|'action', ref (productId or action text), need (needId or goal text),
 *          startedDay, horizonDays, status: 'pending'|'due'|'recorded',
 *          outcome: null|'helpful'|'no_change'|'worse'|'side_effect'|'unsure'|'stopped', recordedDay, note }
 *
 * `status` is derived, never stored: pending until startedDay + horizonDays,
 * then due until an outcome is recorded. "No outcome yet" is never a failure
 * (master prompt section 60).
 *
 * Old records are read through adapters (fromRoutineOutcomes, fromGuideTrials);
 * nothing already stored is rewritten.
 *
 * Every outcome is her own report (source 'self_report', method 'manual'),
 * never proof the product or action caused a change. Nothing here goes to
 * analytics.
 */
import { addDays, daysBetweenDays, isDay, todayKey } from './dailyLog.js';
import { bucketOf, DEVICE_OWNER, loadState, putBucket, saveState, switchOwner, trimItems } from './ownedStore.js';

export const TRIES_KEY = 'ayna_tries_v1';
export const OUTCOMES = ['helpful', 'no_change', 'worse', 'side_effect', 'unsure', 'stopped'];
/** What she sees. One word per thing: "Helpful". */
export const OUTCOME_LABELS = {
  helpful: 'Helpful',
  no_change: 'No change',
  worse: 'Worse',
  side_effect: 'Side effect',
  unsure: 'Not sure',
  stopped: 'Stopped',
};
export const TRY_KINDS = ['product', 'action'];

/*
 * How long to wait before asking whether something helped, per kind of
 * intervention. Data, not magic numbers: change a row here, not the code.
 *
 * Sources are .gov only (founder rule, Oct 24 2026); see the scratchpad
 * GOV_SOURCES.md table.
 *
 * CYCLE_DAYS: womenshealth.gov, "Your menstrual cycle": "The typical
 * menstrual cycle is 28 days long" (normal 24 to 38 days). We use 28.
 * (Bull et al. 2019 was dropped: PMC could not be read to verify it.)
 *
 * - pain_relief (heat, TENS, pain relief for cramps): acts during a period,
 *   so the next period is the first fair check. One cycle.
 * - period_product (pads, cups, discs, period underwear): she knows after
 *   using it through one period. One cycle.
 * - supplement: 2 to 3 cycles. ayna policy, not evidence: asking after two
 *   cycles and up to three keeps one cycle's natural variation from being
 *   read as an effect. (The old basis, ACOG's two-cycle PMS criteria via
 *   AAFP, is not a .gov source; womenshealth.gov and MedlinePlus use three
 *   cycles / 3 months of tracking to recognise PMS, which the window's upper
 *   end, 90 days, covers.) Ask at 60 days, window to 90.
 * - skincare: 6 to 8 weeks. MedlinePlus, "Acne": acne "often responds well
 *   to treatment, but responses may take 6 to 8 weeks" (MedlinePlus
 *   benzoyl peroxide: "It may take 4 to 6 weeks to see the effects").
 *   Ask at 6 weeks, window to 8. (Replaces the AAD page.)
 * - behavioural (sleep, movement, food, habits): two cycles. ayna policy,
 *   same reason as supplements.
 * - default: one cycle when we don't know the kind.
 */
export const CYCLE_DAYS = 28;
export const HORIZONS = {
  pain_relief: { days: CYCLE_DAYS, windowDays: [CYCLE_DAYS, CYCLE_DAYS], label: 'one cycle' },
  period_product: { days: CYCLE_DAYS, windowDays: [CYCLE_DAYS, CYCLE_DAYS], label: 'one cycle' },
  supplement: { days: 60, windowDays: [60, 90], label: '2 to 3 cycles' },
  skincare: { days: 42, windowDays: [42, 56], label: '6 to 8 weeks' },
  behavioural: { days: 2 * CYCLE_DAYS, windowDays: [2 * CYCLE_DAYS, 2 * CYCLE_DAYS], label: 'two cycles' },
  default: { days: CYCLE_DAYS, windowDays: [CYCLE_DAYS, CYCLE_DAYS], label: 'one cycle' },
};

/** Catalog category -> intervention kind. Categories not listed use `default`. */
export const CATEGORY_KIND = {
  'cramp-relief': 'pain_relief',
  'pain-relief': 'pain_relief',
  pad: 'period_product',
  tampon: 'period_product',
  cup: 'period_product',
  disc: 'period_product',
  'period-underwear': 'period_product',
  supplement: 'supplement',
  'gut-health': 'supplement',
  skincare: 'skincare',
  sleep: 'behavioural',
  'mental-health': 'behavioural',
  tracker: 'behavioural',
};

// Words in a free-text action that tell us its kind. First match wins.
const ACTION_KIND_WORDS = [
  ['pain_relief', /\b(heat|heating pad|hot water bottle|warm (bath|compress)|tens|ibuprofen|naproxen|pain relie)/i],
  ['supplement', /\b(supplement|magnesium|vitamin|omega|fish oil|zinc|iron|calcium|inositol|probiotic|ginger capsule)/i],
  ['skincare', /\b(skin|serum|cleanser|moisturi[sz]er|retinoid|retinol|spf|sunscreen|acne)/i],
];

export function interventionKindFor({ kind, ref, product } = {}) {
  if (kind === 'product' || product) {
    return CATEGORY_KIND[product?.category] || 'default';
  }
  const text = String(ref || '');
  for (const [k, re] of ACTION_KIND_WORDS) if (re.test(text)) return k;
  return 'behavioural';
}

export function horizonFor(interventionKind) {
  return (HORIZONS[interventionKind] || HORIZONS.default).days;
}

/* --------------------------------- model --------------------------------- */

const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const isIso = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const ID_RE = /^[A-Za-z0-9:_.-]{1,120}$/;

/** Validates a stored or incoming try. Returns a try without `status`, or null. */
export function normalizeTry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' && ID_RE.test(raw.id) ? raw.id : null;
  const kind = TRY_KINDS.includes(raw.kind) ? raw.kind : null;
  const ref = clean(raw.ref, 200);
  if (!id || !kind || !ref || !isDay(raw.startedDay)) return null;
  const horizon = Number(raw.horizonDays);
  const outcome = OUTCOMES.includes(raw.outcome) ? raw.outcome : null;
  const t = {
    id, kind, ref,
    need: clean(raw.need, 120) || null,
    startedDay: raw.startedDay,
    horizonDays: Number.isInteger(horizon) && horizon >= 1 && horizon <= 365 ? horizon : HORIZONS.default.days,
    outcome,
    recordedDay: outcome && isDay(raw.recordedDay) ? raw.recordedDay : null,
    note: clean(raw.note, 280) || null,
    updatedAt: isIso(raw.updatedAt) ? new Date(raw.updatedAt).toISOString() : `${raw.startedDay}T12:00:00.000Z`,
  };
  if (outcome && !t.recordedDay) t.recordedDay = t.updatedAt.slice(0, 10);
  if (raw.interventionKind && HORIZONS[raw.interventionKind]) t.interventionKind = raw.interventionKind;
  if (raw.removed === true) t.removed = true;
  if (typeof raw.legacy === 'string') t.legacy = raw.legacy;
  if (typeof raw.interim === 'string') t.interim = raw.interim;
  return t;
}

/** The day she should be asked. */
export const dueDay = (t) => addDays(t.startedDay, t.horizonDays);

/** pending until startedDay + horizonDays, then due, until an outcome is recorded. */
export function tryStatus(t, today = todayKey()) {
  if (!t) return null;
  if (t.outcome) return 'recorded';
  return today < dueDay(t) ? 'pending' : 'due';
}

export function withStatus(t, today = todayKey()) {
  // Returned with `status`; storage and the server never keep it (normalizeTry drops it).
  return t ? { ...t, status: tryStatus(t, today) } : null;
}

/** Start a try. horizonDays defaults from the intervention kind. */
export function createTry({ id, kind, ref, need = null, startedDay = todayKey(), horizonDays, interventionKind, product, note = null } = {}, now = new Date()) {
  const ik = interventionKind && HORIZONS[interventionKind] ? interventionKind : interventionKindFor({ kind, ref, product });
  return withStatus(normalizeTry({
    id: id || `try:${(globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)}`,
    kind, ref: kind === 'product' ? (product?.id || ref) : ref, need, startedDay,
    horizonDays: Number.isInteger(horizonDays) ? horizonDays : horizonFor(ik),
    interventionKind: ik, outcome: null, note, updatedAt: new Date(now).toISOString(),
  }), todayKey(now));
}

/** Record (or change) an outcome. Returns a new try; unknown outcomes return it unchanged. */
export function recordOutcome(t, outcome, { day = todayKey(), note, now = new Date() } = {}) {
  if (!t || !OUTCOMES.includes(outcome)) return t;
  return withStatus(normalizeTry({ ...t, outcome, recordedDay: isDay(day) ? day : todayKey(), note: note === undefined ? t.note : note, interim: undefined, updatedAt: new Date(now).toISOString() }));
}

/** Newest updatedAt wins per try. Accepts maps or arrays. Returns { [id]: try }. */
export function mergeTries(local, server) {
  const out = {};
  for (const list of [local, server]) {
    for (const raw of Array.isArray(list) ? list : Object.values(list || {})) {
      const t = normalizeTry(raw);
      if (!t) continue;
      if (!out[t.id] || t.updatedAt > out[t.id].updatedAt) out[t.id] = t;
    }
  }
  return out;
}

/* ------------------------------ old records ------------------------------ */

/** Routine check-in labels (routineOutcome.js) -> outcome. 'same' depends on the horizon. */
export const ROUTINE_RATING_TO_OUTCOME = { helping: 'helpful', same: 'no_change', worse: 'worse' };

/**
 * Routine check-ins ({ [productId]: [{ day, rating: 'helping'|'same'|'worse' }] })
 * as tries, one per product, latest check-in deciding the outcome. "No
 * change yet" before the horizon stays pending (interim 'no_change_yet').
 * Start day is unknown in the old data, so the first check-in day is used.
 */
export function fromRoutineOutcomes(routineOutcomes = {}, products = []) {
  const byId = new Map((products || []).filter(Boolean).map((p) => [p.id, p]));
  const out = [];
  for (const [productId, entries] of Object.entries(routineOutcomes || {})) {
    const list = (Array.isArray(entries) ? entries : []).filter((e) => e && isDay(e.day) && ROUTINE_RATING_TO_OUTCOME[e.rating]).sort((a, b) => a.day.localeCompare(b.day));
    if (!list.length) continue;
    const product = byId.get(productId) || null;
    const ik = interventionKindFor({ kind: 'product', product: product || {} });
    const startedDay = list[0].day;
    const horizonDays = horizonFor(ik);
    const latest = list[list.length - 1];
    let outcome = ROUTINE_RATING_TO_OUTCOME[latest.rating];
    let interim;
    if (outcome === 'no_change' && latest.day < addDays(startedDay, horizonDays)) { outcome = null; interim = 'no_change_yet'; }
    const t = normalizeTry({
      id: `routine:${productId}`, kind: 'product', ref: productId, need: null, startedDay, horizonDays,
      interventionKind: ik, outcome, recordedDay: outcome ? latest.day : null, interim,
      legacy: 'routine', updatedAt: `${latest.day}T12:00:00.000Z`,
    });
    if (t) out.push(t);
  }
  return out;
}

/**
 * Try-and-check-back trials (aynaGuide.js: baseline and follow-up scores
 * 1-5, higher is better) as tries. Her own follow-up date is kept as the
 * horizon. Same score before the follow-up date stays pending.
 */
export function fromGuideTrials(trials = []) {
  const out = [];
  for (const trial of Array.isArray(trials) ? trials : []) {
    if (!trial?.id || !isDay(trial.started)) continue;
    const horizonDays = isDay(trial.due) ? Math.max(1, daysBetweenDays(trial.started, trial.due)) : HORIZONS.behavioural.days;
    const f = trial.followUp;
    let outcome = null;
    let interim;
    if (f && Number.isInteger(f.score) && Number.isInteger(trial.baseline)) {
      const diff = f.score - trial.baseline;
      outcome = diff > 0 ? 'helpful' : diff < 0 ? 'worse' : 'no_change';
      if (outcome === 'no_change' && isDay(f.day) && f.day < addDays(trial.started, horizonDays)) { outcome = null; interim = 'no_change_yet'; }
    }
    const t = normalizeTry({
      id: `trial:${String(trial.id).replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 100)}`, kind: 'action', ref: trial.action, need: trial.goal,
      startedDay: trial.started, horizonDays, interventionKind: interventionKindFor({ kind: 'action', ref: trial.action }),
      outcome, recordedDay: outcome ? (isDay(f?.day) ? f.day : null) : null, note: f?.note || null, interim,
      legacy: 'trial', updatedAt: `${(f && isDay(f.day) ? f.day : trial.started)}T12:00:00.000Z`,
    });
    if (t) out.push(t);
  }
  return out;
}

/* ------------------------------ to the matcher ------------------------------ */

/*
 * Recorded product outcomes as intake.productHistory entries, in the option
 * labels userProfile.js already understands (WORKED_BY_OPTION etc.):
 *   helpful     -> worked 'Helped somewhat' (she said helpful, not "a lot")
 *   no_change   -> worked 'No difference'
 *   worse       -> worked 'Made things worse' (same product hidden, similar ones down)
 *   side_effect -> reaction 'Mild' + stop reason 'I had side effects or a reaction'
 *                  (same product strongly down, similar ones carry a caution;
 *                  never 'Serious', which she didn't say)
 *   unsure      -> worked 'Not sure' (no effect)
 *   stopped     -> current 'No' only
 * Only recorded outcomes count; pending and due tries change nothing. One
 * entry per product: the latest recorded outcome.
 */
const HISTORY_BY_OUTCOME = {
  helpful: { worked: 'Helped somewhat' },
  no_change: { worked: 'No difference' },
  worse: { worked: 'Made things worse', current: 'No' },
  // sideEffect: hides the product from her matches, like "Worse" (userProfile.js
  // outcome:side_effect, score.js history_side_effect). Undoing the outcome drops
  // this entry, so the product comes back.
  side_effect: { reaction: 'Mild', stopReasons: ['I had side effects or a reaction'], current: 'No', sideEffect: true },
  unsure: { worked: 'Not sure' },
  stopped: { current: 'No' },
};

export function outcomesToProductHistory(tries = [], products = []) {
  const byId = new Map((products || []).filter(Boolean).map((p) => [p.id, p]));
  const latest = new Map();
  for (const raw of Array.isArray(tries) ? tries : Object.values(tries || {})) {
    const t = normalizeTry(raw);
    if (!t || t.removed || t.kind !== 'product' || !t.outcome) continue;
    const prev = latest.get(t.ref);
    const key = `${t.recordedDay}|${t.updatedAt}`;
    if (!prev || key > `${prev.recordedDay}|${prev.updatedAt}`) latest.set(t.ref, t);
  }
  const out = [];
  for (const [ref, t] of latest) {
    const product = byId.get(ref);
    if (!product?.name) continue; // matcher resolves history by name
    out.push({ name: product.name, stopReasons: [], ...HISTORY_BY_OUTCOME[t.outcome], source: 'ayna_outcome', tryId: t.id, recordedDay: t.recordedDay });
  }
  return out;
}

/**
 * Intake with her recorded outcomes added to productHistory. Her own intake
 * answers stay; an outcome entry is skipped only when it says exactly the
 * same as an intake entry for the same product.
 */
export function withOutcomeHistory(intake, history = []) {
  if (!history?.length) return intake;
  const base = intake && typeof intake === 'object' ? intake : {};
  const existing = Array.isArray(base.productHistory) ? base.productHistory : [];
  // Same normalisation as userProfile.js normalizeName (not imported so the API stays light).
  const normalizeName = (v) => String(v || '').toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  const same = (a, b) => normalizeName(a.name) === normalizeName(b.name) && (a.worked || '') === (b.worked || '') && (a.reaction || '') === (b.reaction || '');
  const added = history.filter((h) => !existing.some((e) => e && same(e, h)));
  return added.length ? { ...base, productHistory: [...existing, ...added] } : base;
}

/* -------------------------------- storage -------------------------------- */

const KEEP_TRIES = 200;

/** Her tries on this device (for whoever is signed in), with status. Removed tries are left out. */
export function readTries({ storage = globalThis.localStorage, today = todayKey(), includeRemoved = false } = {}) {
  const items = mergeTries(bucketOf(loadState(TRIES_KEY, storage)).items, []);
  return Object.values(items).filter((t) => includeRemoved || !t.removed).map((t) => withStatus(t, today)).sort((a, b) => a.startedDay.localeCompare(b.startedDay));
}

/** Save (create or update) one try. Returns it with status, or null if invalid. */
export function saveTry(raw, { storage = globalThis.localStorage, now = new Date(), today = todayKey() } = {}) {
  const t = normalizeTry({ ...raw, updatedAt: new Date(now).toISOString() });
  if (!t) return null;
  const state = loadState(TRIES_KEY, storage);
  const b = bucketOf(state);
  const merged = { ...b.items, [t.id]: t };
  const items = trimItems(merged, KEEP_TRIES, (id) => merged[id]?.updatedAt || '');
  saveState(TRIES_KEY, putBucket(state, { items, dirty: [...b.dirty, t.id] }), storage);
  return withStatus(t, today);
}

/** Remove a try (kept as a tombstone so the removal syncs). */
export function removeTry(id, opts = {}) {
  const t = bucketOf(loadState(TRIES_KEY, opts.storage ?? globalThis.localStorage)).items[id];
  return t ? saveTry({ ...t, removed: true }, opts) : null;
}

export function setTriesOwner(userId, storage = globalThis.localStorage) {
  const state = loadState(TRIES_KEY, storage);
  const next = switchOwner(state, userId, (mine, device) => mergeTries(mine, device));
  if (next !== state) saveState(TRIES_KEY, next, storage);
  return next.owner;
}

export function dirtyTries(storage = globalThis.localStorage) {
  const state = loadState(TRIES_KEY, storage);
  if (state.owner === DEVICE_OWNER) return [];
  const b = bucketOf(state);
  return [...new Set(b.dirty)].map((id) => normalizeTry(b.items[id])).filter(Boolean);
}

export function applyTriesSync({ owner, uploaded = [], server = [] } = {}, storage = globalThis.localStorage) {
  const state = loadState(TRIES_KEY, storage);
  if (!owner || state.owner !== owner) return false;
  const b = bucketOf(state);
  const sent = new Map(uploaded.map((t) => [t.id, t.updatedAt]));
  const dirty = b.dirty.filter((id) => !sent.has(id) || normalizeTry(b.items[id])?.updatedAt !== sent.get(id));
  const merged = mergeTries(b.items, server);
  const items = trimItems(merged, KEEP_TRIES, (id) => merged[id]?.updatedAt || '');
  saveState(TRIES_KEY, putBucket(state, { items, dirty }), storage);
  return true;
}
