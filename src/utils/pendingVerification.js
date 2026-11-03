/**
 * Waiting for her email code (founder, Nov 2): she can leave the app to open
 * Gmail, and if the phone reloads the app meanwhile she comes back to the
 * code screen with her email filled in, not the start of sign-up.
 * Only the email address and a time are kept on this device, nothing else.
 */
const KEY = 'ayna_pending_email_verify_v1';
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

// reason 'existing': an older account that signed in without ever verifying.
export function savePendingVerification(email, reason = '') {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return null;
  const prev = readPendingVerification();
  const same = prev && prev.email === e;
  const v = { email: e, at: same ? prev.at : Date.now(), reason: reason || (same ? prev.reason || '' : ''), codeSentAt: same ? prev.codeSentAt || 0 : 0 };
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage off: in-memory flow still works */ }
  return v;
}

/** Note that a code was emailed, so reopening the app doesn't send another. */
export function markCodeSent(email, now = Date.now()) {
  const v = readPendingVerification();
  if (!v || v.email !== String(email || '').trim().toLowerCase()) return;
  try { localStorage.setItem(KEY, JSON.stringify({ ...v, codeSentAt: now })); } catch { /* nothing */ }
}

/** Send a fresh code at most once every 10 minutes for the same email. */
export const shouldSendCode = (v, now = Date.now()) => Boolean(v && now - (v.codeSentAt || 0) > 10 * 60 * 1000);

export function readPendingVerification(now = Date.now()) {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!v?.email || !Number.isFinite(v.at) || now - v.at > MAX_AGE_MS) return null;
    return v;
  } catch { return null; }
}

export function clearPendingVerification() {
  try { localStorage.removeItem(KEY); } catch { /* nothing */ }
}

/** An email-and-password account that hasn't confirmed its email yet. */
export function isUnverifiedEmailUser(user) {
  if (!user) return false;
  const provider = user.app_metadata?.provider;
  if (provider && provider !== 'email') return false;
  if (!user.email) return false;
  return !(user.email_confirmed_at || user.confirmed_at);
}
