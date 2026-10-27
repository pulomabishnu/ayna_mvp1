/**
 * What she has already done with a product, so ayna does not keep
 * recommending it (team direction 65): she has it already ("Already have
 * it" in her routine or shopping list; ayna does not learn purchases from
 * retailers), she said "Not for me", she tried it and it did not help, she
 * saved it, it is in her routine, or it is already in a routine's Start
 * here. Each reason can be undone where it was set (Saved, Not for me,
 * routine "Restore"), so this module only reads.
 *
 * Pure. Ids only, nothing goes to analytics.
 */

const DIDNT_HELP = new Set(['no_change', 'worse', 'side_effect', 'stopped']);

export const REMEMBERED_WORDS = {
  have: 'You have this',
  not_for_me: 'You said not for you',
  didnt_help: 'You said it did not help',
  saved: 'In your Saved',
  in_routine: 'In your routine',
  start_here: 'In your routine',
};

const ids = (v) => {
  if (!v) return [];
  if (v instanceof Set) return [...v];
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : x?.id)).filter(Boolean);
  return Object.entries(v).filter(([, on]) => Boolean(on)).map(([id]) => id);
};

/**
 * @returns {Map<string, string>} productId -> reason (first reason wins, strongest first)
 */
export function rememberedProducts({ have = {}, notForMe = {}, tries = [], saved = {}, inRoutine = {}, startHere = [] } = {}) {
  const out = new Map();
  const put = (list, reason) => { for (const id of ids(list)) if (!out.has(id)) out.set(id, reason); };
  put(notForMe, 'not_for_me');
  const failed = new Map();
  for (const t of Array.isArray(tries) ? tries : Object.values(tries || {})) {
    if (!t || t.removed || t.kind !== 'product' || !t.outcome) continue;
    const prev = failed.get(t.ref);
    if (!prev || String(t.updatedAt || '') > String(prev.updatedAt || '')) failed.set(t.ref, t);
  }
  put([...failed.values()].filter((t) => DIDNT_HELP.has(t.outcome)).map((t) => t.ref), 'didnt_help');
  put(have, 'have');
  put(startHere, 'start_here');
  put(inRoutine, 'in_routine');
  put(saved, 'saved');
  return out;
}

/** Drop products she has already acted on. `keep` lists reasons that may stay (e.g. ['in_routine']). */
export function withoutRemembered(list = [], remembered = new Map(), { getId = (x) => x?.id ?? x?.product?.id, keep = [] } = {}) {
  const allowed = new Set(keep);
  return (list || []).filter((x) => {
    const reason = remembered.get(getId(x));
    return !reason || allowed.has(reason);
  });
}

/**
 * The same, from what this device knows: her tries, her routine changes
 * ("Not for me", "Already have it"), plus whatever the caller passes
 * (Saved, routine products, Start here).
 */
export function rememberedOnDevice({ tries = [], saved = {}, inRoutine = {}, startHere = [], have = {}, notForMe = {}, prefs = null } = {}) {
  const p = prefs || {};
  const productKeys = (m) => Object.fromEntries(Object.entries(m || {}).filter(([k]) => k.startsWith('product:')).map(([k, v]) => [k.slice(8), v]));
  return rememberedProducts({
    have: { ...(p.owned || {}), ...have },
    notForMe: { ...productKeys(p.notForMe), ...notForMe },
    tries, saved, inRoutine, startHere,
  });
}
