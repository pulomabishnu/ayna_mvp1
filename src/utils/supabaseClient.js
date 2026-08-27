import { createClient } from '@supabase/supabase-js';

let client = null;

export function getSupabaseClient() {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    client = createClient(url, anonKey, {
      auth: {
        flowType: 'implicit',   // avoids PKCE verifier storage — Chrome bounce tracking deletes it
        detectSessionInUrl: true,
      },
    });
  } catch (e) {
    // createClient throws synchronously on a malformed VITE_SUPABASE_URL
    // (e.g. missing "https://", a stray trailing space, a copy-pasted anon
    // key in the URL slot). Uncaught, that crashes every caller — App.jsx's
    // auth effect on mount, AuthGate's render — with no message, which looks
    // exactly like "login is broken" and gives no clue why. Every call site
    // already treats a null return as "not configured," so surfacing the
    // same signal here instead of throwing means that path — and the
    // config-warning banner in AuthGate — actually gets a chance to run.
    console.error('[Ayna] Supabase client init failed — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local:', e);
    return null;
  }
  return client;
}

export async function getSupabaseUser() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user || null;
}
