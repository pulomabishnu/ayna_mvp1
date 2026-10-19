import { Routine, ShoppingList } from '../components/RoutinePlan.jsx';
import { budgetMax } from '../../health/plan.js';
import { SOURCE_NAMES } from '../data/healthConnections.js';
import './profile/health-connections.css';

/**
 * End of the quiz, right before her matches: what her data shows, her
 * routine and her shopping list, all from the products matching picked and
 * her own data. A suggested goal is only added when she taps it.
 */
const planIntro = (products) => {
  const toBuy = products.filter((p) => p.type !== 'digital').length;
  const n = products.length;
  const head = `${n} ${n === 1 ? 'match' : 'matches'} for you`;
  if (toBuy === n) return `${head}, as a routine and a shopping list.`;
  if (!toBuy) return `${head}, as a routine. They are apps and services, so nothing to buy in a store.`;
  return `${head}: ${toBuy} to buy and ${n - toBuy} ${n - toBuy === 1 ? 'app or service' : 'apps or services'}.`;
};
const SUGGEST_LABEL = { 'sleep.trouble': 'sleep', 'cycle.irregular': 'irregular cycles', 'energy.fatigue': 'low energy' };
const fromLine = (sources = []) => {
  const names = sources.map((s) => SOURCE_NAMES[s] || s);
  return names.length ? `From ${names.join(' and ')}` : null;
};

export default function PlanScreen({
  planProducts = [], planInsights = null, planSuggestions = [], planAddedGoals = {}, onAddPlanGoal,
  routineHave = {}, onToggleHave, onOpenProduct, onSeeMatches, onBack, planAnswers = null,
}) {
  const budget = budgetMax(planAnswers);
  const ready = (planInsights?.sections || []).filter((s) => s.status === 'ready');
  const building = (planInsights?.sections || []).filter((s) => s.status === 'building');
  return (
    <main className="ay-qc ay-plan">
      <header className="ay-qc-top">
        <button type="button" className="ay-qc-back" onClick={onBack} aria-label="Back to health data">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <ol className="ay-qc-steps" aria-label="Almost done">
          <li className="is-done">Quiz</li><li className="is-done">Health data</li><li className="is-on" aria-current="step">Your plan</li>
        </ol>
      </header>
      <div className="ay-qc-copy">
        <h1>Your <em>plan.</em></h1>
        <p>{planProducts.length ? planIntro(planProducts) : 'Your answers are in. Here is what we have so far.'}</p>
      </div>

      {(ready.length > 0 || building.length > 0) && (
        <section className="ay-plan-data" aria-labelledby="ay-plan-data-title">
          <h2 id="ay-plan-data-title">What your data shows</h2>
          {ready.length > 0 && (
            <ul className="ay-hd-lines">
              {ready.map((s) => (
                <li key={s.id} className={`is-${s.id}`}>
                  <b>{s.title}</b>
                  <span>{s.plain || s.explanation || s.headline}</span>
                </li>
              ))}
            </ul>
          )}
          {ready.length > 0 && fromLine([...new Set(ready.flatMap((s) => s.sources))]) && <p className="ay-hd-small">{fromLine([...new Set(ready.flatMap((s) => s.sources))])}. Trends, not diagnoses.</p>}
          {!ready.length && <p className="ay-rt-lede">Your data is in. Trends show up once there are about two weeks of it.</p>}
          {planSuggestions.map((s) => (
            <div key={s.needId} className="ay-hd-suggest-item">
              <p>{s.summary}. Want ayna to match you for {SUGGEST_LABEL[s.needId] || 'it'} too?</p>
              {planAddedGoals[s.needId]
                ? <p className="ay-hd-added" role="status">Added. Your matches include {SUGGEST_LABEL[s.needId] || 'it'}.</p>
                : <button type="button" className="ay-hc-primary" onClick={() => onAddPlanGoal?.(s.needId)}>Add {SUGGEST_LABEL[s.needId] || 'it'} to my goals</button>}
            </div>
          ))}
        </section>
      )}

      <Routine products={planProducts} insights={planInsights} onOpenProduct={onOpenProduct} budget={budget} />
      <ShoppingList products={planProducts} insights={planInsights} have={routineHave} onToggleHave={onToggleHave} onOpenProduct={onOpenProduct} budget={budget} />

      <footer className="ay-qc-foot">
        <button type="button" className="ay-qc-primary" onClick={onSeeMatches}>See my matches</button>
      </footer>
    </main>
  );
}
