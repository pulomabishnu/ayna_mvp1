import { useEffect, useState } from 'react';

const FEATURES = [
  { key: 'ecosystem', label: 'ECOSYSTEM', title: 'Your space' },
  { key: 'match', label: 'MATCH', title: 'Your fit' },
  { key: 'ask', label: 'ASK', title: 'Ask ayna' },
  { key: 'discover', label: 'DISCOVER', title: 'Explore' },
];

function FeatureWidget({ feature }) {
  if (feature === 'ecosystem') return <div className="ayna-reel-widget ayna-reel-ecosystem">
    <div className="ayna-reel-ring"><span>03</span><small>in your space</small></div>
    <div className="ayna-reel-list"><span><i />Period</span><span><i />Pelvic</span><span><i />Care</span></div>
  </div>;
  if (feature === 'match') return <div className="ayna-reel-widget ayna-reel-match">
    <div className="ayna-reel-score"><span>86<span>%</span></span><small>MATCH</small></div>
    <div className="ayna-reel-lines"><strong>Made for your needs</strong><span>Fit <i /></span><span>Evidence <i /></span><span>Community <i /></span></div>
  </div>;
  if (feature === 'ask') return <div className="ayna-reel-widget ayna-reel-ask">
    <div className="ayna-reel-question">What works for cramps?</div>
    <div className="ayna-reel-answer"><b>ayna</b><span>Start with what matters to you.</span></div>
  </div>;
  return <div className="ayna-reel-widget ayna-reel-discover">
    <div className="ayna-reel-search"><span>⌕</span> Search</div>
    <div className="ayna-reel-categories"><span>Period</span><span>Pelvic</span><span>More care</span></div>
    <div className="ayna-reel-discover-rule" />
  </div>;
}

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
  useEffect(() => {
    if (paused || reducedMotion) return undefined;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % FEATURES.length), 2400);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);
  const feature = FEATURES[index];

  return <div className="ayna-product-theatre ayna-feature-montage" aria-label="Ayna app features" aria-live="off">
    <div className="ayna-feature-head"><span>{feature.label}</span><span>{String(index + 1).padStart(2, '0')} / 04</span></div>
    <div key={feature.key} className="ayna-feature-stage"><FeatureWidget feature={feature.key} /></div>
    <button className="ayna-feature-next" type="button" aria-label="Show next app feature" onClick={() => setIndex((value) => (value + 1) % FEATURES.length)} />
    <div className="ayna-feature-foot"><strong>{feature.title}</strong><div aria-hidden="true">{FEATURES.map((item, step) => <i key={item.key} className={step === index ? 'is-active' : ''} />)}</div></div>
    {!reducedMotion && <button className="ayna-theatre-pause" type="button" aria-label={paused ? 'Resume feature montage' : 'Pause feature montage'} onClick={() => setPaused((value) => !value)}>{paused ? '▶' : 'Ⅱ'}</button>}
  </div>;
}
