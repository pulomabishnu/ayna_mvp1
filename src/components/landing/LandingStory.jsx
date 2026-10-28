import React, { useMemo, useState } from 'react';
import { ALL_PRODUCTS, MACRO_GROUPS, useCatalogReady } from '../../data/catalog.js';
import { sentenceCase } from '../../utils/sentenceCase.js';
import { isPlainLeftClick } from '../../utils/productRoute.js';
import { useRecommendationViews } from '../../utils/recommendationAnalytics';
import { matchBreakdown, PARTNER_NOTE } from '../../matching/matchBreakdown.js';
import { shownMatchPercent } from '../../utils/matchDisplay.js';
import { productsForNeed } from '../landingNeeds';
import ProductCard from '../ProductCard';
import SuggestBox from '../SuggestBox.jsx';
import { Chip } from '../ui/ay';
import BrandStrip from '../ui/ay/BrandStrip.jsx';
import { FAMILIAR, weeklyLineup, NEEDS_PHOTO } from '../LandingV2.jsx';
import { Widget } from './kit.jsx';
import { PLANS, PAID_TERM_STARTS } from '../../pro/plans.js';
import { PRO_TAGLINE } from '../../pro/features.js';
import Photo from '../ui/Photo.jsx';
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
          {!loading ? rows.map(({ product, percent, why, hold }, n) => (
            <li key={product.id} className="ls-row__item">
              <span className="ls-row__n" aria-hidden="true">{n + 1}</span>
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
            <p><strong>{signedIn ? 'Finish your quiz to unlock your matches.' : 'Sign in to unlock personalized results.'}</strong></p>
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

/* ---------- 2. how it works ----------
   Three taped polaroids, numbered in script (the inspo's "one, two, three").
   Step two carries the real engine's answer for a labelled example profile,
   so "with the why" is shown, not said. */
/* Each step shows the piece of ayna it describes, drawn from the app's own
   parts (chips, the match card, saved rows), not another photo. */
const QUIZ_CHIPS = [['Heavy periods', true], ['Cramps or period pain', true], ['Fragrance-free', false], ['Trouble sleeping', false]];
const ECO_IDS = ['p-lena-cup', 'p-natracare-pad', 'p-thermacare'];
function StepQuiz() {
  return (
    <div className="ls-ui ls-ui--quiz" aria-hidden="true">
      <p className="ls-ui__q">What are you experiencing?</p>
      <p className="ls-ui__hint">Pick all that apply</p>
      <div className="ls-ui__chips">{QUIZ_CHIPS.map(([t, on]) => <span key={t} className={`ls-ui__chip${on ? ' is-on' : ''}`}>{on && <svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10" /></svg>}{t}</span>)}</div>
      <span className="ls-ui__bar"><i /></span>
    </div>
  );
}
function StepMatch({ ex, onOpenProduct }) {
  if (!ex) return <div className="ls-ui ls-ui--match" aria-hidden="true" />;
  return (
    <button type="button" className="ls-ui ls-ui--match" onClick={() => onOpenProduct?.(ex.product)} aria-label={`Example: ${ex.product.name}, ${ex.percent}% match. ${ex.b.raised[0]?.text || ''}`}>
      <span className="ls-ui__row">
        <span className="ls-ui__thumb"><img src={ex.product.image} alt="" loading="lazy" decoding="async" /></span>
        <span className="ls-ui__name">{ex.product.name}</span>
        <span className="ls-ui__pct">{ex.percent}<small>%</small></span>
      </span>
      <span className="ls-ui__why is-up">{ex.b.raised[0]?.text}</span>
      {ex.b.unknown[0] && <span className="ls-ui__why is-q">Not sure yet: {ex.b.unknown[0].text.charAt(0).toLowerCase() + ex.b.unknown[0].text.slice(1)}</span>}
      <span className="ls-ui__cap">Example</span>
    </button>
  );
}
function StepEcosystem({ ready }) {
  const items = ready ? ECO_IDS.map((id) => ALL_PRODUCTS.find((p) => p.id === id)).filter((p) => p?.image) : [];
  return (
    <div className="ls-ui ls-ui--eco" aria-hidden="true">
      <p className="ls-ui__q">My ecosystem</p>
      <ul>{items.map((p) => <li key={p.id}><span className="ls-ui__thumb"><img src={p.image} alt="" loading="lazy" decoding="async" /></span><span className="ls-ui__name">{p.name}</span><svg className="ls-ui__tick" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10" /></svg></li>)}</ul>
      <span className="ls-ui__streak"><Widget k="streak" /><small>Check-ins</small></span>
    </div>
  );
}
const STEPS = [
  { t: 'Answer a few questions', d: 'Your needs, life stage and what you avoid.' },
  { t: 'See your matches, and why', d: 'Every product gets a Health Match with the reasons.' },
  { t: 'Build your ecosystem', d: 'Keep what fits, check in, ask ayna anytime.' },
];
function HowItWorks({ onOpenProduct, onViewHowItWorks }) {
  const ready = useCatalogReady();
  const ex = ready ? getExample() : null;
  const ui = [<StepQuiz key="q" />, <StepMatch key="m" ex={ex} onOpenProduct={onOpenProduct} />, <StepEcosystem key="e" ready={ready} />];
  return (
    <section className="ls ls--butter ls-how" aria-labelledby="ls-how-h">
      <div className="hm-wrap">
        <header className="ls-head">
          <h2 id="ls-how-h" className="ls-h2">How ayna <em>works</em></h2>
        </header>
        <ol className="ls-steps">
          {STEPS.map((st, i) => (
            <li key={st.t} className="ls-step">
              {ui[i]}
              <span className="ls-step__n" aria-hidden="true">{i + 1}</span>
              <h3>{st.t}</h3>
            </li>
          ))}
        </ol>
        <div className="ls-how__foot">
          <p className="ls-badge-line"><span className="ls-zero">0%</span> of your match comes from brand partnerships.</p>
        </div>
        <More title="What ayna weighs, in order" className="ls-more--center">
          <ol className="ls-order">
            {ORDER.map((o, n) => <li key={o.t}><span aria-hidden="true">{n + 1}</span><div><strong>{o.t}</strong><small>{o.d}</small></div></li>)}
          </ol>
          <Go className="ls-link" href="/how-it-works" onGo={onViewHowItWorks}>The full method<Arrow /></Go>
        </More>
      </div>
    </section>
  );
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
function HealthContext({ pro, signedIn, onOpenPro, onOpenHealth }) {
  return (
    <section className="ls ls--ink ls-health" aria-labelledby="ls-health-h">
      <div className="hm-wrap ls-split">
        <div className="ls-widgets" aria-hidden="true">
          {/* The app's own health widgets (kit.jsx), as shapes only: no numbers, so nothing reads as someone's data. */}
          {[['ring', 'Cycle'], ['sleep', 'Sleep'], ['month', 'Your month'], ['streak', 'Check-ins']].map(([k, label]) => (
            <span key={k} className={`ls-widget ls-widget--${k}`}><span className="ls-widget__g"><Widget k={k} /></span><small>{label}</small></span>
          ))}
          <ul className="ls-widgets__src">{SOURCES.map((x) => <li key={x.name}>{x.name}</li>)}</ul>
        </div>
        <div>
          <ProMark>with ayna Pro</ProMark>
          <h2 id="ls-health-h" className="ls-h2">Your health data, <em>in context.</em></h2>
          <p className="ls-plain-note">Never sold. Off until you connect it. Delete anytime.</p>
          <div className="ls-mores">
            <More title="What you can connect">
              <table className="ls-sources">
                <caption className="lk-sr">Health data you can connect</caption>
                <thead><tr><th scope="col">Source</th><th scope="col">What it adds</th><th scope="col">Used for</th></tr></thead>
                <tbody>{SOURCES.map((s) => <tr key={s.name}><th scope="row">{s.name}<small>{s.where}</small></th><td>{s.gives}</td><td>{s.use}</td></tr>)}</tbody>
              </table>
            </More>
            <More title="Privacy and how ayna uses it">
              <ul className="ls-ticks">
                <li>Off until you connect it, one source at a time. Never sold or shared with brands.</li>
                <li>When your data backs up a need you chose, that need comes first. It never adds a need, never changes a match percent and never diagnoses.</li>
                <li>Oura stays in your insights until Oura confirms its terms allow matching.</li>
                <li>Pause, disconnect or delete it anytime.</li>
              </ul>
              <a className="ls-link" href="/consumer-health-data">Consumer health data notice<Arrow /></a>
            </More>
            <More title="Suggest an app or wearable">
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
          <p className="ls-plain-note">{pro ? 'Up to 50 chats a month with ayna Pro.' : <>Free: 5 chats a month. <ProMark />: up to 50.</>}</p>
        </div>
        <div className="ls-chat">
          <p className="ls-chat__head"><span className="ls-chat__dot" aria-hidden="true" />Ask ayna</p>
          <ul className="ls-bubbles" aria-label="Try a question">
            {ASKS.map((q) => <li key={q}><button type="button" className="ls-bubble" onClick={() => onAsk?.(q)}>{q}</button></li>)}
          </ul>
          <p className="ls-chat__foot">Tap one to ask it. Information, not medical advice.</p>
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
              <p><span className="ls-offer__tag">Early Access · up to 50% off</span></p>
              {/* Yearly leads, as on the paywall (pre-selected there). */}
              <p className="ls-offer__price"><strong>{year.price}</strong> first year <s aria-label={`normally ${year.regular}`}>{year.regular}</s></p>
              <p className="ls-offer__per">That’s {year.sub}.</p>
              <p className="ls-offer__or">Or <strong>{month.price}</strong> for your first month <s aria-label={`normally ${month.regular}`}>{month.regular}</s></p>
            </div>
            <div className="ls-offer__right">
              <p className="ls-offer__terms">Pro unlocks today. Your paid term starts {PAID_TERM_STARTS}, then renews at {year.regular}/year or {month.regular}/month. Cancel anytime.</p>
              <div className="ls-offer__act">
                <Go className="ay-btn ay-btn--primary ls-offer__cta" href="/pro" onGo={onOpenPro}>Get ayna Pro<Arrow /></Go>
                <span>Free stays free.</span>
              </div>
            </div>
          </div>
        )}
        <More title="Compare Free and Pro" className="ls-more--center">
  <table className="ls-compare">
            <caption className="lk-sr">ayna Free and ayna Pro</caption>
            <thead><tr><th scope="col"><span className="lk-sr">Feature</span></th><th scope="col">Free</th><th scope="col"><ProMark>ayna Pro</ProMark></th></tr></thead>
            <tbody>{COMPARE.map((r) => <tr key={r.k}><th scope="row">{r.k}</th><td>{r.free}</td><td>{r.pro}</td></tr>)}</tbody>
          </table>
        </More>
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
      <HowItWorks onOpenProduct={onOpenProduct} onViewHowItWorks={onViewHowItWorks} />
      <Shelf personal={personalPicks} quizResults={quizResults} healthProfile={healthProfile} matchOpts={matchOpts} signedIn={signedIn}
        onStartQuiz={onStartQuiz} onLogIn={onLogIn} onGoHome={onGoHome} onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} onViewHowItWorks={onViewHowItWorks} />
      <HealthContext pro={pro} signedIn={signedIn} onOpenPro={onOpenPro} onOpenHealth={onOpenHealth} />
      <Ask onAsk={onAsk} pro={pro} />
      <ProPlan pro={pro} offerOpen={offerOpen} onOpenPro={onOpenPro} onOpenHealth={onOpenHealth} onAsk={onAsk} />
    </>
  );
}
