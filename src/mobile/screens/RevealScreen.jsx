import { useEffect, useRef, useState } from 'react';
import ProductImage from '../components/ProductImage.jsx';

const DURATION = 4600;

export default function RevealScreen({ myProducts = [], topAreas = [], onContinue, onBack, onGoBrowse, authUser }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef(0);
  const touchX = useRef(null);
  const swipeTime = useRef(0);
  const products = myProducts.slice(0, 4);
  const slides = products.length ? ['intro', 'focus', 'collection', 'finish'] : ['intro', 'empty'];
  const active = slides[index] || slides[0];
  const first = products[0];
  const next = () => { progressRef.current = 0; setIndex((current) => Math.min(slides.length - 1, current + 1)); setProgress(0); };
  const previous = () => { progressRef.current = 0; setIndex((current) => Math.max(0, current - 1)); setProgress(0); };

  useEffect(() => {
    if (paused || index === slides.length - 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => {
      progressRef.current += 80 / DURATION;
      if (progressRef.current >= 1) {
        progressRef.current = 0;
        setProgress(0);
        setIndex((current) => Math.min(slides.length - 1, current + 1));
      } else setProgress(progressRef.current);
    }, 80);
    return () => window.clearInterval(timer);
  }, [index, paused, slides.length]);

  const handleTap = (event) => {
    if (Date.now() - swipeTime.current < 350 || event.target.closest('button,a')) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX - bounds.left < bounds.width * .3) previous(); else next();
  };
  const handleTouchEnd = (event) => {
    if (touchX.current == null) return;
    const distance = touchX.current - event.changedTouches[0].clientX;
    touchX.current = null;
    if (Math.abs(distance) < 55) return;
    swipeTime.current = Date.now();
    if (distance > 0) next(); else previous();
  };

  return (
    <main className={`ayna-fresh-reveal ayna-story ayna-story--${active}`} onClick={handleTap}
      onTouchStart={(event) => { touchX.current = event.touches[0]?.clientX; }} onTouchEnd={handleTouchEnd}
      onKeyDown={(event) => { if (event.key === 'ArrowRight') next(); if (event.key === 'ArrowLeft') previous(); }}
      tabIndex={0} aria-label="Your ecosystem story">
      <div className="ayna-story-progress" aria-label={`Story ${index + 1} of ${slides.length}`}>
        {slides.map((slide, stepIndex) => <span key={slide}><i style={{ width: stepIndex < index ? '100%' : stepIndex === index ? `${progress * 100}%` : '0%' }} /></span>)}
      </div>
      <div className="ayna-story-top">
        <button type="button" onClick={onBack} aria-label="Back to answers">←</button>
        <span>ayna / your story</span>
        <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Play story' : 'Pause story'}>{paused ? '▶' : 'Ⅱ'}</button>
      </div>

      <div className="ayna-story-stage" key={active}>
        {active === 'intro' && <>
          <div className="ayna-story-kicker">YOUR ECOSYSTEM</div>
          <h1>Made for<br /><em>your</em> body.</h1>
          <div className="ayna-story-orbit" aria-hidden="true"><span>{myProducts.length}</span><i /><i /></div>
          <div className="ayna-story-bottomline">{myProducts.length} {myProducts.length === 1 ? 'pick' : 'picks'} · {topAreas.length} {topAreas.length === 1 ? 'area' : 'areas'}</div>
        </>}
        {active === 'focus' && first && <>
          <div className="ayna-story-kicker">FIRST UP / {topAreas[0] || 'YOUR MATCH'}</div>
          <h1>A good<br />place to start.</h1>
          <div className="ayna-story-feature-photo"><ProductImage src={first.image || first.imageUrl || first.images?.[0]} alt={first.name} allowBrandLogo={first.type === 'digital'} /></div>
          <div className="ayna-story-product-name"><span>{first.brand || 'Ayna pick'}</span><strong>{first.name}</strong></div>
        </>}
        {active === 'collection' && <>
          <div className="ayna-story-kicker">THE LINEUP</div>
          <h1>Your cabinet,<br />your rules.</h1>
          <div className="ayna-story-product-cloud">
            {products.map((product, productIndex) => <div key={product.id || productIndex} className="ayna-story-cloud-item" style={{ '--item-index': productIndex }}><ProductImage src={product.image || product.imageUrl || product.images?.[0]} alt={product.name} allowBrandLogo={product.type === 'digital'} /></div>)}
          </div>
          <div className="ayna-story-bottomline">{topAreas.join(' · ') || 'Made around you'}</div>
        </>}
        {active === 'finish' && <>
          <div className="ayna-story-kicker">ALL YOURS</div>
          <h1>Keep what<br /><em>fits.</em></h1>
          <div className="ayna-story-finish-mark" aria-hidden="true">a</div>
          <button className="ayna-story-cta" type="button" onClick={onContinue}>{authUser ? 'Open Ecosystem' : 'Save my Ecosystem'} <span>→</span></button>
          <button className="ayna-story-link" type="button" onClick={onGoBrowse}>Browse instead</button>
        </>}
        {active === 'empty' && <>
          <div className="ayna-story-kicker">YOUR NEXT CHAPTER</div>
          <h1>Still<br /><em>exploring.</em></h1>
          <p>No strong match yet.</p>
          <button className="ayna-story-cta" type="button" onClick={onGoBrowse}>Explore products <span>→</span></button>
          <button className="ayna-story-link" type="button" onClick={onBack}>Edit answers</button>
        </>}
      </div>
      {index < slides.length - 1 && <div className="ayna-story-nav-hint" aria-hidden="true">tap or swipe →</div>}
    </main>
  );
}
