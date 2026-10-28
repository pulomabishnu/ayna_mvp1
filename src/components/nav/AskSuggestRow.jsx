import { useEffect, useState } from 'react';
import { ASK_SUGGEST_EVENT, navAskSuggestions, readSuggestHidden, writeSuggestHidden } from './askSuggestions.js';
import './ask-suggest.css';

/**
 * One slim, sideways-scrolling row of suggested questions under the top bar.
 * Tapping a pill opens Ask ayna and sends that question (onAsk(question)).
 * Hide persists until the user turns suggestions back on in Settings.
 */
export default function AskSuggestRow({ onAsk, signedIn = false, hasProfile = false, surface = '', className = '' }) {
  const [hidden, setHidden] = useState(readSuggestHidden);
  const [justHidden, setJustHidden] = useState(false);

  useEffect(() => {
    const sync = () => setHidden(readSuggestHidden());
    window.addEventListener(ASK_SUGGEST_EVENT, sync);
    return () => window.removeEventListener(ASK_SUGGEST_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!justHidden) return undefined;
    const timer = window.setTimeout(() => setJustHidden(false), 5200);
    return () => window.clearTimeout(timer);
  }, [justHidden]);

  if (hidden) {
    if (!justHidden) return null;
    return (
      <div className={`ay-asksug ay-asksug--hidden ${className}`.trim()} role="status">
        <p className="ay-asksug__hidden-note">Suggestions hidden. You can turn them back on in Settings.</p>
      </div>
    );
  }

  if (typeof onAsk !== 'function') return null;
  const questions = navAskSuggestions({ signedIn, hasProfile, surface });
  if (!questions.length) return null;
  return (
    <div className={`ay-asksug ${className}`.trim()} role="region" aria-label="Ask ayna suggestions" data-tour="ask-suggest">
      <div className="ay-asksug__row">
        <span className="ay-asksug__lead" aria-hidden="true">Ask ayna</span>
        {questions.map((q) => (
          <button key={q} type="button" className="ay-asksug__pill" onClick={() => onAsk(q)}>{q}</button>
        ))}
        <button type="button" className="ay-asksug__hide" aria-label="Hide suggestions" onClick={() => { writeSuggestHidden(true); setHidden(true); setJustHidden(true); }}>
          <span>Hide</span>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
    </div>
  );
}
