import { useId, useState } from 'react';
import { NOT_USEFUL_REASONS } from './notUseful.js';
import '../../styles/onboarding.css';

/**
 * "Not useful" with an optional reason (UX spec section 9). Used on Today
 * items and on match explanations. Tap "Not useful", then pick a reason, or
 * "Just hide it" to skip giving one (stored as no_reason). The caller stores it with
 * decisionEngine's dismiss() through the Today store.
 *
 *   already_knew    I already knew this
 *   not_relevant    Not relevant to me
 *   dont_show_type  Don't show this type
 *   info_changed    My information changed (the caller opens that part of the profile)
 */

export default function NotUsefulMenu({ onPick, label = 'Not useful', className = '' }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const pick = (reason) => { setOpen(false); onPick?.(reason); };
  return (
    <span className="ay-nu">
      <button type="button" className={`ay-nu__toggle ${className}`.trim()} aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>{label}</button>
      {open && (
        <span id={id} className="ay-nu__menu" role="group" aria-label="Why is this not useful?">
          <span className="ay-nu__q">Why? (optional)</span>
          {NOT_USEFUL_REASONS.map((r) => <button key={r.id} type="button" className="ay-nu__reason" onClick={() => pick(r.id)}>{r.label}</button>)}
          <button type="button" className="ay-nu__skip" onClick={() => pick('no_reason')}>Just hide it</button>
        </span>
      )}
    </span>
  );
}
