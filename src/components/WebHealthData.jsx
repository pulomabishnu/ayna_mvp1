import { useMemo, useState } from 'react';
import { getSelectedNeeds } from '../data/products';
import HealthConnectionsScreen from '../mobile/screens/profile/HealthConnectionsScreen.jsx';
import HealthInsightsScreen from '../mobile/screens/profile/HealthInsightsScreen.jsx';
import { apiSourceFor, sourceById } from '../mobile/data/healthConnections.js';
import { useHealthData } from '../mobile/hooks/useHealthData.js';
import ProFeatureGate from './ProFeatureGate.jsx';
import '../mobile/screens/profile/health-connections.css';

const PRO_CONNECT_PREFIX = 'pro-connect:';

/**
 * Website version of You -> Health data. New supported app/wearable
 * connections are a Pro benefit, but existing connections remain manageable
 * after downgrade so disconnect/delete/privacy controls are never paywalled.
 */
export default function WebHealthData({ user, quizResults, onBack, onSignIn, onEditProfile, initialView = 'list' }) {
  const [stack, setStack] = useState(() => (initialView === 'insights' ? ['list', 'insights'] : ['list']));
  const health = useHealthData(user?.id || null);
  const top = stack[stack.length - 1];
  const gatedSourceId = top.startsWith(PRO_CONNECT_PREFIX) ? top.slice(PRO_CONNECT_PREFIX.length) : '';
  const push = (s) => setStack((st) => [...st, s]);
  const back = () => (stack.length > 1 ? setStack((st) => st.slice(0, -1)) : onBack?.());
  const selectedNeedIds = useMemo(() => { try { return quizResults ? getSelectedNeeds(quizResults).map((n) => n.id) : []; } catch { return []; } }, [quizResults]);
  const sourceTitle = gatedSourceId ? sourceById(gatedSourceId.split(':')[0])?.name : '';
  const title = top === 'insights' ? 'Health insights' : sourceTitle ? `Connect ${sourceTitle}` : 'Health data';

  const openSource = (id) => {
    const sourceId = String(id || '').split(':')[0];
    const source = sourceById(sourceId);
    const connected = health.connections.some((connection) => connection.source === apiSourceFor(sourceId) && connection.status !== 'disconnected');
    const newSupportedConnection = !connected && ['oauth', 'device'].includes(source?.availability);
    push(newSupportedConnection ? `${PRO_CONNECT_PREFIX}${id}` : id);
  };

  const connectionScreen = (selectedId = top) => (
    <HealthConnectionsScreen
      selectedId={selectedId === 'list' ? null : selectedId}
      onSelect={openSource}
      onBack={back}
      authUser={user}
      onSignIn={onSignIn}
      onOpenInsights={() => push('insights')}
    />
  );

  return (
    <section className="ay-hc-web" aria-labelledby="ay-hc-web-title">
      <div className="ay-hc-web-head">
        <button type="button" className="ay-hc-web-back" onClick={back} aria-label="Back">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <h1 id="ay-hc-web-title">{title}</h1>
      </div>
      <div className="ay-hc-web-body" key={top}>
        {top === 'insights' ? (
          <ProFeatureGate feature="insights" title="Deeper health insights" onBack={back}>
            <HealthInsightsScreen authUser={user} selectedNeedIds={selectedNeedIds} onConnect={() => setStack(['list'])} onEditProfile={onEditProfile} />
          </ProFeatureGate>
        ) : gatedSourceId ? (
          <ProFeatureGate feature="wearables" title={`Connect ${sourceTitle || 'health data'}`} onBack={back}>
            {connectionScreen(gatedSourceId)}
          </ProFeatureGate>
        ) : connectionScreen()}
      </div>
    </section>
  );
}
