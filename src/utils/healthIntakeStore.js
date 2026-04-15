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
  const payload = {
    user_id: user.id,
    profile,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
  return { saved: true, userId: user.id };
}
