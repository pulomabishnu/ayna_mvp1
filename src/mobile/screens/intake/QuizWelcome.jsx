import { useEffect, useRef, useState } from 'react';
import { haptic } from '../../../utils/haptics.js';
import './quiz-welcome.css';

/**
 * The first page of the first quiz (founder, Nov 13: "make it clear in the beginning, a page that's
 * animated and cute talking about the quiz, then Continue"; focus group, Angelina: definitions were
 * hard to find). One page, three short lines, one live demo of press-and-hold, one button.
 *
 * Research: NN/g, onboarding: show the one thing people can't discover on their own (press-and-hold
 * has no visual cue), keep it to one screen, always skippable. Motion is functional (the demo) and
 * short (150–250ms entrances); reduced motion shows the finished state.
 *
 * Shown once per device (WELCOME_KEY). Nothing here is saved to her profile.
 */
export const WELCOME_KEY = 'ayna_quiz_welcome_seen_v1';

export function quizWelcomeSeen() {
  try { return localStorage.getItem(WELCOME_KEY) === '1'; } catch { return true; }
}

function markSeen() {
  try { localStorage.setItem(WELCOME_KEY, '1'); } catch { /* storage unavailable */ }
}

export default function QuizWelcome({ onDone }) {
  const [open, setOpen] = useState(() => !quizWelcomeSeen());
  const goRef = useRef(null);
  const close = () => { markSeen(); haptic('light'); setOpen(false); onDone?.(); };
  useEffect(() => {
    if (!open) return undefined;
    goRef.current?.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!open) return null;
  return (
    <section className="qw" role="dialog" aria-modal="true" aria-labelledby="qw-title">
      <header className="qw-top">
        <span className="qw-kicker">Before you start</span>
        <button type="button" className="qw-skip" onClick={close}>Skip</button>
      </header>
      <div className="qw-body">
        <h1 className="qw-title" id="qw-title">A quick quiz, then your matches</h1>
        <ol className="qw-steps">
          <li style={{ '--i': 0 }}>
            <span className="qw-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg></span>
            <span><b>About a minute.</b> A few questions about what you want help with.</span>
          </li>
          <li style={{ '--i': 1 }}>
            <span className="qw-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="5" rx="2.5" /><rect x="4" y="14" width="16" height="5" rx="2.5" /><path d="M7 7.5h.01M7 16.5h.01" /></svg></span>
            <span><b>Pick all that fit.</b> Not sure is always an answer.</span>
          </li>
          <li style={{ '--i': 2 }}>
            <span className="qw-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 11V6.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a5 5 0 0 1-5 5h-1.2a5 5 0 0 1-4.1-2.1L5 14.5a1.6 1.6 0 0 1 2.5-2L9 14" /></svg></span>
            <span><b>Press and hold</b> any answer to see what it means.</span>
          </li>
        </ol>
        {/* The one thing you can't see on the screen, shown: a finger holds an answer, a definition appears. */}
        <div className="qw-demo" aria-hidden="true">
          <span className="qw-chip">Perimenopause<span className="qw-finger"><svg viewBox="0 0 44 44"><circle className="qw-ring" cx="22" cy="22" r="19" /></svg><i /></span></span>
          <span className="qw-def">The years before menopause, when periods start to change.</span>
        </div>
      </div>
      <footer className="qw-foot">
        <button type="button" className="qw-go" ref={goRef} onClick={close}>Start the quiz<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
        <p className="qw-note">Free. See your top matches before you sign up.</p>
      </footer>
    </section>
  );
}
