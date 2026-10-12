import { useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import '../ecointro.css';

// The three parts of the intake, in the order it asks them.
const PARTS = [
  { key: 'goals', label: 'Goals', tone: 'butter', note: 'What you want support with.' },
  { key: 'health', label: 'Health', tone: 'pink', note: 'Your cycle, conditions and medications.' },
  { key: 'preferences', label: 'Preferences', tone: 'mint', note: 'Formats, budget, brands and what to avoid.' },
];

export default function EcosystemIntroScreen({ onStartQuiz, onAlreadyHaveAccount, onAboutAyna, authUser, onOpenSaved, onBrowse, onGoCommunity, headerInitial = 'A', onOpenProfile, hasIntakeDraft = false }) {
  const [focus, setFocus] = useState('goals');
  const active = PARTS.find((part) => part.key === focus) || PARTS[0];
  return <main className="ayna-ecosystem-start ay-intro">
    <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />
    <div className="ayna-ecosystem-start-scroll ay-intro-body">
      <header className="ay-intro-head">
        <h1>{hasIntakeDraft ? 'Your Ecosystem is taking shape.' : 'Make it yours.'}</h1>
        <p>{hasIntakeDraft ? 'Pick up where you left off.' : 'A few questions in three parts.'}</p>
      </header>

      <section className="ay-intro-map" aria-label="What shapes your Ecosystem">
        <div className="ay-intro-diagram" data-focus={focus}>
          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line className="is-goals" x1="50" y1="54" x2="50" y2="15" />
            <line className="is-health" x1="50" y1="54" x2="83" y2="77" />
            <line className="is-preferences" x1="50" y1="54" x2="17" y2="77" />
          </svg>
          <span className="ay-intro-ripple" aria-hidden="true" />
          <span className="ay-intro-you" aria-hidden="true">you</span>
          <span className={`ay-intro-pulse to-${focus}`} key={focus} aria-hidden="true" />
          {PARTS.map((part) => (
            <button key={part.key} type="button" className={`ay-intro-part is-${part.key} tone-${part.tone}`} aria-pressed={focus === part.key} onClick={() => setFocus(part.key)}>
              {part.label}
            </button>
          ))}
        </div>
        <p className="ay-intro-note" aria-live="polite" key={active.key}><strong>{active.label}</strong>{active.note}</p>
      </section>

      <div className="ayna-ecosystem-start-actions ay-intro-actions">
        <button type="button" className="ayna-ecosystem-start-primary" onClick={onStartQuiz}>{hasIntakeDraft ? 'Continue' : 'Start'}</button>
        <div>{!authUser && <button type="button" onClick={onAlreadyHaveAccount}>Sign in</button>}<button type="button" onClick={onAboutAyna}>About us</button></div>
      </div>
    </div>
  </main>;
}
