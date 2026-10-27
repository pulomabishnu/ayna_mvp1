import { useEffect, useRef, useState } from 'react';
import { shownMatchPercent, PARTIAL_FIT } from '../utils/matchDisplay.js';
import { createPortal } from 'react-dom';
import { getProfileMatchPercentForProduct, getProductMatchDetailsForProduct } from '../data/products.js';
import { whyLine } from '../utils/whyLine';
import { ECOSYSTEM_AREAS, resolveEcosystemProductArea } from './EcosystemBubbles';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import { buildPersona } from '../mobile/utils/shopperProfile.js';
import { shareAynaLink } from '../mobile/utils/shareLink.js';
import { StoryTop } from './story/StoryShell.jsx';
import { storyTheme, useStoryGestures } from './story/storyKit.js';
import './story/story.css';
import './story/wrapped-story.css';

// "ayna Wrapped" from the app: a short story shown right after the quiz.
// Every slide is built from the person's answers and the real picks; slides
// with missing data are skipped. Arrow keys, taps (left back, right next),
// swipes or the buttons move it; hold pauses. Same look as the app's story.

const DURATION = 5200;

function Photo({ product }) {
  return <ProductTileImage product={product} imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '12%' }} letterNode={<ProductImageFallback style={{ position: 'absolute', inset: 0 }} />} />;
}

export default function WebWrapped({ products = [], quizResults, healthProfile = null, matchOpts = undefined, onClose, onBrowse, onBack, startAtEnd = false, primaryLabel = 'Open my ecosystem →', onPrimary }) {
  const picks = products.filter(Boolean);
  const top = picks.slice(0, 4);
  const first = top[0];
  const intake = quizResults?.fullHealthIntake || null;
  const persona = buildPersona(intake);
  const areas = [...new Set(picks.map((p) => resolveEcosystemProductArea(p, ECOSYSTEM_AREAS)?.label).filter(Boolean))];
  const raw = first && quizResults ? getProfileMatchPercentForProduct(first, quizResults, healthProfile, matchOpts) : null;
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
  const [theme] = useState(storyTheme);
  const [reduced] = useState(() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } });
  const active = slides[index] || slides[0];
  const last = index === slides.length - 1;
  const next = () => { progressRef.current = 0; setProgress(0); setIndex((i) => Math.min(slides.length - 1, i + 1)); };
  const prev = () => { progressRef.current = 0; setProgress(0); setIndex((i) => Math.max(0, i - 1)); };

  const gest = useStoryGestures({ onPrev: prev, onNext: next, onClose });
  useEffect(() => {
    if (paused || gest.held || last || reduced) return undefined;
    const t = window.setInterval(() => {
      progressRef.current += 80 / DURATION;
      if (progressRef.current >= 1) { progressRef.current = 0; setProgress(0); setIndex((i) => Math.min(slides.length - 1, i + 1)); }
      else setProgress(progressRef.current);
    }, 80);
    return () => window.clearInterval(t);
  }, [index, paused, gest.held, last, reduced, slides.length]);
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

  const surface = ['intro', 'persona', 'finish'].includes(active) ? 'is-espresso' : 'is-butter';
  const pct = firstMatch ? shownMatchPercent(firstMatch) : null;
  const plate = (p, cls = '') => <span className={`ays-plate ${cls}`.trim()}><span><Photo product={p} /></span></span>;

  return createPortal(<div className={`ays ay-wr ${surface} is-${active}`} data-theme={theme} role="dialog" aria-modal="true" aria-label="Your ayna Wrapped">
    <div className="ays-frame">
      <StoryTop
        count={slides.length} index={index} progress={reduced ? null : last ? 1 : progress} title="Your ayna summary"
        paused={paused} onPause={last || reduced ? null : () => setPaused((v) => !v)} pauseLabels={['Pause story', 'Play story']}
        onClose={onClose} closeLabel="Close"
        lead={<button type="button" className="ays-icon" onClick={back} disabled={index === 0 && !onBack} aria-label={index === 0 && onBack ? 'Back to the quiz' : 'Previous slide'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg></button>}
      />
      <p className="sr-only" aria-live="polite">{`Story ${index + 1} of ${slides.length}`}</p>

      <div className="ays-stage" {...gest.bind}>
        <section className="ays-card" key={active}>
          {active === 'intro' && <>
            <div className="ays-visual"><p className="ays-big is-huge"><b>{picks.length}</b><small>{picks.length === 1 ? 'pick' : 'picks'}</small></p></div>
            <div className="ays-words">
              <p className="ays-kicker">Your ecosystem is ready</p>
              <h1 className="ays-title">Your ayna, wrapped</h1>
              <p className="ay-wr-stat"><strong>{areas.length}</strong><span>{areas.length === 1 ? 'area' : 'areas'}</span>{goals > 0 && <><i aria-hidden="true" /><strong>{goals}</strong><span>{goals === 1 ? 'goal' : 'goals'}</span></>}</p>
            </div>
          </>}
          {active === 'focus' && <>
            <div className="ays-words"><p className="ays-kicker">Your ecosystem covers</p></div>
            <ol className="ay-wr-ranks">{areas.slice(0, 3).map((a, i) => { const p = picks.find((x) => resolveEcosystemProductArea(x, ECOSYSTEM_AREAS)?.label === a); return <li key={a}><span>{i + 1}</span><strong>{a}</strong>{p && plate(p, 'ay-wr-rankplate')}</li>; })}</ol>
          </>}
          {active === 'match' && first && <>
            <div className="ays-visual">
              <div className="ay-wr-hero">
                {plate(first)}
                {firstMatch && (pct != null ? <span className="ay-wr-match"><strong>{pct}%</strong>match</span> : <span className="ay-wr-match is-partial">{PARTIAL_FIT}</span>)}
              </div>
            </div>
            <div className="ays-words">
              <p className="ays-kicker">Your #1 match</p>
              <h1 className={`ays-title${String(first.name || '').length > 40 ? ' is-long' : ''}`}>{first.name}</h1>
              {(first.brand || firstWhy) && <p className="ays-body">{[first.brand, firstWhy].filter(Boolean).join(' · ')}</p>}
            </div>
          </>}
          {active === 'persona' && persona && <>
            <div className="ays-words"><p className="ays-kicker">How you shop</p><h1 className="ays-title">{persona.title}</h1></div>
            <dl className="ay-wr-facts">{persona.facts.map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>
          </>}
          {active === 'lineup' && <>
            <div className="ay-wr-grid">{top.map((p, i) => <span key={p.id || i} className="ay-wr-cell">{plate(p)}</span>)}</div>
            <div className="ays-words"><p className="ays-kicker">Your picks</p><h1 className="ays-title">{picks.length} {picks.length === 1 ? 'pick' : 'picks'} that fit your answers</h1></div>
          </>}
          {active === 'finish' && <>
            <div className="ays-visual">
              <div className="ay-wr-card">
                <span className="ay-wr-card-mark">ayna</span>
                <strong className="ay-wr-card-title">{persona?.title || 'My ecosystem'}</strong>
                <ul>
                  <li><span>Picks</span><b>{picks.length}</b></li>
                  <li><span>Areas</span><b>{areas.slice(0, 2).join(', ') || areas.length}</b></li>
                  {first && <li><span>#1 match</span><b>{first.name}</b></li>}
                </ul>
              </div>
            </div>
            <div className="ays-act">
              <button type="button" className="ays-cta" onClick={onPrimary || onClose}>{primaryLabel}</button>
              <div className="ay-wr-secondary">
                <button type="button" className="ays-link" onClick={share}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" /></svg>
                  Share
                </button>
                <button type="button" className="ays-link" onClick={onBrowse}>Browse instead</button>
              </div>
            </div>
          </>}
          {active === 'empty' && <>
            <div className="ays-words"><h1 className="ays-title">No strong match yet</h1><p className="ays-body">Your answers didn’t point to one clear pick. The Shop is sorted by need.</p></div>
            <div className="ays-act"><button type="button" className="ays-cta" onClick={onBrowse}>Go to Shop</button></div>
          </>}
        </section>
      </div>
      <div className="ays-nav">
        <button type="button" className="ays-icon" onClick={prev} disabled={index === 0} aria-label="Previous slide"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
        {!last ? <button type="button" className="ays-link ay-wr-skip" onClick={() => { progressRef.current = 0; setProgress(0); setIndex(slides.length - 1); }}>Skip to my products</button> : <span aria-hidden="true">{index + 1} of {slides.length}</span>}
        <button type="button" className="ays-icon" onClick={next} disabled={last} aria-label="Next slide"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
      </div>
    </div>
    <div className="ay-wr-toast" role="status" aria-live="polite">{shareState && <span>{shareState}</span>}</div>
  </div>, document.body);
}
