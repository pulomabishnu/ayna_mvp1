import React, { useEffect, useState } from 'react';
import { WhatYouCanDo, Picks, Proof, ReadsAndCommunity, Founders, ProAndEnd } from './LandingBody.jsx';
import MedicalNote from '../MedicalNote.jsx';
import { isPlainLeftClick } from '../../utils/productRoute';
import '../../styles/editorial.css';
import '../../styles/home.css';
import '../../styles/loop-a-landing.css';
import '../../styles/uq-landing.css';
import { ScallopEdge } from '../ui/ay';
import SlideToStart from '../ui/SlideToStart.jsx';
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

const Arrow = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>);

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
      {/* Below the hero (./LandingBody.jsx): one calm butter page, then one espresso close. */}
      <div className="lb">
        <WhatYouCanDo member={home} onGo={{ match: home ? onGoHome : onStartQuiz, evidence: onViewHowItWorks, ask: onAsk, routine: home ? onGoHome : null, checkin: home ? onGoHome : null }} />
        <Picks onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} picks={Array.isArray(personalPicks) ? personalPicks : null} />
        {rest && <>
          <Proof onViewArticles={onViewArticles} />
          <ReadsAndCommunity onViewArticle={onViewArticle} onViewArticles={onViewArticles} onViewCommunity={onViewCommunity} posts={communityPosts} />
          <Founders onViewAbout={onViewAbout} />
        </>}
      </div>
      {rest && <ProAndEnd pro={pro === true} offerOpen={offerOpen} cta={cta} />}
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
