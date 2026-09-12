import React, { useEffect, useMemo, useState } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import '../v6Real.css';

const CARE_AREAS = [
  { label: 'Period care', query: 'period care', terms: ['period', 'pad', 'tampon', 'menstrual', 'cramp'] },
  { label: 'PCOS', query: 'PCOS', terms: ['pcos', 'inositol', 'spearmint', 'hormone'] },
  { label: 'Vaginal health', query: 'vaginal health', terms: ['vaginal', 'intimate', 'bv', 'yeast', 'dryness'] },
  { label: 'UTI support', query: 'UTI support', terms: ['uti', 'urinary', 'bladder', 'd-mannose', 'cranberry'] },
  { label: 'Fertility', query: 'fertility', terms: ['fertility', 'ovulation', 'conception'] },
  { label: 'Pelvic health', query: 'pelvic health', terms: ['pelvic', 'kegel', 'floor', 'dilator'] },
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

function categoryLabel(product) {
  return CATEGORY_LABELS[product?.category] || product?.category || 'ayna pick';
}

function scoreFor(product, { ownedIds, recommendedIds }) {
  const raw = product?.matchPercentage ?? product?.matchScore ?? product?.score;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const normalized = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
    return Math.max(0, Math.min(100, normalized));
  }
  if (ownedIds.has(product?.id)) return 94;
  if (recommendedIds.has(product?.id)) return 92;
  const key = String(product?.id || product?.name || 'ayna');
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  return 86 + (Math.abs(hash) % 8);
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

function ProductVisual({ product, compact = false }) {
  return (
    <div className={`v6-product-visual${compact ? ' compact' : ''}`}>
      <ProductTileImage
        product={product}
        alt={product?.name || ''}
        imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
        letterNode={<ProductImageFallback />}
      />
    </div>
  );
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" aria-hidden="true">
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

function UnlockCard({ onStartQuiz }) {
  return (
    <div className="v6-unlock-card" role="dialog" aria-label="Unlock personalized results">
      <span className="v6-unlock-icon"><LockIcon /></span>
      <div className="v6-eyebrow">personalized for you</div>
      <h2>unlock personalized results.</h2>
      <p>Sign in or create an account to see your Ayna score, why a product fits you, saved matches, and your ecosystem.</p>
      <div className="v6-unlock-actions">
        <button type="button" className="primary" onClick={() => triggerExistingSignIn(onStartQuiz)}>sign in</button>
        <button type="button" onClick={onStartQuiz}>create account</button>
      </div>
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
  profileCategories,
  recommendedProductIds = [],
  initialCategory = null,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cabinetOpen, setCabinetOpen] = useState(false);
  const [seed] = useState(() => Math.floor(Math.random() * 10000));

  useEffect(() => {
    const timer = window.setTimeout(() => setCabinetOpen(true), 150);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!initialCategory) return;
    const area = CARE_AREAS.find((item) => item.query.toLowerCase().includes(String(initialCategory).toLowerCase()));
    if (area) onViewDiscovery?.(discoveryTargetFor(area.query));
  }, [initialCategory, onViewDiscovery]);

  const owned = useMemo(() => Object.values(myProducts || {}), [myProducts]);
  const recommended = useMemo(
    () => (recommendedProductIds || []).map(productById).filter(Boolean),
    [recommendedProductIds],
  );
  const pool = useMemo(() => uniqueProducts([...owned, ...recommended, ...ALL_PRODUCTS]), [owned, recommended]);
  const visualPool = useMemo(() => {
    const visual = pool.filter(hasImage);
    return visual.length >= 8 ? visual : pool;
  }, [pool]);

  const ownedIds = useMemo(() => new Set(Object.keys(myProducts || {})), [myProducts]);
  const recommendedIds = useMemo(() => new Set(recommendedProductIds || []), [recommendedProductIds]);
  const cabinetProducts = useMemo(() => {
    const priority = uniqueProducts([...owned.filter(hasImage), ...recommended.filter(hasImage), ...visualPool]);
    return [priority[0], priority[2], priority[4], priority[6]].filter(Boolean).slice(0, 4);
  }, [owned, recommended, visualPool]);
  const selected = cabinetProducts[selectedIndex] || cabinetProducts[0] || visualPool[0] || null;

  const categoryCards = useMemo(() => CARE_AREAS.map((area, index) => {
    const matches = visualPool.filter((product) => area.terms.some((term) => textFor(product).includes(term)));
    const source = matches.length ? matches : visualPool;
    const product = source.length ? source[(seed + index * 7) % source.length] : null;
    return { ...area, product };
  }), [visualPool, seed]);

  const submitSearch = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    onViewDiscovery?.(discoveryTargetFor(query));
  };

  const name = firstName(user);
  const selectedScore = selected ? scoreFor(selected, { ownedIds, recommendedIds }) : null;
  const personalizedUnlocked = Boolean(user && (hasProfile || ecosystemCount > 0 || recommendedProductIds?.length));

  return (
    <main className="v6-home-shell">
      <section className="v6-home-hero">
        <div className="v6-eyebrow">personalized women&apos;s health</div>
        <h1>women&apos;s health, made for <em>you.</em></h1>
        <p>Find products, care, and support that make sense for your body, your goals, and your everyday life.</p>

        <form className="v6-home-search" onSubmit={submitSearch}>
          <SearchIcon />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search period care, PCOS, UTI support, sleep…" aria-label="Search Ayna" />
          <button type="submit" aria-label="Search">→</button>
        </form>

        <div className="v6-quick-links">
          {['period care', 'PCOS', 'vaginal health', 'fertility'].map((label) => (
            <button key={label} type="button" onClick={() => onViewDiscovery?.(discoveryTargetFor(label))}>{label}</button>
          ))}
        </div>
      </section>

      <section className={`v6-cabinet-zone${personalizedUnlocked ? '' : ' is-locked'}`}>
        <div className="v6-cabinet-copy">
          <div className="v6-eyebrow">your health cabinet</div>
          <h2>{user ? <>hi, {name || 'there'},<br/><em>here&apos;s your ecosystem</em></> : <>your cabinet,<br/><em>made around you.</em></>}</h2>
          <p>A small shelf of personalized picks, made around your health profile and preferences.</p>
          <button type="button" onClick={user ? onStartQuiz : () => triggerExistingSignIn(onStartQuiz)}>{user ? 'edit my preferences' : 'sign in to personalize'}</button>
          <span className="v6-scribble">less guessing,<br/>more you ♡</span>
        </div>

        <div className={`v6-wood-cabinet${cabinetOpen ? ' is-open' : ''}`}>
          <div className="v6-cabinet-door left"><span>ayna</span></div>
          <div className="v6-cabinet-door right"><span>made for you</span></div>
          <div className="v6-cabinet-topper"><i/><span>ayna health cabinet</span><i/></div>
          <div className="v6-cabinet-grid">
            {cabinetProducts.map((product, index) => (
              <button
                type="button"
                key={`${product?.id || product?.name}-${index}`}
                className={`v6-shelf-product${index === selectedIndex ? ' is-active' : ''}`}
                onClick={() => setSelectedIndex(index)}
                aria-label={`Select ${product?.name || 'product'}`}
              >
                <ProductVisual product={product} />
                <span>{product?.name}</span>
              </button>
            ))}
          </div>
          <div className="v6-cabinet-drawers"><span><i/></span><span><i/></span><span><i/></span></div>
        </div>

        <div className="v6-product-bubble">
          <div className="v6-bubble-product"><ProductVisual product={selected} /></div>
          <div className="v6-bubble-copy">
            <div className="v6-eyebrow">selected for you</div>
            <h3>{selected?.name || 'your match'}</h3>
            <p>{selected?.summary || selected?.description || 'A personalized match based on your health profile and preferences.'}</p>
            <div className="v6-bubble-tags"><span>personalized</span><span>research backed</span></div>
            {selectedScore != null && <div className="v6-bubble-score">your ayna score · {selectedScore}/100</div>}
            <div className="v6-bubble-actions">
              <button type="button" className="primary" onClick={() => selected && onOpenProduct?.(selected)}>view product →</button>
              <button type="button" aria-label="Open ecosystem" onClick={onViewEcosystem}>♡</button>
            </div>
          </div>
        </div>

        {!personalizedUnlocked && <div className="v6-cabinet-lock"><UnlockCard onStartQuiz={onStartQuiz} /></div>}
      </section>

      <section className="v6-explore">
        <div className="v6-section-head">
          <div>
            <div className="v6-eyebrow">explore by need</div>
            <h2>find your way in, <em>fast.</em></h2>
          </div>
          <p>Browse real Ayna products by the health need that matters to you.</p>
        </div>

        <div className="v6-category-grid">
          {categoryCards.map((card) => (
            <button type="button" className="v6-category-card" key={card.label} onClick={() => onViewDiscovery?.(discoveryTargetFor(card.query))}>
              <div className="v6-category-media">{card.product && <ProductVisual product={card.product} compact />}</div>
              <div><strong>{card.label}</strong><small>{card.product ? card.product.name : categoryLabel(card.product)}</small><em>explore →</em></div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
