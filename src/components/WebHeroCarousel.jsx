import { useEffect, useMemo, useRef, useState } from 'react';
import { getDailyFact } from '../data/welcomeSlides.js';
import { getSupabaseClient } from '../utils/supabaseClient';
import { listAnnouncements } from '../utils/community/announcementsStore';
import './WebHeroCarousel.css';

// Website welcome stories: the app, what ayna does, today's fact and
// what's new. (The team moved up the page into the landing's own founders
// moment, so there is no team slide here any more.) A big stage with a chapter list whose bars fill as each slide
// plays; the whole band takes the slide's colour. Swipe, arrows, chapter
// buttons or keyboard. Pauses on hover; no autoplay with reduced motion.

const DURATION = 2500;

function AboutSlide({ onStartQuiz }) {
  return <>
    <div className="whc-copy">
      <h2 className="whc-title">Health, matched to you.</h2>
      <button type="button" className="whc-cta" onClick={onStartQuiz}>Take the quiz</button>
    </div>
    <ul className="whc-art whc-tiles">
      <li className="tone-pink"><span className="whc-glyph is-eco" aria-hidden="true"><i /><i /><i /></span><b>Your Ecosystem</b></li>
      <li className="tone-butter"><span className="whc-glyph is-ring" aria-hidden="true" /><b>Your match</b></li>
      <li className="tone-peri"><span className="whc-glyph is-chat" aria-hidden="true" /><b>Ask ayna</b></li>
      <li className="tone-paper"><span className="whc-glyph is-deck" aria-hidden="true"><i /><i /></span><b>Discover</b></li>
    </ul>
  </>;
}

function AppSlide() {
  return <>
    <div className="whc-copy">
      <h2 className="whc-title">ayna, in your pocket.</h2>
      <a className="whc-cta" href="/mobile-preview">Try the app</a>
    </div>
    <div className="whc-art whc-phone" aria-hidden="true">
      <span className="whc-phone__notch" />
      <span className="whc-phone__mark">ayna</span>
      <span className="whc-phone__row is-dark"><i /><b /></span>
      <span className="whc-phone__row"><i className="is-mint" /><b /></span>
      <span className="whc-phone__row"><i className="is-peri" /><b /></span>
      <span className="whc-phone__row"><i /><b /></span>
      <span className="whc-phone__bar" />
    </div>
  </>;
}

function FactSlide({ fact, onViewArticles }) {
  return <>
    <div className="whc-copy">
      <p className="whc-note">Today on ayna</p>
      <h2 className="whc-title whc-title--term">{fact.term}</h2>
      <button type="button" className="whc-cta" onClick={onViewArticles}>Read more in the Library</button>
    </div>
    <div className="whc-art whc-fact"><p>{fact.text}</p><small className="whc-fact__src">From the ayna glossary. General information, not medical advice.</small></div>
  </>;
}

// Latest real announcement from the ayna team, when the announcements table
// exists and has a post. Any failure (no client, table not created yet,
// offline) quietly falls back to the Community launch slide.
function useLatestAnnouncement() {
  const [item, setItem] = useState(null);
  useEffect(() => {
    let live = true;
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;
    listAnnouncements(supabase, { limit: 1 })
      .then(({ rows }) => { const a = rows?.[0]; if (live && a?.title) setItem({ title: String(a.title).slice(0, 120) }); })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  return item;
}

function NewsSlide({ onViewCommunity, news }) {
  return <>
    <div className="whc-copy">
      {news && <p className="whc-note">ayna news</p>}
      <h2 className="whc-title">{news ? news.title : 'Now introducing ayna Community.'}</h2>
      <button type="button" className="whc-cta" onClick={onViewCommunity}>{news ? 'Read it in Community' : 'See Community'}</button>
    </div>
    <div className="whc-art whc-posts" aria-hidden="true">
      <span className="whc-post"><i className="is-pink" /><b /><b className="is-short" /></span>
      <span className="whc-post is-two"><i className="is-mint" /><b /><b className="is-short" /></span>
      <span className="whc-post is-three"><i className="is-butter" /><b /><b className="is-short" /></span>
    </div>
  </>;
}

export default function WebHeroCarousel({ onStartQuiz, onViewArticles, onViewCommunity }) {
  const fact = useMemo(() => getDailyFact(), []);
  const news = useLatestAnnouncement();
  const slides = useMemo(() => [
    { key: 'app', label: 'The app', tone: 'butter' },
    { key: 'about', label: 'What ayna does', tone: 'mint' },
    ...(fact ? [{ key: 'fact', label: 'Daily ayna fact', tone: 'cream' }] : []),
    { key: 'news', label: news ? 'ayna news' : 'New: ayna Community', tone: 'pink' },
  ], [fact, news]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [reduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const drag = useRef({ x: 0, active: false });
  const count = slides.length;
  const go = (step) => setIndex((i) => (i + step + count) % count);
  // Phones never auto-advance (a half-faded slide is hard to read); on desktop it only plays while in view.
  const [narrow] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 720px)').matches);
  const rootRef = useRef(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const playing = !paused && !hover && !reduced && !narrow && inView;
  const duration = DURATION;

  useEffect(() => {
    if (!playing) return undefined;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % count), duration);
    return () => window.clearTimeout(t);
  }, [index, playing, count, duration]);

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
    if (key === 'about') return <AboutSlide onStartQuiz={onStartQuiz} />;
    if (key === 'app') return <AppSlide />;
    if (key === 'fact') return <FactSlide fact={fact} onViewArticles={onViewArticles} />;
    return <NewsSlide onViewCommunity={onViewCommunity} news={news} />;
  };

  return <section
    ref={rootRef}
    className={`whc whc--stage is-tone-${slides[index].tone}`}
    aria-roledescription="carousel"
    aria-label="Welcome to ayna"
    onMouseEnter={() => setHover(true)}
    onMouseLeave={() => setHover(false)}
  >
    <div className="whc-inner mockup-page">
      <div
        className="whc-stage"
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div className="whc-track">
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
      </div>
      <div className="whc-side">
        <p className="whc-now" aria-hidden="true">{slides[index].label}</p>
        <ol className="whc-chapters">
          {slides.map((s, i) => <li key={s.key}>
            <button type="button" aria-label={`Show ${s.label}`} aria-current={i === index} className={i === index ? 'is-on' : ''} onClick={() => setIndex(i)}>
              <span className="whc-chapters__label">{s.label}</span>
              <span className="whc-chapters__bar" aria-hidden="true">
                <i
                  key={i === index && playing ? 'run' : 'still'}
                  className={i === index ? (playing ? 'is-running' : 'is-full') : (i < index ? 'is-done' : '')}
                  style={i === index && playing ? { animationDuration: `${duration}ms` } : undefined}
                />
              </span>
            </button>
          </li>)}
        </ol>
        <div className="whc-controls">
          <button type="button" className="whc-btn" aria-label="Previous slide" onClick={() => go(-1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
          <button type="button" className="whc-btn" aria-label="Next slide" onClick={() => go(1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button>
          {!reduced && <button type="button" className="whc-btn" aria-label={paused ? 'Play slides' : 'Pause slides'} onClick={() => setPaused((v) => !v)}>
            {paused ? <svg viewBox="0 0 24 24" aria-hidden="true"><path className="is-fill" d="M8 5l11 7-11 7z" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v14M15 5v14" /></svg>}
          </button>}
        </div>
      </div>
    </div>
  </section>;
}
