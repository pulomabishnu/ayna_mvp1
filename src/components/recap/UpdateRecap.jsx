import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StoryTop } from '../story/StoryShell.jsx';
import { storyTheme, useStoryGestures } from '../story/storyKit.js';
import ProductTileImage from '../ProductTileImage.jsx';
import { recapSlides, SOURCE_LABEL } from '../../matching/personalizationDiff.js';
import '../story/story.css';
import './update-recap.css';

/**
 * Level 3 of the update feedback (founder brief Nov 15): a full-screen, Wrapped-style recap of what
 * changed after a big profile change. Every slide comes from the real before/after diff; a slide
 * with nothing to say is never shown. Interactive: open a product, Add to routine, Not for me,
 * Undo the change, see all matches, see the change history. No auto-advance, so she reads at her pace.
 */
const SURFACE = { intro: 'is-espresso', needs: 'is-pink', top: 'is-butter', added: 'is-butter', moved: 'is-pink', removed: 'is-butter', done: 'is-espresso' };

function Plate({ product }) {
  return <span className="ay-ur-plate"><ProductTileImage product={product} alt="" letterNode={<span aria-hidden="true">{(product?.brand || product?.name || '?').slice(0, 1)}</span>} /></span>;
}

export default function UpdateRecap({ diff, resolve = (x) => x, onClose, onOpenProduct, onAdd, inEcosystem = () => false, onNotForMe, onUndo = null, onSeeAll, onHistory }) {
  const slides = useMemo(() => (diff ? recapSlides(diff) : []), [diff]);
  const [index, setIndex] = useState(0);
  const [undone, setUndone] = useState(false);
  const [hidden, setHidden] = useState({});
  const ref = useRef(null);
  const last = index === slides.length - 1;
  const next = () => setIndex((i) => Math.min(slides.length - 1, i + 1));
  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const gest = useStoryGestures({ onPrev: prev, onNext: next, onClose });
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose?.(); else if (e.key === 'ArrowRight') next(); else if (e.key === 'ArrowLeft') prev(); };
    window.addEventListener('keydown', k);
    ref.current?.focus?.({ preventScroll: true });
    return () => window.removeEventListener('keydown', k);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!diff || !slides.length || typeof document === 'undefined') return null;
  const s = slides[index];
  const full = (p) => resolve(p) || p;
  const stop = (e) => e.stopPropagation();
  const added = diff.matchesAdded.length;
  const needsChanged = diff.needsAdded.length + diff.needsRemoved.length;

  const productRow = (p, extra = null) => {
    const prod = full(p);
    const mine = inEcosystem(p.id);
    if (hidden[p.id]) return <li key={p.id} className="ay-ur-row is-gone"><span>{p.name}: not for you. Gone from your matches.</span></li>;
    return <li key={p.id} className="ay-ur-row">
      <button type="button" className="ay-ur-open" onClick={(e) => { stop(e); onOpenProduct?.(prod); }} aria-label={`Open ${p.name}`}>
        <Plate product={prod} />
        <span className="ay-ur-name"><b>{p.name}</b>{(p.brand || extra) && <small>{[p.brand, extra].filter(Boolean).join(' · ')}</small>}</span>
      </button>
      <span className="ay-ur-acts">
        {onAdd && <button type="button" className="ay-ur-btn" aria-pressed={mine} onClick={(e) => { stop(e); onAdd(prod); }}>{mine ? 'In your routine' : 'Add to routine'}</button>}
        {onNotForMe && !mine && <button type="button" className="ay-ur-link" onClick={(e) => { stop(e); onNotForMe(prod); setHidden((h) => ({ ...h, [p.id]: true })); }}>Not for me</button>}
      </span>
    </li>;
  };

  const story = <div ref={ref} tabIndex={-1} className={`ays ay-ur ${SURFACE[s.kind] || 'is-butter'}`} data-theme={storyTheme()} role="dialog" aria-modal="true" aria-label="What changed in your ayna">
    <div className="ays-frame">
      <StoryTop count={slides.length} index={index} title="Your ayna, updated" onClose={onClose} closeLabel="Close"
        lead={<button type="button" className="ays-icon" onClick={prev} disabled={index === 0} aria-label="Previous slide"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg></button>} />
      <p className="sr-only" aria-live="polite">{`Slide ${index + 1} of ${slides.length}`}</p>
      <div className="ays-stage" {...gest.bind}>
        <section className={`ays-card ay-ur-card is-${s.kind}`} key={`${s.kind}-${index}`}>
          {s.kind === 'intro' && <>
            <p className="ay-ur-kicker is-small">{SOURCE_LABEL[diff.source] || 'Your profile changed'}</p>
            <p className="ay-ur-big">Your ayna, updated</p>
            <dl className="ay-ur-stats">
              {added > 0 && <div><dt>New matches</dt><dd>{added}</dd></div>}
              {needsChanged > 0 && <div><dt>Needs changed</dt><dd>{needsChanged}</dd></div>}
              {diff.moved.length > 0 && <div><dt>Moved</dt><dd>{diff.moved.length}</dd></div>}
              {diff.matchesRemoved.length > 0 && <div><dt>Out of your top 6</dt><dd>{diff.matchesRemoved.length}</dd></div>}
            </dl>
            <p className="ay-ur-sub">Here is exactly what changed. Tap to go on.</p>
          </>}
          {s.kind === 'needs' && <>
            <p className="ay-ur-kicker">What ayna covers now</p>
            {s.added.length > 0 && <><p className="ay-ur-h">Now covering</p><ul className="ay-ur-chips">{s.added.map((n) => <li key={n.id}>{n.label}</li>)}</ul></>}
            {s.removed.length > 0 && <><p className="ay-ur-h">No longer covering</p><ul className="ay-ur-chips is-out">{s.removed.map((n) => <li key={n.id}>{n.label}</li>)}</ul></>}
            <p className="ay-ur-sub">From the answers you just changed.</p>
          </>}
          {s.kind === 'top' && <>
            <p className="ay-ur-kicker">Your new #1 match</p>
            <button type="button" className="ay-ur-hero" onClick={(e) => { stop(e); onOpenProduct?.(full(s.product)); }} aria-label={`Open ${s.product.name}`}><Plate product={full(s.product)} /></button>
            <p className="ay-ur-big is-name">{s.product.name}</p>
            {s.product.percent != null && <p className="ay-ur-pct">{s.product.percent}% match</p>}
            {s.was && <p className="ay-ur-sub">Was: {s.was.name}{s.was.percent != null ? ` (${s.was.percent}%)` : ''}</p>}
            <span className="ay-ur-acts is-center">
              <button type="button" className="ay-ur-btn is-solid" onClick={(e) => { stop(e); onOpenProduct?.(full(s.product)); }}>See why</button>
              {onAdd && <button type="button" className="ay-ur-btn" aria-pressed={inEcosystem(s.product.id)} onClick={(e) => { stop(e); onAdd(full(s.product)); }}>{inEcosystem(s.product.id) ? 'In your routine' : 'Add to routine'}</button>}
            </span>
          </>}
          {s.kind === 'added' && <>
            <p className="ay-ur-kicker">{s.products.length === 1 ? 'New match' : `${s.products.length} new matches`}</p>
            <ul className="ay-ur-list">{s.products.map((p) => productRow(p, p.percent != null ? `${p.percent}%` : `#${p.rank}`))}</ul>
          </>}
          {s.kind === 'moved' && <>
            <p className="ay-ur-kicker">What moved</p>
            <ul className="ay-ur-moves">
              {s.moves.map((m) => <li key={m.id}><b>{m.name}</b><span className={m.to < m.from ? 'is-up' : 'is-down'}>#{m.from} → #{m.to}</span></li>)}
              {s.percents.filter((p) => !s.moves.some((m) => m.id === p.id)).map((p) => <li key={`p-${p.id}`}><b>{p.name}</b><span className={p.to > p.from ? 'is-up' : 'is-down'}>{p.from}% → {p.to}%</span></li>)}
            </ul>
            <p className="ay-ur-sub">Ranks and scores come from the same match engine as Shop.</p>
          </>}
          {s.kind === 'removed' && <>
            <p className="ay-ur-kicker">Out of your top 6</p>
            <ul className="ay-ur-list">{s.products.map((p) => <li key={p.id} className="ay-ur-row"><button type="button" className="ay-ur-open" onClick={(e) => { stop(e); onOpenProduct?.(full(p)); }}><Plate product={full(p)} /><span className="ay-ur-name"><b>{p.name}</b><small>Was #{p.rank}</small></span></button></li>)}</ul>
            <p className="ay-ur-sub">They fit your earlier answers better. They're still in Shop, and anything in your routine stays there.</p>
          </>}
          {s.kind === 'done' && <>
            <p className="ay-ur-kicker is-small">That's what changed</p>
            <p className="ay-ur-big">{undone ? 'Change undone' : 'All set'}</p>
            <div className="ay-ur-stack">
              {onSeeAll && <button type="button" className="ay-ur-btn is-solid" onClick={(e) => { stop(e); onSeeAll(); }}>See all your matches</button>}
              {onHistory && <button type="button" className="ay-ur-btn" onClick={(e) => { stop(e); onHistory(); }}>What's changed over time</button>}
              {onUndo && !undone && <button type="button" className="ay-ur-link" onClick={async (e) => { stop(e); const ok = await onUndo(); if (ok !== false) setUndone(true); }}>Undo this change</button>}
            </div>
          </>}
        </section>
      </div>
      <div className="ay-ur-foot">
        {!last ? <button type="button" className="ay-ur-btn is-solid" onClick={next}>Next</button> : <button type="button" className="ay-ur-btn is-solid" onClick={onClose}>Done</button>}
      </div>
    </div>
  </div>;
  return createPortal(story, document.body);
}
