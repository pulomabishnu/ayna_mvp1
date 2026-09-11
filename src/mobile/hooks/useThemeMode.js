import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'ayna_mobile_theme_v1';
const MODES = new Set(['light', 'dark', 'system']);

function loadMode() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return MODES.has(stored) ? stored : 'light';
  } catch {
    return 'light';
  }
}

function systemPrefersDark() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

// `mode` is the user's stored preference (what the Preferences screen shows
// selected — light/dark/system); `resolvedTheme` is the actual light/dark
// value applied to the DOM, tracking the OS live when mode is 'system'.
export function useThemeMode() {
  const [mode, setMode] = useState(loadMode);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, mode); } catch { /* private mode */ }
  }, [mode]);

  useEffect(() => {
    let mql;
    try { mql = window.matchMedia('(prefers-color-scheme: dark)'); } catch { return undefined; }
    const onChange = (e) => setSystemDark(e.matches);
    mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange);
    return () => {
      mql.removeEventListener ? mql.removeEventListener('change', onChange) : mql.removeListener(onChange);
    };
  }, []);

  const setThemeMode = useCallback((next) => {
    if (MODES.has(next)) setMode(next);
  }, []);

  const resolvedTheme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  return { theme: mode, resolvedTheme, setThemeMode };
}
