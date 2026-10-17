import { useCallback, useEffect, useState } from 'react';

/* Website theme: Light, Dark, or Match my device. Stored per browser.
   Default is Match my device (Oct 16). Only a choice someone actually makes is
   saved (v2 key). The old keys were written automatically with 'light' as the
   default, so an old 'light' is treated as no choice; an old 'dark' or
   'system' was picked on purpose and is kept. */
const KEY = 'ayna_web_theme_v2';
const OLD_KEYS = ['ayna_web_theme_v1', 'ayna_mobile_theme_v1'];
const MODES = new Set(['light', 'dark', 'system']);

export function loadThemeMode(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  try {
    const v = storage?.getItem(KEY);
    if (MODES.has(v)) return v;
    for (const k of OLD_KEYS) {
      const old = storage?.getItem(k);
      if (old === 'dark' || old === 'system') return old;
    }
  } catch { /* private mode */ }
  return 'system';
}
const load = () => loadThemeMode();
const prefersDark = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

export function useWebTheme() {
  const [mode, setMode] = useState(load);
  const [deviceDark, setDeviceDark] = useState(prefersDark);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return undefined;
    const on = () => setDeviceDark(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  const setThemeMode = useCallback((next) => {
    if (!MODES.has(next)) return;
    setMode(next);
    try { localStorage.setItem(KEY, next); } catch { /* private mode */ }
  }, []);
  const theme = mode === 'system' ? (deviceDark ? 'dark' : 'light') : mode;
  return { theme, mode, setThemeMode };
}

export default useWebTheme;
