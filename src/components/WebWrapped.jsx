import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { shownMatchPercent, PARTIAL_FIT } from '../utils/matchDisplay.js';
import { createPortal } from 'react-dom';
import { getProfileMatchPercentForProduct, getProductMatchDetailsForProduct, getEcosystemSeedFromQuiz } from '../data/products.js';
import { whyLine } from '../utils/whyLine';
import { formatPrice, shownPriceText } from '../utils/formatPrice.js';
import { groupShelves } from '../matching/shelfGroups.js';
import { diversifyByBrand } from '../matching/diversify.js';
import { whyFitSummary } from './match/WhyFit.jsx';
import { evidenceLevel } from './pdp/evidenceLevel.js';
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
  return <ProductTileImage product={product} imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '12%' }} letterNode={<ProductImageFallback product={product} style={{ position: 'absolute', inset: 0 }} />} />;
}

// Counts up from 0 when the slide opens (respects reduced motion).
function useCountUp(target, on, reduced) {
  // Starts at the real number (so it is right without animation, and for
  // screen readers), then counts up from 0 before the first paint.
  const [n, setN] = useState(target);
  useLayoutEffect(() => {
    if (!on || reduced) { setN(target); return undefined; }
    setN(0);
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
// Nov 3 (founder: "like Spotify Wrapped", every category even): each slide is one
// bold flat colour with big type on it (Spotify's "type as form"), the title
// words land one at a time, and her number repeats as a pattern behind it.
// Categories are all the same size and colour, in the order of her picks, never ranked.
function Kinetic({ text, className = 'ays-title' }) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  return <h1 className={`${className} ay-wr-kin`} aria-label={text}>{words.map((w, i) => <span key={`${w}${i}`} aria-hidden="true" style={{ '--w': i }}>{w}</span>)}</h1>;
}
function TypeWall({ value }) {
  if (value == null || value === '') return null;
  return <div className="ay-wr-wall" aria-hidden="true">{Array.from({ length: 4 }, (_, r) => <span key={r} style={{ '--r': r }}>{Array.from({ length: 6 }, () => value).join(' ')}</span>)}</div>;
}

export default function WebWrapped({ products = [], quizResults, healthProfile = null, matchOpts = undefined, onClose, onBrowse, onBack, startAtEnd = false, primaryLabel = 'See all your matches', onPrimary, onPersonalize = null, moreQuestions = 0, guest = false, inline = false, careNote = null, percentFor = null, whyFor = null, emptyBack = null, counts = null, onOpenProduct = null }) {
  const picks = products.filter(Boolean);
  const first = picks[0];
  const intake = quizResults?.fullHealthIntake || null;
  const persona = buildPersona(intake);
  const areas = [...new Set(picks.map((p) => resolveEcosystemProductArea(p, ECOSYSTEM_AREAS)?.label).filter(Boolean))];
  // The app passes its own scorer so "#1 match 97%" matches its cards exactly.
  const raw = first && quizResults ? (percentFor ? percentFor(first) : getProfileMatchPercentForProduct(first, quizResults, healthProfile, matchOpts)) : null;
  const firstMatch = Number.isFinite(raw) && raw > 0 ? Math.round(raw) : null;
  const firstWhy = firstMatch ? (whyFor ? whyFor(first) : whyLine(first, getProductMatchDetailsForProduct(first, quizResults))) : '';
  const goals = (intake?.supportSelections || []).filter((s) => s !== 'Nothing right now').length;
  // Founder, Oct 29: matches per category (animated), each with its top match
  // and "Show another" to swap it; more personal answers offered BEFORE the
  // story; the end says "See all your matches".
  // Nov 3: grouped by what she asked for help with (the matcher's needs, same as
  // the results page), not by product type, so both screens tell one story.
  const byNeed = (() => {
    if (!quizResults) return [];
    try {
      const byId = new Map(picks.map((p) => [p.id, p]));
      return groupShelves(getEcosystemSeedFromQuiz(quizResults, healthProfile, matchOpts).shelves || [])
        .map((sh) => ({ label: sh.label, sub: sh.memberLabels || null, items: (sh.productIds || []).map((id) => byId.get(id)).filter(Boolean) }))
        .filter((g) => g.items.length);
    } catch { return []; }
  })();
  // Nov 8 (founder: "actually informative"): why the #1 fits, and what ayna checked for her.
  const firstWhyFit = first && quizResults ? whyFitSummary(first, quizResults, healthProfile, matchOpts) : null;
  const checked = (() => {
    if (!quizResults || !picks.length) return null;
    let held = 0;
    try { held = (getEcosystemSeedFromQuiz(quizResults, healthProfile, matchOpts).shelves || []).reduce((n, sh) => n + (sh.restrictedCount || 0), 0); } catch { held = 0; }
    const gov = picks.filter((p) => { try { return evidenceLevel(p).level >= 3; } catch { return false; } }).length;
    const studied = picks.filter((p) => { try { return evidenceLevel(p).level >= 2; } catch { return false; } }).length;
    return { held, gov, studied };
  })();
  const byArea = byNeed.length ? byNeed : areas.map((label) => ({ label, items: picks.filter((p) => resolveEcosystemProductArea(p, ECOSYSTEM_AREAS)?.label === label) }));
  const groupWord = byNeed.length ? (byArea.length === 1 ? 'need' : 'needs') : (byArea.length === 1 ? 'area' : 'areas');
  // Founder, Nov 10: tap a product photo in the story and its page opens as a pop-up.
  const [peek, setPeek] = useState(null);
  const slides = picks.length
    // Nov 3: no "answer more questions" slide before the story; that choice is on the reveal and at the end.
    ? ['intro', ...(byArea.length ? ['categories'] : []), 'match', ...(picks.length >= 3 ? ['top5'] : []), ...(firstWhyFit && (firstWhyFit.reasons.length || firstWhyFit.checks.length) ? ['why'] : []), ...(checked && !(firstWhyFit && (firstWhyFit.reasons.length || firstWhyFit.checks.length)) ? ['checked'] : []), 'finish']
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
    if (paused || peek || gest.held || last || reduced || active === 'categories') return undefined;
    const t = window.setInterval(() => {
      progressRef.current += 80 / DURATION;
      if (progressRef.current >= 1) { progressRef.current = 0; setProgress(0); setIndex((i) => Math.min(slides.length - 1, i + 1)); }
      else setProgress(progressRef.current);
    }, 80);
    return () => window.clearInterval(t);
  }, [index, paused, peek, gest.held, last, reduced, slides.length, active]);
  useEffect(() => {
    const onKey = (e) => { if (peek) { if (e.key === 'Escape') setPeek(null); return; } if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'Escape') onClose?.(); };
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

  // Nov 11 (founder: "better than Spotify Wrapped"): every slide is its own flat brand colour, like Wrapped's
  // colour-per-card rhythm: espresso, butter, pink. Never a tint or a fourth colour.
  const SURFACE = { intro: 'is-espresso', categories: 'is-butter', match: 'is-pink', top5: 'is-butter', why: 'is-pink', checked: 'is-pink', persona: 'is-espresso', finish: 'is-espresso', empty: 'is-butter' };
  const surface = SURFACE[active] || 'is-butter';
  // Top 5 and the summary card: one product per brand first (research: diversify.js). #1 stays #1.
  const top = diversifyByBrand(picks, 5);
  const pctOf = (p) => { if (!quizResults) return null; try { const r = percentFor ? percentFor(p) : getProfileMatchPercentForProduct(p, quizResults, healthProfile, matchOpts); return Number.isFinite(r) && r > 0 ? shownMatchPercent(Math.round(r)) : null; } catch { return null; } };
  const pct = firstMatch ? shownMatchPercent(firstMatch) : null;
  const plate = (p, cls = '') => <span className={`ays-plate ${cls}`.trim()}><span><Photo product={p} /></span></span>;
  // A tappable photo: opens the product pop-up (never advances the story).
  const tapPlate = (p, cls = '') => <button type="button" className={`ay-wr-tap ${cls}`.trim()} onClick={(e) => { e.stopPropagation(); setPeek(p); }} onPointerDown={(e) => e.stopPropagation()} aria-label={`Open ${p.name}`}>{plate(p)}</button>;
  const peekPct = peek && quizResults ? (() => { const r = percentFor ? percentFor(peek) : getProfileMatchPercentForProduct(peek, quizResults, healthProfile, matchOpts); return Number.isFinite(r) && r > 0 ? shownMatchPercent(Math.round(r)) : null; })() : null;
  const peekWhy = peek && quizResults ? (whyFor ? whyFor(peek) : whyLine(peek, getProductMatchDetailsForProduct(peek, quizResults))) : '';

  const story = <div className={`ays ay-wr ${surface} is-${active}${inline ? ' is-inline' : ''}`} data-theme={theme} role={inline ? 'region' : 'dialog'} aria-modal={inline ? undefined : 'true'} aria-label="Your ayna Wrapped">
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
            {careNote}
            <TypeWall value={counts ? counts.products : picks.length} />
            <div className="ays-visual"><Burst className="is-corner" />{counts
              // App: the same numbers, in the same words, as her Ecosystem hero (utils/ecosystemCounts).
              ? <Ring share={counts.needs > 0 ? counts.needsCovered / counts.needs : 1}><b><CountUp value={counts.products} on={active === 'intro'} reduced={reduced} /></b><small>{counts.products === 1 ? 'product' : 'products'}</small></Ring>
              : <Ring share={Math.min(1, byArea.length / Math.max(1, goals || byArea.length))}><b><CountUp value={picks.length} on={active === 'intro'} reduced={reduced} /></b><small>{picks.length === 1 ? 'match' : 'matches'}</small></Ring>}</div>
            <div className="ays-words">
              <p className="ays-kicker">Your ecosystem is ready</p>
              <Kinetic text="Your ayna, wrapped" />
              {counts && counts.needs > 0 ? <p className="ay-wr-stat"><strong>{counts.needsCovered} of {counts.needs}</strong><span>{counts.needs === 1 ? 'need' : 'needs'} covered</span></p>
              : <p className="ay-wr-stat"><strong>{byArea.length}</strong><span>{groupWord}</span></p>}
            </div>
          </>}
          {active === 'categories' && <>
            <div className="ays-words"><p className="ays-kicker">What we found for you</p><Kinetic text={`${picks.length} ${picks.length === 1 ? 'match' : 'matches'} for ${byArea.length} ${groupWord}`} /></div>
            {/* Founder, Nov 10: each need with its top picks as photos; tap one for its page. */}
            <ul className={`ay-wr-needs is-n${Math.min(byArea.length, 4)}`}>{byArea.slice(0, 4).map((a, i) => (
              <li key={a.label} role="group" aria-label={a.label} style={{ '--d': `${i * 120}ms` }}>
                <p className="ay-wr-needs__head"><b>{a.label}</b><span><CountUp value={a.items.length} on={active === 'categories'} reduced={reduced} /> {a.items.length === 1 ? 'match' : 'matches'}</span></p>
                <div className="ay-wr-needs__row">{a.items.slice(0, 3).map((p) => <span key={p.id}>{tapPlate(p, 'ay-wr-needs__plate')}<small className="ay-wr-needs__name">{p.brand || p.name}</small></span>)}</div>
              </li>
            ))}</ul>
            <p className="ay-wr-tip">Tap a product to see it.</p>
          </>}
          {active === 'match' && first && <>
            <TypeWall value={pct != null ? `${pct}%` : '#1'} />
            <div className="ays-visual">
              <div className="ay-wr-hero">
                {tapPlate(first)}
                {firstMatch && (pct != null ? <span className="ay-wr-match"><strong>{pct}%</strong>match</span> : <span className="ay-wr-match is-partial">{PARTIAL_FIT}</span>)}
              </div>
            </div>
            <div className="ays-words">
              <p className="ays-kicker">Your #1 match</p>
              <Kinetic text={first.name} className={`ays-title${String(first.name || '').length > 40 ? ' is-long' : ''}`} />
              {(first.brand || firstWhy) && <p className="ays-body">{[first.brand, firstWhy].filter(Boolean).join(' · ')}</p>}
            </div>
          </>}
          {active === 'top5' && <>
            {/* Wrapped's "Top songs": her top five, numbered big, each with its photo; they land one by one. */}
            <div className="ays-words"><p className="ays-kicker">Your top {Math.min(5, picks.length)}</p><Kinetic text="Your best matches" /></div>
            <ol className="ay-wr-top">{top.slice(0, 5).map((p, i) => { const pc = pctOf(p); return (
              <li key={p.id} style={{ '--d': `${i * 160}ms` }}>
                <span className="ay-wr-top__n" aria-hidden="true">{i + 1}</span>
                {tapPlate(p, 'ay-wr-top__plate')}
                <span className="ay-wr-top__t"><b>{p.name}</b>{p.brand && <small>{p.brand}</small>}</span>
                {pc != null && <span className="ay-wr-top__pct">{pc}%</span>}
              </li>
            ); })}</ol>
          </>}
          {active === 'why' && firstWhyFit && <>
            <div className="ays-words"><p className="ays-kicker">Why it’s your #1</p><Kinetic text={firstWhyFit.forWhat ? `For ${firstWhyFit.forWhat.toLowerCase()}` : 'Made for what you told us'} /></div>
            <ul className="ay-wr-why">
              {firstWhyFit.reasons.map((r, i) => <li key={r} style={{ '--d': `${i * 140}ms` }}><span className="ay-wr-why__ic is-pink" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>{r}</li>)}
              {firstWhyFit.evidence && <li style={{ '--d': `${firstWhyFit.reasons.length * 140}ms` }}><span className="ay-wr-why__bars" aria-hidden="true">{[1, 2, 3].map((n) => <i key={n} className={n <= firstWhyFit.evidence.level ? 'is-on' : ''} />)}</span>Evidence: {firstWhyFit.evidence.word}</li>}
              {firstWhyFit.price && <li style={{ '--d': `${(firstWhyFit.reasons.length + 1) * 140}ms` }}><span className="ay-wr-why__ic" aria-hidden="true">$</span>{firstWhyFit.price.word}</li>}
            </ul>
            {firstWhyFit.checks.length > 0 && <p className="ay-wr-checks"><b>Checked for you:</b> {firstWhyFit.checks.join(', ')}</p>}
            {checked && <p className="ay-wr-fine">Every pick was checked against your answers{checked.held > 0 ? `, and ${checked.held} ${checked.held === 1 ? 'was' : 'were'} left out for your safety` : ''}. Brands can’t pay for a better match.</p>}
          </>}
          {active === 'checked' && checked && <>
            <div className="ays-words"><p className="ays-kicker">What ayna checked</p><Kinetic text="Every pick, checked against you" /></div>
            <dl className="ay-wr-nums">
              <div><dt><CountUp value={picks.length} on={active === 'checked'} reduced={reduced} /></dt><dd>{picks.length === 1 ? 'product fits' : 'products fit'} your answers</dd></div>
              {/* Only what helps her: a zero row ("0 left out") is left off. */}
              {checked.held > 0 && <div><dt><CountUp value={checked.held} on={active === 'checked'} reduced={reduced} /></dt><dd>{checked.held === 1 ? 'was' : 'were'} left out for your stage, medicines or safety</dd></div>}
              {checked.studied > 0 && <div><dt><CountUp value={checked.studied} on={active === 'checked'} reduced={reduced} /></dt><dd>{checked.studied === 1 ? 'has' : 'have'} research behind {checked.studied === 1 ? 'it' : 'them'}</dd></div>}
            </dl>
            <p className="ays-body">Brands can’t pay for a better match. Every % comes from your answers and the research.</p>
          </>}
          {active === 'persona' && persona && <>
            <div className="ays-words"><p className="ays-kicker">Your shopping style</p><Kinetic text={persona.title} /></div>
            <dl className="ay-wr-facts">{persona.facts.map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>
          </>}
          {active === 'finish' && <>
            {/* Founder, Nov 10: the end looked like a spreadsheet and repeated the shopping-style slide.
                Now it is her picks themselves, big, like the #1 slide, with one line and one button. */}
            {/* Wrapped's summary card: her photos, her top picks and her needs, one big number. */}
            <h1 className="sr-only">Your ayna summary</h1>
            <div className="ay-wr-card">
              <div className={`ay-wr-card__photos is-n${Math.min(picks.length, 4)}`}>{top.slice(0, 4).map((p) => <span key={p.id}>{tapPlate(p)}</span>)}</div>
              <div className="ay-wr-card__list"><p>Top picks</p><ol>{top.slice(0, 5).map((p, i) => <li key={p.id}><i>{i + 1}</i><span>{p.name}</span></li>)}</ol></div>
              {byArea.length > 0 && <ul className="ay-wr-card__needs" aria-label={byNeed.length ? 'Picked for' : 'Areas'}>{byArea.slice(0, 4).map((a) => <li key={a.label}>{a.label}</li>)}</ul>}
              <div className="ay-wr-card__stats">
                <p><small>Products</small><b>{counts ? counts.products : picks.length}</b></p>
                {pct != null ? <p><small>#1 match</small><b>{pct}%</b></p> : counts && counts.needs > 0 ? <p><small>Needs covered</small><b>{counts.needsCovered}/{counts.needs}</b></p> : null}
              </div>
              <p className="ay-wr-card__brand">ayna</p>
            </div>
            <div className="ays-act">
              <button type="button" className="ays-cta" onClick={onPrimary || onClose}>{primaryLabel}</button>
              {onPersonalize && moreQuestions > 0 && <button type="button" className="ays-link ay-wr-better" onClick={onPersonalize}>Make my matches better · {moreQuestions} quick {moreQuestions === 1 ? 'question' : 'questions'}</button>}
              <div className="ay-wr-secondary">
                <button type="button" className="ays-link" onClick={share} aria-describedby="wrapped-invite-note">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" /></svg>
                  Invite a friend
                </button>
                {/* Nov 9 (founder): a guest saves her matches with an account; no "See all your matches"
                    side door into Shop. She can still close the story (the X) or exit the quiz. */}
                {!guest && <button type="button" className="ays-link" onClick={onBrowse}>Browse the Shop</button>}
              </div>
              <p id="wrapped-invite-note" className="ay-wr-invite-note">Shares an invitation to ayna, not your health results.</p>
            </div>
          </>}
          {active === 'empty' && <>
            {careNote}
            <div className="ays-words"><h1 className="ays-title">No strong match yet</h1><p className="ays-body">Your answers didn’t point to one clear pick. The Shop is sorted by need.</p></div>
            <div className="ays-act"><button type="button" className="ays-cta" onClick={onBrowse}>Go to the Shop</button>{emptyBack && <div className="ay-wr-secondary"><button type="button" className="ays-link" onClick={emptyBack}>Edit answers</button></div>}</div>
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
    {peek && <div className="ay-wr-peek" role="dialog" aria-modal="true" aria-label={peek.name}>
      <button type="button" className="ay-wr-peek__dim" aria-label="Close" onClick={() => setPeek(null)} />
      <section className="ay-wr-peek__card">
        <button type="button" className="ay-wr-peek__x" aria-label="Close" onClick={() => setPeek(null)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        <div className="ay-wr-peek__img">{plate(peek)}</div>
        {peek.brand && <p className="ay-wr-peek__brand">{peek.brand}</p>}
        <h2 className="ay-wr-peek__name">{peek.name}</h2>
        <p className="ay-wr-peek__meta">{[shownPriceText(formatPrice(peek).main), peekPct != null ? `${peekPct}% match` : ''].filter(Boolean).join(' · ')}</p>
        {peekWhy && <p className="ay-wr-peek__why">{peekWhy}</p>}
        {(peek.summary || peek.description) && <p className="ay-wr-peek__about">{String(peek.summary || peek.description).slice(0, 220)}{String(peek.summary || peek.description).length > 220 ? '…' : ''}</p>}
        {onOpenProduct && <button type="button" className="ays-cta ay-wr-peek__go" onClick={() => { const p = peek; setPeek(null); onOpenProduct(p); }}>See the full page</button>}
      </section>
    </div>}
  </div>;
  // The app renders it in place (it is a screen there); the website floats it over the page.
  return inline ? story : createPortal(story, document.body);
}
