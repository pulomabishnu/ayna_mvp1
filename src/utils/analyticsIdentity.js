// One analytics identity per ayna account, on every device (web and app).
//
// Privacy design (kept from Sep 2026): PostHog never receives the Supabase
// user id or the email, so the analytics warehouse can't be joined to health
// rows by id alone. Instead each account gets one random `ayna_…` analytics
// id, stored in Supabase (public.account_analytics, readable only by that
// account and by the team in the dashboard). That fixes what broke in
// September: the id used to live only in one browser's localStorage, so the
// same woman on her phone, laptop or after clearing her browser looked like a
// new person, and PostHog could never connect accounts to their visits.
//
// To match an account to PostHog (team only, in Supabase):
//   select u.id, u.email, a.analytics_id
//   from auth.users u join public.account_analytics a on a.user_id = u.id;
// a.analytics_id = the PostHog distinct_id.
//
// Events (no health details, generic names):
//   signed_up                once, right after an account is created
//                            { method: 'email' | 'google' | 'apple', referral_source }
//   account_session_started  once per browser session for a signed-in account
//                            { is_returning, account_age_days_bucket }
// Person properties: account_holder, account_created_week, email_verified.

const LOCAL_PREFIX = 'ayna_analytics_id_v1:';
const SIGNED_UP_PREFIX = 'ayna_signed_up_sent_v1:';
const SESSION_FLAG = 'ayna_account_session_v1';
const NEW_ACCOUNT_WINDOW_MS = 30 * 60 * 1000;

// Same opaque key main.jsx uses for the per-browser id, so an id this browser
// already used for the account is carried into the account record.
export function opaqueAccountKey(value) {
  const s = String(value || '');
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 2246822519);
  }
  return `${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}`;
}

const localKey = (userId) => `${LOCAL_PREFIX}${opaqueAccountKey(userId)}`;
const isAnalyticsId = (v) => typeof v === 'string' && /^ayna_[A-Za-z0-9_-]{8,80}$/.test(v);

function readLocal(key) { try { return window.localStorage.getItem(key); } catch { return null; } }
function writeLocal(key, v) { try { window.localStorage.setItem(key, v); } catch { /* private mode */ } }

export function newAnalyticsId() {
  try { if (globalThis.crypto?.randomUUID) return `ayna_${globalThis.crypto.randomUUID()}`; } catch { /* fall through */ }
  return `ayna_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

/** ISO week label like "2026-W42" (week only, never the exact date). */
export function isoWeek(dateLike) {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function ageBucket(days) {
  if (days < 1) return '<1d';
  if (days < 7) return '1-6d';
  if (days < 30) return '7-29d';
  if (days < 90) return '30-89d';
  return '90d+';
}

/**
 * The account's analytics id: the stored one if there is one, else this
 * browser's existing id for the account (keeps its history), else a new one.
 * Saved to Supabase so every device uses the same id from then on.
 */
export async function resolveAccountAnalyticsId(supabase, userId) {
  const key = localKey(userId);
  const local = readLocal(key);
  if (supabase?.from) {
    try {
      const { data, error } = await supabase.from('account_analytics').select('analytics_id').eq('user_id', userId).maybeSingle();
      if (!error && isAnalyticsId(data?.analytics_id)) { writeLocal(key, data.analytics_id); return data.analytics_id; }
      if (!error) {
        const candidate = isAnalyticsId(local) ? local : newAnalyticsId();
        const ins = await supabase.from('account_analytics').upsert({ user_id: userId, analytics_id: candidate }, { onConflict: 'user_id', ignoreDuplicates: true });
        if (!ins.error) {
          // Another device may have won the race; read back whichever id stuck.
          const again = await supabase.from('account_analytics').select('analytics_id').eq('user_id', userId).maybeSingle();
          const id = isAnalyticsId(again.data?.analytics_id) ? again.data.analytics_id : candidate;
          writeLocal(key, id);
          return id;
        }
      }
    } catch { /* table missing or offline: fall back to the browser id */ }
  }
  if (isAnalyticsId(local)) return local;
  const id = newAnalyticsId();
  writeLocal(key, id);
  return id;
}

const inFlight = new Map();

/**
 * Identify the signed-in account in PostHog, then record sign-up (once) and
 * the start of a session. Safe to call on every SIGNED_IN event: it does the
 * work once per account per page load. Never calls posthog.reset(), so the
 * visitor's earlier anonymous activity merges into the account.
 */
export function identifyAccount(posthog, supabase, user, { now = Date.now(), sessionStore } = {}) {
  if (!posthog || !user?.id) return Promise.resolve(null);
  if (inFlight.has(user.id)) return inFlight.get(user.id);
  const run = (async () => {
    const analyticsId = await resolveAccountAnalyticsId(supabase, user.id);
    // main.jsx's identify wrapper reads this browser's id for the account from
    // localStorage (now the account-wide id) and strips the email before
    // anything reaches PostHog; the email is only used to tag the founders.
    posthog.identify?.(user.id, { email: user.email });
    const createdAt = Date.parse(user.created_at || '');
    const ageDays = Number.isFinite(createdAt) ? Math.max(0, (now - createdAt) / 86400000) : null;
    try {
      posthog.setPersonProperties?.(
        { account_holder: true, email_verified: Boolean(user.email_confirmed_at || user.confirmed_at) },
        { account_created_week: Number.isFinite(createdAt) ? isoWeek(createdAt) : null },
      );
    } catch { /* older SDK */ }

    const provider = String(user.app_metadata?.provider || 'email');
    const isNew = Number.isFinite(createdAt) && now - createdAt <= NEW_ACCOUNT_WINDOW_MS;
    const sentKey = `${SIGNED_UP_PREFIX}${opaqueAccountKey(user.id)}`;
    if (isNew && !readLocal(sentKey)) {
      let referral = null;
      try { referral = posthog.get_property?.('$initial_referring_domain') || null; } catch { /* ignore */ }
      posthog.capture?.('signed_up', { method: provider, referral_source: referral || '$direct' });
      writeLocal(sentKey, '1');
    }

    const store = sessionStore || (typeof window !== 'undefined' ? window.sessionStorage : null);
    let started = null;
    try { started = store?.getItem(SESSION_FLAG); } catch { /* ignore */ }
    if (started !== analyticsId) {
      posthog.capture?.('account_session_started', {
        is_returning: ageDays != null ? ageDays >= 1 : null,
        account_age_days_bucket: ageDays != null ? ageBucket(ageDays) : null,
      });
      try { store?.setItem(SESSION_FLAG, analyticsId); } catch { /* ignore */ }
    }
    return analyticsId;
  })().finally(() => { inFlight.delete(user.id); });
  inFlight.set(user.id, run);
  return run;
}
