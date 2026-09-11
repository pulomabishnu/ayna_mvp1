import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'ayna_mobile_theme_v1';
const MODES = new Set(['light', 'dark']);

function loadMode() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return MODES.has(stored) ? stored : 'light';
  } catch {
    return 'light';
  }
}

export function useThemeMode() {
  const [mode, setMode] = useState(loadMode);

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, mode); } catch { /* private mode */ }
  }, [mode]);

  const setThemeMode = useCallback((next) => {
    if (MODES.has(next)) setMode(next);
  }, []);

  return { theme: mode, resolvedTheme: mode, setThemeMode };
}
