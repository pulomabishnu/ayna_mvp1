import React, { useEffect, useRef, useState } from 'react';
import { Picks, Proof, ReadsAndCommunity, Founders, ProAndEnd, useRiseOnView } from './LandingBody.jsx';
import MedicalNote from '../MedicalNote.jsx';
import '../../styles/editorial.css';
import '../../styles/home.css';
import '../../styles/loop-a-landing.css';
import '../../styles/uq-landing.css';
import { ScallopEdge } from '../ui/ay';
import SlideToStart from '../ui/SlideToStart.jsx';
import { Rain, HeroSearch, BrandBar } from './kit.jsx';
import { useProStatus } from '../../pro/useProStatus.js';
import './web-landing.css';
import HowItWorksDemo from './HowItWorksDemo.jsx';
import { Problem, Testimonials, Faq, CtaNote } from './LandingStory.jsx';
import './landing-story.css';
import { wideRainCols } from './rainData.js';
import { trackLandingCta } from '../../utils/funnelEvents.js';
import { countJourneyStep } from '../../utils/journeyStep.js';

/* Anonymous daily count for a landing button (journeyStep.js), then its action.
   Keeps a missing handler missing, so optional links still hide. */
const tap = (step, fn) => (typeof fn === 'function' ? (...a) => { countJourneyStep(step); return fn(...a); } : fn);

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
   title with "your body." in pink, one line on what ayna connects, the search and Slide to start (the welcome
   tip's anchor). How we match is in the walkthrough below. The brown and pink bar runs under it. */
function Hero({ cta, onSearch, banner = null, draftLine = null }) {
  // A different mix of products on every visit (founder, Nov 9: "why is it the same products").
  const [rain] = useState(() => wideRainCols());
  return (
    <section className="wl-hero" aria-labelledby="hm-hero-title">
      <div className="wl-hero__band">
        <Rain cols={4} layout={rain} onInk className="wl-rain" />
        <div className="wl-hero__in">
          {/* One promise on the website and the app (landing audit 4 and 9). */}
          <h1 id="hm-hero-title" className="wl-title">Women’s health products, <span>matched to you.</span></h1>
          <p className="wl-one">Answer a few questions. See what fits your body, and why.</p>
          <SlideToStart className="wl-sts" tour="landing-start" size="lg" hint={null} label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="butter" />
          {draftLine || (!/Home/.test(cta.label) && <CtaNote className="is-light wl-ctanote" />)}
          {/* Nov 9 (founder): the tester quote lives in its own section below, not under the button. */}
          <HeroSearch onSearch={onSearch} className="wl-search" />
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
export default function WebLanding({ signedIn = false, userId = null, hasProfile = false, onAsk, personalPicks = null, onStartQuiz, onGoHome, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewCommunity, onViewHowItWorks, onSearch, communityPosts = [], heroBanner = null, quizDraft = null, onResumeQuiz = null, onStartQuizOver = null }) {
  const rest = useAfterHeroPaint();
  const pageRef = useRef(null);
  useRiseOnView(pageRef, [rest]);
  const { active: pro, offerOpen } = useProStatus(signedIn ? userId : null);
  const home = Boolean(signedIn && hasProfile && onGoHome);
  const cta = home
    ? { label: 'Go to your Home', slide: 'Slide to go to your Home', go: tap('cta_go_home', onGoHome) }
    // Founder, Nov 4: a quiz already started merges into the one slider (no separate "Finish your quiz" box).
    : quizDraft && onResumeQuiz
      ? { label: 'Finish your free quiz', slide: 'Slide to finish your free quiz', go: () => { countJourneyStep('cta_finish_quiz'); trackLandingCta('finish_quiz', 'web', 'Finish your free quiz'); onResumeQuiz(); } }
      // Nov 12 (founder delegated the label): the button says what happens next, the same words as
      // the app. The event name stays sign_up_free so the funnel numbers keep one series.
      : { label: 'Take the 1-minute quiz', slide: 'Take the 1-minute quiz', go: () => { trackLandingCta('sign_up_free', 'web', 'Take the 1-minute quiz'); onStartQuiz?.(); } };
  // The main button ("Take the 1-minute quiz") sits in five places; each is counted as its own step (cta_signup_<place>).
  const signUp = !home && !(quizDraft && onResumeQuiz);
  const ctaAt = (place) => (signUp ? { ...cta, go: () => { countJourneyStep(`cta_signup_${place}`); cta.go(); } } : cta);
  const draftLine = !home && quizDraft && onResumeQuiz ? (
    <p className="wl-draft">
      {quizDraft.requiredDone ? 'Your answers are saved.' : `Question ${quizDraft.index} of ${quizDraft.total}, saved.`}
      {onStartQuizOver && <> <button type="button" className="wl-draft__over" onClick={tap('cta_start_over', onStartQuizOver)}>Start over</button></>}
    </p>
  ) : null;
  return (
    <div id="ay-landing" className="ed ed-home hm hm-uq wl" ref={pageRef}>
      <Hero cta={ctaAt('hero')} onSearch={tap('cta_search', onSearch)} banner={home || draftLine ? null : heroBanner} draftLine={draftLine} />
      <BrandBar onOpen={tap('cta_brands', onViewWaitlist)} />
      {/* Nov 6 (founder: high-converting order): the problem in her words, then how ayna solves it. */}
      <div className="lb lb-top">{!home && <Problem cta={ctaAt('problem')} />}</div>
      {/* Nov 4 (founder): the walkthrough on the iPhone, right under the hero. */}
      <HowItWorksDemo onStart={ctaAt('demo').go} startLabel={cta.label} onViewHowItWorks={tap('cta_how_we_match', onViewHowItWorks)} />
      {/* Under the falling pictures: the original website's sections (founder, Oct 27 19:18: keep the
          raining pictures and widgets, and use the original website for the rest). */}
      {/* Below the hero (./LandingBody.jsx): one calm butter page, then one espresso close. */}
      <div className="lb">
        {/* Nov 4 (founder: "it's just boxes"): the feature bento is gone; the iPhone walkthrough above says it. */}
        <Picks tone="t-pink" onOpenProduct={tap('cta_product_card', onOpenProduct)} onViewDiscovery={tap('cta_see_all_products', onViewDiscovery)} picks={Array.isArray(personalPicks) ? personalPicks : null} />
        {rest && <>
          <Testimonials cta={home ? null : ctaAt('testimonials')} />
          <Proof tone="t-butter" onViewArticles={tap('cta_sources', onViewArticles)} />
          <ReadsAndCommunity tone="t-pink" onViewArticle={tap('cta_read_article', onViewArticle)} onViewArticles={tap('cta_library', onViewArticles)} onViewCommunity={tap('cta_community', onViewCommunity)} posts={communityPosts} />
          <Founders tone="t-butter" onViewAbout={tap('cta_meet_us', onViewAbout)} />
          <Faq />
        </>}
      </div>
      {rest && <ProAndEnd pro={pro === true} offerOpen={offerOpen} cta={ctaAt('end')} />}
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
