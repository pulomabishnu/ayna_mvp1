/** DOM side of the tips overlay: what's on screen, what a tip may anchor to, where the bubble goes. */
import { SCREENS, AVOID } from './tips.js';

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
const avoids = (el) => AVOID.some((sel) => { try { return el.matches(sel) || Boolean(el.closest(sel)); } catch { return false; } });

/** The element, if it's really on screen right now and allowed to carry a tip. */
export function usableAnchor(selector, { dialog = topDialog(), vh = window.innerHeight, vw = window.innerWidth } = {}) {
  let el = null;
  try { el = [...document.querySelectorAll(selector)].find((n) => !inLayer(n) && !hiddenUp(n)) || null; } catch { el = null; }
  if (!el || avoids(el)) return null;
  if (dialog && !dialog.contains(el)) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return null;
  if (r.top < 0 || r.bottom > vh - 4 || r.left < -2 || r.right > vw + 2) return null;
  return onTop(el, vw, vh) ? el : null;
}

/** The registered screen she's looking at (the topmost one when a sheet is open). */
export function currentScreen(dialog) {
  for (const s of SCREENS) {
    const roots = [...document.querySelectorAll(s.root)].filter((n) => !inLayer(n) && !hiddenUp(n));
    const root = roots.find((n) => (dialog ? dialog.contains(n) || n.contains(dialog) : true) && n.getClientRects().length > 0 && onTop(n));
    if (root) return s;
  }
  return null;
}

export function visibleAvoidRects() {
  const out = [];
  for (const sel of AVOID) {
    let nodes = [];
    try { nodes = document.querySelectorAll(sel); } catch { nodes = []; }
    nodes.forEach((n) => { if (inLayer(n) || hiddenUp(n)) return; const r = n.getBoundingClientRect(); if (r.width && r.height && r.bottom > 0 && r.top < window.innerHeight) out.push(r); });
  }
  return out;
}
export const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

/** Where the bubble goes: below or above the anchor, never over a safety item or an Ask input. */
export function placeBubble(anchor, size, { vw, vh, avoid = [], bottomInset = 0 }) {
  const w = size.w;
  const h = size.h;
  const left = Math.min(Math.max(EDGE, anchor.left + anchor.width / 2 - w / 2), Math.max(EDGE, vw - EDGE - w));
  const floor = vh - bottomInset - 8;
  const cands = [
    { side: 'below', top: anchor.bottom + GAP },
    { side: 'above', top: anchor.top - GAP - h },
    { side: 'pin-bottom', top: floor - h },
    { side: 'pin-top', top: EDGE + 40 },
  ];
  let best = null;
  for (const c of cands) {
    const box = { left, right: left + w, top: c.top, bottom: c.top + h };
    let score = 0;
    if (box.top < 8 || box.bottom > floor) score += 1e9;
    for (const a of avoid) score += overlap(box, a) * 1000;
    score += overlap(box, anchor) * 10;
    if (c.side.startsWith('pin')) score += 1;
    if (!best || score < best.score) best = { ...c, left, score };
  }
  const arrow = Math.min(Math.max(20, anchor.left + anchor.width / 2 - best.left), w - 20);
  return { left: best.left, top: best.top, side: best.side, arrow };
}

