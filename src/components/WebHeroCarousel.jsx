import { useEffect, useMemo, useRef, useState } from 'react';
import { TEAM_PHOTO, TEAM_CAPTION, getDailyFact } from '../data/welcomeSlides.js';
import './WebHeroCarousel.css';

// Website welcome carousel: us, what ayna does, the app, today's fact and
// what's new. Swipe, arrows, dots or keyboard. Pauses on hover.

const DURATION = 2500;

function TeamSlide() {
  return <figure className="whc-team">
    <img src={TEAM_PHOTO} alt="The ayna team together outdoors" draggable="false" />
    <figcaption>{TEAM_CAPTION}</figcaption>
  </figure>;
}

function AboutSlide({ onStartQuiz }) {
  return <>
    <span className="whc-kicker">What ayna does</span>
    <h2 className="whc-title">Health,<br />matched to you.</h2>
    <ul className="whc-tiles">
      <li className="tone-pink"><span className="whc-glyph is-eco" aria-hidden="true"><i /><i /><i /></span><b>Your Ecosystem</b></li>
      <li className="tone-butter"><span className="whc-glyph is-ring" aria-hidden="true" /><b>Your match</b></li>
      <li className="tone-mint"><span className="whc-glyph is-chat" aria-hidden="true" /><b>Ask ayna</b></li>
      <li className="tone-paper"><span className="whc-glyph is-deck" aria-hidden="true"><i /><i /></span><b>Discover</b></li>
    </ul>
    <button type="button" className="whc-cta" onClick={onStartQuiz}>Take the quiz →</button>
  </>;
}

function AppSlide() {
  return <div className="whc-split">
    <div>
      <span className="whc-kicker">The app</span>
      <h2 className="whc-title">ayna, in<br />your pocket.</h2>
      <a className="whc-cta" href="/mobile-preview">Try the app →</a>
    </div>
    <div className="whc-phone" aria-hidden="true">
      <span className="whc-phone__notch" />
      <span className="whc-phone__mark">ayna</span>
      <span className="whc-phone__row is-dark"><i /><b /></span>
      <span className="whc-phone__row"><i className="is-mint" /><b /></span>
      <span className="whc-phone__row"><i className="is-peri" /><b /></span>
      <span className="whc-phone__bar" />
    </div>
  </div>;
}

function FactSlide({ fact, onViewArticles }) {
  return <>
    <span className="whc-kicker">Daily ayna fact</span>
    <div className="whc-fact">
      <strong>{fact.term}</strong>
      <p>{fact.text}</p>
    </div>
    <button type="button" className="whc-cta" onClick={onViewArticles}>Read more in the Library →</button>
  </>;
}

function NewsSlide({ onViewCommunity }) {
  return <>
    <span className="whc-kicker is-new">New</span>
    <h2 className="whc-title">Now introducing<br />ayna Community.</h2>
    <div className="whc-posts" aria-hidden="true">
      <span className="whc-post"><i className="is-pink" /><b /><b className="is-short" /></span>
      <span className="whc-post is-two"><i className="is-mint" /><b /><b className="is-short" /></span>
    </div>
    <button type="button" className="whc-cta" onClick={onViewCommunity}>See Community →</button>
  </>;
}

export default function WebHeroCarousel({ onStartQuiz, onViewArticles, onViewCommunity }) {
  const fact = useMemo(() => getDailyFact(), []);
  const slides = useMemo(() => [
    { key: 'team', label: 'Meet ayna', tone: 'peri' },
    { key: 'about', label: 'What ayna does', tone: 'cream' },
    { key: 'app', label: 'The app', tone: 'butter' },
    ...(fact ? [{ key: 'fact', label: 'Daily ayna fact', tone: 'mint' }] : []),
    { key: 'news', label: 'Now introducing Community', tone: 'pink' },
  ], [fact]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [reduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const drag = useRef({ x: 0, active: false });
  const count = slides.length;
  const go = (step) => setIndex((i) => (i + step + count) % count);

  useEffect(() => {
    if (paused || hover || reduced) return undefined;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % count), DURATION);
    return () => window.clearTimeout(t);
  }, [index, paused, hover, reduced, count]);

  const onPointerDown = (e) => { if (!e.target.closest('button, a')) drag.current = { x: e.clientX, active: true }; };
  const onPointerUp = (e) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };
  const onKey = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };

  const render = (key) => {
    if (key === 'team') return <TeamSlide />;
    if (key === 'about') return <AboutSlide onStartQuiz={onStartQuiz} />;
    if (key === 'app') return <AppSlide />;
    if (key === 'fact') return <FactSlide fact={fact} onViewArticles={onViewArticles} />;
    return <NewsSlide onViewCommunity={onViewCommunity} />;
  };

  return <section
    className="ayna-landing-hero-photo whc"
    aria-roledescription="carousel"
    aria-label="Welcome to ayna"
    tabIndex={0}
    onKeyDown={onKey}
    onMouseEnter={() => setHover(true)}
    onMouseLeave={() => setHover(false)}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
  >
    <div className="whc-track" style={{ transform: `translateX(-${index * 100}%)` }}>
      {slides.map((s, i) => <div
        key={s.key}
        className={`whc-slide is-${s.key} tone-${s.tone}${i === index ? ' is-on' : ''}`}
        role="group"
        aria-roledescription="slide"
        aria-label={`${i + 1} of ${count}: ${s.label}`}
        aria-hidden={i !== index}
        inert={i !== index}
      >{render(s.key)}</div>)}
    </div>
    <div className="whc-controls">
      <div className="whc-dots">
        {slides.map((s, i) => <button key={s.key} type="button" aria-label={`Show ${s.label}`} aria-current={i === index} className={i === index ? 'is-on' : ''} onClick={() => setIndex(i)} />)}
      </div>
      <button type="button" className="whc-btn" aria-label="Previous slide" onClick={() => go(-1)}>←</button>
      <button type="button" className="whc-btn" aria-label="Next slide" onClick={() => go(1)}>→</button>
      {!reduced && <button type="button" className="whc-btn" aria-label={paused ? 'Play slides' : 'Pause slides'} onClick={() => setPaused((v) => !v)}>{paused ? '▶' : '❚❚'}</button>}
    </div>
  </section>;
}
