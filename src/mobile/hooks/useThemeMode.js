import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'ayna_mobile_theme_v1';
const MODES = new Set(['system', 'light', 'dark']);

function loadMode() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return MODES.has(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function deviceTheme() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useThemeMode() {
  const [mode, setMode] = useState(loadMode);
  const [systemTheme, setSystemTheme] = useState(deviceTheme);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return undefined;
    const update = () => setSystemTheme(query.matches ? 'dark' : 'light');
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, mode); } catch { /* private mode */ }
  }, [mode]);

  const setThemeMode = useCallback((next) => {
    if (MODES.has(next)) setMode(next);
  }, []);

  return { theme: mode, resolvedTheme: mode === 'system' ? systemTheme : mode, setThemeMode };
}
