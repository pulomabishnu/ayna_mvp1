import { useEffect, useState } from 'react';
import '../wrapped.css';

const STEPS = ['Reading your answers', 'Checking the evidence', 'Picking your matches'];

// Short branded pause between the last question and the wrapped story.
export default function BuildingScreen({ onFinish, onBack }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((_, index) => window.setTimeout(() => setStep(index), index * 700));
    const finish = window.setTimeout(() => onFinish?.(), 2400);
    return () => { timers.forEach(window.clearTimeout); window.clearTimeout(finish); };
  }, [onFinish]);

  return <div className="ayna-wrapped ayw-building" role="status" aria-live="polite">
    <div className="ayw-top">
      <button type="button" onClick={onBack} aria-label="Back to answers"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg></button>
      <span>ayna</span><span className="ayw-top-spacer" />
    </div>
    <div className="ayw-deck" aria-hidden="true"><i /><i /><i /><i /></div>
    <div className="ayw-building-copy">
      <span>{String(step + 1).padStart(2, '0')} / 03</span>
      <strong key={step}>{STEPS[step]}…</strong>
    </div>
  </div>;
}
