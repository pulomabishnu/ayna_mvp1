import { useMemo, useState } from 'react';
import TodayScreen from './TodayScreen.jsx';
import EcosystemScreen from './EcosystemScreen.jsx';
import MobileHeader from '../components/MobileHeader.jsx';
import HomeAskSheet from '../components/HomeAskSheet.jsx';
import { HomeHello, HomeHeroArt } from '../components/HomeArt.jsx';
import { readHomeLook } from '../components/homeLook.js';
import { askFromPrompt } from '../../utils/askPrompts.js';
import EmptyState from '../components/EmptyState.jsx';
import FinishQuizCard from '../../components/FinishQuizCard.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import TodayFeed from '../../components/today/TodayFeed.jsx';
import { openTodayLog } from '../../components/today/openLog.js';
import { buildDashboard } from '../../health/dashboard.js';
import { usesHormonalBC } from '../../health/weekInsights.js';
import { localToday } from '../hooks/useHealthData.js';
import HomeWidgets from '../../home/HomeWidgets.jsx';
import WeekBento, { cycleWordsFor, glanceCharts } from '../../components/today/WeekBento.jsx';
import { usualBand } from '../../health/dashView.js';
import '../../styles/week-explained.css';
import TodayViews from '../components/TodayViews.jsx';
import RoutinePlates from '../../components/routine/RoutinePlates.jsx';
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
    omittedProducts = {}, routineExcluded = {}, routineOutcomes = {}, routineHave = {}, onOpenSaved, onOpenCommunitySeed, recentAsks = [], readProgress = {},
  } = props;
  const [asking, setAsking] = useState(false);
  const goHome = () => onHomeView?.('home');
  const openDashboard = (thenLog = false) => { onHomeView?.('dashboard'); if (thenLog) setTimeout(() => openTodayLog('app'), 400); };
  const hasProfile = Boolean(lastQuizAnswers || quizAnswers);
  const hasProducts = hasEcosystem || myProducts.length > 0;
  const today = localToday();
  const cycle = useMemo(() => { const w = buildDashboard(healthInsightRows || [], { days: 30, today }); return w.cycle?.cycleDay ? w.cycle : null; }, [healthInsightRows, today]);
  // Sticker density preview (?homestyle=a|b, kept for the tab); the hero's number is her own data.
  const [look] = useState(readHomeLook);
  const sleepPoints = useMemo(() => buildDashboard(healthInsightRows || [], { days: 7, today }).groups.flatMap((g) => g.charts).find((c) => c.metric === 'sleep_minutes')?.points || [], [healthInsightRows, today]);
  // Today's week bento (same tiles as the dashboard), from her synced rows only.
  const weekBento = useMemo(() => {
    const rows = healthInsightRows || [];
    if (!rows.length) return null;
    const w = buildDashboard(rows, { days: 30, today });
    const long = buildDashboard(rows, { days: 90, today });
    const charts = glanceCharts(w);
    if (!charts.length && !cycle) return null;
    const bandOf = (m) => usualBand(long.groups.flatMap((g) => g.charts).find((c) => c.metric === m)?.points, today);
    const hbc = usesHormonalBC(quizAnswers);
    return <WeekBento cycle={cycle} cycleWords={cycleWordsFor(cycle, hbc)} hormonalBC={hbc} charts={charts} bandOf={bandOf} today={today} products={myProducts} productsLabel="Your products" onOpenProducts={() => onHomeView?.('products')} onOpen={() => onHomeView?.('dashboard')} />;
  }, [healthInsightRows, today, cycle, quizAnswers, myProducts, onHomeView]);
  const firstName = String(authUser?.user_metadata?.first_name || '').split(' ')[0];
  const ask = (q, extra) => onAskAyna?.(typeof q === 'string' ? { question: q, ...(extra || {}) } : q);

  // One toggle, one view at a time (founder Oct 26 evening): nothing stacked, nothing removed.
  // TodayFeed keeps safety and care above it and hands in her 1 to 3 things for the Today view.
  const renderViews = ({ things, count, hasCheckIn }) => (
    <TodayViews
      todayCount={count}
      onOpenProduct={onOpenProduct}
      onAllProducts={() => onHomeView?.('products')}
      groups={[
        { id: 'routine', label: 'Routine', items: myProducts.filter((p) => p?.id && !routineExcluded[p.id]) },
        { id: 'saved', label: 'Saved', items: Object.values(savedProducts || {}).filter((p) => p?.id) },
        { id: 'tried', label: 'Tried', items: myProducts.filter((p) => p?.id && Array.isArray(routineOutcomes[p.id]) && routineOutcomes[p.id].length) },
      ]}
      week={weekBento
        ? <section className="ay-homeweek" aria-labelledby="ay-homeweek-h"><h2 id="ay-homeweek-h" className="sr-only">Your week</h2>{weekBento}</section>
        : <HomeHeroArt look={look} products={[...myProducts, ...suggestedEcosystemProducts]} cycle={cycle} sleepPoints={sleepPoints} />}
      routine={<RoutinePlates userId={authUser?.id || null} quizAnswers={lastQuizAnswers || quizAnswers} matchOpts={matchOpts} products={myProducts} saved={savedProducts} omitted={omittedProducts} have={routineHave} onOpenRoutine={() => openDashboard()} onOpenProduct={onOpenProduct} onCheckIn={() => openDashboard(true)} emptyAction={onBrowse ? <button type="button" className="ay-tv__more" onClick={() => onBrowse()}>Explore products</button> : null} />}
      today={<>
        {things}
        {/* The check-in item already opens the log; the row is for days without one. */}
        {!hasCheckIn && <div className="ay-tv__log"><span><b>Your log</b><small>Pain, flow, sleep, mood</small></span><button type="button" onClick={() => openDashboard(true)}>Check in</button></div>}
        {/* Her widgets (Customize Home); with no customization, the health data / log row as before. */}
        <HomeWidgets
          // The week bento already shows sleep; its default health row would repeat it (unless she chose it in Edit).
          hideDefault={weekBento ? ['health'] : []}
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
          <nav className="ay-homelinks" data-tour="home-links" aria-label="More on Today">
            <button type="button" onClick={() => openDashboard()}><span><b>My dashboard</b><small>Routine, log and health data</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
            <button type="button" onClick={() => onHomeView?.('products')}><span><b>Your products</b><small>{hasProducts ? `${myProducts.length} in your ecosystem` : 'Products that fit you'}</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
          </nav>
        </HomeWidgets>
      </>}
    />
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
      <div className={`ay-home__view ay-homescreen is-look-${look}`} hidden={homeView !== 'home'} data-tour="home">
        <MobileHeader hideAsk />
        <h1 className="sr-only">Today</h1>
        <HomeHello name={firstName} today={today} />
        <button type="button" className="ay-homeask__bar" data-tour="home-ask" aria-haspopup="dialog" onClick={() => setAsking(true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" /></svg>
          <span>Ask ayna</span>
        </button>
        {!hasProfile && quizDraft && onResumeQuiz && <FinishQuizCard progress={quizDraft} onContinue={onResumeQuiz} onStartOver={onStartOverQuiz} />}
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
        />
        </div>
      </div>
      {asking && <HomeAskSheet signedIn={Boolean(authUser?.id)} hasProfile={hasProfile} onClose={() => setAsking(false)} onAsk={(req) => ask(req.question ? req : askFromPrompt(req))} />}
    </div>
  );
}
