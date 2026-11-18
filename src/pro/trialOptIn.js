// Nov 17 (founder: "make sure you can opt in for your 14 day free trial" on sign-up): her choice on the
// sign-up page, kept until the new account exists, then TrialOffer starts the trial (or doesn't ask again).
const KEY = 'ayna_trial_optin_v1';

/** On sign-up: true = start the free trial once the account exists, false = she left it unticked. */
export function setTrialOptIn(on) { try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* private mode */ } }

/** Read once and clear: 'yes' | 'no' | null (no choice made on this device). */
export function takeTrialOptIn() {
  try { const v = localStorage.getItem(KEY); localStorage.removeItem(KEY); return v === '1' ? 'yes' : v === '0' ? 'no' : null; } catch { return null; }
}
