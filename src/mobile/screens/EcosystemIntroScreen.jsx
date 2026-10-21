import MobileHeader from '../components/MobileHeader.jsx';
import '../ecointro.css';
import FinishQuizCard from '../../components/FinishQuizCard.jsx';

// The three parts of the intake, in the order it asks them.
const PARTS = [
  { key: 'goals', label: 'Goals', tone: 'butter', note: 'What you want support with.' },
  { key: 'health', label: 'Health', tone: 'pink', note: 'Your cycle, conditions and medications.' },
  { key: 'preferences', label: 'Preferences', tone: 'mint', note: 'Formats, budget, brands and what to avoid.' },
];

// One plain button starts the quiz (it used to be slide-to-start: a hidden
// gesture, slower than a tap; anti-vibe guide 5d). Same as the welcome screen.
function StartButton({ onStart, label }) {
  return <button type="button" className="ay-intro-start" onClick={onStart}>
    {label}
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  </button>;
}

export default function EcosystemIntroScreen({ onStartQuiz, onAlreadyHaveAccount, authUser, onOpenSaved, onBrowse, onGoCommunity, headerInitial = 'A', onOpenProfile, hasIntakeDraft = false, quizDraft = null, onResumeQuiz, onStartOverQuiz }) {
  return <main className="ayna-ecosystem-start ay-intro">
    <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />
    <div className="ayna-ecosystem-start-scroll ay-intro-body">
      <header className="ay-intro-head">
        <h1>{hasIntakeDraft ? 'Your Ecosystem is taking shape' : 'Tell us about you'}</h1>
        <p>{hasIntakeDraft ? 'Pick up where you left off.' : 'A few questions in three parts.'}</p>
      </header>

      <ol className="ay-intro-steps" aria-label="What shapes your Ecosystem">
        {PARTS.map((part, i) => (
          <li key={part.key} className={i % 2 ? 'is-rose' : 'is-sky'}>
            <span className="ay-intro-num" aria-hidden="true">{i + 1}</span>
            <span><strong>{part.label}</strong><small>{part.note}</small></span>
          </li>
        ))}
      </ol>

      {/* A saved draft gets the "Finish your quiz" card (exact step); otherwise the slider starts fresh. */}
      <div className="ayna-ecosystem-start-actions ay-intro-actions">
        {quizDraft && onResumeQuiz
          ? <FinishQuizCard progress={quizDraft} onContinue={onResumeQuiz} onStartOver={onStartOverQuiz} className="ay-intro-finish" />
          : <StartButton onStart={onStartQuiz} label={hasIntakeDraft ? 'Finish the quiz' : 'See my matches'} />}
        {!authUser && <p className="ay-intro-signin">Already have an account? <button type="button" onClick={onAlreadyHaveAccount}>Sign in</button></p>}
      </div>
    </div>
  </main>;
}
