import React, { useEffect, useMemo, useState } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';

/**
 * Landing page — a direct port of boards 1a and 1c of the Aug 2026 desktop
 * mockup ("Ayna Mockups").
 *
 *   1a  first-time visitor: gradient hero, search, "Tell us about your body
 *       once" band, then Shop.
 *   1c  returning user with an ecosystem: "Welcome back" hero with the
 *       ecosystem summary card, then a personalized Shop.
 *
 * The mockup's decision notes are what settle the shape here: the shop lives
 * on the landing page for everyone, the pre-ecosystem section is called Shop
 * (not "Curated for you"), and returning users get rebuild-or-browse rather
 * than being sent straight back into the quiz.
 *
 * Numbers below are the mockup's literal values, not the app's design tokens,
 * because the point is to reproduce those two boards.
 */

/** The eight products in board 1a's Shop grid, with the mockup's own category eyebrows. */
const SHOP_LINEUP = [
  { id: 'p-lola-pad', label: 'PADS' },
  { id: 'p-elvie-trainer', label: 'PELVIC FLOOR' },
  { id: 'p-wuka-underwear', label: 'PERIOD WEAR' },
  { id: 'p-b-complex', label: 'SUPPLEMENTS' },
  { id: 'p-silverette-cups', label: 'POSTPARTUM' },
  { id: 'p-neycher-vaginal-moisturizer', label: 'INTIMATE CARE' },
  { id: 'p-lola-tampon', label: 'TAMPONS' },
  { id: 'p-dame-arc', label: 'INTIMACY' },
];

const CHIP_SETS = [
  ['Postpartum recovery', 'Organic pads', 'Pelvic floor', 'Supplements for cramps'],
  ['Vaginal dryness', 'Ovulation tests', 'PCOS support', 'Sensitive skin'],
  ['Period underwear', 'Menopause', 'Hair thinning', 'Sleep support'],
  ['Fertility', 'Intimate care', 'Hot flashes', 'Cycle support'],
];

const SHOP_FILTERS = [
  { key: 'all', label: 'All', categories: [], keywords: [] },
  { key: 'period', label: 'Period', categories: ['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cramp-relief'], keywords: ['period', 'menstrual'] },
  { key: 'intimate', label: 'Intimate Care', categories: ['intimate-care'], keywords: ['vaginal', 'intimate', 'moisturizer', 'ph'] },
  { key: 'sexual', label: 'Sexual Wellness', categories: ['sex-tech'], keywords: ['intimacy', 'lubricant', 'lube'] },
  { key: 'postpartum', label: 'Postpartum', categories: ['postpartum', 'pregnancy'], keywords: ['postpartum', 'nursing', 'lactation'] },
  { key: 'pelvic', label: 'Pelvic', categories: ['pelvic-floor', 'pelvic-health'], keywords: ['pelvic', 'kegel'] },
  { key: 'hormones', label: 'Hormones', categories: ['supplement', 'hormone-monitoring'], keywords: ['pms', 'pcos', 'hormone', 'cycle'] },
  { key: 'menopause', label: 'Menopause', categories: ['menopause'], keywords: ['menopause', 'perimenopause', 'hot flash'] },
  { key: 'fertility', label: 'Fertility', categories: ['fertility'], keywords: ['fertility', 'ovulation'] },
  { key: 'skin', label: 'Skin', categories: ['skin', 'skincare', 'body-care'], keywords: ['skin', 'spf', 'acne'] },
  { key: 'hair', label: 'Hair', categories: ['hair', 'haircare'], keywords: ['hair', 'scalp', 'shampoo'] },
];

function productText(product) {
  return [product?.name, product?.brand, product?.category, product?.summary, product?.description, ...(product?.tags || [])]
    .filter(Boolean).join(' ').toLowerCase();
}

function matchesShopFilter(product, key) {
  if (!key || key === 'all') return true;
  const filter = SHOP_FILTERS.find((item) => item.key === key);
  if (!filter) return true;
  if (filter.categories.includes(product?.category)) return true;
  const text = productText(product);
  return filter.keywords.some((keyword) => text.includes(keyword));
}

function priceNumber(product) {
  const match = String(product?.price || product?.priceDisplay || '').match(/\$(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function explicitEligibility(product) {
  const combined = product?.fsaHsaEligible === true || product?.fsa_hsa_eligible === true;
  return {
    fsa: combined || product?.fsaEligible === true || product?.fsa_eligible === true,
    hsa: combined || product?.hsaEligible === true || product?.hsa_eligible === true,
  };
}

function matchesPreference(product, preference) {
  if (!preference || preference === 'all') return true;
  const text = productText(product);
  const map = {
    organic: ['organic'],
    'fragrance-free': ['fragrance free', 'fragrance-free'],
    'sensitive-skin': ['sensitive skin'],
    vegan: ['vegan'],
    'cruelty-free': ['cruelty free', 'cruelty-free'],
    reusable: ['reusable'],
  };
  return (map[preference] || []).some((term) => text.includes(term));
}

function matchesSustainability(product, filter) {
  if (!filter || filter === 'all') return true;
  const text = productText(product);
  const map = {
    reusable: ['reusable'],
    recyclable: ['recyclable', 'recycled'],
    'low-waste': ['low waste', 'low-waste', 'zero waste'],
    packaging: ['sustainable packaging', 'plastic-free packaging', 'compostable packaging'],
  };
  return (map[filter] || []).some((term) => text.includes(term));
}

function matchesLifeStage(product, filter) {
  if (!filter || filter === 'all') return true;
  const text = productText(product);
  const terms = {
    fertility: ['fertility', 'ovulation', 'conception'],
    pregnancy: ['pregnancy', 'prenatal'],
    postpartum: ['postpartum', 'lactation', 'breastfeeding', 'nursing'],
    perimenopause: ['perimenopause', 'menopause'],
    menopause: ['menopause', 'hot flash'],
  };
  return (terms[filter] || []).some((term) => text.includes(term));
}

function explicitRating(product) {
  const value = Number(product?.rating ?? product?.userRating ?? product?.reviewRating);
  return Number.isFinite(value) ? value : null;
}


/**
 * Turn a free-text query into the discovery view's filter options, so the hero
 * search and the chips land on a pre-filtered feed instead of a raw text search.
 * Carried over from the previous hero — the routing rules are unchanged.
 */
function discoveryTargetFor(text) {
  const q = String(text || '').trim();
  if (!q) return '';
  const lower = q.toLowerCase();

  if (lower.includes('pad')) {
    const opts = { query: q, initialCategory: 'pad' };
    if (lower.includes('organic')) opts.initialPadPreference = 'organic';
    else if (lower.includes('overnight')) opts.initialPadUseCase = 'overnight';
    else if (lower.includes('heavy')) opts.initialPadFlow = 'heavy';
    return opts;
  }
  if (lower.includes('postpartum') || lower.includes('breastfeeding') || lower.includes('nursing')) {
    return { query: q, initialCategory: 'postpartum' };
  }
  if (lower.includes('prenatal') || (lower.includes('pregnancy') && !lower.includes('postpartum'))) {
    return { query: q, initialCategory: (lower.includes('prenatal') || lower.includes('vitamin')) ? 'supplement' : 'pregnancy' };
  }
  if (lower.includes('supplement')) {
    const opts = { query: q, initialCategory: 'supplement' };
    if (lower.includes('cramps')) opts.initialSymptom = 'cramps';
    else if (lower.includes('pcos')) opts.initialSymptom = 'pcos';
    return opts;
  }
  if (lower.includes('pelvic floor')) {
    return { query: q, initialCategory: 'pelvic-floor' };
  }
  return q;
}

function displayNameFromUser(user) {
  const meta = user?.user_metadata || {};
  const rawName = meta.first_name || meta.firstName || meta.given_name || meta.full_name || meta.name || '';
  const firstFromMeta = String(rawName).trim().split(/\s+/)[0] || '';
  if (firstFromMeta) return firstFromMeta.charAt(0).toUpperCase() + firstFromMeta.slice(1);

  return '';
}

function productById(id) {
  return ALL_PRODUCTS.find((p) => p.id === id) || null;
}

/** Cream tile with the product photo, falling back to the mockup's initial-on-cream block. */
function ProductTile({ product, aspectRatio = 1, radius = 10, badge, showHeart }) {
  return (
    <div
      className="ayna-landing-tile"
      style={{
        aspectRatio: String(aspectRatio),
        borderRadius: `${radius}px`,
        background: 'linear-gradient(160deg, #F3EADC, #EFE3D2)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '12px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ProductTileImage
        product={product}
        alt={product?.name || ''}
        imgStyle={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          padding: '14px',
        }}
        letterNode={<ProductImageFallback style={{ position: 'absolute', inset: 0 }} />}
      />

      {badge && (
        <span style={{
          position: 'relative',
          font: "500 9px 'DM Mono', monospace",
          letterSpacing: '0.08em',
          background: 'rgba(255,255,255,0.9)',
          padding: '5px 9px',
          borderRadius: '999px',
          color: '#B4732A',
        }}>
          {badge}
        </span>
      )}
      {showHeart && (
        <span aria-hidden className="ayna-landing-heart"><svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg></span>
      )}
    </div>
  );
}

/** Board 1a's Shop grid: 4-up, cream tiles, DM Mono eyebrow, Playfair name, muted price. */
function ShopGrid({ items, onOpenProduct }) {
  return (
    <div className="ayna-landing-shop-grid">
      {items.map(({ product, label, badge }) => (
        <button
          key={product.id}
          type="button"
          className="ayna-landing-shop-card"
          onClick={() => onOpenProduct?.(product)}
        >
          <ProductTile product={product} badge={badge} />
          <div style={{
            font: "500 9.5px 'DM Mono', monospace",
            letterSpacing: '0.1em',
            color: '#C0761F',
            marginTop: '12px',
          }}>
            {label}
          </div>
          <div style={{
            font: "400 16px/1.3 'Playfair Display', serif",
            marginTop: '4px',
            color: '#171429',
          }}>
            {product.name}
          </div>
          <div style={{ fontSize: '12.5px', color: '#6f6880', marginTop: '3px' }}>
            {product.price}
          </div>
        </button>
      ))}
    </div>
  );
}

/** The mockup's 38×22 pill toggle. Off = grey track, knob left; on = knob right. */
function Toggle({ on, offTrack = '#DCD5CB', onTrack = '#242A52', onKnob = '#F0A84B', ...rest }) {
  return (
    <span
      role="switch"
      aria-checked={on}
      tabIndex={0}
      {...rest}
      style={{
        width: '38px',
        height: '22px',
        borderRadius: '999px',
        background: on ? onTrack : offTrack,
        position: 'relative',
        display: 'inline-block',
        cursor: 'pointer',
        flex: 'none',
        transition: 'background 0.2s ease',
      }}
    >
      <span style={{
        position: 'absolute',
        top: '3px',
        left: on ? '19px' : '3px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: on ? onKnob : '#fff',
        transition: 'left 0.2s ease, background 0.2s ease',
      }} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* 1c — returning user                                                 */
/* ------------------------------------------------------------------ */

function WelcomeBack({ user, myProducts, ecosystemCount, recommendedProductIds = [], onStartQuiz, onViewDiscovery, onViewEcosystem, onOpenProduct }) {
  const name = displayNameFromUser(user) || 'there';
  const [filter, setFilter] = useState('all');
  const [personalize, setPersonalize] = useState(true);
  const [showShopFilters, setShowShopFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all');
  const [eligibilityFilter, setEligibilityFilter] = useState('all');
  const [preferenceFilter, setPreferenceFilter] = useState('all');
  const [sustainabilityFilter, setSustainabilityFilter] = useState('all');
  const [lifeStageFilter, setLifeStageFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  const areas = useMemo(() => {
    const byCategory = new Map();
    Object.values(myProducts || {}).forEach((p) => {
      const key = p.category || 'other';
      byCategory.set(key, (byCategory.get(key) || 0) + 1);
    });
    return Array.from(byCategory.entries())
      .map(([category, count]) => ({
        category,
        label: String(CATEGORY_LABELS[category] || category).replace(/^[^\w]+\s*/, ''),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [myProducts]);

  const ownedIds = useMemo(() => new Set(Object.keys(myProducts || {})), [myProducts]);
  const recommendedIds = useMemo(() => new Set(recommendedProductIds || []), [recommendedProductIds]);

  const availableShopFilters = useMemo(
    () => SHOP_FILTERS.filter((item) => item.key === 'all' || ALL_PRODUCTS.some((product) => matchesShopFilter(product, item.key))),
    [],
  );

  const shownProducts = useMemo(() => {
    let list = ALL_PRODUCTS.filter((product) => product?.id && product?.name && matchesShopFilter(product, filter));

    if (priceFilter !== 'all') {
      list = list.filter((product) => {
        const price = priceNumber(product);
        if (price == null) return false;
        if (priceFilter === 'under-25') return price < 25;
        if (priceFilter === '25-50') return price >= 25 && price <= 50;
        if (priceFilter === '50-100') return price > 50 && price <= 100;
        if (priceFilter === '100-plus') return price > 100;
        return true;
      });
    }

    if (eligibilityFilter !== 'all') {
      list = list.filter((product) => {
        const eligibility = explicitEligibility(product);
        if (eligibilityFilter === 'fsa-hsa') return eligibility.fsa || eligibility.hsa;
        if (eligibilityFilter === 'fsa') return eligibility.fsa;
        if (eligibilityFilter === 'hsa') return eligibility.hsa;
        return true;
      });
    }

    list = list.filter((product) => matchesPreference(product, preferenceFilter));
    list = list.filter((product) => matchesSustainability(product, sustainabilityFilter));
    list = list.filter((product) => matchesLifeStage(product, lifeStageFilter));
    if (ratingFilter === '4-plus') list = list.filter((product) => (explicitRating(product) ?? 0) >= 4);

    if (personalize) {
      list = [...list].sort((a, b) => {
        const score = (product) => {
          if (ownedIds.has(product.id)) return 3;
          if (recommendedIds.has(product.id)) return 2;
          if (areas.some((area) => area.category === product.category)) return 1;
          return 0;
        };
        return score(b) - score(a);
      });
    }

    return list.slice(0, 8);
  }, [filter, priceFilter, eligibilityFilter, preferenceFilter, sustainabilityFilter, lifeStageFilter, ratingFilter, personalize, ownedIds, recommendedIds, areas]);

  const clearShopFilters = () => {
    setFilter('all');
    setPriceFilter('all');
    setEligibilityFilter('all');
    setPreferenceFilter('all');
    setSustainabilityFilter('all');
    setLifeStageFilter('all');
    setRatingFilter('all');
  };

  return (
    <div className="mockup-landing mockup-landing--returning">
      <section className="ayna-landing-hero ayna-landing-hero--returning">
        <div className="mockup-page ayna-landing-welcomeback">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="ayna-landing-eyebrow">Hello, {name}</div>
            <h1 className="ayna-landing-headline ayna-landing-headline--returning">
              {ecosystemCount > 0 ? (
                <>
                  Your ecosystem is{' '}
                  <span style={{ fontStyle: 'italic', color: '#F0A84B' }}>
                    {ecosystemCount} product{ecosystemCount === 1 ? '' : 's'}
                  </span>{' '}
                  strong.
                </>
              ) : (
                <>Build your <span style={{ fontStyle: 'italic', color: '#F0A84B' }}>ecosystem</span>.</>
              )}
            </h1>
            <p style={{
              fontSize: '16px',
              lineHeight: 1.55,
              color: 'rgba(244,240,250,0.78)',
              maxWidth: '420px',
              margin: 0,
            }}>
              Personalized products, all in one place.
            </p>
            <div style={{ display: 'flex', gap: '13px', marginTop: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="ayna-landing-btn ayna-landing-btn--amber"
                onClick={ecosystemCount > 0 ? onViewEcosystem : onStartQuiz}
              >
                {ecosystemCount > 0 ? 'Edit ecosystem' : 'Build your ecosystem'}
              </button>
              <button type="button" className="ayna-landing-btn ayna-landing-btn--browse" onClick={() => onViewDiscovery?.('')}>
                Browse
              </button>
            </div>
          </div>

          <button type="button" className="ayna-landing-ecocard" onClick={onViewEcosystem}>
            <div style={{
              font: "500 10px 'DM Mono', monospace",
              letterSpacing: '0.1em',
              color: 'rgba(244,240,250,0.6)',
            }}>
              YOUR ECOSYSTEM
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '12px' }}>
              {areas.length === 0 ? (
                <div className="ayna-landing-ecocard__empty">Start here</div>
              ) : areas.map((a, i) => (
                <div
                  key={a.category}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 0',
                    borderBottom: i === areas.length - 1 ? 'none' : '1px solid rgba(244,240,250,0.14)',
                  }}
                >
                  <span style={{ font: "400 15px 'Playfair Display', serif" }}>{a.label}</span>
                  <span style={{ fontSize: '11.5px', color: '#F0A84B' }}>
                    {a.count} {a.count === 1 ? 'pick' : 'picks'}
                  </span>
                </div>
              ))}
            </div>
          </button>
        </div>
      </section>

      <section className="ayna-landing-shop ayna-landing-shop--returning">
        <div className="mockup-page">
          <div className="ayna-landing-shop-head">
            <div className="ayna-landing-shop-title ayna-landing-shop-title--returning">Trending on Ayna</div>
            <div className="ayna-landing-shop-controls">
              <div className="ayna-landing-filters">
                {availableShopFilters.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={filter === item.key ? 'is-active' : undefined}
                    onClick={() => setFilter(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="ayna-landing-filter-toggle"
                onClick={() => setShowShopFilters((value) => !value)}
                aria-expanded={showShopFilters}
              >
                Filters
              </button>
              <div className="ayna-landing-personalize">
                <span>{personalize ? 'Personalized' : 'Personalize'}</span>
                <Toggle on={personalize} onTrack="#4E3866" onClick={() => setPersonalize((value) => !value)} />
              </div>
            </div>
          </div>

          {showShopFilters && (
            <div className="ayna-landing-filter-panel">
              <label>
                <span>Price</span>
                <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="under-25">Under $25</option>
                  <option value="25-50">$25-$50</option>
                  <option value="50-100">$50-$100</option>
                  <option value="100-plus">$100+</option>
                </select>
              </label>
              <label>
                <span>Preferences</span>
                <select value={preferenceFilter} onChange={(e) => setPreferenceFilter(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="organic">Organic</option>
                  <option value="fragrance-free">Fragrance Free</option>
                  <option value="sensitive-skin">Sensitive Skin</option>
                  <option value="vegan">Vegan</option>
                  <option value="cruelty-free">Cruelty Free</option>
                  <option value="reusable">Reusable</option>
                </select>
              </label>
              <label>
                <span>Sustainability</span>
                <select value={sustainabilityFilter} onChange={(e) => setSustainabilityFilter(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="reusable">Reusable</option>
                  <option value="recyclable">Recyclable</option>
                  <option value="low-waste">Low Waste</option>
                  <option value="packaging">Sustainable Packaging</option>
                </select>
              </label>
              <label>
                <span>Life stage</span>
                <select value={lifeStageFilter} onChange={(e) => setLifeStageFilter(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="fertility">Fertility</option>
                  <option value="pregnancy">Pregnancy</option>
                  <option value="postpartum">Postpartum</option>
                  <option value="perimenopause">Perimenopause</option>
                  <option value="menopause">Menopause</option>
                </select>
              </label>
              <label>
                <span>Rating</span>
                <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="4-plus">4+ stars</option>
                </select>
              </label>
              <label>
                <span>Eligibility</span>
                <select value={eligibilityFilter} onChange={(e) => setEligibilityFilter(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="fsa-hsa">FSA/HSA Eligible</option>
                  <option value="fsa">FSA Eligible</option>
                  <option value="hsa">HSA Eligible</option>
                </select>
              </label>
              <button type="button" onClick={clearShopFilters}>Clear</button>
            </div>
          )}

          <div className="ayna-landing-shop-grid ayna-landing-shop-grid--returning">
            {shownProducts.map((product) => {
              const badge = ownedIds.has(product.id)
                ? 'IN YOUR ECOSYSTEM'
                : (personalize && recommendedIds.has(product.id) ? 'FOR YOU' : null);
              return (
                <button
                  key={product.id}
                  type="button"
                  className="ayna-landing-shop-card"
                  onClick={() => onOpenProduct?.(product)}
                >
                  <ProductTile product={product} aspectRatio={1.1} badge={badge} />
                  <div style={{ font: "400 15px/1.3 'Playfair Display', serif", marginTop: '10px', color: '#171429' }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6f6880', marginTop: '3px' }}>{product.price}</div>
                </button>
              );
            })}
          </div>
          {shownProducts.length === 0 && (
            <div className="ayna-landing-shop-empty">No matches yet. Try another filter.</div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1a — first visit                                                    */
/* ------------------------------------------------------------------ */

function FirstVisitLanding({ onStartQuiz, onViewDiscovery, onOpenProduct, hasProfile, profileCategories }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [personalize, setPersonalize] = useState(false);
  const [chipSetIndex, setChipSetIndex] = useState(0);
  const [showShopFilters, setShowShopFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all');
  const [eligibilityFilter, setEligibilityFilter] = useState('all');
  const [preferenceFilter, setPreferenceFilter] = useState('all');
  const [sustainabilityFilter, setSustainabilityFilter] = useState('all');
  const [lifeStageFilter, setLifeStageFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  useEffect(() => {
    const timer = window.setInterval(() => {
      setChipSetIndex((current) => (current + 1) % CHIP_SETS.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);

  const lineup = useMemo(
    () => SHOP_LINEUP
      .map(({ id, label }) => ({ product: productById(id), label }))
      .filter((x) => x.product),
    [],
  );

  const availableShopFilters = useMemo(
    () => SHOP_FILTERS.filter((item) => item.key === 'all' || lineup.some(({ product }) => matchesShopFilter(product, item.key))),
    [lineup],
  );

  const shown = useMemo(() => {
    let list = lineup.filter(({ product }) => matchesShopFilter(product, filter));
    if (priceFilter !== 'all') {
      list = list.filter(({ product }) => {
        const price = priceNumber(product);
        if (price == null) return false;
        if (priceFilter === 'under-25') return price < 25;
        if (priceFilter === '25-50') return price >= 25 && price <= 50;
        if (priceFilter === '50-100') return price > 50 && price <= 100;
        if (priceFilter === '100-plus') return price > 100;
        return true;
      });
    }
    if (eligibilityFilter !== 'all') {
      list = list.filter(({ product }) => {
        const e = explicitEligibility(product);
        if (eligibilityFilter === 'fsa-hsa') return e.fsa || e.hsa;
        return eligibilityFilter === 'fsa' ? e.fsa : e.hsa;
      });
    }
    list = list.filter(({ product }) => matchesPreference(product, preferenceFilter));
    list = list.filter(({ product }) => matchesSustainability(product, sustainabilityFilter));
    list = list.filter(({ product }) => matchesLifeStage(product, lifeStageFilter));
    if (ratingFilter === '4-plus') list = list.filter(({ product }) => (explicitRating(product) ?? 0) >= 4);
    if (personalize && profileCategories?.length) {
      const rank = new Set(profileCategories);
      list = [...list].sort(
        (a, b) => (rank.has(b.product.category) ? 1 : 0) - (rank.has(a.product.category) ? 1 : 0),
      );
    }
    return list;
  }, [lineup, filter, personalize, profileCategories, priceFilter, eligibilityFilter, preferenceFilter, sustainabilityFilter, lifeStageFilter, ratingFilter]);

  const submitSearch = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    onViewDiscovery?.(discoveryTargetFor(query));
  };

  return (
    <div className="mockup-landing">
      <section className="ayna-landing-hero">
        <div className="ayna-landing-hero-col">
          <div className="ayna-landing-eyebrow">Women&apos;s health, personalized</div>
          <h1 className="ayna-landing-headline">
            Care that&apos;s <span style={{ fontStyle: 'italic', color: '#F0A84B' }}>matched</span> to your body.
          </h1>
          <p className="ayna-landing-sub">
            Real research, doctor input, and other women&apos;s experiences in one place.
          </p>

          <form className="ayna-landing-searchbar" onSubmit={submitSearch}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for?"
              aria-label="Search products"
            />
            <button type="submit">Search</button>
          </form>

          <div key={chipSetIndex} className="ayna-landing-chips ayna-landing-chips--rotating" aria-label="Popular searches">
            {CHIP_SETS[chipSetIndex].map((chip) => (
              <button key={chip} type="button" onClick={() => onViewDiscovery?.(discoveryTargetFor(chip))}>
                {chip}
              </button>
            ))}
          </div>

        </div>
      </section>

      <section className="ayna-landing-band">
        <div className="mockup-page ayna-landing-band__inner">
          <div className="ayna-landing-band__copy">
            Tell us about your body once.
            <span>Six questions, and your shop rebuilds around you.</span>
          </div>
          <button type="button" className="ayna-landing-btn ayna-landing-btn--navy" onClick={onStartQuiz}>
            Build your ecosystem
          </button>
        </div>
      </section>

      <section className="ayna-landing-shop">
        <div className="mockup-page">
          <div className="ayna-landing-shop-head">
            <div className="ayna-landing-shop-title">Trending on Ayna</div>
            <div className="ayna-landing-shop-controls">
              <div className="ayna-landing-filters">
                {availableShopFilters.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={filter === f.key ? 'is-active' : undefined}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button type="button" className="ayna-landing-filter-toggle" onClick={() => setShowShopFilters((value) => !value)} aria-expanded={showShopFilters}>
                Filters
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px', fontSize: '12.5px', color: '#6f6880' }}>
                Personalize
                <Toggle
                  on={personalize}
                  onClick={() => {
                    if (!hasProfile) { onStartQuiz?.(); return; }
                    setPersonalize((v) => !v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    if (!hasProfile) { onStartQuiz?.(); return; }
                    setPersonalize((v) => !v);
                  }}
                />
              </div>
            </div>
          </div>

          {showShopFilters && (
            <div className="ayna-landing-filter-panel">
              <label>
                <span>Price</span>
                <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="under-25">Under $25</option>
                  <option value="25-50">$25-$50</option>
                  <option value="50-100">$50-$100</option>
                  <option value="100-plus">$100+</option>
                </select>
              </label>
              <label>
                <span>Preferences</span>
                <select value={preferenceFilter} onChange={(e) => setPreferenceFilter(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="organic">Organic</option>
                  <option value="fragrance-free">Fragrance Free</option>
                  <option value="sensitive-skin">Sensitive Skin</option>
                  <option value="vegan">Vegan</option>
                  <option value="cruelty-free">Cruelty Free</option>
                  <option value="reusable">Reusable</option>
                </select>
              </label>
              <label>
                <span>Sustainability</span>
                <select value={sustainabilityFilter} onChange={(e) => setSustainabilityFilter(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="reusable">Reusable</option>
                  <option value="recyclable">Recyclable</option>
                  <option value="low-waste">Low Waste</option>
                  <option value="packaging">Sustainable Packaging</option>
                </select>
              </label>
              <label>
                <span>Life stage</span>
                <select value={lifeStageFilter} onChange={(e) => setLifeStageFilter(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="fertility">Fertility</option>
                  <option value="pregnancy">Pregnancy</option>
                  <option value="postpartum">Postpartum</option>
                  <option value="perimenopause">Perimenopause</option>
                  <option value="menopause">Menopause</option>
                </select>
              </label>
              <label>
                <span>Rating</span>
                <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="4-plus">4+ stars</option>
                </select>
              </label>
              <label>
                <span>Eligibility</span>
                <select value={eligibilityFilter} onChange={(e) => setEligibilityFilter(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="fsa-hsa">FSA/HSA Eligible</option>
                  <option value="fsa">FSA Eligible</option>
                  <option value="hsa">HSA Eligible</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => { setPriceFilter('all'); setEligibilityFilter('all'); setPreferenceFilter('all'); setSustainabilityFilter('all'); setLifeStageFilter('all'); setRatingFilter('all'); setFilter('all'); }}
              >
                Clear
              </button>
            </div>
          )}

          <ShopGrid items={shown} onOpenProduct={onOpenProduct} />
        </div>
      </section>
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
}) {
  if (user) {
    return (
      <WelcomeBack
        user={user}
        myProducts={myProducts}
        ecosystemCount={ecosystemCount}
        recommendedProductIds={recommendedProductIds}
        onStartQuiz={onStartQuiz}
        onViewDiscovery={onViewDiscovery}
        onViewEcosystem={onViewEcosystem}
        onOpenProduct={onOpenProduct}
      />
    );
  }

  return (
    <FirstVisitLanding
      onStartQuiz={onStartQuiz}
      onViewDiscovery={onViewDiscovery}
      onOpenProduct={onOpenProduct}
      hasProfile={hasProfile}
      profileCategories={profileCategories}
    />
  );
}
