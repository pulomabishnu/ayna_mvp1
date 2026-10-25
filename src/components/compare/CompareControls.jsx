import { compareStore, useCompare, COMPARE_MAX, COMPARE_MIN } from '../../utils/compareStore.js';
import './compare.css';

/**
 * Select mode for comparing (team direction 21): a "Compare" switch in a
 * toolbar, and a pick button on each product card while it is on.
 */
export function CompareToggle({ onOpenCompare, className = '' }) {
  const c = useCompare();
  if (!c.selecting) {
    return <button type="button" className={`ay-cmpt ${className}`.trim()} onClick={() => compareStore.setSelecting(true)}>{c.count ? `Compare (${c.count})` : 'Compare'}</button>;
  }
  return (
    <span className={`ay-cmpt-on ${className}`.trim()} role="group" aria-label="Compare products">
      <span className="ay-cmpt-on__count" role="status">{c.count ? `${c.count} of ${COMPARE_MAX} picked` : `Pick ${COMPARE_MIN} to ${COMPARE_MAX} products`}</span>
      <button type="button" className="ay-cmpt is-primary" disabled={c.count < COMPARE_MIN} onClick={() => { compareStore.setSelecting(false); (onOpenCompare || (() => compareStore.open()))(); }}>Compare{c.count >= COMPARE_MIN ? ` ${c.count}` : ''}</button>
      <button type="button" className="ay-cmpt is-text" onClick={() => compareStore.setSelecting(false)}>Done</button>
    </span>
  );
}

/** On a product card while select mode is on. Renders nothing otherwise. */
export function CompareCheck({ product, onOpenCompare }) {
  const c = useCompare();
  if (!c.selecting || !product?.id || product.userAdded) return null;
  const on = c.ids.includes(product.id);
  const disabled = !on && c.full;
  return (
    <span className="ay-cmpc">
      <button type="button" className={`ay-cmpc__pick${on ? ' is-on' : ''}`} aria-pressed={on} disabled={disabled} onClick={(e) => { e.preventDefault(); e.stopPropagation(); compareStore.toggle(product); }}>
        <span className="ay-cmpc__box" aria-hidden="true">{on && <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}</span>
        {disabled ? `${COMPARE_MAX} picked` : 'Compare'}
        <span className="sr-only"> {product.name}</span>
      </button>
      {/* Once, on the last product picked (it repeated under every pick). */}
      {on && c.count >= COMPARE_MIN && c.ids[c.ids.length - 1] === product.id && (onOpenCompare || compareStore.canOpen()) && <button type="button" className="ay-cmpc__go" onClick={(e) => { e.preventDefault(); e.stopPropagation(); compareStore.setSelecting(false); (onOpenCompare || (() => compareStore.open()))(); }}>Compare {c.count} now</button>}
    </span>
  );
}
