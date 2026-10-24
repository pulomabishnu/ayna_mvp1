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
// 3. Autofocus rules: when a search, compose or Ask sheet opens, its
//    [data-autofocus] field is focused only if a person just opened it: a click
//    or key on a device with a fine pointer, and on phones only a tap on a text
//    action ("Ask", "Write", "Reply", "Search"...). Never on page load, so no
//    surprise keyboard. mayAutoFocus() and autofocusTarget() share the rule
//    with sheets that manage their own focus.

const SHIMMERS = new Set(['shimmer', 'ay-shimmer', 'ay-skeleton', 'ay-skel', 'eco-pulse', 'ay-wh-pulse', 'cm-pulse', 'amn-pulse', 'ay-pixelate', 'skeletonPulse', 'skeleton-pulse']);

let lastTap = null;
let lastKeyAt = -Infinity;
const GESTURE_MS = 1200;
const TEXT_ACTION = /\b(search|ask|write|reply|answer|post|comment|message|note|review|edit|rename|other|add)\b/i;
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia?.('(pointer: fine)').matches;

function onPointerDown(e) {
  const el = e.target?.closest?.('button, a, [role="button"], [role="tab"], summary, input, label');
  if (!el) return;
  const r = el.getBoundingClientRect();
  const textAction = el.matches('input, textarea, [data-text-action]') || TEXT_ACTION.test(el.getAttribute('aria-label') || el.textContent || '');
  lastTap = { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, at: performance.now(), textAction, el };
}

function onKeyDown(e) {
  if (e.key === 'Enter' || e.key === ' ' || ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 'k')) lastKeyAt = performance.now();
}

const TEXT_FIELD = 'textarea, [contenteditable=""], [contenteditable="true"], input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="range"]):not([type="file"]):not([type="color"])';
export const isTextField = (el) => Boolean(el?.matches?.(TEXT_FIELD));

/**
 * May a text field take focus (and so open the phone keyboard) right now?
 * Only just after a person acted: with a mouse or keyboard any click or key
 * counts; on touch, only a tap, and with { textAction: true } (the default,
 * for sheets) only a tap on a text action. Never on page load.
 */
export function mayAutoFocus({ textAction = true } = {}) {
  if (typeof window === 'undefined') return false;
  const now = performance.now();
  const tap = lastTap && now - lastTap.at < GESTURE_MS ? lastTap : null;
  const key = now - lastKeyAt < GESTURE_MS;
  if (finePointer()) return Boolean(tap || key);
  return Boolean(tap && (!textAction || tap.textAction));
}

/**
 * Where focus goes when a sheet opens: its [data-autofocus] (else first
 * focusable) element, unless that is a text field the rule above says not to
 * focus; then the first control that is not a text field (so focus still
 * moves into the sheet for screen readers, without a keyboard), else null.
 */
export function autofocusTarget(node, focusable) {
  if (!node) return null;
  const wanted = node.querySelector('[data-autofocus]') || (focusable ? node.querySelector(focusable) : null);
  if (!wanted || !isTextField(wanted) || mayAutoFocus()) return wanted;
  return focusable ? [...node.querySelectorAll(focusable)].find((el) => !isTextField(el)) || null : null;
}

/** Ref for an in-flow field that should take focus when it appears after a tap (never on load). */
export function autoFocusAfterTap(el) {
  if (el && mayAutoFocus({ textAction: false })) requestAnimationFrame(() => { if (el.isConnected) el.focus({ preventScroll: true }); });
}

/** The control tapped in the last `ms` (for utils/viewTransition.js), or null. */
export function recentTap(ms = 800) {
  return lastTap && performance.now() - lastTap.at < ms && lastTap.el?.isConnected ? lastTap : null;
}

function panelOf(node) {
  if (!(node instanceof HTMLElement)) return null;
  if (node.matches('[role="dialog"], [role="alertdialog"]')) return node;
  return node.querySelector?.('[role="dialog"], [role="alertdialog"]') || null;
}

function growFrom(panel) {
  if (panel.dataset.ayGrown || panel.closest('[data-no-grow]')) return;
  // A view transition (utils/viewTransition.js) is already growing it.
  if (document.documentElement.hasAttribute('data-ay-vt')) return;
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
  // Sheets keep their own slide: a phone bottom sheet (full width, on the
  // bottom edge) or a full-height side panel. Only card-like dialogs grow.
  const bottomSheet = r.width >= vw * 0.9 && Math.abs(r.bottom - vh) < 4;
  const sidePanel = r.height >= vh * 0.9 && (r.left <= 4 || Math.abs(r.right - vw) < 4);
  if (bottomSheet || sidePanel) return;
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
  if (!field || (isTextField(field) && !mayAutoFocus())) return;
  requestAnimationFrame(() => { if (field.isConnected) field.focus({ preventScroll: true }); });
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
  document.addEventListener('keydown', onKeyDown, true);
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
