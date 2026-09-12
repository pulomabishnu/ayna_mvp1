import React, { useMemo, useState } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import '../daintyAyna.css';

const CARE_AREAS = [
  { label: 'Period care', query: 'period care', keywords: ['pad', 'tampon', 'period', 'menstrual'] },
  { label: 'PCOS', query: 'PCOS', keywords: ['pcos', 'inositol', 'spearmint'] },
  { label: 'Vaginal health', query: 'vaginal health', keywords: ['vaginal', 'intimate', 'bv', 'yeast'] },
  { label: 'UTI support', query: 'UTI support', keywords: ['uti', 'urinary', 'bladder'] },
  { label: 'Fertility', query: 'fertility', keywords: ['fertility', 'ovulation', 'conception'] },
  { label: 'Pelvic health', query: 'pelvic health', keywords: ['pelvic', 'kegel', 'floor'] },
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

function productById(id) {
  return ALL_PRODUCTS.find((product) => product?.id === id) || null;
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

function ProductImage({ product, className = '' }) {
  return (
    <div className={`dainty-product-image ${className}`}>
      <ProductTileImage
        product={product}
        alt={product?.name || ''}
        imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
        letterNode={<ProductImageFallback />}
      />
    </div>
  );
}

function categoryLabel(product) {
  return CATEGORY_LABELS[product?.category] || product?.category || 'Ayna pick';
}

export default function AynaLanding({
  onStartQuiz,
  onViewDiscovery,
  onOpenProduct,
  onViewEcosystem,
  user,
  myProducts,
  ecosystemCount = 0,
  recommendedProductIds = [],
}) {
  const [query, setQuery] = useState('');
  const [seed] = useState(() => Math.floor(Math.random() * 10000));
  const name = firstName(user);

  const pool = useMemo(() => {
    const owned = Object.values(myProducts || {});
    const recommended = (recommendedProductIds || []).map(productById).filter(Boolean);
    return uniqueProducts([...owned, ...recommended, ...ALL_PRODUCTS]);
  }, [myProducts, recommendedProductIds]);

  const heroProducts = useMemo(() => {
    const visual = pool.filter((product) => product?.image || product?.imageUrl || product?.images?.length);
    return (visual.length >= 4 ? visual : pool).slice(0, 4);
  }, [pool]);

  const categoryCards = useMemo(() => CARE_AREAS.map((care, index) => {
    const matches = pool.filter((product) => care.keywords.some((keyword) => productText(product).includes(keyword)));
    const source = matches.length ? matches : pool;
    const product = source.length ? source[(seed + index * 7) % source.length] : null;
    return { ...care, product };
  }), [pool, seed]);

  const submitSearch = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    onViewDiscovery?.(discoveryTargetFor(query));
  };

  return (
    <main className="dainty-home-shell">
      <section className="dainty-home-hero">
        <div className="dainty-eyebrow">personalized women&apos;s health</div>
        <h1>women&apos;s health, made for <em>you.</em></h1>
        <p className="dainty-home-hero__copy">Find products, care, and support that make sense for your body, your goals, and your everyday life.</p>

        <form className="dainty-search" onSubmit={submitSearch}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.4 16.4 4.1 4.1"/></svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, brands, or health needs…"
            aria-label="Search Ayna"
          />
          <button type="submit" aria-label="Search">→</button>
        </form>

        <div className="dainty-quick-links">
          {['period care', 'PCOS', 'vaginal health', 'fertility'].map((label) => (
            <button key={label} type="button" onClick={() => onViewDiscovery?.(discoveryTargetFor(label))}>{label}</button>
          ))}
        </div>
      </section>

      <section className="dainty-editorial-stage" aria-label="Ayna personalized health preview">
        <span className="dainty-hand-note dainty-hand-note--left">made around<br/>your real life</span>
        <span className="dainty-hand-note dainty-hand-note--right">less guessing,<br/>more you</span>

        {heroProducts[1] && (
          <button type="button" className="dainty-stage-prop dainty-stage-prop--left" onClick={() => onOpenProduct?.(heroProducts[1])}>
            <ProductImage product={heroProducts[1]} />
          </button>
        )}
        {heroProducts[2] && (
          <button type="button" className="dainty-stage-prop dainty-stage-prop--right" onClick={() => onOpenProduct?.(heroProducts[2])}>
            <ProductImage product={heroProducts[2]} />
          </button>
        )}

        <article className="dainty-stage-preview">
          <div className="dainty-eyebrow">{user ? 'your health universe' : 'personalized for you'}</div>
          <h2>{user ? `hi, ${name || 'there'}.` : 'your health universe starts here.'}</h2>
          <p>{user ? 'A few things Ayna is keeping close for you.' : 'Explore freely, or create your ecosystem for personalized matches.'}</p>

          <div className="dainty-preview-list">
            {heroProducts.slice(0, 3).map((product) => (
              <button type="button" className="dainty-preview-row" key={product?.id || product?.name} onClick={() => onOpenProduct?.(product)}>
                <ProductImage product={product} />
                <span>
                  <strong>{product?.name}</strong>
                  <small>{categoryLabel(product)}</small>
                </span>
                <b>→</b>
              </button>
            ))}
          </div>

          <button type="button" className="dainty-preview-link" onClick={user ? onViewEcosystem : onStartQuiz}>
            <span>{user ? 'open my ecosystem' : 'build my ecosystem'}</span><span>→</span>
          </button>
        </article>

        <div className="dainty-stage-proof" aria-hidden="true">
          <span>real products</span><span>personalized matches</span><span>your preferences</span>
        </div>
      </section>

      <section className="dainty-home-section">
        <div className="dainty-section-top">
          <div>
            <div className="dainty-eyebrow">browse without the clutter</div>
            <h2>explore by <em>need.</em></h2>
          </div>
          <p>Real products from the Ayna catalog. The product shown for each need can rotate when you come back.</p>
        </div>

        <div className="dainty-need-grid">
          {categoryCards.map((card) => (
            <button type="button" className="dainty-need-card" key={card.label} onClick={() => onViewDiscovery?.(discoveryTargetFor(card.query))}>
              <div className="dainty-need-card__media">
                <span className="dainty-refresh-tag">refresh pick</span>
                {card.product && <ProductImage product={card.product} />}
              </div>
              <div className="dainty-need-card__copy">
                <h3>{card.label}</h3>
                <p>{card.product?.name || 'Explore products'}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="dainty-universe-strip">
        <div className="dainty-universe-strip__copy">
          <div className="dainty-eyebrow dainty-eyebrow--warm">my ecosystem</div>
          <h3>{user ? <>hi, {name || 'there'}. this is your <em>health universe.</em></> : <>make this universe <em>yours.</em></>}</h3>
          <p>{user
            ? 'Each bubble is an area of care. Tap one to see what is in it, why it was matched, and your personalized product score.'
            : 'Create an account to save products, see your scores, and build your personalized ecosystem.'}</p>
          <div className="dainty-universe-strip__actions">
            <button type="button" className="dainty-light-button" onClick={user ? onViewEcosystem : onStartQuiz}>{user ? 'open my ecosystem' : 'create my ecosystem'}</button>
            <button type="button" className="dainty-ghost-button" onClick={() => onViewDiscovery?.('')}>browse products</button>
          </div>
        </div>

        <div className="dainty-mini-orbit" aria-hidden="true">
          <div className="dainty-mini-center">{user ? (name || 'you') : 'you'}</div>
          <span className="dainty-mini-dot d1">Period</span>
          <span className="dainty-mini-dot d2">PCOS</span>
          <span className="dainty-mini-dot d3">Pelvic</span>
          <span className="dainty-mini-dot d4">UTI</span>
        </div>
      </section>

      {user && ecosystemCount > 0 && (
        <div className="dainty-home-footnote">{ecosystemCount} saved {ecosystemCount === 1 ? 'product' : 'products'} in your ecosystem</div>
      )}
    </main>
  );
}
