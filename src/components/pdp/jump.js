/**
 * In-page jump for the product page's chips and [n] footnotes. Scrolls the
 * nearest scroller (window on the website, the screen's own scroller in the
 * app), focuses the target for keyboard and screen-reader users, and flashes
 * it briefly. No URL hash change, so the app's router is never involved.
 */
export function jumpTo(id) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  try { el.focus({ preventScroll: true }); } catch { /* old browsers */ }
  el.classList.remove('is-flash');
  // Restart the flash animation.
  void el.offsetWidth;
  el.classList.add('is-flash');
  window.setTimeout(() => el.classList.remove('is-flash'), 1400);
}
