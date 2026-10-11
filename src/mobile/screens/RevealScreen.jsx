import { useEffect, useRef, useState } from 'react';
import ProductImage from '../components/ProductImage.jsx';
import { getProfileMatchPercentForProduct } from '../../data/products.js';
import '../wrapped.css';

// "Wrapped"-style story shown right after the intake. Every slide is built
// from what the person actually answered and the products the real matcher
// picked; slides whose data is missing are skipped rather than padded.

const DURATION = 5200;

const TRUST_TYPES = {
  'Clinical or scientific evidence': { title: 'The Researcher', line: 'Evidence first' },
  'Reviews and experiences from other women': { title: 'The Listener', line: 'Real reviews first' },
  'Brand reputation or expert recommendations': { title: 'The Curator', line: 'Expert picks first' },
};
const BRAND_SHORT = {
  'I mostly stick with brands I already trust': 'Loyalist',
  'I prefer trusted brands but am open to something new': 'Mostly loyal',
  'I like a mix of familiar and new brands': 'Mix it up',
  'I enjoy discovering new brands': 'Explorer',
};

function imageFor(product) {
  return product?.image || product?.imageUrl || product?.images?.[0];
}

function buildPersona(intake) {
  if (!intake) return null;
  const trust = TRUST_TYPES[intake.trustRanking?.[0]];
  const brand = BRAND_SHORT[intake.brandOpenness];
  const format = (intake.preferredFormats || []).find((f) => f !== 'No preference');
  const facts = [
    trust && ['Trusts', trust.line],
    brand && ['Brands', brand],
    format && ['Format', format],
  ].filter(Boolean);
  if (!facts.length) return null;
  return { title: trust?.title || (brand === 'Explorer' ? 'The Explorer' : 'The Original'), facts };
}

export default function RevealScreen({ myProducts = [], topAreas = [], onContinue, onBack, onGoBrowse, authUser, quizAnswers, lastQuizAnswers }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef(0);
  const touchX = useRef(null);
  const swipeTime = useRef(0);

  const products = myProducts.slice(0, 4);
  const first = products[0];
  const areaCount = new Set(myProducts.map((product) => product.areaKey).filter(Boolean)).size;
  const answers = quizAnswers || lastQuizAnswers;
  const intake = answers?.fullHealthIntake || null;
  const persona = buildPersona(intake);
  const rawMatch = first && answers ? getProfileMatchPercentForProduct(first, answers) : null;
  const firstMatch = Number.isFinite(rawMatch) && rawMatch > 0 ? Math.round(rawMatch) : null;
  const supportCount = (intake?.supportSelections || []).filter((s) => s !== 'Nothing right now').length;

  const slides = products.length
    ? ['intro', ...(topAreas.length ? ['focus'] : []), 'match', ...(persona ? ['persona'] : []), 'lineup', 'finish']
    : ['empty'];
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
  const share = async () => {
    const text = `My ayna: ${myProducts.length} picks across ${areaCount || topAreas.length} areas${persona ? ` · ${persona.title}` : ''}.`;
    try { if (navigator.share) await navigator.share({ title: 'My ayna', text }); else await navigator.clipboard?.writeText(text); } catch { /* dismissed */ }
  };

  return (
    <main className={`ayna-wrapped ayw--${active}`} onClick={handleTap}
      onTouchStart={(event) => { touchX.current = event.touches[0]?.clientX; }} onTouchEnd={handleTouchEnd}
      onKeyDown={(event) => { if (event.key === 'ArrowRight') next(); if (event.key === 'ArrowLeft') previous(); }}
      tabIndex={0} aria-label="Your ayna story">
      <div className="ayw-progress" aria-label={`Story ${index + 1} of ${slides.length}`}>
        {slides.map((slide, i) => <span key={slide}><i style={{ width: i < index ? '100%' : i === index ? `${progress * 100}%` : '0%' }} /></span>)}
      </div>
      <div className="ayw-top">
        <button type="button" onClick={onBack} aria-label="Back to answers">
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
          <div className="ayw-shapes" aria-hidden="true"><i /><i /><i /><i /></div>
          <p className="ayw-kicker">Your ecosystem is ready</p>
          <h1 className="ayw-title">Your ayna,<br /><em>wrapped.</em></h1>
          <div className="ayw-stat-row">
            <div><strong>{myProducts.length}</strong><span>{myProducts.length === 1 ? 'pick' : 'picks'}</span></div>
            <div><strong>{areaCount || topAreas.length}</strong><span>{(areaCount || topAreas.length) === 1 ? 'area' : 'areas'}</span></div>
            {supportCount > 0 && <div><strong>{supportCount}</strong><span>{supportCount === 1 ? 'goal' : 'goals'}</span></div>}
          </div>
        </>}

        {active === 'focus' && <>
          <p className="ayw-kicker">You came for</p>
          <ol className="ayw-ranks">
            {topAreas.slice(0, 3).map((area, i) => <li key={area} style={{ '--i': i }}><span>{i + 1}</span><strong>{area}</strong></li>)}
          </ol>
          <p className="ayw-foot">Your top areas, ranked by your picks.</p>
        </>}

        {active === 'match' && first && <>
          <p className="ayw-kicker">Your #1 match</p>
          <div className="ayw-arch">
            <div className="ayw-arch-clip"><ProductImage src={imageFor(first)} alt={first.name} allowBrandLogo={first.type === 'digital'} /></div>
            {firstMatch && <span className="ayw-badge"><strong>{firstMatch}%</strong>match</span>}
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
          <p className="ayw-kicker">The lineup</p>
          <h1 className="ayw-title ayw-title--sm">{myProducts.length} {myProducts.length === 1 ? 'pick' : 'picks'},<br />made for you.</h1>
          <div className="ayw-grid">
            {products.map((product, i) => (
              <div key={product.id || i} className="ayw-tile" style={{ '--i': i }}>
                <ProductImage src={imageFor(product)} alt={product.name} allowBrandLogo={product.type === 'digital'} />
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
              <li><span>Areas</span><b>{topAreas.slice(0, 2).join(', ') || areaCount}</b></li>
              {first && <li><span>#1 match</span><b>{first.name}</b></li>}
            </ul>
          </div>
          <div className="ayw-actions">
            <button className="ayw-cta" type="button" onClick={onContinue}>{authUser ? 'Open my Ecosystem' : 'Save my Ecosystem'}<i aria-hidden="true">→</i></button>
            <div>
              <button className="ayw-link" type="button" onClick={share}>Share</button>
              <button className="ayw-link" type="button" onClick={onGoBrowse}>Browse instead</button>
            </div>
          </div>
        </>}

        {active === 'empty' && <>
          <p className="ayw-kicker">Your next chapter</p>
          <h1 className="ayw-title">Still<br /><em>exploring.</em></h1>
          <p className="ayw-foot">No strong match yet.</p>
          <div className="ayw-actions">
            <button className="ayw-cta" type="button" onClick={onGoBrowse}>Explore products<i aria-hidden="true">→</i></button>
            <div><button className="ayw-link" type="button" onClick={onBack}>Edit answers</button></div>
          </div>
        </>}
      </div>
      {!last && <div className="ayw-hint" aria-hidden="true">Tap to continue</div>}
    </main>
  );
}
