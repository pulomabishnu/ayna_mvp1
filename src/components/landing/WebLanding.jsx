import React, { useEffect, useRef, useState } from 'react';
import { Picks, Proof, Founders, ProAndEnd, useRiseOnView } from './LandingBody.jsx';
import MedicalNote from '../MedicalNote.jsx';
import '../../styles/editorial.css';
import '../../styles/home.css';
import '../../styles/loop-a-landing.css';
import '../../styles/uq-landing.css';
import { ScallopEdge } from '../ui/ay';
import { trackLandingCta, landingCtaCopy, CTA_COPY } from '../../utils/funnelEvents.js';
import HowItWorksDemo from './HowItWorksDemo.jsx';
import { Rain, HeroSearch, BrandBar } from './kit.jsx';
import { useProStatus } from '../../pro/useProStatus.js';
import './web-landing.css';

/* The website's / (founder, Oct 27 10:40: "i liked how we had the website
 * ... optimize it for web"). The v2 website home is back, desktop-first, with
 * the raining cut-outs brought into its hero. Styles: src/styles/home.css
 * (hm-*), uq-landing.css (colour-blocked bands) and ./web-landing.css (the
 * hero, Pro and the closing note).
 *
 * The hero and the brand bar were approved Oct 27. Everything below them is
 * ./LandingBody.jsx (redone Oct 29 from her inspo folder: soft colour tiles,
 * icons in circles, big numbers), on one butter page with one espresso close.
 * One page for everyone; signed in with a profile, the main action is
 * "Go to your Home". Nothing on the page is sticky. */


/* ---------- 1. hero ----------
   Founder, Oct 27 11:32-11:36: the rain in the back, faded; the title in the
   middle, not huge; clean, but keep the fun and the brown and pink bar.
   The espresso band she liked, ending in the wavy edge, with the falling
   cut-outs as a faded layer on both sides (soft butter circles on espresso)
   and everything centred on top (13:01: big, not crowded): a big two-line
   title with "your body." in pink, one line on what ayna connects, the search, Slide to start (the welcome
   tip's anchor) and How we match. The brown and pink bar runs under it. */
// Nov 3 (founder notes + research): say what ayna does in the headline, the
// exact detail in the subheadline, the three reasons right under it, and one
// plain "Sign up free" button (a slider was one more thing to figure out).
// Website, last 30 days before this: 357 visitors, 63% left from the home page,
// 21 started the quiz.
const VALUE_PROPS = [
  { k: 'match', t: 'Made for you', d: 'Picked for your body and what you need.' },
  { k: 'safe', t: 'Safe first', d: 'We check your medicines first.' },
  { k: 'evidence', t: 'Honest picks', d: 'Brands can\u2019t pay to be picked.' },
];
function Hero({ cta, onSearch, banner = null }) {
  const watch = (e) => { e.preventDefault(); trackLandingCta('watch_demo'); document.getElementById('ay-demo')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  return (
    <section className="wl-hero" aria-labelledby="hm-hero-title">
      <div className="wl-hero__band">
        <Rain cols={4} onInk className="wl-rain" />
        <div className="wl-hero__in">
          <h1 id="hm-hero-title" className="wl-title">Find women’s health products that fit you.</h1>
          <p className="wl-one">Pads, vitamins, sleep help and more. Answer 4 questions and see what fits you.</p>
          <div className="wl-ctas">
            <button type="button" className="wl-cta" data-tour="landing-start" onClick={() => { trackLandingCta(cta.id, 'web', cta.copy); cta.go?.(); }}>{cta.label}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
            <a className="wl-watch" href="#ay-demo" onClick={watch}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M10 8.5v7l6-3.5-6-3.5Z" /></svg>Watch how it works</a>
          </div>
          {cta.note && <p className="wl-cta-note">{cta.note}</p>}
          {/* Nov 3 (audit): the 3 reasons as one quiet line of ticks, not an icon-in-a-circle trio. */}
          <ul className="wl-ticks" aria-label="Why ayna">{VALUE_PROPS.map((v) => <li key={v.k}>{v.t}<span>: {v.d.replace(/\.$/, '')}</span></li>)}</ul>
          {banner && <div className="wl-banner">{banner}</div>}
        </div>
      </div>
      <ScallopEdge shape="wave" tone="ink" className="wl-edge" />
    </section>
  );
}

/* ---------- page ---------- */
// One page for everyone (the ayna logo opens it signed in or out). Signed in
// with a profile, the main action is "Go to your Home", the phrases step
// aside and the shop cards drop "See your match". `communityPosts` are the
// most helpful Powder Room posts (one is shown, in the Community half).
export default function WebLanding({ signedIn = false, userId = null, hasProfile = false, onAsk, personalPicks = null, onStartQuiz, onGoHome, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewCommunity, onViewHowItWorks, onSearch, communityPosts = [], heroBanner = null }) {
  const rest = useAfterHeroPaint();
  const pageRef = useRef(null);
  useRiseOnView(pageRef, [rest]);
  const { active: pro, offerOpen } = useProStatus(signedIn ? userId : null);
  const home = Boolean(signedIn && hasProfile && onGoHome);
  const [copy] = useState(landingCtaCopy);
  const cta = home
    ? { id: 'go_home', label: 'Go to your Home', go: onGoHome }
    : { id: 'start_quiz', copy, label: CTA_COPY[copy], note: 'Free. No card. About 1 minute.', go: onStartQuiz };
  return (
    <div id="ay-landing" className="ed ed-home hm hm-uq wl" ref={pageRef}>
      <Hero cta={cta} onSearch={onSearch} banner={home ? null : heroBanner} />
      <HowItWorksDemo onStart={() => { trackLandingCta(`${cta.id}_demo`, 'web', cta.copy); cta.go?.(); }} startLabel={cta.label} onViewHowItWorks={onViewHowItWorks} />
      <BrandBar onOpen={onViewWaitlist} />
      {/* Under the falling pictures: the original website's sections (founder, Oct 27 19:18: keep the
          raining pictures and widgets, and use the original website for the rest). */}
      {/* Below the hero (./LandingBody.jsx): one calm butter page, then one espresso close. */}
      <div className="lb">
        {/* Nov 3: the five feature tiles said the same as "How ayna works", so they're gone; the search moved here, next to the products. */}
        <Picks onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} picks={Array.isArray(personalPicks) ? personalPicks : null} search={<HeroSearch onSearch={onSearch} className="lb-search" />} />
        {rest && <>
          <Proof onViewArticles={onViewArticles} />
          <Founders onViewAbout={onViewAbout} />
        </>}
      </div>
      {rest && <ProAndEnd pro={pro === true} offerOpen={offerOpen} cta={{ ...cta, go: () => { trackLandingCta(`${cta.id}_end`, 'web', cta.copy); cta.go?.(); } }} />}
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
