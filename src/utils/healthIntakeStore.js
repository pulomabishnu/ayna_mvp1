import { getSupabaseClient, getSupabaseUser } from './supabaseClient';

const TABLE = 'health_intakes';
const LOCAL_PREFIX = 'ayna_health_intake_v2:';

function storageKey(userId) {
  return `${LOCAL_PREFIX}${userId || 'anonymous'}`;
}

function readLocal(userId) {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
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
  } catch (_) {
    return null;
  }
}

function writeLocal(userId, profile) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(profile || {}));
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

  // The ecosystem should never become unusable because the live Supabase
  // table/policy is temporarily unavailable. We keep a per-user local copy as
  // the immediate read path, then use the server as the durable sync layer.
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
    // Best-effort repair for a device that has the completed intake locally but
    // no row on the server yet. Never block rendering on this sync.
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

  // Save locally FIRST. That means Finish can always build the ecosystem even
  // if Supabase is offline, the RLS policy is misconfigured, or the table has
  // not reached this environment yet. The key is user-scoped, so another user
  // on the same browser does not inherit this profile.
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
