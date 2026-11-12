import { useMemo, useState } from 'react';
import TodayScreen from './TodayScreen.jsx';
import EcosystemScreen from './EcosystemScreen.jsx';
import MobileHeader from '../components/MobileHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FinishQuizCard from '../../components/FinishQuizCard.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import TodayFeed from '../../components/today/TodayFeed.jsx';
import { openTodayLog } from '../../components/today/openLog.js';
import { buildDashboard } from '../../health/dashboard.js';
import { explainWeek, usesHormonalBC } from '../../health/weekInsights.js';
import { localToday } from '../hooks/useHealthData.js';
import HomeWidgets from '../../home/HomeWidgets.jsx';
import { glanceCharts } from '../../components/today/WeekBento.jsx';
import { findingTitle, usualBand } from '../../health/dashView.js';
import { logStreak } from '../../health/streak.js';
import { HomeHero, HomeHighlights, HomeShortcuts } from '../components/HomeHero.jsx';
import MetricSheet from '../components/MetricSheet.jsx';
import MonthSheet from '../components/MonthSheet.jsx';
import { buildInsights } from '../../health/insights.js';
import { comingUp } from '../../health/comingUp.js';
import { flowRowsFromLog, readLog, sleepFromLog } from '../../health/dailyLog.js';
import '../../styles/week-explained.css';
import TodayViews from '../components/TodayViews.jsx';
import TodayPlan from '../../components/today/TodayPlan.jsx';
import { getSelectedNeeds } from '../../data/products.js';
import RoutineTimeline from '../../components/routine/RoutineTimeline.jsx';
import '../ayna-home.css';
import HealthRefreshPrompt from '../../components/health/HealthRefreshPrompt.jsx';

/**
 * The app's centre tab, Home (team sync, Oct 25; founder, Oct 24 22:05):
 * dashboard first, on ONE phone screen with no scrolling. The "Ask ayna"
 * bar (its sheet has prompts from her data, the box and the mic), the Daily
 * Rundown card, 1 to 3 things for today (each the fact, then "Ask why"), one
 * health data / log row, and the rest one tap away:
 *   dashboard  everything else from Today (routine, the log, health data,
 *              More for you), Back to Home
 *   products   her matches and My ecosystem shelves, Back to Home
 *   chat       Ask ayna full screen (MobileApp draws AskAynaModal), Back to Home
 * Home stays mounted (hidden) under the chat and Products, so the Daily
 * Rundown still opens on its own each morning (autoLaunch.js). Only one
 * Today feed is ever mounted: the full dashboard replaces it while open.
 */
export default function AynaHomeScreen(props) {
  const {
    homeView = 'home', onHomeView, onAskAyna, hasEcosystem = false, myProducts = [], suggestedEcosystemProducts = [],
    quizDraft = null, onResumeQuiz, onStartOverQuiz, onStartQuiz, onBrowse, lastQuizAnswers = null, quizAnswers = null, matchOpts, authUser = null,
    onOpenProduct, onEditIntakeStep, onRetake, onUpdateIntake, savedProducts = {}, onToggleSaved, onOpenWhyMatch, articles = [], onOpenArticle,
    rundownCommunity = [], onOpenCommunityPost, onRundownFinish, healthInsightRows = [], healthSummary = null, healthConnectedCount = 0, onOpenHealthData, onConnectHealth,
    omittedProducts = {}, routineHave = {}, onAddGoal = null, onOpenSaved, onOpenCommunitySeed, recentAsks = [], readProgress = {},
  } = props;
  const goHome = () => onHomeView?.('home');
  // Founder, Nov 10 ("the period and symptom log doesn't take you anywhere"): logging is free and
  // happens right here on Home. It used to switch to the dashboard, which is behind ayna Pro.
  const logHere = () => openTodayLog('app');
  const openDashboard = (thenLog = false) => { onHomeView?.('dashboard'); if (thenLog) setTimeout(() => openTodayLog('app'), 400); };
  const hasProfile = Boolean(lastQuizAnswers || quizAnswers);
  const hasProducts = hasEcosystem || myProducts.length > 0;
  const today = localToday();
  const hbc = usesHormonalBC(quizAnswers);
  // Her own log (TodayFeed reports changes; the calendar saves into it too).
  const [dayLog, setDayLog] = useState(() => { try { return readLog(); } catch { return {}; } });
  // Her synced rows, read the dashboard's way (30-day charts, 90-day usual band); nothing new is computed.
  // Founder, Nov 11: periods she logs on ayna count too, so the cycle dial works without another app.
  const data = useMemo(() => {
    const rows = [...(healthInsightRows || []), ...flowRowsFromLog(dayLog)];
    const w = buildDashboard(rows, { days: 30, today });
    const long = buildDashboard(rows, { days: 90, today });
    const all = w.groups.flatMap((g) => g.charts);
    const chartOf = (m) => all.find((c) => c.metric === m) || null;
    const bandOf = (m) => usualBand(long.groups.flatMap((g) => g.charts).find((c) => c.metric === m)?.points, today);
    const cycle = w.cycle?.cycleDay ? w.cycle : null;
    return { rows, cycle, chartOf, bandOf, charts: rows.length ? glanceCharts(w) : [] };
  }, [healthInsightRows, today, dayLog]);
  const { cycle, chartOf, bandOf, charts } = data;
  // Founder, Nov 11 ("I've been logging my sleep on ayna and it hasn't been showing"): with no watch
  // or ring, the Sleep dial shows her own sleep log for the last 7 days.
  const sleepLog = useMemo(() => sleepFromLog(dayLog, today), [dayLog, today]);
  // This week's highlights: the same findings as Your data (explainWeek), one sentence each with its chart.
  const highlights = useMemo(() => {
    if (!data.rows.length) return [];
    return explainWeek(data.rows, { today, cycle, estimate: null, hormonalBC: hbc, max: 5 }).insights.map((i) => {
      const c = chartOf(i.metric);
      return { id: i.id, metric: c ? i.metric : null, title: findingTitle(i), label: c ? (c.metric === 'sleep_minutes' ? 'Sleep' : c.metric === 'steps' ? 'Steps' : c.label) : 'Your week', chart: c, band: c ? bandOf(c.metric) : null };
    });
  }, [data, today, cycle, hbc, chartOf, bandOf]);
  // Her logging streak, from the days her log has entries (TodayFeed reports them).
  const [loggedDays, setLoggedDays] = useState([]);
  const onLogged = (days, log) => { setLoggedDays(days); setDayLog(log || {}); };
  const streak = logStreak(loggedDays, today);
  // "Your month" (the streak row opens it): the existing cycle estimate and coming-up dates, nothing new.
  const [monthOpen, setMonthOpen] = useState(false);
  const monthData = useMemo(() => {
    if (!monthOpen) return null;
    // Her own period logs count too (founder, Nov 11), so the estimate works without another app.
    const rows = data.rows;
    const estimate = rows.length ? buildInsights(rows, { today }).sections.find((s) => s.id === 'cycle')?.estimate || null : null;
    return { estimate, coming: comingUp(cycle, estimate, today, { hormonalBC: hbc, hasProducts: myProducts.length > 0 }) };
  }, [monthOpen, data, today, cycle, hbc, myProducts.length]);
  // For today's insight: the first finding of her week. Sleep under her usual becomes a "Sleep better" topic.
  const todayInsight = useMemo(() => {
    const hl = highlights[0];
    if (!hl) return null;
    const sleepLow = highlights.find((x) => x.metric === 'sleep_minutes' && /under|less|short/i.test(x.title));
    if (sleepLow) return { topic: 'sleep', line: sleepLow.title, metric: 'sleep_minutes', label: 'Sleep' };
    return { topic: null, line: hl.title, metric: hl.metric, label: hl.label };
  }, [highlights]);
  // Things to add to her routine: her own matches (already cleared by the engine), minus what she has.
  const todayPicks = useMemo(() => {
    const mine = new Set(myProducts.map((p) => p.id));
    return (suggestedEcosystemProducts || []).filter((p) => p?.id && !mine.has(p.id) && !omittedProducts?.[p.id]).slice(0, 6);
  }, [suggestedEcosystemProducts, myProducts, omittedProducts]);
  const [goalsAdded, setGoalsAdded] = useState([]);
  // Her goals: the needs she chose in the quiz or added with "Make it a goal".
  const myGoals = useMemo(() => { try { const q = lastQuizAnswers || quizAnswers; return q ? getSelectedNeeds(q).map((n) => ({ id: n.id, label: n.label })) : []; } catch { return []; } }, [lastQuizAnswers, quizAnswers]);
  // One metric's detail as a bottom sheet (the dials, the highlights and the week tiles all open it).
  const [sheet, setSheet] = useState(null);
  const openMetric = (m) => { if (m === 'cycle' ? cycle : m && chartOf(m)) setSheet(m); else openDashboard(); };
  const firstName = String(authUser?.user_metadata?.first_name || '').split(' ')[0];
  const ask = (q, extra) => onAskAyna?.(typeof q === 'string' ? { question: q, ...(extra || {}) } : q);

  // One toggle, one view at a time (founder Oct 26 evening): nothing stacked, nothing removed.
  // TodayFeed keeps safety and care above it and hands in her 1 to 3 things for the Today view.
  // Home, in the order the founder ranked it (Oct 26 21:46): the hero (dials, Rundown bubble, streak),
  // then this week's highlights, then Your data / Your products, then one toggle. TodayFeed keeps safety
  // and care above all of this and hands in her 1 to 3 things for the Today view.
  const renderViews = ({ things, count, hasCheckIn, flags = {} }) => (
    <>
      <HomeHighlights items={highlights} today={today} onOpen={openMetric} />
      <div data-tour="home-links">
        <HomeShortcuts cycle={cycle} sleep={chartOf('sleep_minutes')} products={myProducts} onData={() => openDashboard()} onProducts={() => onHomeView?.('products')} />
      </div>
      {/* Founder, Nov 10: the set-up steps live on You, not Home (too crowded here). */}
      <TodayViews
        todayCount={count}
        initial="today"
        // Founder, Nov 11 ("less repetitive"): the dials and highlights already show her week, so
        // Home has no third copy of it; the full week is one tap away in Your data.
        routine={<RoutineTimeline suggested={suggestedEcosystemProducts} cycle={hbc ? null : cycle} userId={authUser?.id || null} quizAnswers={lastQuizAnswers || quizAnswers} matchOpts={matchOpts} products={myProducts} saved={savedProducts} omitted={omittedProducts} have={routineHave} onOpenRoutine={() => openDashboard()} onOpenProduct={onOpenProduct} onCheckIn={() => openDashboard(true)} emptyAction={onBrowse ? <button type="button" className="ay-tv__more" onClick={() => onBrowse()}>Explore products</button> : null} />}
        today={<>
          {/* Founder, Nov 11: For today is insights and actions (goals, matched products, things to
              add to her routine) as a bento; the check-in itself lives in the period and symptom log. */}
          <TodayPlan entry={dayLog?.[today] || null} pregnant={Boolean(flags.pregnant)} postCycle={Boolean(flags.postCycle)}
            insight={todayInsight} picks={todayPicks} myProductIds={myProducts.map((p) => p.id)}
            onOpenLog={() => setMonthOpen(true)} onOpenRead={(id) => { const a = articles.find((x) => x.id === id); if (a) onOpenArticle?.(a); }}
            onExplore={onBrowse ? (q) => onBrowse(q) : undefined} onOpenProduct={onOpenProduct} onAddToRoutine={props.onAddToEcosystem || null}
            onAddGoal={onAddGoal ? (g) => { onAddGoal(g); setGoalsAdded((x) => [...x, g]); } : null} goalsAdded={goalsAdded}
            onOpenInsight={todayInsight?.metric ? () => openMetric(todayInsight.metric) : null}
            goals={myGoals} log={dayLog} today={today} />
          {things}
          {/* Her widgets (Customize Home); with no customization, the health data / log row as before. */}
          <HomeWidgets
            // The dials and Your week already show sleep; the default health row would repeat it (unless she chose it in Edit).
            // With no health data, the default row is just "Your log" again under the Check in row above (Oct 28 audit).
            hideDefault={charts.length || (!hasCheckIn && !healthConnectedCount) ? ['health'] : []}
            surface="app"
            userId={authUser?.id || null}
            data={{
              healthRows: healthInsightRows || [], healthSummary, healthConnectedCount, hormonalBC: usesHormonalBC(quizAnswers), quizAnswers,
              saved: Object.values(savedProducts || {}), myProducts,
              routineSource: { userId: authUser?.id || null, quizAnswers, matchOpts, products: myProducts, saved: savedProducts, omitted: omittedProducts },
              askHistory: recentAsks, readProgress, articles, newPosts: rundownCommunity,
            }}
            on={{
              ask, openLog: () => openDashboard(true), openHealth: authUser && onOpenHealthData ? onOpenHealthData : () => openDashboard(),
              connect: authUser ? onOpenHealthData || onConnectHealth : onConnectHealth, openProduct: onOpenProduct, openSaved: onOpenSaved,
              openEcosystem: () => onHomeView?.('products'), openRoutine: () => openDashboard(), openPost: onOpenCommunityPost,
              openPlaylist: onOpenCommunitySeed ? (playlistId) => onOpenCommunitySeed({ playlistId }) : null,
              openCommunity: onOpenCommunitySeed ? () => onOpenCommunitySeed({}) : null, openArticle: onOpenArticle,
            }}
          >
          </HomeWidgets>
        </>}
      />
    </>
  );

  if (homeView === 'dashboard') {
    return (
      <div className="ay-home" data-view="dashboard">
        <div className="ay-home__view">
          <TodayScreen {...props} homeTop={<MobileHeader onBack={goHome} />} />
        </div>
      </div>
    );
  }
  return (
    <div className="ay-home" data-view={homeView}>
      {homeView === 'products' && (
        <div role="region" aria-label="Your products" className="ay-home__view">
          {hasProducts
            ? <EcosystemScreen {...props} onBack={goHome} />
            : <div className="ayna-fresh-ecosystem eco-app">
              <MobileHeader onBack={goHome} />
              <h1 className="sr-only">Your products</h1>
              {quizDraft && onResumeQuiz
                ? <FinishQuizCard progress={quizDraft} onContinue={onResumeQuiz} onStartOver={onStartOverQuiz} />
                : <EmptyState art="spark" title={lastQuizAnswers ? 'Build your ecosystem' : 'Your products live here'} body={lastQuizAnswers ? 'Add the products you use or like from Shop. ayna learns from them and suggests similar ones in your Daily Rundown.' : 'Create your health profile and ayna shows the products that fit you, each with the reason why.'} actionLabel={lastQuizAnswers ? 'Explore Shop' : 'Create your health profile'} onAction={lastQuizAnswers ? () => onBrowse?.() : onStartQuiz} secondaryLabel={lastQuizAnswers ? null : 'Explore products'} onSecondary={() => onBrowse?.()} />}
              <LegalFooter />
            </div>}
        </div>
      )}
      <div className="ay-home__view ay-homescreen" hidden={homeView !== 'home'} data-tour="home">
        <MobileHeader />
        <h1 className="sr-only">Home</h1>
        {!hasProfile && quizDraft && onResumeQuiz && <FinishQuizCard progress={quizDraft} onContinue={onResumeQuiz} onStartOver={onStartOverQuiz} />}
        {/* The data is the hero (founder Oct 26 21:46): greeting, three dials, the Rundown bubble and her streak. */}
        <HomeHero name={firstName} today={today} cycle={cycle} hormonalBC={hbc} sleep={chartOf('sleep_minutes')} sleepLog={sleepLog} activity={chartOf('steps')}
          onOpenMetric={openMetric} onConnect={authUser ? onOpenHealthData || onConnectHealth : onConnectHealth} streak={streak} onLog={logHere} onMonth={() => setMonthOpen(true)} />
        {/* "Is this still right?" for an old safety answer (src/health/healthRefresh.js). */}
        {authUser && quizAnswers && onUpdateIntake && <HealthRefreshPrompt variant="app" quizResults={quizAnswers} onSave={onUpdateIntake} onUpdate={onEditIntakeStep || null} />}
        {/* .ay-hd: the dashboard's own tokens and card styles, as on the full dashboard. */}
        <div className="ay-hd ay-homefeed">
        {/* Picture first (founder Oct 26 16:43): with health data, her week as a bento of real charts; else the hero art. */}
        <TodayFeed
          compact
          variant="app"
          userId={authUser?.id || null}
          intake={quizAnswers}
          healthRows={healthInsightRows || []}
          cycle={cycle}
          hormonalBC={usesHormonalBC(quizAnswers)}
          products={[...myProducts, ...suggestedEcosystemProducts]}
          onOpenProduct={onOpenProduct}
          onAsk={ask}
          onEditAnswers={onEditIntakeStep || onRetake}
          onSaveToProfile={onUpdateIntake || null}
          matchOpts={matchOpts}
          saved={Object.values(savedProducts || {})}
          onToggleSaved={onToggleSaved}
          onWhyMatch={onOpenWhyMatch}
          onOpenRead={(id) => { const a = articles.find((x) => x.id === id); if (a) onOpenArticle?.(a); }}
          onExplore={onBrowse ? () => onBrowse() : undefined}
          onAddGoal={onAddGoal}
          onSetUp={!hasProfile && !quizDraft ? onStartQuiz : undefined}
          community={rundownCommunity}
          onOpenPost={onOpenCommunityPost}
          onRundownFinish={onRundownFinish}
          // Rundown details and the log open right here on Home (founder, Nov 10: no dead end behind Pro).
          homeLog
          moreHeading={false}
          renderViews={renderViews}
          onLogged={onLogged}
        />
        </div>
      </div>
      {monthOpen && monthData && (
        <MonthSheet today={today} rows={data.rows} log={dayLog} cycle={cycle} estimate={monthData.estimate} coming={monthData.coming} hormonalBC={hbc}
          onLog={() => { setMonthOpen(false); logHere(); }} onSaved={setDayLog} onClose={() => setMonthOpen(false)} />
      )}
      {sheet && (
        <MetricSheet metric={sheet} today={today} cycle={cycle} hormonalBC={hbc} bandOf={bandOf}
          chartFor={(m, n) => buildDashboard(data.rows, { days: n, today }).groups.flatMap((g) => g.charts).find((c) => c.metric === m) || null}
          areaLabel="in Your data" onSeeArea={() => openDashboard()} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}
