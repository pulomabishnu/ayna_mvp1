import { useCallback, useEffect, useRef, useState } from 'react';
import { readTour } from '../../tutorial/tourStore.js';
import './quiz-intro.css';

// A few seconds at the very start of the quiz (app and website) that shows
// the two helpers: the "i" next to a question, and press-and-hold on an
// answer. Shown every time someone starts building their Ecosystem, unless
// she ticked "Don't show again" (stored under QUIZ_INTRO_HIDDEN_KEY).
// Replaces the older once-per-device key, ayna_quiz_intro_seen_v1.
const QUIZ_INTRO_HIDDEN_KEY = 'ayna_quiz_intro_hidden_v1';
const DURATION_MS = 4600;

function quizIntroHidden() {
  try { return localStorage.getItem(QUIZ_INTRO_HIDDEN_KEY) === '1'; } catch { return false; }
}
function setHidden(hidden) {
  try {
    if (hidden) localStorage.setItem(QUIZ_INTRO_HIDDEN_KEY, '1');
    else localStorage.removeItem(QUIZ_INTRO_HIDDEN_KEY);
  } catch { /* storage unavailable */ }
}
// Tips switched off in Settings (tutorial/tourStore.js): no Quick tip either (QA, Oct 25).
function tipsSwitchedOff() {
  try { return readTour().enabled === false; } catch { return false; }
}
function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/**
 * Renders the intro on mount (each new quiz start) unless hidden for good.
 * `enabled={false}` skips it, e.g. when the quiz reopens mid-way.
 */
export default function QuizIntro({ variant = 'app', enabled = true }) {
  const [tipsOff] = useState(tipsSwitchedOff);
  const [open, setOpen] = useState(() => enabled && !tipsOff && !quizIntroHidden());
  const [leaving, setLeaving] = useState(false);
  const [still] = useState(prefersReducedMotion);
  // Touching the checkbox stops the auto-advance so it never closes under her finger.
  const [paused, setPaused] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const skipRef = useRef(null);
  const close = useCallback(() => {
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
    const timer = still || paused ? null : setTimeout(() => close(), DURATION_MS);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(timer); };
  }, [open, still, paused, close]);

  // She ticked "Don't show again": a tiny one-time hint on the first step
  // keeps hold-to-define discoverable without replaying the whole intro.
  const [hintGone, setHintGone] = useState(false);
  useEffect(() => {
    if (open || !enabled || hintGone) return undefined;
    const t = setTimeout(() => setHintGone(true), 7000);
    return () => clearTimeout(t);
  }, [open, enabled, hintGone]);
  if (!open) {
    if (!enabled || tipsOff || hintGone || !quizIntroHidden()) return null;
    return (
      <p className={`qi-mini qi-mini--${variant}`} role="note">
        Hold any answer to see what it means
        <button type="button" aria-label="Dismiss tip" onClick={() => setHintGone(true)}>×</button>
      </p>
    );
  }
  const manual = still || paused;
  return (
    <div className={`qi qi--${variant}${still ? ' is-still' : ''}${paused ? ' is-paused' : ''}${leaving ? ' is-leaving' : ''}`} role="dialog" aria-modal="true" aria-labelledby="qi-title" onClick={close}>
      <div className="qi-card" onClick={(e) => e.stopPropagation()} style={{ '--qi-dur': `${DURATION_MS}ms` }}>
        <div className="qi-top">
          <span className="qi-tag">Quick tip</span>
          <button type="button" className="qi-skip" onClick={close}>Skip</button>
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
            {/* The finger sits in the chip's empty end so it never covers the answer text. */}
            <span className="qi-mock-chip qi-mock-chip--hold">Perimenopause
              <span className="qi-finger qi-finger--hold">
                <svg viewBox="0 0 48 48"><circle className="qi-ring-track" cx="24" cy="24" r="21" /><circle className="qi-ring" cx="24" cy="24" r="21" /></svg>
                <i />
              </span>
            </span>
            <span className="qi-bubble qi-bubble--hold">The years before menopause</span>
          </div>
          <p className="qi-caption">Hold an answer to see what it means</p>
        </div>

        <label className="qi-dont" onPointerDown={() => setPaused(true)}>
          <input
            type="checkbox"
            checked={dontShow}
            onFocus={() => setPaused(true)}
            onChange={(e) => { setPaused(true); setDontShow(e.target.checked); setHidden(e.target.checked); }}
          />
          <span>Don’t show again</span>
        </label>
        <button type="button" className="qi-go" ref={skipRef} onClick={close}>Got it</button>

        {!manual && <span className="qi-timer" aria-hidden="true"><i /></span>}
      </div>
    </div>
  );
}
