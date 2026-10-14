import React, { useEffect, useMemo, useRef, useState } from 'react';
import { productsForNeed } from './landingNeeds';
import { productHref, isPlainLeftClick } from '../utils/productRoute';
import { isPartnerBrandItem, PARTNER_BRANDS } from '../utils/partnerBrands';
import { getWeeklyTrendingLineup } from '../utils/trendingLineup';
import { getRecommendedArticles } from './articleRecommendations';
import { ALL_PRODUCTS, MACRO_GROUPS } from '../data/products';
import WebHeroCarousel from './WebHeroCarousel.jsx';
import SmartSearchInput from './search/SmartSearchInput.jsx';
import '../styles/landing-v2.css';

/* First-visit landing, v2. One job per section, minimal words, one palette:
 * cream (60) / pink (30) / butter (10) with ink for text and lines, plus one
 * dark band. Everything moving can be paused with a single control (WCAG 2.2.2). */

const SEARCH_HINTS = ['organic pads', 'PCOS support', 'postpartum recovery', 'vaginal dryness', 'pelvic floor', 'sleep support'];
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
      {[...names, ...names].map((t, i) => (<li key={i}>{t}<span aria-hidden="true">{'★'}</span></li>))}
    </ul>
  );
  return <div className="lv-ticker" role="presentation"><div className="lv-ticker__track">{row(false)}{row(true)}</div></div>;
}

/* ---------- hero ---------- */
function Search({ onSearch }) {
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reducedMotion()) return undefined;
    const t = window.setInterval(() => { if (!document.hidden) setI((v) => (v + 1) % SEARCH_HINTS.length); }, 2600);
    return () => window.clearInterval(t);
  }, []);
  return (
    <form className="lv-search" role="search" onSubmit={(e) => { e.preventDefault(); onSearch(q); }}>
      <label>
        <span className="lv-sr">Search products</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        <SmartSearchInput
          type="search" value={q} onChange={(e) => setQ(e.target.value)}
          suggest={{ kinds: ['need', 'category', 'brand', 'product'], limit: 6 }}
          onPick={(s) => onSearch(s.query)} anchor=".lv-search" placeholder=" " enterKeyHint="search" autoComplete="off"
        />
        {!q && <span className="lv-search__hint" aria-hidden="true">Search <b key={i}>{SEARCH_HINTS[i]}</b></span>}
      </label>
      <button type="submit" aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg></button>
    </form>
  );
}

function Hero({ onStartQuiz, onSearch }) {
  return (
    <section className="lv-hero" aria-labelledby="lv-hero-title">
      <div className="lv-hero__photos">
        {HERO.map((p, i) => (<img key={p.src} src={p.src} alt={p.alt} style={{ objectPosition: p.pos }} {...(i === 0 ? { fetchPriority: 'high' } : {})} />))}
      </div>
      <div className="lv-hero__copy">
        <h1 id="lv-hero-title">Build your <em>ecosystem.</em></h1>
        <p>Health products matched to your body.</p>
        <button type="button" className="lv-btn lv-btn--butter" onClick={onStartQuiz}>See my matches<Arrow /></button>
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
        <button type="button" className="lv-btn lv-btn--line" onClick={onViewAbout}>Meet us</button>
      </div>
      <figure className="lv-polaroid">
        <img src="/team/ayna-founders.jpg" alt="Puloma, Eliz and Ameera, ayna's founders, sitting together in Central Park" loading="lazy" width="1800" height="1198" />
        <figcaption className="lv-script">Puloma, Eliz &amp; Ameera</figcaption>
      </figure>
    </section>
  );
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
              {isPartnerBrandItem(p) && <span className="lv-fav">ayna<br />favorite</span>}
            </span>
            <span className="lv-tile__row">
              <span className="lv-tile__name">{p.name}</span>
              {/^\$/.test(String(p.price || '')) && <span className="lv-tile__price">{String(p.price).split(/\s*[(–-]\s*/)[0]}</span>}
            </span>
            {p.brand && <span className="lv-tile__brand">{p.brand}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Trending({ onOpenProduct, onViewDiscovery }) {
  const items = useMemo(() => getWeeklyTrendingLineup(ALL_PRODUCTS).map((x) => x.product).filter((p) => p?.image && NEEDS_PHOTO(p)).slice(0, 4), []);
  const ref = useReveal();
  if (items.length < 2) return null;
  return (
    <section ref={ref} className="lv-sec" aria-labelledby="lv-trend-title">
      <header className="lv-head">
        <h2 id="lv-trend-title">Trending on <em>ayna</em></h2>
        <button type="button" className="lv-btn lv-btn--line" onClick={() => onViewDiscovery?.('')}>See the Shop</button>
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
  const need = needs.find((n) => n.id === id) || needs[0];
  const ref = useReveal();
  if (!need) return null;
  return (
    <section ref={ref} className="lv-band" aria-labelledby="lv-shop-title">
      <h2 id="lv-shop-title">Shop by <em>need</em></h2>
      <div className="lv-chips" role="group" aria-label="Choose a need">
        {needs.map((n) => (<button key={n.id} type="button" aria-pressed={n.id === need.id} onClick={() => setId(n.id)}>{n.label}</button>))}
      </div>
      <div key={need.id} className="lv-band__grid"><Tiles products={need.pool.slice(0, 4)} onOpenProduct={onOpenProduct} /></div>
      <div className="lv-band__foot">
        <button type="button" className="lv-btn lv-btn--butter" onClick={() => onViewDiscovery?.(need.group ? { initialMacroGroup: need.group } : '')}>See all {need.label.toLowerCase()}</button>
        <button type="button" className="lv-link" onClick={() => onViewDiscovery?.('')}>Browse the whole Shop</button>
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

function Why({ paused }) {
  const ref = useReveal();
  const [a, setA] = useState(0);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (touched || paused || reducedMotion()) return undefined;
    const t = window.setInterval(() => setA((v) => (v + 1) % WHY.length), 4500);
    return () => window.clearInterval(t);
  }, [touched, paused]);
  const pick = (i) => { setTouched(true); setA(i); };
  return (
    <section ref={ref} className="lv-sec" aria-labelledby="lv-why-title">
      <div className="lv-why lv-why--grid">
        <div className="lv-quad" role="group" aria-label="What ayna does, in four photos">
          {WHY.map((w, i) => (
            <button key={w.t} type="button" className={`lv-quad__cell${i === a ? ' is-on' : ''}`} aria-pressed={i === a} onClick={() => pick(i)}>
              <img src={w.img} alt={w.alt} loading="lazy" />
              <b aria-hidden="true">{i + 1}</b>
            </button>
          ))}
        </div>
        <div className="lv-why__body">
          <p className="lv-script">what ayna actually is</p>
          <h2 id="lv-why-title">Your counter, <em>decoded.</em></h2>
          <p className="lv-why__lead">Tap a photo.</p>
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

/* ---------- reads ---------- */
function Reads({ onViewArticle, onViewArticles }) {
  const reads = useMemo(() => getRecommendedArticles(null).slice(0, 3), []);
  const ref = useReveal();
  if (!reads.length) return null;
  const open = (id) => { if (onViewArticle) onViewArticle(id); else onViewArticles?.(); };
  return (
    <section ref={ref} className="lv-sec" aria-labelledby="lv-reads-title">
      <header className="lv-head">
        <h2 id="lv-reads-title">Short reads, real sources.</h2>
        <button type="button" className="lv-btn lv-btn--line" onClick={() => onViewArticles?.()}>Open the Library</button>
      </header>
      <div className="lv-reads">
        {reads.map((a) => (
          <article key={a.id}>
            <button type="button" onClick={() => open(a.id)}>
              <span className="lv-reads__img"><img src={`/articles/${a.id}.webp`} alt="" loading="lazy" onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }} /></span>
              <span className="lv-reads__txt"><strong>{a.title}</strong><span>{a.teaser}</span></span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------- how it works: four photos, each numbered (Eliz's mockup), then the start card ---------- */
const STEPS = [
  { t: 'Answer six questions', d: 'About your body and what you avoid.', src: '/landing/pink-tile-shelf.webp', alt: 'A pink tiled ledge crowded with everyday care products and a hair dryer', pos: '50% 60%' },
  { t: 'We check the evidence', d: 'Across products, apps and care.', src: '/landing/blue-sink.webp', alt: 'A woman at a bathroom sink with products spread across it, blue wall behind', pos: '50% 50%' },
  { t: 'Get your ecosystem', d: 'Ranked for you.', src: '/landing/robe-pickles.webp', alt: 'A woman in a white robe and hair curlers sitting in her bathroom', pos: '50% 35%' },
  { t: 'You decide', d: 'Nothing is bought until you say so.', src: '/landing/pink-stripe-floor.webp', alt: 'A woman sitting on a pink striped bathroom floor with her things around her', pos: '50% 40%' },
];

function Start({ onStartQuiz, onViewDiscovery }) {
  const ref = useReveal();
  const [s, setS] = useState(0);
  return (
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
      <div className="lv-start__card lv-card">
        <Win title="start.exe" />
        <div className="lv-start__copy">
          <h2 id="lv-start-title">Start with <em>six</em> questions.</h2>
          <p>Then a shop matched to you.</p>
          <div className="lv-start__cta">
            <button type="button" className="lv-btn lv-btn--ink" onClick={onStartQuiz}>See my matches<Arrow /></button>
            <button type="button" className="lv-link" onClick={() => onViewDiscovery?.('')}>Browse the Shop</button>
          </div>
        </div>
        <img src="/landing/stalls-trio.webp" alt="Three friends chatting from neighboring bathroom stalls" loading="lazy" width="734" height="397" />
      </div>
    </section>
  );
}

/* ---------- page ---------- */
export default function LandingV2({ onStartQuiz, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewCommunity, onSearch }) {
  const [paused, setPaused] = useState(false);
  return (
    <div className={`lv${paused ? ' is-paused' : ''}`}>
      <Ticker />
      <div className="lv-wrap">
        <Hero onStartQuiz={onStartQuiz} onSearch={onSearch} />
        <Purpose onViewAbout={onViewAbout} />
        <Trending onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} />
        <ShopBand onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} />
        <Strip />
        <Why paused={paused} />
        <div className="lv-sec lv-carousel"><WebHeroCarousel onViewArticles={onViewArticles} onViewCommunity={onViewCommunity} onStartQuiz={onStartQuiz} /></div>
        <Reads onViewArticle={onViewArticle} onViewArticles={onViewArticles} />
        <Start onStartQuiz={onStartQuiz} onViewDiscovery={onViewDiscovery} />
      </div>
      <button type="button" className="lv-pause" aria-pressed={paused} aria-label={paused ? 'Play motion' : 'Pause motion'} title={paused ? 'Play motion' : 'Pause motion'} onClick={() => setPaused((v) => !v)}>
        {paused
          ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" /></svg>
          : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>}
      </button>
    </div>
  );
}
