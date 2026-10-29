import { useCallback, useEffect, useState } from 'react';

// v2 holds only a choice she made. The old key was written on every launch
// ('light' by default), so from it only an explicit 'dark' is carried over.
const THEME_KEY = 'ayna_mobile_theme_pick_v2';
const OLD_KEY = 'ayna_mobile_theme_v1';
const MODES = new Set(['light', 'dark']);
const DARK_QUERY = '(prefers-color-scheme: dark)';

// Her own pick (Preferences), or null: then the app follows the phone's
// setting, the same as the website (review Oct 24, finding 20).
function loadPick() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (MODES.has(stored)) return stored;
    return localStorage.getItem(OLD_KEY) === 'dark' ? 'dark' : null;
  } catch {
    return null;
  }
}

function systemMode() {
  try { return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light'; } catch { return 'light'; }
}

export function useThemeMode() {
  const [pick, setPick] = useState(loadPick);
  const [system, setSystem] = useState(systemMode);

  useEffect(() => {
    let mq = null;
    try { mq = window.matchMedia?.(DARK_QUERY) || null; } catch { mq = null; }
    if (!mq?.addEventListener) return undefined;
    const onChange = () => setSystem(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Saved only once she chooses; until then the phone's setting leads.
  // 'system' clears her pick, so the phone's setting leads again (founder, Oct 29: the default is the device's).
  const setThemeMode = useCallback((next) => {
    if (next === 'system') {
      setPick(null);
      try { localStorage.removeItem(THEME_KEY); localStorage.removeItem(OLD_KEY); } catch { /* private mode */ }
      return;
    }
    if (!MODES.has(next)) return;
    setPick(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* private mode */ }
  }, []);

  const mode = pick || system;
  return { theme: mode, resolvedTheme: mode, setThemeMode, followsSystem: !pick, themeChoice: pick || 'system' };
}
