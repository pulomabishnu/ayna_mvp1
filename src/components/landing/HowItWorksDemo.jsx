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

const MATCHES = [
  { id: 'p-viboos-heating-pad', name: 'VIBOOS Electric Heating Pad', price: '$12.99', pct: 87 },
  { id: 'p-portable-heating', name: 'Comfytemp Portable Heating Pad', price: '$30', pct: 87 },
  { id: 'p-thermacare', name: 'ThermaCare Menstrual HeatWraps', price: '', pct: 85 },
];
const CHIPS = ['Cramps or period pain', 'Trouble sleeping', 'Heavy periods', 'PMS symptoms', 'Bloating', 'Acne', 'Fatigue or low energy', 'Brain fog'];
const img = (id) => `/products/catalog/${id}.webp`;


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

const TRIO = [
  { k: 'ask', n: 1, t: 'Answer a few questions', d: 'What you want help with, then 3 safety questions.' },
  { k: 'match', n: 2, t: 'See your matches', d: 'Each one shows a % and why it fits you.' },
  { k: 'daily', n: 3, t: 'Come back each morning', d: 'A short check-in, and what goes with what you own.' },
];

/**
 * Nov 4 v6 (founder: "how ayna works still looks like shit", "too much pink"): her inspo is
 * three phones side by side, so that's what this is. Three steps you get at a glance, each
 * phone playing its screen once when the section scrolls into view. Butter page, espresso
 * phones, no list of steps. On a phone they sit in a row you can swipe.
 */
export default function HowItWorksDemo({ onStart, startLabel = 'Sign up free', onViewHowItWorks }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section id="ay-demo" ref={ref} className="hd hd--trio" aria-labelledby="hd-title">
      <div className="hd-trio">
        <header className="hd-trio__head">
          <h2 id="hd-title" className="hd-title">How ayna works</h2>
          <div className="hd-actions">
            {onStart && <button type="button" className="hd-start" onClick={onStart}>{startLabel}</button>}
            {onViewHowItWorks && <a className="hd-more" href="/how-it-works" onClick={(e) => { e.preventDefault(); onViewHowItWorks(); }}>How we match</a>}
          </div>
        </header>
        <ol className="hd-trio__list">
          {TRIO.map((s) => (
            <li key={s.k}>
              <div className="hd-phone" aria-hidden="true">
                <div className="hd-screen" key={seen ? 'on' : 'off'}>{seen ? <Screen k={s.k} /> : null}</div>
              </div>
              <p className="hd-trio__t"><span className="hd-n">{s.n}</span>{s.t}</p>
              <p className="hd-trio__d">{s.d}</p>
            </li>
          ))}
        </ol>
        <p className="hd-len">Example for period cramps. Real products from our catalog.</p>
      </div>
    </section>
  );
}
