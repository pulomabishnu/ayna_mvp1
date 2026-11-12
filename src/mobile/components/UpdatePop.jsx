import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ProductTileImage from '../../components/ProductTileImage.jsx';
import './update-pop.css';

/**
 * "What's new for you" (founder, Nov 11: "when you update stuff on ayna, a popup with the updates,
 * whether it's products, and you can choose to add to your routine... make it look cool like a
 * Spotify Wrapped, it doesn't have to be multiple, just showing you what updates you're getting").
 *
 * One Wrapped-style card: a big number, one headline, the new products as photos. Each product
 * opens its page; "Not for me" takes it back out. Shown only when something really changed.
 * Research: Spotify Wrapped / Apple "What's New" sheets use one bold stat + visuals, one primary
 * action, easy dismiss (tap outside, Escape, swipe down not required).
 */
export default function UpdatePop({ update, onClose, onOpenProduct, onRemove, onSeeAll, onGoal = null, onShop = null, inEcosystem = () => true }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!update) return undefined;
    ref.current?.querySelector('h2')?.focus?.({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [update, onClose]);
  if (!update || typeof document === 'undefined') return null;
  const products = (update.products || []).filter((p) => p?.id).slice(0, 6);
  const n = products.length;
  // 'suggest': ideas she can add (after a quiz update, a new connection or a log), not products already added.
  const suggest = update.mode === 'suggest';
  const host = document.querySelector('.ayna-mobile') || document.body;
  return createPortal(
    <div className="ay-upop" role="presentation">
      <div className="ay-upop__dim" aria-hidden="true" onClick={onClose} />
      <section ref={ref} className="ay-upop__card" role="dialog" aria-modal="true" aria-labelledby="ay-upop-h">
        <button type="button" className="ay-upop__x" aria-label="Close" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        <p className="ay-upop__kicker">{update.kicker || 'What’s new for you'}</p>
        {!suggest && <p className="ay-upop__num" aria-hidden="true">{n}</p>}
        <h2 id="ay-upop-h" tabIndex={-1}>{update.title || `${n} new ${n === 1 ? 'pick' : 'picks'} for you`}</h2>
        {update.sub && <p className="ay-upop__sub">{update.sub}</p>}
        {update.tips?.length > 0 && <ul className="ay-upop__tips">{update.tips.map((t) => <li key={t}>{t}</li>)}</ul>}
        {update.source && <p className="ay-upop__src">From <a href={update.source.url} target="_blank" rel="noopener noreferrer">{update.source.label}</a></p>}
        {update.goal && onGoal && <button type="button" className="ay-upop__goal" onClick={() => onGoal(update.goal)}>{`Make ${update.goalLabel || 'this'} a goal`}</button>}
        <ul className="ay-upop__list">
          {products.map((p, i) => {
            const kept = inEcosystem(p.id);
            return (
              <li key={p.id} style={{ '--i': i }} className={kept || suggest ? '' : 'is-removed'}>
                <button type="button" className="ay-upop__item" onClick={() => onOpenProduct?.(p)}>
                  <span className="ay-upop__photo"><ProductTileImage product={p} alt="" letterNode={<span aria-hidden="true">{(p.brand || p.name || '?').slice(0, 1)}</span>} /></span>
                  <span className="ay-upop__name"><b>{p.name}</b>{p.reason && <small>{p.reason}</small>}</span>
                </button>
                {onRemove && (suggest
                  ? <button type="button" className="ay-upop__add" disabled={kept} onClick={() => onRemove(p)} aria-label={kept ? `${p.name} is in your routine` : `Add ${p.name} to your routine`}>{kept ? 'In your routine' : 'Add to routine'}</button>
                  : <button type="button" className="ay-upop__remove" onClick={() => onRemove(p)} aria-label={kept ? `Not for me: ${p.name}` : `Add back ${p.name}`}>{kept ? 'Not for me' : 'Add back'}</button>)}
              </li>
            );
          })}
        </ul>
        {suggest && update.shop && onShop
          ? <button type="button" className="ay-upop__primary" onClick={() => onShop(update.shop)}>See products for this</button>
          : <button type="button" className="ay-upop__primary" onClick={suggest ? onClose : (onSeeAll || onClose)}>{suggest ? 'Done' : onSeeAll ? 'See my products' : 'Done'}</button>}
      </section>
    </div>,
    host,
  );
}
