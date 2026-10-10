import { useEffect, useMemo, useRef, useState } from 'react';
import ProductImage from './ProductImage.jsx';
import EmptyState from './EmptyState.jsx';
import { getProfileMatchPercentForProduct } from '../../data/products.js';

// One-card-at-a-time product discovery. Drag right (or tap Save) to save,
// left (or tap Skip) to pass. Uses the same products the Shop grid is
// showing, ordered by match when the person has a profile. Nothing here is
// invented: saving goes through the normal save flow.

const SWIPE_DISTANCE = 90;
const DECK_SIZE = 30;

function imageFor(product) {
  return product?.image || product?.imageUrl || product?.images?.[0];
}

export default function DiscoverDeck({ products = [], quizAnswers = null, savedProducts = {}, onToggleSaved, onOpenProduct, onClose }) {
  const deck = useMemo(() => {
    const withMatch = products.slice(0, 200).map((product) => ({
      product,
      match: quizAnswers ? getProfileMatchPercentForProduct(product, quizAnswers) : null,
    }));
    if (quizAnswers) withMatch.sort((a, b) => (b.match || 0) - (a.match || 0));
    return withMatch.slice(0, DECK_SIZE);
  }, [products, quizAnswers]);

  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(null);
  const [leaving, setLeaving] = useState(null);
  const startX = useRef(0);
  const closeRef = useRef(null);

  useEffect(() => { closeRef.current?.focus(); }, []);

  const current = deck[index];
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function act(kind) {
    if (!current || leaving) return;
    if (kind === 'save' && !savedProducts[current.product.id]) onToggleSaved?.(current.product);
    setDrag(null);
    if (reduced) { setIndex((i) => i + 1); return; }
    setLeaving(kind);
    window.setTimeout(() => { setLeaving(null); setIndex((i) => i + 1); }, 260);
  }

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key === 'ArrowRight') act('save');
      if (event.key === 'ArrowLeft') act('skip');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onPointerDown = (event) => {
    if (leaving) return;
    startX.current = event.clientX;
    setDrag(0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event) => { if (drag !== null) setDrag(event.clientX - startX.current); };
  const onPointerUp = () => {
    if (drag === null) return;
    if (drag > SWIPE_DISTANCE) act('save');
    else if (drag < -SWIPE_DISTANCE) act('skip');
    else setDrag(null);
  };

  const dx = leaving === 'save' ? 420 : leaving === 'skip' ? -420 : drag || 0;
  const hint = dx > 30 ? 'save' : dx < -30 ? 'skip' : null;

  return (
    <div className="ay-deck" role="dialog" aria-modal="true" aria-label="Discover products">
      <header className="ay-deck-head">
        <button ref={closeRef} type="button" className="ay-deck-close" onClick={onClose} aria-label="Close discover">×</button>
        <strong>Discover</strong>
        <span aria-live="polite">{Math.min(index + 1, deck.length)}/{deck.length}</span>
      </header>

      <div className="ay-deck-stage">
        {current ? (
          <>
            {deck.slice(index + 1, index + 3).reverse().map(({ product }, i, arr) => (
              <div key={product.id} className="ay-deck-card is-behind" style={{ '--depth': arr.length - i }} aria-hidden="true">
                <div className="ay-deck-photo"><ProductImage src={imageFor(product)} alt="" allowBrandLogo={product.type === 'digital'} /></div>
              </div>
            ))}
            <article key={current.product.id} className={`ay-deck-card${drag !== null ? ' is-dragging' : ''}`}
              style={{ transform: `translateX(${dx}px) rotate(${dx / 18}deg)` }}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => setDrag(null)}>
              {hint && <span className={`ay-deck-stamp is-${hint}`} aria-hidden="true">{hint === 'save' ? 'Save' : 'Skip'}</span>}
              <div className="ay-deck-photo"><ProductImage src={imageFor(current.product)} alt={current.product.name} allowBrandLogo={current.product.type === 'digital'} /></div>
              <div className="ay-deck-copy">
                {current.product.brand && <span>{current.product.brand}</span>}
                <strong>{current.product.name}</strong>
                <div className="ay-deck-meta">
                  {current.product.price && <b>{String(current.product.price)}</b>}
                  {Number.isFinite(current.match) && current.match > 0 && <em>{Math.round(current.match)}% match</em>}
                </div>
              </div>
            </article>
          </>
        ) : (
          <EmptyState art="spark" tone="butter" title="That’s all for now" body="Saved products are in Saved." actionLabel="Start over" onAction={() => setIndex(0)} secondaryLabel="Done" onSecondary={onClose} />
        )}
      </div>

      {current && (
        <div className="ay-deck-actions">
          <button type="button" className="ay-deck-btn is-skip" onClick={() => act('skip')} aria-label="Skip">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
          <button type="button" className="ay-deck-btn is-view" onClick={() => onOpenProduct?.(current.product)}>Details</button>
          <button type="button" className="ay-deck-btn is-save" onClick={() => act('save')} aria-label={savedProducts[current.product.id] ? 'Already saved, next' : 'Save'}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16l-6-4-6 4V4Z" /></svg>
          </button>
        </div>
      )}
      {current && <p className="ay-deck-hint">Swipe right to save, left to skip</p>}
    </div>
  );
}
