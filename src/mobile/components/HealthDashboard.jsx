import { useContext, useMemo } from 'react';
import { AskContext } from '../askContext.js';
import { dashboardContext } from '../utils/dashboardAsk.js';
import { useAskHealthPref } from '../../health/askHealthPref.js';
import { buildDashboard } from '../../health/dashboard.js';
import { localToday, useHealthData } from '../hooks/useHealthData.js';
import { HealthStarter } from './HealthBento.jsx';
import HealthHome, { HealthEmpty } from './HealthHome.jsx';
import TodayFeed from '../../components/today/TodayFeed.jsx';
import '../screens/profile/health-connections.css';

/**
 * Your health in the app (You -> Health, and Ecosystem -> Dashboard).
 * The screen itself is HealthHome.jsx (shared with the website); this file
 * loads her data and handles signed out, loading and no-data states.
 * Compared only with her own usual. Never a diagnosis.
 */

export default function HealthDashboard({ authUser, userName = '', selectedNeedIds = [], hormonalBC = false, onConnect, onAddGoal, onOpenRoutine, onOpenCheckin, onSignIn, products = [], routineProducts = [], routineOutcomes = {}, matches = [], onOpenProduct, quizAnswers = null, onEditAnswers, onSaveToProfile = null }) {
  const openAsk = useContext(AskContext);
  const askHealth = useAskHealthPref(authUser?.id || null);
  const health = useHealthData(authUser?.id || null, selectedNeedIds);
  const today = localToday();
  const week = useMemo(() => buildDashboard(health.insightRows || [], { days: 30, today }), [health.insightRows, today]);
  const { sections } = health.insights;
  const ready = sections.filter((s) => s.status === 'ready');
  const estimate = sections.find((s) => s.id === 'cycle')?.estimate || null;
  // Today with ayna leads every state (signed out and offline too: the log is local first).
  const feedProducts = useMemo(() => [...products, ...matches], [products, matches]);
  const todayFeed = (
    <TodayFeed
      variant="app"
      userId={authUser?.id || null}
      intake={quizAnswers}
      healthRows={health.insightRows || []}
      cycle={week.cycle?.cycleDay ? week.cycle : null}
      hormonalBC={hormonalBC}
      products={feedProducts}
      onOpenProduct={onOpenProduct}
      onAsk={openAsk ? (question) => openAsk({ question }) : undefined}
      onEditAnswers={onEditAnswers}
      onSaveToProfile={onSaveToProfile}
    />
  );

  if (!authUser?.id) {
    return (
      <div className="ay-hd">
        <HealthEmpty today={today} onConnect={onSignIn} goalCount={selectedNeedIds.length} signedOut todayFeed={todayFeed}>
          <HealthStarter needIds={selectedNeedIds} products={products} matches={matches} onOpenProduct={onOpenProduct} onConnect={null} compact />
        </HealthEmpty>
      </div>
    );
  }
  if (health.status === 'loading') {
    return (
      <div className="ay-hd">{todayFeed}<div className="ay-hh-skeleton" role="status" aria-busy="true">
        <span className="sr-only">Loading your health data</span>
        <i className="is-hello" /><i className="is-hero" /><span><i /><i /><i /><i /></span>
      </div></div>
    );
  }
  if (health.status === 'error' && !health.insightRows?.length) {
    return (
      <div className="ay-hd">{todayFeed}<div className="ay-hd-empty" role="alert">
        <h2>We couldn't load your health data</h2>
        <p>Check your connection and try again. Your data has not changed.</p>
        <button type="button" className="ay-qc-primary" onClick={() => health.refresh()}>Try again</button>
      </div></div>
    );
  }
  const meta = authUser?.user_metadata || {};
  const name = String(userName || meta.first_name || meta.given_name || meta.name || meta.full_name || '').trim().split(/\s+/)[0];
  if (week.empty && !sections.length) {
    return (
      <div className="ay-hd">
        <HealthEmpty name={name} today={today} onConnect={onConnect} onOpenCheckin={onOpenCheckin} goalCount={selectedNeedIds.length} todayFeed={todayFeed}>
          {/* Still useful before any data: her goals matched to her products, from the quiz. */}
          <HealthStarter needIds={selectedNeedIds} products={products} matches={matches} onOpenProduct={onOpenProduct} onConnect={null} compact />
        </HealthEmpty>
      </div>
    );
  }
  return (
    <div className="ay-hd">
      <HealthHome
        name={name}
        rows={health.insightRows || []}
        sections={sections}
        matchContext={health.matchContext}
        today={today}
        needIds={selectedNeedIds}
        hormonalBC={hormonalBC}
        products={products}
        routineProducts={routineProducts}
        routineOutcomes={routineOutcomes}
        matches={matches}
        onOpenProduct={onOpenProduct}
        onAddGoal={onAddGoal}
        onOpenRoutine={onOpenRoutine}
        onOpenCheckin={onOpenCheckin}
        onAsk={openAsk ? (question, extra) => {
          // Health lines only with her opt-in (src/health/askHealthPref.js, off by
          // default); the Ask sheet can rebuild with it once she turns it on.
          const buildContext = (allowHealth) => dashboardContext({ cycle: week.cycle?.cycleDay ? week.cycle : null, estimate, ready, products, insights: extra?.insights || [], allowHealth });
          const withHealth = buildContext(true);
          const without = buildContext(false);
          openAsk({ question, context: askHealth.on ? withHealth : without, buildContext, usesHealth: withHealth !== without, stats: extra?.stats || null });
        } : undefined}
        footer={<button type="button" className="ay-hc-ghost" onClick={onConnect}>Manage connected apps</button>}
        surface="app"
        todayFeed={todayFeed}
      />
    </div>
  );
}
