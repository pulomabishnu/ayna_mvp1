import { useCallback, useEffect, useRef, useState } from 'react';
import './quiz-intro.css';

// A few seconds at the very start of the quiz (app and website) that shows
// the two helpers once: the "i" next to a question, and press-and-hold on an
// answer. Shown once per device; replaces the per-step tip pills.
const QUIZ_INTRO_KEY = 'ayna_quiz_intro_seen_v1';
const DURATION_MS = 4600;

function quizIntroSeen() {
  try { return localStorage.getItem(QUIZ_INTRO_KEY) === '1'; } catch { return true; }
}
function markSeen() {
  try { localStorage.setItem(QUIZ_INTRO_KEY, '1'); } catch { /* storage unavailable */ }
}
function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/** Renders the intro once per device; renders nothing after it has been seen. */
export default function QuizIntro({ variant = 'app' }) {
  const [open, setOpen] = useState(() => !quizIntroSeen());
  const [leaving, setLeaving] = useState(false);
  const [still] = useState(prefersReducedMotion);
  const skipRef = useRef(null);
  const close = useCallback(() => {
    markSeen();
    if (still) { setOpen(false); return; }
    setLeaving(true);
    setTimeout(() => setOpen(false), 220);
  }, [still]);

  useEffect(() => {
    if (!open) return undefined;
    skipRef.current?.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    // Reduced motion: a still card that waits for "Got it" instead of moving on by itself.
    const timer = still ? null : setTimeout(() => close(), DURATION_MS);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(timer); };
  }, [open, still, close]);

  if (!open) return null;
  return (
    <div className={`qi qi--${variant}${still ? ' is-still' : ''}${leaving ? ' is-leaving' : ''}`} role="dialog" aria-modal="true" aria-labelledby="qi-title" onClick={close}>
      <div className="qi-card" onClick={(e) => e.stopPropagation()} style={{ '--qi-dur': `${DURATION_MS}ms` }}>
        <div className="qi-top">
          <span className="qi-tag">Quick tip</span>
          <button type="button" className="qi-skip" ref={skipRef} onClick={close}>{still ? 'Got it' : 'Skip'}</button>
        </div>
        <h2 className="qi-title" id="qi-title">Two helpers</h2>

        <div className="qi-demo qi-demo--info">
          <div className="qi-stage" aria-hidden="true">
            <div className="qi-mock-q">
              <span className="qi-mock-title">Your life stage</span>
              <span className="qi-mock-i">i</span>
            </div>
            <span className="qi-bubble qi-bubble--info">More about this question</span>
            <span className="qi-finger qi-finger--tap"><i /></span>
          </div>
          <p className="qi-caption">Tap the <b className="qi-inline-i" aria-label="i">i</b> for more about a question</p>
        </div>

        <div className="qi-demo qi-demo--hold">
          <div className="qi-stage" aria-hidden="true">
            <span className="qi-mock-chip">Perimenopause</span>
            <span className="qi-bubble qi-bubble--hold">The years before menopause</span>
            <span className="qi-finger qi-finger--hold">
              <svg viewBox="0 0 48 48"><circle className="qi-ring-track" cx="24" cy="24" r="21" /><circle className="qi-ring" cx="24" cy="24" r="21" /></svg>
              <i />
            </span>
          </div>
          <p className="qi-caption">Hold an answer to see what it means</p>
        </div>

        {!still && <span className="qi-timer" aria-hidden="true"><i /></span>}
      </div>
    </div>
  );
}
