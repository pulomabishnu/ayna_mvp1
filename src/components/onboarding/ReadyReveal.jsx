import { useEffect, useMemo, useState } from 'react';
import { groupShelves } from '../../matching/shelfGroups.js';
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
import { groupRevealRows } from '../../matching/shelfGroups.js';
import { loadProductCatalog } from '../../utils/productCatalog.js';

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
const CARE_LINE_CODES = ['urgent_yes', 'pregnancy_bleeding', 'estrogen_bc_condition', 'ttc_spironolactone', 'uti_right_now', 'uti_first_time', 'vaginitis_testing', 'spotting_check', 'severe_pain', 'very_heavy_flow', 'pmdd_care', 'pregnancy_nausea', 'pregnancy_constipation', 'recurrent_uti_care', 'pms_care', 'pcos_care', 'adenomyosis_care', 'peri_brain_fog', 'symptom_check'];
function perNeed(answers, matchOpts = undefined) {
  if (!answers) return { rows: [], total: 0, careNote: '' };
  try {
    const { shelves: rawShelves = [], careFlags = null, everydayBasics = false } = getEcosystemSeedFromQuiz(answers, null, matchOpts);
    // Nov 6: needs one set of products serves share a shelf (src/matching/shelfGroups.js).
    const shelves = groupShelves(rawShelves);
    const rows = shelves.map((sh) => {
      const seeded = (sh.productIds || []).map((id) => getProductById(id)).filter((p) => p && showableAsPick(p, answers));
      // Nov 10 audit: only the picks that are saved to her ecosystem, so the count here matches
      // Wrapped and My ecosystem (it said 5 here, then 2 after sign-up).
      const all = seeded.slice(0, 5);
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
      return { id: sh.needId, groupId: sh.groupId || null, needIds: sh.needIds || [sh.needId], members: sh.members || null, label: sh.label, products, services, held, needsAnswers, heldWhy, why, careFirst: !all.length && sh.emptyReason === 'care_first' };
    });
    // Nov 4: one "check with a clinician" line when a need she picked calls for it (spotting, UTI now, severe pain).
    const notes = careFlags?.notes || [];
    // Nov 5 (founder: the warning took too much space): the short line when there is one.
    const first = CARE_LINE_CODES.map((c) => notes.find((n) => n.code === c)).find(Boolean);
    const careNote = first?.short || first?.text || '';
    const careNoteFor = first?.code === 'pregnancy_constipation' ? 'digestive.constipation' : null;
    const grouped = groupRevealRows(rows);
    const total = new Set(grouped.flatMap((row) => [...row.products, ...row.services].map((p) => p.id))).size;
    return { rows: grouped, total, careNote, careNoteFor, everydayBasics };
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

function Arrow() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }

export default function ReadyReveal({ prefsDone = false, answers = null, variant = 'app', signedIn = false, onSeeToday, onWatchWrapped, onCreateAccount, onBack, onMorePersonal, onSafety = null, onConnect = null, connected = false, matchOpts = undefined, onLearn = null, onExplore = null }) {
  const ready = useCatalogReady();
  const [liveReady, setLiveReady] = useState(() => typeof window === 'undefined');
  useEffect(() => { let active = true; loadProductCatalog().finally(() => { if (active) setLiveReady(true); }); return () => { active = false; }; }, []);
  const matches = useMemo(() => (ready && liveReady ? firstMatches(answers, 5) : []), [answers, ready, liveReady]);
  // Her connected health data counts too (founder, Nov 9: results from the quiz AND wearables).
  const { rows: needRows, total: needTotal, careNote, everydayBasics = false } = useMemo(() => (ready && liveReady ? perNeed(answers, matchOpts) : { rows: [], total: 0, careNote: '' }), [answers, ready, liveReady, matchOpts]);
  // Founder, Nov 10 ("this should never be a thing"): no screen that says there is nothing for her.
  // When no need produced a shelf, her top matches from the same engine show as "Picks for you".
  const basics = [];
  const rows = needRows.length ? needRows : matches.length ? [{
    id: 'for-you', label: 'Picks for you', needIds: [], products: matches.filter((p) => p.type !== 'digital'), services: matches.filter((p) => p.type === 'digital'),
  }] : basics;
  const total = needRows.length ? needTotal : matches.length ? matches.length : 0;
  // Nov 4 (founder: "the extra questions didn't change my match"): say what changed. The
  // matches before the extra questions are kept for this tab only (ids, no answers).
  const changed = useMemo(() => {
    const ids = rows.flatMap((r) => [...r.products, ...r.services].map((p) => p.id));
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
  // Focus group, Nov 9: "nothing to fix, but I want to learn about birth control".
  const learn = Array.isArray(answers?.fullHealthIntake?.learnInterests) ? answers.fullHealthIntake.learnInterests : [];
  const remaining = useMemo(() => (answers?.fullHealthIntake ? moreRemaining(reconstructIntakeFromSnapshot(answers.fullHealthIntake)) : 0), [answers]);
  // Nov 3: the safety questions now come right after the reveal. Until they're
  // answered, anything she takes stays off her list, so ask for them first.
  const safetyLeft = useMemo(() => {
    if (!answers?.fullHealthIntake) return 0;
    const i = reconstructIntakeFromSnapshot(answers.fullHealthIntake);
    return ['conditions', 'allergies', 'medications'].filter((id) => !isStepAnswered(id, i)).length;
  }, [answers]);
  // Nov 5 (founder): first a big "make my matches more personal" moment (more questions, connect
  // records and a wearable, with the time each takes), a small "skip" to the matches.
  const canMore = Boolean(onMorePersonal) && (safetyLeft > 0 || remaining > 0);
  const [stage, setStage] = useState(() => (!prefsDone && (canMore || onConnect) ? 'personal' : 'matches'));
  const moreMin = Math.max(2, Math.round(((safetyLeft || remaining) * 30) / 60));
  const Tag = variant === 'web' ? 'section' : 'main';
  const pctFor = (p) => { const d = getProductMatchDetailsForProduct(p, answers); return isSafetyHold(d) || isBleedingEvaluation(d) ? null : shownMatchPercent(d?.percent ?? d?.score); };

  if (stage === 'personal' && ready && total > 0) {
    return (
      <Tag className={`ay-ob-ready ay-pz uq-reveal is-${variant}`} aria-labelledby="ay-pz-h">
        {onBack && <button type="button" className="ay-ob-back" onClick={onBack} aria-label="Back to quiz"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg></button>}
        {/* Inspo: the big stat number (heart-rate and wellness dashboards), not a highlighter. */}
        <p className="ay-pz__found"><span className="ay-pz__num">{total}</span><span className="ay-pz__lbl">{total === 1 ? 'match' : 'matches'}<br />ready</span></p>
        <h1 id="ay-pz-h" className="ay-pz__h">Make them more you.</h1>
        <p className="ay-pz__time"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>About {(canMore ? moreMin : 0) + (onConnect ? 1 : 0)} minutes · all optional</p>
        <ul className="ay-pz__list">
          {canMore && (
            <li style={{ '--i': 0 }}>
              <button type="button" onClick={safetyLeft > 0 ? (onSafety || onMorePersonal) : onMorePersonal}>
                <span className="ay-pz__blob is-pink" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 9.5a4 4 0 1 1 5.5 3.7c-.9.4-1.5 1.2-1.5 2.2V16" /><circle cx="12" cy="19.5" r=".6" /></svg></span>
                <span className="ay-pz__txt"><b>{safetyLeft > 0 ? 'Answer the safety questions' : 'Answer a few more questions'}</b><small>{safetyLeft > 0 ? 'Allergies, conditions, medicines' : 'Goals, budget, what you like'} · about {moreMin} min</small></span>
                <Arrow />
              </button>
            </li>
          )}
          {onConnect && (
            <li style={{ '--i': 1 }}>
              <button type="button" onClick={onConnect} className={connected ? 'is-done' : undefined}>
                <span className="ay-pz__blob is-ink" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="7" y="6" width="10" height="12" rx="3.5" /><path d="M9 6l.6-3h4.8l.6 3M9 18l.6 3h4.8l.6-3M10 12h1l1-2 1.2 4 .8-2h1" /></svg></span>
                <span className="ay-pz__txt"><b>{connected ? 'Wearables linked' : 'Link your wearables'}</b><small>{connected ? 'Your matches use your health data too' : 'Apple Health, Oura · 1 min'}</small></span>
                {connected ? <span className="ay-pz__tick" aria-label="Linked"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg></span> : <Arrow />}
              </button>
            </li>
          )}
        </ul>
        {/* Nov 8 (founder): after the quiz, three clear choices: more questions, see your results
            (ayna Wrapped, then the account), or link your wearables. */}
        {/* Founder, Nov 9: signed in (she made an account to link her data) it says See my Home;
            signed out it says to create the account that saves them (Wrapped plays right after). */}
        {signedIn
          // Founder, Nov 10: ayna Wrapped is the first thing she sees after the quiz, signed in too, then Home.
          ? <button type="button" className="ay-pz__see" onClick={onWatchWrapped || onSeeToday || (() => setStage('matches'))}>{onWatchWrapped ? 'See my results' : 'See my Home'} <Arrow /></button>
          : <button type="button" className="ay-pz__see" onClick={onCreateAccount || onWatchWrapped || (() => setStage('matches'))}>Create your account to save <Arrow /></button>}

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
      {!bleeding && careNote && <p className="ay-ob-ready__careline" role="note"><span className="ay-flag" aria-hidden="true">!</span>{careNote}</p>}
      {bleeding && <BleedingEvaluationNote className="ay-ob-ready__care" title={bleeding.title} note={{ ...bleeding, text: 'It should be checked promptly by an ob-gyn or your clinician.' }} />}
      {rows.length > 0 ? (
        <section className="ay-ob-needs" aria-labelledby="ay-ob-needs-h">
          <h2 id="ay-ob-needs-h" className="ay-ob-needs__h">{everydayBasics ? 'Nothing to fix? Start with the basics' : needRows.length ? 'What you asked for help with' : 'Your top picks'}</h2>
          <p>{everydayBasics ? 'Everyday picks for your stage, ranked by your answers and what you like. Add the ones you use and ayna suggests similar ones in your Daily Rundown.' : needRows.length ? 'OTC options for symptom management and support.' : matches.length ? 'Ranked by how well each fits your answers. Pick what you want help with to get more.' : 'Everyday picks for your stage, ranked by your answers. Add the ones you use to your ecosystem and ayna suggests similar ones in your Daily Rundown.'}</p>
          <ul className="ay-reveal-shelves">
            {rows.map((r, i) => {
              const picks = [...r.products, ...r.services];
              return <li key={r.id} className={`ay-reveal-shelf is-tone-${i % 3}`}>
                <div className="ay-reveal-shelf__head"><h3>{r.label}</h3>{r.memberLabels?.length > 1 && <small className="ay-reveal-shelf__sub">{r.memberLabels.join(', ')}</small>}<span>{picks.length ? `${picks.length} ${picks.length === 1 ? 'option' : 'options'}` : r.held ? 'Held for safety' : 'Care first'}</span></div>
                {picks.length ? <ol className="ay-ob-picks">{picks.map((p) => {
                  const pct = pctFor(p);
                  const price = shownPriceText(formatPrice(p).main);
                  return <li key={p.id} data-kind={p.type === 'digital' ? 'service' : 'product'}>
                    <MatchPlate product={p} src={safeProductImageSrc(p.image || p.imageUrl || p.images?.[0], p.type === 'digital')} />
                    <span className="ay-ob-picks__text"><b>{p.name}</b><small>{[p.type === 'digital' ? 'Service' : null, p.brand, price].filter(Boolean).join(' · ')}</small></span>
                    {pct != null && <em className="ay-ob-picks__pct">{pct}%</em>}
                  </li>;
                })}</ol> : <small className="ay-deck__empty">{r.careFirst && bleeding ? <>Bleeding after menopause should be checked promptly by an ob-gyn or your clinician. We don’t suggest products for it. {bleeding.source?.url && <a href={bleeding.source.url} target="_blank" rel="noopener noreferrer">{bleeding.source.label || 'Source'}</a>}</> : r.held ? r.heldWhy : r.why || <>Nothing is backed well enough to recommend yet.{variant === 'web' && <> <a className="ay-deck__link" href={`/explore?q=${encodeURIComponent(String(r.label || '').toLowerCase())}`} target="_blank" rel="noopener noreferrer">Browse it in Shop</a> or <a className="ay-deck__link" href="/explore/services" target="_blank" rel="noopener noreferrer">see services</a>.</>}</>}</small>}
              </li>;
            })}
          </ul>
          {/* Her "what you want to learn about" topics stay on this page too (focus group, Nov 9). */}
          {(everydayBasics || !needRows.length) && learn.length > 0 && (
            <section className="ay-ob-learn" aria-labelledby="ay-ob-learn-h2">
              <h2 id="ay-ob-learn-h2">What you want to learn about</h2>
              <ul>{learn.map((t) => <li key={t}>{onLearn
                ? <button type="button" onClick={() => onLearn(t)}>{t}<Arrow /></button>
                : <a href={`/library?q=${encodeURIComponent(t.toLowerCase())}`}>{t}<Arrow /></a>}</li>)}</ul>
            </section>
          )}
        </section>
      ) : !ready || !liveReady ? (
        <p className="ay-ob-ready__lead" role="status">Getting your matches ready…</p>
      ) : (
        <>{learn.length > 0 && (
          <section className="ay-ob-learn" aria-labelledby="ay-ob-learn-h">
            <h2 id="ay-ob-learn-h">What you want to learn about</h2>
            <p>Saved to your profile. Tap one to start.</p>
            <ul>{learn.map((t) => <li key={t}>{onLearn
              ? <button type="button" onClick={() => onLearn(t)}>{t}<Arrow /></button>
              : <a href={`/library?q=${encodeURIComponent(t.toLowerCase())}`}>{t}<Arrow /></a>}</li>)}</ul>
          </section>
        )}
        {/* Founder, Nov 10: never a dead end. Explore Shop and add what she uses or likes; ayna learns
            from her ecosystem and suggests similar products in the Daily Rundown. */}
        <p className="ay-ob-ready__lead">Explore Shop and add the products you use or like to your ecosystem. ayna learns from them and suggests similar ones in your Daily Rundown.</p>
</>
      )}
      <div className="ay-ob-ready__actions ay-ob-next">
        {total === 0 && (rows.length === 0 || basics.length > 0) && onExplore && ready && liveReady
          ? <><button type="button" className="ay-ob-next__main" onClick={onExplore}>Explore Shop<Arrow /></button>
            {onBack && <button type="button" className="ay-ob-next__link" onClick={onBack}>Or pick what you want help with</button>}</>
          : onWatchWrapped && total > 0
          ? <button type="button" className="ay-ob-next__main" onClick={onWatchWrapped}>See my results<Arrow /></button>
          : !signedIn && onCreateAccount
            ? <button type="button" className="ay-ob-next__main" onClick={onCreateAccount}>{total === 0 ? 'Save my profile' : total === 1 ? 'Save my match' : `Save my ${total} matches`}<Arrow /></button>
            : <button type="button" className="ay-ob-next__main" onClick={onSeeToday}>{total > 1 ? `See all ${total} matches` : total === 1 ? 'See your match' : (variant === 'web' ? 'See my ecosystem' : 'Go to Home')}<Arrow /></button>}
        {!(total === 0 && (rows.length === 0 || basics.length > 0) && onExplore && ready && liveReady) && <small className="ay-ob-next__note">{onWatchWrapped && total > 0 ? (signedIn ? 'Your ayna Wrapped, then your matches.' : 'Your ayna Wrapped, then save them with a free account.') : !signedIn && onCreateAccount ? 'Free account, no card.' : 'They’re saved in Home.'}</small>}
        {onWatchWrapped && total > 0 && (signedIn
          ? <button type="button" className="ay-ob-next__link" onClick={onSeeToday}>Skip to my matches</button>
          : onCreateAccount && <button type="button" className="ay-ob-next__link" onClick={onCreateAccount}>Skip, save my matches</button>)}
      </div>
    </Tag>
  );
}
