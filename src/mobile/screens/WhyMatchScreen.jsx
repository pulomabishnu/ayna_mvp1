import { getProductMatchDetailsForProduct } from '../../data/products.js';
import MatchFeedback from '../../components/today/MatchFeedback.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import { needBreakdown, needHeadline, tierWord, confidenceNotes, exclusionLines, whyMatch, BASED_ON_LINE, shownMatchPercent, PARTIAL_FIT, isSafetyHold, SAFETY_HOLD, isBleedingEvaluation, BLEEDING_EVALUATION } from '../../utils/matchDisplay.js';
import SafetyHoldNote from '../../components/match/SafetyHoldNote.jsx';
import BleedingEvaluationNote from '../../components/match/BleedingEvaluationNote.jsx';
import '../match.css';
import '../eco-needs.css';
import '../../styles/match-ui.css';
import HealthWhyLine from '../../components/health/HealthWhyLine.jsx';
import { whyLine } from '../../utils/whyLine.js';

// Why this matches: what matched and the inputs it used. It never says why
// she has a symptom; missing answers lower confidence, never the percent.

const GOAL_COMPONENTS = new Set(['primaryGoal', 'otherNeeds', 'periodFlow', 'periodPain', 'utiFrequency']);
const PROFILE_COMPONENTS = new Set(['age', 'lifeStage', 'breastfeeding', 'postpartumTiming', 'pregnancyTrimester', 'perimenopauseLastPeriod', 'diagnoses', 'triedBefore']);

const ACRONYMS = ['adhd', 'pcos', 'pmos', 'pmdd', 'pms', 'ibs', 'uti', 'utis', 'hrt', 'iud', 'bv', 'ivf'];
const ACRONYM_RE = new RegExp(`\\b(${ACRONYMS.join('|')})\\b`, 'gi');
/** Profile answers can arrive lowercase ("adhd"); show acronyms properly. */
function tidy(text) {
  return String(text || '').replace(ACRONYM_RE, (m) => (m.toLowerCase() === 'utis' ? 'UTIs' : m.toUpperCase()));
}

function reasonKind(component) {
  if (GOAL_COMPONENTS.has(component)) return 'Your needs';
  if (PROFILE_COMPONENTS.has(component)) return 'Your profile';
  return 'Your preferences';
}

const TONE = { excellent: 'is-strong', strong: 'is-good', exploratory: 'is-partial', browse: 'is-partial' };

export default function WhyMatchScreen({ product, quizAnswers, matchOpts, onBack, onUpdateHealth, onViewDetails, onFixSafety = null }) {
  const details = getProductMatchDetailsForProduct(product, quizAnswers, null, matchOpts);
  const { percent, eligible, matchStatus, reasonDetails = [], considerations = [], unknowns = [], unmetNeeds = [], tier, access } = details;
  const hasScore = eligible !== false && matchStatus === 'scored' && Number.isFinite(percent) && percent > 0;
  const excluded = matchStatus === 'excluded' || eligible === false;
  // Held back for safety: no percent, no per-need numbers (founder, Oct 24).
  const held = isSafetyHold(details);
  const evaluation = isBleedingEvaluation(details);
  const why = whyMatch(details);
  const rows = matchStatus === 'no-profile' ? [] : needBreakdown(details);
  // Needs this product scores 0 on are listed once as "not for this" instead of empty bars.
  const scoredRows = rows.filter((r) => r.score > 0 || r.restricted);
  const offRows = rows.filter((r) => !(r.score > 0 || r.restricted));
  const best = rows.find((r) => r.needId === details.needId) || rows[0];
  const notes = hasScore ? confidenceNotes(details, product) : [];
  const exclusionReasons = excluded ? exclusionLines(details) : [];
  const exclusions = exclusionReasons.length ? exclusionReasons : excluded ? considerations.map((c) => c.text).filter(Boolean) : [];
  const title = excluded ? 'Not in your matches' : held ? SAFETY_HOLD : evaluation ? BLEEDING_EVALUATION : hasScore ? 'Why this matches' : matchStatus === 'no-profile' ? 'About this match' : 'No clear match';

  return (
    <main className="ayna-match-page">
      <header className="ayna-detail-header ay-match-head">
        <button type="button" aria-label="Back to product" onClick={onBack}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
        </button>
        <h1>{title}</h1>
      </header>
      <div className="ayna-match-scroll">
        {hasScore ? (
          <section className={`ayna-match-result ay-match-hero ${TONE[tier] || 'is-partial'}`} aria-label={needHeadline(percent, best?.phrase)}>
            {shownMatchPercent(percent) != null
              ? <div className="ayna-match-ring" aria-hidden="true" style={{ '--match-angle': `${percent * 3.6}deg` }}><span>{percent}<small>%</small></span></div>
              : <div className="ayna-match-ring is-partial" aria-hidden="true" style={{ '--match-angle': '0deg' }}><span><small>{PARTIAL_FIT}</small></span></div>}
            <div>
              {tierWord(tier, percent) && <span className="ay-match-tier">{tierWord(tier, percent)}</span>}
              <h2>{needHeadline(percent, best?.phrase)}</h2>
              {whyLine(product, details, { max: 2 }) && <p className="ay-match-why">{whyLine(product, details, { max: 2 })}</p>}
              <p className="ay-match-based">{BASED_ON_LINE}</p>
              {access?.label && <p className="ay-match-access"><span aria-hidden="true">●</span> {access.label}</p>}
            </div>
          </section>
        ) : evaluation ? (
          <BleedingEvaluationNote note={details.bleedingEvaluation} />
        ) : held ? (
          <SafetyHoldNote hold={details.safetyHold} onFix={onFixSafety || (onUpdateHealth ? () => onUpdateHealth() : null)} />
        ) : excluded ? (
          <section className="ayna-match-intro ay-match-excluded">{exclusions.length > 0
            ? exclusions.map((line) => <p key={line}>{tidy(line)}</p>)
            : <p>This product does not fit your current health profile.</p>}</section>
        ) : (
          <p className="ayna-match-intro">{matchStatus === 'no-profile'
              ? 'Complete your health profile to see how this product relates to your answers.'
              : 'This product does not clearly line up with your selected needs. We leave the percentage blank instead of guessing.'}</p>
        )}

        {hasScore && why.restricted && (
          <section className="ayna-match-section ay-match-restricted">
            <h2>Safety not checked yet</h2>
            <p>{why.missing.length ? `Add ${why.missing.join(' and ')} so we can check this product for you.` : 'Add a safety detail so we can check this product for you.'}</p>
            {onUpdateHealth && <button type="button" className="ayna-match-update" onClick={onUpdateHealth}>Update health profile</button>}
          </section>
        )}
        {hasScore && reasonDetails.length > 0 && (
          <section className="ayna-match-section">
            <h2>What matches</h2>
            <ul className="ayna-match-reasons">{reasonDetails.map((reason, index) => <li key={`${reason.component}-${index}`}><span>{reasonKind(reason.component)}</span><p>{tidy(reason.text)}</p></li>)}</ul>
          </section>
        )}
        {/* Only when connected health data backs the need this matches (src/health/matchContext.js). */}
        {hasScore && <HealthWhyLine healthData={details?.healthData} as="h2" className="ayna-match-section ay-why-health" />}
        {hasScore && why.basedOn.length > 0 && (
          <section className="ayna-match-section">
            <h2>Based on</h2>
            <ul className="ay-why-inputs">{why.basedOn.map((line) => <li key={line}>{tidy(line)}</li>)}</ul>
          </section>
        )}
        {hasScore && why.hint && (
          <section className={`ay-why-hint${onUpdateHealth ? '' : ' is-static'}`}>
            <p>{why.hint}</p>
            {onUpdateHealth && <button type="button" onClick={onUpdateHealth}>Add to profile</button>}
          </section>
        )}
        {rows.length > 1 && !excluded && !held && (
          <section className="ayna-match-section">
            <h2>Your needs</h2>
            {scoredRows.length > 0 && <ul className="ay-need-rows">{scoredRows.map((r) => <li key={r.needId} className={r.score > 0 ? `is-${r.tier}` : 'is-none'}>
              <span className="ay-need-rows__label">{tidy(r.short)}</span>
              {/* Under 50: no bar, no number (one rule with the cards). */}
              <span className="ay-need-rows__bar" aria-hidden="true">{shownMatchPercent(r.score) != null && <i style={{ width: `${r.score}%` }} />}</span>
              <strong>{shownMatchPercent(r.score) ?? ''}</strong>
              <small>{r.word}</small>
            </li>)}</ul>}
            {offRows.length > 0 && <p className="ay-need-rows__off">Not for this: {offRows.map((r) => tidy(r.short)).join(', ')}</p>}
          </section>
        )}
        {unmetNeeds.length > 0 && rows.length === 0 && (
          <section className="ayna-match-section"><h2>Not addressed by this product</h2><ul className="ay-match-chips">{unmetNeeds.map((need) => <li key={need}>{tidy(need)}</li>)}</ul></section>
        )}
        {!excluded && why.considerations.length > 0 && (
          <section className="ayna-match-section ayna-match-cautions"><h2>Before you choose</h2>{why.considerations.map((note, index) => <div key={index}><p>{tidy(note.text)}</p>{note.cta && onViewDetails && <button type="button" onClick={onViewDetails}>{note.cta}</button>}</div>)}</section>
        )}
        {(notes.length > 0 || unknowns.length > 0) && (
          <section className="ayna-match-section"><h2>{notes.length ? 'Worth checking' : 'What we could not confirm'}</h2>
            {notes.length > 0 && <ul className="ay-match-notes" aria-label="Worth checking">{notes.map((n) => <li key={n}>{n}</li>)}</ul>}
            {unknowns.map((note) => <p key={note}>{tidy(note)}</p>)}
          </section>
        )}
        {matchStatus === 'no-profile' && onUpdateHealth && <button type="button" className="ayna-match-update" onClick={onUpdateHealth}>Complete health profile</button>}
        {hasScore && <MatchFeedback productId={product?.id} onUpdateHealth={onUpdateHealth} />}
        <p className="ayna-match-disclaimer">A match to what you shared, not a diagnosis or a promise of results. We never guess why you have a symptom. Availability is shown separately and never changes the score.</p>
        <LegalFooter />
      </div>
    </main>
  );
}
