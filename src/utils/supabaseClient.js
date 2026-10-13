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

function authStorageKey(url) {
  try {
    const projectRef = new URL(url).hostname.split('.')[0];
    return projectRef ? `sb-${projectRef}-auth-token` : undefined;
  } catch {
    return undefined;
  }
}

// Google starts through a PKCE-capable client, but deliberately uses the SAME
// browser storage and SAME Supabase auth key as the main client. It only needs
// to exist on the page that starts the redirect so it can generate the PKCE
// verifier. After Google returns, the page reload means this instance is gone;
// getSupabaseClient() below becomes the PKCE callback client and exchanges the
// code directly into the main persisted session. No session-copy step is used.
export function getWebGoogleOAuthClient() {
  if (typeof window === 'undefined' || Capacitor.isNativePlatform()) return null;
  if (webGoogleOAuthClient) return webGoogleOAuthClient;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  try {
    const storageKey = authStorageKey(url);
    webGoogleOAuthClient = createClient(url, anonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: false,
        storage: window.localStorage,
        ...(storageKey ? { storageKey } : {}),
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
    const isNative = Capacitor.isNativePlatform();
    const isWebGooglePkceCallback = !isNative
      && typeof window !== 'undefined'
      && window.location.pathname === '/auth/callback'
      && new URLSearchParams(window.location.search).has('code');
    const storageKey = authStorageKey(url);

    client = createClient(url, anonKey, {
      auth: {
        // Keep the existing implicit flow everywhere except the web Google
        // callback. On that callback page the SAME main client performs the
        // PKCE code exchange, so the resulting access token is also the token
        // used automatically by PostgREST for ecosystems, reviews, etc.
        flowType: isWebGooglePkceCallback ? 'pkce' : 'implicit',
        detectSessionInUrl: false,
        persistSession: true,
        ...(!isNative && storageKey ? { storage: window.localStorage, storageKey } : {}),
        // GoTrueClient auto-selects the browser's navigator.locks API to
        // serialize auth calls whenever it's merely present, true in a
        // WKWebView, but not necessarily reliable there. processLock is
        // Supabase's own single-process alternative for Capacitor/native.
        ...(isNative ? { lock: processLock } : {}),
      },
    });

    if (!isNative) {
      // A subscription created while /auth/callback is mounting receives a
      // normal INITIAL_SESSION(null) before the PKCE exchange finishes. Do not
      // let that startup event masquerade as a real logout. Real SIGNED_OUT
      // events still pass through untouched.
      const onAuthStateChange = client.auth.onAuthStateChange.bind(client.auth);
      client.auth.onAuthStateChange = (callback) => {
        const subscribedOnAuthCallback = window.location.pathname === '/auth/callback';
        return onAuthStateChange((event, session) => {
          if (subscribedOnAuthCallback && event === 'INITIAL_SESSION' && !session) return;
          callback(event, session);
        });
      };

      // Start WEB Google OAuth with PKCE. The callback itself is handled by the
      // main client above, not by this temporary starter client.
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
