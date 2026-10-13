// Founder rule: no em dashes anywhere in ayna. Source copy and AI replies are
// already clean; this is the last safety net for text that arrives at runtime
// (community posts, catalog data from APIs). It rewrites visible text nodes
// and a few text attributes. Inputs and textareas are left alone so typing is
// never changed under someone's cursor.
const EM = '—';
const ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];

export function stripEmDash(text) {
  if (typeof text !== 'string' || !text.includes(EM)) return text;
  return text
    .replace(/[ \t]*—[ \t]*(?=[.,;:!?)\]]|$)/gm, '')
    .replace(/[ \t]*—[ \t]*/g, ', ');
}

function fixNode(node) {
  if (node.nodeType === 3) {
    const p = node.parentNode;
    if (!p || p.nodeName === 'TEXTAREA' || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || p.isContentEditable) return;
    if (node.nodeValue && node.nodeValue.includes(EM)) node.nodeValue = stripEmDash(node.nodeValue);
    return;
  }
  if (node.nodeType !== 1) return;
  for (const a of ATTRS) {
    const v = node.getAttribute?.(a);
    if (v && v.includes(EM)) node.setAttribute(a, stripEmDash(v));
  }
  if (node.nodeName === 'TEXTAREA' || node.nodeName === 'INPUT' || node.isContentEditable) return;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let t;
  while ((t = walker.nextNode())) fixNode(t);
}

export function installNoEmDash(root = typeof document !== 'undefined' ? document.body : null) {
  if (!root || typeof MutationObserver === 'undefined') return () => {};
  fixNode(root);
  if (document.title.includes(EM)) document.title = stripEmDash(document.title);
  const obs = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') fixNode(r.target);
      else if (r.type === 'attributes') fixNode(r.target);
      else r.addedNodes.forEach(fixNode);
    }
  });
  obs.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  return () => obs.disconnect();
}
