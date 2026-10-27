import React, { useEffect, useMemo, useState } from 'react';
import { hasClinicalSources, CLINICAL_SOURCES_LABEL } from '../utils/clinicalSources';
import PartnerStrip from './PartnerStrip';
import { getSupabaseClient } from '../utils/supabaseClient';
import * as communityStore from '../utils/community/communityStore.js';
import { shownMatchPercent } from '../utils/bestMatchSort.js';
import '../styles/eco-redesign.css';
import '../styles/landing.css';
// The catalog loads after first paint (data/catalog.js); WelcomeBack re-renders when it lands.
import { ALL_PRODUCTS, CATEGORY_LABELS, MACRO_GROUPS, itemMatchesMacroGroup, getProductMatchDetailsForProduct, basicsProductIds, useCatalogReady } from '../data/catalog.js';
import ProductCard from './ProductCard';
import SmartSearchInput from './search/SmartSearchInput.jsx';
import { edgeFadeRef } from '../utils/edgeFade';
import LandingV2 from './LandingV2';
import { pickReadForYou } from '../data/readPicks.js';
import ProductTileImage from './ProductTileImage';
import { getVerificationLinks } from '../utils/verificationLinks';


/**
 * Website home, laid out by the design rulebook (/tmp figma RULEBOOK §14):
 *
 *   FirstVisitLanding  photo-first hero (Build your ecosystem + search),
 *                      shop by need, trust band (partners + proof row),
 *                      founders moment, how it works (3 + CTA), photo band,
 *                      Reads preview, stories, final CTA band.
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

const hasClinicianSupport = hasClinicalSources;

function hasCommunitySupport(product) {
  const rating = explicitRating(product);
  const communityLinks = getVerificationLinks(product, 'community');
  return (Number.isFinite(rating) && rating >= 4) || Boolean(product?.communityReview) || communityLinks.length > 0;
}

/** Mirrors Discovery's "Ayna" match-quality filter, minus the quiz-derived
 * best-match ranking that only Discovery has access to, here "Best Match"
 * just means "already recommended to you," and "In My ecosystem" is only
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
    else if (lower.includes('pcos') || lower.includes('pmos')) opts.initialSymptom = 'pcos';
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
function Toggle({ on, offTrack = 'rgba(62, 39, 35, .35)', onTrack = 'var(--color-primary)', onKnob = 'var(--color-citric)', ...rest }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      {...rest}
      style={{
        padding: 0,
        border: 0,
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
        background: on ? onKnob : '#ffedac',
        transition: 'left 0.2s ease, background 0.2s ease',
      }} />
    </button>
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

/** "Build your ecosystem": photo-first hero. Two of the founder's own
 * photographs (public/landing/), a short headline, one primary CTA and the
 * search. The old orbit toy moved out so the first thing anyone sees is a
 * real image, not UI. */
function BuildHero({ onStartQuiz, onViewDiscovery, greeting }) {
  return (
    <section className="lx-hero lx-hero--photo" aria-labelledby="lx-hero-title">
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
          <div className="lx-photo-stack">
            <img
              className="lx-photo-stack__main"
              src="/landing/pink-tile-shelf.webp"
              alt="Everyday care products lined up on a pink tiled bathroom ledge"
              width="667"
              height="1000"
              fetchPriority="high"
            />
            <img
              className="lx-photo-stack__small"
              src="/landing/vanity-mirror.webp"
              alt="A woman taking notes at her vanity table"
              width="735"
              height="490"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}


function Trust({ onViewDiscovery }) {
  return (
    <div className="lx-trust">
      <div className="mockup-page">
        <PartnerStrip variant="web" title={'Brands we work with'} onSelectBrand={(name) => onViewDiscovery?.(name)} />
      </div>
    </div>
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
          {ecosystem && <option value="best-match">Best match</option>}
          <option value="clinician">{CLINICAL_SOURCES_LABEL}</option>
          <option value="community">Community favorite</option>
          {ecosystem && <option value="ecosystem">In my routine</option>}
        </select>
      </label>
      <label>
        <span>Preferences</span>
        <select value={f.preference} onChange={(e) => set('preference', e.target.value)}>
          <option value="all">Any</option>
          <option value="organic">Organic</option>
          <option value="fragrance-free">Fragrance free</option>
          <option value="sensitive-skin">Sensitive skin</option>
          <option value="vegan">Vegan</option>
          <option value="cruelty-free">Cruelty free</option>
          <option value="reusable">Reusable</option>
        </select>
      </label>
      <label>
        <span>Sustainability</span>
        <select value={f.sustainability} onChange={(e) => set('sustainability', e.target.value)}>
          <option value="all">Any</option>
          <option value="reusable">Reusable</option>
          <option value="recyclable">Recyclable</option>
          <option value="low-waste">Low waste</option>
          <option value="packaging">Sustainable packaging</option>
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
          <option value="fsa-hsa">FSA/HSA eligible</option>
          <option value="fsa">FSA eligible</option>
          <option value="hsa">HSA eligible</option>
        </select>
      </label>
      <button type="button" onClick={onClear}>Clear filters</button>
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
function ShopSection({ title, chips, filter, setFilter, filters, setFilters, productTypes, ecosystem, personalizeControl, onViewDiscovery, children, minimal = false }) {
  const [open, setOpen] = useState(false);
  const active = Object.keys(NO_FILTERS).filter((k) => filters[k] !== 'all').length;
  return (
    <section className="lx-shop" aria-labelledby="lx-shop-title">
      <div className="mockup-page">
        <div className="lx-shop__head">
          <h2 id="lx-shop-title" className="lx-h2">{title}</h2>
          {!minimal && <div className="lx-shop__tools">
            <button type="button" className={`lx-pill${open ? ' is-on' : ''}`} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
              Filters{active ? ` (${active})` : ''}
            </button>
            {personalizeControl}
          </div>}
        </div>
        <div className="lx-chips" ref={edgeFadeRef}>
          {chips.map((item) => (
            <button key={item.key} type="button" aria-pressed={filter === item.key} className={filter === item.key ? 'is-on' : undefined} onClick={() => setFilter(item.key)}>
              {item.label}
            </button>
          ))}
          <button type="button" className="lx-chips__more" onClick={() => onViewDiscovery?.('')}>More in the Shop</button>
        </div>
        {open && !minimal && (
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
          <button type="button" className="lx-ghost" onClick={() => onViewDiscovery?.('')}>See all in the Shop</button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Logged in                                                           */
/* ------------------------------------------------------------------ */

function WelcomeBack({ heroBanner = null, user, myProducts, recommendedProductIds = [], onStartQuiz, onViewDiscovery, onViewEcosystem, onViewCommunity, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewHowItWorks, onOpenProduct, initialCategory = null, savedProducts = {}, quizResults = null, healthProfile = null, matchOpts = null }) {
  const name = displayNameFromUser(user) || 'there';
  const [filter] = useCategoryParam(initialCategory);
  const personalize = true;
  const filters = NO_FILTERS;
  const ready = useCatalogReady();

  const ownedIds = useMemo(() => new Set(Object.keys(myProducts || {})), [myProducts]);
  const recommendedIds = useMemo(() => new Set(recommendedProductIds || []), [recommendedProductIds]);
  const ownedCategories = useMemo(() => new Set(Object.values(myProducts || {}).map((p) => p.category).filter(Boolean)), [myProducts]);


  const shownProducts = useMemo(() => {
    let list = ALL_PRODUCTS.filter((p) => p?.id && p?.name && !ownedIds.has(p.id) && matchesShopFilter(p, filter));
    list = applyFilters(list, filters, { ownedIds, recommendedIds });
    if (personalize && quizResults) {
      // Drugstore basics (Advil, Aleve, Monistat...) come after curated and partner picks.
      const BASICS_IDS = basicsProductIds();
      // Top picks by the same match % the cards show; nothing under 70% is
      // called "for your needs".
      const scored = list.map((p) => ({ p, m: shownMatchPercent(getProductMatchDetailsForProduct(p, quizResults, healthProfile, matchOpts)) }))
        .filter((x) => x.m >= 70 && x.p.image).sort((a, b) => (BASICS_IDS.has(a.p.id) - BASICS_IDS.has(b.p.id)) || (b.m - a.m));
      if (scored.length >= 4) {
        // Spread across her needs: one per area first (on "All"), then fill by score.
        if (filter && filter !== 'all') return scored.slice(0, 4).map((x) => x.p);
        const areaOf = (p) => MACRO_GROUPS.find((g) => g.id !== 'all' && itemMatchesMacroGroup(p, g.id))?.id || p.category;
        const seen = new Set(); const first = [];
        for (const x of scored) { if (BASICS_IDS.has(x.p.id)) continue; const a = areaOf(x.p); if (!seen.has(a)) { seen.add(a); first.push(x); } if (first.length === 4) break; }
        const rest = scored.filter((x) => !first.includes(x));
        return [...first, ...rest].slice(0, 4).map((x) => x.p);
      }
    }
    if (personalize) {
      const score = (p) => (recommendedIds.has(p.id) ? 2 : ownedCategories.has(p.category) ? 1 : 0);
      list = [...list].sort((a, b) => score(b) - score(a));
    }
    return list.slice(0, 4);
  }, [filter, filters, personalize, ownedIds, recommendedIds, ownedCategories, quizResults, healthProfile, matchOpts, ready]);

  // HI03: the one next step. A random empty core area, picked once per page load
  // (seed fixed at mount so it does not flicker when her shelf changes).
  const nextSeed = 0;
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    let live = true;
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;
    // About three curated public posts: the most helpful real ones (very short ones, like test posts, are skipped).
    communityStore.listFeedPosts(supabase, { limit: 12, sort: 'helpful' }).then((rows) => {
      if (live) setPosts((rows || []).filter((r) => String(r.body || '').trim().length >= 20).slice(0, 3));
    }).catch(() => {});
    return () => { live = false; };
  }, []);
  const nextArea = useMemo(() => {
    const owned = Object.values(myProducts || {});
    const core = ['period', 'intimate', 'hormones', 'pelvic', 'sleep-stress', 'skin'];
    const empty = MACRO_GROUPS.filter((g) => core.includes(g.id) && !owned.some((p) => itemMatchesMacroGroup(p, g.id)));
    // From her answers first: the area of her best matches that she has nothing in yet.
    const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
    for (const id of recommendedProductIds || []) {
      const p = byId.get(id);
      const g = p && MACRO_GROUPS.find((x) => x.id !== 'all' && itemMatchesMacroGroup(p, x.id) && !owned.some((o) => itemMatchesMacroGroup(o, x.id)));
      if (g) return g;
    }
    return empty.length ? empty[Math.floor(nextSeed * empty.length)] : null;
  }, [myProducts, nextSeed, recommendedProductIds, ready]);
  const picks = Object.keys(myProducts || {}).length;

  // Signed in, Home is the landing page (same layout and story) with her own
  // pieces under the welcome-back hero.
  // Member dashboard (Pass 7): next step, saved, one read for her, then matches.
  const read = useMemo(() => pickReadForYou(quizResults, healthProfile), [quizResults, healthProfile]);
  const savedList = useMemo(() => {
    const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
    // Saved is "for later": anything already on her shelves isn't repeated here.
    return Object.keys(savedProducts || {}).filter((id) => !myProducts?.[id]).map((id) => byId.get(id) || (savedProducts[id]?.id ? savedProducts[id] : null)).filter(Boolean);
  }, [savedProducts, myProducts, ready]);
  // A peek at her matches in the next-step area, so that card is never empty.
  const nextAreaPicks = useMemo(() => {
    if (!nextArea) return [];
    const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
    return (recommendedProductIds || []).map((id) => byId.get(id)).filter((p) => p && itemMatchesMacroGroup(p, nextArea.id)).slice(0, 4);
  }, [nextArea, recommendedProductIds, ready]);
  // "New since your last visit": matches she has not been shown on Home before.
  const SEEN_KEY = 'ayna_home_seen_matches_v1';
  const [seenAtLoad] = useState(() => { try { const v = JSON.parse(localStorage.getItem(SEEN_KEY) || 'null'); return Array.isArray(v) ? new Set(v) : null; } catch { return null; } });
  const showingMatches = Boolean(personalize && quizResults && (!filter || filter === 'all'));
  useEffect(() => {
    if (!showingMatches) return;
    try {
      const seen = new Set(seenAtLoad || []);
      shownProducts.forEach((p) => seen.add(p.id));
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-400)));
    } catch { /* private mode */ }
  }, [showingMatches, shownProducts, seenAtLoad]);

  // Her dashboard row: one Group in three parts (next step, saved, a read).
  const slot = (
    <section className="ed-wrap" aria-label="Your ayna">
      <div className="ay-group is-padded ed-dash">
        {nextArea ? (
          <button type="button" className="ed-dash__part" onClick={() => onViewDiscovery?.({ initialMacroGroup: nextArea.id })}>
            <span className="ed-dash__label">Your next step</span>
            <strong className="ed-dash__title">{nextAreaPicks.length ? `Your matches in ${nextArea.label}` : `Start your ${nextArea.label} shelf`}</strong>
            {nextAreaPicks.length > 0 ? (
              <ul className="ed-dash__thumbs" aria-hidden="true">
                {nextAreaPicks.map((p) => <li key={p.id}><span><ProductTileImage product={p} /></span></li>)}
              </ul>
            ) : <span className="ed-dash__body">Nothing on your shelves for {nextArea.label.toLowerCase()} yet. See what fits you.</span>}
            <span className="ed-dash__go">Browse {nextArea.label} <Arrow /></span>
          </button>
        ) : (
          <button type="button" className="ed-dash__part" onClick={() => onViewEcosystem?.()}>
            <span className="ed-dash__label">Your next step</span>
            <strong className="ed-dash__title">{picks > 0 ? `Check your ${picks} product${picks === 1 ? '' : 's'}` : 'See your matches'}</strong>
            <span className="ed-dash__go">Open my ecosystem <Arrow /></span>
          </button>
        )}
        <div className="ed-dash__part">
          <span className="ed-dash__label">Saved</span>
          {savedList.length > 0 ? (
            <>
              <strong className="ed-dash__title">{savedList.length} saved for later</strong>
              <ul className="ed-dash__thumbs">
                {savedList.slice(0, 4).map((p) => (
                  <li key={p.id}><button type="button" onClick={() => onOpenProduct?.(p)} aria-label={`${p.brand ? `${p.brand} ` : ''}${p.name}`}><ProductTileImage product={p} /></button></li>
                ))}
              </ul>
              <button type="button" className="ed-dash__go" onClick={() => onViewEcosystem?.()}>See all saved <Arrow /></button>
            </>
          ) : (
            <>
              <strong className="ed-dash__title">Nothing saved yet</strong>
              <span className="ed-dash__body">Tap the heart on anything in the Shop to keep it here.</span>
              <button type="button" className="ed-dash__go" onClick={() => onViewDiscovery?.('')}>Go to Shop <Arrow /></button>
            </>
          )}
        </div>
        {read ? (
          <a className="ed-dash__part" href={`/library/${read.id}`} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); if (onViewArticle) onViewArticle(read.id); else onViewArticles?.(); }}>
            <span className="ed-dash__label">A read for you</span>
            <strong className="ed-dash__title">{read.title}</strong>
            <span className="ed-dash__body">{read.teaser}</span>
            <span className="ed-dash__go">Read it <Arrow /></span>
          </a>
        ) : (
          <button type="button" className="ed-dash__part" onClick={() => onViewArticles?.()}>
            <span className="ed-dash__label">Library</span>
            <strong className="ed-dash__title">Quick reads about your body</strong>
            <span className="ed-dash__body">Answer the quiz and we will pick the read that fits you.</span>
            <span className="ed-dash__go">Open the Library <Arrow /></span>
          </button>
        )}
      </div>
    </section>
  );
  return (
    <div className="mockup-landing mockup-landing--first mockup-landing--returning">
      <LandingV2
        onStartQuiz={onStartQuiz}
        onViewDiscovery={onViewDiscovery}
        onOpenProduct={onOpenProduct}
        onViewArticles={onViewArticles}
        onViewArticle={onViewArticle}
        onViewAbout={onViewAbout}
        onViewCommunity={onViewCommunity}
        onViewWaitlist={onViewWaitlist}
        onViewHowItWorks={onViewHowItWorks}
        onSearch={(q) => onViewDiscovery?.(discoveryTargetFor(q))}
        personal={{ name, ecoCount: picks, hasQuiz: Boolean(quizResults), onOpenEcosystem: onViewEcosystem, dashboard: Boolean(picks > 0 || quizResults), topPicks: showingMatches ? shownProducts : null }}
        personalSlot={(picks > 0 || quizResults) ? slot : null}
        communityPosts={(picks > 0 || quizResults) ? posts : []}
        heroBanner={heroBanner}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Logged out                                                          */
/* ------------------------------------------------------------------ */

function FirstVisitLanding({ heroBanner = null, onStartQuiz, onViewCommunity, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewHowItWorks, onViewDiscovery, onOpenProduct }) {
  // Real community posts for the hero scatter and the community band (the same
  // public feed guests can read in Community). None loaded: nothing is shown.
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    let live = true;
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;
    communityStore.listFeedPosts(supabase, { limit: 12, sort: 'helpful' }).then((rows) => {
      if (live) setPosts((rows || []).filter((r) => String(r.body || '').trim().length >= 20).slice(0, 3));
    }).catch(() => {});
    return () => { live = false; };
  }, []);
  return (
    <div className="mockup-landing mockup-landing--first">
      <LandingV2
        onStartQuiz={onStartQuiz}
        onViewDiscovery={onViewDiscovery}
        onOpenProduct={onOpenProduct}
        onViewArticles={onViewArticles}
        onViewArticle={onViewArticle}
        onViewAbout={onViewAbout}
        onViewCommunity={onViewCommunity}
        onViewWaitlist={onViewWaitlist}
        onViewHowItWorks={onViewHowItWorks}
        onSearch={(q) => onViewDiscovery?.(discoveryTargetFor(q))}
        heroBanner={heroBanner}
        communityPosts={posts}
      />
    </div>
  );
}

export default function AynaLanding({
  onStartQuiz,
  onViewDiscovery,
  onOpenProduct,
  onViewEcosystem,
  onViewArticles,
  onViewArticle,
  onViewAbout,
  onViewCommunity,
  onViewWaitlist,
  onViewHowItWorks,
  user,
  myProducts,
  recommendedProductIds = [],
  initialCategory = null,
  loading = false,
  savedProducts = {},
  onToggleSaved,
  quizResults = null,
  healthProfile = null,
  matchOpts = null,
  heroBanner = null,
}) {
  // HI01: hold a skeleton until the session and profile resolve, so a
  // returning user never sees the new-visitor page flash first.
  if (loading) return <HomeSkeleton />;
  // The logo opens the same landing signed in or out (founder, Oct 27 01:13); WelcomeBack is kept for reference.
  if (user && false) {
    return (
      <WelcomeBack
        heroBanner={heroBanner}
        user={user}
        myProducts={myProducts}
        savedProducts={savedProducts}
        onToggleSaved={onToggleSaved}
        recommendedProductIds={recommendedProductIds}
        onStartQuiz={onStartQuiz}
        onViewDiscovery={onViewDiscovery}
        onViewEcosystem={onViewEcosystem}
        onViewCommunity={onViewCommunity}
        onViewArticles={onViewArticles}
        onViewArticle={onViewArticle}
        onViewAbout={onViewAbout}
        onViewWaitlist={onViewWaitlist}
        onViewHowItWorks={onViewHowItWorks}
        onOpenProduct={onOpenProduct}
        initialCategory={initialCategory}
        quizResults={quizResults}
        healthProfile={healthProfile}
        matchOpts={matchOpts}
      />
    );
  }

  return (
    <FirstVisitLanding
      heroBanner={heroBanner}
      onStartQuiz={onStartQuiz}
      onViewArticles={onViewArticles}
      onViewArticle={onViewArticle}
      onViewAbout={onViewAbout}
      onViewWaitlist={onViewWaitlist}
      onViewHowItWorks={onViewHowItWorks}
      onViewCommunity={onViewCommunity}
      onViewDiscovery={onViewDiscovery}
      onOpenProduct={onOpenProduct}
    />
  );
}
