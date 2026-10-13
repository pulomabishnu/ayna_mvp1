import React from 'react';
import './MatchPill.css';

/**
 * The one way a profile match is shown (founder's pick): an ink pill,
 * bold "88%" + lighter "match". No ring, no underline, no tooltip.
 * With onClick it is a button that opens the Why view.
 */
export default function MatchPill({ percent, onClick, size = 'md', label, className = '' }) {
  if (!Number.isFinite(percent) || percent <= 0) return null;
  const pct = Math.round(percent);
  const cls = `ay-match-pill is-${size} ${className}`.trim();
  const body = <><strong>{pct}%</strong><span>match</span></>;
  if (!onClick) return <span className={cls} aria-label={label || `${pct}% match`}>{body}</span>;
  return (
    <button type="button" className={cls} aria-label={label || `${pct}% match. See why`} onClick={onClick}>
      {body}
    </button>
  );
}
