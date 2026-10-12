import { useEffect, useRef, useState } from 'react';
import { getDailyFact } from '../data/welcomeSlides.js';

// Welcome-page feature reel. Four "now playing"-style cards, one per thing
// ayna does, each a full colour block with one big graphic. Numbers here are
// illustrative UI (labelled as a preview), not anyone's real data.
const FEATURES = [
  { key: 'ecosystem', label: 'Your Ecosystem', tone: 'butter' },
  { key: 'match', label: 'Your match', tone: 'pink' },
  { key: 'ask', label: 'Ask ayna', tone: 'mint' },
  { key: 'discover', label: 'Discover', tone: 'peri' },
  { key: 'fact', label: 'Daily ayna fact', tone: 'mint' },
  { key: 'news', label: 'New', tone: 'pink' },
];

function EcosystemArt() {
  return <div className="ay-reel-eco">
    {[['Period', 'pink'], ['Pelvic care', 'mint'], ['Sleep', 'peri']].map(([name, tone], i) => (
      <div key={name} className="ay-reel-track" style={{ '--i': i }}>
        <span className={`ay-reel-cover is-${tone}`} />
        <strong>{name}</strong>
        <span className="ay-reel-eq" aria-hidden="true"><i /><i /><i /></span>
      </div>
    ))}
  </div>;
}

function MatchArt() {
  return <div className="ay-reel-match">
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle className="edge" cx="60" cy="60" r="48" />
      <circle className="track" cx="60" cy="60" r="48" />
      <circle className="fill" cx="60" cy="60" r="48" />
    </svg>
    <div className="ay-reel-score"><strong>86</strong><span>% match</span></div>
    <div className="ay-reel-tags"><span>Fit</span><span>Evidence</span><span>Reviews</span></div>
  </div>;
}

function AskArt() {
  return <div className="ay-reel-ask">
    <p className="q">What helps with cramps?</p>
    <p className="a"><span className="ay-reel-dots" aria-hidden="true"><i /><i /><i /></span><span className="txt">Here’s what fits your profile, and why.</span></p>
  </div>;
}

function DiscoverArt() {
  return <div className="ay-reel-deck">
    <span className="c1" /><span className="c2" /><span className="c3"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16l-6-4-6 4V4Z" /></svg></span>
  </div>;
}

function FactArt() {
  const fact = getDailyFact();
  if (!fact) return null;
  return <div className="ay-reel-fact"><strong>{fact.term}</strong><p>{fact.text}</p></div>;
}

function NewsArt() {
  return <div className="ay-reel-news">
    <strong>Now introducing<br />ayna Community.</strong>
    <span className="ay-reel-post"><i /><b /><b className="is-short" /></span>
  </div>;
}

const ART = { fact: FactArt, news: NewsArt, ecosystem: EcosystemArt, match: MatchArt, ask: AskArt, discover: DiscoverArt };

export default function RotatingProducts() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const dur = FEATURES[index].key === 'fact' ? 5500 : 3200;
  useEffect(() => {
    if (paused || reducedMotion) return undefined;
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % FEATURES.length), dur);
    return () => window.clearTimeout(timer);
  }, [index, dur, paused, reducedMotion]);
  const feature = FEATURES[index];
  const count = FEATURES.length;
  const go = (step) => setIndex((value) => (value + step + count) % count);
  const start = useRef({ x: 0, active: false, swiped: false });
  const onPointerDown = (e) => { start.current = { x: e.clientX, active: true, swiped: false }; };
  const onPointerUp = (e) => {
    if (!start.current.active) return;
    start.current.active = false;
    const dx = e.clientX - start.current.x;
    if (Math.abs(dx) > 40) { start.current.swiped = true; go(dx < 0 ? 1 : -1); }
  };
  const Art = ART[feature.key];

  return <div className={`ay-reel is-${feature.tone}`} aria-label="ayna features preview" aria-live="off" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
    <div className="ay-reel-head"><span>{feature.label}</span><span>{String(index + 1).padStart(2, '0')}/{String(count).padStart(2, '0')}</span></div>
    <button className="ay-reel-next" type="button" aria-label="Show next feature" onClick={() => { if (start.current.swiped) { start.current.swiped = false; return; } go(1); }} />
    <div className="ay-reel-stage" key={feature.key}><Art /></div>
    <div className="ay-reel-foot">
      <div className="ay-reel-progress" aria-hidden="true">{FEATURES.map((item, step) => <i key={item.key} className={step < index ? 'is-done' : step === index ? 'is-now' : ''} style={step === index && !paused && !reducedMotion ? { '--dur': `${dur}ms` } : undefined} />)}</div>
      {!reducedMotion && <button className="ay-reel-pause" type="button" aria-label={paused ? 'Play features' : 'Pause features'} onClick={() => setPaused((value) => !value)}>
        {paused ? <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> : <svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" /></svg>}
      </button>}
    </div>
  </div>;
}
