import { useEffect, useState } from 'react';
import { ALL_PRODUCTS } from '../../data/products.js';
import ProductImage from './ProductImage.jsx';

const PRODUCTS = ['p-lola-pad', 'p-spearmint-pcos', 'p-portable-heating', 'p-ritual-prenatal']
  .map((id) => ALL_PRODUCTS.find((product) => product.id === id)).filter(Boolean);

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
    if (paused || reducedMotion || PRODUCTS.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % PRODUCTS.length), 4500);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);
  const product = PRODUCTS[index];
  if (!product) return null;
  return <div className="ayna-product-theatre" aria-label="Products in the ayna catalog">
    <span className="ayna-theatre-orbit" aria-hidden="true" />
    <span className="ayna-theatre-sticker">Find your fit</span>
    <div key={product.id} className="ayna-theatre-photo"><ProductImage src={product.image || product.imageUrl || product.images?.[0]} alt={product.name} /></div>
    <span className="ayna-theatre-name">{product.brand || product.name}</span>
    {!reducedMotion && PRODUCTS.length > 1 && <button className="ayna-theatre-pause" type="button" aria-label={paused ? 'Resume product slideshow' : 'Pause product slideshow'} onClick={() => setPaused((value) => !value)}>{paused ? <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 11 7-11 7z" /></svg> : <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM14 5h4v14h-4z" /></svg>}</button>}
  </div>;
}
