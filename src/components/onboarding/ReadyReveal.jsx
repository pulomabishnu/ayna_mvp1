import { useEffect, useMemo, useState } from 'react';
import { useCatalogReady } from '../../data/catalog.js';
import { moreRemaining } from '../../mobile/data/onboardingFlow.js';
import { reconstructIntakeFromSnapshot, isStepAnswered, LIFE_STAGE_LABELS } from '../../mobile/data/intakeModel.js';
import { Plate } from '../ui/ay';
import { getEcosystemSeedFromQuiz, getProductMatchDetailsForProduct, getRecommendationMatchesAndRest, getProductById } from '../../data/products.js';
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
 * Nov 3: how many matches she got, one equal row per need she picked (from the
 * matcher's own shelves), then one clear next step and where her matches live.
 * Nothing here is invented: no needs means we say so plainly.
 */
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

/**
 * Nov 3 (founder: "how many matches u got, each category taken into account"):
 * one row per need she picked, straight from the matcher's shelves, in the
 * order she picked them, all the same size. A need with nothing shown says why
 * in plain words: held until the safety questions, or nothing strong enough yet.
 */
function perNeed(answers) {
  if (!answers) return { rows: [], total: 0 };
  try {
    const { shelves = [] } = getEcosystemSeedFromQuiz(answers);
    const seen = new Set();
    const rows = shelves.map((sh) => {
      const products = (sh.productIds || []).map((id) => getProductById(id)).filter((p) => p && showableAsPick(p, answers));
      products.forEach((p) => seen.add(p.id));
      const held = !products.length && ((sh.missingSafetyText || []).length > 0 || sh.restrictedCount > 0);
      return { id: sh.needId, label: sh.label, products, held };
    });
    return { rows, total: seen.size };
  } catch {
    return { rows: [], total: 0 };
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

export default function ReadyReveal({ answers = null, variant = 'app', signedIn = false, onSeeToday, onWatchWrapped, onCreateAccount, onBack, onMorePersonal }) {
  const ready = useCatalogReady();
  const matches = useMemo(() => (ready ? firstMatches(answers, 5) : []), [answers, ready]);
  const { rows, total } = useMemo(() => (ready ? perNeed(answers) : { rows: [], total: 0 }), [answers, ready]);
  const intakeNow = answers?.fullHealthIntake || {};
  const stageLabels = (intakeNow.lifeStageSelections || []).map((x) => LIFE_STAGE_LABELS[x]).filter(Boolean);
  const basedOn = [intakeNow.age ? `Age ${intakeNow.age}` : '', ...stageLabels].filter(Boolean);
  const bleeding = useMemo(() => (ready ? bleedingCareNote(answers) : null), [answers, ready]);
  // Analytics: the first match is on screen (quiz start to first match).
  useEffect(() => { if (matches.length) trackFirstMatchShown({ surface: eventSurface(), matches_count: matches.length }); }, [matches.length]);
  const remaining = useMemo(() => (answers?.fullHealthIntake ? moreRemaining(reconstructIntakeFromSnapshot(answers.fullHealthIntake)) : 0), [answers]);
  // Nov 3: the safety questions now come right after the reveal. Until they're
  // answered, anything she takes stays off her list, so ask for them first.
  const safetyLeft = useMemo(() => {
    if (!answers?.fullHealthIntake) return 0;
    const i = reconstructIntakeFromSnapshot(answers.fullHealthIntake);
    return ['conditions', 'allergies', 'medications'].filter((id) => !isStepAnswered(id, i)).length;
  }, [answers]);
  const Tag = variant === 'web' ? 'section' : 'main';
  return (
    <Tag className={`ay-ob-ready uq-reveal is-${variant}`} aria-labelledby="ay-ob-ready-h">
      {onBack && (
        <button type="button" className="ay-ob-back" onClick={onBack} aria-label="Back to health data">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
        </button>
      )}
      {/* No "matched to you" stamp here any more: it covered the back button (critique, Oct 27). */}
      {/* Nov 3 (founder): say how many, show every need she picked the same size, then what to do. */}
      <h1 id="ay-ob-ready-h" className="ay-ob-ready__title">{total > 0 ? <>We found <span className="ay-ob-count">{total}</span> {total === 1 ? 'match' : 'matches'} for you.</> : 'Your profile is ready.'}</h1>
      {basedOn.length > 0 && <p className="ay-ob-ready__based">Based on: {basedOn.join(' · ')}</p>}
      {/* Care first: the prompt-evaluation message sits above her picks. */}
      {bleeding && <BleedingEvaluationNote className="ay-ob-ready__care" title={bleeding.title} note={bleeding} />}
      {rows.length > 0 ? (
        <section className="ay-ob-needs" aria-labelledby="ay-ob-needs-h">
          <h2 id="ay-ob-needs-h" className="ay-ob-needs__h">What you asked for help with</h2>
          <ul className="ay-ob-needs__list">
            {rows.map((r, i) => (
              <li key={r.id} style={{ '--i': i }}>
                <span className="ay-ob-needs__top">
                  <b>{r.label}</b>
                  <em className={r.products.length ? '' : 'is-none'}>{r.products.length ? `${r.products.length} ${r.products.length === 1 ? 'match' : 'matches'}` : r.held ? 'After safety questions' : 'None yet'}</em>
                </span>
                {r.products.length > 0
                  ? <span className="ay-ob-needs__pics">{r.products.slice(0, 4).map((p) => <MatchPlate key={p.id} product={p} src={safeProductImageSrc(p.image || p.imageUrl || p.images?.[0], p.type === 'digital')} />)}</span>
                  : <small>{r.held ? 'Answer the safety questions below to see these.' : 'Nothing strong enough yet. We only show products we can stand behind.'}</small>}
              </li>
            ))}
          </ul>
        </section>
      ) : !ready ? (
        <p className="ay-ob-ready__lead" role="status">Getting your matches ready…</p>
      ) : (
        <p className="ay-ob-ready__lead">You didn’t pick anything specific, so {variant === 'web' ? 'your ecosystem starts with options to explore' : 'Today starts with quick check-ins'}. Add what you want help with any time in You.</p>
      )}
      {/* Nov 3 (founder: "not obvious to do the more questions", "shouldn't let you leave until
          you make an account"): a numbered checklist. Signed out, the last step is the free account
          (no way to the matches page without it); signed in, it's "See all N matches". */}
      <div className="ay-ob-ready__actions ay-ob-steps">
        <h2 className="ay-ob-steps__h">Your next steps</h2>
        <ol className="ay-ob-steps__list">
          <li className="is-done"><span className="ay-ob-steps__n" aria-hidden="true">✓</span><span><b>Answer 4 questions</b><small>Done</small></span></li>
          {onMorePersonal && safetyLeft > 0 && (
            <li className="is-now"><span className="ay-ob-steps__n" aria-hidden="true">2</span>
              <button type="button" className="ay-ob-steps__btn" onClick={onMorePersonal}><span><b>Answer {safetyLeft} safety {safetyLeft === 1 ? 'question' : 'questions'}</b><small>About your medicines and allergies. Unlocks vitamins and other things you take. 30 seconds.</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
            </li>
          )}
          {onMorePersonal && safetyLeft === 0 && remaining > 0 && (
            <li className="is-now"><span className="ay-ob-steps__n" aria-hidden="true">2</span>
              <button type="button" className="ay-ob-steps__btn" onClick={onMorePersonal}><span><b>Make my matches better</b><small>{remaining} quick {remaining === 1 ? 'question' : 'questions'}: your goals, budget and what you like.</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
            </li>
          )}
          <li className={onMorePersonal && (safetyLeft > 0 || remaining > 0) ? '' : 'is-now'}><span className="ay-ob-steps__n" aria-hidden="true">{onMorePersonal && (safetyLeft > 0 || remaining > 0) ? 3 : 2}</span>
            {!signedIn && onCreateAccount
              ? <button type="button" className="ay-ob-steps__btn is-main" onClick={onCreateAccount}><span><b>Save my {total > 0 ? `${total} ` : ''}matches</b><small>Make a free account so they’re here next time. No card needed.</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
              : <button type="button" className="ay-ob-steps__btn is-main" onClick={onSeeToday}><span><b>{variant === 'web' ? (total > 0 ? `See all ${total} matches` : 'See my ecosystem') : 'See my Today'}</b><small>They’re saved in {variant === 'web' ? 'Home, in the top menu' : 'Today'}.</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>}
          </li>
        </ol>
        {onWatchWrapped && total > 0 && signedIn && <button type="button" className="ay-ob-quiet ay-ob-steps__wrapped" onClick={onWatchWrapped}>Watch my ayna Wrapped</button>}
      </div>
    </Tag>
  );
}
