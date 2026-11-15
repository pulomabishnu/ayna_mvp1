/**
 * Keeps her day plan the same on every device (/api/day-plan). The phone always comes first:
 * offline, signed out, or the table not switched on yet (not_ready) never loses anything.
 *
 * Whose plan is on this phone (PLAN_OWNER_KEY): a plan made signed out joins the account she signs
 * into; a plan that belongs to another account is never uploaded into hers, and signing out
 * removes it from the phone (her medications are private).
 */
import { MEDS_KEY, readMeds } from './medications.js';
import { ACT_KEY, readActivities } from './dayPlan.js';
import { planFromStores, storesFromPlan, mergePlans, cleanPlan } from './planSync.js';
import { call, defaultFetch, defaultToken } from './userDataSync.js';

export const PLAN_OWNER_KEY = 'ayna_plan_owner_v1';
export const PLAN_SYNCED_EVENT = 'ayna:plan-synced';

function readOwner(storage) { try { return storage?.getItem(PLAN_OWNER_KEY) || null; } catch { return null; } }
function writeOwner(storage, id) { try { if (id) storage?.setItem(PLAN_OWNER_KEY, id); else storage?.removeItem(PLAN_OWNER_KEY); } catch { /* storage off */ } }

/** Write both stores without the change event (so a sync never triggers another sync), then tell screens. */
export function writePlanLocal(plan, storage = globalThis.localStorage) {
  const { meds, acts } = storesFromPlan(plan);
  const at = new Date().toISOString();
  try {
    storage?.setItem(MEDS_KEY, JSON.stringify({ ...meds, updatedAt: at }));
    storage?.setItem(ACT_KEY, JSON.stringify({ ...acts, updatedAt: at }));
  } catch { return false; }
  try { globalThis.dispatchEvent?.(new CustomEvent(PLAN_SYNCED_EVENT)); } catch { /* not a browser */ }
  return true;
}

export function localPlan(storage = globalThis.localStorage) {
  return planFromStores(readMeds(storage), readActivities(storage));
}

/** One sync pass. Returns { status: 'synced'|'signed_out'|'offline'|'not_ready'|'error' }. */
export async function syncDayPlan({ userId, storage = globalThis.localStorage, getToken = defaultToken, fetchImpl = defaultFetch } = {}) {
  if (!userId) return { status: 'signed_out' };
  const token = await getToken().catch(() => null);
  if (!token) return { status: 'signed_out' };
  const owner = readOwner(storage);
  // Another account's plan on this phone: never upload it into hers. Start from her own copy.
  const mine = owner && owner !== String(userId) ? cleanPlan({}) : localPlan(storage);
  const r = await call(fetchImpl, token, '/api/day-plan', { method: 'POST', body: { plan: mine } });
  if (!r.ok) return { status: r.reason };
  // Anything she changed while the request was out is merged in too.
  const merged = mergePlans(cleanPlan(r.data?.plan || {}), owner && owner !== String(userId) ? cleanPlan({}) : localPlan(storage));
  writePlanLocal(merged, storage);
  writeOwner(storage, String(userId));
  return { status: 'synced' };
}

/** Signing out: an account's plan leaves the phone (it is in her account). A signed-out plan stays. */
export function forgetPlanOnSignOut(storage = globalThis.localStorage) {
  if (!readOwner(storage)) return false;
  try { storage?.removeItem(MEDS_KEY); storage?.removeItem(ACT_KEY); } catch { /* storage off */ }
  writeOwner(storage, null);
  try { globalThis.dispatchEvent?.(new CustomEvent(PLAN_SYNCED_EVENT)); } catch { /* not a browser */ }
  return true;
}
