import { useMemo, useState } from 'react';
import { factsToAsk, confirmFact, snooze } from '../../health/healthRefresh.js';
import './health-refresh.css';

/**
 * "Is this still right?" (src/health/healthRefresh.js). One old answer at a
 * time, in a small card: Still right (stamps it as confirmed today), Update
 * (opens that question) or Not now (asks again in 14 days). She decides;
 * ayna never changes her answers for her.
 *
 * quizResults: her saved answers. onSave(intake): saves her intake (the same
 * handler as editing one answer in place). onUpdate(step): opens the quiz at
 * that question.
 */
export default function HealthRefreshPrompt({ quizResults, onSave, onUpdate, variant = 'web' }) {
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const fact = useMemo(() => factsToAsk(quizResults)[0] || null, [quizResults, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!fact || !onSave) return null;
  const intake = quizResults?.fullHealthIntake || quizResults;
  const still = async () => {
    setBusy(true);
    try { await onSave(confirmFact(intake, fact.key)); } finally { setBusy(false); setTick((n) => n + 1); }
  };
  return (
    <section className={`ay-refresh is-${variant}`} aria-labelledby="ay-refresh-t">
      <p className="ay-refresh__k">Is this still right?</p>
      <h2 id="ay-refresh-t" className="ay-refresh__t">{fact.title}</h2>
      <p className="ay-refresh__said">{fact.said} <span>That was {fact.when}.</span></p>
      <p className="ay-refresh__why">We check this before suggesting products, so your picks stay safe for you.</p>
      <div className="ay-refresh__acts">
        <button type="button" className="ay-refresh__yes" disabled={busy} onClick={still}>{busy ? 'Saving…' : 'Still right'}</button>
        {onUpdate && <button type="button" className="ay-refresh__upd" onClick={() => onUpdate(fact.step)}>Update</button>}
        <button type="button" className="ay-refresh__later" onClick={() => { snooze(fact.key); setTick((n) => n + 1); }}>Not now</button>
      </div>
    </section>
  );
}
