import { useEffect, useLayoutEffect, useState } from 'react';

/* Motion helpers for the Ecosystem (website and app). One rule everywhere:
   nothing moves when the system asks for reduced motion or when she has
   pressed the site's "Pause motion" (footer), which sets
   html.ay-motion-paused. */
export function motionOff() {
  try {
    return document.documentElement.classList.contains('ay-motion-paused')
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch { return true; }
}

/* Shelves fade and rise in once, card by card, the first time each one
   scrolls into view. Uses a data attribute (React never rewrites it), and
   only hides anything once the observer is running, so content can never
   get stuck invisible. `selector` picks the blocks to reveal. */
export function useRevealOnce(rootRef, selector) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined' || motionOff()) return undefined;
    const seen = new WeakSet();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.setAttribute('data-eco-in', '1');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    const scan = () => {
      root.querySelectorAll(selector).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        // Already on screen at load: show at once with the stagger, no waiting.
        if (!el.hasAttribute('data-eco-in')) { el.setAttribute('data-eco-in', '0'); io.observe(el); }
      });
    };
    root.setAttribute('data-eco-anim', '1');
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [rootRef, selector]);
}

/* The underline under the chosen tab slides to the next one instead of
   jumping. Returns a style for an absolutely placed ink element inside the
   list (the list needs position: relative). */
export function useSlidingInk(listRef, activeKey) {
  const [ink, setInk] = useState(null);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const read = () => {
      const on = list.querySelector('[data-ink-on="true"]');
      if (!on) { setInk(null); return; }
      setInk({ x: on.offsetLeft, w: on.offsetWidth });
    };
    read();
    window.addEventListener('resize', read);
    let ro;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(read); ro.observe(list); }
    document.fonts?.ready?.then(read).catch(() => {});
    return () => { window.removeEventListener('resize', read); ro?.disconnect(); };
  }, [listRef, activeKey]);
  return ink ? { transform: `translateX(${ink.x}px)`, width: `${ink.w}px`, opacity: 1 } : { opacity: 0 };
}

/* A small list of things she has closed, kept in this browser. */
export function useDismissed(storageKey) {
  const [set, setSet] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')); } catch { return new Set(); }
  });
  const dismiss = (id) => setSet((prev) => {
    const next = new Set(prev); next.add(id);
    try { localStorage.setItem(storageKey, JSON.stringify([...next].slice(-40))); } catch { /* private mode: this visit only */ }
    return next;
  });
  return [set, dismiss];
}
