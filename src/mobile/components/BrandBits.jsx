import { PARTNER_BRANDS } from '../../utils/partnerBrands';

// Website brand pieces shared by app screens: the partner-brand ticker
// (landing only) and the "matched to you" stamp.
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
