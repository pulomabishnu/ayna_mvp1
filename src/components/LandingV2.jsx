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
 * Order:  hero → brand ribbon (attached) → shop by need (pink) → does this
 *         sound familiar → how it works (espresso) → evidence in numbers →
 *         reads → community (pink) → founders → invest (sky, last).
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

function Hero({ onStartQuiz, onSearch, personal = null, banner = null }) {
  const cta = personal && (personal.ecoCount > 0 || personal.hasQuiz)
    ? <Go className="ay-btn ay-btn--primary" href="/ecosystem" onGo={personal.onOpenEcosystem}>Open my ecosystem<Arrow /></Go>
    : banner || <Go className="ay-btn ay-btn--primary" href="/quiz" onGo={onStartQuiz}>See my matches<Arrow /></Go>;
  return (
    <section className="hm-hero" aria-labelledby="hm-hero-title">
      <div className="hm-wrap hm-hero__grid">
        <div className="hm-hero__copy">
          {personal ? <>
            <h1 id="hm-hero-title" className="ed-display hm-display hm-display--personal">Welcome back, <span className="hm-swipe">{personal.name}</span>.</h1>
            <p className="hm-lead">{personal.ecoCount > 0 ? `${personal.ecoCount} product${personal.ecoCount === 1 ? '' : 's'} in your ecosystem.` : 'Health products matched to your body.'}</p>
          </> : <>
            <h1 id="hm-hero-title" className="ed-display hm-display">Build your <span className="hm-swipe">ecosystem</span>.</h1>
            <p className="hm-lead">Health products matched to your body.</p>
          </>}
          <div className="hm-hero__actions">{cta}</div>
          <Search onSearch={onSearch} />
        </div>
        <div className="hm-hero__art">
          <span className="hm-hero__main"><Photo src="/landing/pink-stripe-floor.webp" alt="A woman sitting on a pink striped bathroom floor, her products spread around her" sizes="(max-width: 767px) 68vw, (max-width: 1279px) 40vw, 460px" fetchPriority="high" /></span>
          <span className="hm-hero__card"><Photo src="/landing/robe-kiss.webp" alt="A woman in a striped robe blowing a kiss to the mirror light" sizes="(max-width: 767px) 36vw, 240px" loading="lazy" /></span>
          <Seal className="hm-hero__seal" />
        </div>
      </div>
    </section>
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
          <h2 id="hm-shop-title" className="hm-h2">Shop by need</h2>
          <Go className="ay-btn ay-btn--text hm-head__all" href="/shop" onGo={() => onViewDiscovery?.('')}><span className="hm-head__long">Browse the whole Shop</span><span className="hm-head__short">See all<span className="ed-sr"> products in the Shop</span></span><Arrow /></Go>
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
            <Go className="ay-btn ay-btn--secondary" href="/shop" onGo={() => onViewDiscovery?.(need.group ? { initialMacroGroup: need.group } : '')}>See all {need.label.toLowerCase()} products</Go>
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
const FAMILIAR = [
  { q: 'My cramps knock me out every month.', need: 'Cramps or period pain', photo: '/landing/pajamas-overhead.webp', alt: 'A woman in red striped pajamas on the phone, from above' },
  { q: 'I bleed through everything.', need: 'Heavy periods', photo: '/landing/sink-flatlay.webp', alt: 'A sink full of brushes, makeup and hair tools, from above' },
  { q: 'I leak a little when I sneeze.', need: 'Bladder leakage or incontinence', photo: '/landing/curlers-call.webp', alt: 'A woman in hair curlers on a phone call' },
  { q: 'Things feel dry down there.', need: 'Vaginal dryness', photo: '/landing/robe-vanity.webp', alt: 'A woman in a white robe at a marble vanity in a pink room' },
];
function Familiar({ onSearch }) {
  return (
    <section className="hm-sec hm-familiar" aria-labelledby="hm-familiar-title">
      <div className="hm-wrap">
        <header className="hm-head">
          <h2 id="hm-familiar-title" className="hm-h2">Does this sound familiar?</h2>
        </header>
        <ul className="hm-needs">
          {FAMILIAR.map((t) => (
            <li key={t.q}>
              <a className="hm-needs__row" href={`/shop?q=${encodeURIComponent(t.need)}`} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onSearch?.(t.need); }}>
                <span className="hm-needs__ph"><Photo src={t.photo} alt={t.alt} sizes="96px" loading="lazy" /></span>
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
const STEPS = [
  { t: 'Answer six questions', d: 'About your body and what you avoid.', src: '/landing/hiw-questions-cabinet.webp', alt: 'A woman in a white robe reaching into her bathroom cabinet', pos: '50% 35%' },
  { t: 'We check the evidence', d: 'Across products, apps and care.', src: '/landing/hiw-evidence-reading.webp', alt: 'Two friends in glasses reading a book together in front of bookshelves', pos: '50% 40%' },
  { t: 'Get your ecosystem', d: 'Ranked for you.', src: '/landing/hiw-ecosystem-cabinet.webp', alt: 'A medicine cabinet with shelves full of skincare and beauty products', pos: '50% 50%' },
  { t: 'You decide', d: 'Nothing is bought until you say so.', src: '/landing/hiw-decide-basket.webp', alt: 'Looking down at a red shopping basket of products between two sneakers', pos: '50% 45%' },
];
function How({ onViewHowItWorks, onStartQuiz, onViewDiscovery, showStart = true }) {
  return (
    <section className="hm-sec hm-how ay-band ay-band--espresso ay-band--scallop" aria-labelledby="hm-how-title">
      <div className="hm-wrap">
        <header className="hm-head">
          <h2 id="hm-how-title" className="hm-h2">How it works</h2>
          <Go className="ay-btn ay-btn--text hm-head__all" href="/how-it-works" onGo={onViewHowItWorks}><span className="hm-head__long">The full method</span><span className="hm-head__short">See all<span className="ed-sr"> of the method</span></span><Arrow /></Go>
        </header>
        <ol className="hm-steps">
          {STEPS.map((st, i) => (
            <li key={st.t} className="hm-step">
              <span className="hm-step__ph"><Photo src={st.src} alt={st.alt} sizes="(max-width: 767px) 34vw, 280px" style={{ objectPosition: st.pos }} loading="lazy" /></span>
              <span className="hm-step__n" aria-hidden="true">{i + 1}</span>
              <div className="hm-step__text">
                <h3 className="hm-h3"><span className="ed-sr">Step {i + 1}: </span>{st.t}</h3>
                <p>{st.d}</p>
              </div>
            </li>
          ))}
        </ol>
        {showStart && (
          <div className="hm-start" aria-labelledby="hm-start-title" role="region">
            <span className="hm-tab" aria-hidden="true">Start here</span>
            <div>
              <h2 id="hm-start-title" className="hm-h2">Start with six questions.</h2>
              <p className="hm-lead">Then a shop matched to you.</p>
            </div>
            <div className="hm-start__cta">
              <Go className="ay-btn ay-btn--primary" href="/quiz" onGo={onStartQuiz}>See my matches<Arrow /></Go>
              <Go className="ay-btn ay-btn--text" href="/shop" onGo={() => onViewDiscovery?.('')}>Browse the Shop</Go>
            </div>
          </div>
        )}
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
      { n: ALL_PRODUCTS.length, label: 'products in the Shop' },
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
          <span className="hm-ev__ph"><Photo src="/landing/blue-sink.webp" alt="A woman in pink getting ready at a sink full of products, against a bright blue wall" sizes="(max-width: 767px) 92vw, 460px" loading="lazy" /></span>
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
          <Go className="ay-btn ay-btn--text" href="/library" onGo={onViewArticles}>Read our sources<Arrow /></Go>
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
          <a className="ay-btn ay-btn--text hm-head__all" href="/library" onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onViewArticles?.(); }}><span className="hm-head__long">Open the Library</span><span className="hm-head__short">See all<span className="ed-sr"> reads in the Library</span></span><Arrow /></a>
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
      <div className="hm-wrap hm-comm__grid">
        <span className="hm-comm__ph"><Photo sizes="(max-width: 767px) 92vw, 520px" src="/landing/story-reviews-phones.webp" alt="Friends in a circle looking down at their phones, blue sky above" loading="lazy" /></span>
        <div className="hm-comm__copy">
          <h2 id="hm-comm-title" className="hm-h2 hm-h2--big">Real talk about what women actually use.</h2>
          <p className="hm-body">Reviews, questions and routines from women who use these products. Ask a question, review what you use or share a playlist.</p>
          <Go className="ay-btn ay-btn--primary" href="/community" onGo={onViewCommunity}>Read reviews<Arrow /></Go>
          <article className="hm-news" aria-labelledby="hm-news-title">
            <span className="hm-tab hm-news__label">ayna news</span>
            <h3 id="hm-news-title" className="hm-h3">{news ? news.title : 'ayna Community is open.'}</h3>
            <p>{news ? news.body : 'Ask questions, review what you use and share playlists with women who get it.'}</p>
            <Go className="ay-btn ay-btn--text" href="/community" onGo={onViewCommunity}>{news ? 'Read it in Community' : 'See Community'}<Arrow /></Go>
          </article>
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
      <div className="hm-invest__grid">
        <div className="hm-invest__copy">
          <h2 id="hm-invest-title" className="hm-h2 hm-h2--big">Invest in ayna</h2>
          <p className="hm-body">We&rsquo;re so excited to extend an opportunity for you to invest in ayna, whether you&rsquo;re one of our earliest ayna users or a part of the greater community passionate about ayna&rsquo;s work to expand the future of women&rsquo;s health. Join our community round and learn more on Wefunder.</p>
          <a className="ay-btn ay-btn--primary" href={WEFUNDER_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackInvestClick('landing')}>
            Invest on Wefunder<span className="ed-sr"> (opens in a new tab)</span><Arrow />
          </a>
          <p className="hm-invest__legal">{TESTING_WATERS_NOTICE}</p>
        </div>
        <span className="hm-invest__ph"><Photo sizes="(max-width: 767px) 100vw, 50vw" src="/landing/laundry-duo.webp" alt="Two friends in curlers reading magazines together on a laundry room floor" loading="lazy" width="736" height="981" /></span>
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
      <Hero onStartQuiz={onStartQuiz} onSearch={onSearch} personal={personal} banner={heroBanner} />
      {personal?.dashboard ? <div className="hm-slot">{personalSlot}</div> : <Brands onViewWaitlist={onViewWaitlist} />}
      {!personal?.dashboard && personalSlot && <div className="hm-slot">{personalSlot}</div>}
      <ShopBand onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} picks={personal?.topPicks || null} />
      {rest && <>
      {!personal && <Familiar onSearch={onSearch} />}
      <How onViewHowItWorks={onViewHowItWorks} onStartQuiz={onStartQuiz} onViewDiscovery={onViewDiscovery} showStart={!(personal && personal.hasQuiz)} />
      <Evidence onViewArticles={onViewArticles} />
      <Reads onViewArticle={onViewArticle} onViewArticles={onViewArticles} />
      <Community onViewCommunity={onViewCommunity} posts={communityPosts} />
      <Us onViewAbout={onViewAbout} />
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
