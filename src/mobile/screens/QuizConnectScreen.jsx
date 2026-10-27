import { useState } from 'react';
import HealthConnectionsScreen from './profile/HealthConnectionsScreen.jsx';
import ProFeatureGate from '../../components/ProFeatureGate.jsx';
import { useHealthData } from '../hooks/useHealthData.js';
import './profile/health-connections.css';
import '../../styles/onboarding.css';
import '../loop-a-app.css';
import { CATEGORIES } from '../../health/metrics.js';

// Step 7 of the first run: exactly what each kind of data is used for.
const USED_FOR = ['sleep', 'cycle', 'temperature', 'heart', 'activity'].filter((k) => CATEGORIES[k]);

/**
 * End of the quiz, before her matches: connecting health apps and wearables is
 * a Pro benefit, but the step always stays skippable so Free users can finish
 * onboarding without connecting anything.
 */
export default function QuizConnectScreen({ authUser, onQuizConnectContinue, onQuizConnectSignIn, onBack }) {
  const [selected, setSelected] = useState(null);
  const health = useHealthData(authUser?.id || null);
  const connected = health.connected.length > 0;
  return (
    <main className="ay-qc">
      <header className="ay-qc-top">
        <button type="button" className="ay-qc-back" onClick={selected ? () => setSelected(null) : onBack} aria-label={selected ? 'Back to all sources' : 'Back to the quiz'}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
        </button>
        <span className="ay-qc-count">Step 5 of 5 · Optional</span>
        <span className="ay-qc-spacer" aria-hidden="true" />
        <div className="ay-qc-progress" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={5} aria-valuenow={5}><span /></div>
      </header>
      {!selected && (
        <div className="ay-qc-copy">
          <h1>Connect health data with Pro</h1>
          <p>ayna works without it. Pro members can connect supported apps and wearables, choose exactly what to share, and use that data in more personalized health experiences. Brands never see it.</p>
          <dl className="ay-qc-uses">
            {USED_FOR.map((k) => <div key={k}><dt>{CATEGORIES[k].label}</dt><dd>Used {CATEGORIES[k].why.charAt(0).toLowerCase()}{CATEGORIES[k].why.slice(1)}</dd></div>)}
          </dl>
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
