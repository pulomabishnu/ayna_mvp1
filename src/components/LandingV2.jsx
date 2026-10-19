import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BASICS_PRODUCTS } from '../data/basicsProducts.js';
import { productsForNeed } from './landingNeeds';
import { productHref, isPlainLeftClick } from '../utils/productRoute';
import { isPartnerBrandItem, PARTNER_BRANDS } from '../utils/partnerBrands';
import { getWeeklyTrendingLineup } from '../utils/trendingLineup';
import { ALL_PRODUCTS, MACRO_GROUPS } from '../data/products';
import { getDailyFact } from '../data/welcomeSlides.js';
import { formatPrice } from '../utils/formatPrice';
import SmartSearchInput from './search/SmartSearchInput.jsx';
import LandingStories from './LandingStories';
import '../styles/landing-v2.css';

/* First-visit landing, v2. One job per section, minimal words, one palette:
 * cream (60) / pink (30) / butter (10) with ink for text and lines, plus one
 * dark band. Everything moving can be paused with a single control (WCAG 2.2.2). */

// One topic at a time, changing every few seconds (Ameera, Oct 16).
const SEARCH_HINTS = ['organic pads', 'PCOS support', 'bad cramps', 'pelvic floor', 'night sweats', 'vaginal dryness', 'leaking when I sneeze', 'sleep and stress', 'UTI burning', 'heavy flow overnight', 'menopause', 'itchy down there', 'hormonal acne', 'trying to conceive', 'postpartum pads'];
const BASICS_IDS = new Set(BASICS_PRODUCTS.map((p) => p.id));
const NEEDS_PHOTO = (p) => !/tampon tribe|herau|r[eè]sa/i.test(`${p?.brand || ''} ${p?.name || ''}`);
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const HERO = [
  { src: '/landing/tub-girls.webp', alt: 'Two friends getting ready together in a bathtub, surrounded by makeup', pos: '50% 35%' },
  { src: '/landing/robe-kiss.webp', alt: 'A woman in a striped robe blowing a kiss to the mirror light', pos: '50% 30%' },
  { src: '/landing/bed-selfie.webp', alt: 'A woman lying on a bed taking a selfie, her routine laid out around her', pos: '50% 40%' },
];

const STRIP = [
  { src: '/landing/robe-vanity.webp', alt: 'A woman in a white robe at a marble vanity in a pink room' },
  { src: '/landing/sink-flatlay.webp', alt: 'A sink full of brushes, makeup and hair tools, from above' },
  { src: '/landing/laundry-duo.webp', alt: 'Two friends in curlers reading magazines on a laundry room floor' },
  { src: '/landing/sink-heels-dryer.webp', alt: 'A vintage sink piled with a hair dryer, sunglasses and heels' },
  { src: '/landing/pajamas-overhead.webp', alt: 'A woman in red striped pajamas on the phone, from above' },
  { src: '/landing/vanity-hairdryer.webp', alt: 'A woman drying her hair at a crowded bedroom vanity' },
  { src: '/landing/pad-thread-art.webp', alt: 'Red thread arranged over a white pad, as still life' },
  { src: '/landing/bag-tubes.webp', alt: 'A vintage leather bag overflowing with colorful product tubes' },
];

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return undefined;
    el.setAttribute('data-reveal', 'wait');
    let done = false;
    const show = () => { if (done) return; done = true; el.setAttribute('data-reveal', 'in'); window.removeEventListener('scroll', check); };
    function check() { if (el.getBoundingClientRect().top < window.innerHeight * 0.92) show(); }
    window.addEventListener('scroll', check, { passive: true });
    const t = window.setTimeout(check, 100);
    const safety = window.setTimeout(show, 6000);
    return () => { window.clearTimeout(t); window.clearTimeout(safety); window.removeEventListener('scroll', check); };
  }, []);
  return ref;
}

const Arrow = () => (<span className="lv-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" /></svg></span>);
const Win = ({ title }) => (<div className="lv-win" aria-hidden="true"><span className="lv-win__dots"><i /><i /><i /></span><span>{title}</span></div>);

/* ---------- ticker: brand names only, slow ---------- */
function Ticker() {
  const names = PARTNER_BRANDS.map((b) => b.name);
  const row = (hidden) => (
    <ul className="lv-ticker__row" aria-hidden={hidden || undefined}>
      {[...names, ...names].map((t, i) => (<li key={i} aria-hidden={i >= names.length ? true : undefined}>{t}<span aria-hidden="true">{'★'}</span></li>))}
    </ul>
  );
  return <div className="lv-ticker" role="presentation"><div className="lv-ticker__track">{row(false)}{row(true)}</div></div>;
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
    <form className="lv-search" role="search" onSubmit={(e) => { e.preventDefault(); onSearch(q); }}>
      <label>
        <span className="lv-sr">Search products</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        <SmartSearchInput
          type="search" value={q} onChange={(e) => setQ(e.target.value)}
          suggest={{ kinds: ['need', 'category', 'brand', 'product'], limit: 6 }}
          onPick={(s) => onSearch(s.query)} anchor=".lv-search" placeholder=" " enterKeyHint="search" autoComplete="off"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
        {!q && <span className="lv-search__hint" aria-hidden="true">Search <b key={i} className="lv-search__topic">{SEARCH_HINTS[i]}</b></span>}
      </label>
      <button type="submit" aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg></button>
    </form>
  );
}

function Hero({ onStartQuiz, onSearch, personal = null }) {
  return (
    <section className="lv-hero" aria-labelledby="lv-hero-title">
      {/* Members get the same photo hero with their name (team call, Oct 16). */}
      <div className="lv-hero__photos">
        {HERO.map((p, i) => (<img key={p.src} src={p.src} alt={p.alt} style={{ objectPosition: p.pos }} {...(i === 0 ? { fetchPriority: 'high' } : {})} />))}
      </div>
      <div className="lv-hero__copy">
        {personal ? <>
          <h1 id="lv-hero-title">Welcome back, <em>{personal.name}.</em></h1>
          <p>{personal.ecoCount > 0 ? `${personal.ecoCount} product${personal.ecoCount === 1 ? '' : 's'} in your ecosystem.` : 'Health products matched to your body.'}</p>
          {personal.ecoCount > 0 || personal.hasQuiz
            ? <Go className="lv-btn lv-btn--butter" href="/ecosystem" onGo={personal.onOpenEcosystem}>Open my ecosystem<Arrow /></Go>
            : <Go className="lv-btn lv-btn--butter" href="/quiz" onGo={onStartQuiz}>See my matches<Arrow /></Go>}
        </> : <>
          <h1 id="lv-hero-title">Build your <em>ecosystem.</em></h1>
          <p>Health products matched to your body.</p>
          <Go className="lv-btn lv-btn--butter" href="/quiz" onGo={onStartQuiz}>See my matches<Arrow /></Go>
        </>}
        <Search onSearch={onSearch} />
      </div>
      <div className="lv-stamp" aria-hidden="true">
        <svg viewBox="0 0 200 200"><defs><path id="lv-stamp-path" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" /></defs>
          <text><textPath href="#lv-stamp-path" textLength="455" lengthAdjust="spacing">MATCHED TO YOU {'★'} MATCHED TO YOU {'★'}</textPath></text></svg>
        <span>you</span>
      </div>
    </section>
  );
}

/* ---------- who we are ---------- */
function Purpose({ onViewAbout }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="lv-purpose" aria-labelledby="lv-purpose-title">
      <div className="lv-purpose__copy">
        <p className="lv-script">who we are</p>
        <h2 id="lv-purpose-title">Built by three women who wanted better answers.</h2>
        <Go className="lv-btn lv-btn--line" href="/about" onGo={onViewAbout}>Meet us</Go>
      </div>
      <figure className="lv-polaroid">
        <img src="/team/ayna-founders.jpg" alt="Puloma, Eliz and Ameera, ayna's founders, sitting together in Central Park" loading="lazy" width="1800" height="1198" />
        <figcaption className="lv-script">Puloma, Eliz &amp; Ameera</figcaption>
      </figure>
    </section>
  );
}

/* CTAs that go somewhere are links (open in a new tab, copy the address), not buttons. */
function Go({ href, onGo, className, children }) {
  return <a className={className} href={href} onClick={(e) => { if (!onGo || !isPlainLeftClick(e)) return; e.preventDefault(); onGo(); }}>{children}</a>;
}

/* ---------- product tiles ---------- */
function Tiles({ products, onOpenProduct, ranked = false }) {
  return (
    <ul className={`lv-tiles${ranked ? ' is-ranked' : ''}`}>
      {products.map((p, i) => (
        <li key={p.id}>
          <a href={productHref(p.id)} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onOpenProduct?.(p); }}>
            <span className="lv-tile__img">
              {ranked && <b className="lv-rank" aria-hidden="true">{i + 1}</b>}
              <img src={p.image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
              {isPartnerBrandItem(p) && <span className="lv-fav" title="A partner brand ayna has reviewed">ayna<br />partner</span>}
            </span>
            <span className="lv-tile__row">
              <span className="lv-tile__name">{p.name}</span>
              {(() => { const pr = formatPrice(p).main; return /\$/.test(pr) ? <span className="lv-tile__price">{pr}</span> : null; })()}
            </span>
            {p.brand && <span className="lv-tile__brand">{p.brand}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

// Core needs lead (periods, intimate care, menopause, pelvic floor); creams, sleep and gadgets come after.
const CORE = /pad|tampon|cup|disc|period|intimate|vaginal|menopause|pelvic|uti|cramp|fertility|postpartum|pregnan/i;
function Trending({ onOpenProduct, onViewDiscovery, picks = null }) {
  // The first four products a new visitor sees: everyday picks, not sex tech.
  const weekly = useMemo(() => {
    const list = getWeeklyTrendingLineup(ALL_PRODUCTS).map((x) => x.product)
      .filter((p) => p?.image && NEEDS_PHOTO(p) && !/sex|intimacy|toy/i.test(String(p.category || '')) && !/\banal\b|vibrator|dildo|mouth tape/i.test(String(p.name || '')));
    const core = list.filter((p) => CORE.test(`${p.category} ${(p.healthFunctions || []).join(' ')}`));
    return [...core, ...list.filter((p) => !core.includes(p))].slice(0, 4);
  }, []);
  // Member picks: only products with a real photo, and the drugstore basics
  // (Advil, Aleve, Monistat...) after the curated and partner products.
  const personal = useMemo(() => {
    if (!picks) return null;
    const shown = picks.filter((p) => p?.image && NEEDS_PHOTO(p));
    return [...shown.filter((p) => !BASICS_IDS.has(p.id)), ...shown.filter((p) => BASICS_IDS.has(p.id))];
  }, [picks]);
  const items = personal && personal.length >= 2 ? personal.slice(0, 4) : weekly;
  const ref = useReveal();
  if (items.length < 2) return null;
  return (
    <section ref={ref} className="lv-sec" aria-labelledby="lv-trend-title">
      <header className="lv-head">
        {personal && personal.length >= 2
          ? <h2 id="lv-trend-title">Top picks for your <em>needs</em></h2>
          : <h2 id="lv-trend-title">This week’s <em>picks</em></h2>}
        <Go className="lv-btn lv-btn--line" href="/shop" onGo={() => onViewDiscovery?.('')}>See the Shop</Go>
      </header>
      <Tiles products={items} onOpenProduct={onOpenProduct} ranked />
    </section>
  );
}

/* ---------- dark band: shop by need (every Shop category) + photo strip under it ---------- */
function ShopBand({ onOpenProduct, onViewDiscovery }) {
  const needs = useMemo(() => MACRO_GROUPS.filter((g) => g.id !== 'all')
    .map((g) => ({ id: g.id, label: g.label, group: g.id }))
    .map((n) => ({ ...n, pool: productsForNeed(n).filter(NEEDS_PHOTO).sort((a, b) => Number(isPartnerBrandItem(b)) - Number(isPartnerBrandItem(a))) }))
    .filter((n) => n.pool.length >= 2), []);
  const [id, setId] = useState(needs[0]?.id);
  const [allChips, setAllChips] = useState(false);
  const need = needs.find((n) => n.id === id) || needs[0];
  const CHIP_MAX = 7;
  const shownNeeds = allChips ? needs : needs.slice(0, CHIP_MAX).concat(needs.slice(CHIP_MAX).filter((n) => n.id === id));
  const ref = useReveal();
  if (!need) return null;
  return (
    <section ref={ref} className="lv-band" aria-labelledby="lv-shop-title">
      <h2 id="lv-shop-title">Shop by <em>need</em></h2>
      <div className="lv-chips" role="group" aria-label="Choose a need">
        {shownNeeds.map((n) => (<button key={n.id} type="button" aria-pressed={n.id === need.id} onClick={() => setId(n.id)}>{n.label}</button>))}
        {needs.length > CHIP_MAX && <button type="button" className="lv-chips__more" aria-expanded={allChips} onClick={() => setAllChips((v) => !v)}>{allChips ? 'Fewer' : `More (${needs.length - CHIP_MAX})`}</button>}
      </div>
      <div key={need.id} className="lv-band__grid"><Tiles products={(() => { const partner = need.pool.filter((p) => isPartnerBrandItem(p)).slice(0, 1); const rest = need.pool.filter((p) => !isPartnerBrandItem(p)); return [...partner, ...rest].slice(0, 4).sort((a, b) => need.pool.indexOf(a) - need.pool.indexOf(b)); })()} onOpenProduct={onOpenProduct} /></div>
      <div className="lv-band__foot">
        <Go className="lv-btn lv-btn--butter" href="/shop" onGo={() => onViewDiscovery?.(need.group ? { initialMacroGroup: need.group } : '')}>See all {need.label} products</Go>
        <Go className="lv-link" href="/shop" onGo={() => onViewDiscovery?.('')}>Browse the whole Shop</Go>
      </div>
    </section>
  );
}

function Strip() {
  const list = (hidden) => (
    <ul className="lv-strip__row" aria-hidden={hidden || undefined}>
      {STRIP.map((p) => (<li key={p.src}><img src={p.src} alt={hidden ? '' : p.alt} loading="lazy" /></li>))}
    </ul>
  );
  return <div className="lv-strip" aria-label="Photographs from ayna"><div className="lv-strip__track">{list(false)}{list(true)}</div></div>;
}

/* ---------- why: numbered hotspots on the photo (tap a dot, or the list) ---------- */
const WHY = [
  { t: 'Matched to your body', d: 'See how well each product fits you, based on what you tell us.', img: '/landing/lilies.webp', alt: 'Legs in pink socks with a bunch of lilies across the lap' },
  { t: 'Evidence beside each pick', d: 'What the research says, with sources, right next to the product.', img: '/landing/marble-counter.webp', alt: 'A marble bathroom counter full of products, seen from above' },
  { t: 'Real experiences', d: 'Posts from women who have actually used it.', img: '/landing/curlers-call.webp', alt: 'A woman in hair curlers laughing on the phone in her bathroom' },
  { t: 'Your whole routine', d: 'Save what you use and see what fits next.', img: '/landing/sink-tea.webp', alt: 'A bathroom sink holding heels, sunglasses, tea and makeup' },
];

const SPOTS = [['18%', '26%'], ['70%', '18%'], ['34%', '70%'], ['80%', '62%']];

function Why({ paused }) {
  const ref = useReveal();
  const [a, setA] = useState(0);
  const [touched, setTouched] = useState(false);
  // Nothing moves on its own: the numbers change when you tap them.
  void paused; void touched;
  const pick = (i) => { setTouched(true); setA(i); };
  return (
    <section ref={ref} className="lv-sec" aria-labelledby="lv-why-title">
      <div className="lv-why lv-why--grid">
        {/* One counter photo with the four numbers scattered on it. */}
        <div className="lv-cnt" role="group" aria-label="What ayna does: tap a number">
          <img src="/landing/marble-counter.webp" alt="A marble bathroom counter full of products, seen from above" loading="lazy" />
          {WHY.map((w, i) => (
            <button key={w.t} type="button" className={`lv-cnt__n${i === a ? ' is-on' : ''}`} style={{ left: SPOTS[i][0], top: SPOTS[i][1] }} aria-pressed={i === a} aria-label={`${i + 1}. ${w.t}`} onClick={() => pick(i)}>{i + 1}</button>
          ))}
        </div>
        <div className="lv-why__body">
          <p className="lv-script">what ayna actually is</p>
          <h2 id="lv-why-title">Your counter, <em>decoded.</em></h2>
          <ol>
            {WHY.map((w, i) => (
              <li key={w.t} className={i === a ? 'is-on' : ''}>
                <button type="button" aria-pressed={i === a} onClick={() => pick(i)}>
                  <b aria-hidden="true">{i + 1}</b>
                  <span className="lv-why__txt"><strong>{w.t}</strong>{i === a && <small key={a}>{w.d}</small>}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------- reads: three equal photo cards with their sources, today's fact above ---------- */
// The reads that earn trust lead (pass 5), each on a real photo from the shoot.
const LEAD_READS = [
  { id: 'heavy-bleeding', title: 'Heavy Menstrual Bleeding', teaser: 'What counts as heavy bleeding, possible causes, when to seek care, and how it’s evaluated.', source: 'UpToDate · ACOG · CDC', src: '/landing/articles-heavy-bleeding-satin.webp', alt: 'Pads and tampons scattered on red satin' },
  { id: 'period-pain-when-to-seek-care', title: 'Period Pain: When to Seek Care', teaser: 'Normal cramps vs. signs that something else may be going on, and what clinicians may suggest.', source: 'ACOG · UpToDate · Mayo Clinic', src: '/landing/articles-period-pain-hotwater.webp', alt: 'A woman in striped pajamas holding a hot water bottle' },
  { id: 'pcos-basics', title: 'PCOS: What It Is and How It’s Managed', teaser: 'Diagnosis, symptoms, and evidence-based treatment, including lifestyle and medication.', source: 'ACOG · Endocrine Society · UpToDate', src: '/landing/articles-pcos-mirror.webp', alt: 'Red lips reflected in a small red compact mirror' },
];
function Reads({ onViewArticle, onViewArticles }) {
  const ref = useReveal();
  const fact = useMemo(() => { try { return getDailyFact(); } catch { return null; } }, []);
  const open = (id) => { if (onViewArticle) onViewArticle(id); else onViewArticles?.(); };
  return (
    <section ref={ref} className="lv-sec lv-reads2" aria-labelledby="lv-reads-title">
      <header className="lv-head">
        <h2 id="lv-reads-title">Short reads, real sources.</h2>
        <a className="lv-btn lv-btn--line" href="/library" onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onViewArticles?.(); }}>Open the Library</a>
      </header>
      {fact && <p className="lv-fact"><b>Today: {fact.term}.</b> {fact.text} <small className="lv-fact__src">From the ayna glossary.</small></p>}
      <ul className="lv-reads2__row">
        {LEAD_READS.map((r) => (
          <li key={r.id}>
            <a href={`/library/${r.id}`} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); open(r.id); }}>
              <span className="lv-reads2__img"><img src={r.src} alt={r.alt} loading="lazy" /></span>
              <strong>{r.title}</strong>
              <span className="lv-reads2__teaser">{r.teaser}</span>
              <small>Sources: {r.source}</small>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- how it works: four photos, each numbered (Eliz's mockup), then the start card ---------- */
const STEPS = [
  { t: 'Answer six questions', d: 'About your body and what you avoid.', src: '/landing/hiw-questions-cabinet.webp', alt: 'A woman in a white robe reaching into her bathroom cabinet', pos: '50% 35%' },
  { t: 'We check the evidence', d: 'Across products, apps and care.', src: '/landing/hiw-evidence-reading.webp', alt: 'Two friends in glasses reading a book together in front of bookshelves', pos: '50% 40%' },
  { t: 'Get your ecosystem', d: 'Ranked for you.', src: '/landing/hiw-ecosystem-vanity.webp', alt: 'A marble bathroom vanity by candlelight, skincare and makeup laid out around the sink', pos: '50% 45%' },
  { t: 'You decide', d: 'Nothing is bought until you say so.', src: '/landing/hiw-decide-basket.webp', alt: 'Looking down at a red shopping basket of products between two sneakers', pos: '50% 45%' },
];

function Start({ onStartQuiz, onViewDiscovery }) {
  const ref = useReveal();
  const [s, setS] = useState(0);
  return (
    <>
    <section ref={ref} className="lv-sec lv-start" aria-labelledby="lv-how-title">
      <header className="lv-head">
        <h2 id="lv-how-title">How it <em>works</em></h2>
      </header>
      <ol className="lv-steps">
        {STEPS.map((st, i) => (
          <li key={st.t} className={i === s ? 'is-on' : ''} onMouseEnter={() => setS(i)} onFocus={() => setS(i)}>
            <figure>
              <img src={st.src} alt={st.alt} style={{ objectPosition: st.pos }} loading="lazy" />
              <b aria-hidden="true">{i + 1}</b>
            </figure>
            <h3>{st.t}</h3>
            <p>{st.d}</p>
          </li>
        ))}
      </ol>
    </section>
    <section className="lv-sec lv-final" aria-labelledby="lv-start-title">
      <div className="lv-start__card lv-card">
        <div className="lv-start__copy">
          <h2 id="lv-start-title">Start with <em>six</em> questions.</h2>
          <p>Then a shop matched to you.</p>
          <div className="lv-start__cta">
            <Go className="lv-btn lv-btn--ink" href="/quiz" onGo={onStartQuiz}>See my matches<Arrow /></Go>
            <Go className="lv-link" href="/shop" onGo={() => onViewDiscovery?.('')}>Browse the Shop</Go>
          </div>
        </div>
        <img src="/landing/banner-bath-phone.webp" alt="A woman in a face mask relaxing in a pink tiled bath, scrolling her phone, products along the ledge" loading="lazy" width="960" height="400" />
      </div>
    </section>
    </>
  );
}

/* Partner brands: the brown strip of names always runs; the pink
   "Brands we work with" label slides in when you hover (or focus) it. */
function PartnersTop({ onViewWaitlist }) {
  return (
    <section className="lv-partners lv-partners--top lv-partners--peek" aria-labelledby="lv-partners-title">
      <h2 id="lv-partners-title" className="lv-partners__h">
        <a href="/partners" onClick={(e) => { if (!onViewWaitlist || !isPlainLeftClick(e)) return; e.preventDefault(); onViewWaitlist(); }}>Brands we work with <span aria-hidden="true">→</span></a>
      </h2>
      <Ticker />
    </section>
  );
}

/* ---------- page ---------- */
// `personal` (signed in): the same page with a welcome-back hero, and
// `personalSlot` (her next step, top picks, Powder Room) right under it.
export default function LandingV2({ onStartQuiz, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewCommunity, onSearch, personal = null, personalSlot = null, personalTail = null }) {
  // One motion control for the whole site: the footer's "Pause motion".
  const paused = useMotionPaused();
  return (
    <div className={`lv${paused ? ' is-paused' : ''}`}>
      <div className="lv-wrap">
        <Hero onStartQuiz={onStartQuiz} onSearch={onSearch} personal={personal} />
        {/* Members: the same page, with their own cards under the hero and their top picks in place of the week's picks. */}
        {personal?.dashboard ? personalSlot : <PartnersTop onViewWaitlist={onViewWaitlist} />}
        {!personal?.dashboard && personalSlot}
        {/* Page order (Ameera, Oct 16): picks, counter, shop by need, what's new, who we are, reads, how it works + start. */}
        <Trending onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} picks={personal?.topPicks || null} />
        <Why paused={paused} />
        <ShopBand onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} />
        {/* The moving photo strip is back (Ameera, Oct 17). */}
        <Strip />
        <LandingStories paused={paused} onStartQuiz={onStartQuiz} onViewArticles={onViewArticles} onViewCommunity={onViewCommunity} />
        <Purpose onViewAbout={onViewAbout} />
        <Reads onViewArticle={onViewArticle} onViewArticles={onViewArticles} />
        {personalTail}
        {!(personal && personal.hasQuiz) && <Start onStartQuiz={onStartQuiz} onViewDiscovery={onViewDiscovery} />}
      </div>
    </div>
  );
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
