import React, { useEffect, useState } from 'react';
import LandingV2 from '../LandingV2.jsx';
import MedicalNote from '../MedicalNote.jsx';
import { isPlainLeftClick } from '../../utils/productRoute';
import '../../styles/editorial.css';
import '../../styles/home.css';
import '../../styles/loop-a-landing.css';
import '../../styles/uq-landing.css';
import { Band, ScallopEdge } from '../ui/ay';
import SlideToStart from '../ui/SlideToStart.jsx';
import { Rain, HeroSearch, BrandBar } from './kit.jsx';
import { PLANS, PAID_TERM_STARTS } from '../../pro/plans.js';
import './web-landing.css';
import './landing-polish.css';

/* Website landing: preserve the approved rain hero and brand strip. Below it:
 * needs and real products, a short method, Pro, Reads and Community, founders,
 * one closing action. Secondary explanations expand in place. */

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

/* ---------- 7. ayna Pro (espresso) ----------
   Early Access prices (src/components/SubscriptionPaywallModal.jsx on main),
   as static text, and Learn more to /pro. */
function Pro() {
  return (
    <Band tone="ink" className="hm-sec hm-band wl-pro" aria-labelledby="wl-pro-h">
      <div className="hm-wrap wl-pro__grid">
        <div className="wl-pro__copy">
          <span className="wl-pro__tag">ayna Pro · Early Access</span>
          <h2 id="wl-pro-h" className="wlx-h2">More of ayna, when you want it.</h2>
          <p className="wl-pro__body">Your health dashboard, connected wearables, unlimited Reads and playlists. Basic matches, safety information and your ecosystem stay free.</p>
          <a className="ay-btn lp-pro-cta" href="/pro">Get ayna Pro<Arrow /></a>
          <details className="lp-pro-details"><summary>What stays free?</summary><p>Browse and get your matches, read one Library article each week and create one playlist. Pro unlocks more; your saved ecosystem and privacy controls stay available.</p></details>
        </div>
        <div className="lp-pro-plans">
          <ul className="wl-pro__prices">{[...PLANS].reverse().map((plan) => <li key={plan.id}>
            <small>{plan.label}{plan.best ? ' · 50% off' : ''}</small><b>{plan.price}</b><span>today, for your first {plan.per}</span><span className="lp-plan-renew">{plan.renew}</span>
          </li>)}</ul>
          <p className="lp-pro-timing">Unlock Pro now. Your paid term starts {PAID_TERM_STARTS}.</p>
          <a className="wl-pro__more" href="/pro">Learn more about Pro<Arrow /></a>
        </div>
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
export default function WebLanding({ signedIn = false, hasProfile = false, onStartQuiz, onGoHome, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewCommunity, onViewHowItWorks, onSearch, communityPosts = [], heroBanner = null }) {
  const rest = useAfterHeroPaint();
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
      <div className="wl-classic">
        <LandingV2 bodyOnly membershipSlot={<Pro />} onStartQuiz={home ? onGoHome : onStartQuiz} onViewDiscovery={onViewDiscovery} onOpenProduct={onOpenProduct} onViewArticles={onViewArticles} onViewArticle={onViewArticle} onViewAbout={onViewAbout} onViewWaitlist={onViewWaitlist} onViewCommunity={onViewCommunity} onViewHowItWorks={onViewHowItWorks} onSearch={onSearch} communityPosts={communityPosts} />
      </div>
      {rest && <>
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
