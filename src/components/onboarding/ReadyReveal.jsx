import { useEffect, useMemo } from 'react';
import { getSelectedNeeds, useCatalogReady } from '../../data/catalog.js';
import { moreRemaining } from '../../mobile/data/onboardingFlow.js';
import { reconstructIntakeFromSnapshot } from '../../mobile/data/intakeModel.js';
import { Seal } from '../personality/Bits.jsx';
import MatchPill from '../MatchPill.jsx';
import { getEcosystemSeedFromQuiz, getProductMatchDetailsForProduct } from '../../data/products.js';
import { isSafetyHold, isBleedingEvaluation } from '../../utils/matchDisplay.js';
import { whyLine } from '../../utils/whyLine.js';
import { safeProductImageSrc } from '../../utils/resolveProductImage.js';
import '../../styles/onboarding.css';
import './ReadyReveal.css';
import { eventSurface, trackFirstMatchShown } from '../../utils/analyticsEvents.js';

/**
 * The first personalized reveal (UX spec section 5), app and website.
 * "Your ayna is ready." Her top three needs come from the same selected-needs
 * logic the matcher uses (getSelectedNeeds), in the order she picked them.
 * Nothing here is invented: no needs means we say so plainly.
 */
function revealNeeds(answers, limit = 3) {
  if (!answers) return [];
  try {
    return getSelectedNeeds(answers).slice(0, limit).map((n) => ({ id: n.id, label: n.label }));
  } catch {
    return [];
  }
}

/**
 * Her first matches, straight from the engine (same seed the ecosystem uses),
 * so the quiz ends on real matches before any account (onboarding audit,
 * retention: value before account). Each with the one match pill and its
 * plain why line; a safety hold shows "Safety hold", never a number.
 */
function firstMatches(answers, limit = 3) {
  if (!answers) return [];
  try {
    const { mergedProducts, seedMeta } = getEcosystemSeedFromQuiz(answers);
    return Object.values(mergedProducts || {}).slice(0, limit).map((product) => {
      const details = getProductMatchDetailsForProduct(product, answers);
      const area = seedMeta?.[product.id]?.frustration || '';
      return { product, details, area, hold: isSafetyHold(details) || isBleedingEvaluation(details), why: whyLine(product, details) };
    });
  } catch {
    return [];
  }
}

export default function ReadyReveal({ answers = null, variant = 'app', signedIn = false, onSeeToday, onCreateAccount, onBack, onMorePersonal }) {
  const ready = useCatalogReady();
  const needs = useMemo(() => (ready ? revealNeeds(answers) : []), [answers, ready]);
  const matches = useMemo(() => (ready ? firstMatches(answers) : []), [answers, ready]);
  // Analytics: the first match is on screen (quiz start to first match).
  useEffect(() => { if (matches.length) trackFirstMatchShown({ surface: eventSurface(), matches_count: matches.length }); }, [matches.length]);
  const goals = (answers?.fullHealthIntake?.goals || []).slice(0, 2);
  const remaining = useMemo(() => (answers?.fullHealthIntake ? moreRemaining(reconstructIntakeFromSnapshot(answers.fullHealthIntake)) : 0), [answers]);
  const Tag = variant === 'web' ? 'section' : 'main';
  // Today on the website and the app (all-pages brief, Oct 25).
  const tab = 'Today';
  return (
    <Tag className={`ay-ob-ready is-${variant}`} aria-labelledby="ay-ob-ready-h">
      {onBack && (
        <button type="button" className="ay-ob-back" onClick={onBack} aria-label="Back to health data">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
      )}
      {/* The reveal is a stamp moment (INSPO onboarding 4: result as a seal): the
          "matched to you" seal lands once; still under reduced motion. */}
      <div className="ay-ob-ready__art" aria-hidden="true"><Seal className="ay-ob-ready__seal" /></div>
      <h1 id="ay-ob-ready-h" className="ay-ob-ready__title">Your ayna is ready.</h1>
      {needs.length ? (
        <>
          <p className="ay-ob-ready__lead">Based on what you told us, ayna will initially focus on:</p>
          <ol className="ay-ob-ready__list">
            {needs.map((n, i) => <li key={n.id} style={{ '--i': i }}><span aria-hidden="true">{i + 1}</span>{n.label}</li>)}
          </ol>
        </>
      ) : !ready ? (
        <p className="ay-ob-ready__lead" role="status">Getting your focus ready…</p>
      ) : (
        <p className="ay-ob-ready__lead">You didn’t pick anything specific, so {tab} starts with quick check-ins. Add what you want help with any time in You.</p>
      )}
      {matches.length > 0 && (
        <section className="ay-ob-matches" aria-labelledby="ay-ob-matches-h">
          <h2 id="ay-ob-matches-h" className="ay-ob-matches__h">Your first matches</h2>
          <ul className="ay-ob-matches__list">
            {matches.map(({ product, details, area, hold, why }) => {
              // The need chip only helps when the matches cover more than one need.
              const showArea = area && new Set(matches.map((m) => m.area)).size > 1;
              const src = safeProductImageSrc(product.image || product.imageUrl || product.images?.[0], product.type === 'digital');
              return (
                <li key={product.id} className="ay-ob-match">
                  <span className="ay-ob-match__plate" aria-hidden="true">{src ? <img src={src} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <i>{String(product.brand || product.name || '').split(/\s+/)[0]}</i>}</span>
                  <span className="ay-ob-match__text">
                    {/* Elure-style (#61): chips above the name. */}
                    <span className="ay-ob-match__chips">
                      <MatchPill size="sm" percent={details?.percent} hold={hold} />
                      {showArea && <em className="ay-ob-match__chip">{area}</em>}
                    </span>
                    <b>{product.name}</b>
                    {!hold && why && <span className="ay-ob-match__why">{why}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {goals.length > 0 && <p className="ay-ob-ready__goals">With your goals in mind: {goals.map((g) => g.charAt(0).toLowerCase() + g.slice(1)).join(' and ')}.</p>}
      <p className="ay-ob-ready__note">{tab} is where your daily rundown lives. You can see and change everything ayna uses in You, My health.</p>
      <div className="ay-ob-ready__actions">
        <button type="button" className="ay-ob-primary" onClick={onSeeToday}>See my {tab}</button>
        {onMorePersonal && remaining > 0 && (
          <button type="button" className="ay-ob-more" onClick={onMorePersonal}>
            <span>Make my matches more personal</span>
            <small>{remaining} quick optional {remaining === 1 ? 'question' : 'questions'}: goals, budget, ingredients</small>
          </button>
        )}
        {!signedIn && onCreateAccount && <button type="button" className="ay-ob-quiet" onClick={onCreateAccount}>{matches.length ? 'Save these matches' : 'Create an account to keep it'}</button>}
      </div>
    </Tag>
  );
}
