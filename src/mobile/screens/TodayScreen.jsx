import './profile/health-connections.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { loadMonthlyCheckinStatus } from '../../utils/monthlyCheckinStore.js';
import MobileHeader from '../components/MobileHeader.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import { getSelectedNeeds } from '../../data/products.js';
import { Routine, ShoppingList } from '../components/RoutinePlan.jsx';
import HealthDashboard from '../components/HealthDashboard.jsx';
import { usesHormonalBC } from '../../health/weekInsights.js';
import { budgetMax } from '../../health/plan.js';
import FinishQuizCard from '../../components/FinishQuizCard.jsx';
import '../eco-needs.css';
import '../eco-app-best.css';
import '../explore.css';

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
  healthInsights = null, routineOutcomes = {}, onLogRoutineOutcome, routineExcluded = {}, onToggleRoutineProduct,
  routineHave = {}, onToggleHave, onSavePlaylist, onOpenPlaylist, onStartQuiz, quizDraft = null, onResumeQuiz, onStartOverQuiz,
}) {
  const routineRef = useRef(null);
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

    {/* No profile yet: one clear way in, never a dead end (UX spec 3, 34). */}
    {!hasProfile && (quizDraft && onResumeQuiz
      ? <FinishQuizCard progress={quizDraft} onContinue={onResumeQuiz} onStartOver={onStartOverQuiz} />
      : onStartQuiz && <section className="ay-today-welcome" aria-labelledby="ay-today-welcome-h">
        <h2 id="ay-today-welcome-h">Make Today yours</h2>
        <p>Create your health profile and Today shows what matters for you, with the reason for each thing.</p>
        <button type="button" className="eco-app-go" onClick={onStartQuiz}>Create your health profile</button>
      </section>)}

    <div className="ay-eco-routine">
      <HealthDashboard authUser={authUser} selectedNeedIds={goalIds} hormonalBC={usesHormonalBC(quizAnswers)} products={myProducts} routineProducts={myProducts.filter((product) => !routineExcluded[product.id])} routineOutcomes={routineOutcomes} matches={suggestedEcosystemProducts} onOpenProduct={onOpenProduct} onConnect={onConnectHealth} onAddGoal={onAddGoal} onOpenRoutine={myProducts.length ? () => routineRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }) : undefined} onOpenCheckin={showCheckin ? onOpenMonthlyCheckin : undefined} onSignIn={() => onRequireAuth?.('health data')} quizAnswers={quizAnswers} onEditAnswers={onRetake} />
      {myProducts.length > 0 && <div ref={routineRef} className="ay-eco-plan" id="ay-eco-plan">
        <Routine products={myProducts} insights={healthInsights} needIds={goalIds} outcomes={routineOutcomes} onLogOutcome={onLogRoutineOutcome} onOpenProduct={onOpenProduct} budget={budgetMax(quizAnswers)} excluded={routineExcluded} onToggleExcluded={onToggleRoutineProduct} />
        <ShoppingList products={myProducts} insights={healthInsights} excluded={routineExcluded} have={routineHave} onToggleHave={onToggleHave} onOpenProduct={onOpenProduct} onSavePlaylist={onSavePlaylist} onOpenPlaylist={onOpenPlaylist} budget={budgetMax(quizAnswers)} onRequireAuth={onRequireAuth} />
      </div>}
      {hasProfile && onOpenMonthlyCheckin && <section className="ayna-home-today ay-eco-checkin"><div><h2>Monthly check-in</h2><p>A few quick questions so your matches keep up with how you feel.</p></div><button type="button" onClick={onOpenMonthlyCheckin}>Start</button></section>}
    </div>
    <LegalFooter />
  </div>;
}
