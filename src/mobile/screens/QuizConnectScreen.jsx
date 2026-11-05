import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import HealthConnectionsScreen from './profile/HealthConnectionsScreen.jsx';
import ProFeatureGate from '../../components/ProFeatureGate.jsx';
import { LockIcon } from '../../components/ProLock.jsx';
import { openProPaywall } from '../../pro/paywall.js';
import { useHealthData } from '../hooks/useHealthData.js';
import './profile/health-connections.css';
import '../../styles/onboarding.css';
import '../loop-a-app.css';
import './quiz-connect.css';

// What connecting adds, as the inspo's small tiles: one word and an icon each (Nov 4, founder:
// "too many words"). The longer "what each kind is used for" lives in Settings > Health data.
const TILES = [
  { k: 'sleep', t: 'Sleep', tone: 'is-pink', icon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /> },
  { k: 'cycle', t: 'Cycle', tone: 'is-butter', icon: <><circle cx="12" cy="12" r="7.5" /><path d="M12 4.5a7.5 7.5 0 0 1 7.5 7.5" strokeWidth="3.2" /></> },
  { k: 'heart', t: 'Heart', tone: 'is-ink', icon: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /> },
  { k: 'activity', t: 'Steps', tone: 'is-butter', icon: <path d="M3 13h4l2-5 4 10 2-5h6" /> },
];

/**
 * End of the quiz, before her matches. Connecting apps and wearables is ayna Pro, and the step
 * is always skippable. Without Pro the sources show blurred behind one lock card, on one screen
 * (founder, Nov 4: "just blur it and lock it and explain"). Her answers are already saved, and
 * after checkout on the web the gate re-checks when she comes back, so she lands right here.
 */
export default function QuizConnectScreen({ authUser, onQuizConnectContinue, onQuizConnectSignIn, onBack }) {
  const [selected, setSelected] = useState(null);
  const health = useHealthData(authUser?.id || null);
  const connected = health.connected.length > 0;
  const sources = (inert) => (
    <HealthConnectionsScreen
      selectedId={inert ? null : selected}
      onSelect={inert ? () => {} : setSelected}
      onBack={() => setSelected(null)}
      authUser={authUser}
      onSignIn={onQuizConnectSignIn}
      compact
    />
  );
  const unlock = () => {
    if (!authUser?.id && onQuizConnectSignIn) { onQuizConnectSignIn(); return; }
    if (!openProPaywall({ feature: 'wearables', featureName: 'Health apps and wearables' }) && Capacitor.isNativePlatform()) {
      window.open('https://www.aynahealth.co/pro?feature=wearables', '_blank', 'noopener');
    }
  };
  const locked = (state) => (
    <div className="ay-qc-locked">
      <div className="ay-qc-blur" aria-hidden="true" ref={(el) => { if (el) el.setAttribute('inert', ''); }}>{sources(true)}</div>
      {state === 'locked' && (
        <section className="ay-qc-lock" aria-labelledby="ay-qc-lock-h">
          <span className="ay-qc-lock__seal" aria-hidden="true"><LockIcon size={22} /></span>
          <h2 id="ay-qc-lock-h">Part of ayna Pro</h2>
          <p>Connect Apple Health, Oura and more for closer matches.</p>
          <button type="button" className="ay-qc-lock__go" onClick={unlock}>{authUser?.id ? 'Get ayna Pro' : 'Sign up to connect'}</button>
          <small>Your answers are saved.</small>
        </section>
      )}
    </div>
  );
  return (
    <main className="ay-qc ay-qc--v2">
      <header className="ay-qc-top">
        <button type="button" className="ay-qc-back" onClick={selected ? () => setSelected(null) : onBack} aria-label={selected ? 'Back to all sources' : 'Back to the quiz'}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
        </button>
        <span className="ay-qc-count">Optional</span>
        <span className="ay-qc-spacer" aria-hidden="true" />
        <div className="ay-qc-progress" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={5} aria-valuenow={5}><span /></div>
      </header>
      {!selected && (
        <div className="ay-qc-copy">
          <h1>Connect your data</h1>
          <p>Quick check-ins work too.</p>
          <ul className="ay-qc-tiles" aria-label="What it adds">
            {TILES.map((x) => (
              <li key={x.k} className={x.tone}>
                <span className="ay-qc-tiles__ic" aria-hidden="true"><svg viewBox="0 0 24 24">{x.icon}</svg></span>
                <b>{x.t}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="ay-qc-body">
        <ProFeatureGate feature="wearables" title="Connect health apps and wearables" fallback={locked}>
          {sources(false)}
        </ProFeatureGate>
      </div>
      <footer className="ay-qc-foot">
        {connected && <p role="status">{health.connected.length === 1 ? '1 source connected' : `${health.connected.length} sources connected`}</p>}
        <button type="button" className={connected ? 'ay-qc-primary' : 'ay-qc-skip'} onClick={onQuizConnectContinue}>{connected ? 'See my matches' : 'Skip for now'}</button>
      </footer>
    </main>
  );
}
