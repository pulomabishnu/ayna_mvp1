import { SAFETY_HOLD, MATCH_UNAVAILABLE, SAFETY_HOLD_LINE, SAFETY_HOLD_PRODUCT_LINE, HOLD_STATE_TITLE, HOLD_STATE_LINE } from '../../utils/matchDisplay.js';
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
  const title = HOLD_STATE_TITLE[hold.state] || SAFETY_HOLD;
  const line = HOLD_STATE_LINE[hold.state] || (hold.kind === 'product' ? SAFETY_HOLD_PRODUCT_LINE : SAFETY_HOLD_LINE);
  return (
    <div className={`ay-hold${compact ? ' is-compact' : ''} ${className}`.trim()} role="note" aria-label={`${title}. ${MATCH_UNAVAILABLE}`} data-hold-state={hold.state || undefined}>
      <p className="ay-hold__k"><b>{title}</b> · {MATCH_UNAVAILABLE}</p>
      <p className="ay-hold__line">{line}</p>
      <p className="ay-hold__why">{hold.reason}</p>
      {canFix
        ? <button type="button" className="ay-hold__fix" onClick={() => onFix(hold.fix.step)}>{hold.fix.label}</button>
        : hold.fix?.label && <p className="ay-hold__why">{hold.fix.label}</p>}
    </div>
  );
}
