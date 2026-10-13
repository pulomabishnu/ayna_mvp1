import React from 'react';
import './shopper-card.css';

const SHOPPER_EMBLEMS = {
  researcher: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 15h9" />,
  listener: <><path d="M4 5h12v9H8l-4 3V5Z" /><path d="M20 9v10l-3-2h-7v-1" /></>,
  curator: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8Z" />,
  explorer: <><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
  original: <path d="M12 3.5l2.2 5.3 5.3 2.2-5.3 2.2L12 18.5l-2.2-5.3L4.5 11l5.3-2.2Z" />,
};

/** Shopper type, calm: emblem + name + one line, a single-hue shelf bar, up to three facts. Real data only. */
export default function ShopperCard({ profile }) {
  const shelf = profile.shelf || [];
  const total = profile.total || 0;
  const rows = (profile.rows || []).filter((r) => r.key !== 'type').slice(0, 3);
  return (
    <section className={`ay-shopper2 is-${profile.kind}`} aria-labelledby="ay-shopper2-title">
      <header className="ay-shopper2__head">
        <span className="ay-shopper2__emblem" aria-hidden="true"><svg viewBox="0 0 24 24">{SHOPPER_EMBLEMS[profile.kind]}</svg></span>
        <div>
          <span className="ay-shopper2__kicker">Shopper type</span>
          <h2 id="ay-shopper2-title">{profile.kind === 'original' ? 'The Original' : profile.title}</h2>
          <p>{profile.tagline}</p>
        </div>
      </header>
      {total > 0 && shelf.length > 0 && (
        <div className="ay-shopper2__shelf">
          <div className="ay-shopper2__shelf-head"><span>Your shelf</span><b>{total} pick{total === 1 ? '' : 's'}</b></div>
          <div className="ay-shopper2__bar" role="img" aria-label={shelf.map((x) => `${x.label} ${x.value}`).join(', ')}>
            {shelf.map((x, i) => <i key={x.label} style={{ flexGrow: x.value, '--o': Math.max(0.35, 1 - i * 0.18) }} />)}
          </div>
          <p className="ay-shopper2__mix">{shelf.map((x) => `${x.label} ${x.value}`).join(' · ')}</p>
        </div>
      )}
      {rows.length > 0 && (
        <dl className="ay-shopper2__facts">
          {rows.map((r) => <div key={r.key}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}
        </dl>
      )}
    </section>
  );
}

