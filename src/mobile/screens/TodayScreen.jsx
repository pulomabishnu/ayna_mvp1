import './profile/health-connections.css';
import { useEffect, useMemo, useState } from 'react';
import { loadMonthlyCheckinStatus } from '../../utils/monthlyCheckinStore.js';
import MobileHeader from '../components/MobileHeader.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import { getSelectedNeeds } from '../../data/products.js';
import RoutineSummary from '../../components/routine/RoutineSummary.jsx';
import HealthDashboard from '../components/HealthDashboard.jsx';
import { usesHormonalBC } from '../../health/weekInsights.js';
import FinishQuizCard from '../../components/FinishQuizCard.jsx';
import '../eco-needs.css';
import '../eco-app-best.css';
import '../explore.css';
import { openTodayLog } from '../../components/today/openLog.js';

/**
 * Today: the first tab (founder, Oct 24 2026). The same content the
 * Ecosystem screen's "Today" segment showed (HealthDashboard, which mounts
 * TodayFeed, then her routine and the monthly check-in), now its own place.
 * Signed out or with no profile yet it still opens on something useful: the
 * Today feed's own welcoming state, plus one way to set up her profile.
 */
export default function TodayScreen({
  authUser = null, quizAnswers = null, lastQuizAnswers = null, myProducts = [], suggestedEcosystemProducts = [],
  onOpenProduct, onOpenSaved, onConnectHealth, onAddGoal, onOpenMonthlyCheckin, onRequireAuth, onRetake,
  routineOutcomes = {}, routineExcluded = {},
  routineHave = {}, onStartQuiz, quizDraft = null, onResumeQuiz, onStartOverQuiz,
  // Rundown and Today quick answers (same as the Ecosystem screen passed before Today became a tab).
  onEditIntakeStep, onUpdateIntake, savedProducts = {}, onToggleSaved, onOpenWhyMatch, articles = [], onOpenArticle, onBrowse,
  // The app's match inputs (Not for me, saved, history), so the Rundown shows the same % as Shop.
  matchOpts, omittedProducts = {}, onGoEco,
}) {
  // "See your routine": her full routine, schedule and shopping list in You > My ecosystem.
  const openRoutine = () => { onGoEco?.(); setTimeout(() => document.getElementById('ay-routines')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 400); };
  const [checkinDue, setCheckinDue] = useState(false);
  useEffect(() => {
    if (!authUser?.id) return undefined;
    let live = true;
    loadMonthlyCheckinStatus().then((st) => { if (live) setCheckinDue(!st?.thisMonthCheckin); }).catch(() => {});
    return () => { live = false; };
  }, [authUser?.id]);
  const goalIds = useMemo(() => (quizAnswers ? getSelectedNeeds(quizAnswers).map((n) => n.id) : []), [quizAnswers]);
  const hasProfile = Boolean(lastQuizAnswers || quizAnswers);
  const showCheckin = Boolean(checkinDue && onOpenMonthlyCheckin);

  return <div className="ayna-fresh-ecosystem ayna-cabinet-home eco-app ay-today-screen">
    <MobileHeader onOpenSaved={onOpenSaved} />
    {/* The greeting and date below (HealthHome) are the visible title, as on the website. */}
    <h1 id="ay-today-title" className="sr-only">Today</h1>

    {/* An unfinished setup stays in view; with no profile at all, the Daily
        Rundown card itself says how to make one (UX spec 3, 34). */}
    {!hasProfile && quizDraft && onResumeQuiz && <FinishQuizCard progress={quizDraft} onContinue={onResumeQuiz} onStartOver={onStartOverQuiz} />}

    {/* Today = the Daily Rundown card, then 1 to 3 decision items (safety and
        care can be more), then her log (founder, Oct 24). Everything else
        sits under "More for you"; the full routine schedule and shopping list
        live in You > My ecosystem. */}
    <div className="ay-eco-routine">
      <HealthDashboard authUser={authUser} selectedNeedIds={goalIds} hormonalBC={usesHormonalBC(quizAnswers)} products={myProducts} routineProducts={myProducts.filter((product) => !routineExcluded[product.id])} routineOutcomes={routineOutcomes} matches={suggestedEcosystemProducts} onOpenProduct={onOpenProduct} onConnect={onConnectHealth} onAddGoal={onAddGoal} onOpenRoutine={myProducts.length && onGoEco ? openRoutine : undefined} onOpenCheckin={showCheckin ? onOpenMonthlyCheckin : undefined} onSignIn={() => onRequireAuth?.('health data')} quizAnswers={quizAnswers} onEditAnswers={onEditIntakeStep || onRetake} onSaveToProfile={onUpdateIntake || null} rundown={{ matchOpts, saved: Object.values(savedProducts || {}), onToggleSaved, onWhyMatch: onOpenWhyMatch, onOpenRead: (id) => { const a = articles.find((x) => x.id === id); if (a) onOpenArticle?.(a); }, onExplore: onBrowse ? () => onBrowse() : undefined, onSetUp: !hasProfile && !quizDraft ? onStartQuiz : undefined }} />
      {/* Her routine per need, short (src/components/routine); the full one is in You > My ecosystem. */}
      <div className="ay-today-routines">
        <RoutineSummary variant="app" userId={authUser?.id || null} quizAnswers={lastQuizAnswers || quizAnswers} matchOpts={matchOpts} products={myProducts} saved={savedProducts} omitted={omittedProducts} have={routineHave} hideMedicines
          onOpenRoutine={onGoEco ? openRoutine : undefined}
          onOpenProduct={onOpenProduct}
          onCheckIn={() => openTodayLog('app')} />
      </div>
      {hasProfile && onOpenMonthlyCheckin && <section className="ayna-home-today ay-eco-checkin"><div><h2>Monthly check-in</h2><p>A few quick questions so your matches keep up with how you feel.</p></div><button type="button" onClick={onOpenMonthlyCheckin}>Start</button></section>}
    </div>
    <LegalFooter />
  </div>;
}
