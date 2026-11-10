import { useState } from 'react';
import { draftProgressLine } from '../mobile/data/quizDraftProgress.js';
import './finish-quiz.css';

/**
 * "Finish your quiz": shown where she lands while a quiz draft is waiting.
 * Same card on the app and the website (variant switches the styling);
 * `compact` is the small banner used on the website home hero.
 */
export default function FinishQuizCard({ progress, onContinue, onStartOver, variant = 'app', compact = false, className = '' }) {
  const [confirming, setConfirming] = useState(false);
  if (!progress) return null;
  // Founder, Nov 9 ("ugh come on"): nothing answered yet (still on question 1) is not a quiz
  // to finish, so no card.
  if (!progress.requiredDone && (progress.index || 1) <= 1) return null;
  const pct = Math.round(progress.fraction * 100);
  const line = draftProgressLine(progress);
  // App: one slim row, not a big box over Home (founder, Nov 9). The intro screen keeps the card.
  if (variant === 'app' && !className) {
    return <section className="fq-row" aria-label="Finish your quiz">
      <button type="button" className="fq-row__go" onClick={onContinue}>
        <span className="fq-row__txt"><b>Finish your quiz</b><small>{progress.requiredDone ? 'Your matches are one step away' : `Question ${progress.index} of ${progress.total}, saved`}</small></span>
        <span className="fq-row__bar" aria-hidden="true"><i style={{ width: `${Math.max(pct, 6)}%` }} /></span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
    </section>;
  }
  return <section className={`fq fq--${variant}${compact ? ' fq--compact' : ''}${className ? ` ${className}` : ''}`} aria-labelledby={`fq-title-${variant}${compact ? '-c' : ''}`}>
    <div className="fq__text">
      <h2 id={`fq-title-${variant}${compact ? '-c' : ''}`}>Finish your quiz</h2>
      <p>{line}</p>
    </div>
    <div className="fq__bar" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><span style={{ width: `${Math.max(pct, 4)}%` }} /></div>
    {confirming
      ? <div className="fq__confirm" role="group" aria-label="Start over">
        <p>Clear your answers and start at question 1?</p>
        <div>
          <button type="button" className="fq__go" onClick={() => { setConfirming(false); onStartOver?.(); }}>Yes, start over</button>
          <button type="button" className="fq__quiet" onClick={() => setConfirming(false)}>Keep my answers</button>
        </div>
      </div>
      : <div className="fq__actions">
        <button type="button" className="fq__go" onClick={onContinue}>Continue my quiz<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
        {onStartOver && <button type="button" className="fq__quiet" onClick={() => setConfirming(true)}>Start over</button>}
      </div>}
  </section>;
}

/** Required part done, optional questions still open: the website's
 * "Make my matches more personal" card (the app has its own on Ecosystem). */
export function MorePersonalCard({ remaining, onAnswer }) {
  if (!(remaining > 0) || !onAnswer) return null;
  const qs = `question${remaining === 1 ? '' : 's'}`;
  return <section className="fq fq--web fq--pink" aria-labelledby="fq-more-title">
    <div className="fq__text">
      <h2 id="fq-more-title">Make my matches more personal</h2>
      <p>{remaining} more quick {qs}, all optional. It opens at the first one you haven't answered, and you can skip any.</p>
    </div>
    <div className="fq__actions">
      <button type="button" className="fq__go" onClick={onAnswer}>Answer {remaining} more {qs}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
    </div>
  </section>;
}
