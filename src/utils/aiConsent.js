import { getSupabaseClient } from './supabaseClient.js';

/**
 * Permission to send her wellness context to an outside AI provider (App Review 5.1.2(i), Nov 25).
 * Optional at sign-up; when she didn't tick it, the first AI feature she uses asks first.
 * Stored on her account (user_metadata.ai_processing_consent) and remembered on this device.
 */
const KEY = (uid) => `ayna_ai_consent_v1:${uid || 'anon'}`;

export function hasAiConsent(session) {
  const user = session?.user;
  if (user?.user_metadata?.ai_processing_consent === true) return true;
  try { return localStorage.getItem(KEY(user?.id)) === '1'; } catch { return false; }
}

export async function grantAiConsent(session) {
  const uid = session?.user?.id;
  try { localStorage.setItem(KEY(uid), '1'); } catch { /* storage off */ }
  const client = getSupabaseClient();
  if (client && uid) {
    try { await client.auth.updateUser({ data: { ai_processing_consent: true, ai_processing_consent_at: new Date().toISOString() } }); } catch { /* kept on this device; saved to the account next time */ }
  }
}
