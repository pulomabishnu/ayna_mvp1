import { getProductMatchDetailsForProduct } from '../../data/products.js';
import LegalFooter from '../components/LegalFooter.jsx';
import '../match.css';

const GOAL_COMPONENTS = new Set(['primaryGoal', 'otherNeeds', 'periodFlow', 'periodPain', 'utiFrequency']);
const PROFILE_COMPONENTS = new Set(['age', 'lifeStage', 'breastfeeding', 'postpartumTiming', 'pregnancyTrimester', 'perimenopauseLastPeriod', 'diagnoses', 'triedBefore']);

const ACRONYMS = ['adhd', 'pcos', 'pmdd', 'pms', 'ibs', 'uti', 'utis', 'hrt', 'iud', 'bv', 'ivf'];
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

export default function WhyMatchScreen({ product, quizAnswers, onBack, onUpdateHealth, onViewDetails }) {
  const { percent, eligible, matchStatus, reasonDetails = [], considerations = [], unknowns = [], unmetNeeds = [] } = getProductMatchDetailsForProduct(product, quizAnswers);
  const hasScore = eligible !== false && matchStatus === 'scored' && Number.isFinite(percent);
  const title = eligible === false ? 'Not a fit right now' : hasScore ? 'Your match' : matchStatus === 'no-profile' ? 'About this match' : 'No clear match';

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
          <section className={`ayna-match-result ay-match-hero ${percent >= 80 ? 'is-strong' : percent >= 60 ? 'is-good' : 'is-partial'}`} aria-label={`${percent} percent match`}>
            <div className="ayna-match-ring" aria-hidden="true" style={{ '--match-angle': `${percent * 3.6}deg` }}><span>{percent}<small>%</small></span></div>
            <div><h2>{percent >= 80 ? 'Strong match' : percent >= 60 ? 'Good fit' : 'Partial match'}</h2><p>{percent >= 60 ? 'Your answers line up with this product. Review the details before choosing it.' : 'This product relates to some of your answers. It does not address your whole profile.'}</p></div>
          </section>
        ) : (
          <p className="ayna-match-intro">{eligible === false
            ? "This product doesn't fit your current health profile. Review the reason below."
            : matchStatus === 'no-profile'
              ? 'Complete your health profile to see how this product relates to your answers.'
              : 'This product does not clearly line up with your selected needs. We leave the percentage blank instead of guessing.'}</p>
        )}

        {hasScore && reasonDetails.length > 0 && (
          <section className="ayna-match-section">
            <h2>What lines up</h2>
            <ul className="ayna-match-reasons">{reasonDetails.map((reason, index) => <li key={`${reason.component}-${index}`}><span>{reasonKind(reason.component)}</span><p>{tidy(reason.text)}</p></li>)}</ul>
          </section>
        )}
        {unmetNeeds.length > 0 && (
          <section className="ayna-match-section"><h2>Not addressed by this product</h2><ul className="ay-match-chips">{unmetNeeds.map((need) => <li key={need}>{tidy(need)}</li>)}</ul></section>
        )}
        {considerations.length > 0 && (
          <section className="ayna-match-section ayna-match-cautions"><h2>Before you choose</h2>{considerations.map((note, index) => <div key={index}><p>{tidy(note.text)}</p>{note.cta && onViewDetails && <button type="button" onClick={onViewDetails}>{note.cta}</button>}</div>)}</section>
        )}
        {unknowns.length > 0 && (
          <section className="ayna-match-section"><h2>What we could not confirm</h2>{unknowns.map((note) => <p key={note}>{tidy(note)}</p>)}</section>
        )}
        {matchStatus === 'no-profile' && onUpdateHealth && <button type="button" className="ayna-match-update" onClick={onUpdateHealth}>Complete health profile</button>}
        <p className="ayna-match-disclaimer">A relevance score from your answers, not a diagnosis or a promise of results.</p>
        <LegalFooter />
      </div>
    </main>
  );
}
