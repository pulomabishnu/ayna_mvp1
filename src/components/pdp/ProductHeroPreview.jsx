import React, { useEffect } from 'react';
import HeroPrice from './HeroPrice.jsx';
import { ProductImageFallback } from '../ProductTileImage.jsx';

/**
 * A product page's first paint, on a first visit: the hero (photo, brand,
 * name, lead line, price) from the build-time seed (utils/productSeed.js), with
 * the Buy box and the research outlined, while the catalog and the product
 * page code load. Same markup and classes as ProductModal's hero, so when it
 * takes over nothing moves; it is never interactive beyond Back.
 */
export default function ProductHeroPreview({ seed, onPainted = null }) {
  // Tell the page once this hero has been on screen (two frames), so the full
  // page doesn't replace it before the browser has even shown it.
  useEffect(() => {
    if (!onPainted) return undefined;
    let timer = 0;
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => { timer = setTimeout(onPainted, 0); }); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); clearTimeout(timer); };
  }, [onPainted]);
  return (
    <div className="ayp" id="pdp-v4" aria-busy="true">
      <div className="ay-container ayp__page">
        <div className="ayp-top">
          <button type="button" className="ayp-top__back" onClick={() => window.history.back()} aria-label="Back">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          {seed.crumbs?.length > 0 && (
            <nav className="ay-crumbs" aria-label="Breadcrumb">
              <ol>
                {seed.crumbs.map((c) => (
                  <li key={`${c.kind}-${c.label}`}>{c.kind === 'current' ? <span aria-current="page">{c.label}</span> : <a href={c.href}>{c.label}</a>}</li>
                ))}
              </ol>
            </nav>
          )}
          <button type="button" className="ayp-top__share" tabIndex={-1} aria-hidden="true">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
            <span>Share</span>
          </button>
        </div>

        <div className="ayp-hero pdp-head">
          <div className="ayp-hero__media pdp-head__media">
            <div className="ayp-gallery">
              <div className="ayq-stamp ayp-gallery__stamp">
                <div className="ayp-gallery__tile">
                  {seed.image ? (
                    <button type="button" className="ayp-gallery__zoom" tabIndex={-1}>
                      <img src={seed.image} alt={seed.alt || seed.name} fetchPriority="high" />
                    </button>
                  ) : <ProductImageFallback />}
                </div>
              </div>
              {seed.badges?.length > 0 && <ul className="ayq-badges is-web" aria-label="Facts about this product">{seed.badges.map((x) => <li key={x.id}><span>{x.label}</span>{x.note && <small>{x.note}</small>}</li>)}</ul>}
              {seed.thumbs?.length > 1 && (
                <ul className="ay-thumbs" aria-hidden="true">
                  {seed.thumbs.map((t, i) => (
                    <li key={t.src}><button type="button" tabIndex={-1} className={i === 0 ? 'is-on' : undefined}><img src={t.src} alt="" loading="lazy" /></button></li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="ayp-buy pdp-head__detail" id="ay-buycard">
            {(seed.tag || seed.brand) && <p className="ayp-buy__brand pdp-tag">{seed.tag || seed.brand}</p>}
            <h1 className="ay-h1 ayp-buy__name pdp-head__name">{seed.name}</h1>
            {seed.lead && <p className="ayp-buy__lead pdp-lead">{seed.lead}</p>}
            <HeroPrice view={seed.price} />
            <section className="ayp-buy__section" aria-hidden="true">
              <div className="ay-skel__bar is-title ayp-buy__skel" />
            </section>
            <p className="sr-only" role="status">Loading the product…</p>
          </div>
          <div className="ayp-hero__info pdp-head__info">
            <div className="ayq is-loading" aria-hidden="true">
              <div className="ayq-over"><div className="ayq-skel ayq-skel--bottom" /><div className="ayq-skel ayq-skel--glance" /><div className="ayq-skel ayq-skel--row" /></div>
              <div className="ayq-tabsec"><div className="ayq-skel ayq-skel--tabs" /><div className="ayq-skel ayq-skel--panel" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
