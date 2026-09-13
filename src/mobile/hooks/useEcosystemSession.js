import { useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';

// This hook is only a fast in-memory UI session. Signed-in account state is
// restored from Supabase by MobileApp. Health answers must never be persisted
// in localStorage. On native iOS we do not persist this session at all, because
// ecosystem membership can itself reveal sensitive health interests.
const SESSION_KEY = 'ayna_ecosystem_session_v1';
const IS_NATIVE_IOS = Capacitor.getPlatform() === 'ios';

const DEFAULT_SESSION = {
  hasEcosystem: false,
  myProducts: [],
  lastQuizAnswers: null,
  userName: '',
};

function scrubLegacyNativeSession() {
  if (!IS_NATIVE_IOS) return;
  try { localStorage.removeItem(SESSION_KEY); } catch { /* storage unavailable */ }
}

function serializableNonHealthSession(session) {
  return {
    hasEcosystem: Boolean(session?.hasEcosystem),
    myProducts: Array.isArray(session?.myProducts) ? session.myProducts : [],
    // Deliberately never persisted. This may contain conditions, symptoms,
    // reproductive-health details, medications, allergies, ZIP code, etc.
    lastQuizAnswers: null,
    userName: typeof session?.userName === 'string' ? session.userName : '',
  };
}

function loadSession() {
  if (IS_NATIVE_IOS) {
    scrubLegacyNativeSession();
    return DEFAULT_SESSION;
  }

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return DEFAULT_SESSION;
    const parsed = JSON.parse(raw);
    const safe = serializableNonHealthSession(parsed);

    // Immediately overwrite any pre-privacy version that still contained
    // lastQuizAnswers so old health answers are removed from browser storage.
    if (parsed?.lastQuizAnswers) {
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(safe)); } catch { /* ignore */ }
    }
    return safe;
  } catch {
    return DEFAULT_SESSION;
  }
}

function persistSession(session) {
  if (IS_NATIVE_IOS) {
    scrubLegacyNativeSession();
    return;
  }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(serializableNonHealthSession(session)));
  } catch {
    // In-memory state still works for this session.
  }
}

export function useEcosystemSession() {
  const [session, setSession] = useState(loadSession);

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
