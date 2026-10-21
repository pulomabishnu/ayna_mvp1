import { useCallback } from 'react';

// Tasteful scroll reveal for supporting visuals only (photos, stickers,
// section art), never for text, prices, evidence or safety copy.
// Anti-vibe guide, section 4: fires at about 90% of the viewport, 400ms
// opacity + 12px rise, once per session, and never hides anything that is
// already on screen when the page loads. Off under reduced motion and the
// footer's Pause motion (src/styles/motion.css).
const SEEN_KEY = 'ayna_reveal_seen_v1';
function seen() {
  try { return new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); }
}
function markSeen(id) {
  try { const s = seen(); s.add(id); sessionStorage.setItem(SEEN_KEY, JSON.stringify([...s])); } catch { /* storage blocked */ }
}

export function useReveal(id, { minWidth = 0, delay = 0 } = {}) {
  return useCallback((el) => {
    if (!el || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    if (minWidth && window.innerWidth < minWidth) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (document.documentElement.classList.contains('ay-motion-paused')) return;
    if (seen().has(id)) return;
    // Already visible on load: leave it alone.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    el.classList.add('ay-reveal');
    if (delay) el.style.transitionDelay = `${delay}ms`;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      el.classList.add('is-in');
      markSeen(id);
      io.disconnect();
    }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
  }, [id, minWidth, delay]);
}
