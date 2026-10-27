import { useEffect, useRef, useState } from 'react';
import ProductImage from '../components/ProductImage.jsx';
import { matchPercentFor, productMatch } from '../utils/matchScore.js';
import { whyLine } from '../../utils/whyLine.js';
import { shownMatchPercent, PARTIAL_FIT } from '../../utils/matchDisplay.js';
import { ecosystemCounts } from '../../utils/ecosystemCounts.js';
import { bleedingCareNote, showableAsPick } from '../../utils/bleedingCare.js';
import BleedingEvaluationNote from '../../components/match/BleedingEvaluationNote.jsx';
import { StoryTop } from '../../components/story/StoryShell.jsx';
import { storyTheme, useStoryGestures } from '../../components/story/storyKit.js';
import '../../components/story/story.css';
import '../../components/story/wrapped-story.css';
import { buildPersona } from '../utils/shopperProfile.js';
import { shareAynaLink } from '../utils/shareLink.js';
import '../../styles/flow.css';

// "Wrapped"-style story shown right after the intake. Every slide is built
// from what the person actually answered and the products the real matcher
// picked; slides whose data is missing are skipped rather than padded.

const DURATION = 5200;

function imageFor(product) {
  return product?.image || product?.imageUrl || product?.images?.[0];
}


export default function RevealScreen({ myProducts = [], topAreas = [], onContinue, onBack, onExitStory = null, onGoBrowse, authUser, quizAnswers, lastQuizAnswers, matchOpts, revealStartAtEnd = false }) {
  const answers = quizAnswers || lastQuizAnswers;
  // "#1 match" is her highest-scoring product (same scorer as every card), not
  // just the first one saved; ties keep her ecosystem's order.
  // Bleeding after menopause: picks the engine sends to evaluation (or that do
  // not fit her) are never shown as a match; the care message leads instead.
  const bleeding = bleedingCareNote(answers, null, matchOpts || undefined);
  const ranked = answers
    ? myProducts.filter((product) => showableAsPick(product, answers, null, matchOpts || undefined)).map((product, i) => ({ product, i, pct: matchPercentFor(product, answers, matchOpts) ?? -1 })).sort((a, b) => b.pct - a.pct || a.i - b.i).map((x) => x.product)
    : myProducts;
  const products = ranked.slice(0, 4);
  const first = products[0];
  // Same counts as the Ecosystem hero and the website (utils/ecosystemCounts).
  const counts = ecosystemCounts(myProducts, answers, { matchOpts });
  const productWord = counts.products === 1 ? 'product' : 'products';
  const intake = answers?.fullHealthIntake || null;
  const persona = buildPersona(intake);
  // Same scorer and inputs as the card and product page, so "#1 match 97%" here is 97% there too.
  const firstMatch = first && answers ? matchPercentFor(first, answers, matchOpts) : null;
  const firstWhy = firstMatch ? whyLine(first, productMatch(first, answers, matchOpts)) : '';

  const slides = products.length
    ? ['intro', ...(topAreas.length ? ['focus'] : []), 'match', ...(persona ? ['persona'] : []), 'lineup', 'finish']
    : ['empty'];
  // Coming back from the sign-up screen lands on the last slide, not the start.
  const [index, setIndex] = useState(() => (revealStartAtEnd ? slides.length - 1 : 0));
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef(0);
  const [theme] = useState(storyTheme);
  const [reduced] = useState(() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } });
  const active = slides[index] || slides[0];
  const last = index === slides.length - 1;

  const next = () => { progressRef.current = 0; setIndex((current) => Math.min(slides.length - 1, current + 1)); setProgress(0); };
  const previous = () => { progressRef.current = 0; setIndex((current) => Math.max(0, current - 1)); setProgress(0); };

  const gest = useStoryGestures({ onPrev: previous, onNext: next, onClose: onExitStory || null });
  useEffect(() => {
    if (paused || gest.held || last || reduced) return undefined;
    const timer = window.setInterval(() => {
      progressRef.current += 80 / DURATION;
      if (progressRef.current >= 1) {
        progressRef.current = 0;
        setProgress(0);
        setIndex((current) => Math.min(slides.length - 1, current + 1));
      } else setProgress(progressRef.current);
    }, 80);
    return () => window.clearInterval(timer);
  }, [index, paused, gest.held, last, reduced, slides.length]);

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

  // Two surfaces (founder, Oct 27: one calm theme with the rest of the app): espresso opens and closes, butter between.
  const surface = ['intro', 'persona', 'finish'].includes(active) ? 'is-espresso' : 'is-butter';
  const needsPct = counts.needs > 0 ? Math.round((counts.needsCovered / counts.needs) * 100) : null;
  const pct = first && firstMatch ? shownMatchPercent(firstMatch) : null;

  return (
    <main className={`ays ay-wr ${surface} ayw--${active}`} data-theme={theme}
      onKeyDown={(event) => { if (event.key === 'ArrowRight') next(); if (event.key === 'ArrowLeft') previous(); }}
      tabIndex={0} aria-label="Your ayna story">
      <div className="ays-frame">
        <StoryTop
          count={slides.length} index={index} progress={reduced ? null : last ? 1 : progress} title="Your ayna summary"
          paused={paused} onPause={last || reduced ? null : () => setPaused((value) => !value)} pauseLabels={['Pause story', 'Play story']}
          onClose={onExitStory} closeLabel="Close your summary"
          lead={(
            <button type="button" className="ays-icon" onClick={(event) => { event.stopPropagation(); if (index > 0) previous(); else onBack?.(); }} aria-label={index > 0 ? 'Previous card' : 'Back to answers'}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
            </button>
          )}
        />
        <p className="sr-only" aria-live="polite">{`Story ${index + 1} of ${slides.length}`}</p>

        <div className="ays-stage" {...gest.bind}>
          <section className="ays-card" key={active}>
            {active === 'intro' && <>
              {bleeding && <BleedingEvaluationNote className="ay-wr-care" title={bleeding.title} note={bleeding} />}
              <div className="ays-visual">
                {/* Her ecosystem as one ring: filled to the needs it covers, the product count inside. */}
                <figure className="ay-wr-ring">
                  <svg viewBox="0 0 120 120" aria-hidden="true"><circle className="ay-wr-track" cx="60" cy="60" r="52" />{needsPct != null && <circle className="ay-wr-arc" cx="60" cy="60" r="52" pathLength="100" style={{ strokeDashoffset: 100 - needsPct }} transform="rotate(-90 60 60)" />}</svg>
                  <span className="ay-wr-center"><strong>{counts.products}</strong><span>{productWord}</span></span>
                </figure>
              </div>
              <div className="ays-words">
                <p className="ays-kicker">Your ecosystem is ready</p>
                <h1 className="ays-title">Your ayna,<br />at a glance</h1>
                {counts.needs > 0 && <p className="ay-wr-stat"><strong>{counts.needsCovered} of {counts.needs}</strong><span>{counts.needs === 1 ? 'need' : 'needs'} covered</span></p>}
              </div>
            </>}

            {active === 'focus' && <>
              <div className="ays-words">
                <p className="ays-kicker">Your ecosystem covers</p>
              </div>
              <ol className="ay-wr-ranks">
                {topAreas.slice(0, 3).map((area, i) => <li key={area}><span>{i + 1}</span><strong>{area}</strong></li>)}
              </ol>
            </>}

            {active === 'match' && first && <>
              <div className="ays-visual">
                <div className="ay-wr-hero">
                  <span className="ays-plate"><span><ProductImage product={first} src={imageFor(first)} alt={first.name} allowBrandLogo={first.type === 'digital'} /></span></span>
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
              <div className="ays-words">
                <p className="ays-kicker">How you shop</p>
                <h1 className="ays-title">{persona.title}</h1>
              </div>
              <dl className="ay-wr-facts">
                {persona.facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
            </>}

            {active === 'lineup' && <>
              <div className="ay-wr-grid">
                {products.map((product, i) => (
                  <span key={product.id || i} className="ays-plate"><span><ProductImage product={product} src={imageFor(product)} alt={product.name} allowBrandLogo={product.type === 'digital'} /></span></span>
                ))}
              </div>
              <div className="ays-words">
                <p className="ays-kicker">Your picks</p>
                <h1 className="ays-title">{counts.products} {productWord} that fit<br />your answers</h1>
              </div>
            </>}

            {active === 'finish' && <>
              <div className="ays-visual">
                <div className="ay-wr-card">
                  <span className="ay-wr-card-mark">ayna</span>
                  <strong className="ay-wr-card-title">{persona?.title || 'My ecosystem'}</strong>
                  <ul>
                    <li><span>Products</span><b>{counts.products}</b></li>
                    {counts.needs > 0 && <li><span>Needs covered</span><b>{counts.needsCovered} of {counts.needs}</b></li>}
                    {topAreas.length > 0 && <li><span>Areas</span><b>{topAreas.slice(0, 2).join(', ')}</b></li>}
                    {first && <li><span>#1 match</span><b>{first.name}</b></li>}
                  </ul>
                </div>
              </div>
              <div className="ays-act">
                <button className="ays-cta" type="button" onClick={authUser && onExitStory ? onExitStory : onContinue}>{authUser ? (onExitStory ? 'Done' : 'Open my ecosystem') : 'Save to a free account'}</button>
                <div className="ay-wr-secondary">
                  <button className="ays-link" type="button" onClick={share}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" /></svg>
                    Share
                  </button>
                  <button className="ays-link" type="button" onClick={onGoBrowse}>Browse instead</button>
                </div>
              </div>
            </>}

            {active === 'empty' && <>
              {bleeding && <BleedingEvaluationNote className="ay-wr-care" title={bleeding.title} note={bleeding} />}
              <div className="ays-words">
                <h1 className="ays-title">No strong<br />match yet</h1>
                <p className="ays-body">No strong match yet. Your answers didn’t point to one clear pick. The Shop is sorted by need.</p>
              </div>
              <div className="ays-act">
                <button className="ays-cta" type="button" onClick={onGoBrowse}>Go to the Shop</button>
                <div className="ay-wr-secondary"><button className="ays-link" type="button" onClick={onBack}>Edit answers</button></div>
              </div>
            </>}
          </section>
        </div>
        <div className="ays-nav">
          <button type="button" className="ays-icon" onClick={previous} disabled={index === 0} aria-label="Previous slide"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
          <span aria-hidden="true">{index + 1} of {slides.length}</span>
          <button type="button" className="ays-icon" onClick={next} disabled={last} aria-label="Next slide"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
        </div>
      </div>
      <div className="ay-wr-toast" role="status" aria-live="polite">{shareState && <span>{shareState}</span>}</div>
    </main>
  );
}
