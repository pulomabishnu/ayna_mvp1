import { DateStamp, Mark } from '../../components/personality/DS.jsx';

/**
 * Home directions for the founder to pick from (Oct 25, 23:24). Decoration
 * only: every piece is aria-hidden and drawn from her real data (her
 * products' photos, her cycle day, her sleep nights); nothing is invented.
 *   a  Sticker board    filled colour blocks, die-cut product stickers, a tilted stamp, washi tape
 *   b  Data as graphics her cycle as a drawn ring, sleep nights as bars, the Rundown as a scalloped espresso block
 *   c  Folder/scrapbook layered folder tabs, a taped polaroid, a hand-drawn underline and arrow
 * Preview only for now: `?homelook=a|b|c` in development. Production keeps the current Home.
 */
export function readHomeLook() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return '';
  try {
    const q = new URLSearchParams(window.location.search).get('homelook');
    return ['a', 'b', 'c'].includes(q) ? q : '';
  } catch { return ''; }
}

const imgOf = (p) => p?.image || p?.imageUrl || p?.image_url || '';

/** The art that sits over the top of the Rundown card (height 0, positioned pieces). */
export function HomeHeroArt({ look, products = [], today, cycle = null, sleepPoints = [] }) {
  if (!look) return null;
  const withPhotos = products.filter((p) => imgOf(p)).slice(0, 2);
  if (look === 'a') {
    return (
      <div className="ay-home-art is-a" aria-hidden="true">
        <DateStamp iso={today} className="ay-home-art__stamp" />
        {withPhotos.map((p, i) => <span key={p.id} className={`ay-home-art__sticker is-${i + 1}`}><img src={imgOf(p)} alt="" /></span>)}
      </div>
    );
  }
  if (look === 'b') {
    const day = cycle?.cycleDay || null;
    const len = cycle?.avgLength || null;
    if (day) {
      // The arc is drawn only against her own usual length; without one, the day sits in a dotted ring.
      const frac = len ? Math.min(1, day / len) : null;
      const C = 2 * Math.PI * 38;
      return (
        <div className="ay-home-art is-b" aria-hidden="true">
          <span className="ay-home-art__ring">
            <svg viewBox="0 0 92 92">
              <circle cx="46" cy="46" r="38" className="is-track" />
              {frac != null && <circle cx="46" cy="46" r="38" className="is-arc" strokeDasharray={`${C * frac} ${C}`} transform="rotate(-90 46 46)" />}
              {frac != null && <circle cx={46 + 38 * Math.sin(2 * Math.PI * frac)} cy={46 - 38 * Math.cos(2 * Math.PI * frac)} r="5.5" className="is-dot" />}
            </svg>
            <b><small>Day</small>{day}</b>
          </span>
        </div>
      );
    }
    const nights = sleepPoints.slice(-7).filter((p) => Number.isFinite(p?.value));
    if (nights.length >= 3) {
      const last = nights[nights.length - 1].value;
      return (
        <div className="ay-home-art is-b" aria-hidden="true">
          <span className="ay-home-art__ring is-sleep"><b><small>Last night</small>{Math.floor(last / 60)}h {Math.round(last % 60)}m</b></span>
        </div>
      );
    }
    return null;
  }
  if (look === 'c') {
    return (
      <div className="ay-home-art is-c" aria-hidden="true">
        <svg className="ay-home-art__arrow" viewBox="0 0 60 40"><path d="M4 8c14 0 28 4 38 18" /><path d="M34 24l9 4 1-10" /></svg>
      </div>
    );
  }
  return null;
}

/** A small graphic inside the health row: her last nights as bars (b), a sticker mark (a, c). */
export function HomeHealthArt({ look, sleepPoints = [], products = [] }) {
  if (!look) return null;
  if (look === 'c') {
    const p = products.find((x) => imgOf(x));
    if (p) return <figure className="ay-home-hart is-polaroid" aria-hidden="true"><img src={imgOf(p)} alt="" /></figure>;
  }
  if (look === 'b') {
    const nights = sleepPoints.slice(-7).filter((p) => Number.isFinite(p?.value));
    if (nights.length < 3) return null;
    const max = Math.max(...nights.map((p) => p.value));
    return <span className="ay-home-hart is-bars" aria-hidden="true">{nights.map((p, i) => <i key={p.day} className={i === nights.length - 1 ? 'is-last' : ''} style={{ height: `${Math.max(18, Math.round((p.value / max) * 100))}%` }} />)}</span>;
  }
  return <span className={`ay-home-hart is-mark is-${look}`} aria-hidden="true"><Mark name={look === 'a' ? 'moon' : 'star'} /></span>;
}
