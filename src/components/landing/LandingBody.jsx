import React, { useEffect, useMemo, useRef, useState } from 'react';
import { openProPaywall } from '../../pro/paywall.js';
import { useRecommendationViews } from '../../utils/recommendationAnalytics';
import { isPlainLeftClick } from '../../utils/productRoute';
import { getWeeklyTrendingLineup } from '../../utils/trendingLineup';
import { ALL_PRODUCTS, MACRO_GROUPS, basicsProductIds, useCatalogReady } from '../../data/catalog.js';
import { shopCatalogCounts } from '../../data/catalogCounts.js';
import { brandOf } from '../../mobile/data/brandFallback.js';
import ProductCard from '../ProductCard';
import Photo from '../ui/Photo.jsx';
import SlideToStart from '../ui/SlideToStart.jsx';
import { PLANS, PAID_TERM_STARTS } from '../../pro/plans.js';
import { LEAD_READS, pickCommunityPost } from './landingData.js';
import './landing-blocks.css';

/*
 * The landing below the hero (founder, Oct 28-29: every section under the hero was wrong; "use every
 * single inspo pic", the two she loves most first: soft colour tiles with no outlines, an icon in a
 * circle in the corner, one big number or one small widget, a short title).
 *
 * One calm butter page, then one espresso close:
 *   1 What you can do on ayna: five feature tiles, each an app widget (bento, two rows)
 *   2 This week's picks: four Shop cards (the approved ones), no chip switcher
 *   3 What's behind every match: four stat tiles, counted from the catalog
 *   4 Reads and Community: a list of three reads with small photos, and one Community card
 *   5 Founders: one card, photo beside the words
 *   6 Pro and the last ask, espresso: what Pro adds, two price tiles, then Slide to start
 * Words on the widgets are labels, never invented results.
 */

const Arrow = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>);
const Chev = () => (<svg className="lb-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>);

function Go({ href, onGo, className, children, ...rest }) {
  return <a className={className} href={href} {...rest} onClick={(e) => { if (!onGo || !isPlainLeftClick(e)) return; e.preventDefault(); onGo(); }}>{children}</a>;
}

/* Line icons, 24px grid, drawn with the stroke colour of the circle they sit in. */
const ICONS = {
  match: <><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></>,
  evidence: <><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  checkin: <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10h16" /><circle cx="12" cy="15" r="1.6" /></>,
  routine: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  ask: <><path d="M5 5h14v10H10l-5 4V5Z" /><path d="M9 9.5h6M9 12h4" /></>,
  bag: <><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
  tag: <><path d="M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8-8-8Z" /><circle cx="8.5" cy="8.5" r="1.5" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></>,
  people: <><circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2.4" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M14.5 19a4 4 0 0 1 6.5-3" /></>,
  dash: <><circle cx="12" cy="12" r="8" /><path d="M8.5 13.5l2-2 2 2 3-3.5" /></>,
  watch: <><rect x="7" y="6" width="10" height="12" rx="3" /><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3" /></>,
  book: <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13V4Z" /></>,
};
const Icon = ({ k, className = '' }) => (<span className={`lb-ic ${className}`} aria-hidden="true"><svg viewBox="0 0 24 24">{ICONS[k]}</svg></span>);

/* Motion (founder, Oct 29: "make it fun, animated, really tap into the inspo"). Each widget plays once
   when it scrolls into view: the ring draws, the bars grow, a chip gets picked, a routine slot gets
   ticked, the answer types in, the numbers count up. Nothing loops. Without JS, under reduced motion
   or with Pause motion on, everything shows in its finished state. */
const motionOff = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('ay-motion-paused'); } catch { return true; }
};
const canPlay = () => typeof window !== 'undefined' && typeof IntersectionObserver !== 'undefined' && !motionOff();
function usePlayOnView() {
  const ref = useRef(null);
  const [state, setState] = useState(() => (canPlay() ? 'ready' : 'static')); // static | ready | in
  useEffect(() => {
    const el = ref.current;
    if (!el || state !== 'ready') return undefined;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setState('in'); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [state]);
  const cls = state === 'static' ? '' : state === 'in' ? ' lb-anim is-in' : ' lb-anim';
  return [ref, cls, state];
}
function CountUp({ n, play }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (play !== 'in') return undefined;
    let raf; const t0 = performance.now(); const dur = 1100;
    const tick = (t) => { const k = Math.min(1, (t - t0) / dur); setV(Math.round(n * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [n, play]);
  const shown = play === 'static' ? n : play === 'ready' ? 0 : v;
  return <>{shown.toLocaleString('en-US')}</>;
}

/* ---------- 1. what you can do ---------- */
const BARS = [5, 7, 4, 8, 6, 9, 7, 3, 6, 8, 5, 7, 4, 6, 8, 5, 9, 6];
function Widget({ kind }) {
  if (kind === 'match') return (
    <span className="lb-w lb-w--chips" aria-hidden="true">
      {['Regular periods', 'Postpartum', 'Perimenopause'].map((c, i) => <span key={c} className={i === 2 ? 'is-on' : ''}>{c}</span>)}
    </span>
  );
  if (kind === 'evidence') return (
    <span className="lb-w lb-w--ring" aria-hidden="true">
      <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="48" className="lb-ring__track" /><circle cx="60" cy="60" r="48" className="lb-ring__arc" pathLength="100" strokeDasharray="72 100" transform="rotate(-90 60 60)" /></svg>
      <span className="lb-ring__mid"><b>Strong</b><small>evidence</small></span>
    </span>
  );
  if (kind === 'checkin') return (
    <span className="lb-w lb-w--bars" aria-hidden="true">
      {BARS.map((h, i) => <i key={i} className={i >= 4 && i <= 8 ? 'is-p' : ''} style={{ height: `${h * 10}%`, '--i': i }} />)}
    </span>
  );
  if (kind === 'routine') return (
    <span className="lb-w lb-w--routine" aria-hidden="true">
      {[['Morning', 'Supplement'], ['Night', 'Skincare'], ['On your period', 'Heat patch']].map(([when, what], i) => (
        <span key={when} className={`lb-slot${i === 0 ? ' is-done' : ''}`}><small>{when}</small><b>{what}</b><i /></span>
      ))}
    </span>
  );
  return (
    <span className="lb-w lb-w--ask" aria-hidden="true">
      <span className="lb-bub is-me">Is a cup or a disc better for a heavy flow?</span>
      <span className="lb-typing"><i /><i /><i /></span>
      <span className="lb-bub">Here’s what the research says, with sources.</span>
    </span>
  );
}
const FEATURES = [
  { k: 'match', tone: 'pink', span: 2, t: 'Get matched', d: 'A few questions. Products and care matched to you, and why.', href: '/quiz', cta: 'Start free' },
  { k: 'evidence', tone: 'ink', t: 'See the evidence', d: 'How strong the research is, on every product.', href: '/how-it-works' },
  { k: 'checkin', tone: 'light', t: 'Check in', d: 'Pain, flow, sleep and mood.', href: '/you/ecosystem' },
  { k: 'routine', tone: 'light', span: 2, t: 'Build your routine', d: 'When to use what you already have.', href: '/you/ecosystem' },
  { k: 'ask', tone: 'ink', span: 2, t: 'Ask ayna', d: 'Questions about your body, answered with sources.', href: '/ask' },
];
export function WhatYouCanDo({ onGo, member = false }) {
  const [ref, anim] = usePlayOnView();
  const list = member ? FEATURES.map((f) => (f.k === 'match' ? { ...f, t: 'Your matches', d: 'Your products and care, matched to you, and why.', href: '/you/ecosystem', cta: 'Go to your Home' } : f)) : FEATURES;
  return (
    <section className="lb-sec" aria-labelledby="lb-do-h">
      <div className="lb-wrap">
        <h2 id="lb-do-h" className="lb-h2">What you can do on ayna</h2>
        <ul className={`lb-bento${anim}`} ref={ref}>
          {list.map((f) => (
            <li key={f.k} className={`lb-tile is-${f.tone}${f.span === 2 ? ' is-wide' : ''}`}>
              <Go className="lb-tile__a" href={f.href} onGo={onGo?.[f.k]}>
                <span className="lb-tile__top">
                  <span className="lb-tile__words"><strong className="lb-tile__t">{f.t}</strong><span className="lb-tile__d">{f.d}</span></span>
                  <Icon k={f.k} />
                </span>
                <Widget kind={f.k} />
                {f.cta && <span className="lb-pill">{f.cta}<Arrow /></span>}
              </Go>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 2. this week's picks ---------- */
const NEEDS_PHOTO = (p) => !/tampon tribe|herau|r[eè]sa/i.test(`${p?.brand || ''} ${p?.name || ''}`);
const CORE = /pad|tampon|cup|disc|period|intimate|vaginal|menopause|pelvic|uti|cramp|fertility|postpartum|pregnan/i;
function weeklyLineup() {
  const list = getWeeklyTrendingLineup(ALL_PRODUCTS).map((x) => x.product)
    .filter((p) => p?.image && NEEDS_PHOTO(p) && !/sex|intimacy|toy/i.test(String(p.category || '')) && !/\banal\b|vibrator|dildo|mouth tape/i.test(String(p.name || '')));
  const core = list.filter((p) => CORE.test(`${p.category} ${(p.healthFunctions || []).join(' ')}`));
  return [...core, ...list.filter((p) => !core.includes(p))];
}
export function Picks({ onOpenProduct, onViewDiscovery, picks = null }) {
  const ready = useCatalogReady();
  const weekly = useMemo(() => (ready ? weeklyLineup().slice(0, 4) : []), [ready]);
  const personal = useMemo(() => {
    if (!picks) return null;
    const shown = picks.filter((p) => p?.image && NEEDS_PHOTO(p));
    const basics = basicsProductIds();
    return [...shown.filter((p) => !basics.has(p.id)), ...shown.filter((p) => basics.has(p.id))];
  }, [picks, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const mine = Boolean(personal && personal.length >= 2);
  const four = mine ? personal.slice(0, 4) : weekly;
  useRecommendationViews(mine ? four : null, 'home_top_picks');
  if (ready && four.length < 2) return null;
  const name = mine ? 'Top picks for you' : 'This week’s picks';
  return (
    <section className="lb-sec" aria-labelledby="lb-picks-h">
      <div className="lb-wrap">
        <header className="lb-head">
          <h2 id="lb-picks-h" className="lb-h2">{name}</h2>
          <Go className="lb-more" href="/explore/products" onGo={() => onViewDiscovery?.('')}>See all products<Arrow /></Go>
        </header>
        <ul className="lb-picks" aria-label={ready ? name : 'Loading products'}>
          {ready ? four.map((p) => <li key={p.id}><ProductCard product={p} onOpen={onOpenProduct} className="hm-sticker" /></li>)
            : [0, 1, 2, 3].map((i) => <li key={i} aria-hidden="true"><div className="lb-skel" /></li>)}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 3. what is behind every match ---------- */
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
    const { products, services } = shopCatalogCounts();
    return [
      { n: products + services, unit: 'products and services', icon: 'bag', tone: 'pink' },
      { n: brands.size, unit: 'brands, big and small', icon: 'tag', tone: 'light' },
      { n: sources.size, unit: 'sources linked on product pages', icon: 'link', tone: 'ink' },
      { n: MACRO_GROUPS.filter((g) => g.id !== 'all').length, unit: 'areas of care, periods to menopause', icon: 'grid', tone: 'light' },
    ];
  }, [ready]);
}
export function Proof({ onViewArticles }) {
  const nums = useCatalogNumbers();
  const [ref, anim, play] = usePlayOnView();
  return (
    <section className="lb-sec" aria-labelledby="lb-proof-h">
      <div className="lb-wrap">
        <header className="lb-head">
          <h2 id="lb-proof-h" className="lb-h2">What’s behind every match</h2>
          <Go className="lb-more" href="/explore/resources" onGo={onViewArticles}>Read our sources<Arrow /></Go>
        </header>
        <ul className={`lb-stats${anim}`} ref={ref} aria-busy={nums ? undefined : 'true'}>
          {(nums || [0, 1, 2, 3]).map((s, i) => (s
            ? <li key={s.unit} className={`lb-stat is-${s.tone}`}><Icon k={s.icon} /><b><span className="lb-sr">{s.n.toLocaleString('en-US')}</span><span aria-hidden="true"><CountUp n={s.n} play={play} /></span></b><span>{s.unit}</span></li>
            : <li key={i} className="lb-stat is-light is-skel" aria-hidden="true" />))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 4. reads and community ---------- */
export function ReadsAndCommunity({ onViewArticle, onViewArticles, onViewCommunity, posts = [] }) {
  const post = pickCommunityPost(posts);
  const open = (id) => { if (onViewArticle) onViewArticle(id); else onViewArticles?.(); };
  return (
    <section className="lb-sec" aria-label="Reads and Community">
      <div className="lb-wrap lb-rc">
        <div className="lb-reads lb-card is-light">
          <header className="lb-head">
            <h2 id="lb-reads-h" className="lb-h2">Quick reads, with sources</h2>
            <Go className="lb-more" href="/explore/resources" onGo={onViewArticles}>Open the Library<Arrow /></Go>
          </header>
          <ul className="lb-reads__list" aria-labelledby="lb-reads-h">
            {LEAD_READS.map((r) => (
              <li key={r.id}>
                <Go className="lb-read" href={`/library/${r.id}`} onGo={() => open(r.id)}>
                  <span className="lb-read__ph"><Photo src={r.src} alt="" sizes="96px" loading="lazy" decoding="auto" /></span>
                  <span className="lb-read__words"><strong>{r.title}</strong><small>{String(r.source || '').replace(/\s*·\s*/g, ', ')}</small></span>
                  <Chev />
                </Go>
              </li>
            ))}
          </ul>
        </div>
        <article className="lb-card is-pink lb-comm" aria-labelledby="lb-comm-h">
          <span className="lb-tile__top"><span className="lb-tag">ayna Community</span><Icon k="people" /></span>
          <h2 id="lb-comm-h" className="lb-h3">Real talk about what women actually use.</h2>
          {post
            ? <blockquote className="lb-quote"><p>“{post.body}”</p><footer>{post.meta}</footer></blockquote>
            : <p className="lb-p">Reviews, questions and routines from women who use these products.</p>}
          <Go className="lb-pill is-ink" href="/community" onGo={onViewCommunity}>Read reviews and questions<Arrow /></Go>
        </article>
      </div>
    </section>
  );
}

/* ---------- 5. founders ---------- */
export function Founders({ onViewAbout }) {
  return (
    <section className="lb-sec" aria-labelledby="lb-us-h">
      <div className="lb-wrap">
        <div className="lb-card is-light lb-us">
          <figure className="lb-us__ph">
            <Photo sizes="(max-width: 767px) 92vw, 440px" src="/team/ayna-founders.jpg" alt="Puloma, Eliz and Ameera, ayna's founders, sitting together in Central Park" loading="lazy" decoding="auto" width="1800" height="1198" />
            <figcaption>Puloma, Eliz &amp; Ameera</figcaption>
          </figure>
          <div className="lb-us__words">
            <h2 id="lb-us-h" className="lb-h2">Built by three women who wanted better answers.</h2>
            <p className="lb-p">We met at Cornell, bringing different experiences to the same question: why does understanding our options require so much searching?</p>
            <Go className="lb-more" href="/about" onGo={onViewAbout}>Meet us<Arrow /></Go>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 6. Pro and the last ask (espresso) ---------- */
const PRO_ADDS = [
  { icon: 'dash', t: 'Your health dashboard' },
  { icon: 'watch', t: 'Apple Health, Health Connect and Oura' },
  { icon: 'book', t: 'Every Read in the Library' },
  { icon: 'ask', t: '50 Ask ayna chats a month' },
];
const offerEnded = () => Date.now() >= Date.parse('2027-01-01T00:00:00');
export function ProAndEnd({ pro = false, offerOpen = null, cta }) {
  const year = PLANS.find((x) => x.id === 'year');
  const month = PLANS.find((x) => x.id === 'month');
  const closed = offerOpen === false && offerEnded();
  // The sheet opens right here with the plan she tapped (signed out, it asks her to sign in first).
  const getPro = (plan) => { if (!openProPaywall({ feature: '', featureName: '', plan })) window.location.assign('/pro'); };
  return (
    <section className="lb-close" aria-label="ayna Pro and get started">
      <div className="lb-wrap">
        <div className="lb-pro">
          <div className="lb-pro__words">
            <span className="lb-tag is-pink">{pro ? 'ayna Pro' : 'ayna Pro · Early Access'}</span>
            <h2 id="wl-pro-h" className="lb-h2">{pro ? 'You’re on ayna Pro.' : 'More of ayna, when you want it.'}</h2>
            <p className="lb-p">{pro ? 'Your dashboard, every Read and up to 50 Ask ayna chats a month.' : 'Matches, safety notes and evidence stay free. Pro adds:'}</p>
            <ul className="lb-adds">{PRO_ADDS.map((a) => <li key={a.t}><Icon k={a.icon} />{a.t}</li>)}</ul>
            <span className="lb-pro__acts">
              {!pro && !closed && <button type="button" className="lb-pill is-butter" onClick={() => getPro('year')}>Get ayna Pro<Arrow /></button>}
              <a className="lb-more" href={pro ? '/health-data' : '/pro'}>{pro ? 'Connect health data' : 'See what Pro includes'}<Arrow /></a>
            </span>
          </div>
          {!pro && closed && <p className="lb-p">The Early Access offer has ended. See ayna Pro for current pricing.</p>}
          {!pro && !closed && (
            <div className="lb-prices">
              <button type="button" className="lb-price is-pink" onClick={() => getPro('year')} aria-label={`Yearly, ${year.price} the first year, then ${year.regular}. Get ayna Pro`}><span className="lb-price__top"><small>Yearly</small><em>{year.badge}</em></span><b>{year.price}</b><span>first year, then {year.regular}</span></button>
              <button type="button" className="lb-price is-light" onClick={() => getPro('month')} aria-label={`Monthly, ${month.price} the first month, then ${month.regular}. Get ayna Pro`}><span className="lb-price__top"><small>Monthly</small></span><b>{month.price}</b><span>first month, then {month.regular}</span></button>
              <p className="lb-terms">Pro unlocks right away. Your paid term starts {PAID_TERM_STARTS}. Cancel anytime.</p>
            </div>
          )}
        </div>
        <div className="lb-end wlx-end">
          <h2 className="lb-end__h">Find what fits <span>your body.</span></h2>
          <SlideToStart className="lb-end__sts" size="lg" label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="butter" />
        </div>
      </div>
    </section>
  );
}
