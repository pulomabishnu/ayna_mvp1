import { flushSync } from 'react-dom';
import { recentTap } from './delightRuntime.js';

// Expanding cards grow from what was tapped (docs/anti-vibe-checklist.md,
// "Delight details"). Where the browser has View Transitions
// (developer.chrome.com/docs/web-platform/view-transitions), the tapped card
// (or its photo) and the opened page's matching element share one
// view-transition-name, so the browser morphs one into the other while the
// rest cross-fades. Without support, with reduced motion, or when nothing was
// tapped (a deep link, a script), the update just runs and the screen keeps
// its current fade. Layouts are untouched: only a name is set for the length
// of the transition.
//
//   growTransition(() => setPage(...), { target: 'post' })
//   // the opened page marks its element with data-vt-target="post"

const NAME = 'ay-grow';
let running = false;

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function canGrow() {
  return typeof document !== 'undefined' && typeof document.startViewTransition === 'function' && !reducedMotion() && !running;
}

/** The element the morph starts from: the tapped card, or its photo with { from: 'img' }. */
export function sourceFor(tapped, from) {
  if (!tapped) return null;
  const explicit = tapped.closest('[data-vt-source]');
  if (explicit) return (from && explicit.querySelector(from)) || explicit;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Walk up a few levels to the card: the first ancestor that holds the
  // wanted part (a photo) or is an article / list item, but never a whole
  // section of the page.
  let node = tapped;
  for (let i = 0; node && node !== document.body && i < 7; i += 1, node = node.parentElement) {
    const r = node.getBoundingClientRect();
    if (r.width * r.height > vw * vh * 0.6) break;
    if (from) {
      const part = node.matches(from) ? node : node.querySelector(from);
      if (part) return part;
    } else if (node.matches('article, li, [role="article"]')) return node;
  }
  return from ? null : tapped;
}

function visibleTarget(target) {
  const all = [...document.querySelectorAll(`[data-vt-target="${target}"]`)];
  for (let i = all.length - 1; i >= 0; i -= 1) if (all[i].getClientRects().length) return all[i];
  return null;
}

/**
 * Runs `update` (a React state change) inside a view transition that grows
 * the tapped card into the element marked data-vt-target={target}.
 */
export function growTransition(update, { target, from } = {}) {
  const tap = recentTap();
  const source = canGrow() && tap ? sourceFor(tap.el, from) : null;
  if (!source) { update(); return; }
  const root = document.documentElement;
  let dest = null;
  source.style.viewTransitionName = NAME;
  root.setAttribute('data-ay-vt', '');
  running = true;
  const done = () => {
    running = false;
    root.removeAttribute('data-ay-vt');
    source.style.viewTransitionName = '';
    if (dest) dest.style.viewTransitionName = '';
  };
  try {
    const vt = document.startViewTransition(() => {
      source.style.viewTransitionName = '';
      flushSync(update);
      dest = target ? visibleTarget(target) : null;
      if (dest) dest.style.viewTransitionName = NAME;
    });
    vt.finished.then(done, done);
  } catch {
    done();
    update();
  }
}
