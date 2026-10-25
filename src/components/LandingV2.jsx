import React, { useEffect, useMemo, useState } from 'react';
import { sentenceCase } from '../utils/sentenceCase.js';
import { TESTING_WATERS_NOTICE } from '../data/investRound';
import { useRecommendationViews } from '../utils/recommendationAnalytics';
import { productsForNeed } from './landingNeeds';
import { isPlainLeftClick } from '../utils/productRoute';
import { isPartnerBrandItem, PARTNER_BRANDS } from '../utils/partnerBrands';
import { getWeeklyTrendingLineup } from '../utils/trendingLineup';
import { ALL_PRODUCTS, MACRO_GROUPS, basicsProductIds, useCatalogReady } from '../data/catalog.js';
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
import { HOME_SEARCH_HINTS } from './shop/homeSearchHints.js';
import { edgeFadeRef } from '../utils/edgeFade';

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
 * Order (team direction 48, Oct 24): hero (one CTA, search as the value
 *         proposition, a moving scatter of real products, real ayna UI and
 *         real community posts) → brand ribbon → product examples (shop by
 *         need, sound familiar) → personalization (how it works, as UI) →
 *         community → evidence and trust (numbers, reads, founders) → the one
 *         clear CTA → invest (sky, last).
 * Imagery (team direction 49-50): generic mood-board photos were replaced
 * by real product photos and real UI wherever one could do the job; the
 * slots that still want real ayna photography are listed in the report.
 * Members get the same page with their name, their dashboard row and their picks.
 * Nothing on the page is sticky; the ribbon is the one moving row and follows
 * hover, focus, the footer's Pause motion and reduced motion. */

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

function Hero({ onStartQuiz, onSearch, personal = null, banner = null, posts = [] }) {
  const cta = personal && (personal.ecoCount > 0 || personal.hasQuiz)
    ? <Go className="ay-btn ay-btn--primary" href="/you/ecosystem" onGo={personal.onOpenEcosystem}>Open my ecosystem<Arrow /></Go>
    : banner || <Go className="ay-btn ay-btn--primary" href="/quiz" onGo={onStartQuiz}>See my matches<Arrow /></Go>;
  return (
    <section className="hm-hero" aria-labelledby="hm-hero-title">
      <div className="hm-wrap hm-hero__grid">
        <div className="hm-hero__copy">
          {personal ? <>
            <h1 id="hm-hero-title" className="ed-display hm-display hm-display--personal">Welcome back, <span className="hm-swipe">{personal.name}</span>.</h1>
            <p className="hm-lead">{personal.ecoCount > 0 ? `${personal.ecoCount} product${personal.ecoCount === 1 ? '' : 's'} in your ecosystem.` : 'Health products matched to your body.'}</p>
          </> : <>
            <h1 id="hm-hero-title" className="ed-display hm-display">Health products <span className="hm-swipe">matched</span> to you.</h1>
            <p className="hm-lead">Search what you need, or answer a few short questions. ayna shows what fits your body and life stage, with the evidence beside each product.</p>
          </>}
          <div className="hm-hero__actions">{cta}</div>
          <Search onSearch={onSearch} />
        </div>
        <HeroScatter posts={posts} />
      </div>
    </section>
  );
}

/* ---------- hero visual: a slow scatter of real things from ayna ----------
   Real catalog photos (this week's picks), two pieces of real ayna UI (the
   evidence meter and the matched-to-you seal), and real community posts when
   there are any. No stock photo, no invented quote, no invented number.
   Movement is a slow drift (home.css), off under reduced motion and Pause. */
function HeroScatter({ posts = [] }) {
  const ready = useCatalogReady();
  const products = useMemo(() => (ready ? weeklyLineup().slice(0, 5) : []), [ready]);
  const post = posts.find((x) => String(x?.body || '').trim().length >= 20) || null;
  const who = post ? (post.is_anonymous || !post.author_id ? 'Anonymous' : post.author_display_name || post.author_username || 'Community member') : '';
  const body = post ? String(post.body).trim() : '';
  return (
    <div className="hm-hero__art hm-scatter" role="img" aria-label="Real products from the ayna shop, an evidence rating and a post from the ayna community">
      {products.length
        ? products.map((p, i) => (
          <span key={p.id} className={`hm-scatter__item hm-scatter__prod is-${i + 1}`} aria-hidden="true">
            <img src={p.image} alt="" loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
          </span>
        ))
        : [1, 2, 3].map((i) => <span key={i} className={`hm-scatter__item hm-scatter__prod is-${i} is-skel`} aria-hidden="true" />)}
      <span className="hm-scatter__item hm-scatter__ui is-evidence" aria-hidden="true">
        <small>Evidence</small>
        <span className="ay-meter" data-level="3"><span className="ay-meter__word">Strong evidence</span><span className="ay-meter__bars">{[1, 2, 3].map((b) => <i key={b} />)}</span></span>
        <span className="hm-scatter__note">Research on the product itself</span>
      </span>
      {post && (
        <span className="hm-scatter__item hm-scatter__ui is-post" aria-hidden="true">
          <small>{post.kind === 'question' ? 'Question' : post.kind === 'review' ? 'Review' : 'Post'} from {who}</small>
          <span className="hm-scatter__body">{body.length > 110 ? `${body.slice(0, 107).trim()}…` : body}</span>
        </span>
      )}
      <Seal className="hm-hero__seal hm-scatter__seal" />
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

/* ---------- shop by need: die-cut product stickers on a pink band ----------
   One row of chips (scrolls sideways, edge fade, never wraps), four products.
   The first chip is this week's picks (or, signed in, her top picks). */
function ShopBand({ onOpenProduct, onViewDiscovery, picks = null }) {
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
    .filter((n) => n.pool.length >= 2), [ready]);
  const picksTab = pickItems.length >= 2 ? { id: 'picks', label: mine ? 'Top picks for you' : 'This week’s picks', picks: true, pool: pickItems } : null;
  const tabs = picksTab ? [picksTab, ...needs] : needs;
  const [id, setId] = useState('picks');
  const need = tabs.find((n) => n.id === id) || tabs[0];
  let four = [];
  if (need?.picks) four = need.pool;
  else if (need) {
    const partner = need.pool.filter((p) => isPartnerBrandItem(p)).slice(0, 1);
    const rest = need.pool.filter((p) => !isPartnerBrandItem(p));
    four = [...partner, ...rest].slice(0, 4).sort((a, b) => need.pool.indexOf(a) - need.pool.indexOf(b));
  }
  if (!need && ready) return null;
  return (
    <section className="hm-shop ay-band ay-band--pink ay-band--scallop-bottom" aria-labelledby="hm-shop-title" aria-busy={need ? undefined : 'true'}>
      <div className="hm-wrap">
        <header className="hm-head">
          <h2 id="hm-shop-title" className="hm-h2">Explore by need</h2>
        </header>
        <div className="hm-chips" role="group" aria-label="Choose picks or a need" ref={edgeFadeRef}>
          {need ? tabs.map((n) => (<button key={n.id} type="button" className="ay-chip" aria-pressed={n.id === need.id} onClick={() => setId(n.id)}>{n.label}{!n.picks && <span className="ay-chip__count"><span className="ed-sr">, </span>{n.pool.length}<span className="ed-sr"> products</span></span>}</button>))
            : [0, 1, 2, 3, 4].map((i) => <span key={i} className="hm-chips__skel" aria-hidden="true" />)}
        </div>
        <ul className="hm-stickers" key={need?.id || 'loading'} aria-label={need ? (need.picks ? need.label : `${need.label} products`) : 'Loading products'}>
          {need ? four.map((p) => (<li key={p.id}><ProductCard product={p} onOpen={onOpenProduct} className="hm-sticker" /></li>))
            : [0, 1, 2, 3].map((i) => <li key={i} aria-hidden="true"><div className="hm-sticker__skel" /></li>)}
        </ul>
        {need && !need.picks && (
          <div className="hm-shop__foot">
            <Go className="ay-btn ay-btn--secondary" href="/explore/products" onGo={() => onViewDiscovery?.(need.group ? { initialMacroGroup: need.group } : '')}>See all {need.label.toLowerCase()} products</Go>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- does this sound familiar? A list of real needs ----------
   One row per need: a lifestyle photo, the need said the way people say it,
   and "See what helps" (searches the Shop for it). Each quote is a common need
   from the quiz (WebIntake.jsx COMMON_NEEDS). These are prompts, not
   testimonials. Rows, not a checkerboard (master prompt 154: no bento). */
// Each need shows a real product for it from the catalog (was a mood-board photo).
const FAMILIAR = [
  { q: 'My cramps knock me out every month.', need: 'Cramps or period pain', match: /cramp|period pain|menstrual pain|dysmenorr|heat/i },
  { q: 'I bleed through everything.', need: 'Heavy periods', match: /heavy|period underwear|overnight pad|super/i },
  { q: 'I leak a little when I sneeze.', need: 'Bladder leakage or incontinence', match: /bladder|incontinen|leak|pelvic floor/i },
  { q: 'Things feel dry down there.', need: 'Vaginal dryness', match: /dryness|lubric|moistur|vaginal dry/i },
];
function productFor(t, taken) {
  const text = (p) => `${p.name || ''} ${p.category || ''} ${(p.healthFunctions || []).join(' ')} ${(p.tags || []).join(' ')}`;
  return ALL_PRODUCTS.find((p) => p?.image && NEEDS_PHOTO(p) && !taken.has(p.id) && t.match.test(text(p)) && !/\banal\b|vibrator|dildo/i.test(String(p.name || ''))) || null;
}
function Familiar({ onSearch }) {
  const ready = useCatalogReady();
  const rows = useMemo(() => {
    const taken = new Set();
    return FAMILIAR.map((t) => { const p = ready ? productFor(t, taken) : null; if (p) taken.add(p.id); return { ...t, product: p }; });
  }, [ready]);
  return (
    <section className="hm-sec hm-familiar" aria-labelledby="hm-familiar-title">
      <div className="hm-wrap">
        <header className="hm-head">
          <h2 id="hm-familiar-title" className="hm-h2">Does this sound familiar?</h2>
        </header>
        <ul className="hm-needs">
          {rows.map((t) => (
            <li key={t.q}>
              <a className="hm-needs__row" href={`/explore/products?q=${encodeURIComponent(t.need)}`} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onSearch?.(t.need); }}>
                <span className="hm-needs__ph is-product">{t.product ? <img src={t.product.image} alt="" loading="lazy" decoding="async" /> : null}</span>
                <span className="hm-needs__quote">“{t.q}”</span>
                <span className="hm-needs__go">See what helps <Arrow /></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- how it works: huge coloured numerals, a real photo per step ---------- */
// Each step shows the real piece of ayna it describes (was a mood-board photo).
const STEPS = [
  { t: 'Answer a few short questions', d: 'About your body, your life stage and what you avoid.', ui: 'quiz' },
  { t: 'We check the evidence', d: 'Across products, apps and care.', ui: 'evidence' },
  { t: 'Get matches that fit you', d: 'Ranked for you, each with a plain reason.', ui: 'matches' },
  { t: 'You decide', d: 'Nothing is bought until you say so.', ui: 'decide' },
];
// Real life-stage options from the quiz (intakeModel LIFE_STAGE_LABELS), so the first step shows who ayna is for.
const STAGE_CHIPS = ['Regular periods', 'Trying to conceive', 'Postpartum', 'Perimenopause', 'Post-menopause'];
function StepUI({ kind, products }) {
  if (kind === 'quiz') return <span className="hm-stepui is-quiz" aria-hidden="true"><small>Your life stage</small>{STAGE_CHIPS.map((c, i) => <span key={c} className={`ay-chip${i === 3 ? ' is-on' : ''}`}>{c}</span>)}</span>;
  if (kind === 'evidence') return <span className="hm-stepui is-evidence" aria-hidden="true">{LEVELS.map((l) => <span key={l.n} className="ay-meter" data-level={l.n}><span className="ay-meter__word">{l.word}</span><span className="ay-meter__bars">{[1, 2, 3].map((b) => <i key={b} />)}</span></span>)}</span>;
  if (kind === 'matches') return <span className="hm-stepui is-matches" aria-hidden="true">{products.slice(0, 3).map((p) => <span key={p.id} className="hm-stepui__prod"><img src={p.image} alt="" loading="lazy" decoding="async" /></span>)}</span>;
  return <span className="hm-stepui is-decide" aria-hidden="true"><span className="hm-stepui__btn">Save</span><span className="hm-stepui__btn is-quiet">Compare</span><small>Buy only when you choose</small></span>;
}
function How({ onViewHowItWorks }) {
  const ready = useCatalogReady();
  // Three real products not already in the hero (the start of the list when the week is short).
  const products = useMemo(() => { if (!ready) return []; const all = weeklyLineup(); return (all.length >= 8 ? all.slice(5, 8) : all.slice(0, 3)); }, [ready]);
  return (
    <section className="hm-sec hm-how ay-band ay-band--espresso ay-band--scallop" aria-labelledby="hm-how-title">
      <div className="hm-wrap">
        <header className="hm-head">
          <h2 id="hm-how-title" className="hm-h2">How ayna fits it to you</h2>
          <Go className="ay-btn ay-btn--text hm-head__all" href="/how-it-works" onGo={onViewHowItWorks}><span className="hm-head__long">The full method</span><span className="hm-head__short">See all<span className="ed-sr"> of the method</span></span><Arrow /></Go>
        </header>
        <ol className="hm-steps">
          {STEPS.map((st, i) => (
            <li key={st.t} className="hm-step">
              <span className="hm-step__ph is-ui"><StepUI kind={st.ui} products={products} /></span>
              <span className="hm-step__n" aria-hidden="true">{i + 1}</span>
              <div className="hm-step__text">
                <h3 className="hm-h3"><span className="ed-sr">Step {i + 1}: </span>{st.t}</h3>
                <p>{st.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- the one clear call to action, near the end ---------- */
function Start({ onStartQuiz }) {
  return (
    <section className="hm-sec hm-startsec" aria-labelledby="hm-start-title">
      <div className="hm-wrap">
        <div className="hm-start">
          <span className="hm-tab" aria-hidden="true">Start here</span>
          <div>
            <h2 id="hm-start-title" className="hm-h2">Start with a few short questions.</h2>
            <p className="hm-lead">Then see what fits you, with the evidence beside it.</p>
          </div>
          <div className="hm-start__cta">
            <Go className="ay-btn ay-btn--primary" href="/quiz" onGo={onStartQuiz}>See my matches<Arrow /></Go>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- proof: the catalog in numbers + how evidence is graded ----------
   Every number is counted from the catalog when it loads (nothing typed in). */
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
    return [
      { n: ALL_PRODUCTS.length, label: 'products in Explore' },
      { n: brands.size, label: 'brands, big and small' },
      { n: sources.size, label: 'sources linked on product pages' },
      { n: needs, label: 'areas of care, from periods to menopause' },
    ];
  }, [ready]);
}
function Evidence({ onViewArticles }) {
  const nums = useCatalogNumbers();
  return (
    <section className="hm-sec hm-ev" aria-labelledby="hm-ev-title">
      <div className="hm-wrap hm-ev__grid">
        <div className="hm-ev__panel">
          <h2 id="hm-ev-title" className="hm-h2">Every product shows how strong its evidence is.</h2>
          <p className="hm-body">ayna matches women’s health products to your answers, and shows the research beside each one. Unsupported claims are labeled, not upgraded into facts.</p>
          <dl className="hm-stats" aria-busy={nums ? undefined : 'true'}>
            {(nums || [0, 1, 2, 3].map(() => null)).map((s, i) => (
              <div key={i} className="hm-stat">
                <dt className="hm-stat__n">{s ? s.n.toLocaleString('en-US') : <span className="hm-stat__skel" aria-hidden="true" />}</dt>
                <dd>{s ? s.label : ' '}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="hm-ev__side">
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
          <Go className="ay-btn ay-btn--text" href="/explore/resources" onGo={onViewArticles}>Read our sources<Arrow /></Go>
        </div>
      </div>
    </section>
  );
}

/* ---------- reads: three reads and today's word, as plain rows ---------- */
const LEAD_READS = [
  { id: 'heavy-bleeding', title: 'Heavy menstrual bleeding', teaser: 'What counts as heavy bleeding, possible causes, when to seek care, and how it’s evaluated.', source: 'UpToDate · ACOG · CDC', src: '/landing/articles-heavy-bleeding-satin.webp', alt: 'Pads and tampons scattered on red satin', tone: 'pink' },
  { id: 'period-pain-when-to-seek-care', title: 'Period Pain: When to Seek Care', teaser: 'Normal cramps vs. signs that something else may be going on, and what clinicians may suggest.', source: 'ACOG · UpToDate · Mayo Clinic', src: '/landing/articles-period-pain-hotwater.webp', alt: 'A woman in striped pajamas holding a hot water bottle', tone: 'sky' },
  { id: 'pcos-basics', title: 'PMOS: What It Is and How It’s Managed', teaser: 'Diagnosis, symptoms, and evidence-based treatment, including lifestyle and medication.', source: 'ACOG · Endocrine Society · UpToDate', src: '/landing/articles-pcos-mirror.webp', alt: 'Red lips reflected in a small red compact mirror', tone: 'butter' },
];
function Reads({ onViewArticle, onViewArticles }) {
  const fact = useMemo(() => { try { return getDailyFact(); } catch { return null; } }, []);
  const open = (id) => { if (onViewArticle) onViewArticle(id); else onViewArticles?.(); };
  return (
    <section className="hm-sec hm-reads" aria-labelledby="hm-reads-title">
      <div className="hm-wrap">
        <header className="hm-head">
          <h2 id="hm-reads-title" className="hm-h2">Quick reads about your body, with sources</h2>
          <a className="ay-btn ay-btn--text hm-head__all" href="/explore/resources" onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onViewArticles?.(); }}><span className="hm-head__long">Open the Library</span><span className="hm-head__short">See all<span className="ed-sr"> reads in the Library</span></span><Arrow /></a>
        </header>
        {/* Plain rows (master prompt 154: no bento): photo, title, one line, sources. */}
        <ul className="hm-readlist">
          {LEAD_READS.map((r) => (
            <li key={r.id}>
              <a className="hm-readlist__row" href={`/library/${r.id}`} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); open(r.id); }}>
                <span className="hm-readlist__ph"><Photo src={r.src} alt={r.alt} sizes="(max-width: 767px) 96px, 160px" loading="lazy" /></span>
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
    </section>
  );
}

/* ---------- community: the pink band (news, real talk, members' top posts) ---------- */
function Community({ onViewCommunity, posts = [] }) {
  const news = useLatestAnnouncement();
  return (
    <section className="hm-sec hm-comm ay-band ay-band--pink ay-band--scallop" aria-labelledby="hm-comm-title">
      <div className="hm-wrap hm-comm__grid is-nophoto">
        <div className="hm-comm__copy">
          <h2 id="hm-comm-title" className="hm-h2 hm-h2--big">Real talk about what women actually use.</h2>
          <p className="hm-body">Reviews, questions and routines from women who use these products. Ask a question, review what you use or share a playlist.</p>
          <article className="hm-news" aria-labelledby="hm-news-title">
            <span className="hm-tab hm-news__label">ayna news</span>
            <h3 id="hm-news-title" className="hm-h3">{news ? news.title : 'ayna Community is open.'}</h3>
            <p>{news ? news.body : 'Ask questions, review what you use and share playlists with women who get it.'}</p>
            <Go className="ay-btn ay-btn--secondary" href="/community" onGo={onViewCommunity}>{news ? 'Read it in Community' : 'Read reviews and questions'}<Arrow /></Go>
          </article>
          {posts.length > 0 && (
            <ul className="hm-posts" aria-label="From the Powder Room">
              {posts.slice(0, 3).map((post) => {
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
        </div>
      </div>
    </section>
  );
}

/* ---------- who we are: a taped polaroid ---------- */
function Us({ onViewAbout }) {
  return (
    <section className="hm-sec hm-us" aria-labelledby="hm-us-title">
      <div className="hm-wrap hm-us__grid">
        <figure className="hm-polaroid">
          <span className="hm-tape hm-tape--l" aria-hidden="true" />
          <span className="hm-tape hm-tape--r" aria-hidden="true" />
          <span className="hm-polaroid__ph"><Photo sizes="(max-width: 767px) 88vw, 600px" src="/team/ayna-founders.jpg" alt="Puloma, Eliz and Ameera, ayna's founders, sitting together in Central Park" loading="lazy" width="1800" height="1198" /></span>
          <figcaption>Puloma, Eliz &amp; Ameera</figcaption>
        </figure>
        <div className="hm-us__copy">
          <h2 id="hm-us-title" className="hm-h2 hm-h2--big">Built by three women who wanted better answers.</h2>
          <p className="hm-body">We met at Cornell, bringing different experiences to the same question: why does understanding our options require so much searching?</p>
          <Go className="ay-btn ay-btn--secondary" href="/about" onGo={onViewAbout}>Meet us</Go>
        </div>
      </div>
    </section>
  );
}

/* ---------- the community round: split sky band, copy + photo ----------
   Investment copy lives in src/data/invest.js. The disclaimer stays with the button. */
function Invest() {
  return (
    <section className="hm-invest ay-band ay-band--sky ay-band--scallop" aria-labelledby="hm-invest-title">
      <div className="hm-invest__grid is-nophoto">
        <div className="hm-invest__copy">
          <h2 id="hm-invest-title" className="hm-h2 hm-h2--big">Invest in ayna</h2>
          <p className="hm-body">We&rsquo;re so excited to extend an opportunity for you to invest in ayna, whether you&rsquo;re one of our earliest ayna users or a part of the greater community passionate about ayna&rsquo;s work to expand the future of women&rsquo;s health. Join our community round and learn more on Wefunder.</p>
          <a className="ay-btn ay-btn--secondary" href={WEFUNDER_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackInvestClick('landing')}>
            Invest on Wefunder<span className="ed-sr"> (opens in a new tab)</span><Arrow />
          </a>
          <p className="hm-invest__legal">{TESTING_WATERS_NOTICE}</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- page ---------- */
// `personal` (signed in): the same page with a welcome-back hero, and
// `personalSlot` (her dashboard row) right under it; `communityPosts` are
// the two most helpful Powder Room posts, shown in the community band.
export default function LandingV2({ onStartQuiz, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewCommunity, onViewHowItWorks, onSearch, personal = null, personalSlot = null, communityPosts = [], heroBanner = null }) {
  const paused = useMotionPaused();
  const rest = useAfterHeroPaint();
  return (
    <div className={`ed ed-home hm${paused ? ' is-paused' : ''}`}>
      {/* Community posts sit lower down, after how it works, never above the value prop (founder, Oct 24). */}
      <Hero onStartQuiz={onStartQuiz} onSearch={onSearch} personal={personal} banner={heroBanner} posts={[]} />
      {personal?.dashboard ? <div className="hm-slot">{personalSlot}</div> : <Brands onViewWaitlist={onViewWaitlist} />}
      {!personal?.dashboard && personalSlot && <div className="hm-slot">{personalSlot}</div>}
      <ShopBand onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} picks={personal?.topPicks || null} />
      {rest && <>
      {!personal && <Familiar onSearch={onSearch} />}
      <How onViewHowItWorks={onViewHowItWorks} />
      <Community onViewCommunity={onViewCommunity} posts={communityPosts} />
      <Evidence onViewArticles={onViewArticles} />
      <Reads onViewArticle={onViewArticle} onViewArticles={onViewArticles} />
      <Us onViewAbout={onViewAbout} />
      {!(personal && personal.hasQuiz) && <Start onStartQuiz={onStartQuiz} />}
      <Invest />
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
    const img = document.querySelector('.hm-hero__main img');
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
