import MatchFeedback from '../today/MatchFeedback.jsx';
import { getProductMatchDetailsForProduct } from '../../data/products.js';
import { needBreakdown, tierWord, exclusionLines, whyMatch, isBleedingEvaluation } from '../../utils/matchDisplay.js';
import SafetyHoldNote from './SafetyHoldNote.jsx';
import BleedingEvaluationNote from './BleedingEvaluationNote.jsx';
import { usePro } from './WhyTrace.jsx';
import { breakdownFromDetails } from '../../matching/breakdown.js';
import { evidenceLevel } from '../pdp/evidenceLevel.js';
import { openProPaywall } from '../../pro/paywall.js';
import { ALL_PRODUCTS } from '../../data/catalog.js';
import { parsePrice } from '../../matching/productProfile.js';
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
  // Nov 9 (live check: "Within your budget" and "$12.99 fits your budget" both showed): one line per topic.
  const topic = (t) => (/\bbudget\b|\bprice\b|costs? less/i.test(t) ? 'budget' : /review|rated|rating|stars?\b/i.test(t) ? 'reviews' : '');
  const same = (a, b) => a.toLowerCase() === b.toLowerCase() || (n && a.toLowerCase().includes(n) && b.toLowerCase().includes(n)) || (topic(a) && topic(a) === topic(b));
  const add = (t) => { const s = cap(String(t || '').trim().replace(/\.$/, '')); if (s && !NEGATIVE.test(s) && !out.some((x) => same(x, s))) out.push(s); };
  const bf = details?.browseFit;
  if (details?.matchStatus === 'scored') { whyMatch(details).reasons.forEach(add); raised.slice(0, 2).forEach((x) => add(x.text)); }
  else if (bf && bf.percent > 0) {
    if (bf.phrase) add(`Made for ${bf.phrase}`);
    if (bf.kind === 'stage') add(`Common in your life stage`);
  }
  // A rating only when the catalog links where it comes from (glance.js rule: no unsourced ratings).
  if (product?.userRating && product?.userRatingSourceUrl) add(`Buyers rate it ${product.userRating} out of 5`);
  return out.slice(0, 4);
}

const CHECK_WORDS = { medications_reviewed: 'Your medicines', pregnancy_reviewed: 'Pregnancy', breastfeeding_reviewed: 'Breastfeeding', passport_verified: 'Product facts', stage_scope: 'Life stage' };
const checkWord = (c) => CHECK_WORDS[c.code] || (String(c.code).startsWith('allergen_free:') ? cap(String(c.code).slice(14).replace(/_/g, ' ')) : cap(c.text));

/* Where its price sits among the same kind of product on ayna (Nov 6, founder: "make it more
   informative"). Only one-time USD prices, only with 5+ others to compare, never invented. */
const oneTime = (p) => { const x = parsePrice(p?.price); return x.currency === 'USD' && !x.recurring && x.amount > 0 ? x.amount : null; };
function priceSpot(product) {
  const mine = oneTime(product);
  if (mine == null || !product?.category) return null;
  const peers = ALL_PRODUCTS.filter((p) => p.category === product.category && p.type === product.type).map(oneTime).filter((n) => n != null);
  if (peers.length < 6) return null;
  const lo = Math.min(...peers); const hi = Math.max(...peers);
  if (hi <= lo) return null;
  const cheaper = peers.filter((n) => n > mine).length / peers.length;
  const word = cheaper >= 0.66 ? 'Costs less than most like it on ayna' : cheaper <= 0.25 ? 'One of the pricier ones like it on ayna' : 'Mid-range for its kind on ayna';
  return { mine, lo, hi, pos: (mine - lo) / (hi - lo), word, n: peers.length };
}
const money = (n) => `$${n % 1 ? n.toFixed(2) : n}`;

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
  const spot = shown != null ? priceSpot(product) : null;
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
        <ul className="ay-w2-list is-why">{reasons.map((r) => <li key={r} data-ic={/rate it/.test(r) ? 'star' : /life stage/i.test(r) ? 'stage' : 'fit'}>{r}</li>)}</ul>
        {browse && onUpdateHealth && <button type="button" className="ay-w2-link" onClick={onUpdateHealth}>Add {bf.phrase || 'this'} to your answers</button>}
      </section>}

      {rows.length > 1 && <section>
        <h3>What it helps with</h3>
        <ul className="ay-w2-needs">{rows.map((r) => <li key={r.needId}><span>{cap(r.short)}</span><i aria-hidden="true"><b style={{ width: `${r.score}%` }} /></i><strong>{r.score}%</strong></li>)}</ul>
      </section>}

      {(ev.word || checks.length > 0 || spot) && shown != null && <section className="ay-w2-tiles">
        {ev.word && <div className="ay-w2-tile"><small>Evidence</small>{ev.level > 0 && <Bars level={ev.level} />}<span>{ev.word}</span></div>}
        {spot && <div className="ay-w2-tile is-ink"><small>Price</small><b className="ay-w2-price">{money(spot.mine)}</b><span className="ay-w2-range" aria-hidden="true"><i style={{ left: `${Math.round(spot.pos * 100)}%` }} /></span><span className="ay-w2-range__ends" aria-hidden="true"><em>{money(spot.lo)}</em><em>{money(spot.hi)}</em></span><span>{spot.word}</span></div>}
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

/**
 * The same facts as the panel, as plain data, for ayna Wrapped (Nov 8, founder: "your Wrapped,
 * even better … actually informative"). Only what makes it fit, never the gaps; null if not matched.
 */
export function whyFitSummary(product, quizResults, healthProfile = null, matchOpts) {
  if (!product || !quizResults) return null;
  let details;
  try { details = getProductMatchDetailsForProduct(product, quizResults, healthProfile, matchOpts); } catch { return null; }
  const scored = details?.eligible !== false && details?.matchStatus === 'scored' && Number.isFinite(details.percent) && details.percent > 0;
  if (!scored) return null;
  const rows = needBreakdown(details).filter((r) => r.score > 0).slice(0, 4);
  const forWhat = (rows.find((r) => r.needId === details.needId) || rows[0])?.phrase || '';
  let b = null;
  try { b = breakdownFromDetails(product, details); } catch { b = null; }
  const ev0 = evidenceLevel(product);
  const tr = b?.evidence || null;
  const ev = ev0.level > 0 ? ev0 : tr ? { level: ({ A: 3, B: 2, C: 1 })[tr.grade] || 0, word: tr.label } : ev0;
  return {
    percent: Math.round(details.percent),
    forWhat: cap(forWhat),
    needs: rows.map((r) => cap(r.phrase)).filter(Boolean),
    reasons: fitReasons(product, details, b?.raised || [], forWhat).slice(0, 3),
    checks: (b?.checks || []).slice(0, 4).map(checkWord),
    evidence: ev?.level > 0 ? { level: ev.level, word: ev.word } : null,
    price: priceSpot(product),
  };
}
