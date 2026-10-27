import React from 'react';
import './MatchPill.css';
import { shownMatchPercent, matchText, PARTIAL_FIT, SAFETY_HOLD, MATCH_UNAVAILABLE } from '../utils/matchDisplay.js';

/**
 * The one way a profile match is shown (founder's pick): an ink pill,
 * bold "88%" + lighter "match". No ring, no underline, no tooltip.
 * With onClick it is a button that opens the Why view.
 */
export default function MatchPill({ percent, onClick, size = 'md', label, className = '', hold = false }) {
  // Held back for safety: "Safety hold", never a number (not even 0%).
  if (hold) {
    const holdCls = `ay-match-pill is-${size} is-hold ${className}`.trim();
    const body = <span>{SAFETY_HOLD}</span>;
    const named = label || `${SAFETY_HOLD}. ${MATCH_UNAVAILABLE}`;
    return onClick ? <button type="button" className={holdCls} aria-label={`${named}. See why`} onClick={onClick}>{body}</button> : <span className={holdCls} aria-label={named}>{body}</span>;
  }
  if (!Number.isFinite(percent) || percent <= 0) return null;
  // Under 50: no number, just "Partial fit" (src/utils/matchDisplay.js, one rule everywhere).
  const pct = shownMatchPercent(percent);
  const cls = `ay-match-pill is-${size}${pct == null ? ' is-partial' : ''} ${className}`.trim();
  const text = matchText(percent);
  const body = pct == null ? <span>{PARTIAL_FIT}</span> : <><strong>{pct}%</strong><span>match</span></>;
  const named = pct == null ? (label && !/\d%/.test(label) ? label : text) : label;
  if (!onClick) return <span className={cls} aria-label={named || text}>{body}</span>;
  return (
    <button type="button" className={cls} aria-label={named || `${text}. See why`} onClick={onClick}>
      {body}
    </button>
  );
}
