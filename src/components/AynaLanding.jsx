import React, { useMemo, useState } from 'react';
import { ALL_PRODUCTS } from '../data/products';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import '../v6Real.css';
import '../v6CanvaHome.css';

const NEEDS = [
  ['Periods', 'period cramps'],
  ['Hormones + PCOS', 'hormones pcos'],
  ['Sleep + energy', 'sleep energy'],
  ['Fertility + pregnancy', 'fertility pregnancy'],
  ['Vaginal health', 'vaginal health'],
  ['Skin + hair', 'skin hair'],
  ['Menopause', 'menopause'],
];

const TRUST = [
  ['01', 'Personal to you', 'Discovery can use your health needs, goals, life stage, and preferences when you choose to personalize.'],
  ['02', 'Evidence in context', 'See research, safety information, and useful context without turning product discovery into a diagnosis.'],
  ['03', 'Partnerships labeled', 'Commercial relationships are identified and do not determine your personalized Health Match.'],
  ['04', 'Your health stays yours', 'Sensitive health information is treated differently from ordinary browsing and product analytics.'],
];

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

function matchPercent(product) {
  const raw = product?.matchPercentage ?? product?.matchScore ?? product?.score;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  const normalized = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
  return Math.max(0, Math.min(100, normalized));
}

function priceText(product) {
  const value = product?.priceDisplay ?? product?.displayPrice ?? product?.price ?? product?.price_text;
  if (value == null || value === '') return '';
  if (typeof value === 'number') return `$${value.toFixed(2)}`;
  return String(value);
}

function brandText(product) {
  return product?.brand || product?.brandName || 'ayna';
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

function ProductImage({ product }) {
  return (
    <ProductTileImage
      product={product}
      alt={product?.name || ''}
      imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
      letterNode={<ProductImageFallback />}
    />
  );
}

function ProductCard({ product, user, onOpenProduct }) {
  if (!product) return null;
  const score = user ? matchPercent(product) : null;
  return (
    <article className="canva-product" tabIndex={0} onClick={() => onOpenProduct?.(product)} onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') onOpenProduct?.(product);
    }}>
      <div className="canva-product__media">
        <ProductImage product={product} />
        {score != null && (
          <div className="canva-product__match" aria-label={`${score}% Health Match`}>
            <strong>{score}%</strong><span>match</span>
          </div>
        )}
      </div>
      <p className="canva-product__brand">{brandText(product)}</p>
      <h3>{product.name}</h3>
      {priceText(product) && <p className="canva-product__price">{priceText(product)}</p>}
    </article>
  );
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
  recommendedProductIds = [],
}) {
  const [query, setQuery] = useState('');

  const owned = useMemo(() => Object.values(myProducts || {}), [myProducts]);
  const recommended = useMemo(() => {
    const byId = new Map(ALL_PRODUCTS.map((product) => [product?.id, product]));
    return (recommendedProductIds || []).map((id) => byId.get(id)).filter(Boolean);
  }, [recommendedProductIds]);

  const visualProducts = useMemo(() => {
    const all = uniqueProducts([...owned, ...recommended, ...ALL_PRODUCTS]).filter(hasImage);
    return all.length ? all : uniqueProducts([...owned, ...recommended, ...ALL_PRODUCTS]);
  }, [owned, recommended]);

  const featured = visualProducts.slice(0, 4);
  const previewProduct = featured[0] || null;
  const previewScore = user ? matchPercent(previewProduct) : null;
  const personalizedUnlocked = Boolean(user && (hasProfile || ecosystemCount > 0 || recommendedProductIds?.length));

  const submitSearch = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    onViewDiscovery?.(discoveryTargetFor(query));
  };

  const goTo = (path) => {
    window.location.assign(path);
  };

  return (
    <main className="canva-home">
      <section className="canva-home__frame canva-hero">
        <div className="canva-hero__copy canva-paper">
          <div className="canva-hero__text">
            <p className="canva-kicker">personalized women&apos;s health</p>
            <h1 className="canva-display">women&apos;s health, made for you.</h1>
            <p className="canva-hero__lede">Find products, care, and support that make sense for your body, your goals, and your everyday life.</p>
          </div>
          <form className="canva-search" onSubmit={submitSearch} role="search">
            <SearchIcon />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, symptoms, goals, or health needs" aria-label="Search ayna" />
            <button type="submit">search</button>
          </form>
        </div>
        <div className="canva-hero__visual canva-film">
          <img src="/landing-bg.png" alt="" aria-hidden="true" />
          <p className="canva-hero__caption">health discovery should feel clear, personal, and a little more human.</p>
        </div>
      </section>

      <section className="canva-section">
        <div className="canva-section-head">
          <div>
            <p className="canva-kicker">start where you are</p>
            <h2 className="canva-display">what do you need help with?</h2>
          </div>
          <p>Browse by the health need that matters to you, then narrow down with real products and context.</p>
        </div>
        <div className="canva-needs" aria-label="Browse health needs">
          {NEEDS.map(([label, value]) => (
            <button key={label} type="button" onClick={() => onViewDiscovery?.(discoveryTargetFor(value))}>{label}</button>
          ))}
        </div>
      </section>

      <section className="canva-section" style={{ paddingTop: 0 }}>
        <div className="canva-matches">
          <div className="canva-matches__copy">
            <p className="canva-kicker">made around you</p>
            <h2 className="canva-display">personalized discovery, without the noise.</h2>
            <p>Build your health profile to make Browse more relevant to your needs, life stage, goals, and preferences.</p>
            <button type="button" className="canva-primary" onClick={onStartQuiz}>{user ? 'update my health profile' : 'build my health profile'}</button>
          </div>
          <div className="canva-matches__preview">
            <div className="canva-match-card">
              <div className="canva-match-card__top">
                <div>
                  <p className="canva-match-card__brand">{previewProduct ? brandText(previewProduct) : 'ayna'}</p>
                  <p className="canva-match-card__name">{previewProduct?.name || 'your personalized matches'}</p>
                </div>
                {personalizedUnlocked && previewScore != null ? (
                  <div className="canva-match-card__score">{previewScore}%</div>
                ) : null}
              </div>
              <div className="canva-match-card__locked">{personalizedUnlocked ? 'Based on the health information and preferences you chose to share.' : 'Sign in and build your health profile to see your real Match.'}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="canva-section canva-shop">
        <div className="canva-shop__header">
          <div>
            <p className="canva-kicker">shop ayna</p>
            <h2 className="canva-display">a few places to start.</h2>
          </div>
          <button type="button" onClick={() => onViewDiscovery?.('')}>browse all</button>
        </div>
        <div className="canva-products">
          {featured.map((product) => <ProductCard key={product?.id || product?.name} product={product} user={user} onOpenProduct={onOpenProduct} />)}
        </div>
      </section>

      <section className="canva-statement canva-film">
        <p className="canva-kicker">the point</p>
        <h2 className="canva-display">your health shouldn&apos;t require 47 tabs.</h2>
      </section>

      <section className="canva-ecosystem">
        <div className="canva-ecosystem__media">
          <img src="/landing-bg.png" alt="" aria-hidden="true" />
        </div>
        <div className="canva-ecosystem__copy canva-paper">
          <p className="canva-kicker">my ecosystem</p>
          <h2 className="canva-display">your health, in one place.</h2>
          <p>Keep what you use, what you saved, what you&apos;re considering, and what ayna recommends together without turning your health into a dashboard.</p>
          <div className="canva-ecosystem__stats">
            <div className="canva-ecosystem__stat"><small>in your ecosystem</small><strong>{user ? `${ecosystemCount} ${ecosystemCount === 1 ? 'item' : 'items'}` : 'sign in to build yours'}</strong></div>
            <div className="canva-ecosystem__stat"><small>personalization</small><strong>{hasProfile ? 'health profile connected' : 'ready when you are'}</strong></div>
          </div>
          <div className="canva-baseline"><small>your starting point</small><p>Save a baseline, come back later, and let your recommendations evolve with you.</p></div>
          <button type="button" className="canva-secondary" onClick={user ? onViewEcosystem : onStartQuiz}>{user ? 'open my ecosystem' : 'save my starting point'}</button>
        </div>
      </section>

      <section className="canva-section">
        <div className="canva-section-head">
          <div>
            <p className="canva-kicker">why trust ayna</p>
            <h2 className="canva-display">clearer by design.</h2>
          </div>
        </div>
        <div className="canva-trust">
          {TRUST.map(([number, title, copy]) => (
            <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section className="canva-about canva-film">
        <div className="canva-about__grid">
          <div>
            <p className="canva-kicker" style={{ color: '#FFC774' }}>about ayna</p>
            <h2 className="canva-display">women&apos;s health should feel less fragmented.</h2>
          </div>
          <div>
            <p>ayna brings product discovery, care, education, and your own health context into one place so finding what fits you feels simpler.</p>
            <button type="button" onClick={() => goTo('/about')}>about ayna</button>
          </div>
        </div>
      </section>
    </main>
  );
}
