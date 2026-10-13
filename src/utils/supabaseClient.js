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
let webGoogleOAuthClient = null;

// Google OAuth on the web uses a dedicated PKCE client. The production Auth
// service began issuing a valid Google session and then returning
// `bad_oauth_state` for the same implicit-flow callback. PKCE keeps the server
// flow state through the provider callback and returns a one-time code instead,
// avoiding that broken implicit callback path. Keep its verifier in
// sessionStorage so it survives the Google round trip without changing the
// app's normal Supabase session storage or any native auth behavior.
export function getWebGoogleOAuthClient() {
  if (typeof window === 'undefined' || Capacitor.isNativePlatform()) return null;
  if (webGoogleOAuthClient) return webGoogleOAuthClient;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  try {
    webGoogleOAuthClient = createClient(url, anonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: false,
        storage: window.sessionStorage,
      },
    });
  } catch (e) {
    console.error('[Ayna] Google OAuth client init failed:', e);
    return null;
  }

  return webGoogleOAuthClient;
}

export function getSupabaseClient() {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    client = createClient(url, anonKey, {
      auth: {
        flowType: 'implicit',
        // AuthCallback.jsx owns both implicit hash tokens and the web Google
        // PKCE code exchange. Leaving automatic URL detection on here races the
        // dedicated PKCE client and tries to exchange the code without its
        // verifier.
        detectSessionInUrl: false,
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

    if (!Capacitor.isNativePlatform()) {
      // A subscription created while /auth/callback is mounting receives the
      // main client's normal INITIAL_SESSION(null) before AuthCallback has had
      // time to copy the successful Google PKCE session into this client.
      // App.jsx historically treated ANY null-session event as a real logout,
      // scheduled a 1.5s cleanup, and that cleanup could win after SIGNED_IN:
      // the user visibly appeared logged in for a moment and was then cleared.
      // Ignore only that one startup event for subscriptions created on the
      // callback route. Real SIGNED_OUT events still pass through untouched,
      // and subscriptions created anywhere else keep Supabase's normal event
      // stream. This changes no account/profile/database data.
      const onAuthStateChange = client.auth.onAuthStateChange.bind(client.auth);
      client.auth.onAuthStateChange = (callback) => {
        const subscribedOnAuthCallback = window.location.pathname === '/auth/callback';
        return onAuthStateChange((event, session) => {
          if (subscribedOnAuthCallback && event === 'INITIAL_SESSION' && !session) return;
          callback(event, session);
        });
      };

      // Route every WEB Google OAuth start through the isolated PKCE client,
      // including sign-in, quiz save, and Google re-auth flows. Apple and native
      // Google keep their existing behavior.
      const signInWithOAuth = client.auth.signInWithOAuth.bind(client.auth);
      client.auth.signInWithOAuth = (credentials) => {
        if (credentials?.provider === 'google') {
          const googleClient = getWebGoogleOAuthClient();
          if (googleClient) return googleClient.auth.signInWithOAuth(credentials);
        }
        return signInWithOAuth(credentials);
      };
    }
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
