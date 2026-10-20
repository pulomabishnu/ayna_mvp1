import { useRef, useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import '../ecointro.css';

// The three parts of the intake, in the order it asks them.
const PARTS = [
  { key: 'goals', label: 'Goals', tone: 'butter', note: 'What you want support with.' },
  { key: 'health', label: 'Health', tone: 'pink', note: 'Your cycle, conditions and medications.' },
  { key: 'preferences', label: 'Preferences', tone: 'mint', note: 'Formats, budget, brands and what to avoid.' },
];

// Same slide-to-start control as the welcome screen (.ayna-slide-start*),
// labelled "Continue". Slide past ~72% or tap the handle.
function SlideToContinue({ onComplete, label = 'Continue', hint = 'slide' }) {
  const trackRef = useRef(null);
  const draggingRef = useRef(false);
  const completedBySlideRef = useRef(false);
  const movedRef = useRef(false);
  const startXRef = useRef(0);
  const [distance, setDistance] = useState(0);
  const travel = () => Math.max(0, (trackRef.current?.clientWidth || 0) - 66);
  const position = (event) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.min(travel(), Math.max(0, event.clientX - rect.left - 31));
  };
  const start = (event) => {
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = event.clientX;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDistance(position(event));
  };
  const move = (event) => {
    if (!draggingRef.current) return;
    if (Math.abs(event.clientX - startXRef.current) > 8) movedRef.current = true;
    setDistance(position(event));
  };
  const finish = (event) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const completed = position(event) >= travel() * .72;
    setDistance(0);
    if (completed) { completedBySlideRef.current = true; onComplete?.(); }
  };
  return <div className="ayna-slide-start ay-intro-slide" ref={trackRef}>
    <span className="ayna-slide-start-fill" style={{ width: distance > 0 ? `${distance + 56}px` : 0 }} aria-hidden="true" />
    <span className="ayna-slide-start-label" aria-hidden="true">{label} <span>{hint}</span></span>
    <button
      type="button"
      className="ayna-slide-start-handle"
      aria-label={`${label}: slide or tap`}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={() => { draggingRef.current = false; movedRef.current = true; setDistance(0); }}
      onClick={() => {
        if (completedBySlideRef.current) { completedBySlideRef.current = false; return; }
        if (movedRef.current) { movedRef.current = false; return; }
        onComplete?.();
      }}
      style={{ transform: `translateX(${distance}px)` }}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h16m-7-7 7 7-7 7" /></svg>
    </button>
  </div>;
}

export default function EcosystemIntroScreen({ onStartQuiz, onAlreadyHaveAccount, authUser, onOpenSaved, onBrowse, onGoCommunity, headerInitial = 'A', onOpenProfile, hasIntakeDraft = false }) {
  return <main className="ayna-ecosystem-start ay-intro">
    <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />
    <div className="ayna-ecosystem-start-scroll ay-intro-body">
      <header className="ay-intro-head">
        <h1>{hasIntakeDraft ? <>Your Ecosystem is <em>taking shape.</em></> : <>Make it <em>yours.</em></>}</h1>
        <p>{hasIntakeDraft ? 'Pick up where you left off.' : 'A few questions in three parts.'}</p>
      </header>

      <ol className="ay-intro-steps" aria-label="What shapes your Ecosystem">
        {PARTS.map((part, i) => (
          <li key={part.key} className={i % 2 ? 'is-rose' : 'is-sky'}>
            <span className="ay-intro-burst" aria-hidden="true"><b>{i + 1}</b></span>
            <span><strong>{part.label}</strong><small>{part.note}</small></span>
          </li>
        ))}
      </ol>

      {/* Continue resumes the quiz draft where she left off (IntakeScreen reads it), or starts fresh. */}
      <div className="ayna-ecosystem-start-actions ay-intro-actions">
        <SlideToContinue onComplete={onStartQuiz} label={hasIntakeDraft ? 'Finish the quiz' : 'Start the quiz'} hint={hasIntakeDraft ? 'where you left off' : 'slide to start'} />
        {!authUser && <p className="ay-intro-signin">Already have an account? <button type="button" onClick={onAlreadyHaveAccount}>Sign in</button></p>}
      </div>
    </div>
  </main>;
}
