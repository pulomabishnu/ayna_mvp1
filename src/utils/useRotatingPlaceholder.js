import { useEffect, useState } from 'react';

// Search box placeholder that cycles through example searches, like the
// landing page's search ("Try: bad cramps", then "Try: night sweats", ...).
// Stops while she types or the box is focused, when motion is paused from the
// footer, and with reduced motion (then one example stays put).
const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const paused = () => { try { return document.documentElement.classList.contains('ay-motion-paused'); } catch { return false; } };

export default function useRotatingPlaceholder(phrases, { prefix = 'Try: ', fallback = '', enabled = true, intervalMs = 2600 } = {}) {
  const list = Array.isArray(phrases) ? phrases.filter(Boolean) : [];
  const [i, setI] = useState(() => (list.length ? Math.floor(Math.random() * list.length) : 0));
  useEffect(() => {
    if (!enabled || list.length < 2 || reduced()) return undefined;
    const t = window.setInterval(() => {
      if (paused() || document.hidden) return;
      const a = document.activeElement;
      if (a && a.tagName === 'INPUT' && a.type === 'search') return;
      setI((v) => (v + 1) % list.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [enabled, list.length, intervalMs]);
  if (!enabled || !list.length) return fallback;
  return `${prefix}${list[i % list.length]}`;
}
