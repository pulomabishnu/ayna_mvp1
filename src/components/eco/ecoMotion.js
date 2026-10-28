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
   only hides anything while an observer is running, so content can never
   get stuck invisible:
   - every run (StrictMode's double mount, a new selector or root) observes
     again whatever is still waiting at '0', not only new elements;
   - cleanup takes the root's data-eco-anim off, which is what the hiding CSS
     keys on, so anything still waiting shows at once if no run follows;
   - a block already on screen (or if the observer never answers) is shown
     after a short grace period. `selector` picks the blocks to reveal. */
export function useRevealOnce(rootRef, selector) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined' || motionOff()) return undefined;
    const show = (el) => el.setAttribute('data-eco-in', '1');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        show(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    const watched = new WeakSet();
    const scan = () => {
      root.querySelectorAll(selector).forEach((el) => {
        if (watched.has(el)) return;
        const state = el.getAttribute('data-eco-in');
        if (state === '1') return;
        if (state !== '0') el.setAttribute('data-eco-in', '0');
        watched.add(el);
        io.observe(el);
      });
    };
    root.setAttribute('data-eco-anim', '1');
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    // Safety net: anything in view that the observer has not answered for shows anyway.
    const grace = setTimeout(() => {
      const view = root.getBoundingClientRect();
      root.querySelectorAll('[data-eco-in="0"]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < Math.min(view.bottom, window.innerHeight) && r.bottom > Math.max(view.top, 0)) show(el);
      });
    }, 1200);
    return () => {
      clearTimeout(grace);
      io.disconnect();
      mo.disconnect();
      root.removeAttribute('data-eco-anim');
    };
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
    // Watch every tab too, not only the row: a tab added or relabelled after the first
    // measure (the Ask sheet's Rundown and Guide tabs arrive late) changes the columns
    // without changing the row's size, and the pill kept its old width (founder, Oct 27).
    let ro;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(read); ro.observe(list); [...list.children].forEach((c) => ro.observe(c)); }
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
