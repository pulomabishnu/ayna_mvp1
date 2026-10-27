import React, { useEffect, useRef, useState } from 'react';

/**
 * One row that scrolls sideways, with ← → buttons only when it overflows
 * (the production Shop's need chips, founder Oct 27). The buttons scroll the
 * first scrollable child; keyboard and touch scrolling still work as before.
 */
export default function ScrollRow({ label = 'items', children, className = '' }) {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ over: false, start: true, end: true });
  const scroller = () => {
    const root = ref.current;
    if (!root) return null;
    return [root, ...root.querySelectorAll('*')].find((el) => el.scrollWidth > el.clientWidth + 1 && /(auto|scroll)/.test(getComputedStyle(el).overflowX)) || null;
  };
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof ResizeObserver === 'undefined') return undefined;
    let el = null;
    const update = () => {
      el = scroller();
      setEdges(el ? { over: true, start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 } : { over: false, start: true, end: true });
    };
    const ro = new ResizeObserver(update);
    ro.observe(root);
    update();
    root.addEventListener('scroll', update, true);
    return () => { ro.disconnect(); root.removeEventListener('scroll', update, true); };
  }, []);
  const go = (dir) => scroller()?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  return (
    <div className={`ay-scrollrow${edges.over ? ' is-over' : ''} ${className}`.trim()}>
      {edges.over && <button type="button" className="ay-scrollrow__arrow is-back" aria-label={`Scroll ${label} back`} disabled={edges.start} onClick={() => go(-1)}><span aria-hidden="true">←</span></button>}
      <div className="ay-scrollrow__track" ref={ref}>{children}</div>
      {edges.over && <button type="button" className="ay-scrollrow__arrow is-next" aria-label={`Scroll ${label} forward`} disabled={edges.end} onClick={() => go(1)}><span aria-hidden="true">→</span></button>}
    </div>
  );
}
