import React, { useEffect, useState } from 'react';
import { ReadsCommunity, Founders } from '../LandingV2.jsx';
import LandingStory from './LandingStory.jsx';
import { useProStatus } from '../../pro/useProStatus.js';
import { isPlainLeftClick } from '../../utils/productRoute';
import '../../styles/editorial.css';
import '../../styles/home.css';
import '../../styles/loop-a-landing.css';
import '../../styles/uq-landing.css';
import { ScallopEdge } from '../ui/ay';
import SlideToStart from '../ui/SlideToStart.jsx';
import BrandStrip from '../ui/ay/BrandStrip.jsx';
import { Rain, HeroSearch, BrandBar } from './kit.jsx';
import './web-landing.css';
import './landing-polish.css';
import './landing-research-pass.css';
import './landing-final-audit.css';

/* Website landing: preserve the approved rain hero and brand strip. Below it,
 * one product story with ayna Pro woven in (LandingStory.jsx), then Reads and
 * Community, the founders and one closing action. */

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
          <h1 id="hm-hero-title" className="wl-title">Women’s health, <span>made for you.</span></h1>
          <p className="wl-one">Tell ayna what’s going on. Get products, reads and care matched to you, with the why behind each one.</p>
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

/* ---------- last ask ---------- */
function FinalCta({ cta }) {
  return (
    <section className="wlx-end" aria-labelledby="wlx-end-h">
      <BrandStrip />
      <div className="hm-wrap wlx-end__in">
        <div className="wlx-end__copy">
          <h2 id="wlx-end-h" className="wlx-end__h">Find what fits <span>your body.</span></h2>
          <p className="wlx-end__description">{cta.free ? 'A few questions. Options matched to you. A place to make them your own.' : 'Your matches, saved favorites and routines, all together.'}</p>
        </div>
        <SlideToStart className="wlx-end__sts" size="lg" label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="butter" hint={cta.free ? 'Start free. No purchase needed.' : null} />
      </div>
    </section>
  );
}

/* ---------- page ---------- */
// One page for everyone (the ayna logo opens it signed in or out). Signed in
// with a profile, the main action is "Go to your Home". `communityPosts` are
// the most helpful public Community posts when available.
export default function WebLanding({
  signedIn = false, userId = null, hasProfile = false, quizResults = null, healthProfile = null, matchOpts, personalPicks = null,
  onStartQuiz, onGoHome, onLogIn, onAsk, onOpenHealth, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewCommunity, onViewHowItWorks, onSearch,
  communityPosts = [], heroBanner = null,
}) {
  const rest = useAfterHeroPaint();
  const { active: pro, offerOpen } = useProStatus(signedIn ? userId : null);
  const home = Boolean(signedIn && hasProfile && onGoHome);
  const cta = home
    ? { label: 'Go to your Home', slide: 'Slide to go to your Home', go: onGoHome }
    : { label: 'Create your ecosystem', slide: 'Create your ecosystem', free: true, go: onStartQuiz };
  return (
    <div id="ay-landing" className="ed ed-home hm hm-uq wl">
      <Hero cta={cta} onSearch={onSearch} onViewHowItWorks={onViewHowItWorks} banner={home ? null : heroBanner} />
      <BrandBar onOpen={onViewWaitlist} />
      {/* The approved hero stays. Underneath, one product story (LandingStory):
          discover, matched to you, the why, health data in context (Pro), Ask,
          Free vs Pro; then Reads and Community, the founders and one last action. */}
      <div className="wl-classic">
          <LandingStory
            signedIn={signedIn} quizResults={hasProfile ? quizResults : null} healthProfile={healthProfile} matchOpts={matchOpts} personalPicks={personalPicks}
            pro={pro} offerOpen={offerOpen}
            onSearch={onSearch} onStartQuiz={home ? onGoHome : onStartQuiz} onLogIn={onLogIn} onGoHome={onGoHome} onOpenProduct={onOpenProduct}
            onViewDiscovery={onViewDiscovery} onViewHowItWorks={onViewHowItWorks} onAsk={onAsk} onOpenHealth={onOpenHealth}
          />
          <ReadsCommunity calm onViewArticle={onViewArticle} onViewArticles={onViewArticles} onViewCommunity={onViewCommunity} posts={communityPosts} />
          <Founders onViewAbout={onViewAbout} />
      </div>
      {rest && <FinalCta cta={cta} />}
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
