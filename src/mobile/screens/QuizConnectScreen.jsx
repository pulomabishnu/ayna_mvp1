import { useState } from 'react';
import HealthConnectionsScreen from './profile/HealthConnectionsScreen.jsx';
import { useHealthData } from '../hooks/useHealthData.js';
import './profile/health-connections.css';
import '../../styles/onboarding.css';
import { CATEGORIES } from '../../health/metrics.js';

// Step 7 of the first run: exactly what each kind of data is used for.
const USED_FOR = ['sleep', 'cycle', 'temperature', 'heart', 'activity'].filter((k) => CATEGORIES[k]);

/**
 * End of the quiz, before her matches: an optional step to bring in health
 * data from the apps and wearables she already uses. Always skippable
 * ("Skip for now"); nothing is read until she connects a source.
 */
export default function QuizConnectScreen({ authUser, onQuizConnectContinue, onQuizConnectSignIn, onBack }) {
  const [selected, setSelected] = useState(null);
  const health = useHealthData(authUser?.id || null);
  const connected = health.connected.length > 0;
  return (
    <main className="ay-qc">
      <header className="ay-qc-top">
        <button type="button" className="ay-qc-back" onClick={selected ? () => setSelected(null) : onBack} aria-label={selected ? 'Back to all sources' : 'Back to the quiz'}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <span className="ay-qc-count">Step 5 of 5</span>
      </header>
      {!selected && (
        <div className="ay-qc-copy">
          <p className="ay-qc-kicker">Optional</p>
          <h1>Connect health data</h1>
          <p>You don’t need to. Quick check-ins work too. If you connect, you choose each kind of data, and brands never see it.</p>
          <dl className="ay-qc-uses">
            {USED_FOR.map((k) => <div key={k}><dt>{CATEGORIES[k].label}</dt><dd>Used {CATEGORIES[k].why.charAt(0).toLowerCase()}{CATEGORIES[k].why.slice(1)}</dd></div>)}
          </dl>
        </div>
      )}
      <div className="ay-qc-body">
        <HealthConnectionsScreen
          selectedId={selected}
          onSelect={setSelected}
          onBack={() => setSelected(null)}
          authUser={authUser}
          onSignIn={onQuizConnectSignIn}
          compact
        />
      </div>
      <footer className="ay-qc-foot">
        {connected && <p role="status">{health.connected.length === 1 ? '1 source connected' : `${health.connected.length} sources connected`}</p>}
        <button type="button" className={connected ? 'ay-qc-primary' : 'ay-qc-skip'} onClick={onQuizConnectContinue}>{connected ? 'See my plan' : 'Skip for now'}</button>
      </footer>
    </main>
  );
}
