import { SAFETY_HOLD, MATCH_UNAVAILABLE, SAFETY_HOLD_LINE, SAFETY_HOLD_PRODUCT_LINE } from '../../utils/matchDisplay.js';
import './safety-hold.css';

/**
 * A product held back for safety (founder, Oct 24): "Safety hold · Match
 * unavailable", one line on why, the exact reason, and what resolves it.
 * `onFix(step)` opens that setup question; product-side gaps need nothing
 * from her. Never a percent. Used by the product page, Why, Compare and Ask.
 */
export default function SafetyHoldNote({ hold, onFix, compact = false, className = '' }) {
  if (!hold) return null;
  const canFix = Boolean(hold.fix?.step && onFix);
  return (
    <div className={`ay-hold${compact ? ' is-compact' : ''} ${className}`.trim()} role="note" aria-label={`${SAFETY_HOLD}. ${MATCH_UNAVAILABLE}`}>
      <p className="ay-hold__k"><b>{SAFETY_HOLD}</b> · {MATCH_UNAVAILABLE}</p>
      <p className="ay-hold__line">{hold.kind === 'product' ? SAFETY_HOLD_PRODUCT_LINE : SAFETY_HOLD_LINE}</p>
      <p className="ay-hold__why">{hold.reason}</p>
      {canFix
        ? <button type="button" className="ay-hold__fix" onClick={() => onFix(hold.fix.step)}>{hold.fix.label}</button>
        : hold.fix?.label && <p className="ay-hold__why">{hold.fix.label}</p>}
    </div>
  );
}
