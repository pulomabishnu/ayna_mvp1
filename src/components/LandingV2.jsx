import React, { useEffect, useMemo, useState } from 'react';
import { sentenceCase } from '../utils/sentenceCase.js';
import { TESTING_WATERS_NOTICE } from '../data/investRound';
import { useRecommendationViews } from '../utils/recommendationAnalytics';
import { productsForNeed } from './landingNeeds';
import { isPlainLeftClick } from '../utils/productRoute';
import { isPartnerBrandItem, PARTNER_BRANDS } from '../utils/partnerBrands';
import { getWeeklyTrendingLineup } from '../utils/trendingLineup';
import { ALL_PRODUCTS, MACRO_GROUPS, basicsProductIds, filterPrescriptionCareGate, useCatalogReady } from '../data/catalog.js';
import { RELEASED_STARTUPS } from '../data/startups.js';
import { getDailyFact } from '../data/welcomeSlides.js';
import { brandOf } from '../mobile/data/brandFallback.js';
import ProductCard from './ProductCard';
import SmartSearchInput from './search/SmartSearchInput.jsx';
import { useLatestAnnouncement } from '../hooks/useLatestAnnouncement';
import { WEFUNDER_URL, trackInvestClick } from '../data/invest';
import '../styles/editorial.css';
import '../styles/home.css';
import { Seal, Ribbon } from './personality/Bits.jsx';
import Photo from './ui/Photo.jsx';
import { Plate, Chip, BigFact, StandardsBand } from './ui/ay';
import { HOME_SEARCH_HINTS } from './shop/homeSearchHints.js';

/* The website home (v2, Oct 21). Styles: src/styles/home.css (hm-*).
 *
 * Visual thesis: a well-kept bathroom cabinet + a stationery scrapbook. Big
 * Bricolage type, real photos used large, full-bleed colour blocks that butt
 * against each other (no empty butter gaps), and crisp vector devices only:
 * the "matched to you" seal (once), the brand ribbon (once), die-cut product
 * stickers, a taped polaroid. References: Spicy Margarita (hero collage, huge
 * numerals, split dark/photo band), Retro Bloom (die-cut stickers on a colour
 * band), Feel Fits (checkerboard), Glossier (stat callouts beside a photo),
 * "Academy" (colourful read covers with a scalloped edge), Samba (taped photo).
 *
 * Order (landing audit, Oct 25: six sections, each answers one question):
 *   1 hero (what is ayna?): one photo, one product die-cut, one ayna UI card
 *     (evidence, Rundown, check-in or a post, swapping), the pink seal
 *   2 partner ticker (who's in it?)
 *   3 does this sound familiar + needs (is it for me?, pink band)
 *   4 how it works + evidence (why trust it?, espresso; ends in the one CTA)
 *   5 reads + community (is there more than shopping?)
 *   6 founders + invest (who's behind it?, butter, a small Wefunder card)
 * Headings: H1 56/36, section H2 36/26, one 44px statement (founders).
 * Kept from Oct 24 (factual fixes): one filled CTA, new tab names and
 * routes, "a few short questions", readable ink on butter and pink, real
 * products and UI next to the photos.
 * Members get the same page with their name, their dashboard row and their picks.
 * Nothing on the page is sticky. Two things move: the hero scatter and the
 * ribbon; both follow one Pause motion setting (hero button and footer),
 * reduced motion, and stop offscreen. */

// Plain words first (5-second test, P2-4): what people actually type.
const SEARCH_HINTS = HOME_SEARCH_HINTS; // tested against the real search (suggestionChips.test.js)
const NEEDS_PHOTO = (p) => !/tampon tribe|herau|r[eè]sa/i.test(`${p?.brand || ''} ${p?.name || ''}`);
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const Arrow = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>);

/* CTAs that go somewhere are links (open in a new tab, copy the address), not buttons. */
function Go({ href, onGo, className, children }) {
  return <a className={className} href={href} onClick={(e) => { if (!onGo || !isPlainLeftClick(e)) return; e.preventDefault(); onGo(); }}>{children}</a>;
}

/* ---------- hero ---------- */
function Search({ onSearch }) {
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (q || focused || reducedMotion()) return undefined;
    const t = window.setInterval(() => {
      if (document.documentElement.classList.contains('ay-motion-paused')) return;
      setI((v) => (v + 1) % SEARCH_HINTS.length);
    }, 2600);
    return () => window.clearInterval(t);
  }, [q, focused]);
  return (
    <form className="ed-search hm-search" role="search" onSubmit={(e) => { e.preventDefault(); onSearch(q); }}>
      <label>
        <span className="ed-sr">Search products</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        <SmartSearchInput
          type="search" value={q} onChange={(e) => setQ(e.target.value)}
          suggest={{ kinds: ['need', 'category', 'brand', 'product'], limit: 6 }}
          onPick={(s) => onSearch(s.query)} anchor=".ed-search" placeholder=" " enterKeyHint="search" autoComplete="off"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
        {!q && <span className="ed-search__hint" aria-hidden="true">Search <b key={i}>{SEARCH_HINTS[i]}</b></span>}
        {!q && !focused && <kbd className="ay-kbd" aria-hidden="true">{/Mac|iPhone|iPad/.test(typeof navigator !== 'undefined' ? navigator.platform || navigator.userAgent : '') ? '⌘K' : 'Ctrl K'}</kbd>}
      </label>
      <button type="submit" aria-label="Search"><Arrow /></button>
    </form>
  );
}

const STAR = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" /></svg>;
const STANDARDS = ['Matched to your body', 'Evidence beside each one', 'Partnerships never change your match'];
function Hero({ onStartQuiz, onSearch, personal = null, banner = null, posts = [], paused, onTogglePause }) {
  const cta = personal && (personal.ecoCount > 0 || personal.hasQuiz)
    ? <Go className="ay-btn ay-btn--primary" href="/you/ecosystem" onGo={personal.onOpenEcosystem}>Open my ecosystem<Arrow /></Go>
    : banner || <Go className="ay-btn ay-btn--primary" href="/quiz" onGo={onStartQuiz}>Get my matches<Arrow /></Go>;
  return (
    <section className="hm-hero" aria-labelledby="hm-hero-title">
      <div className="hm-wrap hm-hero__grid">
        <div className="hm-hero__copy">
          {personal ? <>
            <h1 id="hm-hero-title" className="ed-display hm-display hm-display--personal">Welcome back, <span className="hm-swipe">{personal.name}</span>.</h1>
            <p className="hm-lead">{personal.ecoCount > 0 ? `${personal.ecoCount} product${personal.ecoCount === 1 ? '' : 's'} in your ecosystem.` : 'Health products matched to your body.'}</p>
          </> : <>
            {/* One promise on the website and the app (landing audit 4 and 9). */}
            <h1 id="hm-hero-title" className="ed-display hm-display">Find what fits <span className="hm-swipe">your body</span>.</h1>
            <p className="hm-lead">Health products matched to your body. Search what you need, or answer a few short questions and see what fits, with the evidence beside each one.</p>
          </>}
          <div className="hm-hero__actions">{cta}</div>
          <Search onSearch={onSearch} />
        </div>
        <HeroScatter posts={posts} paused={paused} onTogglePause={onTogglePause} />
      </div>
      {/* Standards, stated once on the page (landing audit 10 and 11: Tower 28). */}
      <div className="hm-wrap hm-standards-wrap"><StandardsBand className="hm-standards" items={STANDARDS.map((title) => ({ title, icon: STAR }))} /></div>
    </section>
  );
}

/* ---------- hero visual: an animated scatter of real things from ayna ----------
   Founder, Oct 24 20:08 (Beauty Independent banner energy) + team direction 51.
   Research and rules: scratchpad DESIGN_RESEARCH_OCT24.md, section A.
   Slots hold real things only: two approved ayna photographs, real catalog
   product cutouts, real ayna UI (evidence meter, a real product card, the
   Daily Rundown card, the one-tap check-in) and real community posts when
   there are any. Nothing a visitor has to read moves: the copy sits still.
   Motion: every slot pops in once (staggered), then one slot at a time swaps
   what it holds (the old piece drops out, the new one rains in), one swap
   every SWAP_MS. Fixed slot boxes, transform/opacity only: no layout shift.
   Off under reduced motion (static scatter), offscreen, in a hidden tab and
   with Pause motion (the hero button and the footer share one setting). */
const SWAP_MS = 3800;
const money = (p) => { const n = Number(p?.price); return Number.isFinite(n) && n > 0 ? `$${n % 1 ? n.toFixed(2) : n}` : (typeof p?.price === 'string' ? p.price : ''); };
function UiPiece({ item }) {
  if (item.kind === 'evidence') return (
    <span className="hm-ui hm-ui--evidence">
      <span className="hm-ui__label">Evidence</span>
      <span className="ay-meter" data-level={item.level}><span className="ay-meter__word">{item.word}</span><span className="ay-meter__bars">{[1, 2, 3].map((b) => <i key={b} />)}</span></span>
      <span className="hm-ui__note">{item.note}</span>
    </span>
  );
  if (item.kind === 'product') return (
    <span className="hm-ui hm-ui--product">
      <span className="hm-ui__thumb"><img src={item.p.image} alt="" loading="lazy" decoding="async" /></span>
      <span className="hm-ui__text"><span className="hm-ui__brand">{brandOf(item.p) || item.p.brand}</span><span className="hm-ui__name">{item.p.name}</span>{money(item.p) && <span className="hm-ui__price">{money(item.p)}</span>}</span>
      <span className="hm-ui__save">Save</span>
    </span>
  );
  if (item.kind === 'rundown') return (
    <span className="hm-ui hm-ui--rundown">
      <span className="hm-ui__title">Your Daily Rundown</span>
      <span className="hm-ui__note">60 seconds. The things worth knowing about your health today.</span>
      <span className="hm-ui__pill">Start rundown</span>
    </span>
  );
  if (item.kind === 'checkin') return (
    <span className="hm-ui hm-ui--checkin">
      <span className="hm-ui__title">How are your cramps today?</span>
      <span className="hm-ui__opts">{['None', 'Mild', 'Moderate', 'Severe'].map((o, i) => <span key={o} className={i === 1 ? 'is-on' : undefined}>{o}</span>)}</span>
    </span>
  );
  return (
    <span className="hm-ui hm-ui--post">
      <span className="hm-ui__label">{item.label}</span>
      <span className="hm-ui__body">{item.body}</span>
    </span>
  );
}
function SlotPiece({ item }) {
  // #32 Glossier app: every product on the white scalloped plate, at the same scale.
  if (item.kind === 'prod') return <Plate src={item.p.image} alt="" stroke imgProps={{ loading: 'eager', decoding: 'auto' }} />;
  return <UiPiece item={item} />;
}
/* one slot: fixed box, the current piece plus the outgoing one while it leaves */
function Slot({ name, pool, step, index, still }) {
  const item = pool.length ? pool[step % pool.length] : null;
  const [shown, setShown] = useState(() => (item ? { cur: item, prev: null, n: 0 } : null));
  // A new piece for this slot: keep the old one for its exit (state adjusted while rendering, not in an effect).
  if (item && (!shown || shown.cur.id !== item.id)) setShown(!shown ? { cur: item, prev: null, n: 0 } : { cur: item, prev: shown.cur, n: shown.n + 1 });
  const leaving = shown?.prev ? shown.n : 0;
  useEffect(() => {
    if (!leaving) return undefined;
    const t = window.setTimeout(() => setShown((s) => (s ? { ...s, prev: null } : s)), 420);
    return () => window.clearTimeout(t);
  }, [leaving]);
  if (!shown) return <span className={`hm-slot hm-slot--${name} is-skel`} aria-hidden="true" />;
  return (
    <span className={`hm-slot hm-slot--${name}`} aria-hidden="true" style={{ '--i': index }}>
      {shown.prev && !still && <span key={`o-${shown.prev.id}`} className="hm-slot__layer is-out"><SlotPiece item={shown.prev} /></span>}
      <span key={`i-${shown.cur.id}`} className={`hm-slot__layer ${shown.n === 0 ? 'is-pop' : 'is-in'}`}><SlotPiece item={shown.cur} /></span>
    </span>
  );
}
function HeroScatter({ posts = [], paused = false, onTogglePause }) {
  const ready = useCatalogReady();
  const lineup = useMemo(() => (ready ? weeklyLineup().slice(0, 12) : []), [ready]);
  // Four objects (landing audit 6 and 11): the photo, a strip of three product
  // plates, one ayna UI card and the seal. The plates and the UI card swap
  // what they hold; the UI card cycles the evidence rating, real product
  // cards, the Daily Rundown, a check-in and real posts when there are any.
  const pools = useMemo(() => {
    const prods = lineup.map((p) => ({ id: `p-${p.id}`, kind: 'prod', p }));
    const cards = lineup.slice(6, 9).map((p) => ({ id: `c-${p.id}`, kind: 'product', p }));
    const real = posts.filter((x) => String(x?.body || '').trim().length >= 20).slice(0, 3).map((post) => {
      const who = post.is_anonymous || !post.author_id ? 'Anonymous' : post.author_display_name || post.author_username || 'Community member';
      const body = String(post.body).trim();
      return { id: `post-${post.id}`, kind: 'post', label: `${post.kind === 'question' ? 'Question' : post.kind === 'review' ? 'Review' : 'Post'} from ${who}`, body: body.length > 110 ? `${body.slice(0, 107).trim()}…` : body };
    });
    const ui = [
      { id: 'ev3', kind: 'evidence', level: 3, word: 'Strong evidence', note: 'Research on the product itself' },
      { id: 'rundown', kind: 'rundown' },
      ...cards.slice(0, 1),
      { id: 'ev2', kind: 'evidence', level: 2, word: 'Some evidence', note: 'Guidelines, or research on its ingredients' },
      ...real.slice(0, 1),
      { id: 'checkin', kind: 'checkin' },
      ...cards.slice(1, 3),
      ...real.slice(1),
    ];
    // Three plates in a strip (landing audit 11, #38 Rhode): the products dealt out in turn.
    return { p0: prods.filter((_, i) => i % 3 === 0), p1: prods.filter((_, i) => i % 3 === 1), p2: prods.filter((_, i) => i % 3 === 2), ui };
  }, [lineup, posts]);

  // Pause when offscreen or the tab is hidden (WCAG 2.2.2; battery).
  const ref = React.useRef(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const still = paused || reducedMotion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (still || !visible || !lineup.length) return undefined;
    const t = window.setInterval(() => { if (!document.hidden) setTick((v) => v + 1); }, SWAP_MS);
    return () => window.clearInterval(t);
  }, [still, visible, lineup.length]);
  // Round robin: one slot changes per tick, so the module drifts, never flickers.
  const ORDER = ['p0', 'ui', 'p1', 'p2'];
  const steps = Object.fromEntries(ORDER.map((k, i) => [k, tick > i ? Math.floor((tick - 1 - i) / ORDER.length) + 1 : 0]));
  return (
    <div ref={ref} className={`hm-hero__art hm-scatter${still ? ' is-still' : ''}`}>
      <p className="ed-sr">Pictured: ayna photography, real products from Explore and real ayna screens (an evidence rating, the Daily Rundown card, a check-in{pools.ui.some((x) => x.kind === 'post') ? ' and posts from the ayna Community' : ''}).</p>
      {/* No pop and no fetch priority: the H1 is the largest paint (LCP); this photo just arrives. */}
      <span className="hm-slot hm-slot--main" aria-hidden="true"><span className="hm-slot__layer"><Photo src="/landing/pink-stripe-floor.webp" alt="" sizes="(max-width: 767px) 60vw, (max-width: 1279px) 32vw, 340px" /></span></span>
      <span className="hm-strip" aria-hidden="true">
        {['p0', 'p1', 'p2'].map((k, i) => <Slot key={k} name="plate" pool={pools[k]} step={steps[k]} index={i + 1} still={still} />)}
      </span>
      <Slot name="ui" pool={pools.ui} step={steps.ui} index={4} still={still} />
      <Seal className="hm-hero__seal hm-scatter__seal" />
      {onTogglePause && !reducedMotion() && (
        <button type="button" className="hm-scatter__pause" aria-pressed={paused} onClick={onTogglePause}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{paused ? <path d="M8 5l11 7-11 7z" /> : <path d="M8 5v14M16 5v14" />}</svg>
          {paused ? 'Play motion' : 'Pause motion'}
        </button>
      )}
    </div>
  );
}

/* ---------- partner brands, once, attached under the hero ---------- */
function Brands({ onViewWaitlist }) {
  const names = PARTNER_BRANDS.map((b) => b.name);
  return (
    <section className="hm-brands" aria-labelledby="hm-brands-title">
      <h2 id="hm-brands-title" className="ed-sr">Brands we work with</h2>
      <Ribbon
        className="hm-ribbon"
        items={names}
        label="Partner brands"
        tab={<a className="ay-ribbon__tab" href="/partners" onClick={(e) => { if (!onViewWaitlist || !isPlainLeftClick(e)) return; e.preventDefault(); onViewWaitlist(); }}><span className="hm-ribbon__long">Brands we work with</span><span className="hm-ribbon__short" aria-hidden="true">Our brands</span><span aria-hidden="true">&nbsp;→</span></a>}
      />
    </section>
  );
}

// Core needs lead (periods, intimate care, menopause, pelvic floor); creams, sleep and gadgets come after.
const CORE = /pad|tampon|cup|disc|period|intimate|vaginal|menopause|pelvic|uti|cramp|fertility|postpartum|pregnan/i;
function weeklyLineup() {
  const list = getWeeklyTrendingLineup(ALL_PRODUCTS).map((x) => x.product)
    .filter((p) => p?.image && NEEDS_PHOTO(p) && !/sex|intimacy|toy/i.test(String(p.category || '')) && !/\banal\b|vibrator|dildo|mouth tape/i.test(String(p.name || '')));
  const core = list.filter((p) => CORE.test(`${p.category} ${(p.healthFunctions || []).join(' ')}`));
  return [...core, ...list.filter((p) => !core.includes(p))];
}

/* ---------- 3. does this sound familiar + needs (pink band) ----------
   Landing audit 6: the four phrases on the left; on the right six needs (plus
   All needs) and four products. With no need picked the four are this week's
   picks (signed in: her top picks). Each phrase is a common need from the quiz
   (WebIntake.jsx COMMON_NEEDS), said the way people say it; these are prompts,
   not testimonials. Each photo carries a real product from the catalog as a
   die-cut on its corner. Signed out, every card says "See your match" (no number). */
const FAMILIAR = [
  { q: 'My cramps knock me out every month.', need: 'Cramps or period pain', photo: '/landing/pajamas-overhead.webp', match: /cramp|period pain|menstrual pain|dysmenorr|heat/i },
  { q: 'I bleed through everything.', need: 'Heavy periods', photo: '/landing/sink-flatlay.webp', match: /heavy|period underwear|overnight pad|super/i },
  { q: 'I leak a little when I sneeze.', need: 'Bladder leakage or incontinence', photo: '/landing/curlers-call.webp', match: /bladder|incontinen|leak|pelvic floor/i },
  { q: 'Things feel dry down there.', need: 'Vaginal dryness', photo: '/landing/robe-vanity.webp', match: /dryness|lubric|moistur|vaginal dry/i },
];
const SHOWN_NEEDS = 6;
function productFor(t, taken) {
  const text = (p) => `${p.name || ''} ${p.category || ''} ${(p.healthFunctions || []).join(' ')} ${(p.tags || []).join(' ')}`;
  return ALL_PRODUCTS.find((p) => p?.image && NEEDS_PHOTO(p) && !taken.has(p.id) && t.match.test(text(p)) && !/\banal\b|vibrator|dildo/i.test(String(p.name || ''))) || null;
}
/* A die-cut on its plate: if the product photo fails to load, the plate goes too (never an empty white square). */
function DieCut({ product, className }) {
  const [failed, setFailed] = useState(false);
  if (!product?.image || failed) return null;
  return <span className={className}><img src={product.image} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} /></span>;
}
function Phrases({ onSearch }) {
  const ready = useCatalogReady();
  const rows = useMemo(() => {
    const taken = new Set();
    return FAMILIAR.map((t) => { const p = ready ? productFor(t, taken) : null; if (p) taken.add(p.id); return { ...t, product: p }; });
  }, [ready]);
  return (
    <ul className="hm-needs">
      {rows.map((t) => (
        <li key={t.q}>
          <a className="hm-needs__row" href={`/explore/products?q=${encodeURIComponent(t.need)}`} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onSearch?.(t.need); }}>
            <span className="hm-needs__ph"><Photo src={t.photo} alt="" sizes="96px" loading="lazy" decoding="auto" /><DieCut product={t.product} className="hm-needs__prod" /></span>
            <span className="hm-needs__quote">“{t.q}”</span>
            <span className="hm-needs__go">See what helps <Arrow /></span>
          </a>
        </li>
      ))}
    </ul>
  );
}
function NeedsBand({ onOpenProduct, onViewDiscovery, onSearch, onStartQuiz, picks = null, signedOut = true }) {
  const ready = useCatalogReady();
  const weekly = useMemo(() => (ready ? weeklyLineup().slice(0, 4) : []), [ready]);
  // Member picks: only products with a real photo, drugstore basics last.
  const personal = useMemo(() => {
    if (!picks) return null;
    const shown = picks.filter((p) => p?.image && NEEDS_PHOTO(p));
    const basics = basicsProductIds();
    return [...shown.filter((p) => !basics.has(p.id)), ...shown.filter((p) => basics.has(p.id))];
  }, [picks, ready]);
  const mine = Boolean(personal && personal.length >= 2);
  const pickItems = mine ? personal.slice(0, 4) : weekly;
  // recommendation_viewed for her top picks (not the weekly picks everyone sees).
  useRecommendationViews(mine ? pickItems : null, 'home_top_picks');
  const needs = useMemo(() => MACRO_GROUPS.filter((g) => g.id !== 'all')
    .map((g) => ({ id: g.id, label: sentenceCase(g.label), group: g.id }))
    .map((n) => ({ ...n, pool: productsForNeed(n).filter(NEEDS_PHOTO).sort((a, b) => Number(isPartnerBrandItem(b)) - Number(isPartnerBrandItem(a))) }))
    .filter((n) => n.pool.length >= 2)
    .slice(0, SHOWN_NEEDS), [ready]);
  const [id, setId] = useState(null);
  const need = needs.find((n) => n.id === id) || null;
  let four = pickItems;
  if (need) {
    const partner = need.pool.filter((p) => isPartnerBrandItem(p)).slice(0, 1);
    const rest = need.pool.filter((p) => !isPartnerBrandItem(p));
    four = [...partner, ...rest].slice(0, 4).sort((a, b) => need.pool.indexOf(a) - need.pool.indexOf(b));
  }
  const loading = !ready || (!need && four.length < 2);
  if (ready && !needs.length && four.length < 2) return null;
  const listName = need ? `${need.label} products` : mine ? 'Top picks for you' : 'This week’s picks';
  return (
    <section className="hm-sec hm-needsband" aria-labelledby="hm-familiar-title">
      <div className="hm-wrap">
        <header className="hm-head">
          <h2 id="hm-familiar-title" className="hm-h2">{signedOut ? 'Does this sound familiar?' : 'Explore by need'}</h2>
          <Go className="ay-btn ay-btn--text hm-head__all" href="/explore/products" onGo={() => onViewDiscovery?.('')}><span className="hm-head__long">See all products</span><span className="hm-head__short">See all<span className="ed-sr"> products</span></span><Arrow /></Go>
        </header>
        <div className={`hm-needsband__grid${signedOut ? '' : ' is-single'}`}>
          {signedOut && <Phrases onSearch={onSearch} />}
          <div className="hm-shop">
            <div className="hm-chips" role="group" aria-label="Choose a need">
              {needs.length ? <>
                {needs.map((n) => (<Chip key={n.id} selected={n.id === need?.id} onClick={() => setId(n.id === id ? null : n.id)}>{n.label} <span className="hm-chips__count"><span className="ed-sr">, </span>{n.pool.length}<span className="ed-sr"> products</span></span></Chip>))}
                <Go className="ayk-chip hm-chips__all" href="/explore/products" onGo={() => onViewDiscovery?.('')}>All needs<Arrow /></Go>
              </> : [0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="hm-chips__skel" aria-hidden="true" />)}
            </div>
            <p className="hm-shop__label" aria-live="polite">{listName}</p>
            <ul className="hm-stickers" key={need?.id || 'picks'} aria-label={loading ? 'Loading products' : listName}>
              {!loading ? four.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} onOpen={onOpenProduct} className="hm-sticker" />
                  {signedOut && <Go className="hm-sticker__match" href="/quiz" onGo={onStartQuiz}>See your match<Arrow /></Go>}
                </li>
              )) : [0, 1, 2, 3].map((i) => <li key={i} aria-hidden="true"><div className="hm-sticker__skel" /></li>)}
            </ul>
            {need && (
              <div className="hm-shop__foot">
                <Go className="ay-btn ay-btn--secondary" href="/explore/products" onGo={() => onViewDiscovery?.(need.group ? { initialMacroGroup: need.group } : '')}>See all {need.label.toLowerCase()} products</Go>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 4. how it works + evidence (espresso band) ----------
   Landing audit 6: three steps (Answer, We check the evidence, You decide),
   the three-level meter inside step 2, the four catalog numbers beneath and
   the one call to action. Each step keeps its approved photo; the real piece
   of ayna it describes sits on the photo as a sticker. */
const STEPS = [
  { t: 'Answer a few short questions', d: 'About your body, your life stage and what you avoid.', ui: 'quiz', src: '/landing/hiw-questions-cabinet.webp', pos: '50% 35%' },
  { t: 'We check the evidence', d: 'Across products, apps and care.', ui: 'evidence', src: '/landing/hiw-evidence-reading.webp', pos: '50% 40%' },
  { t: 'You decide', d: 'Nothing is bought until you say so.', ui: 'decide', src: '/landing/hiw-decide-basket.webp', pos: '50% 45%' },
];
// Real life-stage options from the quiz (intakeModel LIFE_STAGE_LABELS), so the first step shows who ayna is for.
const STAGE_CHIPS = ['Regular periods', 'Postpartum', 'Perimenopause', 'Post-menopause'];
function StepUI({ kind }) {
  if (kind === 'quiz') return <span className="hm-stepui is-quiz" aria-hidden="true">{STAGE_CHIPS.map((c, i) => <span key={c} className={`ay-chip${i === 2 ? ' is-on' : ''}`}>{c}</span>)}</span>;
  if (kind === 'decide') return <span className="hm-stepui is-decide" aria-hidden="true"><span className="hm-stepui__btn">Save</span><span className="hm-stepui__btn is-quiet">Compare</span></span>;
  return null;
}
/* proof: every number is counted from the catalog when it loads (nothing typed in). */
const LEVELS = [
  { n: 3, word: 'Strong evidence', note: 'Research on the product itself.' },
  { n: 2, word: 'Some evidence', note: 'Clinical guidelines, or research on its ingredients.' },
  { n: 1, word: 'Limited evidence', note: 'Less direct research so far. We say so plainly.' },
];
function useCatalogNumbers() {
  const ready = useCatalogReady();
  return useMemo(() => {
    if (!ready || !ALL_PRODUCTS.length) return null;
    const brands = new Set();
    const sources = new Set();
    for (const p of ALL_PRODUCTS) {
      const b = String(brandOf(p) || p.brand || '').trim().toLowerCase();
      if (b) brands.add(b);
      for (const k of ['scientificCitations', 'doctorOpinionCitations', 'safetyNoteSources']) {
        for (const c of (Array.isArray(p[k]) ? p[k] : [])) {
          const u = String(c?.url || '').trim().replace(/[#?].*$/, '').replace(/\/$/, '').toLowerCase();
          if (u) sources.add(u);
        }
      }
    }
    const needs = MACRO_GROUPS.filter((g) => g.id !== 'all').length;
    // The same count Explore shows: its products (prescription gate applied) plus released services.
    const products = filterPrescriptionCareGate(ALL_PRODUCTS).length;
    const services = RELEASED_STARTUPS.length;
    return [
      { n: products + services, label: `${products} products and ${services} services in Explore` },
      { n: brands.size, label: 'brands, big and small' },
      { n: sources.size, label: 'sources linked on product pages' },
      { n: needs, label: 'areas of care, from periods to menopause' },
    ];
  }, [ready]);
}
function HowEvidence({ onViewHowItWorks, onViewArticles, onStartQuiz, showStart = true }) {
  const nums = useCatalogNumbers();
  return (
    <section className="hm-sec hm-how ay-band ay-band--espresso" aria-labelledby="hm-how-title">
      <div className="hm-wrap">
        <header className="hm-head">
          <h2 id="hm-how-title" className="hm-h2">How ayna fits it to you</h2>
          <Go className="ay-btn ay-btn--text hm-head__all" href="/how-it-works" onGo={onViewHowItWorks}><span className="hm-head__long">The full method</span><span className="hm-head__short">See all<span className="ed-sr"> of the method</span></span><Arrow /></Go>
        </header>
        <p className="hm-body hm-how__lead">ayna matches women’s health products to your answers, and shows the research beside each one. Unsupported claims are labeled, not upgraded into facts.</p>
        <ol className="hm-steps">
          {STEPS.map((st, i) => (
            <li key={st.t} className="hm-step">
              <span className="hm-step__ph"><Photo src={st.src} alt="" sizes="(max-width: 767px) 96px, 380px" style={{ objectPosition: st.pos }} loading="lazy" decoding="auto" /><StepUI kind={st.ui} /></span>
              <span className="hm-step__n" aria-hidden="true">{i + 1}</span>
              <div className="hm-step__text">
                <h3 className="hm-h3"><span className="ed-sr">Step {i + 1}: </span>{st.t}</h3>
                <p>{st.d}</p>
                {st.ui === 'evidence' && <>
                  <ul className="hm-levels" aria-label="The three evidence levels">
                    {LEVELS.map((l) => (
                      <li key={l.n}>
                        <span className="ay-meter" data-level={l.n}>
                          <span className="ay-meter__word">{l.word}</span>
                          <span className="ay-meter__bars" role="img" aria-label={`${l.n} of 3`}>{[1, 2, 3].map((b) => <i key={b} />)}</span>
                        </span>
                        <span className="hm-levels__note">{l.note}</span>
                      </li>
                    ))}
                  </ul>
                  <Go className="ay-btn ay-btn--text hm-levels__more" href="/explore/resources" onGo={onViewArticles}>Read our sources<Arrow /></Go>
                </>}
              </div>
            </li>
          ))}
        </ol>
        <ul className="hm-stats" aria-busy={nums ? undefined : 'true'} aria-label="ayna in numbers">
          {(nums || [0, 1, 2, 3].map(() => null)).map((s, i) => (
            <li key={i}>{s ? <BigFact value={s.n.toLocaleString('en-US')} caption={s.label} /> : <span className="hm-stat__skel" aria-hidden="true" />}</li>
          ))}
        </ul>
        {/* The one call to action after the hero: it closes the method. */}
        {showStart && <div className="hm-how__cta"><Go className="ay-btn ay-btn--primary" href="/quiz" onGo={onStartQuiz}>Get my matches<Arrow /></Go></div>}
      </div>
    </section>
  );
}

/* ---------- 5. reads + community: two columns ---------- */
const LEAD_READS = [
  { id: 'heavy-bleeding', title: 'Heavy menstrual bleeding', teaser: 'What counts as heavy bleeding, possible causes, when to seek care, and how it’s evaluated.', source: 'UpToDate · ACOG · CDC', src: '/landing/articles-heavy-bleeding-satin.webp', alt: 'Pads and tampons scattered on red satin', tone: 'pink' },
  { id: 'period-pain-when-to-seek-care', title: 'Period Pain: When to Seek Care', teaser: 'Normal cramps vs. signs that something else may be going on, and what clinicians may suggest.', source: 'ACOG · UpToDate · Mayo Clinic', src: '/landing/articles-period-pain-hotwater.webp', alt: 'A woman in striped pajamas holding a hot water bottle', tone: 'sky' },
  { id: 'pcos-basics', title: 'PMOS: What It Is and How It’s Managed', teaser: 'Diagnosis, symptoms, and evidence-based treatment, including lifestyle and medication.', source: 'ACOG · Endocrine Society · UpToDate', src: '/landing/articles-pcos-mirror.webp', alt: 'Red lips reflected in a small red compact mirror', tone: 'butter' },
];
function Reads({ onViewArticle, onViewArticles }) {
  const fact = useMemo(() => { try { return getDailyFact(); } catch { return null; } }, []);
  const open = (id) => { if (onViewArticle) onViewArticle(id); else onViewArticles?.(); };
  return (
    <div className="hm-reads">
      <header className="hm-head">
        <h2 id="hm-reads-title" className="hm-h2">Quick reads about your body, with sources</h2>
        <a className="ay-btn ay-btn--text hm-head__all" href="/explore/resources" onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onViewArticles?.(); }}><span className="hm-head__long">Open the Library</span><span className="hm-head__short">See all<span className="ed-sr"> reads in the Library</span></span><Arrow /></a>
      </header>
      {/* Plain rows (master prompt 154: no bento): photo, title, one line, sources. */}
      <ul className="hm-readlist">
        {LEAD_READS.map((r) => (
          <li key={r.id}>
            <a className="hm-readlist__row" href={`/library/${r.id}`} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); open(r.id); }}>
              <span className="hm-readlist__ph"><Photo src={r.src} alt={r.alt} sizes="(max-width: 767px) 96px, 128px" loading="lazy" decoding="auto" /></span>
              <span className="hm-readlist__text">
                <strong className="hm-readlist__title">{r.title}</strong>
                <span className="hm-readlist__teaser">{r.teaser}</span>
                <small className="hm-readlist__src">Sources: {String(r.source || '').replace(/\s*·\s*/g, ', ')}</small>
              </span>
            </a>
          </li>
        ))}
        {fact && (
          <li>
            <aside className="hm-readlist__word" aria-label="Word of the day">
              <span className="hm-readlist__label">Word of the day</span>
              <strong className="hm-readlist__title">{fact.term}</strong>
              <span className="hm-readlist__teaser">{fact.text}</span>
              <small className="hm-readlist__src">From the ayna glossary. General information, not medical advice.</small>
            </aside>
          </li>
        )}
      </ul>
    </div>
  );
}
/* the Community card: its photo, the latest ayna news, and up to two real posts once there are any */
function Community({ onViewCommunity, posts = [] }) {
  const news = useLatestAnnouncement();
  return (
    <article className="hm-comm" aria-labelledby="hm-comm-title">
      <span className="hm-comm__ph"><Photo sizes="(max-width: 767px) 92vw, 460px" src="/landing/story-reviews-phones.webp" alt="Friends in a circle looking down at their phones, blue sky above" loading="lazy" decoding="auto" /></span>
      <div className="hm-comm__copy">
        <h2 id="hm-comm-title" className="hm-h2">Real talk about what women actually use.</h2>
        <p className="hm-body">Reviews, questions and routines from women who use these products. Ask a question, review what you use or share a playlist.</p>
        <div className="hm-news" aria-labelledby="hm-news-title">
          <span className="hm-tab hm-news__label">ayna news</span>
          <h3 id="hm-news-title" className="hm-h3">{news ? news.title : 'ayna Community is open.'}</h3>
          <p>{news ? news.body : 'Ask questions, review what you use and share playlists with women who get it.'}</p>
        </div>
        {posts.length > 0 && (
          <ul className="hm-posts" aria-label="From the Powder Room">
            {posts.slice(0, 2).map((post) => {
              const anon = post.is_anonymous || !post.author_id;
              const who = anon ? 'Anonymous' : post.author_display_name || post.author_username || 'Community member';
              return (
                <li key={post.id}>
                  <button type="button" className="hm-post" onClick={() => onViewCommunity?.()}>
                    <span className="hm-post__meta">{post.kind === 'question' ? 'Question' : post.kind === 'review' ? 'Review' : 'Post'} from {who}</span>
                    <span className="hm-post__body">{post.body}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <Go className="ay-btn ay-btn--secondary" href="/community" onGo={onViewCommunity}>{news ? 'Read it in Community' : 'Read reviews and questions'}<Arrow /></Go>
      </div>
    </article>
  );
}
function ReadsCommunity({ onViewArticle, onViewArticles, onViewCommunity, posts }) {
  return (
    <section className="hm-sec hm-rc ay-band ay-band--pink" aria-label="Reads and Community">
      <div className="hm-wrap hm-rc__grid">
        <Reads onViewArticle={onViewArticle} onViewArticles={onViewArticles} />
        <Community onViewCommunity={onViewCommunity} posts={posts} />
      </div>
    </section>
  );
}

/* ---------- 6. founders + invest (butter) ----------
   The founders' photo and story (the page's one 44px statement line), then a
   small Wefunder card. Investment copy lives in src/data/invest.js; the full
   legal notice stays with the button at 13px (legally required, readable). */
function FoundersInvest({ onViewAbout }) {
  return (
    <section className="hm-sec hm-us" aria-labelledby="hm-us-title">
      <div className="hm-wrap">
        <div className="hm-us__grid">
          <figure className="hm-polaroid">
            <span className="hm-polaroid__ph"><Photo sizes="(max-width: 767px) 92vw, 600px" src="/team/ayna-founders.jpg" alt="Puloma, Eliz and Ameera, ayna's founders, sitting together in Central Park" loading="lazy" decoding="auto" width="1800" height="1198" /></span>
            <figcaption>Puloma, Eliz &amp; Ameera</figcaption>
          </figure>
          <div className="hm-us__copy">
            <h2 id="hm-us-title" className="hm-h2 hm-statement">Built by three women who wanted better answers.</h2>
            <p className="hm-body">We met at Cornell, bringing different experiences to the same question: why does understanding our options require so much searching?</p>
            <Go className="ay-btn ay-btn--secondary" href="/about" onGo={onViewAbout}>Meet us</Go>
          </div>
        </div>
        <article className="hm-invest" aria-labelledby="hm-invest-title">
          <Seal className="hm-invest__seal" text="community round · community round · " />
          <span className="hm-invest__ph"><Photo sizes="200px" src="/landing/laundry-duo.webp" alt="Two friends in curlers reading magazines together on a laundry room floor" loading="lazy" decoding="auto" width="736" height="981" /></span>
          <div className="hm-invest__copy">
            <h3 id="hm-invest-title" className="hm-h3">Invest in ayna</h3>
            <p className="hm-body">We&rsquo;re so excited to extend an opportunity for you to invest in ayna, whether you&rsquo;re one of our earliest ayna users or a part of the greater community passionate about ayna&rsquo;s work to expand the future of women&rsquo;s health. Join our community round and learn more on Wefunder.</p>
            <a className="ay-btn ay-btn--secondary" href={WEFUNDER_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackInvestClick('landing')}>
              Invest on Wefunder<span className="ed-sr"> (opens in a new tab)</span><Arrow />
            </a>
            <p className="hm-invest__legal">{TESTING_WATERS_NOTICE}</p>
          </div>
        </article>
      </div>
    </section>
  );
}

/* ---------- page ---------- */
// `personal` (signed in): the same page with a welcome-back hero, and
// `personalSlot` (her dashboard row) right under it; `communityPosts` are
// the most helpful Powder Room posts (two are shown, in the Community card).
export default function LandingV2({ onStartQuiz, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewCommunity, onViewHowItWorks, onSearch, personal = null, personalSlot = null, communityPosts = [], heroBanner = null }) {
  const paused = useMotionPaused();
  const togglePause = () => {
    const next = !paused;
    document.documentElement.classList.toggle('ay-motion-paused', next);
    try { localStorage.setItem('ayna_motion_paused', next ? '1' : '0'); } catch { /* storage unavailable */ }
  };
  const rest = useAfterHeroPaint();
  return (
    <div className={`ed ed-home hm${paused ? ' is-paused' : ''}`}>
      {/* Community posts sit lower down, after how it works, never above the value prop (founder, Oct 24). */}
      <Hero onStartQuiz={onStartQuiz} onSearch={onSearch} personal={personal} banner={heroBanner} posts={[]} paused={paused} onTogglePause={togglePause} />
      {personal?.dashboard ? <div className="hm-personal">{personalSlot}</div> : <Brands onViewWaitlist={onViewWaitlist} />}
      {!personal?.dashboard && personalSlot && <div className="hm-personal">{personalSlot}</div>}
      <NeedsBand onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} onSearch={onSearch} onStartQuiz={onStartQuiz} picks={personal?.topPicks || null} signedOut={!personal} />
      {rest && <>
      <HowEvidence onViewHowItWorks={onViewHowItWorks} onViewArticles={onViewArticles} onStartQuiz={onStartQuiz} showStart={!(personal && personal.hasQuiz)} />
      <ReadsCommunity onViewArticle={onViewArticle} onViewArticles={onViewArticles} onViewCommunity={onViewCommunity} posts={communityPosts} />
      <FoundersInvest onViewAbout={onViewAbout} />
      </>}
    </div>
  );
}
/* LCP: the hero photo is the largest paint. Rendering the whole page in the
   first commit left the photo waiting behind one long task on slow phones, so
   everything after the shop band mounts once the photo is decoded (or after
   1.2s at most). It is below the fold on every screen size. */
function useAfterHeroPaint() {
  const [ready, setReady] = useState(() => typeof window === 'undefined' || window.scrollY > 0);
  useEffect(() => {
    if (ready) return undefined;
    let done = false;
    // two frames: the photo's first paint happens before the rest of the page renders
    const go = () => { if (done) return; done = true; requestAnimationFrame(() => requestAnimationFrame(() => window.setTimeout(() => setReady(true), 0))); };
    const img = document.querySelector('.hm-slot--main img');
    if (img?.decode) img.decode().then(go, go); else go();
    const t = window.setTimeout(go, 1200);
    return () => { done = true; window.clearTimeout(t); };
  }, [ready]);
  return ready;
}
function useMotionPaused() {
  const read = () => { try { return document.documentElement.classList.contains('ay-motion-paused') || localStorage.getItem('ayna_motion_paused') === '1'; } catch { return false; } };
  const [paused, setPaused] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setPaused(document.documentElement.classList.contains('ay-motion-paused')));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  return paused;
}
