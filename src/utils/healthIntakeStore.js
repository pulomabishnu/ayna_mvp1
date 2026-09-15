import { Capacitor } from '@capacitor/core';
import { getSupabaseClient, getSupabaseUser } from './supabaseClient';

const TABLE = 'health_intakes';
const LOCAL_PREFIX = 'ayna_health_intake_v2:';
const IS_NATIVE_IOS = Capacitor.getPlatform() === 'ios';

function storageKey(userId) {
  return `${LOCAL_PREFIX}${userId || 'anonymous'}`;
}

function scrubLegacyNativeIntake(userId) {
  if (!IS_NATIVE_IOS) return;
  try { window.localStorage.removeItem(storageKey(userId)); } catch { /* storage unavailable */ }
  try { window.localStorage.removeItem(storageKey('anonymous')); } catch { /* storage unavailable */ }
}

function readLocal(userId) {
  if (IS_NATIVE_IOS) {
    scrubLegacyNativeIntake(userId);
    return null;
  }
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function resolveUserId(supabase) {
  if (!supabase) return null;
  const user = await getSupabaseUser().catch(() => null);
  if (user?.id) return user.id;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || null;
  } catch {
    return null;
  }
}

function writeLocal(userId, profile) {
  if (IS_NATIVE_IOS) {
    // Health answers can reveal conditions, symptoms, medications, fertility
    // status, and other sensitive information. Native iOS keeps them in
    // memory only and uses the authenticated Supabase row as durable storage.
    scrubLegacyNativeIntake(userId);
    return false;
  }
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(profile || {}));
    return true;
  } catch {
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

  // On the website, a user-scoped local copy is an availability fallback.
  // Native iOS deliberately has no persistent local health-intake fallback.
  if (error) {
    console.warn('[healthIntakeStore] server load failed; using local copy:', error.message || error);
    return local;
  }

  const server = data?.profile || null;
  if (server) {
    writeLocal(userId, server);
    return server;
  }

  if (local) {
    // Best-effort repair for a browser that has the completed intake locally
    // but no server row yet. Native iOS never enters this path because local is
    // intentionally null there.
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

  // Browser gets a user-scoped availability fallback. Native iOS returns false
  // here and relies on Supabase for durable storage, keeping sensitive health
  // answers out of localStorage.
  const localSaved = writeLocal(userId, toStore);

  if (!supabase) return { saved: false, localSaved, reason: 'supabase_not_configured' };
  if (!userId) return { saved: false, localSaved, reason: 'no_authenticated_user' };

  const payload = {
    user_id: userId,
    profile: toStore,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'user_id' });
    if (error) {
      console.warn('[healthIntakeStore] server save failed; local copy retained:', error.message || error);
      return { saved: false, localSaved, reason: error.message || 'server_save_failed' };
    }
    return { saved: true, localSaved, userId };
  } catch (error) {
    console.warn('[healthIntakeStore] server save threw; local copy retained:', error);
    return { saved: false, localSaved, reason: error?.message || 'server_save_failed' };
  }
}
