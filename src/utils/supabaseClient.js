import { createClient } from '@supabase/supabase-js';
import { processLock } from '@supabase/auth-js';
import { Capacitor } from '@capacitor/core';

// Supabase's implicit OAuth flow can fall back to SITE_URL when a requested
// redirect is not allowed. In that case Google may successfully return to
// `/#access_token=...&refresh_token=...` instead of `/auth/callback#...`.
// App.jsx normalizes the initial route immediately after React mounts, which
// can erase that fragment before AuthCallback or supabase-js sees it. Claim
// any auth-shaped return here, while modules are still evaluating and before
// React renders, and send it through the callback route that already knows how
// to establish the session. This only changes browser history; no account or
// user data is touched.
function normalizeWebOAuthReturnPath() {
  if (typeof window === 'undefined' || Capacitor.isNativePlatform()) return;
  if (window.location.pathname === '/auth/callback') return;

  try {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const search = new URLSearchParams(window.location.search);
    const isAuthReturn = Boolean(
      hash.get('access_token')
      || hash.get('refresh_token')
      || hash.get('error')
      || hash.get('error_description')
      || search.get('code')
      || search.get('error')
      || search.get('error_description')
    );

    if (!isAuthReturn) return;

    const callbackUrl = `/auth/callback${window.location.search}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', callbackUrl);
  } catch (_) {
    // If URL parsing is unavailable for any reason, leave routing untouched.
  }
}

normalizeWebOAuthReturnPath();

let client = null;

export function getSupabaseClient() {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    client = createClient(url, anonKey, {
      auth: {
        flowType: 'implicit',
        // Web OAuth can legitimately return to either /auth/callback or the
        // configured SITE_URL. Let supabase-js consume the implicit grant from
        // the URL wherever it lands so a successful Google sign-in never comes
        // back to ayna with tokens in the hash while the app still thinks she is
        // signed out. Native Capacitor handles its custom-scheme callback itself.
        detectSessionInUrl: !Capacitor.isNativePlatform(),
        persistSession: true,
        // GoTrueClient auto-selects the browser's navigator.locks API to
        // serialize auth calls whenever it's merely present, true in a
        // WKWebView, but not necessarily reliable there. processLock is
        // Supabase's own single-process alternative, built for exactly
        // this (their docs: "React Native or other non-browser
        // single-process environments"), same category as a Capacitor
        // native app, so used there instead.
        ...(Capacitor.isNativePlatform() ? { lock: processLock } : {}),
      },
    });
  } catch (e) {
    // createClient throws synchronously on a malformed VITE_SUPABASE_URL
    // (e.g. missing "https://", a stray trailing space, a copy-pasted anon
    // key in the URL slot). Uncaught, that crashes every caller, App.jsx's
    // auth effect on mount, AuthGate's render, with no message, which looks
    // exactly like "login is broken" and gives no clue why. Every call site
    // already treats a null return as "not configured," so surfacing the
    // same signal here instead of throwing means that path, and the
    // config-warning banner in AuthGate, actually gets a chance to run.
    console.error('[Ayna] Supabase client init failed, check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local:', e);
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
