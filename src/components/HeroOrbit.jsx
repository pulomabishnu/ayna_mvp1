import React from 'react';
import './HeroOrbit.css';

// The logged-out hero's focal point: "you" in the middle, areas of care
// slowly orbiting. Hover pauses it; each bubble opens that part of Shop.
const AREAS = [
  { label: 'Period', tone: 'pink' },
  { label: 'Hormones', tone: 'butter' },
  { label: 'Pelvic floor', tone: 'mint' },
  { label: 'Sleep', tone: 'paper' },
  { label: 'Intimacy', tone: 'pink' },
  { label: 'Postpartum', tone: 'mint' },
];

const TONES = ['pink', 'butter', 'mint', 'paper', 'pink', 'mint'];

export default function HeroOrbit({ onPick, areas = null, centre = 'you', hint = 'your ecosystem', addLabel = null, onAdd }) {
  const list = (areas && areas.length ? areas.map((a, i) => ({ tone: TONES[i % TONES.length], ...a })) : AREAS);
  const seats = addLabel ? [...list, { label: addLabel, tone: 'add', add: true }] : list;
  return (
    <div className="hero-orbit" aria-label="Areas of care">
      <div className="hero-orbit__ring hero-orbit__ring--outer" aria-hidden="true" />
      <div className="hero-orbit__ring hero-orbit__ring--inner" aria-hidden="true" />
      <div className="hero-orbit__centre">
        <span className="hero-orbit__you">{centre}</span>
        {hint && <span className="hero-orbit__hint">{hint}</span>}
      </div>
      <div className="hero-orbit__spin">
        {seats.map((a, i) => (
          <div key={a.label} className="hero-orbit__seat" style={{ '--i': i, '--n': seats.length }}>
            <button type="button" className={`hero-orbit__bubble is-${a.tone}`} onClick={() => (a.add ? onAdd?.() : onPick?.(a.label, a))}>
              {a.label}{a.count ? <small>{a.count}</small> : null}
            </button>
          </div>
        ))}
      </div>
      <span className="hero-orbit__spark is-a" aria-hidden="true" />
      <span className="hero-orbit__spark is-b" aria-hidden="true" />
      <span className="hero-orbit__spark is-c" aria-hidden="true" />
    </div>
  );
}
