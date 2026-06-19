/**
 * Supabase persistence for phone_numbers (SMS verification + opt-out state).
 * One row per user_id, looked up with the authenticated client so RLS applies.
 */

export async function loadPhoneNumberForUser(supabase, userId) {
  const { data, error } = await supabase
    .from('phone_numbers')
    .select('phone_number, is_verified, sms_opted_out, last_sms_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}
