import React from 'react';
import { BRAND_PRODUCTS } from '../data/brands';
import { CATEGORY_LABELS } from '../data/products';
import { handleImageErrorWithRetry } from '../utils/imageRetry';
import { safeProductImageSrc } from '../utils/resolveProductImage';

/**
 * Brands — the partnership page.
 *
 * This replaced the old Brands page, which was a general Ayna waitlist form
 * plus a list of unreleased startups to join waitlists for. Neither is what
 * this page is for any more: it holds the brands Ayna actually works with.
 *
 * Only confirmed partners belong here. src/data/brands.js is explicit that its
 * entries are catalog entries and "NOT partnership relationships", so the
 * partner list is its own thing below and names exactly one brand — Neycher,
 * the one that's moving forward. Everything else stays a catalog entry.
 */

const PARTNERS = [
  {
    brand: 'Neycher',
    /** Drop a file at public/brands/neycher.png and it replaces the wordmark. */
    logo: '/brands/neycher.png',
    url: 'https://www.helloneycher.com/',
    blurb:
      'Hormone-free intimate care. Moisturizers, balms and suppositories made for vaginal dryness, irritation and odour.',
  },
];

function eyebrowFor(product) {
  return String(CATEGORY_LABELS[product.category] || product.category || '')
    .replace(/^[^\w]+\s*/, '')
    .toUpperCase();
}

function BrandMark({ partner }) {
  const [logoFailed, setLogoFailed] = React.useState(false);
  if (partner.logo && !logoFailed) {
    return (
      <img
        className="brand-partner__logo"
        src={partner.logo}
        alt={partner.brand}
        onError={() => setLogoFailed(true)}
      />
    );
  }
  return <div className="brand-partner__wordmark">{partner.brand}</div>;
}

export default function BrandPartners({ onOpenProduct, myProducts = {}, onAddToEcosystem }) {
  return (
    <section className="brands">
      <div className="mockup-page brands__head">
        <div className="brands__kicker">Our partners</div>
        <h1 className="brands__title">Brands we work with.</h1>
        <p className="brands__lede">
          Partnerships, not paid placement. A brand being here doesn&apos;t move it up your shop.
          Matching is the same for every product Ayna carries.
        </p>
      </div>

      <div className="mockup-page">
        {PARTNERS.map((partner) => {
          const products = BRAND_PRODUCTS.filter((p) => p.brand === partner.brand);
          return (
            <article key={partner.brand} className="brand-partner">
              <header className="brand-partner__head">
                <BrandMark partner={partner} />
                <div>
                  <div className="brand-partner__name">{partner.brand}</div>
                  <p className="brand-partner__blurb">{partner.blurb}</p>
                  <a className="brand-partner__link" href={partner.url} target="_blank" rel="noopener noreferrer">
                    Visit {partner.brand} ↗
                  </a>
                </div>
              </header>

              {products.length > 0 && (
                <div className="discovery-grid brand-partner__grid">
                  {products.map((product) => (
                    <div key={product.id} className="discovery-card" style={{ cursor: 'default' }}>
                      <div
                        className="discovery-card__tile"
                        role="button"
                        tabIndex={0}
                        aria-label={`${product.name}. Open details`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onOpenProduct?.(product)}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter' && e.key !== ' ') return;
                          e.preventDefault();
                          onOpenProduct?.(product);
                        }}
                      >
                        {safeProductImageSrc(product.image) ? (
                          <img
                            src={safeProductImageSrc(product.image)}
                            alt=""
                            loading="lazy"
                            onError={(e) => handleImageErrorWithRetry(e, () => { e.currentTarget.style.display = 'none'; })}
                          />
                        ) : (
                          <span className="discovery-card__initial" aria-hidden="true">
                            {String(product.name || '?').trim().charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="discovery-card__eyebrow">{eyebrowFor(product)}</div>
                      <div className="discovery-card__name">{product.name}</div>
                      <div className="discovery-card__price">{product.price}</div>
                      <button
                        type="button"
                        className="discovery-card__join"
                        onClick={() => onAddToEcosystem?.(product)}
                        disabled={!!myProducts[product.id]}
                        style={myProducts[product.id] ? { opacity: 0.55, cursor: 'default' } : undefined}
                      >
                        {myProducts[product.id] ? '✓ In ecosystem' : 'Add to ecosystem'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}

        <p className="brands__more">Coming soon</p>
      </div>
    </section>
  );
}
