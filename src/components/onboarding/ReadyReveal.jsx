import { useEffect, useMemo, useRef, useState } from 'react';
import { useCatalogReady } from '../../data/catalog.js';
import { moreRemaining } from '../../mobile/data/onboardingFlow.js';
import { reconstructIntakeFromSnapshot, isStepAnswered } from '../../mobile/data/intakeModel.js';
import { Plate } from '../ui/ay';
import { getEcosystemSeedFromQuiz, getProductMatchDetailsForProduct, getRecommendationMatchesAndRest, getProductById } from '../../data/products.js';
import { isSafetyHold, isBleedingEvaluation, shownMatchPercent } from '../../utils/matchDisplay.js';
import { formatPrice, shownPriceText } from '../../utils/formatPrice.js';
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
// Nov 5: the CDC birth control note and the pregnancy constipation first steps join the list, most important first.
const CARE_LINE_CODES = ['urgent_yes', 'estrogen_bc_condition', 'uti_right_now', 'uti_first_time', 'spotting_check', 'severe_pain', 'very_heavy_flow', 'pregnancy_constipation', 'symptom_check'];
function perNeed(answers) {
  if (!answers) return { rows: [], total: 0, careNote: '' };
  try {
    const { shelves = [], careFlags = null } = getEcosystemSeedFromQuiz(answers);
    const seen = new Set();
    const rows = shelves.map((sh) => {
      const all = (sh.productIds || []).map((id) => getProductById(id)).filter((p) => p && showableAsPick(p, answers));
      all.forEach((p) => seen.add(p.id));
      // Nov 5 (founder): services (telehealth, apps, memberships) sit apart from products.
      const products = all.filter((p) => p.type !== 'digital');
      const services = all.filter((p) => p.type === 'digital');
      const needsAnswers = (sh.missingSafetyText || []).length > 0;
      const held = !all.length && (needsAnswers || sh.restrictedCount > 0);
      // Nov 4 (50-profile run): BV with a latex allergy held everything and told her to answer
      // questions she had already answered. Say what is actually missing.
      const info = (sh.missingProductInfoText || [])[0] || '';
      const heldWhy = !held ? '' : needsAnswers ? 'Answer the safety questions below to see these.'
        : info ? `Held back for now: we don’t have ${info.replace(/ for this product$/, '')} for these yet, and you told us something that makes it matter.`
          : 'Held back for now: we can’t confirm these are safe for what you told us.';
      // Nov 5: an empty shelf that is empty on purpose (pregnancy, bleeding after menopause) says why.
      const why = all.length ? '' : sh.emptyReason === 'care_first' ? 'Best checked by a clinician, not a product.' : sh.emptyReason === 'clinician_first_for_stage' ? sh.qualityNote || '' : '';
      return { id: sh.needId, label: sh.label, products, services, held, needsAnswers, heldWhy, why, careFirst: !all.length && sh.emptyReason === 'care_first' };
    });
    // Nov 4: one "check with a clinician" line when a need she picked calls for it (spotting, UTI now, severe pain).
    const notes = careFlags?.notes || [];
    // Nov 5 (founder: the warning took too much space): the short line when there is one.
    const first = CARE_LINE_CODES.map((c) => notes.find((n) => n.code === c)).find(Boolean);
    const careNote = first?.short || first?.text || '';
    const careNoteFor = first?.code === 'pregnancy_constipation' ? 'digestive.constipation' : null;
    return { rows, total: seen.size, careNote, careNoteFor };
  } catch {
    return { rows: [], total: 0, careNote: '' };
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

export default function ReadyReveal({ prefsDone = false, answers = null, variant = 'app', signedIn = false, onSeeToday, onWatchWrapped, onCreateAccount, onBack, onMorePersonal, onSafety = null, onConnect = null }) {
  const ready = useCatalogReady();
  const matches = useMemo(() => (ready ? firstMatches(answers, 5) : []), [answers, ready]);
  const { rows, total, careNote, careNoteFor } = useMemo(() => (ready ? perNeed(answers) : { rows: [], total: 0, careNote: '', careNoteFor: null }), [answers, ready]);
  // Nov 4 (founder: "the extra questions didn't change my match"): say what changed. The
  // matches before the extra questions are kept for this tab only (ids, no answers).
  const changed = useMemo(() => {
    const ids = rows.flatMap((r) => r.products.map((p) => p.id));
    try {
      if (!prefsDone) { if (ids.length) sessionStorage.setItem('ayna:reveal-ids', JSON.stringify(ids)); return null; }
      const before = JSON.parse(sessionStorage.getItem('ayna:reveal-ids') || 'null');
      if (!Array.isArray(before)) return null;
      return ids.filter((id) => !before.includes(id)).length;
    } catch { return null; }
  }, [rows, prefsDone]);
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
  // The card deck: which need is on top.
  const [at, setAt] = useState(0);
  const swipeX = useRef(null);
  const swiped = useRef(false);
  const [dragX, setDragX] = useState(0);
  const go = (step) => setAt((i) => (rows.length ? (i + step + rows.length) % rows.length : 0));
  // Nov 5 (founder: "consolidate"): a note about one need lives on that need's card, not in a box above.
  const careOnCard = careNoteFor && rows.some((r) => r.id === careNoteFor) ? careNoteFor : null;
  const bleedOnCard = Boolean(bleeding) && rows.some((r) => r.careFirst);
  // Nov 5 (founder): first a big "make my matches more personal" moment (more questions, connect
  // records and a wearable, with the time each takes), a small "skip" to the matches.
  const canMore = Boolean(onMorePersonal) && (safetyLeft > 0 || remaining > 0);
  const [stage, setStage] = useState(() => (!prefsDone && (canMore || onConnect) ? 'personal' : 'matches'));
  const [tab, setTab] = useState('products');
  const services = useMemo(() => {
    const seenS = new Set();
    const out = [];
    for (const r of rows) for (const p of r.services || []) { if (seenS.has(p.id)) continue; seenS.add(p.id); out.push({ p, need: r.label }); }
    return out;
  }, [rows]);
  const productCount = useMemo(() => new Set(rows.flatMap((r) => r.products.map((p) => p.id))).size, [rows]);
  const moreMin = Math.max(1, Math.round(((safetyLeft || remaining) * 15) / 60));
  const Tag = variant === 'web' ? 'section' : 'main';
  const pctFor = (p) => { const d = getProductMatchDetailsForProduct(p, answers); return isSafetyHold(d) || isBleedingEvaluation(d) ? null : shownMatchPercent(d?.percent ?? d?.score); };
  const Arrow = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

  if (stage === 'personal' && ready && total > 0) {
    return (
      <Tag className={`ay-ob-ready ay-pz uq-reveal is-${variant}`} aria-labelledby="ay-pz-h">
        {onBack && <button type="button" className="ay-ob-back" onClick={onBack} aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg></button>}
        {/* Inspo: the big stat number (heart-rate and wellness dashboards), not a highlighter. */}
        <p className="ay-pz__found"><span className="ay-pz__num">{total}</span><span className="ay-pz__lbl">{total === 1 ? 'match' : 'matches'}<br />ready</span></p>
        <h1 id="ay-pz-h" className="ay-pz__h">Make them more you.</h1>
        <p className="ay-pz__time"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>About {(canMore ? moreMin : 0) + (onConnect ? 2 : 0)} minutes · all optional</p>
        <ul className="ay-pz__list">
          {canMore && (
            <li style={{ '--i': 0 }}>
              <button type="button" onClick={safetyLeft > 0 ? (onSafety || onMorePersonal) : onMorePersonal}>
                <span className="ay-pz__blob is-pink" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 9.5a4 4 0 1 1 5.5 3.7c-.9.4-1.5 1.2-1.5 2.2V16" /><circle cx="12" cy="19.5" r=".6" /></svg></span>
                <span className="ay-pz__txt"><b>{safetyLeft > 0 ? `Answer ${safetyLeft} safety ${safetyLeft === 1 ? 'question' : 'questions'}` : 'Answer a few more questions'}</b><small>{safetyLeft > 0 ? 'Allergies, conditions, medicines' : 'Goals, budget, what you like'} · {moreMin} min</small></span>
                <Arrow />
              </button>
            </li>
          )}
          {onConnect && (
            <li style={{ '--i': 1 }}>
              <button type="button" onClick={onConnect}>
                <span className="ay-pz__blob is-butter" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4h7l4 4v12H7z" /><path d="M14 4v4h4M10 13h5M10 16.5h5" /></svg></span>
                <span className="ay-pz__txt"><b>Connect your health records</b><small>Allergies, medicines · 1 min</small></span>
                <Arrow />
              </button>
            </li>
          )}
          {onConnect && (
            <li style={{ '--i': 2 }}>
              <button type="button" onClick={onConnect}>
                <span className="ay-pz__blob is-ink" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="7" y="6" width="10" height="12" rx="3.5" /><path d="M9 6l.6-3h4.8l.6 3M9 18l.6 3h4.8l.6-3M10 12h1l1-2 1.2 4 .8-2h1" /></svg></span>
                <span className="ay-pz__txt"><b>Connect a wearable</b><small>Apple Health, Oura · 1 min</small></span>
                <Arrow />
              </button>
            </li>
          )}
        </ul>
        <button type="button" className="ay-pz__skip" onClick={() => setStage('matches')}>Skip, see my matches <Arrow /></button>
      </Tag>
    );
  }

  return (
    <Tag className={`ay-ob-ready uq-reveal is-${variant}`} aria-labelledby="ay-ob-ready-h">
      {onBack && (
        <button type="button" className="ay-ob-back" onClick={stage === 'matches' && (canMore || onConnect) && !prefsDone ? () => setStage('personal') : onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
        </button>
      )}
      <h1 id="ay-ob-ready-h" className="ay-ob-ready__title">{total > 0 ? <>We found <span className="ay-ob-count">{total}</span> {total === 1 ? 'match' : 'matches'}</> : 'Your profile is ready.'}</h1>
      {prefsDone && <p className="ay-ob-ready__updated" role="status">{changed > 0 ? `${changed} new ${changed === 1 ? 'match' : 'matches'} from your answers.` : 'Updated with your answers.'}</p>}
      {!bleeding && careNote && !careOnCard && <p className="ay-ob-ready__careline" role="note"><span className="ay-flag" aria-hidden="true">!</span>{careNote}</p>}
      {bleeding && !bleedOnCard && <BleedingEvaluationNote className="ay-ob-ready__care" title={bleeding.title} note={{ ...bleeding, text: 'It should be checked promptly by an ob-gyn or your clinician.' }} />}
      {rows.length > 0 && services.length > 0 && (
        <div className="ay-rvtabs" role="tablist" aria-label="Products or services" data-on={tab}>
          <button type="button" role="tab" aria-selected={tab === 'products'} onClick={() => setTab('products')}>Products <i>{productCount}</i></button>
          <button type="button" role="tab" aria-selected={tab === 'services'} onClick={() => setTab('services')}>Services <i>{services.length}</i></button>
          <span className="ay-rvtabs__pill" aria-hidden="true" />
        </div>
      )}
      {rows.length > 0 && tab === 'services' && (
        <ol className="ay-svc">
          {services.map(({ p, need }, i) => {
            const pct = pctFor(p);
            return <li key={p.id} style={{ '--i': i }}>
              <MatchPlate product={p} src={safeProductImageSrc(p.image || p.imageUrl || p.images?.[0], true)} />
              <span className="ay-ob-picks__text"><b>{p.name}</b><small>For {need.toLowerCase()} · {shownPriceText(formatPrice(p).main) || 'See price'}</small></span>
              {pct != null && <em className="ay-ob-picks__pct">{pct}%</em>}
            </li>;
          })}
        </ol>
      )}
      {rows.length > 0 && tab === 'products' ? (
        <section className="ay-ob-needs" aria-labelledby="ay-ob-needs-h">
          <h2 id="ay-ob-needs-h" className="ay-ob-needs__h">What you asked for help with</h2>
          {/* Nov 5 (founder: card stack, more animated, follow the inspo): her needs as a fanned deck. Drag
              the top card (it follows your finger and tilts), tap the card behind, or use the arrows. */}
          <div className={`ay-deck${rows.length === 1 ? ' is-single' : ''}${dragX ? ' is-dragging' : ''}`}
            onPointerDown={(e) => { swipeX.current = e.clientX; swiped.current = false; }}
            onPointerMove={(e) => { if (swipeX.current != null && rows.length > 1) setDragX(e.clientX - swipeX.current); }}
            onPointerUp={(e) => { const dx = e.clientX - (swipeX.current ?? e.clientX); swipeX.current = null; setDragX(0); swiped.current = Math.abs(dx) > 40; if (swiped.current && rows.length > 1) go(dx < 0 ? 1 : -1); }}
            onPointerCancel={() => { swipeX.current = null; setDragX(0); }}
            onPointerLeave={() => { if (swipeX.current != null) { swipeX.current = null; setDragX(0); } }}>
            <ul className="ay-ob-needs__list ay-deck__cards">
              {rows.map((r, i) => {
                const pos = (i - at + rows.length) % rows.length;
                const status = r.products.length ? `${r.products.length} ${r.products.length === 1 ? 'product' : 'products'}` : r.services.length ? `${r.services.length} ${r.services.length === 1 ? 'service' : 'services'}` : r.needsAnswers ? 'After safety questions' : r.held ? 'Held for safety' : r.why || r.careFirst ? 'Ask a clinician' : 'None yet';
                return (
                  <li key={r.id} className={`ay-deck__card is-tone-${i % 3}`} data-pos={Math.min(pos, 3)} style={{ '--i': i, zIndex: rows.length - pos, ...(pos === 0 && dragX ? { transform: `translateX(${dragX}px) rotate(${dragX / 18}deg)` } : {}) }} aria-hidden={pos !== 0 ? 'true' : undefined} onClick={pos !== 0 ? () => { if (!swiped.current) setAt(i); swiped.current = false; } : undefined}>
                    <span className="ay-deck__head">
                      <span className="ay-deck__kicker">{rows.length > 1 ? `${i + 1} of ${rows.length}` : 'Your focus'}</span>
                      <em className={r.products.length || r.services.length ? '' : 'is-none'}>{status}</em>
                    </span>
                    <b className="ay-deck__title">{r.label}</b>
                    {r.products.length > 0
                      ? <ol className="ay-ob-picks">{r.products.slice(0, 3).map((p) => {
                        const pct = pctFor(p);
                        const price = shownPriceText(formatPrice(p).main);
                        return <li key={p.id}>
                          <MatchPlate product={p} src={safeProductImageSrc(p.image || p.imageUrl || p.images?.[0], p.type === 'digital')} />
                          <span className="ay-ob-picks__text"><b>{p.name}</b><small>{[p.brand, price].filter(Boolean).join(' · ')}</small></span>
                          {pct != null && <em className="ay-ob-picks__pct">{pct}%</em>}
                        </li>;
                      })}{r.products.length > 3 && <li className="ay-deck__more">+{r.products.length - 3} more in your list</li>}</ol>
                      : <small className="ay-deck__empty">{r.careFirst && bleeding ? <>Bleeding after menopause should be checked promptly by an ob-gyn or your clinician. We don’t suggest products for it. {bleeding.source?.url && <a href={bleeding.source.url} target="_blank" rel="noopener noreferrer">{bleeding.source.label || 'Source'}</a>}</> : r.id === careOnCard ? careNote : r.services.length ? <>No products for this yet. {r.services.length === 1 ? 'A service fits it' : `${r.services.length} services fit it`}: <button type="button" className="ay-deck__link" onClick={(e) => { e.stopPropagation(); setTab('services'); }}>see services</button></> : r.held ? r.heldWhy : r.why || 'Nothing strong enough yet. We only show what we can stand behind.'}</small>}
                  </li>
                );
              })}
            </ul>
            {rows.length > 1 && (
              <div className="ay-deck__nav">
                <button type="button" onClick={() => go(-1)} aria-label="Previous need"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg></button>
                <span className="ay-deck__dots" aria-live="polite">{rows.map((r, i) => <i key={r.id} className={i === at ? 'is-on' : ''} />)}<span className="ay-sr">{`${rows[at]?.label}, ${at + 1} of ${rows.length}`}</span></span>
                <button type="button" onClick={() => go(1)} aria-label="Next need"><Arrow /></button>
              </div>
            )}
          </div>
        </section>
      ) : rows.length > 0 ? null : !ready ? (
        <p className="ay-ob-ready__lead" role="status">Getting your matches ready…</p>
      ) : (
        <p className="ay-ob-ready__lead">You didn’t pick anything specific, so {variant === 'web' ? 'your ecosystem starts with options to explore' : 'Today starts with quick check-ins'}. Add what you want help with any time in You.</p>
      )}
      <div className="ay-ob-ready__actions ay-ob-next">
        {!signedIn && onCreateAccount
          ? <button type="button" className="ay-ob-next__main" onClick={onCreateAccount}>{total === 1 ? 'Save my match' : `Save my ${total > 0 ? `${total} ` : ''}matches`}<Arrow /></button>
          : <button type="button" className="ay-ob-next__main" onClick={onSeeToday}>{total > 1 ? `See all ${total} matches` : total === 1 ? 'See your match' : (variant === 'web' ? 'See my ecosystem' : 'Go to Home')}<Arrow /></button>}
        <small className="ay-ob-next__note">{!signedIn && onCreateAccount ? 'Free account, no card.' : 'They’re saved in Home.'}</small>
        {onWatchWrapped && total > 0 && signedIn && <button type="button" className="ay-ob-next__link" onClick={onWatchWrapped}>Watch my ayna Wrapped</button>}
      </div>
    </Tag>
  );
}
