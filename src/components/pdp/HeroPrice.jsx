import React from 'react';
import { LocalPriceEstimate, PriceRegionNote } from '../shop/PriceRegion.jsx';
import { localEstimate } from '../../utils/localPrice.js';

/** The price block under a product's name (data from heroPrice.js heroPriceView). */
export default function HeroPrice({ view }) {
  if (!view) return null;
  if (view.deposit) {
    return <div className="ayp-price"><span className="ayp-price__main">Coming soon</span><span className="ay-badge-text ay-badge-text--pill">Pre-order</span><p className="ayp-price__notes">Join the waitlist ({view.deposit} deposit)</p></div>;
  }
  return <>
    {(view.known || view.notes.length > 0) && (
      <div className="ayp-price">
        {view.known && <span className={`ayp-price__main${view.isPlaceholder ? ' is-placeholder' : ''}`}>{view.main}</span>}
        {/* Outside the US: "≈ €23" and one line on US dollars and shipping (Trevina). Nothing changes for US visitors. */}
        {view.known && !view.isPlaceholder && <LocalPriceEstimate price={view.main} />}
        {view.notes.length > 0 && <ul className="ayp-price__notes">{view.notes.map((t) => <li key={t}>{t}</li>)}</ul>}
      </div>
    )}
    {view.known && !view.isPlaceholder && localEstimate(view.main) && <PriceRegionNote className="ayp-buy__fine" />}
    {view.rx && <p className="ayp-buy__rx">{view.rx}</p>}
  </>;
}
