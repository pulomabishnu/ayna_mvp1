import { useCallback, useEffect, useState } from 'react';

/* Website theme: Light, Dark, or Match my device. Stored per browser.
   (Reads the older shared key once so nobody's choice is lost.) */
const KEY = 'ayna_web_theme_v1';
const OLD_KEY = 'ayna_mobile_theme_v1';
const MODES = new Set(['light', 'dark', 'system']);

function load() {
  try {
    const v = localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY);
    return MODES.has(v) ? v : 'light';
  } catch { return 'light'; }
}
const prefersDark = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

export function useWebTheme() {
  const [mode, setMode] = useState(load);
  const [deviceDark, setDeviceDark] = useState(prefersDark);
  useEffect(() => { try { localStorage.setItem(KEY, mode); } catch { /* private mode */ } }, [mode]);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return undefined;
    const on = () => setDeviceDark(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  const setThemeMode = useCallback((next) => { if (MODES.has(next)) setMode(next); }, []);
  const theme = mode === 'system' ? (deviceDark ? 'dark' : 'light') : mode;
  return { theme, mode, setThemeMode };
}

export default useWebTheme;
