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
 * picture-led needs, a short method, one focused Pro offer, Reads / Community,
 * founders, then one closing action. Secondary explanation stays collapsed. */

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
          <p className="wl-hero__eyebrow">Women’s health, on your terms</p>
          <h1 id="hm-hero-title" className="wl-title">Your health. <span>Your ecosystem.</span></h1>
          <p className="wl-one">Build your own corner of ayna: products, care and routines that fit your needs, with the why behind every match.</p>
          <SlideToStart className="wl-sts" tour="landing-start" size="lg" hint={cta.free ? 'A few questions. Your first matches. Start free.' : null} label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="butter" />
          <HeroSearch onSearch={onSearch} className="wl-search" />
          <a className="wl-how" href="/how-it-works" onClick={(e) => { if (!onViewHowItWorks || !isPlainLeftClick(e)) return; e.preventDefault(); onViewHowItWorks(); }}>How we match<Arrow /></a>
          {banner && <div className="wl-banner">{banner}</div>}
        </div>
      </div>
      <ScallopEdge shape="wave" tone="ink" className="wl-edge" />
    </section>
  );
}

/* ---------- ayna Pro ----------
   The landing sells one idea, not a pricing dashboard. Exact plan detail stays
   on /pro. The first prices are visible; feature depth and free-tier detail are
   disclosed only when someone asks for them. */
function Pro() {
  const month = PLANS.find((plan) => plan.id === 'month') || PLANS[1];
  const year = PLANS.find((plan) => plan.id === 'year') || PLANS[0];
  return (
    <Band tone="ink" className="hm-sec hm-band wl-pro" aria-labelledby="wl-pro-h">
      <div className="hm-wrap lp-pro-simple">
        <div className="wl-pro__copy">
          <span className="wl-pro__tag">ayna Pro · Early Access</span>
          <h2 id="wl-pro-h" className="wlx-h2">Go deeper when you want to.</h2>
          <p className="wl-pro__body">Connect your health data, see your dashboard and get more of ayna without the free limits.</p>
          <div className="lp-pro-offer" aria-label="ayna Pro Early Access pricing">
            <span className="lp-pro-offer__deal">Up to 50% off</span>
            <strong>{month?.price || '$4.99'}</strong>
            <span>first month</span>
            <small>or {year?.price || '$45'} for your first year</small>
          </div>
          <a className="ay-btn lp-pro-cta" href="/pro">Get ayna Pro<Arrow /></a>
          <p className="lp-pro-timing">Unlock Pro now. Your paid term starts {PAID_TERM_STARTS}.</p>
          <details className="lp-pro-details">
            <summary>See what Pro includes</summary>
            <div className="lp-pro-details__inside">
              <ul>
                <li>Health dashboard and connected health data</li>
                <li>Deeper personalized insights and advanced tracking</li>
                <li>Unlimited quiz retakes, Reads and playlists</li>
                <li>Up to 50 Ask ayna chats a month</li>
              </ul>
              <p>Free still includes your ecosystem, basic matches and safety information.</p>
              <a className="wl-pro__more" href="/pro">See full pricing and terms<Arrow /></a>
            </div>
          </details>
        </div>
      </div>
    </Band>
  );
}

/* ---------- last ask ---------- */
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
// with a profile, the main action is "Go to your Home". `communityPosts` are
// the most helpful public Community posts when available.
export default function WebLanding({ signedIn = false, hasProfile = false, onStartQuiz, onGoHome, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewCommunity, onViewHowItWorks, onSearch, communityPosts = [], heroBanner = null }) {
  const rest = useAfterHeroPaint();
  const home = Boolean(signedIn && hasProfile && onGoHome);
  const cta = home
    ? { label: 'Go to your Home', slide: 'Slide to go to your Home', go: onGoHome }
    : { label: 'Create your ecosystem', slide: 'Create your ecosystem', free: true, go: onStartQuiz };
  return (
    <div id="ay-landing" className="ed ed-home hm hm-uq wl">
      <Hero cta={cta} onSearch={onSearch} onViewHowItWorks={onViewHowItWorks} banner={home ? null : heroBanner} />
      <BrandBar onOpen={onViewWaitlist} />
      {/* Keep the approved hero. Everything underneath follows the quieter,
          picture-led website composition and reveals secondary detail on demand. */}
      <div className="wl-classic">
        <LandingV2 bodyOnly membershipSlot={<Pro />} onStartQuiz={home ? onGoHome : onStartQuiz} onViewDiscovery={onViewDiscovery} onOpenProduct={onOpenProduct} onViewArticles={onViewArticles} onViewArticle={onViewArticle} onViewAbout={onViewAbout} onViewWaitlist={onViewWaitlist} onViewCommunity={onViewCommunity} onViewHowItWorks={onViewHowItWorks} onSearch={onSearch} communityPosts={communityPosts} />
      </div>
      {rest && <FinalCta cta={cta} />}
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
    const go = () => { if (done) return; done = true; requestAnimationFrame(() => requestAnimationFrame(() => window.setTimeout(() => setReady(true), 0))); };
    const img = document.querySelector('.wl-rain img');
    if (img?.decode) img.decode().then(go, go); else go();
    const t = window.setTimeout(go, 1200);
    return () => { done = true; window.clearTimeout(t); };
  }, [ready]);
  return ready;
}
