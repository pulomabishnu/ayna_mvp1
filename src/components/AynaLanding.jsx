import React, { useEffect, useMemo, useState } from 'react';
import WebHeroCarousel from './WebHeroCarousel';
import { ExploreByNeed } from './HomeShowcase';
import { EcoOrbit } from './EcoBuilder';
import PartnerStrip from './PartnerStrip';
import { useEcoSlots, useNeeds } from './landingNeeds';
import WebEcosystemChart from './WebEcosystemChart';
import { ECOSYSTEM_AREAS, resolveEcosystemProductArea } from './EcosystemBubbles';
import '../styles/eco-redesign.css';
import '../styles/landing.css';
import { ALL_PRODUCTS, CATEGORY_LABELS, MACRO_GROUPS, itemMatchesMacroGroup } from '../data/products';
import ProductCard from './ProductCard';
import SmartSearchInput from './search/SmartSearchInput.jsx';
import { edgeFadeRef } from '../utils/edgeFade';
import { getVerificationLinks } from '../utils/verificationLinks';

/**
 * Website home, laid out by the design rulebook (/tmp figma RULEBOOK §14):
 *
 *   FirstVisitLanding  hero (Build your ecosystem + search + a small orbit),
 *                      brand partner strip, why ayna (3), how it works (3 +
 *                      CTA), shop by need, stories, final CTA band.
 *   WelcomeBack        signed in: greeting hero with the ecosystem ring (or
 *                      the build hero when it is empty), partner strip,
 *                      Picked for you.
 *
 * One primary-styled button per viewport (.lx-cta); everything else is an
 * outline or text button. Styles: src/styles/landing.css (classes lx-*).
 */

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
 * best-match ranking that only Discovery has access to, here "Best Match"
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
 * Carried over from the previous hero, the routing rules are unchanged.
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

const SEARCH_HINTS = ['organic pads', 'PCOS support', 'postpartum recovery', 'vaginal dryness', 'pelvic floor', 'sleep support', 'period underwear'];

function useRotating(length, ms) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = window.setInterval(() => { if (!document.hidden) setI((v) => (v + 1) % length); }, ms);
    return () => window.clearInterval(t);
  }, [length, ms]);
  return i;
}

const Arrow = () => (
  <span className="lx-cta__arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" /></svg></span>
);

/** The hero's secondary action: one wide search field with a rotating example. */
function HeroSearch({ onViewDiscovery }) {
  const [query, setQuery] = useState('');
  const hint = useRotating(SEARCH_HINTS.length, 2600);
  const submit = (e) => {
    e.preventDefault();
    onViewDiscovery?.(discoveryTargetFor(query));
  };
  return (
    <form className="lx-search" role="search" onSubmit={submit}>
      <label className="lx-search__field">
        <span className="lx-sr">Search products</span>
        <svg className="lx-search__icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        <SmartSearchInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          suggest={{ kinds: ['need', 'category', 'brand', 'product'], limit: 6 }}
          onPick={(s) => onViewDiscovery?.(discoveryTargetFor(s.query))}
          anchor=".lx-search"
          placeholder=" "
          enterKeyHint="search"
          autoComplete="off"
        />
        {!query && (
          <span className="lx-search__hint" aria-hidden="true">
            Search <b key={hint}>{SEARCH_HINTS[hint]}</b>
          </span>
        )}
      </label>
      <button type="submit" className="lx-search__go" aria-label="Search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
      </button>
    </form>
  );
}

function HeroTitle({ lead, word }) {
  return (
    <h1 id="lx-hero-title" className="lx-hero__title">
      {lead} <span className="lx-mark">{word}</span>
    </h1>
  );
}

/** "Build your ecosystem": headline, one primary CTA, search, a small orbit. */
function BuildHero({ onStartQuiz, onViewDiscovery, onOpenProduct, greeting }) {
  const needs = useNeeds();
  // Plays once: three needs land in orbit, then it rests.
  const { slots } = useEcoSlots(needs, { loop: false, step: 900 });
  return (
    <section className="lx-hero" aria-labelledby="lx-hero-title">
      <div className="mockup-page lx-hero__inner">
        <div className="lx-hero__copy">
          {greeting && <p className="lx-hero__hello">{greeting}</p>}
          <HeroTitle lead="Build your" word="ecosystem." />
          <p className="lx-hero__sub">Health products matched to your body, with the evidence beside each one.</p>
          <div className="lx-hero__cta">
            <button type="button" className="lx-cta" onClick={onStartQuiz}>
              Build your ecosystem
              <Arrow />
            </button>
            <p className="lx-hero__note">A few quick questions, then a shop matched to you.</p>
          </div>
          <HeroSearch onViewDiscovery={onViewDiscovery} />
        </div>
        <div className="lx-hero__visual">
          <EcoOrbit needs={needs} slots={slots} onOpenProduct={onOpenProduct} />
        </div>
      </div>
    </section>
  );
}

function Trust({ onViewDiscovery }) {
  return (
    <div className="lx-trust">
      <div className="mockup-page">
        <PartnerStrip variant="web" title={'Shop ayna\u2019s favorites'} onSelectBrand={(name) => onViewDiscovery?.(name)} />
      </div>
    </div>
  );
}

const VALUE_PROPS = [
  { tone: 'pink', title: 'Matched to you', text: 'Your shop is ranked around your body and what you avoid.', icon: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></> },
  { tone: 'butter', title: 'Evidence beside each pick', text: 'Every match shows why it fits and where that comes from.', icon: <><path d="M7 4h7l4 4v12H7z" /><path d="M10 12h5M10 16h5" /></> },
  { tone: 'mint', title: 'Your data stays yours', text: 'We do not sell your personal health information.', icon: <><rect x="6" y="10" width="12" height="10" rx="2" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></> },
];

function ValueProps() {
  return (
    <section className="lx-values" aria-labelledby="lx-values-title">
      <div className="mockup-page">
        <h2 id="lx-values-title" className="lx-h2">Why ayna</h2>
        <ul className="lx-values__list">
          {VALUE_PROPS.map((v) => (
            <li key={v.title} className={`tone-${v.tone}`}>
              <span className="lx-values__icon" aria-hidden="true"><svg viewBox="0 0 24 24">{v.icon}</svg></span>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HowItWorks({ onStartQuiz }) {
  return (
    <section className="lx-how" aria-labelledby="lx-how-title">
      <div className="mockup-page">
        <h2 id="lx-how-title" className="lx-h2">How it works</h2>
        <ol className="lx-how__steps">
          <li className="tone-pink"><b>1</b><h3>Answer six questions</h3><p>About your body and what you avoid.</p></li>
          <li className="tone-butter"><b>2</b><h3>We check the evidence</h3><p>Across products, apps and care.</p></li>
          <li className="tone-peri"><b>3</b><h3>Get your ecosystem</h3><p>Ranked for you. You decide.</p></li>
        </ol>
        <div className="lx-how__cta">
          <button type="button" className="lx-cta" onClick={onStartQuiz}>
            Build your ecosystem
            <Arrow />
          </button>
        </div>
      </div>
    </section>
  );
}

function FinalCta({ onStartQuiz, onViewDiscovery }) {
  return (
    <section className="lx-final" aria-labelledby="lx-final-title">
      <div className="mockup-page">
        <div className="lx-final__card">
          <h2 id="lx-final-title" className="lx-h2">Start with six questions.</h2>
          <p>Then a shop matched to you.</p>
          <div className="lx-final__actions">
            <button type="button" className="lx-cta" onClick={onStartQuiz}>
              Build your ecosystem
              <Arrow />
            </button>
            <button type="button" className="lx-link" onClick={() => onViewDiscovery?.('')}>Browse the Shop</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterPanel({ f, set, productTypes, ecosystem = false, onClear }) {
  return (
    <div className="lx-filter-panel">
      <label>
        <span>Product type</span>
        <select value={f.productType} onChange={(e) => set('productType', e.target.value)}>
          <option value="all">All</option>
          {productTypes.map((category) => (
            <option key={category} value={category}>{CATEGORY_LABELS[category] || category.replace(/-/g, ' ')}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Price</span>
        <select value={f.price} onChange={(e) => set('price', e.target.value)}>
          <option value="all">Any</option>
          <option value="under-25">Under $25</option>
          <option value="25-50">$25-$50</option>
          <option value="50-100">$50-$100</option>
          <option value="100-plus">$100+</option>
        </select>
      </label>
      <label>
        <span>ayna</span>
        <select value={f.ayna} onChange={(e) => set('ayna', e.target.value)}>
          <option value="all">Any</option>
          {ecosystem && <option value="best-match">Best Match</option>}
          <option value="clinician">Clinician Backed</option>
          <option value="community">Community Favorite</option>
          {ecosystem && <option value="ecosystem">In My Ecosystem</option>}
        </select>
      </label>
      <label>
        <span>Preferences</span>
        <select value={f.preference} onChange={(e) => set('preference', e.target.value)}>
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
        <select value={f.sustainability} onChange={(e) => set('sustainability', e.target.value)}>
          <option value="all">Any</option>
          <option value="reusable">Reusable</option>
          <option value="recyclable">Recyclable</option>
          <option value="low-waste">Low Waste</option>
          <option value="packaging">Sustainable Packaging</option>
        </select>
      </label>
      <label>
        <span>Life stage</span>
        <select value={f.lifeStage} onChange={(e) => set('lifeStage', e.target.value)}>
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
        <select value={f.rating} onChange={(e) => set('rating', e.target.value)}>
          <option value="all">Any</option>
          <option value="4-plus">4+ stars</option>
        </select>
      </label>
      <label>
        <span>Eligibility</span>
        <select value={f.eligibility} onChange={(e) => set('eligibility', e.target.value)}>
          <option value="all">Any</option>
          <option value="fsa-hsa">FSA/HSA Eligible</option>
          <option value="fsa">FSA Eligible</option>
          <option value="hsa">HSA Eligible</option>
        </select>
      </label>
      <button type="button" onClick={onClear}>Clear</button>
    </div>
  );
}

const NO_FILTERS = { productType: 'all', price: 'all', ayna: 'all', preference: 'all', sustainability: 'all', lifeStage: 'all', rating: 'all', eligibility: 'all' };

function applyFilters(list, f, ctx) {
  let out = list;
  if (f.productType !== 'all') out = out.filter((p) => p.category === f.productType);
  if (f.ayna !== 'all') out = out.filter((p) => matchesAyna(p, f.ayna, ctx));
  if (f.price !== 'all') {
    out = out.filter((p) => {
      const price = priceNumber(p);
      if (price == null) return false;
      if (f.price === 'under-25') return price < 25;
      if (f.price === '25-50') return price >= 25 && price <= 50;
      if (f.price === '50-100') return price > 50 && price <= 100;
      if (f.price === '100-plus') return price > 100;
      return true;
    });
  }
  if (f.eligibility !== 'all') {
    out = out.filter((p) => {
      const e = explicitEligibility(p);
      if (f.eligibility === 'fsa-hsa') return e.fsa || e.hsa;
      return f.eligibility === 'fsa' ? e.fsa : e.hsa;
    });
  }
  out = out.filter((p) => matchesPreference(p, f.preference));
  out = out.filter((p) => matchesSustainability(p, f.sustainability));
  out = out.filter((p) => matchesLifeStage(p, f.lifeStage));
  if (f.rating === '4-plus') out = out.filter((p) => (explicitRating(p) ?? 0) >= 4);
  return out;
}

/** Category filter kept in ?category= so Back from a product restores it. */
function useCategoryParam(initialCategory) {
  const [filter, setFilter] = useState(initialCategory || 'all');
  const [seen, setSeen] = useState(initialCategory);
  if (initialCategory !== seen) {
    setSeen(initialCategory);
    if (initialCategory) setFilter(initialCategory);
  }
  useEffect(() => {
    const url = new URL(window.location.href);
    if (filter && filter !== 'all') url.searchParams.set('category', filter);
    else url.searchParams.delete('category');
    if (url.search !== window.location.search) {
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
    }
  }, [filter]);
  return [filter, setFilter];
}

/** Shop section shared by both homes: title, chips, Filters, Personalize, grid. */
function ShopSection({ title, chips, filter, setFilter, filters, setFilters, productTypes, ecosystem, personalizeControl, onViewDiscovery, children }) {
  const [open, setOpen] = useState(false);
  const active = Object.keys(NO_FILTERS).filter((k) => filters[k] !== 'all').length;
  return (
    <section className="lx-shop" aria-labelledby="lx-shop-title">
      <div className="mockup-page">
        <div className="lx-shop__head">
          <h2 id="lx-shop-title" className="lx-h2">{title}</h2>
          <div className="lx-shop__tools">
            <button type="button" className={`lx-pill${open ? ' is-on' : ''}`} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
              Filters{active ? ` (${active})` : ''}
            </button>
            {personalizeControl}
          </div>
        </div>
        <div className="lx-chips" ref={edgeFadeRef}>
          {chips.map((item) => (
            <button key={item.key} type="button" aria-pressed={filter === item.key} className={filter === item.key ? 'is-on' : undefined} onClick={() => setFilter(item.key)}>
              {item.label}
            </button>
          ))}
          <button type="button" className="lx-chips__more" onClick={() => onViewDiscovery?.('')}>More in Shop</button>
        </div>
        {open && (
          <FilterPanel
            f={filters}
            set={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
            productTypes={productTypes}
            ecosystem={ecosystem}
            onClear={() => { setFilters(NO_FILTERS); setFilter('all'); }}
          />
        )}
        {children}
        <div className="lx-shop__foot">
          <button type="button" className="lx-ghost" onClick={() => onViewDiscovery?.('')}>See all in Shop</button>
        </div>
      </div>
    </section>
  );
}

const exploreTarget = (n) => (n.group ? { initialMacroGroup: n.group } : (n.keywords?.[0] || ''));

/* ------------------------------------------------------------------ */
/* Logged in                                                           */
/* ------------------------------------------------------------------ */

function WelcomeBack({ user, myProducts, recommendedProductIds = [], onStartQuiz, onViewDiscovery, onViewEcosystem, onOpenProduct, initialCategory = null, savedProducts = {}, onToggleSaved }) {
  const name = displayNameFromUser(user) || 'there';
  const [filter, setFilter] = useCategoryParam(initialCategory);
  const [personalize, setPersonalize] = useState(true);
  const [filters, setFilters] = useState(NO_FILTERS);

  const ownedIds = useMemo(() => new Set(Object.keys(myProducts || {})), [myProducts]);
  const recommendedIds = useMemo(() => new Set(recommendedProductIds || []), [recommendedProductIds]);
  const ownedCategories = useMemo(() => new Set(Object.values(myProducts || {}).map((p) => p.category).filter(Boolean)), [myProducts]);

  const chips = useMemo(
    () => SHOP_FILTERS.filter((item) => item.key === 'all' || ALL_PRODUCTS.some((product) => matchesShopFilter(product, item.key))).slice(0, HOME_CHIPS),
    [],
  );
  const productTypes = useMemo(() => productTypeOptions(), []);

  const shownProducts = useMemo(() => {
    let list = ALL_PRODUCTS.filter((p) => p?.id && p?.name && !ownedIds.has(p.id) && matchesShopFilter(p, filter));
    list = applyFilters(list, filters, { ownedIds, recommendedIds });
    if (personalize) {
      const score = (p) => (recommendedIds.has(p.id) ? 2 : ownedCategories.has(p.category) ? 1 : 0);
      list = [...list].sort((a, b) => score(b) - score(a));
    }
    return list.slice(0, 8);
  }, [filter, filters, personalize, ownedIds, recommendedIds, ownedCategories]);

  // HI03: the one next step. A random empty core area, picked once per page load
  // (seed fixed at mount so it does not flicker when her shelf changes).
  const [nextSeed] = useState(() => Math.random());
  const nextArea = useMemo(() => {
    const owned = Object.values(myProducts || {});
    const core = ['period', 'intimate', 'hormones', 'pelvic', 'sleep-stress', 'skin'];
    const empty = MACRO_GROUPS.filter((g) => core.includes(g.id) && !owned.some((p) => itemMatchesMacroGroup(p, g.id)));
    return empty.length ? empty[Math.floor(nextSeed * empty.length)] : null;
  }, [myProducts, nextSeed]);
  const picks = Object.keys(myProducts || {}).length;
  // Same area grouping and ring as the Ecosystem page.
  const ecoGroups = useMemo(() => {
    const byArea = new Map();
    Object.values(myProducts || {}).forEach((p) => {
      const area = resolveEcosystemProductArea(p, ECOSYSTEM_AREAS);
      const key = area ? area.key : 'other';
      if (!byArea.has(key)) byArea.set(key, []);
      byArea.get(key).push(p);
    });
    const groups = ECOSYSTEM_AREAS.filter((a) => byArea.has(a.key)).map((a) => ({ ...a, products: byArea.get(a.key) }));
    if (byArea.has('other')) groups.push({ key: 'other', label: 'Other', products: byArea.get('other') });
    return groups.sort((x, y) => y.products.length - x.products.length);
  }, [myProducts]);

  return (
    <div className="mockup-landing mockup-landing--returning lx">
      {picks > 0 ? (
        <section className="lx-hero lx-hero--home" aria-labelledby="lx-hero-title">
          <div className="mockup-page lx-hero__inner">
            <div className="lx-hero__copy">
              <p className="lx-hero__hello">Hello, {name}</p>
              <HeroTitle lead="Your" word="ecosystem." />
              <p className="lx-hero__sub">
                {picks} pick{picks === 1 ? '' : 's'} across {ecoGroups.length} area{ecoGroups.length === 1 ? '' : 's'} of care.
              </p>
              <div className="lx-hero__cta">
                <button type="button" className="lx-cta" onClick={onViewEcosystem}>
                  Open my ecosystem
                  <Arrow />
                </button>
              </div>
              {nextArea && (
                <button type="button" className="lx-next" onClick={() => onViewDiscovery?.({ initialMacroGroup: nextArea.id })}>
                  <span className="lx-next__dot" aria-hidden="true" />
                  <span>Your {nextArea.label} shelf is empty. <b>Add one</b></span>
                </button>
              )}
            </div>
            <div className="lx-hero__visual">
              <div className="lx-ring-card">
                <WebEcosystemChart groups={ecoGroups} onPick={() => onViewEcosystem?.()} />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <BuildHero greeting={`Hello, ${name}`} onStartQuiz={onStartQuiz} onViewDiscovery={onViewDiscovery} onOpenProduct={onOpenProduct} />
      )}

      <Trust onViewDiscovery={onViewDiscovery} />

      <ShopSection
        title={personalize ? 'Picked for you' : 'Popular on ayna'}
        chips={chips}
        filter={filter}
        setFilter={setFilter}
        filters={filters}
        setFilters={setFilters}
        productTypes={productTypes}
        ecosystem
        onViewDiscovery={onViewDiscovery}
        personalizeControl={(
          <label className="lx-toggle">
            <span>Personalized</span>
            <Toggle on={personalize} onClick={() => setPersonalize((v) => !v)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPersonalize((v) => !v); } }} />
          </label>
        )}
      >
        <div className="lx-grid">
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
        {shownProducts.length === 0 && <div className="lx-empty">No matches yet. Try another filter.</div>}
      </ShopSection>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Logged out                                                          */
/* ------------------------------------------------------------------ */

function FirstVisitLanding({ onStartQuiz, onViewArticles, onViewCommunity, onViewDiscovery, onOpenProduct }) {
  return (
    <div className="mockup-landing mockup-landing--first lx">
      <BuildHero onStartQuiz={onStartQuiz} onViewDiscovery={onViewDiscovery} onOpenProduct={onOpenProduct} />
      <Trust onViewDiscovery={onViewDiscovery} />
      <ValueProps />
      <HowItWorks onStartQuiz={onStartQuiz} />
      <div className="lx-needs-wrap">
        <ExploreByNeed
          onOpenProduct={onOpenProduct}
          onExplore={(n) => onViewDiscovery?.(exploreTarget(n))}
          onViewAll={() => onViewDiscovery?.('')}
        />
      </div>
      <div className="lx-stories">
        <WebHeroCarousel onStartQuiz={onStartQuiz} onViewArticles={onViewArticles} onViewCommunity={onViewCommunity} />
      </div>
      <FinalCta onStartQuiz={onStartQuiz} onViewDiscovery={onViewDiscovery} />
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
    />
  );
}
