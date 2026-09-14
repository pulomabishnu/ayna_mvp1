import React, { useEffect, useMemo, useState } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';

const NEEDS = [
  { label: 'Periods + cramps', query: 'period cramps', terms: ['period', 'pad', 'tampon', 'menstrual', 'cramp'] },
  { label: 'Hormones + PCOS', query: 'hormones pcos', terms: ['pcos', 'inositol', 'spearmint', 'hormone'] },
  { label: 'Sleep + energy', query: 'sleep energy', terms: ['sleep', 'fatigue', 'energy', 'melatonin'] },
  { label: 'Fertility + pregnancy', query: 'fertility pregnancy', terms: ['fertility', 'ovulation', 'pregnancy', 'prenatal'] },
  { label: 'Vaginal health', query: 'vaginal health', terms: ['vaginal', 'intimate', 'bv', 'yeast', 'dryness'] },
  { label: 'Skin + hair', query: 'skin hair', terms: ['skin', 'hair', 'acne', 'hair loss'] },
  { label: 'Menopause', query: 'menopause', terms: ['menopause', 'perimenopause', 'hot flash', 'dryness'] },
];

const TRUST = [
  ['01', 'Personal to you', 'Your health context and preferences shape what you see.'],
  ['02', 'Evidence in context', 'Research, clinician context, and product information stay visible.'],
  ['03', 'Partnerships labeled', 'Commercial relationships are disclosed and do not decide your Match.'],
  ['04', 'Your health stays yours', 'Your profile is there to personalize your experience, not to become ad inventory.'],
];

const LEARN = [
  ['periods + pain', 'Why period pain can feel different month to month', 'period cramps'],
  ['hormones', 'A calmer way to compare products for PCOS and hormone support', 'PCOS'],
  ['vaginal health', 'What to look for before buying intimate-health products', 'vaginal health'],
];

function firstName(user) {
  const meta = user?.user_metadata || {};
  const raw = meta.first_name || meta.firstName || meta.given_name || meta.full_name || meta.name || '';
  return String(raw).trim().split(/\s+/).filter(Boolean)[0] || '';
}

function textFor(product) {
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
    const key = product?.id || `${product?.brand || ''}:${product?.name || ''}`;
    if (!product?.name || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function productById(id) {
  return ALL_PRODUCTS.find((product) => product?.id === id) || null;
}

function hasImage(product) {
  return Boolean(
    product?.image || product?.imageUrl || product?.image_url || product?.thumbnail ||
    (Array.isArray(product?.images) && product.images.length)
  );
}

function brandText(product) {
  return product?.brand || product?.brandName || CATEGORY_LABELS[product?.category] || product?.category || 'ayna';
}

function priceText(product) {
  const raw = product?.priceDisplay ?? product?.displayPrice ?? product?.price ?? product?.priceText;
  if (raw == null || raw === '') return 'view details';
  if (typeof raw === 'number' && Number.isFinite(raw)) return `$${raw.toFixed(raw % 1 ? 2 : 0)}`;
  const text = String(raw).trim();
  if (!text) return 'view details';
  if (/^[0-9]+(?:\.[0-9]{1,2})?$/.test(text)) return `$${text}`;
  return text;
}

function scoreFor(product) {
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
  if (q.includes('pcos')) return { query, initialMacroGroup: 'hormones' };
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

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" width="14" height="14">
      <rect x="6.5" y="10.5" width="11" height="8.5" rx="2" />
      <path d="M9 10.5V8a3 3 0 0 1 6 0v2.5" />
    </svg>
  );
}

function triggerExistingSignIn(fallback) {
  const buttons = Array.from(document.querySelectorAll('button'));
  const target = buttons.find((button) => /^sign\s*in$/i.test(String(button.textContent || '').trim()));
  if (target) target.click();
  else fallback?.();
}

function ProductImage({ product, className = '' }) {
  if (!product) return null;
  return (
    <div className={className}>
      <ProductTileImage
        product={product}
        alt={product?.name || ''}
        imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
        letterNode={<ProductImageFallback />}
      />
    </div>
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
  initialCategory = null,
}) {
  const [query, setQuery] = useState('');
  const [searchSummary, setSearchSummary] = useState('');

  useEffect(() => {
    if (!initialCategory) return;
    onViewDiscovery?.(discoveryTargetFor(initialCategory));
  }, [initialCategory, onViewDiscovery]);

  const owned = useMemo(() => Object.values(myProducts || {}), [myProducts]);
  const recommended = useMemo(
    () => (recommendedProductIds || []).map(productById).filter(Boolean),
    [recommendedProductIds],
  );
  const pool = useMemo(() => {
    const all = uniqueProducts([...recommended, ...owned, ...ALL_PRODUCTS]);
    const withImages = all.filter(hasImage);
    return withImages.length >= 8 ? withImages : all;
  }, [owned, recommended]);

  const featured = useMemo(() => pool.slice(0, 4), [pool]);
  const heroProduct = featured[0] || pool[0] || null;
  const ecosystemProduct = featured[1] || featured[0] || pool[0] || null;
  const matchProduct = featured.find((product) => scoreFor(product) != null) || featured[0] || null;
  const name = firstName(user);
  const personalizedUnlocked = Boolean(user && (hasProfile || ecosystemCount > 0 || recommendedProductIds?.length));
  const matchScore = personalizedUnlocked ? scoreFor(matchProduct) : null;

  const learnProducts = useMemo(() => LEARN.map((entry, index) => {
    const needle = entry[2].toLowerCase();
    const terms = NEEDS.find((need) => need.query.toLowerCase() === needle)?.terms || needle.split(/\s+/);
    const found = pool.find((product) => terms.some((term) => textFor(product).includes(term)));
    return found || pool[(index + 2) % Math.max(pool.length, 1)] || null;
  }), [pool]);

  const submitSearch = (event) => {
    event.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    setSearchSummary(`Opening ayna results for “${clean}”.`);
    onViewDiscovery?.(discoveryTargetFor(clean));
  };

  const browseNeed = (need) => {
    setQuery(need.query);
    onViewDiscovery?.(discoveryTargetFor(need.query));
  };

  const openPersonalization = () => {
    if (user) onStartQuiz?.();
    else triggerExistingSignIn(onStartQuiz);
  };

  return (
    <main className="canva-live-home">
      <section className="canva-live-hero">
        <div className="canva-live-hero-copy">
          <div className="canva-live-hero-text">
            <p className="canva-live-kicker">personalized women&apos;s health</p>
            <h1 className="canva-live-editorial">women&apos;s health,<br />made for <em>you.</em></h1>
            <p className="canva-live-hero-description">Find products, care, and support that make sense for your body, your goals, and your everyday life.</p>
          </div>
          <div>
            <form className="canva-live-search" onSubmit={submitSearch} role="search">
              <SearchIcon />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, symptoms, goals, or health needs" aria-label="Search ayna" />
              <button type="submit">search</button>
            </form>
            <p className="canva-live-search-summary" aria-live="polite">{searchSummary}</p>
          </div>
        </div>
        <div className="canva-live-hero-visual">
          <ProductImage product={heroProduct} className="canva-live-hero-product" />
          <p className="canva-live-hero-caption">A calmer way to find what fits your health, without opening 47 tabs.</p>
        </div>
      </section>

      <section className="canva-live-section" aria-labelledby="browse-needs-title">
        <div className="canva-live-section-head">
          <div>
            <p className="canva-live-kicker">browse by need</p>
            <h2 id="browse-needs-title" className="canva-live-editorial">start with what&apos;s<br />on your mind.</h2>
          </div>
          <p>Explore the same real ayna catalog through the health need that matters to you right now.</p>
        </div>
        <div className="canva-live-needs">
          {NEEDS.map((need) => <button type="button" className="canva-live-chip" key={need.label} onClick={() => browseNeed(need)}>{need.label}</button>)}
        </div>
      </section>

      <section className="canva-live-matches" aria-labelledby="matches-title">
        <div className="canva-live-match-copy">
          <p className="canva-live-kicker">made around you</p>
          <h2 id="matches-title" className="canva-live-editorial">your health context changes what fits.</h2>
          <p>Build your health profile and ayna can surface products based on your needs, life stage, symptoms, preferences, and shopping priorities.</p>
          <button type="button" className="canva-live-primary" onClick={openPersonalization}>{hasProfile ? 'update my profile' : 'build my profile'}</button>
        </div>
        <div className="canva-live-match-visual">
          <div className="canva-live-match-card">
            <div className="canva-live-match-top">
              <div>
                <p className="canva-live-match-brand">{brandText(matchProduct)}</p>
                <p className="canva-live-match-name">{matchProduct?.name || 'your personalized match'}</p>
              </div>
              <div className="canva-live-match-score">{matchScore != null ? `${matchScore}%` : <LockIcon />}</div>
            </div>
            <div className="canva-live-match-note"><LockIcon /><span>{matchScore != null ? 'Match uses your real health profile.' : 'Sign in and complete your profile to reveal your Match.'}</span></div>
          </div>
        </div>
      </section>

      <section className="canva-live-shop" aria-labelledby="shop-title">
        <div className="canva-live-shop-head">
          <div>
            <p className="canva-live-kicker">the marketplace</p>
            <h2 id="shop-title" className="canva-live-editorial">products worth exploring.</h2>
          </div>
          <button type="button" className="canva-live-shop-link" onClick={() => onViewDiscovery?.('')}>browse everything</button>
        </div>
        <div className="canva-live-product-grid">
          {featured.map((product) => {
            const score = personalizedUnlocked ? scoreFor(product) : null;
            return (
              <article className="canva-live-product-card" key={product.id || product.name} tabIndex="0" onClick={() => onOpenProduct?.(product)} onKeyDown={(event) => { if (event.key === 'Enter') onOpenProduct?.(product); }}>
                <div className="canva-live-product-media">
                  <ProductTileImage product={product} alt={product?.name || ''} imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} letterNode={<ProductImageFallback />} />
                  <button type="button" className="canva-live-heart" aria-label="Open saved products" onClick={(event) => { event.stopPropagation(); onViewEcosystem?.(); }}><HeartIcon /></button>
                  {score != null && <div className="canva-live-match-bubble"><strong>{score}%</strong><span>match</span></div>}
                </div>
                <p className="canva-live-product-brand">{brandText(product)}</p>
                <h3 className="canva-live-product-name">{product.name}</h3>
                <p className="canva-live-product-price">{priceText(product)}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="canva-live-dark">
        <p className="canva-live-kicker">less noise. more context.</p>
        <h2 className="canva-live-editorial">your health shouldn&apos;t require 47 tabs.</h2>
      </section>

      <section className="canva-live-ecosystem" aria-labelledby="ecosystem-home-title">
        <div className="canva-live-ecosystem-visual">
          <ProductImage product={ecosystemProduct} className="canva-live-ecosystem-product" />
        </div>
        <div className="canva-live-ecosystem-copy">
          <p className="canva-live-kicker">your ecosystem</p>
          <h2 id="ecosystem-home-title" className="canva-live-editorial">one place for what you&apos;re using, saving, and considering.</h2>
          <p>{user ? `Welcome back${name ? `, ${name}` : ''}. Your ecosystem keeps your products and personalized context together.` : 'Sign in to build a personal health ecosystem that stays useful as your needs change.'}</p>
          <div className="canva-live-ecosystem-stats">
            <div className="canva-live-stat"><small>products</small><strong>{user ? ecosystemCount : 'sign in to view'}</strong></div>
            <div className="canva-live-stat"><small>health profile</small><strong>{hasProfile ? 'active' : 'not built yet'}</strong></div>
          </div>
          <div className="canva-live-baseline"><small>your starting point</small><p>{hasProfile ? 'Your saved health context is available for personalization.' : 'Build your profile once, then use it across ayna.'}</p></div>
          <button type="button" className="canva-live-secondary" onClick={user ? onViewEcosystem : openPersonalization}>{user ? 'open my ecosystem' : 'get started'}</button>
        </div>
      </section>

      <section className="canva-live-trust" aria-labelledby="trust-title">
        <p className="canva-live-kicker">how ayna earns trust</p>
        <h2 id="trust-title" className="canva-live-editorial">clearer choices, without pretending health is simple.</h2>
        <div className="canva-live-trust-grid">
          {TRUST.map(([number, title, copy]) => <div className="canva-live-trust-item" key={number}><span className="num">{number}</span><h3>{title}</h3><p>{copy}</p></div>)}
        </div>
      </section>

      <section className="canva-live-learn" aria-labelledby="learn-title">
        <div className="canva-live-learn-head"><div><p className="canva-live-kicker">learn</p><h2 id="learn-title" className="canva-live-editorial">a little more context.</h2></div></div>
        <div className="canva-live-learn-grid">
          {LEARN.map(([category, title, search], index) => (
            <article className="canva-live-learn-card" key={title} role="button" tabIndex="0" onClick={() => onViewDiscovery?.(discoveryTargetFor(search))} onKeyDown={(event) => { if (event.key === 'Enter') onViewDiscovery?.(discoveryTargetFor(search)); }}>
              <div className="canva-live-learn-media"><ProductTileImage product={learnProducts[index]} alt="" imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} letterNode={<ProductImageFallback />} /></div>
              <p className="canva-live-learn-category">{category}</p>
              <h3>{title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="canva-live-about">
        <div><p className="canva-live-kicker">about ayna</p><h2 className="canva-live-editorial">women&apos;s health discovery, designed around the person buying.</h2></div>
        <div><p>ayna brings product discovery, health context, evidence, and your own preferences into one experience so finding what fits feels less fragmented.</p><button type="button" onClick={openPersonalization}>build your starting point</button></div>
      </section>
    </main>
  );
}
