import React, { useEffect, useMemo, useState } from 'react';
import { ALL_PRODUCTS, MACRO_GROUPS, useCatalogReady } from '../../data/catalog.js';
import { sentenceCase } from '../../utils/sentenceCase.js';
import { isPlainLeftClick } from '../../utils/productRoute.js';
import { useRecommendationViews } from '../../utils/recommendationAnalytics';
import { matchBreakdown, PARTNER_NOTE } from '../../matching/matchBreakdown.js';
import { shownMatchPercent } from '../../utils/matchDisplay.js';
import { productsForNeed } from '../landingNeeds';
import ProductCard from '../ProductCard';
import SuggestBox from '../SuggestBox.jsx';
import { Chip, Marquee } from '../ui/ay';
import BrandStrip from '../ui/ay/BrandStrip.jsx';
import { FAMILIAR, weeklyLineup, NEEDS_PHOTO } from '../LandingV2.jsx';
import { PLANS, PAID_TERM_STARTS } from '../../pro/plans.js';
import { PRO_TAGLINE } from '../../pro/features.js';
import Photo from '../ui/Photo.jsx';
import { motionOff } from '../../utils/motion.js';
import './landing-story.css';

/*
 * Everything under the website hero, as one product story (founder brief,
 * Oct 28): discover -> matched to you -> why it may fit -> your health data in
 * context (Pro) -> Ask ayna -> Free vs Pro -> (Reads, Community, founders and
 * the last Slide to start stay in WebLanding).
 *
 * Every claim here is what the product does today (audit, Oct 28):
 * - The match percent comes from her answers and the product's evidence
 *   (src/matching/v2.js scoreV2). Connected data never changes the percent;
 *   it can confirm a need she chose, which puts that need first in her
 *   ecosystem (userProfile.js corroborated, v2.js corroborationBoost). It never
 *   adds a need.
 * - Oura feeds insights only, not matching, until Oura confirms its terms
 *   allow it (src/health/policy.js). WHOOP, Flo and Strava are not shown.
 * - Free: Ask 5 a month, 1 quiz retake a month, 1 Read a week, 1 playlist.
 *   Pro: Ask up to 50 a month, unlimited retakes, Reads and playlists
 *   (api/_proFeatures.js, the pro_* SQL functions).
 * - Partnerships never change a match (src/matching/v2.gates.test.js).
 * No fake numbers, no testimonials: the one worked example is the real engine
 * run on a labelled example profile.
 */

const Arrow = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>);
const Lock = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>);

function Go({ href, onGo, className, children, ...rest }) {
  return <a className={className} href={href} onClick={(e) => { if (!onGo || !isPlainLeftClick(e)) return; e.preventDefault(); onGo(); }} {...rest}>{children}</a>;
}

/* The small "Pro" mark. Text, never a filled box (founder, Oct 27: "Pro" as pink text). */
export const ProMark = ({ children = 'Pro' }) => <span className="ls-pro">{children}</span>;

/* ---------- 1. discover ----------
   The four photo tiles people already know (landing-polish.css lp-need-index),
   each opening the products for that need. Questions, said the way people
   say them; not testimonials. */
function Discover({ onSearch }) {
  return (
    <section className="ls ls--butter ls-discover" aria-labelledby="ls-discover-h">
      <div className="hm-wrap">
        <header className="ls-head">
          <h2 id="ls-discover-h" className="ls-h2">What are you <em>navigating?</em></h2>
          <p className="ls-script ls-discover__note" aria-hidden="true">tap one ↓</p>
        </header>
        <nav className="lp-need-index" aria-label="Common needs">
          {FAMILIAR.map((n) => <Go key={n.need} href={`/explore/products?q=${encodeURIComponent(n.need)}`} onGo={() => onSearch?.(n.need)} className="lp-need-index__link">{n.q.replace(/\.$/, '')}<Arrow /></Go>)}
        </nav>
      </div>
    </section>
  );
}

/* ---------- 2. matched to you ----------
   Four products, never more. Signed out (or no quiz yet): this week's picks
   with a lock on the match, and one clear way to unlock it. Signed in with a
   profile: her top four, each with her real percent and the one-line reason. */
function useNeeds(ready) {
  return useMemo(() => MACRO_GROUPS.filter((g) => g.id !== 'all')
    .map((g) => ({ id: g.id, label: sentenceCase(g.label), group: g.id }))
    .map((n) => ({ ...n, pool: productsForNeed(n).filter(NEEDS_PHOTO) }))
    .filter((n) => n.pool.length >= 2)
    .slice(0, 6), [ready]);
}

function Shelf({ personal, quizResults, healthProfile, matchOpts, signedIn, onStartQuiz, onLogIn, onGoHome, onOpenProduct, onViewDiscovery, onViewHowItWorks }) {
  const ready = useCatalogReady();
  const needs = useNeeds(ready);
  const [needId, setNeedId] = useState(null);
  const need = needs.find((n) => n.id === needId) || null;
  const weekly = useMemo(() => (ready ? weeklyLineup().slice(0, 4) : []), [ready]);
  const mine = Boolean(personal && personal.length >= 2) && !need;

  // Her rows: real percent + reason from the one engine every surface uses.
  const rows = useMemo(() => {
    let list;
    // A need she taps shows that need's products. Order is the catalog's
    // need order, never partner-first: this shelf sits under "matched to you".
    if (need) list = need.pool.slice(0, 4);
    else list = mine ? personal.slice(0, 4) : weekly;
    return list.map((p) => {
      if (!quizResults) return { product: p };
      const b = matchBreakdown(p, quizResults, { healthProfile, matchOpts });
      const shown = b?.percent != null ? shownMatchPercent(b.percent) : null;
      return { product: p, percent: shown, why: shown != null ? (b.reason || '') : '', hold: b?.status === 'safety-hold' };
    });
  }, [need, mine, personal, weekly, quizResults, healthProfile, matchOpts]);
  useRecommendationViews(mine ? rows.map((r) => r.product) : null, 'landing_top_picks');

  const locked = !quizResults;
  const loading = !ready || rows.length < 2;
  const title = mine ? 'Your top matches' : need ? `${need.label}` : 'This week’s picks';
  return (
    <section className="ls ls--cream ls-shelf" aria-labelledby="ls-shelf-h">
      <div className="hm-wrap">
        <header className="ls-head ls-head--row">
          <div>
            <h2 id="ls-shelf-h" className="ls-h2">{mine ? <>Matched to <em>you.</em></> : <>Matched to you, once ayna <em>knows you.</em></>}</h2>
            <p className="ls-lede">{mine ? 'Your best fits right now, and why.' : 'Your Health Match: how well each one fits you.'}</p>
          </div>
          <Go className="ls-link" href="/explore/products" onGo={() => onViewDiscovery?.(need?.group ? { initialMacroGroup: need.group } : '')}>See all products<Arrow /></Go>
        </header>

        {needs.length > 0 && (
          <div className="ls-chips" role="group" aria-label="Choose a need">
            {needs.map((n) => <Chip key={n.id} selected={n.id === needId} onClick={() => setNeedId(n.id === needId ? null : n.id)}>{n.label}</Chip>)}
          </div>
        )}

        <p className="ls-shelf__label" aria-live="polite">{title}</p>
        <ul className={`ls-row${locked ? ' is-locked' : ''}`} aria-label={loading ? 'Loading products' : title}>
          {!loading ? rows.map(({ product, percent, why, hold }) => (
            <li key={product.id} className="ls-row__item">
              <ProductCard product={product} onOpen={onOpenProduct} className="ls-card" matchPercent={percent} matchHold={hold} matchLabel={percent != null ? `${percent}% match` : ''} />
              {locked
                ? <Go className="ls-row__lock" href="/quiz" onGo={onStartQuiz}><Lock />See your match</Go>
                : why ? <p className="ls-row__why">{why}</p> : null}
            </li>
          )) : [0, 1, 2, 3].map((i) => <li key={i} aria-hidden="true" className="ls-row__item"><div className="ls-skel" /></li>)}
        </ul>

        {locked ? (
          <div className="ls-unlock">
            <span className="ls-unlock__icon" aria-hidden="true"><Lock /></span>
            <p><strong>{signedIn ? 'Finish your quiz to unlock your matches.' : 'Sign in to unlock personalized results.'}</strong> A few questions. Free.</p>
            <div className="ls-unlock__actions">
              <Go className="ay-btn ay-btn--primary" href="/quiz" onGo={onStartQuiz}>Get my matches<Arrow /></Go>
              {!signedIn && onLogIn && <button type="button" className="ay-btn ay-btn--text" onClick={onLogIn}>Log in</button>}
            </div>
          </div>
        ) : (
          <p className="ls-fine">{PARTNER_NOTE} <Go className="ls-link ls-link--inline" href="/how-it-works" onGo={onViewHowItWorks}>How we match</Go>{mine && onGoHome ? <> · <Go className="ls-link ls-link--inline" href="/today" onGo={onGoHome}>Your Home</Go></> : null}</p>
        )}
      </div>
    </section>
  );
}

/* ---------- 3. why this may fit ----------
   The real engine, run on a labelled example profile, for the first product
   that comes back a strong fit. If none does (catalog change), the card is
   left out and the ranking order still explains itself. */
const EXAMPLE = {
  label: 'Period cramps and heavy periods · fragrance-free · under $30',
  quiz: { fullHealthIntake: { personalizationCompleted: true, lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain', 'Heavy periods'], avoidIngredients: ['Fragrance'], age: 24, budget: ['Under $30'] }, personalizationCompleted: true },
  candidates: ['p-viboos-heating-pad', 'p-lena-cup', 'p-rael-organic-pad', 'p-cora-disc'],
};
const ORDER = [
  { t: 'Your health need', d: 'What it’s made for comes first.' },
  { t: 'Life stage and safety', d: 'Pregnancy, medications, allergies and what you avoid can rule a product out.' },
  { t: 'Your preferences', d: 'Format, materials and budget.' },
  { t: 'Evidence', d: 'How strong the research is, with sources on every product page.' },
];
// Computed once per page load (a few milliseconds: one product, one profile).
let exampleCache;
function getExample() {
  if (exampleCache !== undefined) return exampleCache;
  if (!ALL_PRODUCTS.length) return null;
  exampleCache = null;
  for (const id of EXAMPLE.candidates) {
    const product = ALL_PRODUCTS.find((p) => p.id === id);
    if (!product?.image) continue;
    const b = matchBreakdown(product, EXAMPLE.quiz);
    const shown = b?.percent != null ? shownMatchPercent(b.percent) : null;
    if (shown != null && shown >= 70 && b.raised.length) { exampleCache = { product, percent: shown, b }; break; }
  }
  return exampleCache;
}
/* A photo from the landing set, sized for its frame (Photo picks avif/webp sizes). */
function Pic({ src, alt = '', className = '', sizes = '(max-width: 899px) 92vw, 600px' }) {
  return <Photo src={src} alt={alt} className={className} sizes={sizes} loading="lazy" decoding="async" />;
}

/* Glance first, tap to learn more (founder, Oct 26): secondary detail lives
   in one of these, closed by default. */
function More({ title, children, className = '' }) {
  return (
    <details className={`ls-more ${className}`.trim()}>
      <summary><span>{title}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg></summary>
      <div className="ls-more__in">{children}</div>
    </details>
  );
}

/* A round sticker with text running around it (the inspo's stamps). It
   turns slowly; still under reduced motion and Pause motion. Decoration. */
function Stamp({ text, children, className = '' }) {
  const id = React.useId().replace(/:/g, '');
  return (
    <span className={`ls-stamp ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <defs><path id={`ls-ring-${id}`} d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1 -88 0" /></defs>
        <circle cx="60" cy="60" r="58" className="ls-stamp__disc" />
        <text className="ls-stamp__ring"><textPath href={`#ls-ring-${id}`}>{text}</textPath></text>
      </svg>
      <span className="ls-stamp__mid">{children}</span>
    </span>
  );
}

/* A flower-shaped price sticker (the inspo's scalloped price badges). */
function Bloom({ tone = 'ink', big, small, label }) {
  const petals = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return <circle key={i} cx={50 + Math.cos(a) * 34} cy={50 + Math.sin(a) * 34} r="16" />;
  });
  return (
    <li className={`ls-bloom is-${tone}`} aria-label={label}>
      <svg viewBox="0 0 100 100" aria-hidden="true"><g>{petals}<circle cx="50" cy="50" r="36" /></g></svg>
      <span aria-hidden="true"><strong>{big}</strong><small>{small}</small></span>
    </li>
  );
}

/* ---------- 2. how it works ----------
   Three taped polaroids, numbered in script (the inspo's "one, two, three").
   Step two carries the real engine's answer for a labelled example profile,
   so "with the why" is shown, not said. */
const STEPS = [
  { n: 'one', t: 'Answer a few questions', d: 'Your needs, life stage and what you avoid.', src: '/landing/hiw-questions-cabinet.webp', alt: 'A woman reaching into her bathroom cabinet' },
  { n: 'two', t: 'See your matches, and why', d: 'Every product gets a Health Match with the reasons.', src: '/landing/hiw-evidence-reading.webp', alt: 'Two friends reading together' },
  { n: 'three', t: 'Build your ecosystem', d: 'Keep what fits, check in, ask ayna anytime.', src: '/landing/hiw-ecosystem-vanity.webp', alt: 'A tidy vanity with everyday care products' },
];
function HowItWorks({ onOpenProduct, onViewHowItWorks, onStartQuiz }) {
  const ready = useCatalogReady();
  const ex = ready ? getExample() : null;
  return (
    <section className="ls ls--grid ls-how" aria-labelledby="ls-how-h">
      <div className="hm-wrap">
        <header className="ls-head ls-head--center">
          <h2 id="ls-how-h" className="ls-h2">How ayna <em>works</em></h2>
        </header>
        <ol className="ls-steps">
          {STEPS.map((st, i) => (
            <li key={st.n} className="ls-step">
              <figure className="ls-polaroid">
                <Pic src={st.src} alt={st.alt} sizes="(max-width: 899px) 80vw, 340px" />
                {i === 1 && ex && (
                  <button type="button" className="ls-match-sticker" onClick={() => onOpenProduct?.(ex.product)} aria-label={`Example: ${ex.product.name}, ${ex.percent}% match. ${ex.b.raised[0]?.text || ''}`}>
                    <span className="ls-match-sticker__img"><img src={ex.product.image} alt="" loading="lazy" decoding="async" /></span>
                    <span className="ls-match-sticker__pct">{ex.percent}<small>%</small></span>
                    <span className="ls-match-sticker__why">+ {ex.b.raised[0]?.text}</span>
                    {ex.b.unknown[0] && <span className="ls-match-sticker__why is-q">? {ex.b.unknown[0].text}</span>}
                    <span className="ls-match-sticker__cap">Example match</span>
                  </button>
                )}
              </figure>
              <span className="ls-script ls-step__n" aria-hidden="true">{st.n}</span>
              <h3>{st.t}</h3>
              <p>{st.d}</p>
            </li>
          ))}
        </ol>
        <div className="ls-how__foot">
          <p className="ls-badge-line"><span className="ls-zero">0%</span> of your match comes from brand partnerships.</p>
          <Go className="ay-btn ay-btn--primary" href="/quiz" onGo={onStartQuiz}>Get my matches<Arrow /></Go>
        </div>
        <More title="What ayna weighs, in order" className="ls-more--center">
          <ol className="ls-order">
            {ORDER.map((o, n) => <li key={o.t}><span aria-hidden="true">{n + 1}</span><div><strong>{o.t}</strong><small>{o.d}</small></div></li>)}
          </ol>
          <Go className="ls-link" href="/how-it-works" onGo={onViewHowItWorks}>The full method<Arrow /></Go>
        </More>
        <Stamp text="women’s health · made for you · " className="ls-how__stamp">ayna</Stamp>
      </div>
    </section>
  );
}

/* The needs, running on a tilted pink ribbon between sections (the inspo's
   "NOS SERVICES" band). Plain words, no claims. Paused with Pause motion. */
const RIBBON = ['Period pain', 'Heavy flow', 'PMOS', 'Perimenopause', 'Pelvic floor', 'Vaginal dryness', 'UTIs', 'Postpartum', 'Fertility', 'Sleep'];
function Ribbon() {
  return <div className="ls-ribbon" aria-hidden="true"><Marquee items={RIBBON} tone="pink" /></div>;
}

/* ---------- 4. your health data, in context (Pro) ----------
   A slow photo slideshow with the sources pinned on it as stickers; the
   words stay short, and the detail (what each source adds, how ayna uses it,
   privacy) sits in dropdowns. Ask for an app we don't support: the same
   anonymous box as in Health data (api/suggestions.js kind 'integration',
   emails the founders). */
const SOURCES = [
  { name: 'Apple Health', where: 'iPhone app', gives: 'Cycle, sleep, heart and activity', use: 'Insights and matching' },
  { name: 'Health Connect', where: 'Android app', gives: 'Cycle, sleep, heart and activity', use: 'Insights and matching' },
  { name: 'Oura', where: 'Web and app', gives: 'Sleep, temperature and readiness', use: 'Insights only, for now' },
  { name: 'Your own numbers', where: 'Web and app', gives: 'Upload a file or a screenshot, you check every value', use: 'Insights and matching' },
];
const HEALTH_SLIDES = [
  { src: '/landing/bed-selfie.webp', alt: 'A woman lying on her bed, surrounded by her things' },
  { src: '/landing/banner-bath-phone.webp', alt: 'A woman relaxing in the bath, looking at her phone' },
  { src: '/landing/tub-girls.webp', alt: 'Two friends laughing in a pink bathroom' },
];
function Slides({ slides, label }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (motionOff()) return undefined;
    const t = window.setInterval(() => { if (!motionOff()) setI((n) => (n + 1) % slides.length); }, 4500);
    return () => window.clearInterval(t);
  }, [slides.length]);
  return (
    <div className="ls-slides" role="group" aria-roledescription="slideshow" aria-label={label}>
      {slides.map((sl, n) => <div key={sl.src} className={`ls-slides__item${n === i ? ' is-on' : ''}`} aria-hidden={n !== i}><Pic src={sl.src} alt={sl.alt} className="ls-photo" /></div>)}
      <div className="ls-slides__dots">
        {slides.map((sl, n) => <button key={sl.src} type="button" aria-label={`Photo ${n + 1} of ${slides.length}`} aria-pressed={n === i} onClick={() => setI(n)} />)}
      </div>
    </div>
  );
}
function HealthContext({ pro, signedIn, onOpenPro, onOpenHealth }) {
  return (
    <section className="ls ls--ink ls-health" aria-labelledby="ls-health-h">
      <div className="hm-wrap ls-split">
        <div className="ls-photo-stack">
          <Slides slides={HEALTH_SLIDES} label="ayna Pro, health data" />
          <ul className="ls-stickers" aria-label="Sources you can connect">
            {SOURCES.map((s) => <li key={s.name}>{s.name}</li>)}
          </ul>
        </div>
        <div>
          <p className="ls-script ls-kicker">with ayna Pro</p>
          <h2 id="ls-health-h" className="ls-h2">Your health data, <em>in context.</em></h2>
          <p className="ls-lede">Cycle, sleep and activity, right next to what you use.</p>
          <p className="ls-plain-note">Never sold. Off until you connect it. Delete anytime.</p>
          <div className="ls-mores">
            <More title="What you can connect">
              <table className="ls-sources">
                <caption className="lk-sr">Health data you can connect</caption>
                <thead><tr><th scope="col">Source</th><th scope="col">What it adds</th><th scope="col">Used for</th></tr></thead>
                <tbody>{SOURCES.map((s) => <tr key={s.name}><th scope="row">{s.name}<small>{s.where}</small></th><td>{s.gives}</td><td>{s.use}</td></tr>)}</tbody>
              </table>
            </More>
            <More title="How ayna uses it">
              <p>When your data backs up a need you told ayna about, that need comes first in your ecosystem.</p>
              <p>It never adds a need you didn’t choose, never changes a match percent and never diagnoses anything. Oura data stays in your insights until Oura confirms its terms allow matching.</p>
            </More>
            <More title="Your data, your call">
              <ul className="ls-ticks">
                <li>Nothing is connected until you choose it, one source at a time.</li>
                <li>Never sold. Never shared with brands or advertisers.</li>
                <li>Pause, disconnect or delete it anytime in Health data.</li>
                <li>Ask ayna only sees your cycle and sleep if you turn that on.</li>
              </ul>
              <a className="ls-link" href="/consumer-health-data">Consumer health data notice<Arrow /></a>
            </More>
            <More title="Use something else? Suggest an app or wearable">
              <SuggestBox mode="integration" context="landing" />
            </More>
          </div>
          {pro
            ? <Go className="ay-btn ls-btn-butter" href="/health-data" onGo={onOpenHealth}>Open Health data<Arrow /></Go>
            : <Go className="ay-btn ls-btn-butter" href="/pro" onGo={onOpenPro}>{signedIn ? 'Get ayna Pro to connect' : 'See ayna Pro'}<Arrow /></Go>}
        </div>
      </div>
    </section>
  );
}

/* ---------- 5. Ask ayna ----------
   A photo with three questions on it as chat bubbles; each opens Ask with
   it filled in. The allowance is said once, plainly. */
const ASKS = ['What could help with period cramps?', 'Disc or cup for heavy flow?', 'Which pads are fragrance-free?'];
function Ask({ onAsk, pro }) {
  return (
    <section className="ls ls--cream ls-ask" aria-labelledby="ls-ask-h">
      <div className="hm-wrap ls-split">
        <div>
          <h2 id="ls-ask-h" className="ls-h2">Ask ayna <em>anything.</em></h2>
          <p className="ls-lede">Answers that know your profile, with the sources behind them.</p>
          <p className="ls-plain-note">{pro ? 'Up to 50 chats a month with ayna Pro.' : <>Free: 5 chats a month. <ProMark />: up to 50.</>}</p>
        </div>
        <div className="ls-photo-stack ls-ask__art">
          <Pic src="/landing/sink-tea.webp" alt="" className="ls-photo" />
          <ul className="ls-bubbles" aria-label="Try a question">
            {ASKS.map((q) => <li key={q}><button type="button" className="ls-bubble" onClick={() => onAsk?.(q)}>{q}</button></li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- 6. Free vs Pro ----------
   Four big facts for what Pro adds (no feature grid), the price with every
   term in plain sight, and the full comparison one tap away. Members see
   what they have instead of an offer. Closed offer: no price, no buy button. */
const COMPARE = [
  { k: 'Matches, safety notes and the why', free: 'Yes', pro: 'Yes' },
  { k: 'Personalization quiz', free: 'Retake once a month', pro: 'Retake anytime' },
  { k: 'Ask ayna', free: '5 chats a month', pro: 'Up to 50 a month' },
  { k: 'Reads', free: '1 a week', pro: 'Unlimited' },
  { k: 'Playlists', free: '1', pro: 'Unlimited' },
  { k: 'Health data', free: '–', pro: 'Apple Health, Health Connect, Oura and your own uploads' },
  { k: 'Insights and tracking', free: 'Basic', pro: 'Deeper insights and trends over time' },
];
function ProPlan({ pro, offerOpen, onOpenPro, onOpenHealth, onAsk }) {
  const year = PLANS.find((p) => p.id === 'year');
  const month = PLANS.find((p) => p.id === 'month');
  return (
    <section className="ls ls--butter ls-plan" aria-labelledby="ls-plan-h">
      <BrandStrip className="ls-plan__strip" />
      <div className="hm-wrap">
        <header className="ls-head ls-head--center">
          <h2 id="ls-plan-h" className="ls-h2">{pro ? 'You’re on ayna Pro.' : <>Free helps you find what fits. <em>Pro learns with you.</em></>}</h2>
        </header>
        <table className="ls-compare">
          <caption className="lk-sr">ayna Free and ayna Pro</caption>
          <thead><tr><th scope="col"><span className="lk-sr">Feature</span></th><th scope="col">Free</th><th scope="col"><ProMark>ayna Pro</ProMark></th></tr></thead>
          <tbody>{COMPARE.map((r) => <tr key={r.k}><th scope="row">{r.k}</th><td>{r.free}</td><td>{r.pro}</td></tr>)}</tbody>
        </table>

        {pro ? (
          <div className="ls-member">
            <Go className="ay-btn ay-btn--primary" href="/health-data" onGo={onOpenHealth}>Connect health data<Arrow /></Go>
            <button type="button" className="ay-btn ay-btn--secondary" onClick={() => onAsk?.('')}>Ask ayna</button>
          </div>
        ) : offerOpen === false ? (
          <p className="ls-fine ls-fine--center">The Early Access offer is closed right now. <a className="ls-link ls-link--inline" href="/pro">See ayna Pro</a></p>
        ) : (
          <div className="ls-offer">
            <div className="ls-offer__prices">
              <p className="ls-script ls-offer__note">early access, up to 50% off!</p>
              {/* Yearly leads, as on the paywall (pre-selected there). */}
              <ul className="ls-blooms" aria-label="Early Access prices">
                <Bloom tone="ink" big={year.price} small="first year" label={`${year.price} for your first year, normally ${year.regular}`} />
                <Bloom tone="pink" big={year.sub.replace('/month', '')} small="a month, yearly" label={`${year.sub} when you pay yearly`} />
                <Bloom tone="butter" big={month.price} small="first month" label={`Or ${month.price} for your first month, normally ${month.regular}`} />
              </ul>
              <p className="ls-offer__regular">Normally <s>{year.regular}/year</s> or <s>{month.regular}/month</s>.</p>
            </div>
            <div className="ls-offer__right">
              <p className="ls-offer__terms">Pro unlocks today. Early Access runs through Dec 31, 2026. Your paid term starts {PAID_TERM_STARTS}, then renews at {year.regular}/year or {month.regular}/month. Cancel anytime.</p>
              <div className="ls-offer__act">
                <Go className="ay-btn ay-btn--primary ls-offer__cta" href="/pro" onGo={onOpenPro}>Get ayna Pro<Arrow /></Go>
                <span>Free stays free.</span>
              </div>
            </div>
          </div>
        )}
        <p className="lk-sr">{PRO_TAGLINE}</p>
      </div>
    </section>
  );
}

export default function LandingStory({
  signedIn = false, quizResults = null, healthProfile = null, matchOpts, personalPicks = null,
  pro = false, offerOpen = null,
  onSearch, onStartQuiz, onLogIn, onGoHome, onOpenProduct, onViewDiscovery, onViewHowItWorks, onAsk, onOpenPro, onOpenHealth,
}) {
  return (
    <>
      <Discover onSearch={onSearch} />
      <Ribbon />
      <HowItWorks onOpenProduct={onOpenProduct} onViewHowItWorks={onViewHowItWorks} onStartQuiz={onStartQuiz} />
      <Shelf personal={personalPicks} quizResults={quizResults} healthProfile={healthProfile} matchOpts={matchOpts} signedIn={signedIn}
        onStartQuiz={onStartQuiz} onLogIn={onLogIn} onGoHome={onGoHome} onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} onViewHowItWorks={onViewHowItWorks} />
      <HealthContext pro={pro} signedIn={signedIn} onOpenPro={onOpenPro} onOpenHealth={onOpenHealth} />
      <Ask onAsk={onAsk} pro={pro} />
      <ProPlan pro={pro} offerOpen={offerOpen} onOpenPro={onOpenPro} onOpenHealth={onOpenHealth} onAsk={onAsk} />
    </>
  );
}
