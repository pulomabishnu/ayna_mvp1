import { useEffect, useState } from 'react';

/**
 * Site header and phone tab bar, without a visible seam (founder, Oct 21).
 * - `scrolled`: content is under the header, so it may show its hairline.
 * - `away`: scrolling down, the header slides up out of view; any scroll up
 *   brings it back (the pattern Safari, Medium and the NYT use).
 * - `atEnd`: the page is scrolled to the bottom (or does not scroll), so
 *   nothing is under the tab bar and it shows no hairline.
 */
export function useHeaderScroll() {
  const [state, setState] = useState({ scrolled: false, away: false, atEnd: false });
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let last = window.scrollY;
    let away = false;
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const se = document.scrollingElement || document.documentElement;
      const atEnd = y + window.innerHeight >= se.scrollHeight - 2;
      if (y < 120) away = false;
      else if (y > last + 6) away = true;
      else if (y < last - 6) away = false;
      if (Math.abs(y - last) > 6 || y < 120) last = y;
      const scrolled = y > 1;
      setState((prev) => (prev.scrolled === scrolled && prev.away === away && prev.atEnd === atEnd ? prev : { scrolled, away, atEnd }));
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Page height changes (route change, content loading) can move the end.
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onScroll);
    ro?.observe(document.body);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      ro?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return state;
}
