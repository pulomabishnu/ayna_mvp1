import { useContext, useEffect, useMemo, useState } from 'react';
import { monthTopSymptom, takeawayLine } from '../../health/monthTakeaway.js';
import { LOG_SAVED_EVENT, flowRowsFromLog, readLog } from '../../health/dailyLog.js';
import ProFeatureGate from '../../components/ProFeatureGate.jsx';
import { AskContext } from '../askContext.js';
import { dashboardContext } from '../utils/dashboardAsk.js';
import { useAskHealthPref } from '../../health/askHealthPref.js';
import { buildDashboard } from '../../health/dashboard.js';
import { localToday, useHealthData } from '../hooks/useHealthData.js';
import { HealthStarter } from './HealthBento.jsx';
import HealthHome, { HealthEmpty } from './HealthHome.jsx';
import TodayFeed from '../../components/today/TodayFeed.jsx';
import { OutlineButton } from '../../components/ui/ay/index.js';
import '../screens/profile/health-connections.css';

/**
 * Your health in the app (You -> Health, and Ecosystem -> Dashboard).
 * The screen itself is HealthHome.jsx (shared with the website); this file
 * loads her data and handles signed out, loading and no-data states.
 * Compared only with her own usual. Never a diagnosis.
 */

// The health dashboard is part of ayna Pro (founder, PR #87).
export default function HealthDashboard(props) {
  return <ProFeatureGate feature="dashboard" onEcosystem={props.onEcosystem}><HealthDashboardContent {...props} /></ProFeatureGate>;
}

export function HealthDashboardContent({ authUser, selectedNeedIds = [], hormonalBC = false, onConnect, onAddGoal, onOpenRoutine, onOpenCheckin, onSignIn, products = [], routineProducts = [], routineOutcomes = {}, matches = [], onOpenProduct, quizAnswers = null, onEditAnswers, onSaveToProfile = null, rundown = {}, view = 'today' }) {
  // view 'data': Home -> My dashboard ("Your data"). Home already shows the greeting, the
  // Daily Rundown and the check-in, so none of them repeat here (dashboard audit P0 3).
  const dataView = view === 'data';
  const openAsk = useContext(AskContext);
  const askHealth = useAskHealthPref(authUser?.id || null);
  const health = useHealthData(authUser?.id || null, selectedNeedIds);
  const today = localToday();
  // Eliz, Nov 11 run-through: "every time I go to Your data it doesn't show my cycle day". Periods she
  // logs on ayna count here too (same as Home's dial), so the cycle shows without Apple Health.
  const [logTick, setLogTick] = useState(0);
  useEffect(() => {
    const on = () => setLogTick((n) => n + 1);
    window.addEventListener(LOG_SAVED_EVENT, on);
    return () => window.removeEventListener(LOG_SAVED_EVENT, on);
  }, []);
  const rows = useMemo(() => { let log = {}; try { log = readLog(); } catch { /* storage blocked */ } return [...(health.insightRows || []), ...flowRowsFromLog(log)]; }, [health.insightRows, logTick]); // eslint-disable-line react-hooks/exhaustive-deps
  const week = useMemo(() => buildDashboard(rows, { days: 30, today }), [rows, today]);
  const { sections } = health.insights;
  const ready = sections.filter((s) => s.status === 'ready');
  const estimate = sections.find((s) => s.id === 'cycle')?.estimate || null;
  // Today with ayna leads every state (signed out and offline too: the log is local first).
  const feedProducts = useMemo(() => [...products, ...matches], [products, matches]);
  const todayFeed = dataView ? null : (
    <TodayFeed
      variant="app"
      userId={authUser?.id || null}
      intake={quizAnswers}
      healthRows={rows}
      cycle={week.cycle?.cycleDay ? week.cycle : null}
      hormonalBC={hormonalBC}
      products={feedProducts}
      onOpenProduct={onOpenProduct}
      onAsk={openAsk ? (question, extra) => openAsk({ question, ...(extra || {}) }) : undefined}
      onEditAnswers={onEditAnswers}
      onSaveToProfile={onSaveToProfile}
      {...rundown}
    />
  );

  if (!authUser?.id) {
    return (
      <div className="ay-hd">
        <HealthEmpty today={today} onConnect={onSignIn} goalCount={selectedNeedIds.length} signedOut todayFeed={todayFeed} title={dataView ? 'Your data' : 'Your health'}>
          <HealthStarter needIds={selectedNeedIds} products={products} matches={matches} onOpenProduct={onOpenProduct} onConnect={null} compact />
        </HealthEmpty>
      </div>
    );
  }
  // Focus group, Nov 11: a background refresh swapped the page for a skeleton and back, which threw
  // her from Routine to Summary. With data already on screen, a refresh keeps the page.
  if (health.status === 'loading' && !rows.length) {
    return (
      <div className="ay-hd">{todayFeed}<div className="ay-hh-skeleton" role="status" aria-busy="true">
        <span className="sr-only">Loading your health data</span>
        <i className="is-hello" /><i className="is-hero" /><span><i /><i /><i /><i /></span>
      </div></div>
    );
  }
  if (health.status === 'error' && !rows.length) {
    return (
      <div className="ay-hd">{todayFeed}<div className="ay-hd-empty" role="alert">
        <h2>We couldn't load your health data</h2>
        <p>Check your connection and try again. Your data has not changed.</p>
        <button type="button" className="ay-qc-primary" onClick={() => health.refresh()}>Try again</button>
      </div></div>
    );
  }
  if (week.empty && !sections.length) {
    return (
      <div className="ay-hd">
        <HealthEmpty today={today} onConnect={onConnect} onOpenCheckin={onOpenCheckin} goalCount={selectedNeedIds.length} todayFeed={todayFeed} title={dataView ? 'Your data' : 'Your health'}>
          {/* Still useful before any data: her goals matched to her products, from the quiz. */}
          <HealthStarter needIds={selectedNeedIds} products={products} matches={matches} onOpenProduct={onOpenProduct} onConnect={null} compact />
        </HealthEmpty>
      </div>
    );
  }
  // Focus group (Zoleka, Nov 11; UCLA, Oct 1): one main takeaway at the top of Your data, from her own log.
  let top = null;
  if (dataView) { try { top = monthTopSymptom(readLog(), today); } catch { top = null; } }
  return (
    <div className="ay-hd">
      {top && (
        <section className="ay-hd-takeaway" aria-label="This month's takeaway">
          <p className="ay-hd-takeaway__k">This month</p>
          <p className="ay-hd-takeaway__t">{takeawayLine(top)}</p>
          {openAsk && <button type="button" className="ay-hd-takeaway__ask" onClick={() => openAsk({ question: `What could help with ${top.noun}?` })}>Ask what could help<span aria-hidden="true"> ›</span></button>}
        </section>
      )}
      <HealthHome
        title={dataView ? 'Your data' : 'Your health'}
        titleLevel={dataView ? 1 : 2}
        connections={health.connected || []}
        onRefresh={() => health.refresh()}
        status={health.status}
        rows={rows}
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
        onExplore={rundown?.onExplore}
        onOpenCheckin={onOpenCheckin}
        onAsk={openAsk ? (question, extra) => {
          // Health lines only with her opt-in (src/health/askHealthPref.js, off by
          // default); the Ask sheet can rebuild with it once she turns it on.
          const buildContext = (allowHealth) => dashboardContext({ cycle: week.cycle?.cycleDay ? week.cycle : null, estimate, ready, products, insights: extra?.insights || [], allowHealth });
          const withHealth = buildContext(true);
          const without = buildContext(false);
          openAsk({ question, context: askHealth.on ? withHealth : without, buildContext, usesHealth: withHealth !== without, stats: extra?.stats || null });
        } : undefined}
        onConnect={onConnect}
        footer={<OutlineButton onClick={onConnect}>Manage connected apps</OutlineButton>}
        surface="app"
        todayFeed={todayFeed}
      />
    </div>
  );
}
