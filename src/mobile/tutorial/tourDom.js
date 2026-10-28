/** DOM side of the tips overlay: what's on screen, what a tip may anchor to, where the bubble goes. */
import { SCREENS, AVOID } from './tips.js';
// Each takes the surface's own lists (tips.js screensFor / avoidFor); the defaults are the app's.

const GAP = 12;
export const EDGE = 16;

export const inLayer = (el) => Boolean(el?.closest?.('.ay-tour'));
export function topDialog() {
  const all = [...document.querySelectorAll('[aria-modal="true"]')].filter((el) => !inLayer(el) && el.getAttribute('aria-hidden') !== 'true');
  return all[all.length - 1] || null;
}
/**
 * Is any of this element actually on top (not under a pushed screen or a
 * sheet)? Hit-tests a few points inside its visible part. No layout engine
 * (tests): treat it as on top.
 */
export function onTop(el, vw = window.innerWidth, vh = window.innerHeight) {
  if (typeof document.elementFromPoint !== 'function') return true;
  const r = el.getBoundingClientRect();
  const left = Math.max(r.left, 0); const right = Math.min(r.right, vw);
  const top = Math.max(r.top, 0); const bottom = Math.min(r.bottom, vh);
  if (right - left < 2 || bottom - top < 2) return false;
  const xs = [left + (right - left) / 2, left + (right - left) * 0.2];
  const ys = [top + (bottom - top) / 2, top + Math.min(24, (bottom - top) / 2)];
  let tested = false;
  for (const x of xs) for (const y of ys) {
    const hit = document.elementFromPoint(x, y);
    if (!hit || inLayer(hit)) continue;
    tested = true;
    if (el === hit || el.contains(hit)) return true;
  }
  return !tested;
}
const hiddenUp = (el) => Boolean(el.closest('[hidden], [inert], [aria-hidden="true"]'));
const avoids = (el, list = AVOID) => list.some((sel) => { try { return el.matches(sel) || Boolean(el.closest(sel)); } catch { return false; } });

/** The element, if it's really on screen right now and allowed to carry a tip. */
export function usableAnchor(selector, { dialog = topDialog(), vh = window.innerHeight, vw = window.innerWidth, avoid = AVOID, topInset = 0, bottomInset = 0 } = {}) {
  let el = null;
  // The first match that is rendered (a selector list can name a phone and a desktop variant).
  try { el = [...document.querySelectorAll(selector)].find((n) => !inLayer(n) && !hiddenUp(n) && n.getClientRects().length > 0) || null; } catch { el = null; }
  if (!el || avoids(el, avoid)) return null;
  if (dialog && !dialog.contains(el)) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return null;
  // Fully clear of a fixed header and tab bar (the website's top nav, the app's has none).
  // An anchor that is itself in the top bar (the Saved heart, the profile photo) is fine there.
  const top = el.closest('.app-nav-wrap') ? 0 : topInset;
  if (r.top < top || r.bottom > vh - bottomInset - 4 || r.left < -2 || r.right > vw + 2) return null;
  return onTop(el, vw, vh) ? el : null;
}

/** The registered screen she's looking at (the topmost one when a sheet is open). Parts (`within`) never are. */
export function currentScreen(dialog, screens = SCREENS) {
  for (const s of screens) {
    if (s.within) continue;
    const roots = [...document.querySelectorAll(s.root)].filter((n) => !inLayer(n) && !hiddenUp(n));
    const root = roots.find((n) => (dialog ? dialog.contains(n) || n.contains(dialog) : true) && n.getClientRects().length > 0 && onTop(n));
    if (root) return s;
  }
  return null;
}

export function visibleAvoidRects(list = AVOID) {
  const out = [];
  for (const sel of list) {
    let nodes = [];
    try { nodes = document.querySelectorAll(sel); } catch { nodes = []; }
    nodes.forEach((n) => { if (inLayer(n) || hiddenUp(n)) return; const r = n.getBoundingClientRect(); if (r.width && r.height && r.bottom > 0 && r.top < window.innerHeight) out.push(r); });
  }
  return out;
}
export const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

/**
 * Where the bubble goes: below or above the anchor (phone), or beside it
 * first (`beside`, website desktop). Never over a safety item or an Ask
 * input, never under a fixed header (`topInset`) or tab bar (`bottomInset`).
 */
function stackAbove(anchor, avoid, { left, w, h }) {
  const over = (a) => a.right > left && a.left < left + w && a.bottom <= anchor.top + 1 && a.bottom > anchor.top - GAP - h;
  const blockers = avoid.filter(over);
  if (!blockers.length) return [];
  return [{ side: 'above', left, top: Math.min(...blockers.map((a) => a.top)) - GAP - h }];
}

export function placeBubble(anchor, size, { vw, vh, avoid = [], bottomInset = 0, topInset = 0, beside = false }) {
  const w = size.w;
  const h = size.h;
  const centered = Math.min(Math.max(EDGE, anchor.left + anchor.width / 2 - w / 2), Math.max(EDGE, vw - EDGE - w));
  const floor = vh - bottomInset - 8;
  const ceil = topInset + 8;
  const midTop = Math.min(Math.max(ceil, anchor.top + anchor.height / 2 - h / 2), Math.max(ceil, floor - h));
  const cands = [
    ...(beside ? [
      { side: 'right', left: anchor.right + GAP, top: midTop },
      { side: 'left', left: anchor.left - GAP - w, top: midTop },
    ] : []),
    { side: 'below', left: centered, top: anchor.bottom + GAP },
    { side: 'above', left: centered, top: anchor.top - GAP - h },
    // Something to keep clear sits right above the anchor (the landing's search over Slide to start):
    // go above that too, still pointing down at the anchor, before pinning to an edge.
    ...stackAbove(anchor, avoid, { left: centered, w, h }),
    { side: 'pin-bottom', left: centered, top: floor - h },
    { side: 'pin-top', left: centered, top: Math.max(EDGE + 40, ceil) },
  ];
  let best = null;
  for (const c of cands) {
    const box = { left: c.left, right: c.left + w, top: c.top, bottom: c.top + h };
    let score = 0;
    if (box.top < ceil || box.bottom > floor) score += 1e9;
    if (box.left < EDGE || box.right > vw - EDGE) score += 1e9;
    for (const a of avoid) score += overlap(box, a) * 1000;
    score += overlap(box, anchor) * 10;
    if (c.side.startsWith('pin')) score += 1;
    if (!best || score < best.score) best = { ...c, score };
  }
  const arrow = Math.min(Math.max(20, anchor.left + anchor.width / 2 - best.left), w - 20);
  const arrowY = Math.min(Math.max(20, anchor.top + anchor.height / 2 - best.top), h - 20);
  return { left: best.left, top: best.top, side: best.side, arrow, arrowY };
}

/** Is this part's root on the page she's on (shown, inside the open sheet if there is one)? */
export function partPresent(selector, dialog = null) {
  let nodes = [];
  try { nodes = [...document.querySelectorAll(selector)]; } catch { return false; }
  return nodes.some((n) => !inLayer(n) && !hiddenUp(n) && n.getClientRects().length > 0 && (!dialog || dialog.contains(n)));
}
