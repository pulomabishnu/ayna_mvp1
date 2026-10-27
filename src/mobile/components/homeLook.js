/**
 * Home in the chosen direction (founder, Oct 25 23:50): data as graphics,
 * with a light sticker touch. Decoration only (aria-hidden), drawn from her
 * real data: her cycle day or last night's sleep as the headline number,
 * her products' photos as cutouts. Nothing is invented; with no data the
 * hero keeps only its drawn shapes.
 *   ?homestyle=a  stickers very light (one product cutout)      [default]
 *   ?homestyle=b  stickers medium (cutout + curved-text ring + sparkle)
 * The pick is kept for the tab.
 */
export function readHomeLook() {
  if (typeof window === 'undefined') return 'a';
  try {
    const q = new URLSearchParams(window.location.search).get('homestyle');
    if (q !== null) {
      const v = q === 'b' ? 'b' : 'a';
      sessionStorage.setItem('ayna_homestyle', v);
      return v;
    }
    return sessionStorage.getItem('ayna_homestyle') === 'b' ? 'b' : 'a';
  } catch { return 'a'; }
}

/** The headline number for the hero: her cycle day, else last night's sleep; null without data. */
export function headline({ cycle = null, sleepPoints = [] }) {
  if (cycle?.cycleDay) return { label: 'Cycle day', value: String(cycle.cycleDay), frac: cycle.avgLength ? Math.min(1, cycle.cycleDay / cycle.avgLength) : null };
  const nights = sleepPoints.filter((p) => Number.isFinite(p?.value));
  if (nights.length) { const m = nights[nights.length - 1].value; return { label: 'Last night', value: `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`, frac: null, small: true }; }
  return null;
}
