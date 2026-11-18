import { useEffect, useRef, useState } from 'react';
import { takeTrialOptIn } from './trialOptIn.js';
import { requestPro } from '../utils/proApi.js';
import { PRO_CHANGED_EVENT } from './paywall.js';
import { toast } from '../utils/toast.js';
import posthog from 'posthog-js';
import TrialStart from './TrialStart.jsx';
import { useTrialAvailable, resetTrialStatus } from './useTrialAvailable.js';
import './trial.css';

const SEEN_KEY = 'ayna_trial_offer_seen_v1';
const seen = () => { try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; } };
const markSeen = () => { try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode */ } };

/** Nov 16 (founder: "when you sign up it tells you"): once, right after sign-up, offer the free week. Opt-in only. */
export default function TrialOffer() {
  // She may already have chosen on the sign-up page: ticked starts the trial here, unticked means don't ask again.
  // Mounted right after she signs in: anything cached was asked while signed out.
  const [choice] = useState(() => { resetTrialStatus(); return takeTrialOptIn(); });
  const [open, setOpen] = useState(() => !seen() && choice == null);
  const { checked, available, days } = useTrialAvailable(open || choice === 'yes');
  const started = useRef(false);
  useEffect(() => {
    if (choice != null) markSeen();
    if (choice !== 'yes' || !checked || !available || started.current) return;
    started.current = true;
    requestPro({ action: 'start_trial' }).then((r) => {
      if (!r?.started) return;
      try { posthog.capture('pro_trial_started', { source: 'signup_optin' }); } catch { /* analytics never blocks */ }
      try { window.dispatchEvent(new Event(PRO_CHANGED_EVENT)); } catch { /* old browser */ }
      toast(`Your free ayna Pro trial has started. It ends on its own in ${days} days.`);
    }).catch(() => toast('Couldn’t start your free trial. You can start it from Profile.'));
  }, [choice, checked, available, days]);
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
