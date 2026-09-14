import React, { useEffect, useMemo, useState } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';
import '../v6Real.css';
import '../v6CanvaHome.css';
import '../v6CanvaTextHome.css';

const NEEDS = [
  ['Periods', 'period care'],
  ['Hormones + PCOS', 'hormones pcos'],
  ['Vaginal health', 'vaginal health'],
  ['UTI support', 'uti support'],
  ['Fertility', 'fertility'],
  ['Pregnancy + postpartum', 'pregnancy postpartum'],
  ['Pelvic health', 'pelvic health'],
  ['Menopause', 'menopause'],
  ['Sleep + energy', 'sleep energy'],
  ['Skin + hair', 'skin hair'],
  ['Gut health', 'gut health'],
  ['Sexual wellness', 'sexual wellness'],
];

const QUICK = ['period care', 'PCOS', 'vaginal health', 'bloating'];

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
  return product?.brand || product?.brandName || product?.manufacturer || 'ayna';
}

function categoryText(product) {
  return CATEGORY_LABELS?.[product?.category] || String(product?.category || 'women’s health').replace(/[-_]/g, ' ');
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

function TextProductCard({ product, user, onOpenProduct }) {
  if (!product) return null;
  const score = user ? matchPercent(product) : null;
  return (
    <button type="button" className="cth-product" onClick={() => onOpenProduct?.(product)}>
      <p className="cth-product__brand">{brandText(product)}</p>
      <h3>{product.name}</h3>
      {priceText(product) && <p className="cth-product__price">{priceText(product)}</p>}
      <div className="cth-product__bottom">
        <span className="cth-product__category">{categoryText(product)}</span>
        {score != null && <span className="cth-product__match" aria-label={`${score}% Health Match`}>{score}%</span>}
      </div>
    </button>
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

  const owned = useMemo(() => Object.values(myProducts || {}).filter(Boolean), [myProducts]);
  const recommended = useMemo(() => {
    const byId = new Map(ALL_PRODUCTS.map((product) => [product?.id, product]));
    return (recommendedProductIds || []).map((id) => byId.get(id)).filter(Boolean);
  }, [recommendedProductIds]);
  const products = useMemo(() => uniqueProducts([...recommended, ...owned, ...ALL_PRODUCTS]), [recommended, owned]);
  const featured = products.slice(0, 4);
  const previewProduct = recommended[0] || owned[0] || featured[0] || null;
  const previewScore = user ? matchPercent(previewProduct) : null;
  const personalizedUnlocked = Boolean(user && (hasProfile || ecosystemCount > 0 || recommendedProductIds?.length));

  useEffect(() => {
    if (!initialCategory) return;
    onViewDiscovery?.(discoveryTargetFor(initialCategory));
  }, [initialCategory, onViewDiscovery]);

  const submitSearch = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    onViewDiscovery?.(discoveryTargetFor(query));
  };

  const goTo = (path) => window.location.assign(path);

  return (
    <main className="canva-text-home">
      <section className="cth-frame cth-hero cth-paper">
        <div className="cth-hero__copy">
          <p className="cth-kicker">personalized women&apos;s health</p>
          <h1 className="cth-display">women&apos;s health, made for you.</h1>
          <p className="cth-hero__lede">Find products, care, and support that make sense for your body, your goals, and your everyday life.</p>

          <form className="cth-search" onSubmit={submitSearch} role="search">
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, symptoms, goals, or health needs"
              aria-label="Search ayna"
            />
            <button type="submit">search</button>
          </form>

          <div className="cth-quick" aria-label="Popular searches">
            {QUICK.map((item) => (
              <button key={item} type="button" onClick={() => onViewDiscovery?.(discoveryTargetFor(item))}>{item}</button>
            ))}
          </div>
        </div>
        <p className="cth-hero__note">one place to start, instead of forty-seven tabs.</p>
      </section>

      <section className="cth-frame cth-statement cth-film">
        <p className="cth-kicker">less searching, more clarity</p>
        <h2 className="cth-display">health shopping should feel personal, not impossible.</h2>
      </section>

      <section className="cth-section">
        <div className="cth-section-head">
          <div>
            <p className="cth-kicker">start where you are</p>
            <h2 className="cth-display">what do you need help with?</h2>
          </div>
          <p>Browse by the health need that matters today. No giant catalog wall, no clinical portal, no guessing where to begin.</p>
        </div>
        <div className="cth-needs" aria-label="Browse health needs">
          {NEEDS.map(([label, value], index) => (
            <button key={label} type="button" className="cth-need" onClick={() => onViewDiscovery?.(discoveryTargetFor(value))}>
              <span>{label}</span>
              <span>{String(index + 1).padStart(2, '0')} · explore</span>
            </button>
          ))}
        </div>
      </section>

      <section className="cth-section" style={{ paddingTop: 0 }}>
        <div className="cth-personal">
          <div className="cth-personal__copy">
            <p className="cth-kicker">made around you</p>
            <h2 className="cth-display">personalized discovery, without the noise.</h2>
            <p>Build your health profile to make Browse more relevant to your needs, life stage, goals, sensitivities, budget, and preferences.</p>
            <button type="button" className="cth-primary" onClick={onStartQuiz}>{user ? 'update my health profile' : 'build my health profile'}</button>
          </div>
          <div className="cth-personal__ui">
            <div className="cth-match">
              <p className="cth-match__eyebrow">your health match</p>
              <div className="cth-match__top">
                <h3>{previewProduct?.name || 'your personalized matches'}</h3>
                {personalizedUnlocked && previewScore != null && <div className="cth-match__score">{previewScore}%</div>}
              </div>
              <div className="cth-match__rule" />
              <div className="cth-match__meta">
                <div><small>brand</small><strong>{previewProduct ? brandText(previewProduct) : 'matched for you'}</strong></div>
                <div><small>category</small><strong>{previewProduct ? categoryText(previewProduct) : 'based on your profile'}</strong></div>
              </div>
              <p className="cth-match__locked">{personalizedUnlocked ? 'Your Match is based on the health information and preferences you chose to share.' : 'Sign in and build your health profile to unlock real Match percentages.'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cth-section cth-shop">
        <div className="cth-shop__head">
          <div>
            <p className="cth-kicker">from the marketplace</p>
            <h2 className="cth-display">a few places to start.</h2>
          </div>
          <button type="button" onClick={() => onViewDiscovery?.('')}>browse all products</button>
        </div>
        <div className="cth-products">
          {featured.map((product) => (
            <TextProductCard key={product?.id || product?.name} product={product} user={user} onOpenProduct={onOpenProduct} />
          ))}
        </div>
      </section>

      <section className="cth-frame cth-statement cth-film">
        <p className="cth-kicker">the point</p>
        <h2 className="cth-display">your health shouldn&apos;t require 47 tabs.</h2>
      </section>

      <section className="cth-section" style={{ paddingBottom: 0 }}>
        <div className="cth-ecosystem">
          <div className="cth-ecosystem__copy">
            <p className="cth-kicker">my ecosystem</p>
            <h2 className="cth-display">your health, in one place.</h2>
            <p>Keep what you use, what you saved, what you&apos;re considering, and what ayna recommends together without turning your health into a dashboard.</p>
          </div>
          <div className="cth-ecosystem__panel">
            <div className="cth-stat"><small>in your ecosystem</small><strong>{user ? `${ecosystemCount} ${ecosystemCount === 1 ? 'item' : 'items'}` : 'sign in to build yours'}</strong></div>
            <div className="cth-stat"><small>personalization</small><strong>{hasProfile ? 'health profile connected' : 'ready when you are'}</strong></div>
            <div className="cth-stat"><small>your starting point</small><strong>save now, evolve later</strong></div>
            <div className="cth-baseline">Your products and recommendations can change with you. Your baseline gives you something useful to come back to.</div>
            <button type="button" className="cth-secondary" onClick={user ? onViewEcosystem : onStartQuiz}>{user ? 'open my ecosystem' : 'save my starting point'}</button>
          </div>
        </div>
      </section>

      <section className="cth-section">
        <div className="cth-section-head">
          <div>
            <p className="cth-kicker">why trust ayna</p>
            <h2 className="cth-display">clearer by design.</h2>
          </div>
          <p>Personalized does not mean paid-first. Health Match stays separate from commercial partnerships.</p>
        </div>
        <div className="cth-trust">
          {TRUST.map(([number, title, copy]) => (
            <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section className="cth-frame cth-about cth-film">
        <div className="cth-about__grid">
          <div>
            <p className="cth-kicker">about ayna</p>
            <h2 className="cth-display">women&apos;s health should feel less fragmented.</h2>
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
