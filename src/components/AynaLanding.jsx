import React, { useMemo, useState } from 'react';
import { ALL_PRODUCTS } from '../data/products';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import '../v6Real.css';

const CARE_AREAS = [
  { label: 'Periods', query: 'period care', terms: ['period', 'pad', 'tampon', 'menstrual', 'cramp'] },
  { label: 'Hormones', query: 'hormonal health', terms: ['hormone', 'pcos', 'inositol', 'cycle'] },
  { label: 'PCOS', query: 'PCOS', terms: ['pcos', 'inositol', 'spearmint'] },
  { label: 'Pain', query: 'period pain', terms: ['pain', 'cramp', 'heat', 'pelvic'] },
  { label: 'Fertility', query: 'fertility', terms: ['fertility', 'ovulation', 'conception'] },
  { label: 'Pregnancy', query: 'pregnancy', terms: ['pregnancy', 'prenatal', 'maternity'] },
  { label: 'Postpartum', query: 'postpartum', terms: ['postpartum', 'nursing', 'breastfeeding', 'recovery'] },
  { label: 'Vaginal health', query: 'vaginal health', terms: ['vaginal', 'intimate', 'bv', 'yeast', 'dryness'] },
  { label: 'Sexual health', query: 'sexual wellness', terms: ['sexual', 'lubricant', 'pelvic', 'comfort'] },
  { label: 'Menopause', query: 'menopause', terms: ['menopause', 'perimenopause', 'hot flash', 'dryness'] },
  { label: 'Sleep + energy', query: 'sleep and energy', terms: ['sleep', 'fatigue', 'energy', 'melatonin'] },
  { label: 'Skin + hair', query: 'skin and hair', terms: ['skin', 'hair', 'acne', 'hair loss'] },
];

const TRUST_POINTS = [
  ['01', 'Personal to you', 'Discovery can use your health needs, life stage, goals, and preferences when you choose to personalize.'],
  ['02', 'Evidence in context', 'See research, safety information, and useful context without turning product discovery into a medical diagnosis.'],
  ['03', 'Partnerships labeled', 'Commercial brand relationships are identified and do not determine your personalized Health Match.'],
  ['04', 'Your health stays yours', 'Sensitive health information is treated differently from ordinary browsing and product analytics.'],
];

function firstName(user) {
  const meta = user?.user_metadata || {};
  const raw = meta.first_name || meta.firstName || meta.given_name || meta.full_name || meta.name || '';
  return String(raw).trim().split(/\s+/).filter(Boolean)[0] || '';
}

function productText(product) {
  return [
    product?.name,
    product?.brand,
    product?.brandName,
    product?.category,
    product?.summary,
    product?.description,
    ...(Array.isArray(product?.tags) ? product.tags : []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function uniqueProducts(products) {
  const seen = new Set();
  return products.filter((product) => {
    if (!product?.name) return false;
    const key = product?.id || `${product?.brand || product?.brandName || ''}:${product.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasImage(product) {
  return Boolean(
    product?.image || product?.imageUrl || product?.image_url || product?.thumbnail ||
    (Array.isArray(product?.images) && product.images.length)
  );
}

function realMatchPercent(product) {
  const raw = product?.matchPercentage ?? product?.matchScore ?? product?.score;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  const normalized = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
  return Math.max(0, Math.min(100, normalized));
}

function discoveryTargetFor(value) {
  const query = String(value || '').trim();
  if (!query) return '';
  const q = query.toLowerCase();
  if (q.includes('pad')) return { query, initialCategory: 'pad' };
  if (q.includes('tampon')) return { query, initialCategory: 'tampon' };
  if (q.includes('cup')) return { query, initialCategory: 'cup' };
  if (q.includes('pcos') || q.includes('hormon')) return { query, initialMacroGroup: 'hormones' };
  if (q.includes('fertil') || q.includes('ovulation')) return { query, initialMacroGroup: 'fertility' };
  if (q.includes('pelvic')) return { query, initialMacroGroup: 'pelvic' };
  return query;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.4 16.4 4.1 4.1" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="6.5" y="10.5" width="11" height="8.5" rx="2" />
      <path d="M9 10.5V8a3 3 0 0 1 6 0v2.5" />
    </svg>
  );
}

function ProductVisual({ product, className = '' }) {
  return (
    <div className={`v6e-product-visual ${className}`.trim()}>
      <ProductTileImage
        product={product}
        alt={product?.name || ''}
        imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
        letterNode={<ProductImageFallback />}
      />
    </div>
  );
}

function ProductCard({ product, onOpenProduct, showMatch = false }) {
  if (!product) return null;
  const match = showMatch ? realMatchPercent(product) : null;
  const brand = product?.brand || product?.brandName || product?.manufacturer || 'ayna';
  return (
    <article className="v6e-product-card">
      <button type="button" className="v6e-product-card__media" onClick={() => onOpenProduct?.(product)} aria-label={`View ${product.name}`}>
        <ProductVisual product={product} />
        {match != null && (
          <span className="v6e-home-match" aria-label={`${match}% Health Match`}>
            <strong>{match}%</strong>
            <small>match</small>
          </span>
        )}
      </button>
      <div className="v6e-product-card__copy">
        <span>{brand}</span>
        <button type="button" onClick={() => onOpenProduct?.(product)}>{product.name}</button>
        {product?.price && <small>{product.price}</small>}
      </div>
    </article>
  );
}

function triggerExistingSignIn(fallback) {
  const buttons = Array.from(document.querySelectorAll('button'));
  const direct = buttons.find((button) => /^(sign\s*in|log\s*in)$/i.test(String(button.textContent || '').trim()) && button.offsetParent !== null);
  if (direct) direct.click();
  else fallback?.();
}

export default function AynaLanding({
  onStartQuiz,
  onViewDiscovery,
  onOpenProduct,
  onViewEcosystem,
  user,
  myProducts,
  ecosystemCount = 0,
  hasProfile = false,
  profileCategories,
  recommendedProductIds = [],
  initialCategory = null,
}) {
  const [query, setQuery] = useState('');

  const owned = useMemo(() => Object.values(myProducts || {}).filter(Boolean), [myProducts]);
  const recommended = useMemo(() => {
    const wanted = new Set(recommendedProductIds || []);
    return ALL_PRODUCTS.filter((product) => wanted.has(product?.id));
  }, [recommendedProductIds]);

  const visualPool = useMemo(() => {
    const products = uniqueProducts([...recommended, ...owned, ...ALL_PRODUCTS]).filter(hasImage);
    return products.length >= 12 ? products : uniqueProducts([...recommended, ...owned, ...ALL_PRODUCTS]);
  }, [recommended, owned]);

  const heroProducts = useMemo(() => [visualPool[0], visualPool[4], visualPool[8]].filter(Boolean), [visualPool]);
  const featuredProducts = useMemo(() => [visualPool[1], visualPool[3], visualPool[6], visualPool[10]].filter(Boolean), [visualPool]);
  const personalizedProducts = useMemo(
    () => uniqueProducts([...recommended, ...owned, ...visualPool]).slice(0, 4),
    [recommended, owned, visualPool],
  );

  const personalizedUnlocked = Boolean(user && (hasProfile || ecosystemCount > 0 || recommendedProductIds?.length));
  const name = firstName(user);
  const profileSignals = Array.isArray(profileCategories) ? profileCategories.filter(Boolean).slice(0, 2) : [];

  const submitSearch = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    onViewDiscovery?.(discoveryTargetFor(query));
  };

  React.useEffect(() => {
    if (!initialCategory) return;
    const area = CARE_AREAS.find((item) => item.query.toLowerCase().includes(String(initialCategory).toLowerCase()));
    if (area) onViewDiscovery?.(discoveryTargetFor(area.query));
  }, [initialCategory, onViewDiscovery]);

  return (
    <main className="v6-home-shell v6e-home">
      <section className="v6e-hero" aria-labelledby="v6e-home-title">
        <div className="v6e-hero__copy">
          <div className="v6e-kicker">personalized women&apos;s health</div>
          <h1 id="v6e-home-title">women&apos;s health,<br/>made for <em>you.</em></h1>
          <p>Find products, care, and support that make sense for your body, your goals, and your everyday life.</p>

          <form className="v6e-search" onSubmit={submitSearch} role="search">
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, symptoms, goals, or health needs"
              aria-label="Search ayna"
            />
            <button type="submit" aria-label="Search ayna">→</button>
          </form>

          <div className="v6e-hero__actions">
            <button type="button" className="v6e-button v6e-button--dark" onClick={onStartQuiz}>build my health profile</button>
            <button type="button" className="v6e-text-link" onClick={() => onViewDiscovery?.('')}>browse everything</button>
          </div>
        </div>

        <div className="v6e-hero__visual" aria-label="Curated women&apos;s health products">
          <div className="v6e-hero__haze" />
          {heroProducts.map((product, index) => (
            <button
              type="button"
              key={product?.id || product?.name || index}
              className={`v6e-hero-product v6e-hero-product--${index + 1}`}
              onClick={() => onOpenProduct?.(product)}
              aria-label={`View ${product?.name || 'featured product'}`}
            >
              <ProductVisual product={product} />
            </button>
          ))}
          <div className="v6e-hero__caption">
            <span>curated for real life</span>
            <small>period care · hormones · comfort · everyday health</small>
          </div>
        </div>
      </section>

      <section className="v6e-needs" aria-labelledby="v6e-needs-title">
        <div className="v6e-section-heading">
          <div>
            <div className="v6e-kicker">start where you are</div>
            <h2 id="v6e-needs-title">what do you need help with?</h2>
          </div>
          <p>Explore the marketplace by the health need that matters to you today.</p>
        </div>
        <div className="v6e-needs-grid">
          {CARE_AREAS.map((area) => (
            <button key={area.label} type="button" onClick={() => onViewDiscovery?.(discoveryTargetFor(area.query))}>
              <span>{area.label}</span><span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </section>

      <section className="v6e-personalized" aria-labelledby="v6e-personalized-title">
        <div className="v6e-personalized__copy">
          <div className="v6e-kicker">made around you</div>
          <h2 id="v6e-personalized-title">
            {personalizedUnlocked && name ? <>your health, <em>{name}.</em></> : <>personalized without<br/><em>the overwhelm.</em></>}
          </h2>
          <p>
            {personalizedUnlocked
              ? 'Your profile helps ayna narrow a huge marketplace into options that better fit your health needs and preferences.'
              : 'Build a health profile to turn a huge marketplace into a smaller, more relevant place to start.'}
          </p>
          <button
            type="button"
            className="v6e-button v6e-button--dark"
            onClick={personalizedUnlocked ? onViewEcosystem : () => triggerExistingSignIn(onStartQuiz)}
          >
            {personalizedUnlocked ? 'open my ecosystem' : 'sign in to see my matches'}
          </button>
        </div>

        <div className={`v6e-personalized__preview${personalizedUnlocked ? '' : ' is-locked'}`}>
          <div className="v6e-preview-grid">
            {personalizedProducts.slice(0, 3).map((product) => (
              <ProductCard key={product?.id || product?.name} product={product} onOpenProduct={onOpenProduct} showMatch={personalizedUnlocked} />
            ))}
          </div>
          {!personalizedUnlocked && (
            <div className="v6e-personalized-lock">
              <LockIcon />
              <strong>your matches are waiting</strong>
              <span>sign in or build your health profile to see what fits you.</span>
              <button type="button" onClick={() => triggerExistingSignIn(onStartQuiz)}>sign in</button>
            </div>
          )}
        </div>
      </section>

      <section className="v6e-shop" aria-labelledby="v6e-shop-title">
        <div className="v6e-section-heading v6e-section-heading--rule">
          <div>
            <div className="v6e-kicker">from the marketplace</div>
            <h2 id="v6e-shop-title">a few places to start.</h2>
          </div>
          <button type="button" className="v6e-text-link" onClick={() => onViewDiscovery?.('')}>browse all products</button>
        </div>
        <div className="v6e-product-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={product?.id || product?.name} product={product} onOpenProduct={onOpenProduct} />
          ))}
        </div>
      </section>

      <section className="v6e-statement">
        <div className="v6e-kicker">less searching, more clarity</div>
        <h2>your health shouldn&apos;t require <em>47 tabs.</em></h2>
      </section>

      <section className="v6e-ecosystem" aria-labelledby="v6e-ecosystem-title">
        <div className="v6e-ecosystem__visual">
          {personalizedProducts.slice(0, 4).map((product, index) => (
            <button
              type="button"
              key={product?.id || product?.name || index}
              className={`v6e-ecosystem-product v6e-ecosystem-product--${index + 1}`}
              onClick={() => onOpenProduct?.(product)}
              aria-label={`View ${product?.name || 'product'}`}
            >
              <ProductVisual product={product} />
            </button>
          ))}
        </div>
        <div className="v6e-ecosystem__copy">
          <div className="v6e-kicker">my ecosystem</div>
          <h2 id="v6e-ecosystem-title">your health,<br/><em>in one place.</em></h2>
          <p>Keep what you use, save what you are considering, and come back to recommendations without rebuilding the whole search every time.</p>
          <div className="v6e-ecosystem__facts">
            <div><small>in your ecosystem</small><strong>{ecosystemCount || (user ? owned.length : 'private')}</strong></div>
            <div><small>personal profile</small><strong>{hasProfile ? 'ready' : 'your choice'}</strong></div>
          </div>
          {profileSignals.length > 0 && (
            <div className="v6e-ecosystem__signals">
              <small>currently shaping your experience</small>
              <span>{profileSignals.join(' · ')}</span>
            </div>
          )}
          <button type="button" className="v6e-button v6e-button--outline" onClick={user ? onViewEcosystem : () => triggerExistingSignIn(onStartQuiz)}>
            {user ? 'open my ecosystem' : 'sign in to build mine'}
          </button>
        </div>
      </section>

      <section className="v6e-starting-point" aria-labelledby="v6e-starting-title">
        <div>
          <div className="v6e-kicker">your starting point</div>
          <h2 id="v6e-starting-title">this is where you are <em>today.</em></h2>
        </div>
        <div className="v6e-starting-point__copy">
          <p>Create a private health profile once, then use it as the starting point for discovery, your ecosystem, and future check-ins.</p>
          <button type="button" className="v6e-button v6e-button--light" onClick={onStartQuiz}>{hasProfile ? 'update my starting point' : 'save my starting point'}</button>
        </div>
      </section>

      <section className="v6e-trust" aria-labelledby="v6e-trust-title">
        <div className="v6e-section-heading">
          <div>
            <div className="v6e-kicker">built for trust</div>
            <h2 id="v6e-trust-title">health information should feel clear.</h2>
          </div>
        </div>
        <div className="v6e-trust-grid">
          {TRUST_POINTS.map(([number, title, copy]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
