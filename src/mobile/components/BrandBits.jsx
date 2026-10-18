import { PARTNER_BRANDS } from '../../utils/partnerBrands';

// Website brand pieces, shared by app screens: the photo film strip, the
// partner-brand ticker and the "matched to you" stamp.
export const STRIP = [
  { src: '/landing/robe-vanity.webp', pos: '50% 40%' },
  { src: '/landing/sink-flatlay.webp', pos: '50% 50%' },
  { src: '/landing/laundry-duo.webp', pos: '50% 40%' },
  { src: '/landing/sink-heels-dryer.webp', pos: '50% 50%' },
  { src: '/landing/pajamas-overhead.webp', pos: '50% 40%' },
  { src: '/landing/vanity-hairdryer.webp', pos: '50% 40%' },
  { src: '/landing/bag-tubes.webp', pos: '50% 50%' },
];

export function FilmStrip({ photos = STRIP, className = '' }) {
  const row = (k) => <ul key={k}>{photos.map((p) => <li key={p.src}><img src={p.src} alt="" loading="lazy" style={{ objectPosition: p.pos }} /></li>)}</ul>;
  return <div className={`ay-film ${className}`} aria-hidden="true"><div className="ay-film-track">{row(0)}{row(1)}</div></div>;
}

export function BrandTicker({ className = '' }) {
  const names = PARTNER_BRANDS.map((b) => b.name);
  return <div className={`ay-land-ticker ${className}`} aria-hidden="true">
    <div className="ay-land-ticker-track">
      {[0, 1].map((k) => <ul key={k}>{names.map((n) => <li key={n}>{n}<span>{'★'}</span></li>)}</ul>)}
    </div>
  </div>;
}

export function Stamp({ id = 'ay-stamp', word = 'you', className = '' }) {
  return <div className={`ay-land-stamp ${className}`} aria-hidden="true">
    <svg viewBox="0 0 200 200"><defs><path id={`${id}-path`} d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" /></defs>
      <text><textPath href={`#${id}-path`} textLength="455" lengthAdjust="spacing">MATCHED TO YOU {'★'} MATCHED TO YOU {'★'}</textPath></text></svg>
    <span>{word}</span>
  </div>;
}
