import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { getProductMatchDetailsForProduct } from '../data/products';
import { needBreakdown, needHeadline, tierWord, confidenceNotes, exclusionLines, whyMatch, BASED_ON_LINE } from '../utils/matchDisplay';
import '../styles/match-ui.css';

// "Why this match" from the app, for the website: the same match engine
// output (getProductMatchDetailsForProduct), shown as a side panel.
// It lists what matched and the inputs it used. It never says why she has a
// symptom, and missing answers lower confidence, never the percent.

const GOAL = new Set(['primaryGoal', 'otherNeeds', 'periodFlow', 'periodPain', 'utiFrequency']);
const PROFILE = new Set(['age', 'lifeStage', 'breastfeeding', 'postpartumTiming', 'pregnancyTrimester', 'perimenopauseLastPeriod', 'diagnoses', 'triedBefore']);
const ACRONYM_RE = /\b(adhd|pcos|pmdd|pms|ibs|uti|utis|hrt|iud|bv|ivf)\b/gi;
const tidy = (t) => String(t || '').replace(ACRONYM_RE, (m) => (m.toLowerCase() === 'utis' ? 'UTIs' : m.toUpperCase()));
const kind = (c) => (GOAL.has(c) ? 'Your needs' : PROFILE.has(c) ? 'Your profile' : 'Your preferences');
const TONE = { excellent: 'is-strong', strong: 'is-good', exploratory: 'is-partial', browse: 'is-partial' };

export default function WhyMatchPanel({ product, quizResults, healthProfile = null, matchOpts, onClose, onUpdateHealth }) {
  const details = getProductMatchDetailsForProduct(product, quizResults, healthProfile, matchOpts);
  const { percent, eligible, matchStatus, reasonDetails = [], considerations = [], unknowns = [], unmetNeeds = [], tier } = details;
  const hasScore = eligible !== false && matchStatus === 'scored' && Number.isFinite(percent);
  const excluded = matchStatus === 'excluded' || eligible === false;
  const why = whyMatch(details);
  const rows = matchStatus === 'no-profile' ? [] : needBreakdown(details);
  const best = rows.find((r) => r.needId === details.needId) || rows[0];
  const notes = hasScore ? confidenceNotes(details, product) : [];
  const exclusionReasons = excluded ? exclusionLines(details) : [];
  const exclusions = exclusionReasons.length ? exclusionReasons : excluded ? considerations.map((c) => c.text).filter(Boolean) : [];
  const title = excluded ? 'Not in your matches' : hasScore ? 'Why this matches' : 'How this fits you';
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(<div className="ay-why-backdrop" onClick={onClose}>
    <aside className="ay-why" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
      <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Close">×</button></header>
      {hasScore ? <section className={`ay-why-hero ${TONE[tier] || 'is-partial'}`}>
        <div className="ay-why-ring" style={{ '--a': `${percent * 3.6}deg` }}><span>{percent}<small>%</small></span></div>
        <div>
          <span className="ay-why-tier">{tierWord(tier, percent)}</span>
          <strong>{needHeadline(percent, best?.phrase)}</strong>
          <p className="ay-why-based">{BASED_ON_LINE}</p>
        </div>
      </section> : excluded ? <section className="ay-why-excluded">
        {exclusions.length > 0 ? exclusions.map((line) => <p key={line}>{tidy(line)}</p>) : <p>This product does not fit your current health profile.</p>}
      </section> : <p className="ay-why-intro">{matchStatus === 'no-profile' ? 'Take the quiz to see how this product relates to your answers.' : 'We couldn’t match this product to your answers, so we leave the score blank instead of guessing.'}</p>}
      {!excluded && why.considerations.length > 0 && <section className="ay-why-cautions is-first"><h3>Before you choose</h3>{why.considerations.map((n, i) => <p key={i}>{tidy(n.text)}</p>)}</section>}
      {hasScore && why.restricted && <section className="ay-why-restricted">
        <h3>Safety not checked yet</h3>
        <p>{why.missing.length ? `Add ${why.missing.join(' and ')} so we can check this product for you.` : 'Add a safety detail so we can check this product for you.'}</p>
        {onUpdateHealth && <button type="button" className="ay-why-cta" onClick={onUpdateHealth}>Update health profile</button>}
      </section>}
      {hasScore && reasonDetails.length > 0 && <section><h3>What matches</h3><ul className="ay-why-reasons">{reasonDetails.map((r, i) => <li key={`${r.component}-${i}`}><span>{kind(r.component)}</span><p>{tidy(r.text)}</p></li>)}</ul></section>}
      {hasScore && why.basedOn.length > 0 && <section><h3 className="ay-why-h-edit">Based on{onUpdateHealth && <button type="button" className="ay-why-edit" onClick={onUpdateHealth}>Edit</button>}</h3><ul className="ay-why-inputs">{why.basedOn.map((line) => <li key={line}>{tidy(line)}</li>)}</ul></section>}
      {hasScore && why.hint && <section className="ay-why-hint">
        <p>{why.hint}</p>
        {onUpdateHealth && <button type="button" onClick={onUpdateHealth}>Add to profile</button>}
      </section>}
      {rows.length > 1 && !excluded && <section>
        <h3>Your needs it helps with</h3>
        <ul className="ay-need-rows">{rows.filter((r) => r.score > 0).map((r) => <li key={r.needId} className={r.score > 0 ? `is-${r.tier}` : 'is-none'}>
          <span className="ay-need-rows__label" title={r.label}>{tidy(r.short)}</span>
          <span className="ay-need-rows__bar" aria-hidden="true"><i style={{ width: `${r.score}%` }} /></span>
          <strong>{r.score}</strong>
          <small>{r.word}</small>
        </li>)}</ul>
        {rows.some((r) => !(r.score > 0)) && <details className="ay-why-more"><summary>Doesn’t address: {rows.filter((r) => !(r.score > 0)).length} other need{rows.filter((r) => !(r.score > 0)).length === 1 ? '' : 's'}</summary><ul className="ay-why-chips">{rows.filter((r) => !(r.score > 0)).map((r) => <li key={r.needId}>{tidy(r.short)}</li>)}</ul></details>}
      </section>}
      {hasScore && unmetNeeds.length > 0 && rows.length === 0 && <section><h3>Your other needs it doesn’t cover</h3><ul className="ay-why-chips">{unmetNeeds.map((n) => <li key={n}>{tidy(n)}</li>)}</ul></section>}
      {(notes.length > 0 || unknowns.length > 0) && <section><h3>What we could not confirm</h3>
        {notes.length > 0 && <ul className="ay-why-notes" aria-label="What lowers our confidence">{notes.map((n) => <li key={n}>{n}</li>)}</ul>}
        {unknowns.map((n) => <p key={n}>{tidy(n)}</p>)}
      </section>}
      {matchStatus === 'no-profile' && onUpdateHealth && <button type="button" className="ay-why-cta" onClick={onUpdateHealth}>Take the quiz</button>}
      <p className="ay-why-fine">A match to what you shared, not a diagnosis or a promise of results. We never guess why you have a symptom. Availability is shown separately and never changes the score.</p>
    </aside>
  </div>, document.body);
}
