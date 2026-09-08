import { useCallback, useState } from 'react';

// Persists the mock "signed-in" state — ecosystem membership, quiz answers,
// display name — so refreshing the app (or relaunching the native shell)
// doesn't wipe it back to a blank slate. There's no real Supabase session
// wired into the mobile UI yet (that's a separate, larger integration), so
// this is a local stand-in for "remember me" using the same localStorage
// pattern as useSavedProducts/useThemeMode/useRoutine.
const SESSION_KEY = 'ayna_ecosystem_session_v1';

const DEFAULT_SESSION = {
  hasEcosystem: false,
  myProducts: [],
  lastQuizAnswers: null,
  // Empty, not 'You' — this used to be a baked-in literal, which meant it
  // was always truthy and MobileApp.jsx's `userName || <real fallback>`
  // could never actually reach the real Supabase name for a returning
  // Google sign-in. "You" is purely a last-resort display fallback now,
  // applied at each render site (ProfileFlow, AccountInfoScreen, etc.),
  // not baked into the stored value itself.
  userName: '',
};

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return DEFAULT_SESSION;
    const parsed = JSON.parse(raw);
    return {
      hasEcosystem: Boolean(parsed?.hasEcosystem),
      myProducts: Array.isArray(parsed?.myProducts) ? parsed.myProducts : [],
      lastQuizAnswers: parsed?.lastQuizAnswers && typeof parsed.lastQuizAnswers === 'object' ? parsed.lastQuizAnswers : null,
      userName: typeof parsed?.userName === 'string' ? parsed.userName : '',
    };
  } catch {
    return DEFAULT_SESSION;
  }
}

function persistSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Best-effort — same as savedProductsStore, a full/unavailable
    // localStorage shouldn't crash the app.
  }
}

export function useEcosystemSession() {
  const [session, setSession] = useState(loadSession);

  // Accepts either a partial object (merged in) or an updater function
  // receiving the previous session, mirroring useState's own setter shape
  // so call sites read like ordinary state updates.
  const update = useCallback((patch) => {
    setSession((prev) => {
      const next = typeof patch === 'function' ? { ...prev, ...patch(prev) } : { ...prev, ...patch };
      persistSession(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSession(DEFAULT_SESSION);
    persistSession(DEFAULT_SESSION);
  }, []);

  return { session, update, reset };
}
