import { getSupabaseClient, getSupabaseUser } from './supabaseClient';

const TABLE = 'health_intakes';
const LOCAL_PREFIX = 'ayna_health_intake_v2:';
const AUTH_TIMEOUT_MS = 3000;
const SERVER_SAVE_TIMEOUT_MS = 6000;

function withTimeout(promise, ms, reason = 'request_timeout') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(reason)), ms)),
  ]);
}

function storageKey(userId) {
  return `${LOCAL_PREFIX}${userId || 'anonymous'}`;
}

/**
 * Sensitive intake answers are server-backed in Supabase. Browser storage is
 * only an active-tab fallback so a temporary network failure does not destroy
 * progress. Older builds persisted these answers in localStorage indefinitely;
 * migrate that copy once, then remove it from persistent browser storage.
 */
function readLocal(userId) {
  if (typeof window === 'undefined') return null;
  const key = storageKey(userId);
  try {
    const sessionRaw = window.sessionStorage.getItem(key);
    if (sessionRaw) return JSON.parse(sessionRaw);

    const legacyRaw = window.localStorage.getItem(key);
    if (!legacyRaw) return null;
    const parsed = JSON.parse(legacyRaw);
    try { window.sessionStorage.setItem(key, legacyRaw); } catch (_) {}
    try { window.localStorage.removeItem(key); } catch (_) {}
    return parsed;
  } catch (_) {
    return null;
  }
}

async function resolveUserId(supabase) {
  if (!supabase) return null;

  // Prefer the cached session. Calling getUser first can require a network
  // round trip and previously allowed the Finish button to hang indefinitely.
  try {
    const { data } = await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS, 'auth_session_timeout');
    if (data?.session?.user?.id) return data.session.user.id;
  } catch (_) {}

  try {
    const user = await withTimeout(getSupabaseUser(), AUTH_TIMEOUT_MS, 'auth_user_timeout');
    return user?.id || null;
  } catch (_) {
    return null;
  }
}

function writeLocal(userId, profile) {
  if (typeof window === 'undefined') return false;
  const key = storageKey(userId);
  try {
    window.sessionStorage.setItem(key, JSON.stringify(profile || {}));
    // Defense in depth for anyone upgrading from a build that used localStorage.
    try { window.localStorage.removeItem(key); } catch (_) {}
    return true;
  } catch (_) {
    return false;
  }
}

export async function loadHealthIntakeForCurrentUser() {
  const supabase = getSupabaseClient();
  const userId = await resolveUserId(supabase);
  const local = readLocal(userId);

  if (!supabase || !userId) return local;

  const { data, error } = await supabase
    .from(TABLE)
    .select('profile')
    .eq('user_id', userId)
    .maybeSingle();

  // Keep the current tab usable during a transient backend failure, without
  // leaving reproductive-health answers behind in persistent browser storage.
  if (error) {
    console.warn('[healthIntakeStore] server load failed; using session copy:', error.message || error);
    return local;
  }

  const server = data?.profile || null;
  if (server) {
    writeLocal(userId, server);
    return server;
  }

  if (local) {
    // Best-effort repair for a same-tab intake that has not reached the server.
    supabase
      .from(TABLE)
      .upsert({ user_id: userId, profile: local, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .then(({ error: syncError }) => {
        if (syncError) console.warn('[healthIntakeStore] background sync failed:', syncError.message || syncError);
      })
      .catch(() => {});
  }

  return local;
}

export async function saveHealthIntakeForCurrentUser(profile) {
  const supabase = getSupabaseClient();
  const userId = await resolveUserId(supabase);

  // This column must hold the RAW intake. A legacy quiz profile (the output of
  // mapIntakeToLegacyQuizProfile) is a different shape. Unwrap it so callers
  // cannot accidentally persist an already-mapped profile.
  let toStore = profile;
  if (profile && typeof profile === 'object' && profile.fullHealthIntake) {
    console.warn('[healthIntakeStore] received a legacy quiz profile; storing its fullHealthIntake instead');
    toStore = profile.fullHealthIntake;
  }

  // Session fallback FIRST so Finish remains responsive during a transient
  // outage. Supabase remains the durable source of truth.
  const localSaved = writeLocal(userId, toStore);

  if (!supabase) return { saved: false, localSaved, reason: 'supabase_not_configured' };
  if (!userId) return { saved: false, localSaved, reason: 'no_authenticated_user' };

  const payload = {
    user_id: userId,
    profile: toStore,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await withTimeout(
      supabase.from(TABLE).upsert(payload, { onConflict: 'user_id' }),
      SERVER_SAVE_TIMEOUT_MS,
      'server_save_timeout'
    );
    if (error) {
      console.warn('[healthIntakeStore] server save failed; session copy retained:', error.message || error);
      return { saved: false, localSaved, reason: error.message || 'server_save_failed' };
    }
    return { saved: true, localSaved, userId };
  } catch (error) {
    console.warn('[healthIntakeStore] server save threw; session copy retained:', error);
    return { saved: false, localSaved, reason: error?.message || 'server_save_failed' };
  }
}
