import React, { useEffect, useMemo, useState } from 'react';
import WebHeroCarousel from './WebHeroCarousel';
import HeroOrbit from './HeroOrbit';
import useReveal from '../utils/useReveal';
import { ALL_PRODUCTS, CATEGORY_LABELS, MACRO_GROUPS, itemMatchesMacroGroup } from '../data/products';
import ProductCard from './ProductCard';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import { getVerificationLinks } from '../utils/verificationLinks';

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

// One category list everywhere (HI05): the same chips as Shop.
// Home shows the first few (same order as Shop); the rest are one tap away.
const HOME_CHIPS = 9;
const SHOP_FILTERS = MACRO_GROUPS.map((g) => ({ key: g.id, label: g.label }));

function productText(product) {
  return [product?.name, product?.brand, product?.category, product?.summary, product?.description, ...(product?.tags || [])]
    .filter(Boolean).join(' ').toLowerCase();
}

function matchesShopFilter(product, key) {
  return itemMatchesMacroGroup(product, key);
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

function hasClinicianSupport(product) {
  const links = getVerificationLinks(product, 'doctor');
  return Boolean(product?.doctorOpinion || product?.clinicianOpinion || product?.clinicianReview || links.length > 0);
}

function hasCommunitySupport(product) {
  const rating = explicitRating(product);
  const communityLinks = getVerificationLinks(product, 'community');
  return (Number.isFinite(rating) && rating >= 4) || Boolean(product?.communityReview) || communityLinks.length > 0;
}

function productTypeOptions() {
  const set = new Set();
  ALL_PRODUCTS.forEach((product) => { if (product?.category) set.add(product.category); });
  return Array.from(set).sort();
}

/** Mirrors Discovery's "Ayna" match-quality filter, minus the quiz-derived
 * best-match ranking that only Discovery has access to — here "Best Match"
 * just means "already recommended to you," and "In My Ecosystem" is only
 * meaningful (and only passed) for the returning-user shop. */
function matchesAyna(product, filter, { ownedIds, recommendedIds } = {}) {
  if (!filter || filter === 'all') return true;
  if (filter === 'best-match') return Boolean(recommendedIds?.has(product?.id));
  if (filter === 'clinician') return hasClinicianSupport(product);
  if (filter === 'community') return hasCommunitySupport(product);
  if (filter === 'ecosystem') return Boolean(ownedIds?.has(product?.id));
  return true;
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

function ShopGrid({ items, onOpenProduct }) {
  return (
    <div className="ayna-landing-shop-grid">
      {items.map(({ product }) => (
        <ProductCard key={product.id} product={product} onOpen={onOpenProduct} />
      ))}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="mockup-landing ay-home-skeleton" aria-busy="true" aria-label="Loading">
      <section className="ay-home-skeleton__hero"><div className="mockup-page"><i className="is-eyebrow" /><i className="is-title" /><i className="is-sub" /><i className="is-btn" /></div></section>
      <section className="mockup-page ay-home-skeleton__grid">{Array.from({ length: 4 }, (_, i) => <i key={i} />)}</section>
    </div>
  );
}

/** The mockup's 38×22 pill toggle. Off = grey track, knob left; on = knob right. */
function Toggle({ on, offTrack = '#DCD5CB', onTrack = 'var(--color-primary)', onKnob = 'var(--color-citric)', ...rest }) {
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

function WelcomeBack({ user, myProducts, recommendedProductIds = [], onStartQuiz, onViewDiscovery, onViewEcosystem, onOpenProduct, initialCategory = null, savedProducts = {}, onToggleSaved }) {
  const name = displayNameFromUser(user) || 'there';
  const [filter, setFilter] = useState(initialCategory || 'all');
  // A shop category pick was pure local state with no URL round-trip —
  // clicking into a product from a filtered Shop view and hitting Back
  // always landed on "All". Mirrors Discovery's ?q= pattern: read the
  // initial value from App.jsx (which reads the URL), and keep the URL in
  // sync as the filter changes so a real browser Back restores it.
  // Flagged live 2026-08-25.
  useEffect(() => {
    if (initialCategory) setFilter(initialCategory);
  }, [initialCategory]);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (filter && filter !== 'all') url.searchParams.set('category', filter);
    else url.searchParams.delete('category');
    if (url.search !== window.location.search) {
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
    }
  }, [filter]);
  const [personalize, setPersonalize] = useState(true);
  const [showShopFilters, setShowShopFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all');
  const [eligibilityFilter, setEligibilityFilter] = useState('all');
  const [preferenceFilter, setPreferenceFilter] = useState('all');
  const [sustainabilityFilter, setSustainabilityFilter] = useState('all');
  const [lifeStageFilter, setLifeStageFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [aynaFilter, setAynaFilter] = useState('all');

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

  const availableProductTypes = useMemo(() => productTypeOptions(), []);

  const shownProducts = useMemo(() => {
    let list = ALL_PRODUCTS.filter((product) => product?.id && product?.name && !ownedIds.has(product.id) && matchesShopFilter(product, filter));

    if (productTypeFilter !== 'all') list = list.filter((product) => product.category === productTypeFilter);
    if (aynaFilter !== 'all') list = list.filter((product) => matchesAyna(product, aynaFilter, { ownedIds, recommendedIds }));

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
  }, [filter, priceFilter, eligibilityFilter, preferenceFilter, sustainabilityFilter, lifeStageFilter, ratingFilter, productTypeFilter, aynaFilter, personalize, ownedIds, recommendedIds, areas]);

  const clearShopFilters = () => {
    setFilter('all');
    setProductTypeFilter('all');
    setAynaFilter('all');
    setPriceFilter('all');
    setEligibilityFilter('all');
    setPreferenceFilter('all');
    setSustainabilityFilter('all');
    setLifeStageFilter('all');
    setRatingFilter('all');
  };

  // HI03: the one next step. First core area with nothing in it.
  const nextArea = useMemo(() => {
    const owned = Object.values(myProducts || {});
    const core = ['period', 'intimate', 'hormones', 'pelvic', 'sleep-stress', 'skin'];
    const group = MACRO_GROUPS.filter((g) => core.includes(g.id)).find((g) => !owned.some((p) => itemMatchesMacroGroup(p, g.id)));
    return group || null;
  }, [myProducts]);
  const picks = Object.keys(myProducts || {}).length;

  return (
    <div className="mockup-landing mockup-landing--returning mockup-landing--home2">
      <section className="ayna-landing-hero ayna-landing-hero--returning ay-home2-hero">
        <div className="mockup-page ay-home2-hero__inner">
          <div className="ay-home2-hero__copy">
            <p className="ayna-landing-eyebrow">Hello, {name}</p>
            <h1 className="ay-home2-title">
              {picks > 0 ? <>Your <span>ecosystem.</span></> : <>Build your <span>ecosystem.</span></>}
            </h1>
            <p className="ay-home2-sub">
              {picks > 0
                ? `${picks} pick${picks === 1 ? '' : 's'} · ${areas.length} area${areas.length === 1 ? '' : 's'} of care`
                : 'Six questions, then a shop matched to you.'}
            </p>
            <div className="ay-home2-actions">
              <button type="button" className="ayna-landing-btn ayna-landing-btn--navy" onClick={picks > 0 ? onViewEcosystem : onStartQuiz}>
                {picks > 0 ? 'Open my ecosystem' : 'Build my ecosystem'}
              </button>
              <button type="button" className="ayna-landing-btn ayna-landing-btn--browse" onClick={() => onViewDiscovery?.('')}>Shop</button>
            </div>
            {picks > 0 && nextArea && (
              <button type="button" className="ay-home2-next" onClick={() => onViewDiscovery?.({ initialMacroGroup: nextArea.id })}>
                <span className="ay-home2-next__dot" aria-hidden="true" />
                Your {nextArea.label} shelf is empty <b>Add →</b>
              </button>
            )}
          </div>
          <div className="ay-home2-hero__visual">
            <HeroOrbit
              areas={picks > 0 ? areas.map((a) => ({ label: a.label, count: a.count, category: a.category })) : null}
              centre={picks > 0 ? String(picks) : 'you'}
              hint={picks > 0 ? (picks === 1 ? 'pick' : 'picks') : 'your ecosystem'}
              addLabel={picks > 0 ? '+ Add' : null}
              onAdd={() => onViewDiscovery?.('')}
              onPick={(label) => (picks > 0 ? onViewEcosystem?.() : onViewDiscovery?.(discoveryTargetFor(label)))}
            />
          </div>
        </div>
      </section>

      <section className="ayna-landing-shop ayna-landing-shop--returning">
        <div className="mockup-page">
          <div className="ayna-landing-shop-head">
            <h2 className="ayna-landing-shop-title ayna-landing-shop-title--returning">{personalize ? 'Picked for you' : 'Explore'}</h2>
            <div className="ayna-landing-shop-controls">
              <div className="ayna-landing-filters">
                {availableShopFilters.slice(0, HOME_CHIPS).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={filter === item.key ? 'is-active' : undefined}
                    onClick={() => setFilter(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
                <button type="button" className="ay-chip-more" onClick={() => onViewDiscovery?.('')}>More in Shop →</button>
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
                <Toggle on={personalize} onTrack="var(--color-primary)" onClick={() => setPersonalize((value) => !value)} />
              </div>
            </div>
          </div>

          {showShopFilters && (
            <div className="ayna-landing-filter-panel">
              <label>
                <span>Product type</span>
                <select value={productTypeFilter} onChange={(e) => setProductTypeFilter(e.target.value)}>
                  <option value="all">All</option>
                  {availableProductTypes.map((category) => (
                    <option key={category} value={category}>{CATEGORY_LABELS[category] || category.replace(/-/g, ' ')}</option>
                  ))}
                </select>
              </label>
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
                <span>ayna</span>
                <select value={aynaFilter} onChange={(e) => setAynaFilter(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="best-match">Best Match</option>
                  <option value="clinician">Clinician Backed</option>
                  <option value="community">Community Favorite</option>
                  <option value="ecosystem">In My Ecosystem</option>
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

          <div className="ayna-landing-shop-grid ayna-landing-shop-grid--returning ay-home2-grid">
            {shownProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isSaved={!!savedProducts?.[product.id]}
                onOpen={onOpenProduct}
                onToggleSaved={onToggleSaved}
                labels={personalize && recommendedIds.has(product.id) ? <span className="ay-for-you">For you</span> : null}
              />
            ))}
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

function FirstVisitLanding({ onStartQuiz, onViewArticles, onViewCommunity, onViewDiscovery, onOpenProduct, hasProfile, profileCategories, initialCategory = null }) {
  const revealRef = useReveal();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(initialCategory || 'all');
  // See the matching effect in WelcomeBack for why — same fix, same pattern.
  useEffect(() => {
    if (initialCategory) setFilter(initialCategory);
  }, [initialCategory]);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (filter && filter !== 'all') url.searchParams.set('category', filter);
    else url.searchParams.delete('category');
    if (url.search !== window.location.search) {
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
    }
  }, [filter]);
  const [personalize, setPersonalize] = useState(false);
  const [chipSetIndex, setChipSetIndex] = useState(0);
  const [showShopFilters, setShowShopFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all');
  const [eligibilityFilter, setEligibilityFilter] = useState('all');
  const [preferenceFilter, setPreferenceFilter] = useState('all');
  const [sustainabilityFilter, setSustainabilityFilter] = useState('all');
  const [lifeStageFilter, setLifeStageFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [aynaFilter, setAynaFilter] = useState('all');

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

  const availableProductTypes = useMemo(
    () => Array.from(new Set(lineup.map(({ product }) => product.category).filter(Boolean))).sort(),
    [lineup],
  );

  const shown = useMemo(() => {
    let list = lineup.filter(({ product }) => matchesShopFilter(product, filter));
    if (productTypeFilter !== 'all') list = list.filter(({ product }) => product.category === productTypeFilter);
    if (aynaFilter !== 'all') list = list.filter(({ product }) => matchesAyna(product, aynaFilter));
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
  }, [lineup, filter, personalize, profileCategories, priceFilter, eligibilityFilter, preferenceFilter, sustainabilityFilter, lifeStageFilter, ratingFilter, productTypeFilter, aynaFilter]);

  const submitSearch = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    onViewDiscovery?.(discoveryTargetFor(query));
  };

  return (
    <div className="mockup-landing mockup-landing--first" ref={revealRef}>
      <section className="ayna-landing-hero">
        <div className="ayna-landing-hero-col">
          <div className="ayna-landing-eyebrow">Your health, your rules</div>
          <h1 className="ayna-landing-headline">
            Your body.<br /><span>Your call.</span>
          </h1>
          <p className="ayna-landing-sub">
            Discover products for your body with research, clinical insight, and real experiences all in one place.
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
            {CHIP_SETS[chipSetIndex].slice(0, 3).map((chip) => (
              <button key={chip} type="button" onClick={() => onViewDiscovery?.(discoveryTargetFor(chip))}>
                {chip}
              </button>
            ))}
          </div>
        </div>
        <div className="ayna-landing-hero-visual">
          <HeroOrbit onPick={(label) => onViewDiscovery?.(discoveryTargetFor(label))} />
        </div>
      </section>

      <section className="ay-steps ay-reveal" aria-labelledby="ay-steps-title">
        <div className="mockup-page">
          <h2 id="ay-steps-title" className="ay-steps__title">No mystery box.</h2>
          <ol className="ay-steps__row">
            <li className="tone-pink"><b>1</b><strong>Your profile</strong><span>Six questions about your body and what you avoid.</span></li>
            <li className="tone-butter"><b>2</b><strong>The market</strong><span>We look across products, apps and care.</span></li>
            <li className="tone-mint"><b>3</b><strong>The evidence</strong><span>Each pick shows its sources.</span></li>
            <li className="tone-peri"><b>4</b><strong>Your shop</strong><span>Ranked for you. You decide.</span></li>
          </ol>
        </div>
      </section>

      <section className="ayna-landing-band ay-reveal">
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

      <section className="ayna-landing-news ay-reveal" aria-label="What's new">
        <div className="mockup-page">
          <WebHeroCarousel onStartQuiz={onStartQuiz} onViewArticles={onViewArticles} onViewCommunity={onViewCommunity} />
        </div>
      </section>

      <section className="ayna-landing-shop ay-reveal">
        <div className="mockup-page">
          <div className="ayna-landing-shop-head">
            <h2 className="ayna-landing-shop-title">Popular on ayna</h2>
            <div className="ayna-landing-shop-controls">
              <div className="ayna-landing-filters">
                {availableShopFilters.slice(0, HOME_CHIPS).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={filter === f.key ? 'is-active' : undefined}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
                <button type="button" className="ay-chip-more" onClick={() => onViewDiscovery?.('')}>More in Shop →</button>
              </div>
              <button type="button" className="ayna-landing-filter-toggle" onClick={() => setShowShopFilters((value) => !value)} aria-expanded={showShopFilters}>
                Filters
              </button>
              {hasProfile ? (
                <div className="ayna-landing-personalize">
                  <span>{personalize ? 'Personalized' : 'Personalize'}</span>
                  <Toggle on={personalize} onClick={() => setPersonalize((v) => !v)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPersonalize((v) => !v); } }} />
                </div>
              ) : (
                <button type="button" className="ay-personalize-cta" onClick={onStartQuiz}>Personalize →</button>
              )}
            </div>
          </div>

          {showShopFilters && (
            <div className="ayna-landing-filter-panel">
              <label>
                <span>Product type</span>
                <select value={productTypeFilter} onChange={(e) => setProductTypeFilter(e.target.value)}>
                  <option value="all">All</option>
                  {availableProductTypes.map((category) => (
                    <option key={category} value={category}>{CATEGORY_LABELS[category] || category.replace(/-/g, ' ')}</option>
                  ))}
                </select>
              </label>
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
                <span>ayna</span>
                <select value={aynaFilter} onChange={(e) => setAynaFilter(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="clinician">Clinician Backed</option>
                  <option value="community">Community Favorite</option>
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
                onClick={() => { setPriceFilter('all'); setEligibilityFilter('all'); setPreferenceFilter('all'); setSustainabilityFilter('all'); setLifeStageFilter('all'); setRatingFilter('all'); setFilter('all'); setProductTypeFilter('all'); setAynaFilter('all'); }}
              >
                Clear
              </button>
            </div>
          )}

          <ShopGrid items={shown} onOpenProduct={onOpenProduct} />
          <div className="ay-see-all"><button type="button" onClick={() => onViewDiscovery?.('')}>See all in Shop →</button></div>
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
  onViewArticles,
  onViewCommunity,
  user,
  myProducts,
  hasProfile = false,
  profileCategories,
  recommendedProductIds = [],
  initialCategory = null,
  loading = false,
  savedProducts = {},
  onToggleSaved,
}) {
  // HI01: hold a skeleton until the session and profile resolve, so a
  // returning user never sees the new-visitor page flash first.
  if (loading) return <HomeSkeleton />;
  if (user) {
    return (
      <WelcomeBack
        user={user}
        myProducts={myProducts}
        savedProducts={savedProducts}
        onToggleSaved={onToggleSaved}
        recommendedProductIds={recommendedProductIds}
        onStartQuiz={onStartQuiz}
        onViewDiscovery={onViewDiscovery}
        onViewEcosystem={onViewEcosystem}
        onOpenProduct={onOpenProduct}
        initialCategory={initialCategory}
      />
    );
  }

  return (
    <FirstVisitLanding
      onStartQuiz={onStartQuiz}
      onViewArticles={onViewArticles}
      onViewCommunity={onViewCommunity}
      onViewDiscovery={onViewDiscovery}
      onOpenProduct={onOpenProduct}
      hasProfile={hasProfile}
      profileCategories={profileCategories}
      initialCategory={initialCategory}
    />
  );
}
