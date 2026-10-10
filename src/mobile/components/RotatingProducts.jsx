import { useEffect, useState } from 'react';
import { ALL_PRODUCTS } from '../../data/products.js';
import ProductImage from './ProductImage.jsx';

const product = ALL_PRODUCTS.find((item) => item.id === 'p-lola-pad') || ALL_PRODUCTS[0];
const second = ALL_PRODUCTS.find((item) => item.id === 'p-portable-heating') || ALL_PRODUCTS[1];
const FEATURES = [
  { key: 'match', label: 'MATCH', title: 'Picked for you' },
  { key: 'cabinet', label: 'ECOSYSTEM', title: 'Your cabinet' },
  { key: 'ask', label: 'ASK AYNA', title: 'Ask away' },
  { key: 'shop', label: 'SHOP', title: 'The lineup' },
];

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
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % FEATURES.length), 1800);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);
  const feature = FEATURES[index];

  return <div className={`ayna-product-theatre ayna-feature-montage ayna-feature-montage--${feature.key}`} aria-label="Ayna app features" aria-live="off">
    <div className="ayna-feature-head"><span>{feature.label}</span><span>{String(index + 1).padStart(2, '0')} / 04</span></div>
    <div key={feature.key} className="ayna-feature-stage">
      {feature.key === 'match' && <div className="ayna-feature-match"><ProductImage src={product?.image || product?.imageUrl || product?.images?.[0]} alt={product?.name || ''} /><span>YOUR MATCH</span></div>}
      {feature.key === 'cabinet' && <div className="ayna-feature-cabinet" aria-hidden="true"><i /><i /><i /><strong>you</strong></div>}
      {feature.key === 'ask' && <div className="ayna-feature-ask"><span>What fits my routine?</span><strong>ayna</strong><i /></div>}
      {feature.key === 'shop' && <div className="ayna-feature-shop"><span><ProductImage src={product?.image || product?.imageUrl || product?.images?.[0]} alt={product?.name || ''} /></span><span><ProductImage src={second?.image || second?.imageUrl || second?.images?.[0]} alt={second?.name || ''} /></span></div>}
    </div>
    <button className="ayna-feature-next" type="button" aria-label="Show next app feature" onClick={() => setIndex((value) => (value + 1) % FEATURES.length)} />
    <div className="ayna-feature-foot"><strong>{feature.title}</strong><div aria-hidden="true">{FEATURES.map((item, step) => <i key={item.key} className={step === index ? 'is-active' : ''} />)}</div></div>
    {!reducedMotion && <button className="ayna-theatre-pause" type="button" aria-label={paused ? 'Resume feature montage' : 'Pause feature montage'} onClick={() => setPaused((value) => !value)}>{paused ? '▶' : 'Ⅱ'}</button>}
  </div>;
}
