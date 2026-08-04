/**
 * Supabase persistence for the imported health profile (conditions,
 * medications, allergies, wearable/FHIR summaries).
 *
 * This data was localStorage-only. It is fed to the LLM as health context, so
 * losing it doesn't just lose a screen — it silently degrades every subsequent
 * recommendation with no signal to the user. localStorage stays as the
 * synchronous read path (the profile is read during render in several places),
 * with the server as the durable copy.
 */
import { getSupabaseClient, getSupabaseUser } from './supabaseClient';
import { loadHealthProfile, saveHealthProfile } from './healthDataProfile';

const TABLE = 'user_health_profiles';

function isEmptyProfile(p) {
  if (!p || typeof p !== 'object') return true;
  const arrays = ['conditions', 'medications', 'allergies'];
  const hasArrayData = arrays.some((k) => Array.isArray(p[k]) && p[k].length > 0);
  const hasText = !!(p.notes || p.intakeSummary || p.wearableSummary?.text);
  return !hasArrayData && !hasText;
}

/**
 * Load the server copy and mirror it into localStorage.
 *
 * @returns {Promise<{profile: object|null, source: 'server'|'local'|'none'}>}
 */
export async function loadHealthProfileForCurrentUser() {
  const supabase = getSupabaseClient();
  if (!supabase) return { profile: loadHealthProfile(), source: 'local' };

  const user = await getSupabaseUser();
  if (!user?.id) return { profile: loadHealthProfile(), source: 'local' };

  const { data, error } = await supabase
    .from(TABLE)
    .select('profile')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error(`loadHealthProfile: ${error.message}`);

  const server = data?.profile || null;
  const local = loadHealthProfile();

  // A device that imported while signed out has data the server doesn't. Push
  // it up rather than letting the (empty) server copy overwrite it.
  if (isEmptyProfile(server) && !isEmptyProfile(local)) {
    await saveHealthProfileForCurrentUser(local).catch(() => {});
    return { profile: local, source: 'local' };
  }

  if (!isEmptyProfile(server)) {
    saveHealthProfile(server);
    return { profile: server, source: 'server' };
  }

  return { profile: local, source: local ? 'local' : 'none' };
}

/** Write through to both the server and localStorage. */
export async function saveHealthProfileForCurrentUser(profile) {
  saveHealthProfile(profile);

  const supabase = getSupabaseClient();
  if (!supabase) return { saved: false, reason: 'supabase_not_configured' };

  const user = await getSupabaseUser();
  if (!user?.id) return { saved: false, reason: 'no_authenticated_user' };

  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { user_id: user.id, profile: profile || {}, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw new Error(`saveHealthProfile: ${error.message}`);
  return { saved: true };
}
