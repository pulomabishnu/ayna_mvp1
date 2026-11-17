// Nov 16 (founder: "Pinned should be empty if you didn't pin anything, and you can choose to hide Pinned").
import { useEffect, useState } from 'react';

const KEY = 'ayna_pinned_hidden_v1';
const EVENT = 'ayna:pinned-pref';

export function pinnedHidden() { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } }
export function setPinnedHidden(on) {
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* storage off */ }
  try { window.dispatchEvent(new Event(EVENT)); } catch { /* no window */ }
}
export function usePinnedHidden() {
  const [hidden, setHidden] = useState(pinnedHidden);
  useEffect(() => {
    const on = () => setHidden(pinnedHidden());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return hidden;
}
