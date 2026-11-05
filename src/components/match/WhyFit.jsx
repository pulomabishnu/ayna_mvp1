import MatchFeedback from '../today/MatchFeedback.jsx';
import { getProductMatchDetailsForProduct } from '../../data/products.js';
import { needBreakdown, tierWord, exclusionLines, whyMatch, isBleedingEvaluation } from '../../utils/matchDisplay.js';
import SafetyHoldNote from './SafetyHoldNote.jsx';
import BleedingEvaluationNote from './BleedingEvaluationNote.jsx';
import { usePro } from './WhyTrace.jsx';
import { breakdownFromDetails } from '../../matching/breakdown.js';
import { evidenceLevel } from '../pdp/evidenceLevel.js';
import { openProPaywall } from '../../pro/paywall.js';
import '../../styles/match-ui.css';

// "See why" side panel (Nov 5, founder: "just put 69% match, see why … bullet
// points … graphic heavy … don't over-explain … tell people WHY, not what we
// don't know … more insights with Pro"). One ring, the need it's for, a few
// reasons, the evidence bars, then the deeper factors behind Pro. No math, no
// "what we could not confirm". Safety notes stay free and stay visible.

const ACRONYM_RE = /\b(adhd|pcos|pmos|pmdd|pms|ibs|uti|utis|hrt|iud|bv|ivf)\b/gi;
const tidy = (t) => String(t || '').replace(ACRONYM_RE, (m) => (m.toLowerCase() === 'utis' ? 'UTIs' : m.toUpperCase()));
const cap = (t) => tidy(String(t || '')).replace(/^./, (c) => c.toUpperCase());
const NEGATIVE = /\b(doesn.t|does not|isn.t|not (for|on file|checked)|missing|unknown|can.t|cannot|lower)\b/i;

/** The reasons she sees: only what makes it fit, never the gaps. */
function fitReasons(product, details, raised = [], need = '') {
  const out = [];
  const n = String(need || '').toLowerCase();
  // Two lines about the same need ("matches the heavy periods you selected" / "…you told ayna about") say one thing.
  const same = (a, b) => a.toLowerCase() === b.toLowerCase() || (n && a.toLowerCase().includes(n) && b.toLowerCase().includes(n));
  const add = (t) => { const s = cap(String(t || '').trim().replace(/\.$/, '')); if (s && !NEGATIVE.test(s) && !out.some((x) => same(x, s))) out.push(s); };
  const bf = details?.browseFit;
  if (details?.matchStatus === 'scored') { whyMatch(details).reasons.forEach(add); raised.slice(0, 2).forEach((x) => add(x.text)); }
  else if (bf && bf.percent > 0) {
    if (bf.phrase) add(`Made for ${bf.phrase}`);
    if (bf.kind === 'stage') add(`Common in your life stage`);
  }
  return out.slice(0, 4);
}

const CHECK_WORDS = { medications_reviewed: 'Your medicines', pregnancy_reviewed: 'Pregnancy', breastfeeding_reviewed: 'Breastfeeding', passport_verified: 'Product facts', stage_scope: 'Life stage' };
const checkWord = (c) => CHECK_WORDS[c.code] || (String(c.code).startsWith('allergen_free:') ? cap(String(c.code).slice(14).replace(/_/g, ' ')) : cap(c.text));

function Ring({ percent }) {
  return <div className="ay-w2-ring" style={{ '--a': `${Math.max(0, Math.min(100, percent)) * 3.6}deg` }}><span>{percent}<small>%</small></span></div>;
}

function Bars({ level, of = 3 }) {
  return <span className="ay-w2-bars" aria-hidden="true">{Array.from({ length: of }, (_, i) => <i key={i} className={i < level ? 'is-on' : ''} />)}</span>;
}

export default function WhyFit({ product, quizResults, healthProfile = null, matchOpts, onUpdateHealth, onFixSafety = null }) {
  const details = getProductMatchDetailsForProduct(product, quizResults, healthProfile, matchOpts);
  const pro = usePro();
  const { percent, eligible, matchStatus, tier } = details;
  const bf = details.browseFit;
  const scored = eligible !== false && matchStatus === 'scored' && Number.isFinite(percent) && percent > 0;
  const browse = !scored && bf && !bf.hold && !bf.notForStage && bf.percent > 0;
  const shown = scored ? Math.round(percent) : browse ? Math.round(bf.percent) : null;
  const excluded = matchStatus === 'excluded' || eligible === false;
  const held = matchStatus === 'safety-hold';
  const rows = scored ? needBreakdown(details).filter((r) => r.score > 0).slice(0, 4) : [];
  const forWhat = scored ? (rows.find((r) => r.needId === details.needId) || rows[0])?.phrase : bf?.phrase;
  const why = whyMatch(details);
  const cautions = !excluded ? why.considerations.map((c) => tidy(c.text)).filter(Boolean).slice(0, 2) : [];
  const b = scored ? breakdownFromDetails(product, details) : null;
  const checks = (b?.checks || []).slice(0, 4);
  const reasons = shown != null ? fitReasons(product, details, b?.raised || [], forWhat) : [];
  const factors = [...(b?.raised || []).map((x) => ({ ...x, up: true })), ...(b?.lowered || []).map((x) => ({ ...x, up: false }))].filter((x) => x.text);
  const ev0 = evidenceLevel(product);
  const tr = b?.evidence || null;
  const ev = ev0.level > 0 ? ev0 : tr ? { level: ({ A: 3, B: 2, C: 1 })[tr.grade] || 0, word: tr.label } : ev0;
  const tierText = shown != null ? tierWord(tier, shown, details?.v2?.band) : '';
  const exLines = excluded ? (exclusionLines(details).length ? exclusionLines(details) : (details.considerations || []).map((c) => c.text).filter(Boolean)) : [];

  return <div className="ay-w2-body">
      {shown != null && <section className="ay-w2-hero">
        <Ring percent={shown} />
        <div>
          {tierText && <span className="ay-w2-tier">{tierText}</span>}
          {forWhat && <strong>{cap(forWhat)}</strong>}
        </div>
      </section>}

      {excluded && <ul className="ay-w2-list is-no">{(exLines.length ? exLines : ['Doesn’t fit your health profile right now']).slice(0, 3).map((l) => <li key={l}>{cap(l)}</li>)}</ul>}
      {!excluded && shown == null && held && <SafetyHoldNote surface="why" hold={details.safetyHold} onFix={onFixSafety || (onUpdateHealth ? () => onUpdateHealth() : null)} />}
      {!excluded && shown == null && !held && isBleedingEvaluation(details) && <BleedingEvaluationNote note={details.bleedingEvaluation} />}
      {!excluded && shown == null && !held && !isBleedingEvaluation(details) && <p className="ay-w2-empty">{matchStatus === 'no-profile' ? 'Take the quiz to see your match.' : bf?.hold ? (bf.safetyHold?.reason || 'We’re checking this product’s safety first.') : bf?.notForStage ? `Made for ${bf.phrase || 'a different life stage'}.` : 'Not matched to your answers yet.'}</p>}

      {reasons.length > 0 && <section>
        <h3>Why</h3>
        <ul className="ay-w2-list">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        {browse && onUpdateHealth && <button type="button" className="ay-w2-link" onClick={onUpdateHealth}>Add {bf.phrase || 'this'} to your answers</button>}
      </section>}

      {rows.length > 1 && <section>
        <h3>What it helps with</h3>
        <ul className="ay-w2-needs">{rows.map((r) => <li key={r.needId}><span>{cap(r.short)}</span><i aria-hidden="true"><b style={{ width: `${r.score}%` }} /></i><strong>{r.score}%</strong></li>)}</ul>
      </section>}

      {(ev.word || checks.length > 0) && shown != null && <section className="ay-w2-tiles">
        {ev.word && <div className="ay-w2-tile"><small>Evidence</small>{ev.level > 0 && <Bars level={ev.level} />}<span>{ev.word}</span></div>}
        {checks.length > 0 && <div className="ay-w2-tile"><small>Checked for you</small><ul className="ay-w2-chips">{checks.map((c) => <li key={c.code} title={c.text}>{checkWord(c)}</li>)}</ul></div>}
      </section>}

      {cautions.length > 0 && <section className="ay-w2-care"><h3>Before you choose</h3><ul className="ay-w2-list is-care">{cautions.map((c) => <li key={c}>{c}</li>)}</ul></section>}

      {scored && why.restricted && <section className="ay-w2-care">
        <h3>One safety detail</h3>
        <p>{why.missing.length ? `Add ${why.missing.join(' and ')} so we can check this for you.` : 'Add a safety detail so we can check this for you.'}</p>
        {onUpdateHealth && <button type="button" className="ay-w2-link" onClick={onUpdateHealth}>Update health profile</button>}
      </section>}

      {scored && factors.length > 0 && (pro ? <section>
        <h3>Every factor</h3>
        <ul className="ay-w2-factors">{factors.map((x) => <li key={`${x.up ? 'u' : 'd'}-${x.text}`} className={x.up ? 'is-up' : 'is-down'}><span aria-hidden="true">{x.up ? '+' : '−'}</span>{cap(x.text)}<span className="sr-only">{x.up ? ', raised it' : ', lowered it'}</span></li>)}</ul>
      </section> : pro === false ? <section className="ay-w2-pro">
        <div className="ay-w2-pro__ghost" aria-hidden="true">{factors.slice(0, 3).map((x, i) => <span key={i} className={x.up ? 'is-up' : 'is-down'}><i>{x.up ? '+' : '−'}</i><b style={{ width: `${55 + ((i * 17) % 35)}%` }} /></span>)}</div>
        <div className="ay-w2-pro__lock">
          <span className="ay-w2-pro__tag">ayna Pro</span>
          <strong>See every factor behind your {shown}%</strong>
          <button type="button" onClick={() => openProPaywall({ feature: 'insights', featureName: 'Deeper match explanations' })}>Unlock</button>
        </div>
      </section> : null)}

      {matchStatus === 'no-profile' && onUpdateHealth && <button type="button" className="ay-why-cta" onClick={onUpdateHealth}>Take the quiz</button>}
      {scored && <MatchFeedback productId={product?.id} onUpdateHealth={onUpdateHealth} />}
  </div>;
}
