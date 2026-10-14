import { createClient } from '@supabase/supabase-js';
import { processLock } from '@supabase/auth-js';
import { Capacitor } from '@capacitor/core';

let client = null;

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
    client = createClient(url, anonKey, {
      auth: {
        flowType: 'implicit',   // avoids PKCE verifier storage, Chrome bounce tracking deletes it
        detectSessionInUrl: false, // AuthCallback.jsx handles implicit OAuth tokens explicitly
        storage: rememberAwareAuthStorage, // Remember me, see the note above
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
