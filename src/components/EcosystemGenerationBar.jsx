import React, { useEffect, useRef, useState } from 'react';
import { peekGeneration, subscribeIfActive } from '../utils/ecosystemGenerationStore';

/**
 * Global "your ecosystem is building" indicator — visible on every page, not
 * just My Ecosystem. Ecosystem generation already survives leaving the My
 * Ecosystem page (see ecosystemGenerationStore.js's GENERATION_ABANDON_GRACE_MS);
 * this component is the missing piece that surfaces that already-running
 * work while the user is elsewhere on the site, and tells them when it's done.
 *
 * SAFETY CONTRACT: this component must NEVER start a generation. It only
 * observes one that MyEcosystem's own effect already started, via
 * peekGeneration/subscribeIfActive — neither of which can create a record or
 * fire an onStart-style side effect (unlike subscribeToGeneration, which a
 * component with a "start if missing" job would use instead). Every poll
 * tick below re-checks peekGeneration and only ever attaches to whatever it
 * finds; it never asks the store to make something exist.
 */
export default function EcosystemGenerationBar({ intakeFingerprint, onViewEcosystem }) {
  const [rec, setRec] = useState(null); // { loading, startedAt, error } snapshot, or null when nothing active
  // The actual Date.now() reading lives in state (updated by the ticking
  // effect below) rather than being read directly during render — a render
  // body calling Date.now() itself is an impure read (React's purity rule),
  // since the same render could be invoked more than once and see a
  // different value each time.
  const [now, setNow] = useState(() => Date.now());
  const [readyPopup, setReadyPopup] = useState(false); // shows once, on the loading:true -> false (success) transition
  const [dismissed, setDismissed] = useState(false); // user closed the persistent bar for THIS generation

  const subscribedRecRef = useRef(null); // identity of the store record we're currently attached to (or null)
  const unsubscribeRef = useRef(null);
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    // No signed-in personalized session -> nothing to ever observe. Detach
    // from whatever we were watching (e.g. the user just signed out).
    if (!intakeFingerprint) {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      subscribedRecRef.current = null;
      setRec(null);
      setDismissed(false);
      return undefined;
    }

    const attachIfNeeded = () => {
      const active = peekGeneration(intakeFingerprint);
      // Already attached to the current record (including "both null" —
      // nothing active, already know it). Nothing to do this tick.
      if (active === subscribedRecRef.current) return;

      // The active record changed identity (a new generation started, the
      // one we knew about finished + got garbage-collected, or a refresh
      // discarded and replaced it) — drop the old subscription and attach to
      // whatever's there now, including nothing.
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      subscribedRecRef.current = active;

      if (!active) {
        setRec(null);
        return;
      }

      // A brand-new record we're attaching to means a brand-new generation —
      // reset the one-shot "ready" popup and the dismiss state so they apply
      // to THIS run, not a stale decision from a previous one.
      setReadyPopup(false);
      setDismissed(false);
      wasLoadingRef.current = false;

      unsubscribeRef.current = subscribeIfActive(intakeFingerprint, (r) => {
        setRec({ loading: r.loading, startedAt: r.startedAt, error: r.error });
      });
    };

    attachIfNeeded();
    // Polling, not an event, because nothing broadcasts "a generation just
    // started" — MyEcosystem's own effect is the only thing that creates a
    // record, and it may do so on a page this component isn't mounted under
    // (moot here, since this always renders from App.jsx, but the poll is
    // also what notices a *finished* record being GC'd and a *new* one
    // replacing it under the same fingerprint after a refresh).
    const poll = window.setInterval(attachIfNeeded, 1000);
    return () => {
      window.clearInterval(poll);
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      subscribedRecRef.current = null;
    };
  }, [intakeFingerprint]);

  // Live mm:ss timer tick while a generation is actually loading.
  useEffect(() => {
    if (!rec?.loading) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [rec?.loading]);

  // Detect the loading:true -> false transition to fire the one-shot "ready" popup.
  useEffect(() => {
    if (!rec) { wasLoadingRef.current = false; return; }
    if (wasLoadingRef.current && !rec.loading && !rec.error) {
      setReadyPopup(true);
    }
    wasLoadingRef.current = rec.loading;
  }, [rec]);

  if (!rec) return null;

  const elapsedMs = rec.startedAt ? Math.max(0, now - rec.startedAt) : 0;
  const mm = Math.floor(elapsedMs / 60000);
  const ss = Math.floor((elapsedMs % 60000) / 1000).toString().padStart(2, '0');

  return (
    <>
      {rec.loading && !dismissed && (
        <div className="eco-gen-bar" role="status" aria-live="polite">
          <span className="eco-gen-bar__spinner" aria-hidden="true" />
          <span>Building your ecosystem&hellip; {mm}:{ss}</span>
          <button
            type="button"
            className="eco-gen-bar__dismiss"
            onClick={() => setDismissed(true)}
            aria-label="Hide"
            title="Hide (it keeps building in the background)"
          >
            &times;
          </button>
        </div>
      )}

      {readyPopup && (
        <div className="eco-gen-popup" role="alert">
          <div className="eco-gen-popup__body">
            <span className="eco-gen-popup__icon" aria-hidden="true">🌸</span>
            <div>
              <p className="eco-gen-popup__title">Your ecosystem is ready!</p>
              <p className="eco-gen-popup__subtitle">Take a look at what Ayna put together for you.</p>
            </div>
          </div>
          <div className="eco-gen-popup__actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => { setReadyPopup(false); onViewEcosystem?.(); }}
            >
              View my ecosystem
            </button>
            <button
              type="button"
              className="eco-gen-popup__close"
              onClick={() => setReadyPopup(false)}
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
}
