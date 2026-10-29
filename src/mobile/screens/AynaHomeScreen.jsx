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
import WeekBento, { glanceCharts } from '../../components/today/WeekBento.jsx';
import { findingTitle, usualBand } from '../../health/dashView.js';
import { takeaway } from '../../health/takeaway.js';
import { logStreak } from '../../health/streak.js';
import { HomeHero, HomeHighlights, HomeShortcuts, WeekLine, weekSentence } from '../components/HomeHero.jsx';
import MetricSheet from '../components/MetricSheet.jsx';
import MonthSheet from '../components/MonthSheet.jsx';
import { buildInsights } from '../../health/insights.js';
import { comingUp } from '../../health/comingUp.js';
import '../../styles/week-explained.css';
import TodayViews from '../components/TodayViews.jsx';
import RoutineTimeline from '../../components/routine/RoutineTimeline.jsx';
import '../ayna-home.css';

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
    omittedProducts = {}, routineHave = {}, onOpenSaved, onOpenCommunitySeed, recentAsks = [], readProgress = {},
  } = props;
  const goHome = () => onHomeView?.('home');
  const openDashboard = (thenLog = false) => { onHomeView?.('dashboard'); if (thenLog) setTimeout(() => openTodayLog('app'), 400); };
  const hasProfile = Boolean(lastQuizAnswers || quizAnswers);
  const hasProducts = hasEcosystem || myProducts.length > 0;
  const today = localToday();
  const hbc = usesHormonalBC(quizAnswers);
  // Her synced rows, read the dashboard's way (30-day charts, 90-day usual band); nothing new is computed.
  const data = useMemo(() => {
    const rows = healthInsightRows || [];
    const w = buildDashboard(rows, { days: 30, today });
    const long = buildDashboard(rows, { days: 90, today });
    const all = w.groups.flatMap((g) => g.charts);
    const chartOf = (m) => all.find((c) => c.metric === m) || null;
    const bandOf = (m) => usualBand(long.groups.flatMap((g) => g.charts).find((c) => c.metric === m)?.points, today);
    const cycle = w.cycle?.cycleDay ? w.cycle : null;
    return { rows, cycle, chartOf, bandOf, charts: rows.length ? glanceCharts(w) : [] };
  }, [healthInsightRows, today]);
  const { cycle, chartOf, bandOf, charts } = data;
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
  const [dayLog, setDayLog] = useState({});
  const onLogged = (days, log) => { setLoggedDays(days); setDayLog(log || {}); };
  const streak = logStreak(loggedDays, today);
  // "Your month" (the streak row opens it): the existing cycle estimate and coming-up dates, nothing new.
  const [monthOpen, setMonthOpen] = useState(false);
  const monthData = useMemo(() => {
    if (!monthOpen) return null;
    const estimate = data.rows.length ? buildInsights(data.rows, { today }).sections.find((s) => s.id === 'cycle')?.estimate || null : null;
    return { estimate, coming: comingUp(cycle, estimate, today, { hormonalBC: hbc, hasProducts: myProducts.length > 0 }) };
  }, [monthOpen, data, today, cycle, hbc, myProducts.length]);
  // One metric's detail as a bottom sheet (the dials, the highlights and the week tiles all open it).
  const [sheet, setSheet] = useState(null);
  const openMetric = (m) => { if (m === 'cycle' ? cycle : m && chartOf(m)) setSheet(m); else openDashboard(); };
  const weekBento = charts.length > 0 && (
    <WeekBento variant="home" charts={charts} bandOf={bandOf} today={today} onOpen={(area, metric) => openMetric(metric)} />
  );
  const firstName = String(authUser?.user_metadata?.first_name || '').split(' ')[0];
  const ask = (q, extra) => onAskAyna?.(typeof q === 'string' ? { question: q, ...(extra || {}) } : q);

  // One toggle, one view at a time (founder Oct 26 evening): nothing stacked, nothing removed.
  // TodayFeed keeps safety and care above it and hands in her 1 to 3 things for the Today view.
  // Home, in the order the founder ranked it (Oct 26 21:46): the hero (dials, Rundown bubble, streak),
  // then this week's highlights, then Your data / Your products, then one toggle. TodayFeed keeps safety
  // and care above all of this and hands in her 1 to 3 things for the Today view.
  const renderViews = ({ things, count, hasCheckIn }) => (
    <>
      <HomeHighlights items={highlights} today={today} onOpen={openMetric} />
      <div data-tour="home-links">
        <HomeShortcuts cycle={cycle} sleep={chartOf('sleep_minutes')} products={myProducts} onData={() => openDashboard()} onProducts={() => onHomeView?.('products')} />
      </div>
      <TodayViews
        todayCount={count}
        initial={charts.length ? 'week' : 'today'}
        week={weekBento ? <section className="ay-homeweek" aria-labelledby="ay-homeweek-h"><h2 id="ay-homeweek-h" className="sr-only">Your week</h2><WeekLine text={weekSentence(charts, takeaway)} />{weekBento}</section> : null}
        routine={<RoutineTimeline cycle={hbc ? null : cycle} userId={authUser?.id || null} quizAnswers={lastQuizAnswers || quizAnswers} matchOpts={matchOpts} products={myProducts} saved={savedProducts} omitted={omittedProducts} have={routineHave} onOpenRoutine={() => openDashboard()} onOpenProduct={onOpenProduct} onCheckIn={() => openDashboard(true)} emptyAction={onBrowse ? <button type="button" className="ay-tv__more" onClick={() => onBrowse()}>Explore products</button> : null} />}
        today={<>
          {things}
          {/* The check-in item already opens the log; the row is for days without one. */}
          {!hasCheckIn && <div className="ay-tv__log"><span><b>Your log</b><small>Pain, flow, sleep, mood</small></span><button type="button" onClick={() => openDashboard(true)}>Check in</button></div>}
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
                : <EmptyState art="spark" title={lastQuizAnswers ? 'No strong matches yet' : 'Your products live here'} body={lastQuizAnswers ? 'Nothing passed the bar for your goals yet. Explore has everything, with your match on each product.' : 'Create your health profile and ayna shows the products that fit you, each with the reason why.'} actionLabel={lastQuizAnswers ? 'Explore products' : 'Create your health profile'} onAction={lastQuizAnswers ? () => onBrowse?.() : onStartQuiz} secondaryLabel={lastQuizAnswers ? null : 'Explore products'} onSecondary={() => onBrowse?.()} />}
              <LegalFooter />
            </div>}
        </div>
      )}
      <div className="ay-home__view ay-homescreen" hidden={homeView !== 'home'} data-tour="home">
        <MobileHeader />
        <h1 className="sr-only">Home</h1>
        {!hasProfile && quizDraft && onResumeQuiz && <FinishQuizCard progress={quizDraft} onContinue={onResumeQuiz} onStartOver={onStartOverQuiz} />}
        {/* The data is the hero (founder Oct 26 21:46): greeting, three dials, the Rundown bubble and her streak. */}
        <HomeHero name={firstName} today={today} cycle={cycle} hormonalBC={hbc} sleep={chartOf('sleep_minutes')} activity={chartOf('steps')}
          onOpenMetric={openMetric} onConnect={authUser ? onOpenHealthData || onConnectHealth : onConnectHealth} streak={streak} onLog={() => openDashboard(true)} onMonth={() => setMonthOpen(true)} />
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
          onSetUp={!hasProfile && !quizDraft ? onStartQuiz : undefined}
          community={rundownCommunity}
          onOpenPost={onOpenCommunityPost}
          onRundownFinish={onRundownFinish}
          onOpenFull={(item, o) => openDashboard(Boolean(o?.log))}
          moreHeading={false}
          renderViews={renderViews}
          onLogged={onLogged}
        />
        </div>
      </div>
      {monthOpen && monthData && (
        <MonthSheet today={today} rows={data.rows} log={dayLog} cycle={cycle} estimate={monthData.estimate} coming={monthData.coming} hormonalBC={hbc}
          onLog={() => openDashboard(true)} onClose={() => setMonthOpen(false)} />
      )}
      {sheet && (
        <MetricSheet metric={sheet} today={today} cycle={cycle} hormonalBC={hbc} bandOf={bandOf}
          chartFor={(m, n) => buildDashboard(data.rows, { days: n, today }).groups.flatMap((g) => g.charts).find((c) => c.metric === m) || null}
          areaLabel="in Your data" onSeeArea={() => openDashboard()} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}
