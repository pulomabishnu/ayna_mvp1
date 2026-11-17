import { useState } from 'react';
import TrialStart from './TrialStart.jsx';
import { useTrialAvailable } from './useTrialAvailable.js';
import './trial.css';

const SEEN_KEY = 'ayna_trial_offer_seen_v1';
const seen = () => { try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; } };
const markSeen = () => { try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode */ } };

/** Nov 16 (founder: "when you sign up it tells you"): once, right after sign-up, offer the free week. Opt-in only. */
export default function TrialOffer() {
  const [open, setOpen] = useState(() => !seen());
  const { checked, available, days } = useTrialAvailable(open);
  if (!open || !checked || !available) return null;
  const close = () => { markSeen(); setOpen(false); };
  return (
    <div className="ay-trialofr" role="dialog" aria-modal="true" aria-labelledby="ay-trialofr-h" onClick={close}>
      <section className="ay-trialofr__panel" onClick={(e) => e.stopPropagation()}>
        <span className="ay-trialofr__tag">Welcome gift</span>
        <h2 id="ay-trialofr-h">Try ayna Pro free for {days} days</h2>
        <p>Your health data in your matches, your full dashboard, every factor behind each match and unlimited reads.</p>
        <TrialStart source="signup" label="Start my free trial" onStarted={() => { markSeen(); window.setTimeout(() => setOpen(false), 1600); }} />
        <button type="button" className="ay-trialofr__later" onClick={close}>Not now</button>
      </section>
    </div>
  );
}
