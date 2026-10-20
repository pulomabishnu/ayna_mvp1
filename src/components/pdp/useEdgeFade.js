import { useEffect } from 'react';

/**
 * Marks a sideways scroller's parent with data-more-start / data-more-end
 * while there is more to scroll that way, so CSS can show an edge fade.
 */
export function useEdgeFade(ref, deps = []) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const host = el.parentElement;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      host.toggleAttribute('data-more-start', el.scrollLeft > 2);
      host.toggleAttribute('data-more-end', max - el.scrollLeft > 2);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => { el.removeEventListener('scroll', update); ro?.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
