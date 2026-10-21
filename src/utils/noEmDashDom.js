// Founder rule: no em dashes anywhere in ayna. Source copy and AI replies are
// already clean; this is the last safety net for text that arrives at runtime
// (community posts, catalog data from APIs). It rewrites visible text nodes
// and a few text attributes. Inputs and textareas are left alone so typing is
// never changed under someone's cursor.
import { renamePcos } from './conditionRename.js';

const EM = '\u2014';
const ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
// PCOS is now PMOS (Ameera, Oct 20): the same net renames it in every visible
// text node and attribute. Published titles stay verbatim: link text to another
// site (a paper's title in a source list) and anything inside [data-keep-name].
const NEEDS_FIX = /\u2014|pcos|polycystic ovar/i;
const KEEP_SELECTOR = '[data-keep-name]';

// A link to another site shows that page's or paper's own title ("Inositol
// for PCOS: systematic review…"), which must stay as published.
function keepsOwnName(el) {
  if (!el?.closest) return false;
  if (el.closest(KEEP_SELECTOR)) return true;
  const a = el.closest('a[href]');
  if (!a) return false;
  try {
    const u = new URL(a.getAttribute('href'), window.location.href);
    return /^https?:$/.test(u.protocol) && !/(^|\.)aynahealth\.co$/i.test(u.hostname) && u.hostname !== window.location.hostname;
  } catch {
    return false;
  }
}

function fixText(text, el) {
  if (typeof text !== 'string' || !NEEDS_FIX.test(text)) return text;
  const noDash = stripEmDash(text);
  if (keepsOwnName(el)) return noDash;
  return renamePcos(noDash);
}

export function stripEmDash(text) {
  if (typeof text !== 'string' || !text.includes(EM)) return text;
  return text
    .replace(/[ \t]*\u2014[ \t]*(?=[.,;:!?)\]]|$)/gm, '')
    .replace(/[ \t]*\u2014[ \t]*/g, ', ');
}

function fixAttrs(el) {
  for (const a of ATTRS) {
    const v = el.getAttribute?.(a);
    if (v && NEEDS_FIX.test(v)) {
      const next = fixText(v, el);
      if (next !== v) el.setAttribute(a, next);
    }
  }
}

function fixNode(node) {
  if (node.nodeType === 3) {
    const p = node.parentNode;
    if (!p || p.nodeName === 'TEXTAREA' || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || p.isContentEditable) return;
    if (node.nodeValue && NEEDS_FIX.test(node.nodeValue)) {
      const next = fixText(node.nodeValue, p);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
    return;
  }
  if (node.nodeType !== 1) return;
  fixAttrs(node);
  if (node.nodeName === 'TEXTAREA' || node.nodeName === 'INPUT' || node.isContentEditable) return;
  // Text and the alt/title/aria-label/placeholder of every element inside
  // (a whole screen can arrive as one added node).
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let t;
  while ((t = walker.nextNode())) {
    if (t.nodeType === 1) fixAttrs(t);
    else fixNode(t);
  }
}

// <title> and the share/search descriptions in <head> are outside document.body.
function fixHead() {
  if (typeof document === 'undefined') return;
  const t = fixText(document.title);
  if (t !== document.title) document.title = t;
  document.querySelectorAll('meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]').forEach((m) => {
    const c = m.getAttribute('content');
    if (c && NEEDS_FIX.test(c) && !/^https?:/i.test(c)) {
      const next = fixText(c);
      if (next !== c) m.setAttribute('content', next);
    }
  });
}

export function installNoEmDash(root = typeof document !== 'undefined' ? document.body : null) {
  if (!root || typeof MutationObserver === 'undefined') return () => {};
  fixNode(root);
  fixHead();
  const obs = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') fixNode(r.target);
      else if (r.type === 'attributes') fixNode(r.target);
      else r.addedNodes.forEach(fixNode);
    }
  });
  obs.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  // Route changes set document.title and meta tags from code.
  const headObs = new MutationObserver(() => fixHead());
  if (document.head) headObs.observe(document.head, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['content'] });
  return () => { obs.disconnect(); headObs.disconnect(); };
}
