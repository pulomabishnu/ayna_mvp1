import { useMemo } from 'react';
import { getSelectedNeeds, useCatalogReady } from '../../data/catalog.js';
import { moreRemaining } from '../../mobile/data/onboardingFlow.js';
import { reconstructIntakeFromSnapshot } from '../../mobile/data/intakeModel.js';
import { Seal } from '../personality/Bits.jsx';
import '../../styles/onboarding.css';

/**
 * The first personalized reveal (UX spec section 5), app and website.
 * "Your ayna is ready." Her top three needs come from the same selected-needs
 * logic the matcher uses (getSelectedNeeds), in the order she picked them.
 * Nothing here is invented: no needs means we say so plainly.
 */
function revealNeeds(answers, limit = 3) {
  if (!answers) return [];
  try {
    return getSelectedNeeds(answers).slice(0, limit).map((n) => ({ id: n.id, label: n.label }));
  } catch {
    return [];
  }
}

export default function ReadyReveal({ answers = null, variant = 'app', signedIn = false, onSeeToday, onCreateAccount, onBack, onMorePersonal }) {
  const ready = useCatalogReady();
  const needs = useMemo(() => (ready ? revealNeeds(answers) : []), [answers, ready]);
  const goals = (answers?.fullHealthIntake?.goals || []).slice(0, 2);
  const remaining = useMemo(() => (answers?.fullHealthIntake ? moreRemaining(reconstructIntakeFromSnapshot(answers.fullHealthIntake)) : 0), [answers]);
  const Tag = variant === 'web' ? 'section' : 'main';
  // Today on the website and the app (all-pages brief, Oct 25).
  const tab = 'Today';
  return (
    <Tag className={`ay-ob-ready is-${variant}`} aria-labelledby="ay-ob-ready-h">
      {onBack && (
        <button type="button" className="ay-ob-back" onClick={onBack} aria-label="Back to health data">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
      )}
      {/* The reveal is a stamp moment (INSPO onboarding 4: result as a seal): the
          "matched to you" seal lands once; still under reduced motion. */}
      <div className="ay-ob-ready__art" aria-hidden="true"><Seal className="ay-ob-ready__seal" /></div>
      <h1 id="ay-ob-ready-h" className="ay-ob-ready__title">Your ayna is ready.</h1>
      {needs.length ? (
        <>
          <p className="ay-ob-ready__lead">Based on what you told us, ayna will initially focus on:</p>
          <ol className="ay-ob-ready__list">
            {needs.map((n, i) => <li key={n.id} style={{ '--i': i }}><span aria-hidden="true">{i + 1}</span>{n.label}</li>)}
          </ol>
        </>
      ) : !ready ? (
        <p className="ay-ob-ready__lead" role="status">Getting your focus ready…</p>
      ) : (
        <p className="ay-ob-ready__lead">You didn’t pick anything specific, so {tab} starts with quick check-ins. Add what you want help with any time in You.</p>
      )}
      {goals.length > 0 && <p className="ay-ob-ready__goals">With your goals in mind: {goals.map((g) => g.charAt(0).toLowerCase() + g.slice(1)).join(' and ')}.</p>}
      <p className="ay-ob-ready__note">{tab} is where your daily rundown lives. You can see and change everything ayna uses in You, My health.</p>
      <div className="ay-ob-ready__actions">
        <button type="button" className="ay-ob-primary" onClick={onSeeToday}>See my {tab}</button>
        {onMorePersonal && remaining > 0 && (
          <button type="button" className="ay-ob-more" onClick={onMorePersonal}>
            <span>Make my matches more personal</span>
            <small>{remaining} quick optional {remaining === 1 ? 'question' : 'questions'}: goals, budget, ingredients</small>
          </button>
        )}
        {!signedIn && onCreateAccount && <button type="button" className="ay-ob-quiet" onClick={onCreateAccount}>Create an account to keep it</button>}
      </div>
    </Tag>
  );
}
