import { useEffect, useMemo, useState } from 'react';
import { getSelectedNeeds, useCatalogReady } from '../../data/catalog.js';
import { moreRemaining } from '../../mobile/data/onboardingFlow.js';
import { reconstructIntakeFromSnapshot } from '../../mobile/data/intakeModel.js';
import { Plate } from '../ui/ay';
import MatchPill from '../MatchPill.jsx';
import { getEcosystemSeedFromQuiz, getProductMatchDetailsForProduct, getRecommendationMatchesAndRest } from '../../data/products.js';
import { isSafetyHold, isBleedingEvaluation } from '../../utils/matchDisplay.js';
import { whyLine } from '../../utils/whyLine.js';
import { bleedingCareNote, showableAsPick } from '../../utils/bleedingCare.js';
import BleedingEvaluationNote from '../match/BleedingEvaluationNote.jsx';
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
    // Bleeding after menopause: no products for that bleeding and never a
    // percent (same gate as Today and the product page).
    const seeded = Object.values(mergedProducts || {}).filter((product) => showableAsPick(product, answers));
    // Fewer than three on her shelves: top up from the same engine's ranked
    // matches (never the unranked rest of the catalog), so the reveal shows
    // her top 3 to 5 (critique, Oct 27).
    let extra = [];
    if (seeded.length < 3) {
      try {
        const have = new Set(seeded.map((p) => p.id));
        extra = (getRecommendationMatchesAndRest(answers).matches || []).filter((p) => p && !have.has(p.id) && showableAsPick(p, answers));
      } catch { extra = []; }
    }
    return [...seeded, ...extra].slice(0, limit).map((product) => {
      const details = getProductMatchDetailsForProduct(product, answers);
      const area = seedMeta?.[product.id]?.frustration || '';
      return { product, details, area, hold: isSafetyHold(details) || isBleedingEvaluation(details), why: whyLine(product, details) };
    });
  } catch {
    return [];
  }
}

/* The product on its white plate; if the photo is missing or fails, the brand's
   name sits on the plate instead (never an empty white square). */
function MatchPlate({ src, product }) {
  const [failed, setFailed] = useState(false);
  const word = String(product.brand || product.name || '').split(/\s+/)[0];
  // The shared white scalloped plate (signature 1), same as every product elsewhere.
  return <span className="ay-ob-match__plate is-plate" aria-hidden="true"><Plate src={src && !failed ? src : ''} alt="" fallback={word} imgProps={{ loading: 'lazy', onError: () => setFailed(true) }} /></span>;
}

export default function ReadyReveal({ answers = null, variant = 'app', signedIn = false, onSeeToday, onCreateAccount, onBack, onMorePersonal }) {
  const ready = useCatalogReady();
  const needs = useMemo(() => (ready ? revealNeeds(answers) : []), [answers, ready]);
  const matches = useMemo(() => (ready ? firstMatches(answers, 5) : []), [answers, ready]);
  const bleeding = useMemo(() => (ready ? bleedingCareNote(answers) : null), [answers, ready]);
  // Analytics: the first match is on screen (quiz start to first match).
  useEffect(() => { if (matches.length) trackFirstMatchShown({ surface: eventSurface(), matches_count: matches.length }); }, [matches.length]);
  const goals = (answers?.fullHealthIntake?.goals || []).slice(0, 2);
  const remaining = useMemo(() => (answers?.fullHealthIntake ? moreRemaining(reconstructIntakeFromSnapshot(answers.fullHealthIntake)) : 0), [answers]);
  const Tag = variant === 'web' ? 'section' : 'main';
  // Today on the website and the app (all-pages brief, Oct 25).
  const tab = 'Today';
  return (
    <Tag className={`ay-ob-ready uq-reveal is-${variant}`} aria-labelledby="ay-ob-ready-h">
      {onBack && (
        <button type="button" className="ay-ob-back" onClick={onBack} aria-label="Back to health data">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
        </button>
      )}
      {/* No "matched to you" stamp here any more: it covered the back button (critique, Oct 27). */}
      <h1 id="ay-ob-ready-h" className="ay-ob-ready__title">Your ayna is ready.</h1>
      {/* Care first: the prompt-evaluation message sits above her focus and picks. */}
      {bleeding && <BleedingEvaluationNote className="ay-ob-ready__care" title={bleeding.title} note={bleeding} />}
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
          <div className="ay-ob-matches__head">
            <h2 id="ay-ob-matches-h" className="ay-ob-matches__h">Your first matches</h2>
            {/* The % explained, one tap away (team meeting Oct 26). New tab on the website so the reveal stays. */}
            {variant === 'web' && <a className="ay-ob-how" href="/how-it-works" target="_blank" rel="noopener noreferrer">How we match<span className="ay-ob-sr"> (opens in a new tab)</span></a>}
          </div>
          {/* Her top 3 to 5 matches in a peeking row (critique, Oct 27: the reveal showed one). */}
          <ul className="ay-ob-matches__list ay-ob-peek" aria-label={`${matches.length} matches, scroll sideways for more`}>
            {matches.map(({ product, details, area, hold, why }, i) => {
              // The need chip only helps when the matches cover more than one need.
              const showArea = area && new Set(matches.map((m) => m.area).filter(Boolean)).size > 1;
              const src = safeProductImageSrc(product.image || product.imageUrl || product.images?.[0], product.type === 'digital');
              return (
                <li key={product.id} className={`ay-ob-match${i === 0 ? ' is-lead' : ''}`}>
                  <MatchPlate src={src} product={product} />
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
      <p className="ay-ob-ready__note">Change anything ayna uses any time in You, My health.</p>
      <div className="ay-ob-ready__actions">
        <button type="button" className="ay-ob-primary" onClick={onSeeToday}>See my {tab}</button>
        {/* Focus group, Oct 26: two people missed this, so it is the clear second
            button, right under the main one, with what it adds. */}
        {onMorePersonal && remaining > 0 && (
          <button type="button" className="ay-ob-more ay-ob-more--clear" onClick={onMorePersonal}>
            <span>Make my matches more personal<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
            <small>Adds your goals, budget and ingredient preferences to your matches. {remaining} optional {remaining === 1 ? 'question' : 'questions'}.</small>
          </button>
        )}
        {!signedIn && onCreateAccount && <button type="button" className="ay-ob-quiet" onClick={onCreateAccount}>{matches.length ? 'Save these matches' : 'Create an account to keep it'}</button>}
      </div>
    </Tag>
  );
}
