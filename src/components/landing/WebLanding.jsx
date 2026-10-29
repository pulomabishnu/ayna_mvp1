import React, { useEffect, useMemo, useState } from 'react';
import { ReadsCommunity, Founders } from '../LandingV2.jsx';
import MedicalNote from '../MedicalNote.jsx';
import { sentenceCase } from '../../utils/sentenceCase.js';
import { useRecommendationViews } from '../../utils/recommendationAnalytics';
import { productsForNeed } from '../landingNeeds';
import { isPlainLeftClick } from '../../utils/productRoute';
import { isPartnerBrandItem } from '../../utils/partnerBrands';
import { getWeeklyTrendingLineup } from '../../utils/trendingLineup';
import { ALL_PRODUCTS, MACRO_GROUPS, basicsProductIds, useCatalogReady } from '../../data/catalog.js';
import { shopCatalogCounts } from '../../data/catalogCounts.js';
import { brandOf } from '../../mobile/data/brandFallback.js';
import ProductCard from '../ProductCard';
import '../../styles/editorial.css';
import '../../styles/home.css';
import '../../styles/loop-a-landing.css';
import '../../styles/uq-landing.css';
import Photo from '../ui/Photo.jsx';
import { Chip, Band, ScallopEdge } from '../ui/ay';
import BrandStrip from '../ui/ay/BrandStrip.jsx';
import SlideToStart from '../ui/SlideToStart.jsx';
import { Rain, HeroSearch, BrandBar } from './kit.jsx';
import { PLANS, PAID_TERM_STARTS } from '../../pro/plans.js';
import { useProStatus } from '../../pro/useProStatus.js';
import './web-landing.css';
import './landing-body.css';

/* The website's / (founder, Oct 27 10:40: "i liked how we had the website
 * ... optimize it for web"). The v2 website home is back, desktop-first, with
 * the raining cut-outs brought into its hero. Styles: src/styles/home.css
 * (hm-*), uq-landing.css (colour-blocked bands) and ./web-landing.css (the
 * hero, Pro and the closing note).
 *
 * The sequence (the hero and the bar were approved Oct 27; below them,
 * founder 13:44, one idea and one picture a section):
 *   1 hero: everything centred (title, Slide to start, search, How we match)
 *     over a faded layer of real products falling as cut-outs (./kit.jsx)
 *   2 partner marquee, pink seam (Pause motion stops it and the rain)
 *   3 does this sound familiar? a checkerboard of phrases and photos, butter
 *   4 this week's picks, the same butter: need chips and four big cards
 *   5 how ayna fits it to you: three photo steps and four big numbers, espresso
 *     then the brown and pink BrandStrip
 *   6 reads + community, butter (pink is an accent only, founder 13:58)
 *   7 ayna Pro (Early Access, links to /pro), espresso
 *     then the BrandStrip again
 *   8 founders: half photo, half butter
 *   9 the last ask: the promise and Slide to start, espresso, running into
 *     the medical note
 * One page for everyone; signed in with a profile, the main action is
 * "Go to your Home". Nothing on the page is sticky. */

const NEEDS_PHOTO = (p) => !/tampon tribe|herau|r[eè]sa/i.test(`${p?.brand || ''} ${p?.name || ''}`);

const Arrow = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>);

/* CTAs that go somewhere are links (open in a new tab, copy the address), not buttons. */
function Go({ href, onGo, className, children }) {
  return <a className={className} href={href} onClick={(e) => { if (!onGo || !isPlainLeftClick(e)) return; e.preventDefault(); onGo(); }}>{children}</a>;
}

/* ---------- 1. hero ----------
   Founder, Oct 27 11:32-11:36: the rain in the back, faded; the title in the
   middle, not huge; clean, but keep the fun and the brown and pink bar.
   The espresso band she liked, ending in the wavy edge, with the falling
   cut-outs as a faded layer on both sides (soft butter circles on espresso)
   and everything centred on top (13:01: big, not crowded): a big two-line
   title with "your body." in pink, one line on what ayna connects, the search, Slide to start (the welcome
   tip's anchor) and How we match. The brown and pink bar runs under it. */
function Hero({ cta, onSearch, onViewHowItWorks, banner = null }) {
  return (
    <section className="wl-hero" aria-labelledby="hm-hero-title">
      <div className="wl-hero__band">
        <Rain cols={4} onInk className="wl-rain" />
        <div className="wl-hero__in">
          {/* One promise on the website and the app (landing audit 4 and 9). */}
          <h1 id="hm-hero-title" className="wl-title">Find what fits <span>your body.</span></h1>
          <p className="wl-one">Your products, routine and health data, finally in one place.</p>
          <SlideToStart className="wl-sts" tour="landing-start" size="lg" hint={null} label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="butter" />
          <HeroSearch onSearch={onSearch} className="wl-search" />
          <a className="wl-how" href="/how-it-works" onClick={(e) => { if (!onViewHowItWorks || !isPlainLeftClick(e)) return; e.preventDefault(); onViewHowItWorks(); }}>How we match<Arrow /></a>
          {banner && <div className="wl-banner">{banner}</div>}
        </div>
      </div>
      <ScallopEdge shape="wave" tone="ink" className="wl-edge" />
    </section>
  );
}

/* ======================================================================
   Below the hero (founder, Oct 27 13:44: "fix the rest of the landing page
   look at the inspo ... its still ugly ... i love the pink and brown bar
   thing can u integrate more"). One idea and one picture per section, big
   type, little text, in the order the best consumer-health pages use:
   the problem, the products, how it works with the proof, reads and the
   community, Pro, who we are, then one last ask.
   Inspo moves: the Feel Fits pain-point checkerboard (4dfb3fbd), the PITCH
   half-photo / half-colour split (audits/v3/inspo/36) and one oversized
   closing line (FEEL FITS, the act). The brown and pink BrandStrip marks the
   two turns of the page.
   ====================================================================== */

// Core needs lead (periods, intimate care, menopause, pelvic floor); creams, sleep and gadgets come after.
const CORE = /pad|tampon|cup|disc|period|intimate|vaginal|menopause|pelvic|uti|cramp|fertility|postpartum|pregnan/i;
function weeklyLineup() {
  const list = getWeeklyTrendingLineup(ALL_PRODUCTS).map((x) => x.product)
    .filter((p) => p?.image && NEEDS_PHOTO(p) && !/sex|intimacy|toy/i.test(String(p.category || '')) && !/\banal\b|vibrator|dildo|mouth tape/i.test(String(p.name || '')));
  const core = list.filter((p) => CORE.test(`${p.category} ${(p.healthFunctions || []).join(' ')}`));
  return [...core, ...list.filter((p) => !core.includes(p))];
}

/* ---------- 3. what you can do on ayna (butter) ----------
   Founder, Oct 28: "i only like the hero with the falling pictures and widgets
   from the app". So the page keeps that language below the hero: each tile is
   one real ayna feature drawn with the same app widgets (quiz chips, the
   evidence meter, a routine timeline, the Ask ayna bubble, the month of dots),
   in brand colours, like the tile dashboards in her UI/UX inspo folder ("I LOVE
   THIS ONE"). Words only on the widgets, never invented numbers or results. */
function FeatureArt({ kind }) {
  if (kind === 'match') return (
    <span className="lpf-art is-match" aria-hidden="true">
      {STAGE_CHIPS.map((c, i) => <span key={c} className={`lpf-chip${i === 2 ? ' is-on' : ''}`}>{c}</span>)}
    </span>
  );
  if (kind === 'evidence') return (
    <span className="lpf-art is-meter" aria-hidden="true">
      {LEVELS.map((l) => <span key={l.n} className="lpf-meter"><b>{l.word}</b><span>{[1, 2, 3].map((b) => <i key={b} className={b <= l.n ? 'is-on' : ''} />)}</span></span>)}
    </span>
  );
  if (kind === 'routine') return (
    <span className="lpf-art is-routine" aria-hidden="true">
      {['Every morning', 'Every night', 'During your period'].map((t) => <span key={t} className="lpf-step"><i />{t}</span>)}
    </span>
  );
  if (kind === 'ask') return (
    <span className="lpf-art is-ask" aria-hidden="true">
      <span className="lpf-bubble is-me">Is a cup or a disc better for a heavy flow?</span>
      <span className="lpf-bubble">Here’s what the research says, with sources…</span>
    </span>
  );
  return (
    <span className="lpf-art is-month" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => <i key={i} className={i >= 3 && i <= 7 ? 'is-p' : i === 15 ? 'is-today' : ''} />)}
    </span>
  );
}
const STAGE_CHIPS = ['Regular periods', 'Postpartum', 'Perimenopause'];
const FEATURES = [
  { k: 'match', tone: 'pink', wide: true, t: 'Get matched', d: 'Answer a few questions about your body. See products and care matched to your needs, and why each one fits.', href: '/quiz', cta: 'Start free' },
  { k: 'evidence', tone: 'butter', t: 'See the evidence', d: 'Every product shows how strong the research behind it is.', href: '/how-it-works', cta: 'How we match' },
  { k: 'routine', tone: 'ink', t: 'Build your routine', d: 'Know when to use what you already have.', href: '/you/ecosystem', cta: 'Your ecosystem' },
  { k: 'ask', tone: 'butter', t: 'Ask ayna', d: 'Questions about your body or a product, answered with sources.', href: '/ask', cta: 'Ask a question' },
  { k: 'month', tone: 'pink', t: 'Check in', d: 'A quick log of how you feel shows what is working.', href: '/you/ecosystem', cta: 'Your month' },
];
function Features({ onGo }) {
  return (
    <section className="lpf" aria-labelledby="lpf-h">
      <div className="hm-wrap">
        <h2 id="lpf-h" className="lp-h2">What you can do on ayna</h2>
        <ul className="lpf-grid">
          {FEATURES.map((f) => (
            <li key={f.k} className={`lpf-tile is-${f.tone}${f.wide ? ' is-wide' : ''}`}>
              <a href={f.href} className="lpf-tile__link" onClick={(e) => { if (!onGo?.[f.k] || !isPlainLeftClick(e)) return; e.preventDefault(); onGo[f.k](); }}>
                <span className="lpf-tile__text">
                  <strong className="lpf-tile__t">{f.t}</strong>
                  <span className="lpf-tile__d">{f.d}</span>
                </span>
                <FeatureArt kind={f.k} />
                <span className="lpf-tile__go"><span>{f.cta}</span><span className="lpf-tile__arrow" aria-hidden="true"><Arrow /></span></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 5. what is behind every match (espresso) ----------
   The catalog in four big numbers, counted when it loads (nothing typed in).
   Big numerals on espresso, the way her inspo's stat screens do it. */
function Proof({ onViewArticles }) {
  const nums = useCatalogNumbers() || [null, null, null, null];
  return (
    <section className="lpp" aria-labelledby="lpp-h">
      <div className="hm-wrap">
        <div className="lpp-head">
          <h2 id="lpp-h" className="lp-h2">What’s behind every match</h2>
          <Go className="lpp-more" href="/explore/resources" onGo={onViewArticles}>Read our sources<Arrow /></Go>
        </div>
        <ul className="lpp-nums" aria-busy={nums[0] ? undefined : 'true'}>
          {nums.map((n, i) => (n
            ? <li key={i}><b>{n.n.toLocaleString('en-US')}</b><span>{n.label}</span></li>
            : <li key={i} className="is-skel" aria-hidden="true"><b>&nbsp;</b><span>&nbsp;</span></li>))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 4. the products (butter, the same band) ----------
   The approved Shop cards (19c492f2): big square photos, little text. The
   need chips switch the four; with none picked they are this week's picks
   (signed in: her top picks). */
const SHOWN_NEEDS = 6;
function Picks({ onOpenProduct, onViewDiscovery, picks = null }) {
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
    <section className="wlx-picks" aria-labelledby="wlx-picks-h">
      <div className="hm-wrap">
        <header className="hm-head wlx-head">
          <h2 id="wlx-picks-h" className="lp-h2" aria-live="polite">{listName}</h2>
          <Go className="ay-btn ay-btn--text hm-head__all" href="/explore/products" onGo={() => onViewDiscovery?.('')}><span className="hm-head__long">See all products</span><span className="hm-head__short">See all<span className="ed-sr"> products</span></span><Arrow /></Go>
        </header>
        <div className="hm-chips wlx-chips" role="group" aria-label="Choose a need">
          {needs.length ? <>
            {needs.map((n) => (<Chip key={n.id} selected={n.id === need?.id} onClick={() => setId(n.id === id ? null : n.id)}>{n.label}</Chip>))}
            <Go className="ayk-chip hm-chips__all" href="/explore/products" onGo={() => onViewDiscovery?.('')}>All needs<Arrow /></Go>
          </> : [0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="hm-chips__skel" aria-hidden="true" />)}
        </div>
        <ul className="hm-stickers wlx-cards" key={need?.id || 'picks'} aria-label={loading ? 'Loading products' : listName}>
          {!loading ? four.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} onOpen={onOpenProduct} className="hm-sticker" />
            </li>
          )) : [0, 1, 2, 3].map((i) => <li key={i} aria-hidden="true"><div className="hm-sticker__skel" /></li>)}
        </ul>
        {need && (
          <div className="hm-shop__foot">
            <Go className="ay-btn ay-btn--secondary" href="/explore/products" onGo={() => onViewDiscovery?.(need.group ? { initialMacroGroup: need.group } : '')}>See all {need.label.toLowerCase()} products</Go>
          </div>
        )}
      </div>
    </section>
  );
}

const LEVELS = [
  { n: 3, word: 'Strong evidence' },
  { n: 2, word: 'Some evidence' },
  { n: 1, word: 'Limited evidence' },
];
/* proof: every number is counted from the catalog when it loads (nothing typed in). */
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
    // The same counts the Shop and Services pages show (one source: data/catalogCounts.js).
    const { products, services } = shopCatalogCounts();
    return [
      { n: products + services, label: `${products} products in the Shop and ${services} services` },
      { n: brands.size, label: 'brands, big and small' },
      { n: sources.size, label: 'sources linked on product pages' },
      { n: needs, label: 'areas of care, from periods to menopause' },
    ];
  }, [ready]);
}
/* ---------- 7. ayna Pro (espresso) ----------
   Early Access prices (src/components/SubscriptionPaywallModal.jsx on main),
   as static text, and Learn more to /pro. */
function Pro({ pro = false, offerOpen = null }) {
  const month = PLANS.find((x) => x.id === 'month');
  const year = PLANS.find((x) => x.id === 'year');
  return (
    <Band tone="ink" className="hm-sec hm-band wl-pro" aria-labelledby="wl-pro-h">
      <div className="hm-wrap wl-pro__grid">
        <div className="wl-pro__copy">
          <span className="wl-pro__tag">{pro ? 'ayna Pro' : 'ayna Pro · Early Access'}</span>
          <h2 id="wl-pro-h" className="lp-h2">{pro ? 'You’re on ayna Pro.' : 'More of ayna, when you want it.'}</h2>
          <p className="wl-pro__body">{pro
            ? 'Connect your health data, see your dashboard and use up to 50 Ask ayna chats a month.'
            : 'Connect your health data, go deeper on your patterns and lift the free limits. Matches, safety notes and evidence stay free.'}</p>
          <a className="wl-pro__more" href={pro ? '/health-data' : '/pro'}>{pro ? 'Connect health data' : 'See what Pro includes'}<Arrow /></a>
        </div>
        {!pro && (offerOpen === false
          ? <p className="wl-pro__closed">The Early Access offer is closed right now.</p>
          : <div className="wl-pro__side">
            <ul className="wl-pro__prices">
              <li><small>Monthly</small><b>{month.price}</b><s>{month.regular}</s><em>first month</em></li>
              <li className="is-best"><small>Yearly</small><b>{year.price}</b><s>{year.regular}</s><em>first year</em></li>
            </ul>
            <p className="wl-pro__terms">Unlock Pro now. Your paid term starts {PAID_TERM_STARTS}, then renews at the regular price unless you cancel.</p>
          </div>)}
      </div>
    </Band>
  );
}

/* ---------- 9. the last ask (espresso) ----------
   The promise once more, as big as the page gets, and Slide to start. */
function FinalCta({ cta }) {
  return (
    <Band tone="ink" className="hm-band wlx-end" aria-labelledby="wlx-end-h">
      <div className="hm-wrap wlx-end__in">
        <h2 id="wlx-end-h" className="wlx-end__h">Find what fits <span>your body.</span></h2>
        <SlideToStart className="wlx-end__sts" size="lg" label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="butter" />
      </div>
    </Band>
  );
}

/* ---------- page ---------- */
// One page for everyone (the ayna logo opens it signed in or out). Signed in
// with a profile, the main action is "Go to your Home", the phrases step
// aside and the shop cards drop "See your match". `communityPosts` are the
// most helpful Powder Room posts (one is shown, in the Community half).
export default function WebLanding({ signedIn = false, userId = null, hasProfile = false, onAsk, personalPicks = null, onStartQuiz, onGoHome, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewCommunity, onViewHowItWorks, onSearch, communityPosts = [], heroBanner = null }) {
  const rest = useAfterHeroPaint();
  const { active: pro, offerOpen } = useProStatus(signedIn ? userId : null);
  const home = Boolean(signedIn && hasProfile && onGoHome);
  const cta = home
    ? { label: 'Go to your Home', slide: 'Slide to go to your Home', go: onGoHome }
    : { label: 'Get my matches', slide: 'Slide to find your matches', go: onStartQuiz };
  return (
    <div id="ay-landing" className="ed ed-home hm hm-uq wl">
      <Hero cta={cta} onSearch={onSearch} onViewHowItWorks={onViewHowItWorks} banner={home ? null : heroBanner} />
      <BrandBar onOpen={onViewWaitlist} />
      {/* Under the falling pictures: the original website's sections (founder, Oct 27 19:18: keep the
          raining pictures and widgets, and use the original website for the rest). */}
      <Features onGo={{ match: home ? onGoHome : onStartQuiz, evidence: onViewHowItWorks, ask: onAsk, routine: home ? onGoHome : null, month: home ? onGoHome : null }} />
      <Picks onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} picks={Array.isArray(personalPicks) ? personalPicks : null} />
      {rest && <>
      <Proof onViewArticles={onViewArticles} />
      <div className="wl-classic"><div className="ed ed-home hm hm-uq">
        <ReadsCommunity onViewArticle={onViewArticle} onViewArticles={onViewArticles} onViewCommunity={onViewCommunity} posts={communityPosts} />
        <Founders onViewAbout={onViewAbout} />
      </div></div>
      <Pro pro={pro === true} offerOpen={offerOpen} />
      <div className="wl-turn" aria-hidden="true" />
      <FinalCta cta={cta} />
      </>}
      <div className="wl-note"><MedicalNote className="wl-note__p" /></div>
    </div>
  );
}
/* LCP: the hero is the largest paint. Rendering the whole page in the first
   commit left it waiting behind one long task on slow phones, so everything
   after the shop band mounts once the first falling packshot is decoded (or
   after 1.2s at most). It is below the fold on every screen size. */
function useAfterHeroPaint() {
  const [ready, setReady] = useState(() => typeof window === 'undefined' || window.scrollY > 0);
  useEffect(() => {
    if (ready) return undefined;
    let done = false;
    // two frames: the hero's first paint happens before the rest of the page renders
    const go = () => { if (done) return; done = true; requestAnimationFrame(() => requestAnimationFrame(() => window.setTimeout(() => setReady(true), 0))); };
    const img = document.querySelector('.wl-rain img');
    if (img?.decode) img.decode().then(go, go); else go();
    const t = window.setTimeout(go, 1200);
    return () => { done = true; window.clearTimeout(t); };
  }, [ready]);
  return ready;
}
