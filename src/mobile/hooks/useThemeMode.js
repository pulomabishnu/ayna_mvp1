import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'ayna_mobile_theme_v1';

function loadTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function useThemeMode() {
  const [theme, setTheme] = useState(loadTheme);

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* private mode */ }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme, setTheme };
}
