import { useEffect } from 'react';
import { trackCardViewed, eventSurface } from '../../utils/analyticsEvents.js';

/**
 * Card CTR, the "viewed" half (all-pages brief v3, "Track: card CTR"):
 * each product card in `ref`'s container that is at least half on screen
 * sends product_card_viewed once per page load (analyticsEvents dedupes).
 * Cards carry data-pid; the position is the card's index in the container.
 * Ids, the surface and the block only; never anything about her health.
 */
export default function useCardViews(ref, where, deps = []) {
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === 'undefined' || !where) return undefined;
    const surface = eventSurface();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        const all = [...root.querySelectorAll('[data-pid]')];
        trackCardViewed({ surface, where, product_id: el.getAttribute('data-pid'), position: all.indexOf(el) });
        io.unobserve(el);
      }
    }, { threshold: 0.5 });
    root.querySelectorAll('[data-pid]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ref, where, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
}
