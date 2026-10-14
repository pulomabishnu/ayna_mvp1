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
  if (!window.location || window.location.pathname === '/auth/callback') return;

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
  } catch {
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
// verifier. After Google returns, getSupabaseClient() is the PKCE callback
// client. AuthCallback still asks for getWebGoogleOAuthClient(), so on that
// callback page return the main client itself instead of creating a second one.
export function getWebGoogleOAuthClient() {
  if (typeof window === 'undefined' || Capacitor.isNativePlatform()) return null;

  const isCallback = window.location.pathname === '/auth/callback'
    && new URLSearchParams(window.location.search).has('code');
  if (isCallback) return getSupabaseClient();

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

/**
 * REMEMBER ME (session persistence only, never data).
 *
 * The sign-in forms (web AuthGate, app SigninScreen) offer a "Remember me"
 * checkbox. It controls WHERE the Supabase auth session (access + refresh
 * token, never a password) is stored:
 *
 *   ON  (default): localStorage, the session survives closing the browser.
 *   OFF:           sessionStorage, the session ends when the browser session
 *                  truly ends (per tab, per the Web Storage spec).
 *
 * Mechanism: the client is a singleton created on first use, before anyone
 * has signed in, so the choice cannot be baked in at createClient() time.
 * Instead the client gets ONE storage adapter whose setItem routes to
 * localStorage or sessionStorage based on a small preference flag read at
 * call time. setRememberMe() is called by the sign-in forms right before
 * every sign-in (email, Google, Apple, phone), so the very first token write
 * after that sign-in, including the OAuth setSession() on /auth/callback,
 * lands in the chosen store. The flag survives the OAuth round trip because
 * it lives in localStorage; it holds only '1'/'0', never a credential.
 *
 * getItem reads sessionStorage first, then localStorage, so an existing
 * persisted session keeps working whatever the flag says, and every token
 * write (sign-in, token refresh) re-homes the session into the currently
 * chosen store and removes it from the other, so the two can never fight.
 * removeItem (sign-out) clears both. Turning Remember me off touches ONLY
 * these auth-token keys: account data, ecosystem, saved products and intake
 * live in Supabase tables and are never deleted by this.
 *
 * The Community guest client below uses its own storageKey and its own
 * default storage on purpose; this adapter only ever sees the main client's
 * keys.
 */
const REMEMBER_ME_KEY = 'ayna_remember_me_v1';
// Supabase's default auth storage key is `sb-<project-ref>-auth-token`
// (plus suffixed variants like `-code-verifier`). Only those are migrated
// when the preference flips mid-session.
const AUTH_TOKEN_KEY_RE = /^sb-.+-auth-token/;

function safeStorage(kind) {
  try {
    const store = kind === 'local' ? window.localStorage : window.sessionStorage;
    // Probe: accessing/using storage can throw in private mode / blocked state.
    if (store) return store;
  } catch { /* unavailable */ }
  return null;
}

export function getRememberMe() {
  const local = safeStorage('local');
  try {
    return local ? local.getItem(REMEMBER_ME_KEY) !== '0' : true;
  } catch {
    return true;
  }
}

/**
 * Record the person's choice and move any existing auth token into the
 * matching store so the choice applies to the session being created right
 * now, not just some later one. Call right before a sign-in starts.
 */
export function setRememberMe(remember) {
  const local = safeStorage('local');
  const session = safeStorage('session');
  try { local?.setItem(REMEMBER_ME_KEY, remember ? '1' : '0'); } catch { /* best effort */ }

  const from = remember ? session : local;
  const to = remember ? local : session;
  if (!from || !to) return;
  try {
    const keys = [];
    for (let i = 0; i < from.length; i += 1) {
      const key = from.key(i);
      if (key && AUTH_TOKEN_KEY_RE.test(key)) keys.push(key);
    }
    for (const key of keys) {
      const value = from.getItem(key);
      if (value !== null) {
        try { to.setItem(key, value); } catch { continue; }
        try { from.removeItem(key); } catch { /* ignore */ }
      }
    }
  } catch { /* storage unavailable: the next token write still routes correctly */ }
}

export const rememberAwareAuthStorage = {
  getItem(key) {
    const session = safeStorage('session');
    try {
      const value = session?.getItem(key);
      if (value !== null && value !== undefined) return value;
    } catch { /* fall through */ }
    const local = safeStorage('local');
    try { return local ? local.getItem(key) : null; } catch { return null; }
  },
  setItem(key, value) {
    const remember = getRememberMe();
    const target = safeStorage(remember ? 'local' : 'session');
    const other = safeStorage(remember ? 'session' : 'local');
    try { target?.setItem(key, value); } catch { /* quota/private mode: in-memory session still works */ }
    try { other?.removeItem(key); } catch { /* ignore */ }
  },
  removeItem(key) {
    try { safeStorage('session')?.removeItem(key); } catch { /* ignore */ }
    try { safeStorage('local')?.removeItem(key); } catch { /* ignore */ }
  },
};

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
        detectSessionInUrl: false, // AuthCallback.jsx handles OAuth returns explicitly
        persistSession: true,
        // Remember me, see the note above. The Google starter client writes
        // its PKCE verifier to localStorage under the same key; this adapter
        // reads session storage first, then localStorage, so it finds it.
        storage: rememberAwareAuthStorage,
        ...(!isNative && storageKey ? { storageKey } : {}),
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

      if (isWebGooglePkceCallback) {
        // AuthCallback's older handoff code calls setSession() after the code
        // exchange. Now that exchange already happened on THIS same client,
        // that second setSession is redundant and triggers an unnecessary
        // /auth/v1/user validation request. Production was returning 500 for
        // that extra validation even though /token succeeded. If the exact
        // same tokens are already active, return the existing local session
        // instead of making the duplicate server call.
        const setSession = client.auth.setSession.bind(client.auth);
        client.auth.setSession = async (tokens) => {
          try {
            const { data } = await client.auth.getSession();
            const current = data?.session;
            if (
              current
              && tokens?.access_token === current.access_token
              && tokens?.refresh_token === current.refresh_token
            ) {
              return { data: { user: current.user, session: current }, error: null };
            }
          } catch { /* fall through to the real setSession */ }
          return setSession(tokens);
        };
      }

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
