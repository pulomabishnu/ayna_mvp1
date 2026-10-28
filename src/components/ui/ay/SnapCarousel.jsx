import { useCallback, useEffect, useRef, useState } from 'react';
import './snap-carousel.css';

/**
 * SnapCarousel: a sideways row that snaps card by card, the next card
 * peeking in from the edge, with one dot per card under it (founder Oct 26:
 * "different unique ways", Oura's top stories). Used for highlights and for
 * her products. The dots are real buttons ("Show 2 of 4") with 44px targets;
 * the current one is aria-current. Smooth scrolling only without reduced motion.
 *
 *   <SnapCarousel label="Highlights" size="card" items={[{ key, node }]} />
 *   size: 'card' (most of the width, the next peeks) or 'plate' (136px plates)
 */
const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

export default function SnapCarousel({ items = [], label, size = 'card', className = '' }) {
  const listRef = useRef(null);
  const [at, setAt] = useState(0);
  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const first = el.firstElementChild;
    if (!first) return;
    const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || '0');
    if (!step) return;
    // At the very end, the last card is the current one even if it never reaches the left edge.
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
    setAt(end ? items.length - 1 : Math.max(0, Math.min(items.length - 1, Math.round(el.scrollLeft / step))));
  }, [items.length]);
  // Dots only when the row actually scrolls (on a wide screen every card may fit).
  const [scrolls, setScrolls] = useState(true);
  useEffect(() => {
    const el = listRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setScrolls(el.scrollWidth > el.clientWidth + 2));
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);
  const go = (i) => {
    const li = listRef.current?.children[i];
    if (!li) return;
    listRef.current.scrollTo({ left: li.offsetLeft - listRef.current.firstElementChild.offsetLeft, behavior: reduced() ? 'auto' : 'smooth' });
    setAt(i);
  };
  if (!items.length) return null;
  return (
    <div className={`ayk-snap is-${size} ${className}`.trim()}>
      <ul ref={listRef} className="ayk-snap__list" aria-label={label} onScroll={onScroll}>
        {items.map((it) => <li key={it.key} className="ayk-snap__item">{it.node}</li>)}
      </ul>
      {items.length > 1 && scrolls && (
        <div className="ayk-snap__dots" role="group" aria-label={`${label}: choose one`}>
          {items.map((it, i) => (
            <button key={it.key} type="button" className={`ayk-snap__dot${i === at ? ' is-on' : ''}`} aria-label={`Show ${i + 1} of ${items.length}`} aria-current={i === at ? 'true' : undefined} onClick={() => go(i)}><i /></button>
          ))}
        </div>
      )}
    </div>
  );
}
