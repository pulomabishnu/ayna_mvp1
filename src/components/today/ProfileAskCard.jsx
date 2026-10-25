import { useState } from 'react';
import { nextProgressiveAsk } from '../../mobile/utils/profileCompleteness.js';
import { dismiss } from '../../health/decisionEngine.js';
import { readToday, writeToday } from '../../health/todayStore.js';

/**
 * One question from the first run she skipped, asked later on Today, one at
 * a time (profileCompleteness.js nextProgressiveAsk). "Answer" opens that one
 * question; "Not now" hides it for a while through the Today store.
 * Rendered as one more row in Today's list, styled like Today's own items.
 */
export default function ProfileAskCard({ intake, today, onAnswer, asList = false, variant = 'app' }) {
  const [dismissed, setDismissed] = useState(() => { try { return readToday().dismissed || {}; } catch { return {}; } });
  const ask = nextProgressiveAsk(intake?.fullHealthIntake || intake, { dismissed, today });
  if (!ask || !onAnswer) return null;
  const later = () => {
    try { setDismissed(writeToday('dismissed', dismiss(readToday().dismissed, ask.id, today, 'not_now')).dismissed || {}); } catch { /* storage unavailable */ }
  };
  const row = (
    <li className="ay-today__item is-wellness is-ask is-profile-ask">
      <p className="ay-today__kicker">A quick question</p>
      <h3 className="ay-today__title">{ask.title}</h3>
      {/* The website's tab is still Today; the app's is Home (QA round 2). */}
      <p className="ay-today__why">{variant === 'web' ? String(ask.why || '').replace(/\bHome\b/g, 'Today') : ask.why}</p>
      <div className="ay-today__actions">
        <button type="button" className="ay-today__primary" onClick={() => onAnswer(ask.stepId)}>Answer</button>
        <button type="button" className="ay-today__text" onClick={later}>Not now</button>
      </div>
    </li>
  );
  return asList ? <ul className="ay-today__list">{row}</ul> : row;
}
