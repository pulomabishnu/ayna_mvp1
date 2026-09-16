import { createClient } from '@supabase/supabase-js';
import { processLock } from '@supabase/auth-js';
import { Capacitor } from '@capacitor/core';

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
        detectSessionInUrl: false, // AuthCallback.jsx handles implicit OAuth tokens explicitly
        // GoTrueClient auto-selects the browser's navigator.locks API to
        // serialize auth calls (setSession, refresh, etc.) whenever it's
        // merely present — true in a WKWebView, but its Web Locks
        // implementation there is unreliable: a lock request can simply
        // never resolve or reject. That silently hangs every subsequent
        // auth call forever (no error, nothing — confirmed live on a real
        // device: native Google sign-in's setSession() call never
        // returned). processLock is Supabase's own single-process
        // alternative, built for exactly this (their docs: "React Native
        // or other non-browser single-process environments") — same
        // category as a Capacitor native app.
        ...(Capacitor.isNativePlatform() ? { lock: processLock } : {}),
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
