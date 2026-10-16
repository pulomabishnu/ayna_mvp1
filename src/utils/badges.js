/**
 * Badges + invite links (round 5). Exactly four badges:
 *
 *  1. Got the app      She has signed in on the ayna mobile app at least once.
 *                      The app records it (recordAppSignIn) the first time it
 *                      sees a signed-in user: once in her account metadata
 *                      (ayna_app_signed_in_at) and on that device. Inside the
 *                      app the badge is always earned, since she is using it.
 *  2. Full ecosystem   Every need she chose in the quiz has at least one of her
 *                      Ecosystem products on its shelf (the same per-need
 *                      shelves the Ecosystem page draws). Progress = filled / needs.
 *  3. First post       She has posted at least once in Community.
 *  4. Brought 3 friends  Three people joined through her invite link
 *                      (?ref=<code>), created an account, and posted at least
 *                      once in Community. Needs the referrals migration
 *                      (supabase/migrations/20261013150000_referrals.sql);
 *                      until it is applied the badge shows as locked, 0/3.
 */
import posthog from 'posthog-js';
import { getEcosystemSeedFromQuiz, getProductMatchDetailsForProduct } from '../data/products.js';

const PENDING_REF_KEY = 'ayna_pending_ref_v1';
const APP_KEY = 'ayna_app_signed_in_v1';
const CODE_RE = /^[a-z0-9]{6,20}$/;
const FRIENDS_GOAL = 3;
const MIN_SHELF_SCORE = 50;

const safeGet = (k) => { try { return JSON.parse(window.localStorage.getItem(k) || 'null'); } catch { return null; } };
const safeSet = (k, v) => { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
const safeDel = (k) => { try { window.localStorage.removeItem(k); } catch { /* private mode */ } };

/* ------------------------------ Invite links ------------------------------ */

/** Her personal invite code: stable, derived from the account id (matches ayna_referral_code() in SQL). */
export function referralCodeFor(userId) {
  const code = String(userId || '').replace(/-/g, '').slice(0, 10).toLowerCase();
  return CODE_RE.test(code) ? code : null;
}

export function inviteLinkFor(userId, origin) {
  const code = referralCodeFor(userId);
  if (!code) return null;
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://aynahealth.com');
  return `${base}/?ref=${code}`;
}

/** First touch wins: remember ?ref=<code> from the URL for a later sign-up. */
export function captureReferralFromUrl() {
  if (typeof window === 'undefined') return null;
  let code = null;
  try { code = new URLSearchParams(window.location.search).get('ref'); } catch { return null; }
  code = String(code || '').toLowerCase();
  if (!CODE_RE.test(code)) return null;
  const existing = safeGet(PENDING_REF_KEY);
  if (existing?.code && Date.now() - existing.at < 30 * 864e5) return existing;
  const pending = { code, at: Date.now() };
  safeSet(PENDING_REF_KEY, pending);
  try { posthog.capture('referral_signup_started'); } catch { /* analytics off */ }
  return pending;
}

/**
 * The invite code waiting for this browser's next sign-up, or null. AuthGate
 * passes it in the sign-up metadata so the database records the referral at
 * the moment the account is created (supabase/migrations/20261015120000).
 */
export function pendingReferralCode() {
  const pending = safeGet(PENDING_REF_KEY);
  if (!pending?.code || !CODE_RE.test(pending.code) || Date.now() - pending.at >= 30 * 864e5) return null;
  return pending.code;
}

const VERIFIED_SENT_KEY = 'ayna_ref_verified_sent_v1';
/** Analytics only (the database is what counts): a referred friend just verified. */
function trackReferredVerification(user) {
  const meta = user?.user_metadata || {};
  if (!meta.referred_by || !(user.email_confirmed_at || user.phone_confirmed_at) || user.is_anonymous) return;
  const created = Date.parse(user.created_at || '');
  if (!Number.isFinite(created) || Date.now() - created > 30 * 864e5) return;
  const sent = safeGet(VERIFIED_SENT_KEY) || {};
  if (sent[user.id]) return;
  sent[user.id] = Date.now();
  safeSet(VERIFIED_SENT_KEY, sent);
  try { posthog.capture('referral_verified'); } catch { /* analytics off */ }
}

/**
 * After sign-in: store the referrer on a NEW account only (created after the
 * invite link was opened), never on her own code, never twice.
 */
export async function attachPendingReferral(supabase) {
  const pending = safeGet(PENDING_REF_KEY);
  if (!pending?.code || !supabase?.auth) return false;
  let user = null;
  try { user = (await supabase.auth.getUser())?.data?.user || null; } catch { return false; }
  if (!user?.id) return false;
  const meta = user.user_metadata || {};
  const created = Date.parse(user.created_at || '');
  const isNewAccount = Number.isFinite(created) && created >= pending.at - 10 * 60 * 1000;
  if (meta.referred_by && meta.referred_by === pending.code && isNewAccount) {
    // Recorded at sign-up already (AuthGate passed the code).
    try { posthog.capture('referral_signup_completed', { via: 'signup' }); } catch { /* analytics off */ }
  }
  if (meta.referred_by || pending.code === referralCodeFor(user.id) || !isNewAccount) {
    safeDel(PENDING_REF_KEY);
    return false;
  }
  try {
    await supabase.auth.updateUser({ data: { referred_by: pending.code, referred_at: new Date().toISOString() } });
  } catch { /* metadata is a backup; the table row below is what counts */ }
  try {
    const { error } = await supabase.from('referrals').insert({ referred_user_id: user.id, referrer_code: pending.code });
    if (!error) { try { posthog.capture('referral_signup_completed', { via: 'client' }); } catch { /* analytics off */ } }
  } catch { /* table not created yet: metadata still holds it */ }
  safeDel(PENDING_REF_KEY);
  return true;
}

let referralInstalled = false;
/** Capture ?ref now and attach it whenever someone signs in. Safe to call many times. */
export function installReferralCapture(supabase) {
  captureReferralFromUrl();
  if (referralInstalled || !supabase?.auth) return;
  referralInstalled = true;
  attachPendingReferral(supabase);
  try {
    supabase.auth.onAuthStateChange?.((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        attachPendingReferral(supabase);
        trackReferredVerification(session?.user);
      }
    });
  } catch { /* older client */ }
}

/** { joined, qualified } for her code, or null when the migration is not applied yet. */
export async function loadReferralStats(supabase) {
  if (!supabase?.rpc) return null;
  try {
    const { data, error } = await supabase.rpc('my_referral_stats');
    if (error) return null;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { joined: 0, qualified: 0 };
    return { joined: Number(row.joined) || 0, qualified: Number(row.qualified) || 0 };
  } catch {
    return null;
  }
}

/* ----------------------------- Got the app ------------------------------ */

/**
 * Called by the mobile app whenever it has a signed-in user. Writes the
 * device flag every time (cheap) and the account metadata only once.
 */
export function recordAppSignIn(supabase, user) {
  if (!user?.id) return;
  const seen = safeGet(APP_KEY) || {};
  if (!seen[user.id]) { seen[user.id] = Date.now(); safeSet(APP_KEY, seen); }
  if (user.user_metadata?.ayna_app_signed_in_at || !supabase?.auth?.updateUser) return;
  try {
    Promise.resolve(supabase.auth.updateUser({ data: { ayna_app_signed_in_at: new Date().toISOString() } })).catch(() => {});
  } catch { /* offline or older client: the device flag still counts here */ }
}

export function hasAppSignIn(user) {
  if (user?.user_metadata?.ayna_app_signed_in_at) return true;
  const seen = safeGet(APP_KEY);
  return Boolean(user?.id && seen && seen[user.id]);
}

/* ------------------------------ Community post ----------------------------- */

/** Has she posted at least once? null when it cannot be checked. */
export async function loadHasPosted(supabase, userId) {
  if (!supabase?.from || !userId) return null;
  try {
    const { count, error } = await supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('author_id', userId);
    if (error) return null;
    return (count || 0) > 0;
  } catch {
    return null;
  }
}

/* ------------------------------ Full ecosystem ----------------------------- */

/** Needs she chose that have at least one of her products on their shelf. */
export function ecosystemCompletion(myProducts = [], quizAnswers = null, matchOpts) {
  if (!quizAnswers) return { filled: 0, total: 0 };
  let shelves = [];
  try { shelves = getEcosystemSeedFromQuiz(quizAnswers, null, matchOpts)?.shelves || []; } catch { shelves = []; }
  const list = Array.isArray(myProducts) ? myProducts : Object.values(myProducts || {});
  const filled = shelves.filter((shelf) => list.some((p) => {
    if (!p?.id) return false;
    if ((shelf.productIds || []).includes(p.id)) return true;
    try {
      const m = getProductMatchDetailsForProduct(p, quizAnswers, null, matchOpts)?.needMatches?.find((x) => x.needId === shelf.needId);
      return Boolean(m?.relevant && m.score >= MIN_SHELF_SCORE);
    } catch { return false; }
  })).length;
  return { filled, total: shelves.length };
}

/* --------------------------------- Badges --------------------------------- */

/**
 * @returns [{ key, label, earned, progress: { value, goal } | null, hint }]
 */
export function computeBadges({ usedApp = false, eco = { filled: 0, total: 0 }, hasPosted = null, referrals = null } = {}) {
  const ecoDone = eco.total > 0 && eco.filled >= eco.total;
  const friends = Math.min(FRIENDS_GOAL, referrals?.qualified || 0);
  return [
    { key: 'app', label: 'Got the app', earned: Boolean(usedApp), progress: null, hint: 'Download the ayna app and sign in' },
    { key: 'ecosystem', label: 'Full ecosystem', earned: ecoDone, progress: eco.total ? { value: Math.min(eco.filled, eco.total), goal: eco.total } : null, hint: eco.total ? 'One pick for every need' : 'Take the quiz' },
    { key: 'post', label: 'First post', earned: hasPosted === true, progress: null, hint: 'Post in Community' },
    { key: 'friends', label: 'Brought 3 friends', earned: friends >= FRIENDS_GOAL, progress: { value: friends, goal: FRIENDS_GOAL }, hint: 'Friends who join and post' },
  ];
}
