import { haptic } from './haptics.js';

// Tap feedback for the guide's motion moments (src/styles/motion.css).
// Each one runs only in answer to a tap, never on mount, so a product that
// was already saved doesn't "pop" when a list renders.

function replay(el, cls, ms) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth; // restart the animation
  el.classList.add(cls);
  window.setTimeout(() => el.classList.remove(cls), ms);
}

/** Save (heart) button: one 1 -> 1.18 -> 1 pop, only when saving, not un-saving.
 *  The haptic and the Saved-count bump come from savedHaptic(), called once by
 *  the screen that owns the save, so a tap never buzzes twice. */
export function saveFeedback(event, willSave) {
  if (!willSave) return;
  replay(event?.currentTarget, 'ay-heart-pop', 360);
}

/** A product was just saved: light impact + the Saved count bumps. */
export function savedHaptic() {
  haptic('light');
  bumpSavedCount();
}

/** The Saved count on the header/tab bumps once. */
export function bumpSavedCount() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('[data-saved-count]').forEach((el) => replay(el, 'ay-count-bump', 320));
}

/** Added to the Ecosystem: success haptic. */
export function addedHaptic() {
  haptic('success');
}

/** The product photo drops onto the tab that holds the Ecosystem (420ms arc). */
export function addFeedback(event, { imageSrc } = {}) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const from = event?.currentTarget?.getBoundingClientRect?.();
  const to = document.querySelector('[data-tab-target="home"]')?.getBoundingClientRect?.();
  if (!from || !to || !imageSrc || !document.body.animate) return;
  const thumb = document.createElement('span');
  thumb.className = 'ay-fly-thumb';
  thumb.setAttribute('aria-hidden', 'true');
  const img = document.createElement('img');
  img.src = imageSrc;
  img.alt = '';
  thumb.appendChild(img);
  const x0 = from.left + from.width / 2 - 22;
  const y0 = from.top + from.height / 2 - 22;
  const x1 = to.left + to.width / 2 - 22;
  const y1 = to.top + to.height / 2 - 22;
  thumb.style.left = `${x0}px`;
  thumb.style.top = `${y0}px`;
  document.body.appendChild(thumb);
  // A short arc: up a little, then down onto the tab.
  const anim = thumb.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { transform: `translate(${(x1 - x0) * 0.5}px, ${Math.min(0, y1 - y0) - 60}px) scale(.8)`, opacity: 1, offset: 0.45 },
    { transform: `translate(${x1 - x0}px, ${y1 - y0}px) scale(.35)`, opacity: 0.2 },
  ], { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  const done = () => thumb.remove();
  anim.onfinish = done;
  anim.oncancel = done;
}
