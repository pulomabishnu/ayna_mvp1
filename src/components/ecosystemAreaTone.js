// Shared by MyEcosystem + WebEcosystemChart: area colours from the site
// tokens (light + dark) and the app's eased glide to an area section.
export const AREA_TONES = ['var(--legacy-pink)', 'var(--ay-mint)', 'var(--ay-peri)', 'var(--legacy-butter)'];
export const areaTone = (index) => AREA_TONES[index % AREA_TONES.length];

function scrollParent(el) {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
  }
  return document.scrollingElement || document.documentElement;
}

// Eased scroll to an area section, then a short arrival pulse so the eye
// lands on it (same behaviour as the app's glideTo).
export function glideTo(event, id) {
  const target = typeof document !== 'undefined' ? document.getElementById(id) : null;
  if (!target) return;
  event?.preventDefault?.();
  const scroller = scrollParent(target);
  const isRoot = scroller === document.scrollingElement || scroller === document.documentElement;
  const start = scroller.scrollTop;
  const top = target.getBoundingClientRect().top - (isRoot ? 0 : scroller.getBoundingClientRect().top);
  const end = Math.max(0, start + top - 96);
  // The site sets scroll-behavior: smooth on <html>; each frame's scrollTop
  // write would start its own smooth scroll and the glide would stall.
  const prevBehavior = scroller.style.scrollBehavior;
  scroller.style.scrollBehavior = 'auto';
  const finish = () => {
    scroller.style.scrollBehavior = prevBehavior;
    target.classList.remove('is-arrived');
    void target.offsetWidth;
    target.classList.add('is-arrived');
    window.setTimeout(() => target.classList.remove('is-arrived'), 1200);
  };
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { scroller.scrollTop = end; finish(); return; }
  const duration = Math.min(1100, 520 + Math.abs(end - start) * 0.35);
  const t0 = performance.now();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    scroller.scrollTop = start + (end - start) * ease(t);
    if (t < 1) requestAnimationFrame(step); else finish();
  };
  requestAnimationFrame(step);
}

