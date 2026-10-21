import { createPortal } from 'react-dom';
import { CloseIcon, HeartIcon } from './icons/UiIcons.jsx';
import { useEffect, useRef, useState } from 'react';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import { getProfileMatchPercentForProduct, getProfileMatchLabelsForProduct } from '../data/products.js';
import { formatPrice } from '../utils/formatPrice';
import './WebDiscoverDeck.css';

// "Swipe to discover" from the app, for the website: one product at a time.
// Drag right / press → / Save to save it, drag left / press ← / Skip to pass.
// Same products the Shop is showing, ordered by match when there's a profile.

const SWIPE = 90;
const DECK_SIZE = 30;

export default function WebDiscoverDeck({ products = [], quizResults = null, savedProducts = {}, ownedIds = null, onToggleSaved, onOpenProduct, onClose }) {
  // Snapshot when the deck opens, so saving a card doesn't reshuffle the stack.
  const [deck] = useState(() => {
    // Only things she hasn't saved or added yet (D01).
    const fresh = products.filter((p) => p && !savedProducts[p.id] && !(ownedIds && ownedIds.has(p.id)));
    const rows = fresh.slice(0, 200).map((product) => {
      const match = quizResults ? getProfileMatchPercentForProduct(product, quizResults) : null;
      const reasons = quizResults && match > 0 ? (getProfileMatchLabelsForProduct(product, quizResults) || []).slice(0, 4) : [];
      return { product, match, reasons };
    });
    if (quizResults) rows.sort((a, b) => (b.match || 0) - (a.match || 0));
    return rows.slice(0, DECK_SIZE);
  });
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(null);
  const [leaving, setLeaving] = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  // Tap a card to flip it and see why it's here (P4: card-flip reveal).
  const [flipped, setFlipped] = useState(false);
  const moved = useRef(false);
  const startX = useRef(0);
  const closeRef = useRef(null);
  const current = deck[index];

  useEffect(() => { closeRef.current?.focus(); }, []);

  const act = (kind) => {
    if (!current || leaving) return;
    if (kind === 'save') {
      if (!savedProducts[current.product.id]) onToggleSaved?.(current.product);
      setSavedCount((n) => n + 1);
    }
    setDrag(null);
    setLeaving(kind);
    window.setTimeout(() => { setLeaving(null); setFlipped(false); setIndex((i) => i + 1); }, 240);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowRight') act('save');
      if (e.key === 'ArrowLeft') act('skip');
      if ((e.key === ' ' || e.key === 'Enter') && current && e.target === document.body) { e.preventDefault(); setFlipped((f) => !f); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const dx = leaving === 'save' ? 520 : leaving === 'skip' ? -520 : drag || 0;
  const hint = dx > 30 ? 'save' : dx < -30 ? 'skip' : null;

  return createPortal(<div className="wdeck-backdrop" onClick={onClose}>
    <div className="wdeck" role="dialog" aria-modal="true" aria-label="Discover products" onClick={(e) => e.stopPropagation()}>
      <header className="wdeck-head">
        <strong>Discover</strong>
        <span aria-live="polite">{Math.min(index + 1, deck.length)}/{deck.length}</span>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close">×</button>
      </header>
      <div className="wdeck-stage">
        {current ? <>
          {deck.slice(index + 1, index + 3).reverse().map(({ product }, i, arr) => <div key={product.id} className="wdeck-card is-behind" style={{ '--depth': arr.length - i }} aria-hidden="true" />)}
          <article key={current.product.id} className={`wdeck-card${drag !== null ? ' is-dragging' : ''}`} style={{ transform: `translateX(${dx}px) rotate(${dx / 18}deg)` }}
            onPointerDown={(e) => { if (leaving) return; moved.current = false; startX.current = e.clientX; setDrag(0); e.currentTarget.setPointerCapture?.(e.pointerId); }}
            onPointerMove={(e) => { if (drag !== null) { const d = e.clientX - startX.current; if (Math.abs(d) > 6) moved.current = true; setDrag(d); } }}
            onPointerUp={() => { if (drag === null) return; if (drag > SWIPE) act('save'); else if (drag < -SWIPE) act('skip'); else { if (!moved.current) setFlipped((f) => !f); setDrag(null); } }}
            onPointerCancel={() => setDrag(null)}>
            {hint && <span className={`wdeck-stamp is-${hint}`} aria-hidden="true">{hint === 'save' ? 'Save' : 'Skip'}</span>}
            <div className={`wdeck-flip${flipped ? ' is-flipped' : ''}`}>
              <div className="wdeck-face is-front" aria-hidden={flipped}>
                <div className="wdeck-photo"><ProductTileImage product={current.product} imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '10%' }} letterNode={<ProductImageFallback style={{ position: 'absolute', inset: 0 }} />} /></div>
                <div className="wdeck-copy">
                  {current.product.brand && <span>{current.product.brand}</span>}
                  <strong>{current.product.name}</strong>
                  <div><b>{formatPrice(current.product).main}</b>{Number.isFinite(current.match) && current.match > 0 && current.reasons.length > 0 && <em>{Math.round(current.match)}% match</em>}</div>
                  <small className="wdeck-tap">Flip</small>
                </div>
              </div>
              <div className="wdeck-face is-back" aria-hidden={!flipped}>
                {current.product.brand && <span className="wdeck-back__brand">{current.product.brand}</span>}
                <strong className="wdeck-back__name">{current.product.name}</strong>
                {current.reasons.length > 0 ? (
                  <>
                    <span className="wdeck-back__label">Why it might fit</span>
                    <ul className="wdeck-back__reasons">{current.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                  </>
                ) : (
                  <span className="wdeck-back__label">{quizResults ? 'Not a direct match, but popular' : 'Take the quiz to see why things fit you'}</span>
                )}
                {(current.product.summary || current.product.description) && <p className="wdeck-back__summary">{String(current.product.summary || current.product.description).replace(/\s*\u2014\s*/g, ', ').slice(0, 160)}{String(current.product.summary || current.product.description).length > 160 ? '…' : ''}</p>}
                <div className="wdeck-back__price"><b>{formatPrice(current.product).main}</b>{formatPrice(current.product).sub && <small>{formatPrice(current.product).sub}</small>}</div>
              </div>
            </div>
          </article>
        </> : <div className="wdeck-done">
          <strong>That’s all for now</strong>
          <p>{savedCount ? `You saved ${savedCount}. They’re in Saved.` : 'Nothing saved this round.'}</p>
          <div><button type="button" onClick={() => { setIndex(0); setSavedCount(0); }}>Start over</button><button type="button" className="is-dark" onClick={onClose}>Done</button></div>
        </div>}
      </div>
      {current && <div className="wdeck-actions">
        <button type="button" className="wdeck-round" onClick={() => act('skip')} aria-label="Skip"><CloseIcon size={22} /></button>
        <button type="button" className="wdeck-view" onClick={() => onOpenProduct?.(current.product)}>Details</button>
        <button type="button" className="wdeck-round is-save" onClick={() => act('save')} aria-label="Save"><HeartIcon size={22} filled /></button>
      </div>}
      {current && <p className="wdeck-hint"><kbd>←</kbd> Skip · <kbd>Space</kbd> Flip · <kbd>→</kbd> Save</p>}
    </div>
  </div>, document.body);
}
