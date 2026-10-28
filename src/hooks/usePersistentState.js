import { useCallback, useEffect, useRef, useState } from 'react';

// useState that survives a refresh (filters, drafts, settings forms).
// localStorage only, every read and write in try/catch: private windows,
// blocked storage or a full quota fall back to plain in-memory state.
// Writes are small and synchronous, so nothing typed is lost on unmount.
// Pass `null` as the key to turn persistence off (e.g. before sign-in).
const PREFIX = 'ayna_keep_v1:';

export function readKept(key, fallback) {
  if (!key) return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}

export function forgetKept(key) {
  if (!key) return;
  try { window.localStorage.removeItem(PREFIX + key); } catch { /* storage blocked */ }
}

export default function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => readKept(key, typeof initial === 'function' ? initial() : initial));
  const keyRef = useRef(key);
  useEffect(() => {
    keyRef.current = key;
    if (!key) return;
    try { window.localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* storage blocked or full */ }
  }, [key, value]);
  // Forget the stored copy (after a successful send); the caller resets the field.
  const clear = useCallback(() => forgetKept(keyRef.current), []);
  return [value, setValue, clear];
}
