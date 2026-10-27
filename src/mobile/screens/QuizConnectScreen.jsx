import { useState } from 'react';
import HealthConnectionsScreen from './profile/HealthConnectionsScreen.jsx';
import ProFeatureGate from '../../components/ProFeatureGate.jsx';
import { useHealthData } from '../hooks/useHealthData.js';
import './profile/health-connections.css';

/**
 * End of the quiz, before her matches: connecting supported health apps and
 * wearables is a Pro benefit, but this step always remains skippable so Free
 * users can finish onboarding without connecting anything.
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
        <ol className="ay-qc-steps" aria-label="Almost done">
          <li className="is-done">Quiz</li><li className="is-on" aria-current="step">Health data</li><li>Your plan</li>
        </ol>
      </header>
      {!selected && (
        <div className="ay-qc-copy">
          <h1>Connect your <em>health data with Pro.</em></h1>
          <p>Pro members can connect supported apps and wearables, choose exactly what to share, and use that data in more personalized health experiences. ayna still works without a connection, and brands never see your health data.</p>
        </div>
      )}
      <div className="ay-qc-body">
        <ProFeatureGate feature="wearables" title="Connect health apps and wearables">
          <HealthConnectionsScreen
            selectedId={selected}
            onSelect={setSelected}
            onBack={() => setSelected(null)}
            authUser={authUser}
            onSignIn={onQuizConnectSignIn}
            compact
          />
        </ProFeatureGate>
      </div>
      <footer className="ay-qc-foot">
        {connected && <p role="status">{health.connected.length === 1 ? '1 source connected' : `${health.connected.length} sources connected`}</p>}
        <button type="button" className={connected ? 'ay-qc-primary' : 'ay-qc-skip'} onClick={onQuizConnectContinue}>{connected ? 'See my plan' : 'Skip for now'}</button>
      </footer>
    </main>
  );
}
