import { useEffect, useRef, useState } from 'react';
import { Stamp } from '../components/BrandBits.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { getProfileMatchPercentForProduct } from '../../data/products.js';
import IntakeSceneArt from '../components/intake/IntakeSceneArt.jsx';
import '../wrapped.css';
import { buildPersona } from '../utils/shopperProfile.js';
import { shareAynaLink } from '../utils/shareLink.js';
import '../../styles/flow.css';

const SLIDE_ART = { focus: 'scallop', match: 'bloom', persona: 'sparkle', lineup: 'arch', empty: 'scallop' };

// "Wrapped"-style story shown right after the intake. Every slide is built
// from what the person actually answered and the products the real matcher
// picked; slides whose data is missing are skipped rather than padded.

const DURATION = 5200;

function imageFor(product) {
  return product?.image || product?.imageUrl || product?.images?.[0];
}


export default function RevealScreen({ myProducts = [], topAreas = [], onContinue, onBack, onGoBrowse, authUser, quizAnswers, lastQuizAnswers, revealStartAtEnd = false }) {
  const products = myProducts.slice(0, 4);
  const first = products[0];
  const areaCount = new Set(myProducts.map((product) => product.areaKey).filter(Boolean)).size;
  const answers = quizAnswers || lastQuizAnswers;
  const intake = answers?.fullHealthIntake || null;
  const persona = buildPersona(intake);
  const rawMatch = first && answers ? getProfileMatchPercentForProduct(first, answers) : null;
  const firstMatch = Number.isFinite(rawMatch) && rawMatch > 0 ? Math.round(rawMatch) : null;
  const supportCount = (intake?.supportSelections || []).filter((s) => s !== 'Nothing right now').length;
  const needCount = supportCount || (answers?.supportSelections || []).filter((s) => s !== 'Nothing right now').length;

  const slides = products.length
    ? ['intro', ...(topAreas.length ? ['focus'] : []), 'match', ...(persona ? ['persona'] : []), 'lineup', 'finish']
    : ['empty'];
  // Coming back from the sign-up screen lands on the last slide, not the start.
  const [index, setIndex] = useState(() => (revealStartAtEnd ? slides.length - 1 : 0));
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef(0);
  const touchX = useRef(null);
  const swipeTime = useRef(0);
  const active = slides[index] || slides[0];
  const last = index === slides.length - 1;

  const next = () => { progressRef.current = 0; setIndex((current) => Math.min(slides.length - 1, current + 1)); setProgress(0); };
  const previous = () => { progressRef.current = 0; setIndex((current) => Math.max(0, current - 1)); setProgress(0); };

  useEffect(() => {
    if (paused || last || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => {
      progressRef.current += 80 / DURATION;
      if (progressRef.current >= 1) {
        progressRef.current = 0;
        setProgress(0);
        setIndex((current) => Math.min(slides.length - 1, current + 1));
      } else setProgress(progressRef.current);
    }, 80);
    return () => window.clearInterval(timer);
  }, [index, paused, last, slides.length]);

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
  const [shareState, setShareState] = useState('');
  const shareTimer = useRef(null);
  useEffect(() => () => window.clearTimeout(shareTimer.current), []);
  const share = async () => {
    const result = await shareAynaLink();
    const message = result === 'copied' ? 'Link copied' : result === 'failed' ? 'Couldn’t share the link' : '';
    setShareState(message);
    window.clearTimeout(shareTimer.current);
    if (message) shareTimer.current = window.setTimeout(() => setShareState(''), 2400);
  };

  return (
    <main className={`ayna-wrapped ayw--${active}`} onClick={handleTap}
      onTouchStart={(event) => { touchX.current = event.touches[0]?.clientX; }} onTouchEnd={handleTouchEnd}
      onKeyDown={(event) => { if (event.key === 'ArrowRight') next(); if (event.key === 'ArrowLeft') previous(); }}
      tabIndex={0} aria-label="Your ayna story">
      {SLIDE_ART[active] && <IntakeSceneArt art={SLIDE_ART[active]} key={`art-${active}`} />}
      <div className="ayw-progress" aria-label={`Story ${index + 1} of ${slides.length}`}>
        {slides.map((slide, i) => <span key={slide}><i style={{ width: i < index ? '100%' : i === index ? `${progress * 100}%` : '0%' }} /></span>)}
      </div>
      <div className="ayw-top">
        <button type="button" onClick={(event) => { event.stopPropagation(); if (index > 0) previous(); else onBack?.(); }} aria-label={index > 0 ? 'Previous slide' : 'Back to answers'}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
        </button>
        <span>ayna Wrapped</span>
        {!last ? (
          <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Play story' : 'Pause story'}>
            {paused ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>}
          </button>
        ) : <span className="ayw-top-spacer" />}
      </div>

      <div className="ayw-stage" key={active}>
        {active === 'intro' && <>
          <Stamp id="ayw-stamp" className="ayw-stamp" />
          <p className="ayw-kicker">Your ecosystem is ready</p>
          <h1 className="ayw-title">Your ayna,<br />wrapped</h1>
          <div className="ayw-stat-row">
            <div><strong>{myProducts.length}</strong><span>{myProducts.length === 1 ? 'pick' : 'picks'}</span></div>
            {areaCount || topAreas.length ? <div><strong>{areaCount || topAreas.length}</strong><span>{(areaCount || topAreas.length) === 1 ? 'area' : 'areas'}</span></div> : needCount > 0 && <div><strong>{needCount}</strong><span>{needCount === 1 ? 'need' : 'needs'}</span></div>}
            {supportCount > 0 && <div><strong>{supportCount}</strong><span>{supportCount === 1 ? 'goal' : 'goals'}</span></div>}
          </div>
        </>}

        {active === 'focus' && <>
          <p className="ayw-kicker">Your ecosystem covers</p>
          <ol className="ayw-ranks">
            {topAreas.slice(0, 3).map((area, i) => <li key={area} style={{ '--i': i }}><span>{i + 1}</span><strong>{area}</strong></li>)}
          </ol>
        </>}

        {active === 'match' && first && <>
          <p className="ayw-kicker">Your #1 match</p>
          <div className="ayw-arch">
            <div className="ayw-arch-clip"><ProductImage product={first} src={imageFor(first)} alt={first.name} allowBrandLogo={first.type === 'digital'} /></div>
            {firstMatch && <span className="ayw-badge"><svg className="ayw-ring" viewBox="0 0 100 100" aria-hidden="true" style={{ '--ring-gap': 100 - Math.min(100, firstMatch) }}><circle cx="50" cy="50" r="48" pathLength="100" /></svg><strong>{firstMatch}%</strong>match</span>}
          </div>
          <div className="ayw-product">
            {first.brand && <span>{first.brand}</span>}
            <strong>{first.name}</strong>
          </div>
        </>}

        {active === 'persona' && persona && <>
          <p className="ayw-kicker">Your shopper type</p>
          <h1 className="ayw-title ayw-title--persona">{persona.title}</h1>
          <dl className="ayw-facts">
            {persona.facts.map(([label, value], i) => <div key={label} style={{ '--i': i }}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </>}

        {active === 'lineup' && <>
          <p className="ayw-kicker">Your picks</p>
          <h1 className="ayw-title ayw-title--sm">{myProducts.length} {myProducts.length === 1 ? 'pick' : 'picks'} that fit<br />your answers</h1>
          <div className="ayw-grid">
            {products.map((product, i) => (
              <div key={product.id || i} className="ayw-tile" style={{ '--i': i }}>
                <ProductImage product={product} src={imageFor(product)} alt={product.name} allowBrandLogo={product.type === 'digital'} />
              </div>
            ))}
          </div>
        </>}

        {active === 'finish' && <>
          <div className="ayw-card">
            <span className="ayw-card-mark">ayna</span>
            <strong className="ayw-card-title">{persona?.title || 'My ecosystem'}</strong>
            <ul>
              <li><span>Picks</span><b>{myProducts.length}</b></li>
              {(topAreas.length > 0 || areaCount > 0) ? <li><span>Areas</span><b>{topAreas.slice(0, 2).join(', ') || areaCount}</b></li> : needCount > 0 && <li><span>Needs</span><b>{needCount}</b></li>}
              {first && <li><span>#1 match</span><b>{first.name}</b></li>}
            </ul>
          </div>
          <div className="ayw-actions">
            <button className="ayw-cta" type="button" onClick={onContinue}>{authUser ? 'Open my ecosystem' : 'Save my ecosystem'}<i aria-hidden="true">→</i></button>
            <div className="ayw-secondary">
              <button className="ayw-link" type="button" onClick={share}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" /></svg>
                Share
              </button>
              <button className="ayw-link" type="button" onClick={onGoBrowse}>Browse instead</button>
            </div>
          </div>
        </>}

        {active === 'empty' && <>
          <h1 className="ayw-title">No strong<br />match yet</h1>
          <p className="ayw-foot">No strong match yet. Your answers didn’t point to one clear pick. The Shop is sorted by need.</p>
          <div className="ayw-actions">
            <button className="ayw-cta" type="button" onClick={onGoBrowse}>Go to the Shop<i aria-hidden="true">→</i></button>
            <div><button className="ayw-link" type="button" onClick={onBack}>Edit answers</button></div>
          </div>
        </>}
      </div>
      {!last && <div className="ayw-hint" aria-hidden="true">Tap for the next card</div>}
      <div className="ayw-toast" role="status" aria-live="polite">{shareState && <span>{shareState}</span>}</div>
    </main>
  );
}
