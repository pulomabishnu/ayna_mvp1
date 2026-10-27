import { useEffect, useState } from 'react';

/* ayna motion (website and app): the one shared utility.
 *
 * Tokens live in src/styles/motion.css (--ay-ease, --ay-dur-*). Rules:
 *   - only transform and opacity move; layout never animates;
 *   - everything happens once (no loops, except the partner marquee);
 *   - large type never moves;
 *   - nothing moves under prefers-reduced-motion or the site's Pause motion
 *     (html.ay-motion-paused).
 *
 * installMotion() (main.jsx) runs one IntersectionObserver for the whole
 * page: cards and sections that start below the fold rise in (10px, 360ms)
 * the first time they scroll into view. Anything already on screen is never
 * hidden, so nothing flickers on load, and nothing can stay hidden: if the
 * observer is missing the element is simply shown.
 */

export function motionOff() {
  try {
    return document.documentElement.classList.contains('ay-motion-paused')
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch { return true; }
}

// What rises in. [data-rise] opts anything in; the rest are the shared card
// and section shapes on the website and in the app.
export const RISE_SELECTOR = [
  '[data-rise]',
  'main[data-view] section',
  '.ayna-mobile section',
  '.ay-pcard',
  '.ayk-snap__item',
  '.hm-band',
].join(',');
// Never: chrome, sheets, dialogs, menus, sticky bars, or anything inside a thing that already rises.
const RISE_SKIP = 'nav, header, footer, dialog, [role="dialog"], [role="menu"], [aria-modal="true"], .ayna-bottom-nav, [data-no-rise]';

let installed = false;

export function installMotion() {
  if (installed || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
  installed = true;
  const root = document.documentElement;
  const sync = () => root.classList.toggle('ay-motion', !motionOff());
  sync();
  try { window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', sync); } catch { /* old Safari */ }
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });

  const show = (el) => {
    el.setAttribute('data-rise-state', 'in');
    // After the rise, drop the state so no transform is left behind.
    window.setTimeout(() => { if (el.getAttribute('data-rise-state') === 'in') el.setAttribute('data-rise-state', 'done'); }, 700);
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      show(e.target);
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });

  let frame = 0;
  const scan = () => {
    frame = 0;
    const off = motionOff();
    const vh = window.innerHeight || 800;
    document.querySelectorAll(RISE_SELECTOR).forEach((el) => {
      if (el.hasAttribute('data-rise-state')) return;
      if (el.closest(RISE_SKIP)) { el.setAttribute('data-rise-state', 'done'); return; }
      // Inside something that already rises: it comes along with its parent.
      if (el.parentElement?.closest('[data-rise-state="wait"], [data-rise-state="in"]')) { el.setAttribute('data-rise-state', 'done'); return; }
      const r = el.getBoundingClientRect();
      // On screen (or not laid out, e.g. a hidden view) when first seen: never hidden.
      if (off || !r.height || r.top < vh * 0.94) { el.setAttribute('data-rise-state', 'done'); return; }
      el.setAttribute('data-rise-state', 'wait');
      io.observe(el);
    });
  };
  const schedule = () => { if (!frame) frame = window.requestAnimationFrame(scan); };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  schedule();
}

/** True once the element has been on screen (stays true). Under reduced motion it is true at once. */
export function useInViewOnce(ref, { margin = '0px 0px -10% 0px' } = {}) {
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined' || motionOff());
  useEffect(() => {
    const el = ref.current;
    if (seen || !el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seen, margin]);
  return seen;
}

/**
 * A number that counts up once, the first time `run` is true (900ms, ease-out).
 * The final value straight away under reduced motion. The caller keeps the
 * real value in the accessible text; this is only what is painted.
 */
export function useCountUp(target, run = true, duration = 900) {
  const [v, setV] = useState(0);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (!run || finished || motionOff() || !Number.isFinite(target)) return undefined;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setV(target * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setFinished(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, finished, target, duration]);
  if (finished || !Number.isFinite(target) || motionOff()) return target;
  return run ? v : 0;
}
