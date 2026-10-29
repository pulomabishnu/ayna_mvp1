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

// Counts up from 0 when the slide opens (respects reduced motion).
function useCountUp(target, on, reduced) {
  const [n, setN] = useState(reduced ? target : 0);
  useEffect(() => {
    if (!on || reduced) { setN(target); return undefined; }
    let raf; const t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 700); setN(Math.round(target * (1 - (1 - k) ** 3))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, on, reduced]);
  return n;
}
function CountUp({ value, on, reduced }) { return <>{useCountUp(value, on, reduced)}</>; }

// The inspo's pink starburst: eight thin points, slowly turning.
function Burst({ className = '' }) {
  const pts = [];
  for (let i = 0; i < 16; i += 1) { const a = (Math.PI * i) / 8; const r = i % 2 ? 9 : 48; pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`); }
  return <svg className={`ay-wr-burst ${className}`.trim()} viewBox="0 0 100 100" aria-hidden="true"><polygon points={pts.join(' ')} /></svg>;
}
// A ring that fills to `share` (0..1) with a knob at the end, like the inspo's gauge.
function Ring({ share = 1, children }) {
  const r = 44; const c = 2 * Math.PI * r; const a = -Math.PI / 2 + 2 * Math.PI * share;
  return <div className="ay-wr-ring" style={{ '--c': c, '--off': c * (1 - share) }}>
    <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="ay-wr-ring__track" cx="50" cy="50" r={r} /><circle className="ay-wr-ring__fill" cx="50" cy="50" r={r} /><circle className="ay-wr-ring__knob" cx={50 + r * Math.cos(a)} cy={50 + r * Math.sin(a)} r="4.5" /></svg>
    <div className="ay-wr-ring__in">{children}</div>
  </div>;
}
// Little bars that grow in, one per match (the inspo's waveform).
function Bars({ n }) {
  return <span className="ay-wr-bars" aria-hidden="true">{Array.from({ length: Math.max(3, Math.min(14, n * 3)) }, (_, i) => <i key={i} style={{ '--h': `${30 + ((i * 37) % 70)}%`, '--i': i }} />)}</span>;
}
const TILE = ['is-pink', 'is-butter', 'is-blue', 'is-ink'];

export default function WebWrapped({ products = [], quizResults, healthProfile = null, matchOpts = undefined, onClose, onBrowse, onBack, startAtEnd = false, primaryLabel = 'See all your matches', onPrimary, onPersonalize = null, moreQuestions = 0, moreTopics = [], guest = false }) {
  const picks = products.filter(Boolean);
  const first = picks[0];
  const intake = quizResults?.fullHealthIntake || null;
  const persona = buildPersona(intake);
  const areas = [...new Set(picks.map((p) => resolveEcosystemProductArea(p, ECOSYSTEM_AREAS)?.label).filter(Boolean))];
  const raw = first && quizResults ? getProfileMatchPercentForProduct(first, quizResults, healthProfile, matchOpts) : null;
  const firstMatch = Number.isFinite(raw) && raw > 0 ? Math.round(raw) : null;
  const firstWhy = firstMatch ? whyLine(first, getProductMatchDetailsForProduct(first, quizResults)) : '';
  const goals = (intake?.supportSelections || []).filter((s) => s !== 'Nothing right now').length;
  // Founder, Oct 29: matches per category (animated), each with its top match
  // and "Show another" to swap it; more personal answers offered BEFORE the
  // story; the end says "See all your matches".
  const byArea = areas.map((label) => ({ label, items: picks.filter((p) => resolveEcosystemProductArea(p, ECOSYSTEM_AREAS)?.label === label) }))
    .sort((a, b) => b.items.length - a.items.length);
  const maxArea = Math.max(1, ...byArea.map((a) => a.items.length));
  const [swap, setSwap] = useState({});
  const slides = picks.length
    ? [...(onPersonalize && moreQuestions > 0 ? ['more'] : []), 'intro', ...(byArea.length ? ['categories'] : []), 'match', ...(persona ? ['persona'] : []), 'finish']
    : ['empty'];

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
    if (paused || gest.held || last || reduced || active === 'more' || active === 'categories') return undefined;
    const t = window.setInterval(() => {
      progressRef.current += 80 / DURATION;
      if (progressRef.current >= 1) { progressRef.current = 0; setProgress(0); setIndex((i) => Math.min(slides.length - 1, i + 1)); }
      else setProgress(progressRef.current);
    }, 80);
    return () => window.clearInterval(t);
  }, [index, paused, gest.held, last, reduced, slides.length, active]);
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
            <div className="ays-visual"><Burst className="is-corner" /><Ring share={Math.min(1, areas.length / Math.max(1, goals || areas.length))}><b><CountUp value={picks.length} on={active === 'intro'} reduced={reduced} /></b><small>{picks.length === 1 ? 'match' : 'matches'}</small></Ring></div>
            <div className="ays-words">
              <p className="ays-kicker">Your ecosystem is ready</p>
              <h1 className="ays-title">Your ayna, wrapped</h1>
              <p className="ay-wr-stat"><strong>{areas.length}</strong><span>{areas.length === 1 ? 'area' : 'areas'}</span>{goals > 0 && <><i aria-hidden="true" /><strong>{goals}</strong><span>{goals === 1 ? 'goal' : 'goals'}</span></>}</p>
            </div>
          </>}
          {active === 'more' && <>
            <div className="ays-visual"><Burst /></div>
            <div className="ays-words">
              <p className="ays-kicker">Before your summary</p>
              <h1 className="ays-title">Make your matches more personal</h1>
              <p className="ays-body">Your matches use what you’ve told us so far. {moreQuestions} quick {moreQuestions === 1 ? 'question' : 'questions'} sharpen them:</p>
              {moreTopics.length > 0 && <ul className="ay-wr-topics">{moreTopics.slice(0, 6).map((t, i) => <li key={t} style={{ '--i': i }}>{t}</li>)}</ul>}
              <p className="ays-body is-small">About 2 minutes. Skip any you like.</p>
            </div>
            <div className="ays-act">
              <button type="button" className="ays-cta" onClick={onPersonalize}>Answer {moreQuestions} quick {moreQuestions === 1 ? 'question' : 'questions'}</button>
              <div className="ay-wr-secondary"><button type="button" className="ays-link" onClick={next}>Not now, show my summary</button></div>
            </div>
          </>}
          {active === 'categories' && <>
            <div className="ays-words"><p className="ays-kicker">Your matches by category</p></div>
            <ol className="ay-wr-bento">{byArea.slice(0, 4).map((a, i) => {
              const at = (swap[a.label] || 0) % a.items.length;
              const p = a.items[at];
              return <li key={a.label} className={TILE[i % TILE.length]} style={{ '--d': `${i * 110}ms` }}>
                <div className="ay-wr-bento__top">
                  <span className="ay-wr-bento__label">{a.label}</span>
                  {p && plate(p, 'ay-wr-bento__plate')}
                </div>
                <strong className="ay-wr-bento__n"><CountUp value={a.items.length} on={active === 'categories'} reduced={reduced} /><small>{a.items.length === 1 ? 'match' : 'matches'}</small></strong>
                <Bars n={a.items.length} />
                {p && <p className="ay-wr-bento__pick" key={p.id}><span>Top match</span><b>{p.name}</b></p>}
                {a.items.length > 1 && <button type="button" className="ay-wr-bento__swap" onClick={() => setSwap((m) => ({ ...m, [a.label]: (m[a.label] || 0) + 1 }))} aria-label={`Show another ${a.label} match`}>Show another</button>}
              </li>;
            })}</ol>
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
          {active === 'finish' && <>
            <div className="ays-visual"><Burst className="is-corner" />
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
                <button type="button" className="ays-link" onClick={share} aria-describedby="wrapped-invite-note">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" /></svg>
                  Invite a friend
                </button>
                {/* Guest: the main button saves; this one shows her matches without an account. */}
                <button type="button" className="ays-link" onClick={onBrowse}>{guest ? 'See all your matches' : 'Browse the Shop'}</button>
              </div>
              <p id="wrapped-invite-note" className="ay-wr-invite-note">Shares an invitation to ayna, not your health results.</p>
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
        {!last ? <button type="button" className="ays-link ay-wr-skip" onClick={() => { progressRef.current = 0; setProgress(0); setIndex(slides.length - 1); }}>Skip to the end</button> : <span aria-hidden="true">{index + 1} of {slides.length}</span>}
        <button type="button" className="ays-icon" onClick={next} disabled={last} aria-label="Next slide"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
      </div>
    </div>
    <div className="ay-wr-toast" role="status" aria-live="polite">{shareState && <span>{shareState}</span>}</div>
  </div>, document.body);
}
