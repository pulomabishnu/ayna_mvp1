import './community-shared.css';

// Verified check + title ("CEO, ayna") next to a team member's name, so people
// can see why the account is verified.
export function VerifiedBadge({ title, compact = false }) {
  if (!title) return null;
  return <span className={`cr-verified${compact ? ' is-compact' : ''}`} title={`Verified: ${title}`}>
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path className="cr-verified-seal" d="M12 1.8l2.5 1.9 3.1-.2 1 3 2.6 1.7-.9 3 .9 3-2.6 1.7-1 3-3.1-.2L12 22.2l-2.5-1.9-3.1.2-1-3-2.6-1.7.9-3-.9-3 2.6-1.7 1-3 3.1.2z" />
      <path className="cr-verified-tick" d="m7.8 12.3 2.8 2.8 5.6-5.8" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span className="cr-sr">Verified, </span><span className="cr-verified-title">{title}</span>
  </span>;
}
