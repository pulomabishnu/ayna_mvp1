/**
 * One honest message when a save to her account fails (founder brief Nov 15: saving / saved /
 * failed, never silent). The change is already on this phone (optimistic), so the message says
 * that, and offers Try again. At most one failure toast every few seconds, so a batch of failed
 * writes reads as one problem, not five.
 */
import { toast } from './toast.js';

let lastAt = -Infinity;
const GAP_MS = 4000;

export function failedLine(what) {
  return `Couldn't save ${what} to your account. It's kept on this phone.`;
}

/** Call from a save's .catch: reportSaveFailed('your routine', () => retry()). Returns true if shown. */
export function reportSaveFailed(what, retry = null, { now = Date.now(), log = null } = {}) {
  if (log) { try { console.warn('[ayna] save failed:', what, log); } catch { /* no console */ } }
  if (now - lastAt < GAP_MS) return false;
  lastAt = now;
  toast(failedLine(what), retry ? { label: 'Try again', onClick: () => { Promise.resolve().then(retry).then(() => toast('Saved')).catch(() => reportSaveFailed(what, retry)); } } : null);
  return true;
}

/** Wrap a save promise: shows the failure line and keeps the promise rejected-free for fire-and-forget calls. */
export function trackSave(promise, what, retry = null, isFail = null) {
  return Promise.resolve(promise).then((r) => {
    // Some stores resolve { error } instead of throwing (Supabase), or say they fell back.
    if (r && typeof r === 'object' && r.error) throw r.error;
    if (isFail && isFail(r)) throw new Error('save_failed');
    return r;
  }).catch((e) => { reportSaveFailed(what, retry, { log: e }); return null; });
}

export function _resetSaveFeedback() { lastAt = -Infinity; }

/** healthIntakeStore results: signed out or no backend is not a failure (it's saved on the phone). */
export const intakeFailed = (r) => Boolean(r) && !r.saved && !['supabase_not_configured', 'no_authenticated_user'].includes(r.reason);
/** ecosystemStore batch results: synced false means only the phone has it. */
export const batchFailed = (r) => Boolean(r) && r.synced === false;
