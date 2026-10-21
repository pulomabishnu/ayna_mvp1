// Small, global interaction details for the website and the app
// (docs/anti-vibe-checklist.md, "Delight details"). Installed once from main.jsx.
//
// 1. Dialogs grow from what was tapped. FLIP (aerotwist.com/blog/flip-your-animations):
//    First = the tapped control's box, Last = the dialog's box, Invert = a
//    transform that puts the dialog over the control, Play = animate to none.
//    Only transform and opacity move. Phone bottom sheets keep their native
//    slide up from the bottom edge. Reduced motion gets a short fade.
// 2. One shared skeleton timing: every loading shimmer/pulse is pinned to the
//    document timeline's zero, so all skeletons on a screen breathe together
//    instead of rippling out of step as each one mounts.
// 3. Autofocus rules: a dialog's [data-autofocus] field is focused on devices
//    with a fine pointer, and on phones only when a text action opened it
//    (no surprise keyboard).

const SHIMMERS = new Set(['shimmer', 'ay-shimmer', 'ay-skeleton', 'ay-skel', 'eco-pulse', 'ay-wh-pulse', 'cm-pulse', 'amn-pulse', 'ay-pixelate', 'skeletonPulse', 'skeleton-pulse']);

let lastTap = null;
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia?.('(pointer: fine)').matches;

function onPointerDown(e) {
  const el = e.target?.closest?.('button, a, [role="button"], [role="tab"], summary, input, label');
  if (!el) return;
  const r = el.getBoundingClientRect();
  const textAction = el.matches('input, textarea, [data-text-action]') || /\b(search|ask|write|reply|post|comment|message|note|review)\b/i.test(el.getAttribute('aria-label') || el.textContent || '');
  lastTap = { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, at: performance.now(), textAction };
}

function panelOf(node) {
  if (!(node instanceof HTMLElement)) return null;
  if (node.matches('[role="dialog"], [role="alertdialog"]')) return node;
  return node.querySelector?.('[role="dialog"], [role="alertdialog"]') || null;
}

function growFrom(panel) {
  if (panel.dataset.ayGrown || panel.closest('[data-no-grow]')) return;
  panel.dataset.ayGrown = '1';
  const tap = lastTap && performance.now() - lastTap.at < 1200 ? lastTap : null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let r = panel.getBoundingClientRect();
  // role="dialog" on a full-screen backdrop: animate the card inside it.
  if (r.width >= vw * 0.98 && r.height >= vh * 0.98 && panel.firstElementChild) {
    panel = panel.firstElementChild;
    r = panel.getBoundingClientRect();
  }
  if (!r.width || !r.height) return;
  // A phone bottom sheet (full width, on the bottom edge) slides up natively.
  const bottomSheet = r.width >= vw * 0.9 && Math.abs(r.bottom - vh) < 4;
  if (bottomSheet) return;
  if (reduced()) {
    panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'linear' });
    return;
  }
  if (!tap) return;
  const dx = tap.x - (r.left + r.width / 2);
  const dy = tap.y - (r.top + r.height / 2);
  const s = Math.max(0.2, Math.min(0.9, Math.max(tap.w / r.width, tap.h / r.height)));
  panel.animate(
    [{ transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0 }, { transform: 'none', opacity: 1 }],
    { duration: 360, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  );
}

function focusMain(panel) {
  const field = panel.querySelector('[data-autofocus]');
  if (!field) return;
  const tap = lastTap && performance.now() - lastTap.at < 1200 ? lastTap : null;
  if (finePointer() || tap?.textAction) requestAnimationFrame(() => field.focus({ preventScroll: true }));
}

function onAnimationStart(e) {
  if (!SHIMMERS.has(e.animationName)) return;
  const anim = e.target.getAnimations?.().find((a) => a.animationName === e.animationName);
  if (anim && anim.startTime !== 0) { try { anim.startTime = 0; } catch { /* not seekable */ } }
}

export function installDelight() {
  if (typeof window === 'undefined' || window.__ayDelight) return;
  window.__ayDelight = true;
  document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
  document.addEventListener('animationstart', onAnimationStart, true);
  const mo = new MutationObserver((records) => {
    for (const rec of records) {
      for (const node of rec.addedNodes) {
        const panel = panelOf(node);
        if (!panel || panel.getAttribute('aria-modal') === 'false') continue;
        growFrom(panel);
        focusMain(panel);
      }
    }
  });
  const start = () => mo.observe(document.body, { childList: true, subtree: true });
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start, { once: true });
}
