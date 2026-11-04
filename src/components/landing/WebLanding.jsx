import React, { useEffect, useRef, useState } from 'react';
import { Picks, Proof, ReadsAndCommunity, Founders, ProAndEnd, useRiseOnView } from './LandingBody.jsx';
import MedicalNote from '../MedicalNote.jsx';
import { isPlainLeftClick } from '../../utils/productRoute';
import '../../styles/editorial.css';
import '../../styles/home.css';
import '../../styles/loop-a-landing.css';
import '../../styles/uq-landing.css';
import { ScallopEdge } from '../ui/ay';
import { Rain, BrandBar } from './kit.jsx';
import { trackLandingCta } from '../../utils/funnelEvents.js';
import { useProStatus } from '../../pro/useProStatus.js';
import './web-landing.css';
import HowItWorksDemo from './HowItWorksDemo.jsx';

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
const Play = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M10 8.5v7l6-3.5-6-3.5Z" /></svg>);

/* ---------- 1. hero ----------
   Founder, Oct 27 11:32-11:36: the rain in the back, faded; the title in the
   middle, not huge; clean, but keep the fun and the brown and pink bar.
   The espresso band she liked, ending in the wavy edge, with the falling
   cut-outs as a faded layer on both sides (soft butter circles on espresso)
   and everything centred on top (13:01: big, not crowded): a big two-line
   title with "your body." in pink, one line on what ayna connects, the search, Slide to start (the welcome
   tip's anchor) and How we match. The brown and pink bar runs under it. */
function Hero({ cta, banner = null }) {
  return (
    <section className="wl-hero" aria-labelledby="hm-hero-title">
      <div className="wl-hero__band">
        <Rain cols={4} onInk className="wl-rain" />
        <div className="wl-hero__in">
          {/* One promise on the website and the app (landing audit 4 and 9). */}
          {/* Nov 4 (founder's conversion brief): headline = what we do, subheadline = the exact
              detail, the top 3 reasons right under it, one button "Sign up free" with what it
              costs under it, and the walkthrough one tap away. */}
          <h1 id="hm-hero-title" className="wl-title">Women’s health products, <span>matched to you.</span></h1>
          <p className="wl-one">Tell us your symptoms, life stage and medicines. See what fits you, and why.</p>
          <div className="wl-cta" data-tour="landing-start">
            <button type="button" className="wl-cta__btn" onClick={() => { trackLandingCta(cta.id, 'web', cta.label); cta.go?.(); }}>{cta.label}<Arrow /></button>
            <p className="wl-cta__note">{cta.note}</p>
          </div>
          <p className="wl-why">Safety checked first<i aria-hidden="true" />Brands can’t pay for a match<i aria-hidden="true" />Sources shown</p>
          <a className="wl-how" href="#ay-demo" onClick={(e) => { const el = document.getElementById('ay-demo'); if (!el || !isPlainLeftClick(e)) return; e.preventDefault(); trackLandingCta('watch_demo'); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><Play />Watch how it works</a>
          {banner && <div className="wl-banner">{banner}</div>}
        </div>
      </div>
      <ScallopEdge shape="wave" tone="ink" className="wl-edge" />
    </section>
  );
}


/* ---------- questions people ask (founder, Nov 4: use dropdowns so the page stays short) ---------- */
const FAQ = [
  ['Is ayna free?', 'Yes. Your matches, safety notes and sources are free. ayna Pro adds the health dashboard and connected apps like Apple Health and Oura.'],
  ['Can brands pay for a better match?', 'No. Paying never changes your match. Partner products are labelled “ayna partner” so you always know.'],
  ['Is this medical advice?', 'No. ayna shares information, not medical advice. If something sounds urgent, we point you to care before any product.'],
  ['What happens to my health info?', 'It’s used to make your matches. We don’t sell your personal health information.'],
];
function Faq({ onViewHowItWorks }) {
  return (
    <section className="lb-sec wl-faq" aria-labelledby="wl-faq-h">
      <div className="lb-wrap">
        <h2 id="wl-faq-h" className="lb-h2">Questions</h2>
        <div className="wl-faq__list">
          {FAQ.map(([q, a]) => (
            <details key={q} className="wl-faq__item">
              <summary>{q}<i aria-hidden="true" /></summary>
              <p>{a}</p>
            </details>
          ))}
          <details className="wl-faq__item">
            <summary>How does matching work?<i aria-hidden="true" /></summary>
            <p>We compare each product with your answers: what you want help with, your life stage, and your medicines and allergies. The % shows how well it fits what you told us, not the chance it will work. <a href="/how-it-works" onClick={(e) => { if (!onViewHowItWorks || !isPlainLeftClick(e)) return; e.preventDefault(); onViewHowItWorks(); }}>How we match</a></p>
          </details>
        </div>
      </div>
    </section>
  );
}

/* ---------- page ---------- */
// One page for everyone (the ayna logo opens it signed in or out). Signed in
// with a profile, the main action is "Go to your Home", the phrases step
// aside and the shop cards drop "See your match". `communityPosts` are the
// most helpful Powder Room posts (one is shown, in the Community half).
export default function WebLanding({ signedIn = false, userId = null, hasProfile = false, personalPicks = null, onStartQuiz, onGoHome, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewCommunity, onViewHowItWorks, communityPosts = [], heroBanner = null }) {
  const rest = useAfterHeroPaint();
  const pageRef = useRef(null);
  useRiseOnView(pageRef, [rest]);
  const { active: pro, offerOpen } = useProStatus(signedIn ? userId : null);
  const home = Boolean(signedIn && hasProfile && onGoHome);
  const cta = home
    ? { id: 'go_home', label: 'Go to your Home', slide: 'Slide to go to your Home', note: 'Your matches and rundown are waiting.', go: onGoHome }
    : { id: 'sign_up_free', label: 'Sign up free', slide: 'Slide to sign up free', note: 'Free. No card. About 1 minute.', go: onStartQuiz };
  return (
    <div id="ay-landing" className="ed ed-home hm hm-uq wl" ref={pageRef}>
      <Hero cta={cta} banner={home ? null : heroBanner} />
      <BrandBar onOpen={onViewWaitlist} />
      {/* Nov 4 (founder: keep the walkthrough, make it more informative). */}
      {!home && <HowItWorksDemo onStart={() => { trackLandingCta(`${cta.id}_demo`, 'web', cta.label); cta.go?.(); }} startLabel={cta.label} onViewHowItWorks={onViewHowItWorks} />}
      {/* Under the falling pictures: the original website's sections (founder, Oct 27 19:18: keep the
          raining pictures and widgets, and use the original website for the rest). */}
      {/* Below the hero (./LandingBody.jsx): one calm butter page, then one espresso close. */}
      <div className="lb">
        {/* Nov 4 (founder: simpler, less to look at): the "What you can do" tiles are gone; the walkthrough above shows the same things. */}
        <Picks onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} picks={Array.isArray(personalPicks) ? personalPicks : null} />
        {rest && <>
          <Proof onViewArticles={onViewArticles} />
          <ReadsAndCommunity onViewArticle={onViewArticle} onViewArticles={onViewArticles} onViewCommunity={onViewCommunity} posts={communityPosts} />
          <Founders onViewAbout={onViewAbout} />
          <Faq onViewHowItWorks={onViewHowItWorks} />
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
