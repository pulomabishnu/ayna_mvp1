import { useEffect, useState } from 'react';
import { ALL_PRODUCTS } from '../../data/products.js';
import ProductImage from '../components/ProductImage.jsx';

const STEPS = ['your answers', 'the evidence', 'your matches'];
const OBJECTS = ['p-lola-pad', 'p-spearmint-pcos', 'p-portable-heating']
  .map((id) => ALL_PRODUCTS.find((product) => product.id === id)).filter(Boolean);

export default function BuildingScreen({ onFinish, onBack }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((_, index) => window.setTimeout(() => setStep(index), index * 600));
    const finish = window.setTimeout(() => onFinish?.(), 2200);
    return () => { timers.forEach(window.clearTimeout); window.clearTimeout(finish); };
  }, [onFinish]);

  return <div className="ayna-cabinet-building" role="status" aria-live="polite">
    <button type="button" className="ayna-cabinet-building-back" onClick={onBack}>Back</button>
    <span className="ayna-cabinet-building-label">AYNA / MATCHING</span>
    <div className="ayna-cabinet-building-shelf" aria-hidden="true">
      {OBJECTS.map((product, index) => <span key={product.id} className="ayna-cabinet-building-object" style={{ '--object-index': index }}><ProductImage src={product.image || product.imageUrl || product.images?.[0]} alt="" /></span>)}
    </div>
    <div className="ayna-cabinet-building-progress"><span>{String(step + 1).padStart(2, '0')} / 03</span><strong>{STEPS[step]}</strong></div>
  </div>;
}
