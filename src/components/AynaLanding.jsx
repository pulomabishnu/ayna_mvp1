import React, { useEffect, useMemo, useState } from 'react';
import { productsForNeed } from './landingNeeds';
import { productHref, isPlainLeftClick } from '../utils/productRoute';
import { isPartnerBrandItem, PARTNER_BRANDS } from '../utils/partnerBrands';
import { getWeeklyTrendingLineup } from '../utils/trendingLineup';
import PartnerStrip from './PartnerStrip';
import { getRecommendedArticles } from './articleRecommendations';
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


/* ---------- First-visit landing (photo-led, Glow-style layout) ----------
 * what -> why -> how -> proof -> experience -> action:
 *   PhotoHero (what, the primary action) -> ShopRow (the real product, by
 *   need) -> TrustBand (proof) -> How it works -> Founders -> photo band ->
 *   Reads -> final CTA. One expressive face (Bricolage), her photographs,
 *   a yellow marker underline and a round sticker as the signature devices. */
const HERO_PHOTOS = [
  { src: '/landing/tub-girls.webp', alt: 'Two friends getting ready together in a bathtub, surrounded by makeup', pos: '50% 35%', w: 736, h: 1104 },
  { src: '/landing/robe-kiss.webp', alt: 'A woman in a striped robe blowing a kiss to the mirror light', pos: '50% 30%', w: 736, h: 981 },
  { src: '/landing/bed-selfie.webp', alt: 'A woman lying on a bed taking a selfie, her beauty routine laid out around her', pos: '50% 40%', w: 736, h: 1104 },
];

/** Gentle scroll reveal for a few sections. Content is visible without JS or
 * IntersectionObserver, and for reduced-motion users. */
function useReveal() {
  const ref = React.useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    el.setAttribute('data-reveal', 'wait');
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      el.setAttribute('data-reveal', 'in');
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
    // Scroll position is the source of truth (an IntersectionObserver can miss
    // fast scrolls), and a timer guarantees nothing stays hidden.
    function check() {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92) show();
    }
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    const t = window.setTimeout(check, 100);
    const safety = window.setTimeout(show, 6000);
    return () => { window.clearTimeout(t); window.clearTimeout(safety); window.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
  }, []);
  return ref;
}

function LandingSearch({ onViewDiscovery, className = '' }) {
  const [query, setQuery] = useState('');
  const hint = useRotating(SEARCH_HINTS.length, 2600);
  const submit = (e) => { e.preventDefault(); onViewDiscovery?.(discoveryTargetFor(query)); };
  return (
    <form className={`lx-search lx-search--hero ${className}`} role="search" onSubmit={submit}>
      <label className="lx-search__field">
        <span className="lx-sr">Search products</span>
        <svg className="lx-search__icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        <SmartSearchInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          suggest={{ kinds: ['need', 'category', 'brand', 'product'], limit: 6 }}
          onPick={(s) => onViewDiscovery?.(discoveryTargetFor(s.query))}
          anchor=".lx-search--hero"
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

/** Y2K four-point sparkle, decorative. */
function Sparkle({ className = '', style }) {
  return (
    <svg className={`lx-sparkle ${className}`} style={style} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" /></svg>
  );
}

function WinBar({ title }) {
  return (
    <div className="lx-win" aria-hidden="true"><span className="lx-win__dots"><i /><i /><i /></span><span className="lx-win__title">{title}</span></div>
  );
}

function Ticker() {
  const names = PARTNER_BRANDS.map((b) => b.name);
  const row = (hidden) => (
    <ul className="lx-ticker__row" aria-hidden={hidden || undefined}>
      {[...names, ...names].map((t, i) => (<li key={i}>{t}<span aria-hidden="true">{'\u2605'}</span></li>))}
    </ul>
  );
  return (
    <div className="lx-ticker" role="presentation">
      <div className="lx-ticker__track">{row(false)}{row(true)}</div>
    </div>
  );
}

function PhotoHero({ onStartQuiz, onViewDiscovery }) {
  return (
    <section className="lx-phero" aria-labelledby="lx-hero-title">
      <div className="lx-phero__photos">
        {HERO_PHOTOS.map((ph, i) => (
          <img
            key={ph.src}
            src={ph.src}
            alt={ph.alt}
            width={ph.w}
            height={ph.h}
            style={{ objectPosition: ph.pos }}
            {...(i === 0 ? { fetchPriority: 'high' } : {})}
          />
        ))}
      </div>
      <div className="lx-phero__copy">
        <p className="lx-tag">Evidence beside every pick</p>
        <h1 id="lx-hero-title" className="lx-phero__title"><span className="lx-rise" style={{ '--i': 0 }}>Build your</span> <span className="lx-script lx-rise" style={{ '--i': 1 }}>ecosystem.</span></h1>
        <p className="lx-phero__sub">Health products matched to your body, with the evidence beside each one.</p>
        <button type="button" className="lx-cta lx-cta--photo" onClick={onStartQuiz}>
          See my matches
          <Arrow />
        </button>
        <p className="lx-phero__note">Six quick questions.</p>
        <LandingSearch onViewDiscovery={onViewDiscovery} />
      </div>
      <Sparkle className="lx-sp lx-sp--a" />
      <Sparkle className="lx-sp lx-sp--b" />
      <Sparkle className="lx-sp lx-sp--c" />
      <div className="lx-stamp" aria-hidden="true">
        <svg viewBox="0 0 200 200">
          <defs><linearGradient id="lx-holo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd3f0" /><stop offset=".35" stopColor="#cbd7ff" /><stop offset=".65" stopColor="#c3f6ee" /><stop offset="1" stopColor="#fff3b0" /></linearGradient><path id="lx-stamp-path" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" /></defs>
          <circle cx="100" cy="100" r="98" className="lx-stamp__disc" />
          <text><textPath href="#lx-stamp-path" startOffset="0" textLength="455" lengthAdjust="spacing">MATCHED TO YOU {'\u2605'} MATCHED TO YOU {'\u2605'}</textPath></text>
        </svg>
        <span className="lx-stamp__core">you</span>
      </div>
      <div className="lx-sticker" aria-hidden="true"><span>You<br />decide</span></div>
    </section>
  );
}

// Brands whose catalog photos are still lifestyle shots / awaiting brand-supplied images stay off the landing.
const NEEDS_PHOTO = (p) => !/tampon tribe|herau|r[eè]sa/i.test(`${p?.brand || ''} ${p?.name || ''}`);

/** Shop by need: pick a need, see four real products (partner brands first). */
function ShopRow({ onOpenProduct, onViewDiscovery }) {
  const needs = useMemo(() => MACRO_GROUPS.filter((g) => g.id !== 'all').map((g) => ({ id: g.id, label: g.label, group: g.id })).map((n) => ({ ...n, pool: productsForNeed(n).filter(NEEDS_PHOTO).sort((a, b) => Number(isPartnerBrandItem(b)) - Number(isPartnerBrandItem(a))) })).filter((n) => n.pool.length >= 2), []);
  const [needId, setNeedId] = useState(needs[0]?.id);
  const need = needs.find((n) => n.id === needId) || needs[0];
  const ref = useReveal();
  if (!need) return null;
  return (
    <section ref={ref} className="lx-shopshelf lx-band" aria-labelledby="lx-shop-title">
      <div className="mockup-page">
        <header className="lx-shopshelf__head">
          <Sparkle className="lx-sp lx-sp--l" />
          <h2 id="lx-shop-title" className="lx-display">Shop by <span className="lx-script">need</span></h2>
          <Sparkle className="lx-sp lx-sp--r" />
        </header>
        <div className="lx-needchips" role="group" aria-label="Choose a need">
          {needs.map((n) => (
            <button key={n.id} type="button" className={n.id === need.id ? 'is-on' : ''} aria-pressed={n.id === need.id} onClick={() => setNeedId(n.id)}>{n.label}</button>
          ))}
        </div>
        <ShelfList products={need.pool.slice(0, 4)} onOpenProduct={onOpenProduct} />
        <div className="lx-shopshelf__foot">
          <button type="button" className="lx-ghost" onClick={() => onViewDiscovery?.(exploreTarget(need))}>See all {need.label.toLowerCase()}</button>
          <button type="button" className="lx-link" onClick={() => onViewDiscovery?.('')}>Browse the whole Shop</button>
        </div>
      </div>
    </section>
  );
}

function ShelfList({ products, onOpenProduct, numbered = false }) {
  return (
    <ul className={`lx-shelf${numbered ? ' lx-shelf--num' : ''}`}>
      {products.map((p, i) => (
        <li key={p.id} style={{ '--i': i }}>
          <a
            className="lx-shelf__item"
            href={productHref(p.id)}
            onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onOpenProduct?.(p); }}
          >
            <span className="lx-shelf__img">{numbered && <span className="lx-burst lx-burst--n lx-shelf__rank" aria-hidden="true"><b>{i + 1}</b></span>}<img src={p.image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />{isPartnerBrandItem(p) && <span className="lx-shelf__badge">ayna<br />favorite</span>}</span>
            <span className="lx-shelf__row">
              <span className="lx-shelf__name">{p.name}</span>
              {/^\$/.test(String(p.price || '')) && <span className="lx-shelf__price">{String(p.price).split(/\s*[(\u2013-]\s*/)[0]}</span>}
            </span>
            {p.brand && <span className="lx-shelf__brand">{p.brand}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

const DECODED = [
  { title: 'Matched to your body', text: 'See how well each product fits you, based on what you tell us.', tone: 'pink', icon: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></> },
  { title: 'The evidence, right there', text: 'What the research says sits beside each product, with sources.', tone: 'butter', icon: <><path d="M7 4h7l4 4v12H7z" /><path d="M10 12h5M10 16h5" /></> },
  { title: 'Real experiences', text: 'Reviews and posts from women who have used it.', tone: 'peri', icon: <><path d="M5 5h14v10H10l-5 4z" /><path d="M9 9h6" /></> },
  { title: 'Your whole routine', text: 'Save what you use and see what fits next.', tone: 'mint', icon: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /><circle cx="18.5" cy="8" r="1.2" /></> },
];

/** "Your counter, decoded": four numbered, tappable reasons (auto-cycles until you tap). */
function CounterDecoded() {
  const ref = useReveal();
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (touched || typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setInterval(() => setActive((a) => (a + 1) % DECODED.length), 4200);
    return () => clearInterval(t);
  }, [touched]);
  const pick = (i) => { setTouched(true); setActive(i); };
  return (
    <section ref={ref} className="lx-decoded" aria-labelledby="lx-decoded-title">
      <div className="mockup-page">
        <div className="lx-decoded__panel lx-winbox">
          <WinBar title="counter.exe" />
          <figure className="lx-decoded__fig">
            <img src="/landing/marble-counter.webp" alt="A woman doing her makeup at a marble bathroom counter, photographed from above" width="736" height="1308" loading="lazy" />
            <span className="lx-grain" aria-hidden="true" />
            <figcaption key={active} className={`lx-decoded__tag tone-${DECODED[active].tone}`} aria-hidden="true"><b>{active + 1}</b> {DECODED[active].title}</figcaption>
          </figure>
          <div className="lx-decoded__head">
            <h2 id="lx-decoded-title" className="lx-h2">Your counter, <span className="lx-script">decoded.</span></h2>
            <p className="lx-decoded__lead">ayna is a women&rsquo;s health guide, not another store.</p>
          </div>
          <ol className="lx-decoded__list">
            {DECODED.map((d, i) => (
              <li key={d.title} className={`tone-${d.tone}${i === active ? ' is-on' : ''}`}>
                <button type="button" aria-pressed={i === active} onClick={() => pick(i)} onMouseEnter={() => { setTouched(true); setActive(i); }}>
                  <span className="lx-burst lx-burst--n" aria-hidden="true"><b>{i + 1}</b></span>
                  <svg className="lx-how__icon" viewBox="0 0 24 24" aria-hidden="true">{d.icon}</svg>
                  <span className="lx-decoded__txt"><strong>{d.title}</strong><em>{d.text}</em></span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** This week's Trending on ayna lineup (same rotation as the signed-in home). */
function TrendingRow({ onOpenProduct, onViewDiscovery }) {
  const items = useMemo(() => getWeeklyTrendingLineup(ALL_PRODUCTS).map((x) => x.product).filter((p) => p?.image && NEEDS_PHOTO(p)).slice(0, 4), []);
  const ref = useReveal();
  if (items.length < 2) return null;
  return (
    <section ref={ref} className="lx-trending" aria-labelledby="lx-trending-title">
      <div className="mockup-page">
        <div className="lx-trending__head">
          <h2 id="lx-trending-title" className="lx-h2">Trending on <span className="lx-script">ayna</span></h2>
          <button type="button" className="lx-ghost" onClick={() => onViewDiscovery?.('')}>See the Shop</button>
        </div>
        <ShelfList products={items} onOpenProduct={onOpenProduct} numbered />
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

/** Founders, high on the page: the real team photo, two lines, a link. */
function FoundersMoment({ onViewAbout }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="lx-founders" aria-labelledby="lx-founders-title">
      <div className="mockup-page lx-founders__inner">
        <div className="lx-founders__copy">
          <p className="lx-script lx-founders__label">who we are</p>
          <h2 id="lx-founders-title" className="lx-h2">Built by three women who wanted better answers.</h2>
          <p className="lx-founders__sub">Meet Puloma, Eliz and Ameera.</p>
          <button type="button" className="lx-ghost" onClick={onViewAbout}>Meet us</button>
        </div>
        <figure className="lx-founders__photo">
          <img src="/team/ayna-founders.jpg" alt="Puloma, Eliz and Ameera, ayna's founders, sitting together in Central Park" loading="lazy" width="1800" height="1198" />
          <span className="lx-grain" aria-hidden="true" />
          <figcaption className="lx-script">the ayna team</figcaption>
        </figure>
      </div>
    </section>
  );
}

/* A short photo interruption between UI sections: the founder's own shots. */
const BAND_PHOTOS = [
  { src: '/landing/curlers-call.webp', alt: 'A woman in hair curlers laughing on the phone in her bathroom', pos: '50% 20%' },
  { src: '/landing/sink-flatlay.webp', alt: 'A sink full of brushes, makeup and hair tools, photographed from above', pos: '50% 50%' },
  { src: '/landing/laundry-duo.webp', alt: 'Two friends in curlers and a towel reading magazines in a laundry room', pos: '50% 40%' },
  { src: '/landing/sink-heels-dryer.webp', alt: 'A vintage sink piled with a hair dryer, sunglasses and a pair of heels', pos: '50% 50%' },
  { src: '/landing/pajamas-overhead.webp', alt: 'A woman in red striped pajamas on the phone, photographed from above', pos: '50% 35%' },
  { src: '/landing/robe-vanity.webp', alt: 'A woman in a white robe sitting at a marble vanity in a pink room', pos: '50% 50%' },
  { src: '/landing/vanity-hairdryer.webp', alt: 'A woman drying her hair at a crowded bedroom vanity', pos: '50% 50%' },
  { src: '/landing/pad-thread-art.webp', alt: 'Red thread arranged over a white pad, photographed as still life', pos: '50% 50%' },
  { src: '/landing/sink-tea.webp', alt: 'A bathroom sink holding heels, sunglasses, a cup of tea and makeup', pos: '50% 50%' },
  { src: '/landing/bag-tubes.webp', alt: 'A vintage leather bag overflowing with colorful product tubes', pos: '50% 50%' },
];

function PhotoBand() {
  const list = (hidden) => (
    <ul className="lx-photoband__row" aria-hidden={hidden || undefined}>
      {BAND_PHOTOS.map((p) => (
        <li key={p.src}><img src={p.src} alt={hidden ? '' : p.alt} loading="lazy" style={{ objectPosition: p.pos }} /></li>
      ))}
    </ul>
  );
  return (
    <section className="lx-photoband" aria-label="Photographs from ayna">
      <div className="lx-photoband__track">{list(false)}{list(true)}</div>
    </section>
  );
}

/** A small Reads preview: three real Library articles, then the Library. */
function ReadsPreview({ onViewArticle, onViewArticles }) {
  const reads = useMemo(() => getRecommendedArticles(null).slice(0, 3), []);
  const ref = useReveal();
  if (!reads.length) return null;
  const open = (id) => { if (onViewArticle) onViewArticle(id); else onViewArticles?.(); };
  return (
    <section ref={ref} className="lx-reads" aria-labelledby="lx-reads-title">
      <div className="mockup-page">
        <div className="lx-reads__head">
          <h2 id="lx-reads-title" className="lx-h2">Short reads, real sources.</h2>
          <button type="button" className="lx-ghost" onClick={() => onViewArticles?.()}>Open the Library</button>
        </div>
        <div className="lx-reads__grid">
          {reads.map((a) => (
            <article key={a.id} className="lx-read">
              <button type="button" className="lx-read__btn" onClick={() => open(a.id)}>
                <span className="lx-read__img" aria-hidden="true">
                  <img src={`/articles/${a.id}.webp`} alt="" loading="lazy" onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }} />
                </span>
                <h3>{a.title}</h3>
                <p>{a.teaser}</p>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: 1, tone: 'pink', title: 'Answer six questions', text: 'About your body and what you avoid.', icon: <><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M9 9l1.5 1.5L13 8M9 15h6" /></> },
  { n: 2, tone: 'butter', title: 'We check the evidence', text: 'Across products, apps and care.', icon: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5M9 11h4" /></> },
  { n: 3, tone: 'peri', title: 'Get your ecosystem', text: 'Ranked for you. You decide.', icon: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /><circle cx="18.5" cy="8" r="1.2" /></> },
];

/** Pink "start" card + how it works, side by side (the one big block). */
function StartBlock({ onStartQuiz, onViewDiscovery }) {
  return (
    <section className="lx-start" aria-labelledby="lx-start-title">
      <div className="mockup-page lx-start__inner">
        <div className="lx-start__card lx-winbox">
          <WinBar title="start.exe" />
          <h2 id="lx-start-title" className="lx-display lx-start__title">Start with <span className="lx-script">six</span> questions.</h2>
          <img className="lx-start__photo" src="/landing/stalls-trio.webp" alt="Three friends chatting from neighboring bathroom stalls" width="734" height="397" loading="lazy" />
          <p className="lx-start__sub">Then a shop matched to you. Nothing is bought until you decide.</p>
          <button type="button" className="lx-cta" onClick={onStartQuiz}>
            See my matches
            <Arrow />
          </button>
          <button type="button" className="lx-link" onClick={() => onViewDiscovery?.('')}>Browse the Shop</button>
        </div>
        <div className="lx-how" aria-labelledby="lx-how-title">
          <h2 id="lx-how-title" className="lx-h2">How it <span className="lx-script">works</span></h2>
          <ol className="lx-how__steps">
            {STEPS.map((st) => (
              <li key={st.n} className={`tone-${st.tone}`}>
                <span className="lx-burst lx-burst--n" aria-hidden="true"><b>{st.n}</b></span>
                <svg className="lx-how__icon" viewBox="0 0 24 24" aria-hidden="true">{st.icon}</svg>
                <h3>{st.title}</h3>
                <p>{st.text}</p>
              </li>
            ))}
          </ol>
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

function FirstVisitLanding({ onStartQuiz, onViewArticles, onViewArticle, onViewAbout, onViewDiscovery, onOpenProduct }) {
  return (
    <div className="mockup-landing mockup-landing--first lx lx--photo">
      <Ticker />
      <PhotoHero onStartQuiz={onStartQuiz} onViewDiscovery={onViewDiscovery} />
      <FoundersMoment onViewAbout={onViewAbout} />
      <TrendingRow onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} />
      <ShopRow onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} />
      <PhotoBand />
      <CounterDecoded />
      <ReadsPreview onViewArticle={onViewArticle} onViewArticles={onViewArticles} />
      <StartBlock onStartQuiz={onStartQuiz} onViewDiscovery={onViewDiscovery} />
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
      onViewArticle={onViewArticle}
      onViewAbout={onViewAbout}
      onViewCommunity={onViewCommunity}
      onViewDiscovery={onViewDiscovery}
      onOpenProduct={onOpenProduct}
    />
  );
}
