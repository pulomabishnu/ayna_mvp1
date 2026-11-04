import { useEffect, useRef, useState } from 'react';
import './how-it-works-demo.css';

/**
 * "How ayna works" (founder, Nov 3: "I still wouldn't understand, the video needs to be better,
 * bring conversions"). Research (NN/g instructional video + auto-forwarding, WCAG 2.2.2,
 * Perfit / Function Health): show the real result, keep it short, captions always on screen,
 * play once and stop on the matches, a pause button, and steps you can click.
 *
 * Every screen is full of real ayna content: real catalog products and photos, the match % and
 * the why line exactly as the engine gave them for this example (age 22, regular periods,
 * cramps + trouble sleeping, medicines not answered yet, Nov 3 2026), the app's own words for
 * a safety hold, and a MedlinePlus source. It is labelled as an example.
 */
const SCENES = [
  { k: 'ask', t: 'Pick what you want help with', d: 'Cramps, sleep, heavy periods and more.' },
  { k: 'safe', t: 'Answer 3 safety questions', d: 'Conditions, allergies and medicines, before any match.' },
  { k: 'match', t: 'See your matches', d: 'Each one shows a % and why it fits you.' },
  { k: 'chat', t: 'Ask anything', d: 'Answers show where they come from.' },
  { k: 'daily', t: 'Every morning, your rundown', d: 'A short check-in, and what goes with what you own.' },
];
const MS = [4500, 5000, 6500, 5000, 5500];

const MATCHES = [
  { id: 'p-viboos-heating-pad', name: 'VIBOOS Electric Heating Pad', price: '$12.99', pct: 87 },
  { id: 'p-portable-heating', name: 'Comfytemp Portable Heating Pad', price: '$30', pct: 87 },
  { id: 'p-thermacare', name: 'ThermaCare Menstrual HeatWraps', price: '', pct: 85 },
];
const CHIPS = ['Cramps or period pain', 'Trouble sleeping', 'Heavy periods', 'PMS symptoms', 'Bloating', 'Acne', 'Fatigue or low energy', 'Brain fog'];
const img = (id) => `/products/catalog/${id}.webp`;

const motionOff = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; }
};

function Ring({ pct, i = 0 }) {
  return <span className="hd-ring" style={{ '--p': pct, '--i': i }} aria-hidden="true"><b>{pct}%</b></span>;
}

function Screen({ k }) {
  if (k === 'ask') return (
    <div className="hd-scr">
      <p className="hd-meta">Question 3</p>
      <p className="hd-q">What do you want help with?</p>
      <div className="hd-chips">
        {CHIPS.map((c, i) => <span key={c} className={i < 2 ? 'is-pick' : ''} style={{ '--i': i }}>{c}</span>)}
      </div>
      <span className="hd-next is-press">See my matches</span>
    </div>
  );
  if (k === 'match') return (
    <div className="hd-scr">
      <p className="hd-meta">Your matches</p>
      <p className="hd-q">For your period cramps</p>
      <ul className="hd-list">
        {MATCHES.map((m, i) => (
          <li key={m.id} style={{ '--i': i }}>
            <span className="hd-tile"><img src={img(m.id)} alt="" loading="lazy" /></span>
            <span className="hd-info"><b>{m.name}</b><small>Matches the period cramps you selected</small>{m.price && <em>{m.price}</em>}</span>
            <Ring pct={m.pct} i={i} />
          </li>
        ))}
      </ul>
      <p className="hd-foot">How well it fits what you told us. Not the chance it will work.</p>
    </div>
  );
  if (k === 'safe') return (
    <div className="hd-scr">
      <p className="hd-meta">Safety question 3 of 3</p>
      <p className="hd-q">Taking any medicines or supplements?</p>
      <div className="hd-chips">
        {['Yes', 'None', 'Not sure', 'Prefer not to answer'].map((c, i) => <span key={c} className={i === 1 ? 'is-pick is-first' : ''} style={{ '--i': i }}>{c}</span>)}
      </div>
      <span className="hd-src"><b>Why we ask</b>Some supplements don’t mix with some medicines. If one might not be safe for you, we hold it back.</span>
      <span className="hd-next is-press">See my matches</span>
    </div>
  );
  if (k === 'daily') return (
    <div className="hd-scr">
      <span className="hd-note-push"><b>ayna</b>Your ayna daily rundown is ready.<small>8:00 am · change it in Settings</small></span>
      <p className="hd-meta">Your daily rundown</p>
      <p className="hd-q">How did you sleep?</p>
      <span className="hd-sleep" aria-hidden="true"><small>Last night</small><span className="hd-wave">{[30, 70, 45, 90, 60, 35, 80, 50, 70, 40, 65, 55].map((h, i) => <i key={i} style={{ height: `${h}%`, '--i': i }} />)}</span><b>7h 40m</b></span>
      <span className="hd-dots" aria-hidden="true">{[1, 1, 0, 1, 1, 0, 0].map((on, i) => <i key={i} className={on ? 'is-on' : ''} style={{ '--i': i }} />)}<small>4 of 7 check-ins</small></span>
      <span className="hd-prod is-daily"><span className="hd-tile"><img src={img('p-saalt-cup-steamer')} alt="" loading="lazy" /></span><span className="hd-info"><small>Goes with your Saalt Menstrual Cup</small><b>Saalt Cup Steamer</b></span></span>
      <span className="hd-pair"><span className="hd-next">Add to my ecosystem</span><span className="hd-next is-ghost">Not for me</span></span>
    </div>
  );
  return (
    <div className="hd-scr">
      <p className="hd-meta">Ask ayna</p>
      <span className="hd-bub is-me">Does heat really help cramps?</span>
      <span className="hd-typing" aria-hidden="true"><i /><i /><i /></span>
      <span className="hd-bub">MedlinePlus lists heat on the lower belly as self-care for period cramps.</span>
      <span className="hd-src"><b>Source</b>MedlinePlus · medlineplus.gov</span>
      <span className="hd-prod"><span className="hd-tile"><img src={img('p-thermacare')} alt="" loading="lazy" /></span>ThermaCare HeatWraps<Ring pct={85} /></span>
      <span className="hd-ask">Ask a follow-up…</span>
    </div>
  );
}

export default function HowItWorksDemo({ onStart, startLabel = 'Get my free matches', onViewHowItWorks }) {
  const ref = useRef(null);
  const [still] = useState(motionOff);
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Plays through once, then stays on the matches (no endless loop).
  useEffect(() => {
    if (still || paused || done || !onScreen) return undefined;
    const t = window.setTimeout(() => {
      if (scene === SCENES.length - 1) { setScene(2); setDone(true); } else setScene((n) => n + 1);
    }, MS[scene]);
    return () => window.clearTimeout(t);
  }, [scene, still, paused, done, onScreen]);

  const playing = !still && !paused && !done && onScreen;
  const replay = () => { setDone(false); setPaused(false); setScene(0); };
  const cur = SCENES[scene];
  return (
    <section id="ay-demo" ref={ref} className={`hd${still ? ' is-still' : ''}`} aria-labelledby="hd-title">
      <div className="hd-in">
        <div className="hd-copy">
          <h2 id="hd-title" className="hd-title">How ayna works</h2>
          <p className="hd-sub">Answer a few quick questions. See what fits you, and why.</p>
          <ol className="hd-steps">
            {SCENES.map((s, i) => (
              <li key={s.k} className={!still && i === scene ? 'is-on' : ''}>
                <button type="button" onClick={() => { setScene(i); setPaused(true); }} aria-current={!still && i === scene ? 'step' : undefined}>
                  <span className="hd-n">{i + 1}</span>
                  <span><b>{s.t}</b>{(still || i === scene) && <small>{s.d}</small>}</span>
                </button>
                {playing && i === scene && <i className="hd-bar is-run" style={{ '--ms': `${MS[scene]}ms` }} key={`${scene}`} aria-hidden="true" />}
              </li>
            ))}
          </ol>
          <div className="hd-actions">
            {onStart && <button type="button" className="hd-start" onClick={onStart}>{startLabel}</button>}
            {onViewHowItWorks && <a className="hd-more" href="/how-it-works" onClick={(e) => { e.preventDefault(); onViewHowItWorks(); }}>How we match</a>}
          </div>
        </div>
        {still ? (
          <div className="hd-grid">
            {SCENES.map((s) => <figure key={s.k} className="hd-phone is-small"><div className="hd-screen"><Screen k={s.k} /></div><figcaption>{s.t}</figcaption></figure>)}
          </div>
        ) : (
          <div className="hd-stage">
            <div className="hd-phone" aria-hidden="true">
              <div className="hd-screen" key={scene}><Screen k={cur.k} /></div>
            </div>
            <p className="hd-cap" aria-live="polite"><b>{scene + 1}. {cur.t}.</b> {cur.d}</p>
            <div className="hd-ctrl">
              {done
                ? <button type="button" className="hd-pause" onClick={replay}>Replay</button>
                : <button type="button" className="hd-pause" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play the walkthrough' : 'Pause the walkthrough'}>{paused ? 'Play' : 'Pause'}</button>}
              <span className="hd-len">25 sec · example for cramps and trouble sleeping</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
