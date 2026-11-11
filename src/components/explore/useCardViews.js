import { useEffect } from 'react';
import { trackCardViewed, eventSurface } from '../../utils/analyticsEvents.js';

/**
 * Card CTR, the "viewed" half (all-pages brief v3, "Track: card CTR"):
 * each product card in `ref`'s container that is at least half on screen
 * sends product_card_viewed once per page load (analyticsEvents dedupes).
 * Cards carry data-pid; the position is the card's index in the container.
 * Cards also carry data-pname / data-pbrand: the product's name and brand,
 * kept only for visitors who turned analytics on (stripped for everyone else
 * in main.jsx before_send). Never anything she typed or about her health.
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
        trackCardViewed({
          surface,
          where,
          product_id: el.getAttribute('data-pid'),
          product_name: el.getAttribute('data-pname') || undefined,
          brand: el.getAttribute('data-pbrand') || undefined,
          position: all.indexOf(el),
        });
        io.unobserve(el);
      }
    }, { threshold: 0.5 });
    root.querySelectorAll('[data-pid]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ref, where, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
}
