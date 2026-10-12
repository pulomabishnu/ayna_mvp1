/**
 * Callback ref for horizontally scrolling chip rows (HI06, M22).
 * Sets data-fade-start / data-fade-end to '1' only on the side where content
 * is actually clipped, so CSS can fade that edge and leave the other crisp.
 * Usage: <div ref={edgeFadeRef} ...>
 */
const attached = new Map();

function update(el) {
  const max = el.scrollWidth - el.clientWidth;
  const start = el.scrollLeft > 2 ? '1' : '0';
  const end = max - el.scrollLeft > 2 ? '1' : '0';
  if (el.dataset.fadeStart !== start) el.dataset.fadeStart = start;
  if (el.dataset.fadeEnd !== end) el.dataset.fadeEnd = end;
}

function attach(el) {
  const onScroll = () => update(el);
  el.addEventListener('scroll', onScroll, { passive: true });
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onScroll) : null;
  ro?.observe(el);
  const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(onScroll) : null;
  mo?.observe(el, { childList: true, subtree: true, characterData: true });
  update(el);
  attached.set(el, () => { el.removeEventListener('scroll', onScroll); ro?.disconnect(); mo?.disconnect(); });
}

export function edgeFadeRef(el) {
  if (el) {
    if (!attached.has(el)) attach(el);
    return;
  }
  // React passes null on unmount: release rows that left the page.
  for (const [node, cleanup] of attached) {
    if (!node.isConnected) { cleanup(); attached.delete(node); }
  }
}

export default edgeFadeRef;
