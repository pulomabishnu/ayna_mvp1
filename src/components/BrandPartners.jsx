import React from 'react';
import { ALL_PRODUCTS } from '../data/products';
import { InfoPage } from './InfoPage';
import { isPlainLeftClick } from '../utils/productRoute';
import ProductCard from './ProductCard';
import { RESA_SITE_URL, RESA_WAITLIST_CTA, RESA_WAITLIST_URL } from '../data/resaPartnership';

/**
 * Brands, the partnership page.
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
 * signed a real, official partnership, confirmed by Aditi. No logo file has
 * been dropped at public/brands/neycher.png yet, so BrandMark below falls
 * back to a text wordmark until one is added; that's an existing, working
 * fallback, not a bug.
 *
 * Added 2026-10-05: Rèsa, confirmed brand partnership, PRE-LAUNCH. Rèsa
 * hasn't shipped; users can only join the waitlist with a $9.90 early
 * deposit, and ayna earns no commission on it (the partnership is
 * groundwork for the future wearable dashboard). `prelaunch: true` gives the
 * card a distinct waitlist highlight and a "Join the waitlist" CTA pointing
 * at `waitlistUrl`, the UTM-tagged link Rèsa supplied so referrals are
 * trackable. Shared copy lives in src/data/resaPartnership.js. Logo saved
 * from resa-labs.com at public/brands/resa.png.
 */

const PARTNERS = [
  {
    brand: 'Neycher',
    /** Drop a file at public/brands/neycher.png and it replaces the wordmark. */
    logo: 'https://cdn.prod.website-files.com/66dc3b9581bf97e670861652/686eb5fcdbbd35b6fc957602_Frame%201000011567.jpg',
    url: 'https://www.helloneycher.com/',
    blurb:
      'Hormone-free moisturizers, balms and suppositories for vaginal dryness, irritation and odor.',
  },
  {
    brand: 'Connect Pelvic Floor Fitness',
    logo: 'https://connectpelvicfloorfitness.com/wp-content/uploads/2026/05/social-share-homepage.jpg',
    url: 'https://goto.connectpelvicfloorfitness.com/YVk7WO',
    blurb:
      'App and web pelvic floor workouts built by a pelvic floor physical therapist.',
  },
  {
    brand: 'Elitone',
    logo: 'https://thebreastfeedingshop.com/wp-content/uploads/2024/08/Elitone-Pelvic-Floor-Exerciser-1-scaled.webp',
    url: 'https://elitone.com/?af=aynahealth',
    blurb:
      'FDA-cleared external device for bladder leaks: a wearable gel pad, no insertion needed.',
  },
  {
    brand: 'Proov',
    logo: 'https://proovtest.com/cdn/shop/products/1_ProHero.jpg?v=1669147223&width=3840',
    url: 'https://proovtest.com/?irclickid=092RZoWR3xyZWgGydJzTuXX9UkrxvuV9I08LVk0&sharedid=&irpid=7622078&utm_source=7622078&utm_medium=affiliate&irgwc=1&afsrc=1&tw_source=impact&tw_campaign=7622078',
    blurb:
      'At-home fertility and hormone tests to track your cycle and confirm ovulation.',
  },
  {
    // Confirmed partner since 2026-09-11 (see src/utils/partnerBrands.js) but
    // missing from this page until 2026-09-23, folded in alongside the
    // Winx/SootheHer/gina additions below.
    brand: 'LiM Method',
    logo: 'https://www.limmethod.com/cdn/shop/files/IMG_2821.jpg?v=1696450654&width=1946',
    url: 'https://www.limmethod.com/?ref=Ayna_Health',
    blurb:
      'Low-impact pelvic floor movement with the LiM Sliding Board and guided sessions.',
  },
  {
    // Confirmed partner since 2026-09-07 (see src/utils/partnerBrands.js) but
    // missing a card on this page until 2026-09-23.
    brand: 'VIO2',
    logo: '',
    url: 'https://go.shopmy.us/p-83948920',
    blurb:
      'Dentist-designed mouth tape that encourages nasal breathing during sleep.',
  },
  {
    // Confirmed partner since 2026-09-07 (see src/utils/partnerBrands.js) but
    // missing a card on this page until 2026-09-23.
    brand: 'My Pelvic Bra',
    logo: '',
    url: 'https://pelvic-bra.myshopify.com/nlbs3u',
    blurb:
      'Adjustable compression garment for pelvic heaviness, pressure and leakage during daily activity.',
  },
  {
    // Confirmed partner since 2026-09-11 (see src/utils/partnerBrands.js) but
    // missing a card on this page until 2026-09-23.
    brand: 'BUNI',
    logo: '',
    url: 'https://www.bunibody.com/',
    blurb:
      'Intimate and body care for vulvar moisture, pregnancy, postpartum and menopause.',
  },
  {
    // Confirmed partner since 2026-09-23 (see src/utils/partnerBrands.js).
    // No single shared affiliate link, each LOLA product below has its own.
    brand: 'LOLA',
    logo: '',
    url: 'https://mylola.com/',
    blurb:
      'Organic cotton tampons and pads with transparent ingredients and a customizable subscription.',
  },
  {
    brand: 'Winx Health',
    logo: 'https://cdn.shopify.com/s/files/1/0077/8761/0171/files/UTITest_Treat_1.png?v=1771347569',
    url: 'https://hellowinx.com/',
    blurb:
      'At-home UTI and vaginal health tests paired with telehealth. Formerly Stix.',
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
      'Hormone-free vaginal moisturizing glides and applicator refills.',
  },
  {
    // Last on purpose (2026-10-05): pre-launch, so it sits after the shipping
    // partners but keeps its highlighted waitlist card.
    brand: 'Rèsa',
    logo: '/brands/resa.png',
    url: RESA_SITE_URL,
    prelaunch: true,
    waitlistUrl: RESA_WAITLIST_URL,
    waitlistCta: RESA_WAITLIST_CTA,
    blurb: 'A pre-launch wearable, worn as jewelry, that reads your body signals alongside your cycle.',
  },
  // Liv Labs (Pippa Resistance Spring) is NOT yet a confirmed partner, its
  // two products stay in the catalog (src/data/brands.js) so they still
  // surface in Discovery/search, but intentionally left off this page and
  // out of partnerBrands.js's allowlist until a partnership is confirmed.
];

function BrandMark({ partner }) {
  const [logoFailed, setLogoFailed] = React.useState(false);
  if (partner.logo && !logoFailed) {
    return (
      <img
        className="brand-partner__logo"
        src={partner.logo}
        alt={`${partner.brand} logo`}
        onError={() => setLogoFailed(true)}
      />
    );
  }
  return <div className="brand-partner__wordmark">{partner.brand}</div>;
}

// A to Z (ignoring case and accents); a pre-launch partner sits after the shipping ones.
const sortKey = (p) => String(p.brand).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const ORDERED = [...PARTNERS].sort((a, b) => (Number(!!a.prelaunch) - Number(!!b.prelaunch)) || sortKey(a).localeCompare(sortKey(b)));

const slug = (b) => `brand-${String(b).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

/* A grid of brand cards (logo, one line, product count). Picking one opens
   that brand's products below the grid, in the same card the Shop uses, so
   the page is one screen of brands instead of a storefront per brand. */
export default function BrandPartners({ onOpenProduct, myProducts = {}, onBrowseBrand }) {
  const [open, setOpen] = React.useState(() => {
    try { const h = window.location.hash.slice(1); return ORDERED.find((p) => slug(p.brand) === h)?.brand || null; } catch { return null; }
  });
  const panelRef = React.useRef(null);
  const pick = (brand) => {
    setOpen((cur) => (cur === brand ? null : brand));
    window.requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const partner = ORDERED.find((p) => p.brand === open) || null;
  const products = partner ? ALL_PRODUCTS.filter((p) => p.brand === partner.brand) : [];
  return (
    <InfoPage photos={['sink-heels-dryer', 'vanity-hairdryer', 'bag-tubes']} tone="sky"
      eyebrow="Partnerships"
      title={PARTNERS.length > 0 ? 'Brands we work with.' : 'Brand partnerships are coming soon.'}
      lede={PARTNERS.length > 0
        ? 'Partner products may be featured higher in general Browse. Partnership never changes your personalized match scores or recommendation order.'
        : 'Check back soon. When partnerships go live, they may be featured in general Browse, but partnership will never change personalized match scores or recommendation order.'}
      width="wide"
    >
      <ul className="brand-cards" aria-label="Partner brands, A to Z">
        {ORDERED.map((p) => {
          const count = ALL_PRODUCTS.filter((x) => x.brand === p.brand).length;
          const on = open === p.brand;
          return (
            <li key={p.brand} id={slug(p.brand)}>
              <button type="button" className={`brand-card${on ? ' is-on' : ''}`} aria-expanded={on} aria-controls="brand-panel" onClick={() => pick(p.brand)}>
                <span className="brand-card__name">{p.brand}{p.prelaunch && <small className="brand-card__tag">Pre-launch</small>}</span>
                <span className="brand-card__blurb">{p.blurb}</span>
                <span className="brand-card__count">{count ? `${count} product${count === 1 ? '' : 's'}` : 'Waitlist'}<span aria-hidden="true">{on ? ' ↑' : ' →'}</span></span>
              </button>
            </li>
          );
        })}
      </ul>
      <section id="brand-panel" ref={panelRef} className="brand-panel" aria-live="polite" hidden={!partner}>
        {partner && <>
          <header className="brand-panel__head">
            <BrandMark partner={partner} />
            <div>
              <h2 className="brand-partner__name">{partner.brand}{partner.prelaunch && <span className="brand-partner__prelaunch-tag">Pre-launch · Waitlist</span>}</h2>
              <p className="brand-partner__blurb">{partner.blurb}</p>
              <p className="brand-panel__links">
                {partner.waitlistUrl && <a className="brand-partner__waitlist-cta" href={partner.waitlistUrl} target="_blank" rel="noopener noreferrer">{partner.waitlistCta || 'Join the waitlist'} →</a>}
                <a className="brand-partner__link" href={`/shop?q=${encodeURIComponent(partner.brand)}`} onClick={(e) => {
                  if (!onBrowseBrand || !isPlainLeftClick(e)) return;
                  e.preventDefault();
                  onBrowseBrand(partner.brand);
                }}>See {partner.brand} in Shop →</a>
                <button type="button" className="brand-panel__back" onClick={() => { setOpen(null); document.getElementById(slug(partner.brand))?.querySelector('button')?.focus(); }}>Back to brands ↑</button>
              </p>
            </div>
          </header>
          {products.length > 0 && <div className="brand-panel__grid">
            {products.map((product) => <ProductCard key={product.id} product={product} onOpen={onOpenProduct} inEcosystem={Boolean(myProducts[product.id])} />)}
          </div>}
        </>}
      </section>
      {PARTNERS.length > 0 && <p className="ay-info-partners__more">More coming soon</p>}
    </InfoPage>
  );
}
