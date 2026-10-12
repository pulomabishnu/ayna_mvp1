import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { getProductMatchDetailsForProduct } from '../data/products';

// "Why this match" from the app, for the website: the same match engine
// output (getProductMatchDetailsForProduct), shown as a side panel.

const GOAL = new Set(['primaryGoal', 'otherNeeds', 'periodFlow', 'periodPain', 'utiFrequency']);
const PROFILE = new Set(['age', 'lifeStage', 'breastfeeding', 'postpartumTiming', 'pregnancyTrimester', 'perimenopauseLastPeriod', 'diagnoses', 'triedBefore']);
const ACRONYM_RE = /\b(adhd|pcos|pmdd|pms|ibs|uti|utis|hrt|iud|bv|ivf)\b/gi;
const tidy = (t) => String(t || '').replace(ACRONYM_RE, (m) => (m.toLowerCase() === 'utis' ? 'UTIs' : m.toUpperCase()));
const kind = (c) => (GOAL.has(c) ? 'Your needs' : PROFILE.has(c) ? 'Your profile' : 'Your preferences');

export default function WhyMatchPanel({ product, quizResults, onClose, onUpdateHealth }) {
  const { percent, eligible, matchStatus, reasonDetails = [], considerations = [], unknowns = [], unmetNeeds = [] } = getProductMatchDetailsForProduct(product, quizResults);
  const hasScore = eligible !== false && matchStatus === 'scored' && Number.isFinite(percent);
  const title = eligible === false ? 'Not a fit right now' : hasScore ? 'Why this match' : 'How this fits you';
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(<div className="ay-why-backdrop" onClick={onClose}>
    <aside className="ay-why" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
      <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Close">×</button></header>
      {hasScore ? <section className={`ay-why-hero ${percent >= 80 ? 'is-strong' : percent >= 60 ? 'is-good' : 'is-partial'}`}>
        <div className="ay-why-ring" style={{ '--a': `${percent * 3.6}deg` }}><span>{percent}<small>%</small></span></div>
        <div><strong>{percent >= 80 ? 'Strong match' : percent >= 60 ? 'Good fit' : 'Partial match'}</strong><p>{percent >= 60 ? 'Your answers line up with this product. Review the details before choosing it.' : 'This product relates to some of your answers. It does not address your whole profile.'}</p></div>
      </section> : <p className="ay-why-intro">{eligible === false ? 'This product doesn’t fit your current health profile. Review the reason below.' : matchStatus === 'no-profile' ? 'Take the quiz to see how this product relates to your answers.' : 'We couldn’t match this product to your answers, so we leave the score blank instead of guessing.'}</p>}
      {hasScore && reasonDetails.length > 0 && <section><h3>What lines up</h3><ul className="ay-why-reasons">{reasonDetails.map((r, i) => <li key={`${r.component}-${i}`}><span>{kind(r.component)}</span><p>{tidy(r.text)}</p></li>)}</ul></section>}
      {hasScore && unmetNeeds.length > 0 && <section><h3>Your other needs it doesn’t cover</h3><ul className="ay-why-chips">{unmetNeeds.map((n) => <li key={n}>{tidy(n)}</li>)}</ul></section>}
      {considerations.length > 0 && <section className="ay-why-cautions"><h3>Before you choose</h3>{considerations.map((n, i) => <p key={i}>{tidy(n.text)}</p>)}</section>}
      {unknowns.length > 0 && <section><h3>What we could not confirm</h3>{unknowns.map((n) => <p key={n}>{tidy(n)}</p>)}</section>}
      {matchStatus === 'no-profile' && onUpdateHealth && <button type="button" className="ay-why-cta" onClick={onUpdateHealth}>Take the quiz</button>}
      <p className="ay-why-fine">A relevance score from your answers, not a diagnosis or a promise of results.</p>
    </aside>
  </div>, document.body);
}
