import { useState } from 'react';
import { Routine, ShoppingList } from '../components/RoutinePlan.jsx';
import { budgetMax } from '../../health/plan.js';
import { SOURCE_NAMES } from '../data/healthConnections.js';
import { productImageOverride } from '../../data/productImageOverrides.js';
import { safeProductImageSrc } from '../../utils/resolveProductImage.js';
import './profile/health-connections.css';
import './plan-screen.css';

/**
 * End of the quiz, right before her matches (founder, Nov 10: "really hard to read, super long,
 * you scroll for hours, redesign it"). One short page, in the order she reads it:
 *   1. one line: how many matches this quiz found, and what was already in her ecosystem
 *      (the count is the same number the results screen gave her)
 *   2. her matches as photo tiles, tap for the product
 *   3. what her data shows, three short rows at most
 *   4. "When to use each" and "Shopping list" as rows with a one-line preview; open on tap
 *   5. one button
 * Nothing new is computed; the routine, list and data rows are the same as before.
 */
const SUGGEST_LABEL = { 'sleep.trouble': 'sleep', 'cycle.irregular': 'irregular cycles', 'energy.fatigue': 'low energy' };
const fromLine = (sources = []) => {
  const names = sources.map((s) => SOURCE_NAMES[s] || s);
  return names.length ? `From ${names.join(' and ')}` : null;
};

function Tile({ product, onOpen }) {
  const src = productImageOverride(product) || safeProductImageSrc(product.image || product.imageUrl || product.images?.[0], product.type === 'digital');
  const [broken, setBroken] = useState(false);
  return (
    <li>
      <button type="button" className="ay-pl-tile" onClick={() => onOpen?.(product)}>
        <span className="ay-pl-tile__img">{src && !broken ? <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} /> : <span aria-hidden="true">{String(product.brand || product.name || '').split(/\s+/)[0]}</span>}</span>
        <span className="ay-pl-tile__name">{product.name}</span>
        {product.brand && <span className="ay-pl-tile__brand">{product.brand}</span>}
      </button>
    </li>
  );
}

function Fold({ title, preview, children }) {
  return (
    <details className="ay-pl-fold">
      <summary>
        <span className="ay-pl-fold__text"><b>{title}</b>{preview && <span>{preview}</span>}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </summary>
      <div className="ay-pl-fold__body">{children}</div>
    </details>
  );
}

export default function PlanScreen({
  planProducts = [], planNewIds = null, planInsights = null, planSuggestions = [], planAddedGoals = {}, onAddPlanGoal,
  routineHave = {}, onToggleHave, routineExcluded = {}, onToggleRoutineProduct,
  onOpenProduct, onSeeMatches, onBack, planAnswers = null,
}) {
  const budget = budgetMax(planAnswers);
  const ready = (planInsights?.sections || []).filter((s) => s.status === 'ready');
  const building = (planInsights?.sections || []).filter((s) => s.status === 'building');
  const newIds = new Set(planNewIds || planProducts.map((p) => p.id));
  const fresh = planProducts.filter((p) => newIds.has(p.id));
  const kept = planProducts.filter((p) => !newIds.has(p.id));
  const toBuy = planProducts.filter((p) => p && p.type !== 'digital' && !routineExcluded[p.id]);
  const sources = fromLine([...new Set(ready.flatMap((s) => s.sources || []))]);
  const lead = fresh.length
    ? `${fresh.length} ${fresh.length === 1 ? 'match' : 'matches'} for your needs${kept.length ? `, plus ${kept.length} already in your ecosystem` : ''}.`
    : kept.length ? `${kept.length} ${kept.length === 1 ? 'product' : 'products'} in your ecosystem.` : 'Your answers are in.';
  return (
    <main className="ay-qc ay-plan ay-pl">
      <header className="ay-qc-top">
        <button type="button" className="ay-qc-back" onClick={onBack} aria-label="Back to health data">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <ol className="ay-qc-steps" aria-label="Almost done">
          <li className="is-done">Quiz</li><li className="is-done">Health data</li><li className="is-on" aria-current="step">Your plan</li>
        </ol>
      </header>
      <div className="ay-pl-head">
        <h1>Your plan</h1>
        <p>{lead}</p>
      </div>

      {planProducts.length > 0 && (
        <section className="ay-pl-sec" aria-labelledby="ay-pl-matches">
          <h2 id="ay-pl-matches" className="sr-only">Your matches</h2>
          <ul className="ay-pl-tiles">{[...fresh, ...kept].slice(0, 6).map((p) => <Tile key={p.id} product={p} onOpen={onOpenProduct} />)}</ul>
          {planProducts.length > 6 && <p className="ay-pl-more">And {planProducts.length - 6} more in your matches.</p>}
        </section>
      )}

      {(ready.length > 0 || building.length > 0 || planSuggestions.length > 0) && (
        <section className="ay-pl-sec" aria-labelledby="ay-pl-data">
          <h2 id="ay-pl-data" className="ay-pl-h2">What your data shows</h2>
          {ready.length > 0
            ? <ul className="ay-pl-rows">{ready.slice(0, 3).map((s) => <li key={s.id}><b>{s.title}</b><span>{s.plain || s.explanation || s.headline}</span></li>)}</ul>
            : <p className="ay-pl-note">Trends show up after about two weeks of data.</p>}
          {sources && ready.length > 0 && <p className="ay-pl-note">{sources}. Trends, not diagnoses.</p>}
          {planSuggestions.map((s) => (
            <div key={s.needId} className="ay-pl-suggest">
              <p>{s.summary}. Match for {SUGGEST_LABEL[s.needId] || 'it'} too?</p>
              {planAddedGoals[s.needId]
                ? <p className="ay-pl-added" role="status">Added to your goals.</p>
                : <button type="button" className="ay-pl-add" onClick={() => onAddPlanGoal?.(s.needId)}>Add {SUGGEST_LABEL[s.needId] || 'it'}</button>}
            </div>
          ))}
        </section>
      )}

      {planProducts.length > 0 && (
        <section className="ay-pl-sec ay-pl-folds" aria-label="Routine and shopping list">
          <Fold title="When to use each" preview="Morning, night or as needed, with a how-to line">
            <Routine products={planProducts} insights={planInsights} onOpenProduct={onOpenProduct} budget={budget} excluded={routineExcluded} onToggleExcluded={onToggleRoutineProduct} />
          </Fold>
          {toBuy.length > 0 && (
            <Fold title="Shopping list" preview={`${toBuy.length} ${toBuy.length === 1 ? 'item' : 'items'} to buy, with where to get each`}>
              <ShoppingList products={planProducts} insights={planInsights} excluded={routineExcluded} have={routineHave} onToggleHave={onToggleHave} onOpenProduct={onOpenProduct} budget={budget} />
            </Fold>
          )}
        </section>
      )}

      <footer className="ay-qc-foot">
        <button type="button" className="ay-qc-primary" onClick={onSeeMatches}>See my matches</button>
      </footer>
    </main>
  );
}
