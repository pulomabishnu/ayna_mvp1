/**
 * A routine per active need ("Your period-pain routine"), built from the
 * same pieces Today uses (team direction 3, 4, 65 to 67):
 *
 *   Start here     1 to 3 things: an option from interventions.js and/or a
 *                  product the one match engine ranks for that need. Each
 *                  says Why, When, How long to try (outcomes.js HORIZONS)
 *                  and How you'll know (the check-in it links to).
 *   Track it       the daily check-in field for that need.
 *   Other options  everything else that is safe for her, lower down.
 *
 * Nothing here is new advice: summaries, cautions and sources come from
 * interventions.js (.gov pages); product "how" lines come from the
 * product's own instructions (plan.js howLine); "when" for a product comes
 * from its routine slot (plan.js). Products pass their own label check
 * (productSafety) and the engine's eligibility, and medicines are
 * information only (never a product, never in Start here).
 *
 * Her changes (add, remove, replace, already have, postpone, save for
 * later, not for me) live in a small per-owner store on this device
 * (ownedStore.js). Tried / helped / didn't help are tries (outcomes.js), so
 * they sync with her account and reach the matcher. Saving a product and
 * "Not for me" on a product go through the app's own Saved and hidden
 * stores (the callers pass those in), which already sync.
 *
 * Pure functions plus the store. No network.
 */
import { INTERVENTION_CLASSES, INTAKE_NEED_MAP, NEEDS, classesForNeed, evaluateClassSafety, productSafety, safetyContextFrom } from './interventions.js';
import { HORIZONS, interventionKindFor } from './outcomes.js';
import { howLine, reasonForProduct, slotFor, SLOTS } from './plan.js';
import { fitFor } from './weekPicks.js';
import { whyLine } from '../utils/whyLine.js';
import { addDays, todayKey } from './dailyLog.js';
import { bucketOf, DEVICE_OWNER, loadState, putBucket, saveState, switchOwner } from './ownedStore.js';

export const START_MAX = 3;

/** Per need: her routine's name, the intake needs that pick products, and the check-in field. */
export const ROUTINE_NEEDS = {
  period_pain: { title: 'Your period-pain routine', track: { field: 'pain', title: 'Track your cramps', words: 'your cramps' } },
  pms: { title: 'Your PMS routine', track: { field: 'pms', title: 'Track your PMS', words: 'your PMS' } },
  cycle_sleep: { title: 'Your sleep routine', track: { field: 'sleep', title: 'Track your sleep', words: 'your sleep' } },
};
// Pain in pregnancy is not a routine: Today asks the triage questions first
// and a midwife or clinician says what is right (interventions.js).

/** Intake need ids (ontology) that feed each routine need. */
export const INTAKE_NEEDS_FOR = Object.entries(INTAKE_NEED_MAP).reduce((m, [intake, need]) => {
  (m[need] = m[need] || []).push(intake);
  return m;
}, {});

// Option kind -> outcomes.js horizon. Tracking and care are not tried.
const CLASS_KIND = { heat: 'pain_relief', nsaid_pain_relief: 'pain_relief', acetaminophen_pain_relief: 'pain_relief', movement: 'behavioural', sleep_routine: 'behavioural' };
// When to use each option, in the words of its source (interventions.js comments).
const CLASS_WHEN = {
  heat: 'When cramps start',
  movement: 'Most days, all through the month',
  sleep_routine: 'Every night, at the same times',
  nsaid_pain_relief: 'Only as the label directs',
  acetaminophen_pain_relief: 'Only as the label directs',
};
const NOT_TRIED = new Set(['tracking', 'care']);
const DIDNT_HELP = new Set(['no_change', 'worse', 'side_effect', 'stopped']);
const SLOT_WHEN = Object.fromEntries(SLOTS.map((s) => [s.id, s.title]));

export const keyFor = (kind, ref) => `${kind === 'product' ? 'product' : 'class'}:${ref}`;
export const tryIdFor = (needId, key) => `plan:${needId}:${key}`.replace(/[^A-Za-z0-9:_.-]/g, '').slice(0, 120);

const lowerFirst = (s) => { const t = String(s || ''); return /^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t; };

function horizonFor(kind) {
  const h = HORIZONS[kind] || HORIZONS.default;
  return { kind: HORIZONS[kind] ? kind : 'default', days: h.days, label: h.label };
}

function knowLine(need, horizon) {
  const words = ROUTINE_NEEDS[need]?.track?.words || 'how you feel';
  return `Log ${words} in your daily check-in. After ${horizon.label}, ayna asks if it helped.`;
}

/** The latest try for this routine item (by our id, or any try on the same ref). */
function latestTry(tries, needId, key, ref) {
  const id = tryIdFor(needId, key);
  const list = (tries || []).filter((t) => t && !t.removed && (t.id === id || (t.ref === ref && (!t.need || t.need === needId))));
  return list.sort((a, b) => String(a.updatedAt || a.startedDay).localeCompare(String(b.updatedAt || b.startedDay))).at(-1) || null;
}

function actionItem(cls, needId, ctx, tries) {
  const safety = evaluateClassSafety(cls.id, ctx, needId);
  if (safety.verdict === 'block' || safety.verdict === 'ask') return null;
  const consult = safety.verdict === 'consult';
  const horizon = horizonFor(CLASS_KIND[cls.id]);
  const key = keyFor('action', cls.id);
  return {
    key, kind: 'action', ref: cls.id, need: needId,
    title: cls.label,
    why: `For your ${NEEDS[needId].label}. ${cls.summary}`,
    caution: [consult ? `Ask a doctor or pharmacist before using this. ${safety.consults.map((c) => c.reason).join(' ')}` : '', cls.caution || ''].filter(Boolean).join(' ') || null,
    when: CLASS_WHEN[cls.id] || null,
    horizon: NOT_TRIED.has(cls.id) ? null : horizon,
    know: NOT_TRIED.has(cls.id) ? null : knowLine(needId, horizon),
    sources: cls.sources || [],
    informationOnly: Boolean(cls.informationOnly),
    consult,
    canStart: !cls.informationOnly && !consult && !NOT_TRIED.has(cls.id),
    lastTry: latestTry(tries, needId, key, cls.id),
  };
}

function productItem(product, needId, { details = null, intakeNeeds = [], tries }) {
  const horizon = horizonFor(interventionKindFor({ kind: 'product', product }));
  const key = keyFor('product', product.id);
  const how = howLine(product);
  const engineWhy = details ? whyLine(product, details) : '';
  // Named for this routine's need (the engine's own line can name another need).
  const why = reasonForProduct(product, intakeNeeds) || (engineWhy && !/^Another option/i.test(engineWhy) ? engineWhy : '') || `For your ${NEEDS[needId].label}`;
  return {
    key, kind: 'product', ref: product.id, need: needId, product,
    title: product.name,
    why,
    percent: Number.isFinite(details?.percent) ? details.percent : null,
    when: SLOT_WHEN[slotFor(product)] || null,
    how: how?.text || null,
    howSource: how?.source || null,
    horizon,
    know: knowLine(needId, horizon),
    canStart: true,
    lastTry: latestTry(tries, needId, key, product.id),
  };
}

/**
 * Products that may sit in this routine: they fit one of the need's intake
 * needs (the research grade or the catalog fallback), pass their own label
 * for her, and the engine did not exclude them. Ranked: already in her
 * routine first, then the engine's score, then the evidence level.
 */
export function routineProducts(needId, { catalog = [], inRoutine = {}, detailsFor = null, ctx = null, hidden = {} } = {}) {
  const intakeNeeds = INTAKE_NEEDS_FOR[needId] || [];
  const out = [];
  const seen = new Set();
  for (const p of catalog) {
    if (!p?.id || seen.has(p.id) || hidden[p.id]) continue;
    seen.add(p.id);
    if (p.type === 'medication' || p.category === 'medication') continue;
    const fits = intakeNeeds.map((n) => fitFor(p, n)).filter(Boolean);
    if (!fits.length) continue;
    if (!productSafety(p, ctx).ok) continue;
    const d = detailsFor ? detailsFor(p) : null;
    if (d && (d.matchStatus === 'excluded' || d.eligible === false)) continue;
    out.push({ product: p, details: d, level: Math.max(...fits.map((f) => f.level || 0)), owned: Boolean(inRoutine[p.id]) });
  }
  return out.sort((a, b) => Number(b.owned) - Number(a.owned)
    || (Number(b.details?.percent) || 0) - (Number(a.details?.percent) || 0)
    || b.level - a.level
    || String(a.product.name).localeCompare(String(b.product.name)));
}

/**
 * @param {object} args
 *   needs      activeNeeds() output ({ [needId]: { id, sources } }) or an array of need ids
 *   profile    buildUserProfile() output (safety gates); null means unknown
 *   catalog    products to pick from (her routine products first is fine)
 *   inRoutine  { [productId]: true } what is already in her routine (her Ecosystem)
 *   detailsFor (product) => { percent, matchStatus, eligible, why } from the one engine, or null
 *   tries      readTries() output
 *   prefs      readRoutinePrefs() output
 *   today      'YYYY-MM-DD'
 * @returns {Array<{ need, title, start, track, other, later, tried, postponed, hiddenCount }>}
 */
export function buildRoutines({ needs = {}, profile = null, catalog = [], inRoutine = {}, detailsFor = null, tries = [], prefs = {}, today = todayKey(), saved = {}, omitted = {} } = {}) {
  const ctx = safetyContextFrom(profile || null);
  const ids = (Array.isArray(needs) ? needs : Object.keys(needs || {})).filter((id) => ROUTINE_NEEDS[id]);
  return ids.map((needId) => {
    const p = prefs.needs?.[needId] || {};
    const notForMe = { ...(prefs.notForMe || {}) };
    const intakeNeeds = INTAKE_NEEDS_FOR[needId] || [];
    const actions = classesForNeed(needId)
      .filter((cls) => cls.id !== 'tracking' && cls.id !== 'care')
      .map((cls) => actionItem(cls, needId, ctx, tries))
      .filter(Boolean);
    const products = routineProducts(needId, { catalog, inRoutine, detailsFor, ctx, hidden: omitted })
      .map((r) => ({ ...productItem(r.product, needId, { details: r.details, intakeNeeds, tries }), owned: r.owned || Boolean(prefs.owned?.[r.product.id]), inRoutine: r.owned, saved: Boolean(saved[r.product.id]) }));
    const all = [...actions, ...products];
    const byKey = new Map(all.map((it) => [it.key, it]));

    const postponedUntil = (key) => { const until = p.postponed?.[key]; return until && until > today ? until : null; };
    const triedBadly = (it) => Boolean(it.lastTry?.outcome && DIDNT_HELP.has(it.lastTry.outcome));
    const away = (it) => notForMe[it.key] || postponedUntil(it.key) || p.later?.[it.key] || triedBadly(it);

    // Default Start here: the first safe option she can start, and the
    // best-ranked product (one already in her routine wins).
    const defaults = [
      actions.find((a) => a.canStart && !away(a)),
      products.find((x) => !away(x)),
    ].filter(Boolean).map((it) => it.key);
    const removed = new Set(p.removed || []);
    let startKeys = [...defaults.filter((k) => !removed.has(k)), ...(p.added || [])];
    startKeys = [...new Set(startKeys)].filter((k) => byKey.has(k) && !away(byKey.get(k))).slice(0, START_MAX);
    const startSet = new Set(startKeys);

    const start = startKeys.map((k) => byKey.get(k));
    const other = all.filter((it) => !startSet.has(it.key) && !away(it));
    // Products past the first few go behind "More products" in the view.
    return {
      need: needId,
      label: NEEDS[needId].label,
      title: ROUTINE_NEEDS[needId].title,
      start,
      track: { ...ROUTINE_NEEDS[needId].track, body: 'About 30 seconds a day. It is how you and ayna see what helps.' },
      other,
      later: all.filter((it) => p.later?.[it.key]),
      tried: all.filter((it) => triedBadly(it)),
      postponed: all.filter((it) => postponedUntil(it.key)).map((it) => ({ ...it, until: postponedUntil(it.key) })),
      notForMe: all.filter((it) => notForMe[it.key]),
      full: startKeys.length >= START_MAX,
    };
  }).filter((r) => r.start.length || r.other.length);
}

/** Needs for a routine from her profile and log (decisionEngine.activeNeeds shape). */
export function routineNeedIds(needs) {
  return (Array.isArray(needs) ? needs : Object.keys(needs || {})).filter((id) => ROUTINE_NEEDS[id]);
}

/** Every product id currently in a routine's Start here (for "already recommended"). */
export function startHereProductIds(routines = []) {
  return new Set(routines.flatMap((r) => r.start.filter((it) => it.kind === 'product').map((it) => it.ref)));
}

/* -------------------------------- her changes -------------------------------- */

export const ROUTINE_PREFS_KEY = 'ayna_routine_plan_v1';
const ITEM_ID = 'prefs';

function cleanPrefs(raw) {
  const p = raw && typeof raw === 'object' ? raw : {};
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const needs = {};
  for (const [id, n] of Object.entries(obj(p.needs))) {
    if (!ROUTINE_NEEDS[id]) continue;
    needs[id] = {
      added: Array.isArray(n?.added) ? n.added.filter((k) => typeof k === 'string').slice(0, START_MAX) : [],
      removed: Array.isArray(n?.removed) ? n.removed.filter((k) => typeof k === 'string').slice(0, 40) : [],
      postponed: obj(n?.postponed),
      later: obj(n?.later),
    };
  }
  return { needs, owned: obj(p.owned), notForMe: obj(p.notForMe), updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : null };
}

export function readRoutinePrefs(storage = globalThis.localStorage) {
  return cleanPrefs(bucketOf(loadState(ROUTINE_PREFS_KEY, storage)).items[ITEM_ID]);
}

function writePrefs(next, storage) {
  const state = loadState(ROUTINE_PREFS_KEY, storage);
  const b = bucketOf(state);
  const value = cleanPrefs({ ...next, updatedAt: new Date().toISOString() });
  saveState(ROUTINE_PREFS_KEY, putBucket(state, { items: { ...b.items, [ITEM_ID]: value }, dirty: [] }), storage);
  return value;
}

/** Put back an earlier set of changes (Undo). */
export function replaceRoutinePrefs(prefs, storage = globalThis.localStorage) {
  return writePrefs(prefs, storage);
}

export function setRoutinePrefsOwner(userId, storage = globalThis.localStorage) {
  const state = loadState(ROUTINE_PREFS_KEY, storage);
  const next = switchOwner(state, userId, (mine, device) => {
    const a = cleanPrefs(mine[ITEM_ID]);
    const b = cleanPrefs(device[ITEM_ID]);
    return { [ITEM_ID]: (b.updatedAt || '') > (a.updatedAt || '') ? b : a };
  });
  if (next !== state) saveState(ROUTINE_PREFS_KEY, next, storage);
  return next.owner || DEVICE_OWNER;
}

const toggleIn = (map, key, value = true) => { const n = { ...map }; if (n[key]) delete n[key]; else n[key] = value; return n; };

/**
 * One change to her routine. Returns the new prefs (or the old ones with
 * `error: 'full'` when Start here already holds three).
 *   add | remove | replace (with) | postpone (days) | later | owned | notForMe | restore
 */
export function changeRoutine(prefs, { op, need, key, with: withKey, days = 7, today = todayKey() } = {}, storage = globalThis.localStorage) {
  const p = cleanPrefs(prefs);
  const n = p.needs[need] || { added: [], removed: [], postponed: {}, later: {} };
  const set = (patch) => writePrefs({ ...p, needs: { ...p.needs, [need]: { ...n, ...patch } } }, storage);
  switch (op) {
    case 'add': {
      if (n.added.includes(key)) return p;
      if (n.added.length >= START_MAX) return { ...p, error: 'full' };
      return set({ added: [...n.added, key], removed: n.removed.filter((k) => k !== key), later: omit(n.later, key), postponed: omit(n.postponed, key) });
    }
    case 'remove':
      return set({ added: n.added.filter((k) => k !== key), removed: [...new Set([...n.removed, key])] });
    case 'replace':
      if (!withKey) return p;
      return set({ added: [...n.added.filter((k) => k !== key && k !== withKey), withKey], removed: [...new Set([...n.removed.filter((k) => k !== withKey), key])] });
    case 'postpone':
      return set({ postponed: { ...n.postponed, [key]: addDays(today, Math.max(1, Math.min(90, days))) } });
    case 'later':
      return set({ later: toggleIn(n.later, key) });
    case 'restore':
      return writePrefs({ ...p, notForMe: omit(p.notForMe, key), needs: { ...p.needs, [need]: { ...n, postponed: omit(n.postponed, key), later: omit(n.later, key), removed: n.removed.filter((k) => k !== key) } } }, storage);
    case 'owned':
      return writePrefs({ ...p, owned: toggleIn(p.owned, String(key).replace(/^product:/, '')) }, storage);
    case 'notForMe':
      return writePrefs({ ...p, notForMe: toggleIn(p.notForMe, key, today) }, storage);
    default:
      return p;
  }
}
function omit(map, key) { const n = { ...(map || {}) }; delete n[key]; return n; }

/** The option behind a routine key, for labels ("Heat", a product name). */
export function labelForKey(key, products = []) {
  const [kind, ref] = String(key).split(/:(.+)/);
  if (kind === 'class') return INTERVENTION_CLASSES[ref]?.label || ref;
  return products.find((p) => p?.id === ref)?.name || 'This product';
}

export { lowerFirst };
