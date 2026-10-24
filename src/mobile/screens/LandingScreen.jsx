import RotatingProducts from '../components/RotatingProducts.jsx';
import { PARTNER_BRANDS } from '../../utils/partnerBrands';
import '../landing.css';
import { useState } from 'react';
import FinishQuizCard from '../../components/FinishQuizCard.jsx';
import { VALUE_POINTS } from '../data/onboardingFlow.js';
import '../../styles/onboarding.css';

// First run (UX spec section 3): welcome, then one screen on what ayna does,
// then set up or explore first. Accounts are made after setup, on the reveal.


// The feature reel (what the app does) on the website's hero parts: stamp,
// headline, a still brand row. One plain button starts the quiz (it used to
// be slide-to-start, a hidden gesture; anti-vibe guide 5d).
export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna, quizDraft = null, onResumeQuiz, onStartOverQuiz }) {
  const names = PARTNER_BRANDS.map((b) => b.name);
  const [valueOpen, setValueOpen] = useState(false);
  if (valueOpen) {
    return <main className="ay-land ay-ob-value" aria-labelledby="ay-ob-value-h">
      <button type="button" className="ay-ob-back" onClick={() => setValueOpen(false)} aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
      <h1 id="ay-ob-value-h">Here’s how ayna helps</h1>
      <ol className="ay-ob-value__list">
        {VALUE_POINTS.map(([t, d], i) => <li key={t}><span aria-hidden="true">{i + 1}</span><b>{t}</b><p>{d}</p></li>)}
      </ol>
      <div className="ay-ob-value__actions">
        <button type="button" className="ay-ob-primary" onClick={onStartQuiz}>Set up my ayna</button>
        <button type="button" className="ay-ob-quiet" onClick={onBrowse}>Explore first</button>
        <p>Short questions. Skip anything you like.</p>
      </div>
    </main>;
  }
  return <main className="ay-land">
    <section className="ay-land-hero" aria-labelledby="ay-land-title">
      <header className="ay-land-top">
        <span className="ay-land-mark">ayna</span>
        <button type="button" onClick={onAlreadyHaveAccount}>Sign in</button>
      </header>
      <div className="ay-land-reel">
        <div className="ay-cover-widget"><RotatingProducts /></div>
      </div>
      <div className="ay-land-copy">
        <div className="ay-land-stamp is-small" aria-hidden="true">
          <svg viewBox="0 0 200 200"><defs><path id="ay-land-stamp-path" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" /></defs>
            <text><textPath href="#ay-land-stamp-path" textLength="455" lengthAdjust="spacing">matched to you {'★'} matched to you {'★'}</textPath></text></svg>
          <span>you</span>
        </div>
        <h1 id="ay-land-title">Find what fits your body</h1>
        <p>Women’s health products matched to you, with the evidence beside each one.</p>
      </div>
    </section>
    <div className="ay-land-ticker" aria-hidden="true">
      <div className="ay-land-ticker-track">
        {[0, 1].map((k) => <ul key={k}>{names.map((n) => <li key={n}>{n}<span>{'★'}</span></li>)}</ul>)}
      </div>
    </div>
    <section className="ay-land-actions" aria-label="Start ayna">
      {quizDraft && onResumeQuiz
        ? <FinishQuizCard progress={quizDraft} onContinue={onResumeQuiz} onStartOver={onStartOverQuiz} className="ay-land-finish" />
        : <>
          <button type="button" className="ay-land-start" onClick={() => setValueOpen(true)}>Get started<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
          <p className="ay-land-start-note">A few short questions, then your Today.</p>
        </>}
      <div className="ay-land-links"><button type="button" onClick={onBrowse}>Explore first</button><button type="button" onClick={onAboutAyna}>About us</button></div>
    </section>
  </main>;
}
