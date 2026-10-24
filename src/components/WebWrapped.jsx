import { useEffect, useRef, useState } from 'react';
import { shownMatchPercent, PARTIAL_FIT } from '../utils/matchDisplay.js';
import { createPortal } from 'react-dom';
import { getProfileMatchPercentForProduct, getProductMatchDetailsForProduct } from '../data/products.js';
import { whyLine } from '../utils/whyLine';
import { ECOSYSTEM_AREAS, resolveEcosystemProductArea } from './EcosystemBubbles';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import { buildPersona } from '../mobile/utils/shopperProfile.js';
import { shareAynaLink } from '../mobile/utils/shareLink.js';
import './WebWrapped.css';

// "ayna Wrapped" from the app: a short story shown right after the quiz.
// Every slide is built from the person's answers and the real picks; slides
// with missing data are skipped. Arrow keys, clicks or the buttons move it.

const DURATION = 5200;

function Photo({ product }) {
  return <ProductTileImage product={product} imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '12%' }} letterNode={<ProductImageFallback style={{ position: 'absolute', inset: 0 }} />} />;
}

export default function WebWrapped({ products = [], quizResults, onClose, onBrowse, onBack, startAtEnd = false, primaryLabel = 'Open my ecosystem →', onPrimary }) {
  const picks = products.filter(Boolean);
  const top = picks.slice(0, 4);
  const first = top[0];
  const intake = quizResults?.fullHealthIntake || null;
  const persona = buildPersona(intake);
  const areas = [...new Set(picks.map((p) => resolveEcosystemProductArea(p, ECOSYSTEM_AREAS)?.label).filter(Boolean))];
  const raw = first && quizResults ? getProfileMatchPercentForProduct(first, quizResults) : null;
  const firstMatch = Number.isFinite(raw) && raw > 0 ? Math.round(raw) : null;
  const firstWhy = firstMatch ? whyLine(first, getProductMatchDetailsForProduct(first, quizResults)) : '';
  const goals = (intake?.supportSelections || []).filter((s) => s !== 'Nothing right now').length;
  const slides = picks.length ? ['intro', ...(areas.length ? ['focus'] : []), 'match', ...(persona ? ['persona'] : []), 'lineup', 'finish'] : ['empty'];

  // Back from the sign-up step reopens the story on its last slide.
  const [index, setIndex] = useState(() => (startAtEnd ? slides.length - 1 : 0));
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [shareState, setShareState] = useState('');
  const progressRef = useRef(0);
  const active = slides[index] || slides[0];
  const last = index === slides.length - 1;
  const next = () => { progressRef.current = 0; setProgress(0); setIndex((i) => Math.min(slides.length - 1, i + 1)); };
  const prev = () => { progressRef.current = 0; setProgress(0); setIndex((i) => Math.max(0, i - 1)); };

  useEffect(() => {
    if (paused || last || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = window.setInterval(() => {
      progressRef.current += 80 / DURATION;
      if (progressRef.current >= 1) { progressRef.current = 0; setProgress(0); setIndex((i) => Math.min(slides.length - 1, i + 1)); }
      else setProgress(progressRef.current);
    }, 80);
    return () => window.clearInterval(t);
  }, [index, paused, last, slides.length]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Before the first slide: back to the quiz (its last step, answers kept).
  const back = () => { if (index > 0) prev(); else onBack?.(); };
  const shareTimer = useRef(null);
  useEffect(() => () => window.clearTimeout(shareTimer.current), []);
  const share = async () => {
    const result = await shareAynaLink();
    const message = result === 'copied' ? 'Link copied' : result === 'failed' ? 'Couldn’t share the link' : '';
    setShareState(message);
    window.clearTimeout(shareTimer.current);
    if (message) shareTimer.current = window.setTimeout(() => setShareState(''), 2400);
  };

  return createPortal(<div className="wwr-backdrop">
    <div className={`wwr is-${active}`} role="dialog" aria-modal="true" aria-label="Your ayna Wrapped">
      <div className="wwr-progress">{slides.map((s, i) => <span key={s}><i style={{ width: i < index ? '100%' : i === index ? `${progress * 100}%` : '0%' }} /></span>)}</div>
      <div className="wwr-top">
        <button type="button" onClick={back} disabled={index === 0 && !onBack} aria-label={index === 0 && onBack ? 'Back to the quiz' : 'Previous slide'}><svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg></button>
        <span>ayna Wrapped</span>
        <div>
          {!last && <button type="button" className="wwr-skip" onClick={() => { progressRef.current = 0; setProgress(0); setIndex(slides.length - 1); }}>Skip to my matches</button>}
          {!last && <button type="button" onClick={() => setPaused((v) => !v)} aria-label={paused ? 'Play story' : 'Pause story'}>{paused ? <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M8 5v14M16 5v14" /></svg>}</button>}
          <button type="button" onClick={onClose} aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        </div>
      </div>

      <div className="wwr-stage" key={active} onClick={(e) => { if (!e.target.closest('button')) next(); }}>
        {active === 'intro' && <>
          <span className="wwr-shapes" aria-hidden="true"><i /><i /><i /></span>
          <p className="wwr-kicker">Your ecosystem is ready</p>
          <h1>Your ayna,<br /><em>wrapped</em></h1>
          <div className="wwr-stats">
            <div><strong>{picks.length}</strong><span>{picks.length === 1 ? 'pick' : 'picks'}</span></div>
            <div><strong>{areas.length}</strong><span>{areas.length === 1 ? 'area' : 'areas'}</span></div>
            {goals > 0 && <div><strong>{goals}</strong><span>{goals === 1 ? 'goal' : 'goals'}</span></div>}
          </div>
        </>}
        {active === 'focus' && <>
          <p className="wwr-kicker">Your ecosystem covers</p>
          <ol className="wwr-ranks">{areas.slice(0, 3).map((a, i) => <li key={a} style={{ '--i': i }}><span>{i + 1}</span><strong>{a}</strong></li>)}</ol>
        </>}
        {active === 'match' && first && <>
          <p className="wwr-kicker">Your #1 match</p>
          <div className="wwr-arch"><div className="wwr-arch-clip"><Photo product={first} /></div>{firstMatch && (shownMatchPercent(firstMatch) != null ? <span className="wwr-badge"><strong>{firstMatch}%</strong>match</span> : <span className="wwr-badge is-partial">{PARTIAL_FIT}</span>)}</div>
          <div className="wwr-product">{first.brand && <span>{first.brand}</span>}<strong>{first.name}</strong>{firstWhy && <small className="wwr-why">{firstWhy}</small>}</div>
        </>}
        {active === 'persona' && persona && <>
          <p className="wwr-kicker">Your shopper type</p>
          <h1 className="is-persona">{persona.title}</h1>
          <dl className="wwr-facts">{persona.facts.map(([l, v], i) => <div key={l} style={{ '--i': i }}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>
        </>}
        {active === 'lineup' && <>
          <p className="wwr-kicker">Your picks</p>
          <h1 className="is-sm">{picks.length} {picks.length === 1 ? 'pick' : 'picks'} that fit<br />your <em>answers</em></h1>
          <div className="wwr-grid">{top.map((p, i) => <div key={p.id || i} className="wwr-tile" style={{ '--i': i }}><Photo product={p} /></div>)}</div>
        </>}
        {active === 'finish' && <>
          <div className="wwr-card">
            <span className="wwr-card-mark">ayna</span>
            <strong>{persona?.title || 'My ecosystem'}</strong>
            <ul>
              <li><span>Picks</span><b>{picks.length}</b></li>
              <li><span>Areas</span><b>{areas.slice(0, 2).join(', ') || areas.length}</b></li>
              {first && <li><span>#1 match</span><b>{first.name}</b></li>}
            </ul>
          </div>
          <div className="wwr-actions">
            <button type="button" className="wwr-cta" onClick={onPrimary || onClose}>{primaryLabel}</button>
            <div className="wwr-secondary">
              <button type="button" className="wwr-link" onClick={share}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" /></svg>
                Share
              </button>
              <button type="button" className="wwr-link" onClick={onBrowse}>Browse instead</button>
            </div>
          </div>
        </>}
        {active === 'empty' && <>
          <h1>No strong<br /><em>match</em> yet</h1>
          <p>Your answers didn’t point to one clear pick. The Shop is sorted by need.</p>
          <div className="wwr-actions"><button type="button" className="wwr-cta" onClick={onBrowse}>Go to the Shop</button></div>
        </>}
      </div>
      {!last && <p className="wwr-hint">Click to continue</p>}
      <div className="wwr-toast" role="status" aria-live="polite">{shareState && <span>{shareState}</span>}</div>
    </div>
  </div>, document.body);
}
