import { useEffect, useRef, useState } from 'react';
import './how-it-works-demo.css';

/**
 * "Watch how it works" (founder, Nov 3: add an explainer video). A 24-second
 * animated walkthrough drawn in code, not a video file: four scenes of what
 * ayna does, in the app's own colours. It plays only while on screen, has a
 * pause button, and shows the four steps still for anyone who asks for
 * reduced motion. The words describe what the product does; the products in
 * it are generic (no brand, no claim).
 */
const SCENES = [
  { k: 'ask', step: '1', t: 'Tell us how you feel', d: 'Answer 4 quick questions.' },
  { k: 'match', step: '2', t: 'See your matches', d: 'Each one says why it fits you.' },
  { k: 'safe', step: '3', t: 'Safe first', d: 'We check your medicines and allergies before you take anything.' },
  { k: 'chat', step: '4', t: 'Ask anything', d: 'Get answers, and see where they come from.' },
];
const SCENE_MS = 6000;

const motionOff = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; }
};

function Screen({ k }) {
  if (k === 'ask') return (
    <div className="hd-scr hd-scr--ask">
      <p className="hd-q">How do you feel?</p>
      <div className="hd-chips">
        {['Cramps or period pain', 'Trouble sleeping', 'Bloating', 'Hot flashes'].map((c, i) => <span key={c} className={i === 0 ? 'is-pick' : ''} style={{ '--i': i }}>{c}</span>)}
      </div>
      <span className="hd-next">Next</span>
      <span className="hd-tap" aria-hidden="true" />
    </div>
  );
  if (k === 'match') return (
    <div className="hd-scr hd-scr--match">
      <p className="hd-q">Your matches</p>
      {[['Heat patch', 'Strong fit', 'Made for period cramps'], ['Cramp balm', 'Good fit', 'Helps cramps. Nothing to swallow.']].map(([n, f, why], i) => (
        <div key={n} className="hd-card" style={{ '--i': i }}>
          <i className="hd-card__img" />
          <span><b>{n}</b><em>{f}</em><small>{why}</small></span>
        </div>
      ))}
    </div>
  );
  if (k === 'safe') return (
    <div className="hd-scr hd-scr--safe">
      <p className="hd-q">Safe first</p>
      <div className="hd-hold">
        <b>Supplement for sleep</b>
        <small>Tell us your medicines first.</small>
        <span className="hd-hold__btn">Answer</span>
      </div>
      <div className="hd-shield" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.4 3 8.4 7 10 4-1.6 7-5.6 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg></div>
    </div>
  );
  return (
    <div className="hd-scr hd-scr--chat">
      <p className="hd-q">Ask ayna</p>
      <span className="hd-bub is-me">Is a cup or a disc better for a heavy flow?</span>
      <span className="hd-dots"><i /><i /><i /></span>
      <span className="hd-bub">Here&rsquo;s what the research says.</span>
    </div>
  );
}

export default function HowItWorksDemo({ onStart, startLabel = 'Sign up free', onViewHowItWorks }) {
  const ref = useRef(null);
  const [still] = useState(motionOff);
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (still || paused || !onScreen) return undefined;
    const t = window.setTimeout(() => setScene((n) => (n + 1) % SCENES.length), SCENE_MS);
    return () => window.clearTimeout(t);
  }, [scene, still, paused, onScreen]);

  const playing = !still && !paused && onScreen;
  return (
    <section id="ay-demo" ref={ref} className={`hd${still ? ' is-still' : ''}`} aria-labelledby="hd-title">
      <div className="hd-in">
        <div className="hd-copy">
          <p className="hd-kicker">It takes about a minute</p>
          <h2 id="hd-title" className="hd-title">How ayna works</h2>
          <ol className="hd-steps">
            {SCENES.map((s, i) => (
              <li key={s.k} className={!still && i === scene ? 'is-on' : ''}>
                <button type="button" onClick={() => { setScene(i); setPaused(true); }} aria-current={!still && i === scene ? 'step' : undefined}>
                  <span className="hd-n">{s.step}</span>
                  <span><b>{s.t}</b><small>{s.d}</small></span>
                </button>
                {!still && i === scene && <i className={`hd-bar${playing ? ' is-run' : ''}`} style={{ '--ms': `${SCENE_MS}ms` }} key={`${scene}-${paused}-${onScreen}`} aria-hidden="true" />}
              </li>
            ))}
          </ol>
          <div className="hd-actions">
            {onStart && <button type="button" className="hd-start" onClick={onStart}>{startLabel}</button>}
            {onViewHowItWorks && <a className="hd-more" href="/how-it-works" onClick={(e) => { e.preventDefault(); onViewHowItWorks(); }}>How we match</a>}
          </div>
        </div>
        {!still && (
          <div className="hd-stage">
            <div className="hd-phone" aria-hidden="true">
              <span className="hd-notch" />
              <div className="hd-screen" key={scene}><Screen k={SCENES[scene].k} /></div>
            </div>
            <button type="button" className="hd-pause" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play the walkthrough' : 'Pause the walkthrough'}>
              {paused ? <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5Z" /></svg> : <svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
