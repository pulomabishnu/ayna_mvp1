import { useMemo, useState } from 'react';
import BackLink from './nav/BackLink.jsx';
import ProFeatureGate from './ProFeatureGate.jsx';
import { getSelectedNeeds } from '../data/products';
import HealthConnectionsScreen from '../mobile/screens/profile/HealthConnectionsScreen.jsx';
import HealthInsightsScreen from '../mobile/screens/profile/HealthInsightsScreen.jsx';
import { apiSourceFor, sourceById } from '../mobile/data/healthConnections.js';
import { useHealthData } from '../mobile/hooks/useHealthData.js';
import '../mobile/screens/profile/health-connections.css';

const PRO_CONNECT_PREFIX = 'pro-connect:';

/**
 * Website version of You -> Health data: the app's own Health data and Health
 * Insights screens, laid out for desktop (same components, same rules).
 * Existing connections stay manageable even after a downgrade so privacy,
 * disconnect and deletion controls are never hidden behind a paywall.
 */
export default function WebHealthData({ user, quizResults, onBack, onSignIn, onEditProfile, initialView = 'list' }) {
  const [stack, setStack] = useState(() => (initialView === 'insights' ? ['list', 'insights'] : ['list']));
  const health = useHealthData(user?.id || null);
  const top = stack[stack.length - 1];
  const gatedSourceId = top.startsWith(PRO_CONNECT_PREFIX) ? top.slice(PRO_CONNECT_PREFIX.length) : '';
  const push = (s) => setStack((st) => [...st, s]);
  const back = () => (stack.length > 1 ? setStack((st) => st.slice(0, -1)) : onBack?.());
  const selectedNeedIds = useMemo(() => { try { return quizResults ? getSelectedNeeds(quizResults).map((n) => n.id) : []; } catch { return []; } }, [quizResults]);
  const title = top === 'insights' ? 'Health insights' : gatedSourceId ? `Connect ${sourceById(gatedSourceId.split(':')[0])?.name || 'health data'}` : 'Health data';

  const openSource = (id) => {
    const sourceId = String(id || '').split(':')[0];
    const source = sourceById(sourceId);
    const connected = health.connections.some((connection) => connection.source === apiSourceFor(sourceId) && connection.status !== 'disconnected');
    const isNewConnectedSource = !connected && ['oauth', 'device'].includes(source?.availability);
    push(isNewConnectedSource ? `${PRO_CONNECT_PREFIX}${id}` : id);
  };

  const connections = (selectedId = top) => (
    <HealthConnectionsScreen
      selectedId={selectedId === 'list' ? null : selectedId}
      onSelect={openSource}
      onBack={back}
      authUser={user}
      onSignIn={onSignIn}
      onOpenInsights={() => push('insights')}
      tabName="Today"
    />
  );

  return (
    <section className="ay-hc-web" aria-labelledby="ay-hc-web-title">
      <div className="ay-hc-web-head">
        <BackLink label={stack.length > 1 ? 'Health data' : 'You'} onClick={back} />
        <h1 id="ay-hc-web-title">{title}</h1>
      </div>
      <div className="ay-hc-web-body" key={top}>
        {top === 'insights' ? (
          <ProFeatureGate feature="insights" title="Deeper health insights" onBack={back}>
            <HealthInsightsScreen authUser={user} selectedNeedIds={selectedNeedIds} onConnect={() => setStack(['list'])} onEditProfile={onEditProfile} />
          </ProFeatureGate>
        ) : gatedSourceId ? (
          <ProFeatureGate feature="wearables" title={`Connect ${sourceById(gatedSourceId.split(':')[0])?.name || 'health data'}`} onBack={back}>
            {connections(gatedSourceId)}
          </ProFeatureGate>
        ) : connections()}
      </div>
    </section>
  );
}
