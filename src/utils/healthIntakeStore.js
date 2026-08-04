import { getSupabaseClient, getSupabaseUser } from './supabaseClient';

const TABLE = 'health_intakes';

export async function loadHealthIntakeForCurrentUser() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const user = await getSupabaseUser();
  if (!user?.id) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select('profile')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data?.profile || null;
}

export async function saveHealthIntakeForCurrentUser(profile) {
  const supabase = getSupabaseClient();
  if (!supabase) return { saved: false, reason: 'supabase_not_configured' };
  const user = await getSupabaseUser();
  if (!user?.id) return { saved: false, reason: 'no_authenticated_user' };

  // This column must hold the RAW intake. A legacy quiz profile (the output of
  // mapIntakeToLegacyQuizProfile) is a different shape, and storing one here
  // silently empties conditions/symptoms/flowLevel on the next read, because
  // the mapper then runs over an already-mapped object. Unwrap rather than
  // reject so an existing bad caller self-corrects instead of losing the intake.
  let toStore = profile;
  if (profile && typeof profile === 'object' && profile.fullHealthIntake) {
    console.warn('[healthIntakeStore] received a legacy quiz profile; storing its fullHealthIntake instead');
    toStore = profile.fullHealthIntake;
  }

  const payload = {
    user_id: user.id,
    profile: toStore,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
  return { saved: true, userId: user.id };
}
