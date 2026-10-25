import { CurvedRing, DayStrip, Mark, ProductStickers, Shapes } from '../../components/personality/DS.jsx';

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

/** Greeting and the day strip over Home. */
export function HomeHello({ name = '', today }) {
  const hour = new Date().getHours();
  const hello = hour < 5 ? 'Hello' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="ay-home-hello">
      <p className="ay-home-hello__hi">{hello}{name ? `, ${name}` : ''}</p>
      <DayStrip iso={today} className="ay-home-hello__days" />
    </div>
  );
}

/** The hero art over the Rundown block: the number (ring), drawn shapes, stickers by density. */
export function HomeHeroArt({ look = 'a', products = [], cycle = null, sleepPoints = [] }) {
  const h = headline({ cycle, sleepPoints });
  const C = 2 * Math.PI * 38;
  return (
    <div className={`ay-home-art is-${look}`} aria-hidden="true">
      <Shapes className="ay-home-art__shapes" />
      {h && (
        <span className={`ay-home-art__num${h.small ? ' is-small' : ''}`}>
          {look === 'b' && <CurvedRing className="ay-home-art__curve" text="your week · your week · your week · " />}
          <svg viewBox="0 0 92 92" className="ay-home-art__ring">
            <circle cx="46" cy="46" r="38" className="is-track" />
            {h.frac != null && <circle cx="46" cy="46" r="38" className="is-arc" strokeDasharray={`${C * h.frac} ${C}`} transform="rotate(-90 46 46)" />}
          </svg>
          <b><small>{h.label}</small>{h.value}</b>
        </span>
      )}
      <ProductStickers products={products} max={1} className="ay-home-art__stickers" />
      {look === 'b' && <Mark name="sparkle" className="ay-home-art__spark" />}
    </div>
  );
}
