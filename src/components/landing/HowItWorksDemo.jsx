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
// Nov 4 (founder: "take a quiz, get matched, shop"). Three steps, verb first, one outcome
// each (the pattern Hims, Prose and Function use). Safety is part of the quiz, not a step.
const SCENES = [
  { k: 'ask', step: '1', t: 'Take the quiz', d: 'What you want help with, your life stage and your medicines. About a minute.' },
  { k: 'match', step: '2', t: 'Get matched', d: 'Products that fit you, each with a % and the reason why. Safety checked first.' },
  { k: 'shop', step: '3', t: 'Shop what fits', d: 'Compare ratings, prices and sources, then buy from the store. Brands can’t pay for a better match.' },
];
const SCENE_MS = 6000;
const img = (id) => `/products/catalog/${id}.webp`;

const motionOff = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; }
};

/* Every screen uses real ayna content: catalog products and photos, the match % and the
   why line as the engine gave them for this example (cramps, age 22, regular periods), the
   app's own safety words and a MedlinePlus source. Labelled as an example on the page. */
function Screen({ k }) {
  if (k === 'ask') return (
    <div className="hd-scr hd-scr--ask">
      <p className="hd-meta">Question 3</p>
      <p className="hd-q">What do you want help with?</p>
      <div className="hd-chips">
        {['Cramps or period pain', 'Trouble sleeping', 'Heavy periods', 'PMS symptoms', 'Bloating', 'Acne', 'Brain fog', 'Low mood'].map((c, i) => <span key={c} className={i === 0 || i === 1 ? 'is-pick' : ''} style={{ '--i': i }}>{c}</span>)}
      </div>
      <p className="hd-small">Pick all that fit. Each one gets its own matches.</p>
      <span className="hd-next">Next</span>
      <span className="hd-tap" aria-hidden="true" />
    </div>
  );
  if (k === 'match') return (
    <div className="hd-scr hd-scr--match">
      <p className="hd-meta">Your matches</p>
      <p className="hd-q">For your period cramps</p>
      {[['p-viboos-heating-pad', 'VIBOOS Electric Heating Pad', 87, '$12.99'], ['p-portable-heating', 'Comfytemp Portable Heating Pad', 87, '$30'], ['p-thermacare', 'ThermaCare Menstrual HeatWraps', 85, '']].map(([id, n, pct, price], i) => (
        <div key={id} className="hd-card" style={{ '--i': i }}>
          <span className="hd-card__img"><img src={img(id)} alt="" loading="lazy" /></span>
          <span><b>{n}</b><em>{pct}% match</em><small>Matches the period cramps you selected{price ? ` · ${price}` : ''}</small></span>
        </div>
      ))}
      <p className="hd-small">The % is how well it fits what you told us, not the chance it will work.</p>
    </div>
  );
  return (
    <div className="hd-scr hd-scr--shop">
      <p className="hd-meta">Shop · Cramp relief</p>
      <div className="hd-pdp" style={{ '--i': 0 }}>
        <span className="hd-pdp__img"><img src={img('p-viboos-heating-pad')} alt="" loading="lazy" /></span>
        <b>VIBOOS Electric Heating Pad</b>
        <span className="hd-pdp__row"><em>87% match</em><small>Matches the period cramps you selected</small></span>
      </div>
      <ul className="hd-facts">
        <li style={{ '--i': 1 }}><b>4.4 / 5</b> on Amazon, about 21,900 ratings</li>
        <li style={{ '--i': 2 }}><b>Evidence</b> Heat for period cramps: 2026 review</li>
        <li style={{ '--i': 3 }}><b>Safety</b> Don’t use it while sleeping</li>
      </ul>
      <span className="hd-next">Buy at Amazon · $12.99</span>
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
          <p className="hd-kicker">Free · example for period cramps</p>
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
        <div className="hd-stage">
            <div className="hd-phone" aria-hidden="true">
              <span className="hd-notch" />
              <div className="hd-screen" key={scene}><Screen k={SCENES[scene].k} /></div>
            </div>
            {!still && <button type="button" className="hd-pause" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play the walkthrough' : 'Pause the walkthrough'}>
              {paused ? <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5Z" /></svg> : <svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>}
            </button>}
        </div>
      </div>
    </section>
  );
}
