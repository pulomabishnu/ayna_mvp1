import { useMemo, useState } from 'react';
import { getSelectedNeeds } from '../data/products';
import HealthConnectionsScreen from '../mobile/screens/profile/HealthConnectionsScreen.jsx';
import HealthInsightsScreen from '../mobile/screens/profile/HealthInsightsScreen.jsx';
import '../mobile/screens/profile/health-connections.css';

/**
 * Website version of You -> Health data: the app's own Health data and Health
 * Insights screens, laid out for desktop (same components, same rules).
 */
export default function WebHealthData({ user, quizResults, onBack, onSignIn, onEditProfile, initialView = 'list' }) {
  const [stack, setStack] = useState(() => (initialView === 'insights' ? ['list', 'insights'] : ['list']));
  const top = stack[stack.length - 1];
  const push = (s) => setStack((st) => [...st, s]);
  const back = () => (stack.length > 1 ? setStack((st) => st.slice(0, -1)) : onBack?.());
  const selectedNeedIds = useMemo(() => { try { return quizResults ? getSelectedNeeds(quizResults).map((n) => n.id) : []; } catch { return []; } }, [quizResults]);
  const title = top === 'insights' ? 'Health insights' : 'Health data';

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
          <HealthInsightsScreen authUser={user} selectedNeedIds={selectedNeedIds} onConnect={() => setStack(['list'])} onEditProfile={onEditProfile} />
        ) : (
          <HealthConnectionsScreen
            selectedId={top === 'list' ? null : top}
            onSelect={(id) => push(id)}
            onBack={back}
            authUser={user}
            onSignIn={onSignIn}
            onOpenInsights={() => push('insights')}
          />
        )}
      </div>
    </section>
  );
}
