import React from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';
import { handleImageErrorWithRetry } from '../utils/imageRetry';
import { safeProductImageSrc } from '../utils/resolveProductImage';
import { ProductImageFallback } from './ProductTileImage';

/**
 * Brands — the partnership page.
 *
 * This replaced the old Brands page, which was a general Ayna waitlist form
 * plus a list of unreleased startups to join waitlists for. Neither is what
 * this page is for any more: it holds the brands Ayna actually works with.
 *
 * Only confirmed partners belong here. The products themselves can live in
 * any catalog module, so this page reads from ALL_PRODUCTS rather than only
 * src/data/brands.js.
 *
 * Emptied 2026-08-24 (no contract signed yet), refilled 2026-08-25: Neycher
 * signed a real, official partnership — confirmed by Aditi. No logo file has
 * been dropped at public/brands/neycher.png yet, so BrandMark below falls
 * back to a text wordmark until one is added; that's an existing, working
 * fallback, not a bug.
 *
 * Added 2026-08-27: Connect Pelvic Floor Fitness — confirmed affiliate
 * partnership. `url` is the Ayna affiliate link, not the bare homepage, since
 * that's what should get the click/conversion credit. Same no-logo-yet
 * situation as Neycher — falls back to the text wordmark until a file lands
 * at public/brands/connect-pelvic-floor-fitness.png.
 *
 * Added 2026-09-07: VIO2 — confirmed affiliate partnership. `url` is the
 * Ayna affiliate link (go.shopmy.us), not the bare homepage. Same no-logo-yet
 * situation — falls back to the text wordmark until a file lands at
 * public/brands/vio2.png.
 *
 * Added 2026-09-07: Proov — confirmed affiliate partnership, 5 products, each
 * with its own proov.pxf.io affiliate link. `url` here goes to the general
 * proovtest.com site since there's no single per-brand link.
 *
 * Added 2026-09-07: Elitone — confirmed affiliate partnership, 2 products.
 * One general affiliate link (elitone.com/?af=aynahealth) covers both.
 *
 * Added 2026-09-07: My Pelvic Bra — confirmed affiliate partnership, using
 * pelvic-bra.myshopify.com affiliate links that redirect to the brand's real
 * storefront at mypelvicbra.shop.
 *
 * Added 2026-09-11: BUNI — confirmed brand partnership. Direct BUNI affiliate
 * link is still pending, so the partnership page uses the official brand site
 * while individual product Buy Now links currently use Ayna's Amazon
 * Associates links.
 *
 * Added 2026-09-11: LiM Method — confirmed affiliate partnership. Product and
 * brand links use the ref=Ayna_Health tracking parameter supplied by Ayna.
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
  {
    brand: 'Connect Pelvic Floor Fitness',
    /** Drop a file at public/brands/connect-pelvic-floor-fitness.png and it replaces the wordmark. */
    logo: '/brands/connect-pelvic-floor-fitness.png',
    url: 'https://goto.connectpelvicfloorfitness.com/YVk7WO',
    blurb:
      'App and web membership for progressive pelvic floor training. Guided strength, HIIT, yoga and mobility workouts built by a pelvic floor physical therapist.',
  },
  {
    brand: 'VIO2',
    /** Drop a file at public/brands/vio2.png and it replaces the wordmark. */
    logo: '/brands/vio2.png',
    url: 'https://go.shopmy.us/p-83948920',
    blurb:
      'Dentist-designed, partial-coverage mouth tape for sleep. Encourages a gentle lip seal and nasal breathing to help with snoring and dry mouth.',
  },
  {
    brand: 'Proov',
    /** Drop a file at public/brands/proov.png and it replaces the wordmark. */
    logo: '/brands/proov.png',
    url: 'https://proovtest.com/',
    blurb:
      'At-home fertility and hormone testing. Track your full cycle, confirm ovulation, screen for common fertility factors, and get personalized next steps.',
  },
  {
    brand: 'Elitone',
    /** Drop a file at public/brands/elitone.png and it replaces the wordmark. */
    logo: '/brands/elitone.png',
    url: 'https://elitone.com/?af=aynahealth',
    blurb:
      'FDA-cleared, external at-home devices for bladder leaks. A wearable gel pad does pelvic floor stimulation for you — no insertion, no prescription needed.',
  },
  {
    brand: 'My Pelvic Bra',
    /** Drop a file at public/brands/my-pelvic-bra.png and it replaces the wordmark. */
    logo: '/brands/my-pelvic-bra.png',
    url: 'https://pelvic-bra.myshopify.com/nlbs3u',
    blurb:
      'A discreet, adjustable compression garment for pelvic heaviness, pressure, bulging, and leakage — worn during daily activity, not a corrective device.',
  },
  {
    brand: 'BUNI',
    /** Drop a file at public/brands/buni.png and it replaces the wordmark. */
    logo: '/brands/buni.png',
    url: 'https://www.bunibody.com/',
    blurb:
      'Intimate and body care for vulvar moisture, nipple and lip care, scar and body care, pregnancy, postpartum, menopause, and everyday comfort.',
  },
  {
    brand: 'LiM Method',
    /** Drop a file at public/brands/lim-method.png and it replaces the wordmark. */
    logo: '/brands/lim-method.png',
    url: 'https://www.limmethod.com/?ref=Ayna_Health',
    blurb:
      'Pelvic-floor wellness through guided, low-impact multidirectional movement using the LiM Sliding Board, accessories, and expert-led Movement Sessions.',
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
        <div className="brands__kicker">Partnerships</div>
        <h1 className="brands__title">
          {PARTNERS.length > 0 ? 'Brands we work with.' : 'Brand partnerships are coming soon.'}
        </h1>
        <p className="brands__lede">
          {PARTNERS.length > 0
            ? "Partnerships, not paid placement. A brand being here doesn't move it up your shop. Matching is the same for every product Ayna carries."
            : "Something exciting is brewing — check back soon. Whenever a partnership becomes official, it still won't move a brand up your shop or your recommendations. Matching stays the same for every product Ayna carries, partner or not."}
        </p>
      </div>

      <div className="mockup-page">
        {PARTNERS.map((partner) => {
          const products = ALL_PRODUCTS.filter((p) => p.brand === partner.brand);
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
                        {safeProductImageSrc(product.image, product.type === 'digital') ? (
                          <img
                            src={safeProductImageSrc(product.image, product.type === 'digital')}
                            alt=""
                            loading="lazy"
                            onError={(e) => handleImageErrorWithRetry(e, () => { e.currentTarget.style.display = 'none'; })}
                          />
                        ) : (
                          <ProductImageFallback />
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

        {PARTNERS.length > 0 && <p className="brands__more">More coming soon</p>}
      </div>
    </section>
  );
}
