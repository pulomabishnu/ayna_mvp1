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
 * any catalog module (brands.js, productsExtended.js, limMethodProducts.js
 * via incontinenceProducts.js, etc.), so this page reads from ALL_PRODUCTS
 * rather than only src/data/brands.js.
 *
 * Emptied 2026-08-24 (no contract signed yet), refilled 2026-08-25: Neycher
 * signed a real, official partnership — confirmed by Aditi. No logo file has
 * been dropped at public/brands/neycher.png yet, so BrandMark below falls
 * back to a text wordmark until one is added; that's an existing, working
 * fallback, not a bug.
 */

const PARTNERS = [
  {
    brand: 'Neycher',
    /** Drop a file at public/brands/neycher.png and it replaces the wordmark. */
    logo: 'https://cdn.prod.website-files.com/66dc3b9581bf97e670861652/686eb5fcdbbd35b6fc957602_Frame%201000011567.jpg',
    url: 'https://www.helloneycher.com/',
    blurb:
      'Hormone-free intimate care. Moisturizers, balms and suppositories made for vaginal dryness, irritation and odour.',
  },
  {
    brand: 'Connect Pelvic Floor Fitness',
    logo: 'https://connectpelvicfloorfitness.com/wp-content/uploads/2026/05/social-share-homepage.jpg',
    url: 'https://goto.connectpelvicfloorfitness.com/YVk7WO',
    blurb:
      'DPT-led pelvic floor fitness with guided workouts designed to build strength, reduce symptoms and support whole-body movement.',
  },
  {
    brand: 'Elitone',
    logo: 'https://thebreastfeedingshop.com/wp-content/uploads/2024/08/Elitone-Pelvic-Floor-Exerciser-1-scaled.webp',
    url: 'https://elitone.com/?af=aynahealth',
    blurb:
      'FDA-cleared wearable pelvic floor therapy designed for at-home strengthening and bladder leak support without insertion.',
  },
  {
    brand: 'Proov',
    logo: 'https://proovtest.com/cdn/shop/products/1_ProHero.jpg?v=1669147223&width=3840',
    url: 'https://proovtest.com/?irclickid=092RZoWR3xyZWgGydJzTuXX9UkrxvuV9I08LVk0&sharedid=&irpid=7622078&utm_source=7622078&utm_medium=affiliate&irgwc=1&afsrc=1&tw_source=impact&tw_campaign=7622078',
    blurb:
      'At-home fertility testing designed to help track hormones and confirm ovulation.',
  },
  {
    // Confirmed partner since 2026-09-11 (see src/utils/partnerBrands.js) but
    // missing from this page until 2026-09-23 — folded in alongside the
    // Winx/SootheHer/gina additions below.
    brand: 'LiM Method',
    logo: 'https://www.limmethod.com/cdn/shop/files/IMG_2821.jpg?v=1696450654&width=1946',
    url: 'https://www.limmethod.com/?ref=Ayna_Health',
    blurb:
      'Guided pelvic-floor wellness kit built by a pelvic floor occupational therapist, combining low-impact movement training with a sliding board and accessories.',
  },
  {
    // Confirmed partner since 2026-09-07 (see src/utils/partnerBrands.js) but
    // missing a card on this page until 2026-09-23.
    brand: 'VIO2',
    logo: '',
    url: 'https://go.shopmy.us/p-83948920',
    blurb:
      'Dentist-designed, partial-coverage mouth tape for sleep. Encourages a gentle lip seal and nasal breathing to help with snoring and dry mouth.',
  },
  {
    // Confirmed partner since 2026-09-07 (see src/utils/partnerBrands.js) but
    // missing a card on this page until 2026-09-23.
    brand: 'My Pelvic Bra',
    logo: '',
    url: 'https://pelvic-bra.myshopify.com/nlbs3u',
    blurb:
      'A discreet, adjustable compression garment for pelvic heaviness, pressure, bulging, and leakage — worn during daily activity, not a corrective device.',
  },
  {
    // Confirmed partner since 2026-09-11 (see src/utils/partnerBrands.js) but
    // missing a card on this page until 2026-09-23.
    brand: 'BUNI',
    logo: '',
    url: 'https://www.bunibody.com/',
    blurb:
      'Intimate and body care for vulvar moisture, nipple and lip care, scar and body care, pregnancy, postpartum, menopause, and everyday comfort.',
  },
  {
    // Confirmed partner since 2026-09-23 (see src/utils/partnerBrands.js).
    // No single shared affiliate link — each LOLA product below has its own.
    brand: 'LOLA',
    logo: '',
    url: 'https://mylola.com/',
    blurb:
      'Organic cotton period care. Tampons and pads made with 100% organic cotton, transparent ingredients, and a customizable subscription.',
  },
  {
    brand: 'Winx Health',
    logo: 'https://cdn.shopify.com/s/files/1/0077/8761/0171/files/UTITest_Treat_1.png?v=1771347569',
    url: 'https://hellowinx.com/',
    blurb:
      'At-home UTI and vaginal health testing paired with telehealth, plus pregnancy tests and daily-defense supplements. Formerly known as Stix.',
  },
  {
    brand: 'SootheHer',
    logo: '',
    url: 'https://sootheher.com/',
    blurb:
      'The Elaris Pod, a wearable TENS device for drug-free period cramp relief.',
  },
  {
    brand: 'gina',
    logo: '',
    url: 'https://getgina.com/',
    blurb:
      'Hormone-free vaginal moisturizing glides and applicator refills for intimate comfort.',
  },
  // Liv Labs (Pippa Resistance Spring) is NOT yet a confirmed partner — its
  // two products stay in the catalog (src/data/brands.js) so they still
  // surface in Discovery/search, but intentionally left off this page and
  // out of partnerBrands.js's allowlist until a partnership is confirmed.
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
            ? "Partner brands may receive added visibility in Browse, but partnerships never affect personalized matching or recommendations."
            : "Something exciting is brewing — check back soon. Partner brands may receive added visibility in Browse, but partnerships never affect personalized matching or recommendations."}
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
                  <div className="brand-partner__affiliate-label">Affiliate link</div>
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
