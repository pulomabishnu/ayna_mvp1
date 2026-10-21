import { useContext, useMemo } from 'react';
import { AskContext } from '../askContext.js';
import { dashboardContext } from '../utils/dashboardAsk.js';
import { buildDashboard } from '../../health/dashboard.js';
import { localToday, useHealthData } from '../hooks/useHealthData.js';
import { CycleRing } from './HealthChart.jsx';
import { HealthStarter } from './HealthBento.jsx';
import HealthHome from './HealthHome.jsx';
import '../screens/profile/health-connections.css';

/**
 * Your health in the app (You -> Health, and Ecosystem -> Dashboard).
 * The screen itself is HealthHome.jsx (shared with the website); this file
 * loads her data and handles signed out, loading and no-data states.
 * Compared only with her own usual. Never a diagnosis.
 */

export default function HealthDashboard({ authUser, userName = '', selectedNeedIds = [], hormonalBC = false, onConnect, onAddGoal, onOpenRoutine, onSignIn, products = [], matches = [], onOpenProduct }) {
  const openAsk = useContext(AskContext);
  const health = useHealthData(authUser?.id || null, selectedNeedIds);
  const today = localToday();
  const week = useMemo(() => buildDashboard(health.insightRows || [], { days: 30, today }), [health.insightRows, today]);
  const { sections } = health.insights;
  const ready = sections.filter((s) => s.status === 'ready');
  const estimate = sections.find((s) => s.id === 'cycle')?.estimate || null;

  if (!authUser?.id) {
    return (
      <div className="ay-hd-empty">
        <CycleRing cycleDay={null} avgLength={28} periodLength={0} />
        <h2>Your sleep, cycle and heart, side by side</h2>
        <p>Sign in to connect your apps and wearables. Your cycle, sleep, heart and activity show up here, compared with your own usual.</p>
        {onSignIn && <button type="button" className="ay-qc-primary" onClick={onSignIn}>Sign in</button>}
      </div>
    );
  }
  if (health.status === 'loading') {
    return (
      <div className="ay-hh-skeleton" role="status" aria-busy="true">
        <span className="sr-only">Loading your health data</span>
        <i className="is-hello" /><i className="is-hero" /><span><i /><i /><i /><i /></span>
      </div>
    );
  }
  if (week.empty && !sections.length) {
    return (
      <div className="ay-wx-empty">
        <h2>Your sleep, cycle and heart, side by side</h2>
        <p>Connect an app or wearable, or upload a file. Your cycle, sleep, heart and activity show up here, compared with your own usual.</p>
        {/* Still useful before any data: her goals matched to her products, from the quiz. */}
        <HealthStarter needIds={selectedNeedIds} products={products} matches={matches} onOpenProduct={onOpenProduct} onConnect={onConnect} />
      </div>
    );
  }
  const meta = authUser?.user_metadata || {};
  const name = String(userName || meta.first_name || meta.given_name || meta.name || meta.full_name || '').trim().split(/\s+/)[0];
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
        matches={matches}
        onOpenProduct={onOpenProduct}
        onAddGoal={onAddGoal}
        onOpenRoutine={onOpenRoutine}
        onAsk={openAsk ? (question, extra) => openAsk({ question, context: dashboardContext({ cycle: week.cycle?.cycleDay ? week.cycle : null, estimate, ready, products, insights: extra?.insights || [] }), stats: extra?.stats || null }) : undefined}
        footer={<button type="button" className="ay-hc-ghost" onClick={onConnect}>Manage connected apps</button>}
        surface="app"
      />
    </div>
  );
}
