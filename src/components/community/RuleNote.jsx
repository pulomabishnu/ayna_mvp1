import { CRISIS_LINE } from '../../utils/communityRules.js';

export function RuleNote({ id, check, onShowRules }) {
  return <div id={id} className="cr-note-slot" aria-live="polite">
    {check.blocked ? <p className="cr-note is-error">
      <span className="cr-note-dot" aria-hidden="true" />
      <span>{check.message}{onShowRules && <> <button type="button" className="cr-note-link" onClick={onShowRules}>See rules</button></>}</span>
    </p> : check.crisis ? <p className="cr-note is-care">
      <span className="cr-note-dot" aria-hidden="true" />
      <span>{CRISIS_LINE}</span>
    </p> : null}
  </div>;
}
