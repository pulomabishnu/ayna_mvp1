/**
 * Badges + invite links (round 5). Exactly four badges:
 *
 *  1. First purchase   Signal: she clicked a "Buy now" / "Shop" button that
 *                      opens a retailer from a product page while signed in.
 *                      ayna has no order or checkout data, so this is a
 *                      click-out, not a confirmed purchase. Stored once in her
 *                      account metadata (ayna_first_buy_click_at) and on this
 *                      device.
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
import { getEcosystemSeedFromQuiz, getProductMatchDetailsForProduct } from '../data/products.js';

const PENDING_REF_KEY = 'ayna_pending_ref_v1';
const BUY_KEY = 'ayna_buy_clicks_v1';
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
  return pending;
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
  if (meta.referred_by || pending.code === referralCodeFor(user.id) || !isNewAccount) {
    safeDel(PENDING_REF_KEY);
    return false;
  }
  try {
    await supabase.auth.updateUser({ data: { referred_by: pending.code, referred_at: new Date().toISOString() } });
  } catch { /* metadata is a backup; the table row below is what counts */ }
  try {
    await supabase.from('referrals').insert({ referred_user_id: user.id, referrer_code: pending.code });
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
    supabase.auth.onAuthStateChange?.((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') attachPendingReferral(supabase);
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

/* ------------------------------- Click-outs ------------------------------- */

const BUY_TEXT = /^(buy now|shop|explore|view app)$/i;

export function recordBuyClick(productId, supabase) {
  const clicks = safeGet(BUY_KEY) || {};
  const first = !Object.keys(clicks).length;
  clicks[productId || 'unknown'] = clicks[productId || 'unknown'] || Date.now();
  safeSet(BUY_KEY, clicks);
  if (!supabase?.auth) return;
  supabase.auth.getUser().then(({ data }) => {
    const user = data?.user;
    if (!user || user.user_metadata?.ayna_first_buy_click_at) return;
    supabase.auth.updateUser({ data: { ayna_first_buy_click_at: new Date().toISOString(), ayna_first_buy_product: productId || null } }).catch(() => {});
  }).catch(() => {});
  return first;
}

export function hasBuyClick(user) {
  if (user?.user_metadata?.ayna_first_buy_click_at) return true;
  const clicks = safeGet(BUY_KEY);
  return Boolean(clicks && Object.keys(clicks).length);
}

let buyInstalled = false;
/**
 * One document listener for the retailer buttons on product pages:
 * website a.pdp-btn--buy (product id from /product/<id>), any a[data-ay-buy],
 * and the app product page's Shop / Explore / View app link.
 */
export function installBuyClickTracking(supabase) {
  if (buyInstalled || typeof document === 'undefined') return;
  buyInstalled = true;
  document.addEventListener('click', (e) => {
    const a = e.target?.closest?.('a[href]');
    if (!a) return;
    const tagged = a.getAttribute('data-ay-buy');
    const webBuy = a.classList.contains('pdp-btn--buy');
    const appBuy = !webBuy && a.target === '_blank' && a.closest('.ayna-fresh-product-detail') && BUY_TEXT.test((a.textContent || '').trim());
    if (!tagged && !webBuy && !appBuy) return;
    const fromPath = (window.location.pathname.match(/\/product\/([^/?#]+)/) || [])[1];
    recordBuyClick(tagged || (fromPath ? decodeURIComponent(fromPath) : null), supabase);
  }, true);
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
export function computeBadges({ boughtOnce = false, eco = { filled: 0, total: 0 }, hasPosted = null, referrals = null } = {}) {
  const ecoDone = eco.total > 0 && eco.filled >= eco.total;
  const friends = Math.min(FRIENDS_GOAL, referrals?.qualified || 0);
  return [
    { key: 'purchase', label: 'First purchase', earned: Boolean(boughtOnce), progress: null, hint: 'Shop a pick through ayna' },
    { key: 'ecosystem', label: 'Full ecosystem', earned: ecoDone, progress: eco.total ? { value: Math.min(eco.filled, eco.total), goal: eco.total } : null, hint: eco.total ? 'One pick for every need' : 'Take the quiz' },
    { key: 'post', label: 'First post', earned: hasPosted === true, progress: null, hint: 'Post in Community' },
    { key: 'friends', label: 'Brought 3 friends', earned: friends >= FRIENDS_GOAL, progress: { value: friends, goal: FRIENDS_GOAL }, hint: 'Friends who join and post' },
  ];
}
