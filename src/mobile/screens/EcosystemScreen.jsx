import './profile/health-connections.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { loadMonthlyCheckinStatus } from '../../utils/monthlyCheckinStore.js';
import EmptyState from '../components/EmptyState.jsx';
import { healthAreaLabel } from '../utils/healthAreaLabel.js';
import MobileHeader from '../components/MobileHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ArticleCard from '../components/ArticleCard.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import { getProductMatchDetailsForProduct, getEcosystemSeedFromQuiz, getSelectedNeeds, getProductById } from '../../data/products.js';
import { ECOSYSTEM_AREAS } from '../data/ecosystemAreas.js';
import { selectEcosystemProducts } from '../utils/recommendationSelection.js';
import { careNotes, shortNeedLabel, shownMatchPercent } from '../../utils/matchDisplay.js';
import { summarizeCareNotes, firstCareLink } from '../../utils/careSummary.js';
import CareNote from '../../components/CareNote.jsx';
import { Routine, ShoppingList } from '../components/RoutinePlan.jsx';
import { HealthDashboardContent as HealthDashboard } from '../components/HealthDashboard.jsx';
import ProFeatureGate from '../../components/ProFeatureGate.jsx';
import { usesHormonalBC } from '../../health/weekInsights.js';
import { budgetMax } from '../../health/plan.js';
import { optionalProgress, reconstructIntakeFromSnapshot } from '../data/intakeModel.js';
import '../eco-needs.css';
import FinishQuizCard from '../../components/FinishQuizCard.jsx';
import { lifeStageClash, STAGE_NOTE_CODE } from '../../components/eco/lifeStageFix.js';
import { useDismissed, useRevealOnce } from '../../components/eco/ecoMotion.js';
import { useLatestAnnouncement } from '../../hooks/useLatestAnnouncement.js';
import '../eco-app-best.css';
import HealthShapedNote from '../../components/health/HealthShapedNote.jsx';
import { PlusIcon } from '../../components/icons/UiIcons.jsx';
import { ecosystemCounts, needsCoveredLine } from '../../utils/ecosystemCounts.js';
import NeedRoutines from '../../components/routine/NeedRoutines.jsx';
import RoutineTimeline from '../../components/routine/RoutineTimeline.jsx';
import { useRoutines } from '../../components/routine/useRoutines.js';
import { ADD_TO_ROUTINE } from '../../utils/routineCopy.js';
import { openTodayLog } from '../../components/today/openLog.js';
import { routineDay } from '../../components/you/setupSteps.js';
import '../you-hub-app.css';

// Shelf tones: pink and espresso only (data-blue is for chart lines, You audit P2).
const AREA_TONES = ['#F7BADD', '#3E2723', '#F7BADD', '#3E2723', '#F7BADD', '#3E2723'];
const MIN_SHELF_SCORE = 50;

function CareLinks({ care, limit = 4 }) {
  if (!care) return null;
  const links = [...(care.clinicLinks || []), ...(care.telehealthLinks || [])].slice(0, limit);
  if (!links.length) return null;
  return <ul className="ay-care-links">{links.map((link) => <li key={link.href}>
    <a href={link.href} target="_blank" rel="noopener noreferrer"><strong>{link.label}</strong><span>{link.hint}</span></a>
  </li>)}</ul>;
}

// Bring the Products / Dashboard toggle into view (the screen scrolls inside its own container).
function scrollToTabs() {
  requestAnimationFrame(() => document.querySelector('.eco-seg')?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
}

function onlyNote(count, phrase) {
  return `Only ${count} strong match${count === 1 ? '' : 'es'} for ${phrase} so far`;
}

/* A product as one tappable line (name, brand, match), not a big photo card
   (founder, Oct 28: "it can say the product names and you can click to open
   it"). Used for ayna's picks and Saved, where scanning matters most. */
function NameRow({ product, pct, onOpen, actionLabel, onAction, done = false }) {
  return (
    <li className="eco-row">
      <button type="button" className="eco-row__main" onClick={() => onOpen?.(product)}>
        <span className="eco-row__name">{product.name}</span>
        <small className="eco-row__meta">{[product.brand, product.price && !/check retailer/i.test(product.price) ? String(product.price).split(' ')[0] : null].filter(Boolean).join(' · ')}</small>
      </button>
      {pct != null && <span className="eco-row__pct" aria-label={`${pct}% match`}>{pct}%</span>}
      {onAction && <button type="button" className={`eco-row__act${done ? ' is-done' : ''}`} onClick={() => onAction(product)} disabled={done}>{done ? 'Added' : actionLabel}</button>}
    </li>
  );
}

export default function EcosystemScreen({
  myProducts = [], authUser = null, suggestedEcosystemProducts = [],
  relatedReads = [], savedProducts = {}, headerInitial = 'A', onOpenProduct,
  onOpenArticle, onOpenSaved, onBrowse, onGoCommunity, onRetake,
  onRequestEcosystemReset, ecosystemNotice, onOpenMonthlyCheckin, onOpenProfile,
  quizAnswers = null, matchOpts, onOpenWhyMatch, onAddToEcosystem, onToggleSaved, onReplayStory,
  onOpenHealthData, healthSummary = null, healthConnectedCount = 0,
  healthInsights = null, onAddGoal, ecoTab = 'products', onEcoTab, routineHave = {}, onToggleHave,
  routineExcluded = {}, onToggleRoutineProduct, routineOutcomes = {}, onLogRoutineOutcome,
  onSavePlaylist, onOpenPlaylist, onConnectHealth, onRequireAuth, onPersonalize, lastQuizAnswers = null,
  quizDraft = null, onResumeQuiz, onStartOverQuiz, onFixLifeStages, onStartQuiz, onEditIntakeStep, onUpdateIntake, articles = [], onBack,
  omittedProducts = {}, onToggleOmit, onGoToday,
  // Inside the ayna tab's Products view: the switch row replaces the header.
  homeTop = null,
}) {
  const rootRef = useRef(null);
  const titleRef = useRef(null);
  const routineRef = useRef(null);
  // Her routines, one per active need (period pain, PMS, sleep): Start here, Track it, Other options.
  const routineSource = {
    userId: authUser?.id || null, quizAnswers, matchOpts,
    products: myProducts, saved: savedProducts, omitted: omittedProducts, have: routineHave,
  };
  const routines = useRoutines({
    ...routineSource,
    onAddToRoutine: onAddToEcosystem, onToggleSaved, onNotForMe: onToggleOmit, onToggleHave,
  });
  const openCheckIn = onGoToday ? () => { onGoToday(); setTimeout(() => openTodayLog('app'), 400); } : null;
  const [sheet, setSheet] = useState(false);
  // This month's check-in: due until she has done it (signed in only).
  const [checkinDue, setCheckinDue] = useState(false);
  useEffect(() => {
    if (!authUser?.id) return undefined;
    let live = true;
    loadMonthlyCheckinStatus().then((st) => { if (live) setCheckinDue(!st?.thisMonthCheckin); }).catch(() => {});
    return () => { live = false; };
  }, [authUser?.id]);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState('all');
  // Products view, one list at a time (founder, Oct 28: separate her products, ayna's picks and saved; no long scroll).
  const [view, setView] = useState('mine');
  const [gone, dismiss] = useDismissed('ayna_app_eco_for_closed_v1');
  const news = useLatestAnnouncement();
  // Shelves rise in once, card by card, the first time they scroll into view.
  useRevealOnce(rootRef, '.eco-app-shelf, .ayna-cabinet-reads, .ay-eco-shop, .eco-app-list-wrap');
  useEffect(() => {
    if (!sheet) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSheet(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet]);
  // Optional quiz questions still open (from her saved answers, even when
  // personalization is switched off).
  const savedIntake = (lastQuizAnswers || quizAnswers)?.fullHealthIntake || null;
  const hasAnswers = Boolean(lastQuizAnswers || quizAnswers);
  const remainingOptional = useMemo(() => {
    if (!savedIntake) return 0;
    try { return optionalProgress(reconstructIntakeFromSnapshot(savedIntake)).remaining; } catch { return 0; }
  }, [savedIntake]);
  const goalIds = useMemo(() => (quizAnswers ? getSelectedNeeds(quizAnswers).map((n) => n.id) : []), [quizAnswers]);
  const scoreFor = (product, profile) => getProductMatchDetailsForProduct(product, profile, null, matchOpts);
  const shortlist = quizAnswers
    ? selectEcosystemProducts(myProducts, quizAnswers, quizAnswers.fullHealthIntake?.recommendedProductsPerArea, scoreFor)
    : myProducts;
  // The hero, Wrapped and the website count from one selector (utils/ecosystemCounts).
  const counts = ecosystemCounts(myProducts, quizAnswers, { matchOpts });

  // Engine shelves: one per selected need (label, picks, shortBy, emptyReason),
  // plus care flags (care first when urgent = Yes, calm care notes otherwise).
  const seed = useMemo(() => (quizAnswers ? getEcosystemSeedFromQuiz(quizAnswers, null, matchOpts) : null), [quizAnswers, matchOpts]);
  const phraseById = useMemo(() => new Map((quizAnswers ? getSelectedNeeds(quizAnswers, null, matchOpts) : []).map((n) => [n.id, n.phrase])), [quizAnswers, matchOpts]);
  const shelves = seed?.shelves || [];
  // A need the counts call covered never shows an empty shelf: if the shortlist
  // left it empty, the product of hers that covers it joins that shelf.
  const fits = (p, needId) => scoreFor(p, quizAnswers).needMatches?.some((m) => m.needId === needId && m.relevant && m.score >= MIN_SHELF_SCORE);
  const shortIds = new Set(shortlist.map((product) => product.id));
  const forcedShelf = new Map();
  if (quizAnswers) {
    shelves.forEach((sh) => {
      if (!counts.coveredNeedIds.includes(sh.needId) || shortlist.some((p) => fits(p, sh.needId))) return;
      const p = myProducts.find((x) => !shortIds.has(x.id) && !forcedShelf.has(x.id) && fits(x, sh.needId));
      if (p) forcedShelf.set(p.id, sh.needId);
    });
  }
  const currentProducts = forcedShelf.size ? [...shortlist, ...myProducts.filter((p) => forcedShelf.has(p.id))] : shortlist;
  const currentIds = new Set(currentProducts.map((product) => product.id));
  const earlierProducts = myProducts.filter((product) => !currentIds.has(product.id));
  const careFlags = seed?.careFlags || null;
  const careFirst = Boolean(careFlags?.careFirst);
  const notes = careNotes(careFlags);
  const myIds = new Set(myProducts.map((p) => p.id));

  // Each current pick sits on the shelf of its best need (50+). Picks that fit
  // no selected need keep the old area grouping.
  const shelfIds = new Set(shelves.map((s) => s.needId));
  const byNeed = new Map();
  const fallback = new Map();
  currentProducts.forEach((product) => {
    // The engine's own shelf first, else the best need it scores 50+ for.
    const engineShelf = forcedShelf.has(product.id) ? shelves.find((s) => s.needId === forcedShelf.get(product.id)) : shelves.find((s) => s.productIds.includes(product.id));
    const details = !engineShelf && quizAnswers ? scoreFor(product, quizAnswers) : null;
    const needId = engineShelf?.needId || details?.needMatches?.find((m) => shelfIds.has(m.needId) && m.relevant && m.score >= MIN_SHELF_SCORE)?.needId;
    if (needId) {
      if (!byNeed.has(needId)) byNeed.set(needId, []);
      byNeed.get(needId).push(product);
      return;
    }
    const fallbackKey = product.areaKey || 'other';
    const label = healthAreaLabel(ECOSYSTEM_AREAS.find((area) => area.key === fallbackKey)?.label || 'More care');
    const key = `area-${encodeURIComponent(label.toLowerCase())}`;
    if (!fallback.has(key)) fallback.set(key, { key, label, ringLabel: label, products: [] });
    fallback.get(key).products.push(product);
  });

  const suggestedIds = new Set();
  const sections = [
    ...shelves.map((shelf) => {
      const products = byNeed.get(shelf.needId) || [];
      // An empty shelf shows the engine's own picks to add (never padded).
      const picks = products.length ? [] : shelf.productIds
        .filter((id) => !myIds.has(id))
        .map((id) => getProductById(id))
        .filter(Boolean);
      picks.forEach((p) => suggestedIds.add(p.id));
      return {
        key: `need-${encodeURIComponent(shelf.needId)}`,
        label: shelf.label,
        ringLabel: healthAreaLabel(shelf.label),
        phrase: phraseById.get(shelf.needId) || shelf.label.toLowerCase(),
        products,
        picks,
        shelf,
      };
    }),
    ...fallback.values(),
  ];
  // Calm empty shelves go last so her picks lead.
  sections.sort((a, b) => Number(!a.products.length && !a.picks?.length) - Number(!b.products.length && !b.picks?.length));

  // Ring: needs grouped into areas (two needs in one area share a segment).
  const ringGroups = [];
  // One ring segment per shelf, named like the shelf, so the donut, legend,
  // hero counts and shelf tags always agree.
  sections.filter((s) => s.products.length > 0).forEach((s) => {
    ringGroups.push({ key: s.key, label: s.label, products: s.products });
  });
  const toneFor = (section) => {
    const index = ringGroups.findIndex((g) => g.key === section.key);
    return AREA_TONES[(index < 0 ? ringGroups.length + sections.indexOf(section) : index) % AREA_TONES.length];
  };
  const worthALook = suggestedEcosystemProducts.filter((p) => !suggestedIds.has(p.id));
  // ayna picks: the engine's picks for her empty shelves, then Worth a look (never her own products).
  const picksForYou = [...sections.flatMap((sct) => sct.picks || []), ...worthALook].filter((p, i, arr) => p?.id && !myIds.has(p.id) && arr.findIndex((x) => x.id === p.id) === i);
  const savedList = Object.values(savedProducts || {}).filter((p) => p?.id && p.name);
  const pctFor = (p) => { if (!quizAnswers) return null; const d = scoreFor(p, quizAnswers); return d?.percent > 0 && (d.matchStatus || 'scored') === 'scored' ? shownMatchPercent(d.percent) : null; };
  const hasAnything = currentProducts.length > 0 || sections.some((s) => s.picks?.length);

  const checkin = <section className="ayna-home-today ay-eco-checkin"><div><h2>Monthly check-in</h2><p>A few quick questions so your matches keep up with how you feel.</p></div><button type="button" onClick={onOpenMonthlyCheckin}>Start</button></section>;

  const careBlock = careFirst && seed && <section className="ay-care-first" aria-labelledby="ay-care-first-title">
    <p className="ay-care-first__eyebrow">Care first</p>
    <h2 id="ay-care-first-title">Reach a clinician first</h2>
    {notes.map((n) => <p key={n}>{n}</p>)}
    <CareLinks care={seed.care} limit={5} />
  </section>;

  // Calm care note: one combined sentence, placed after her first shelf. The
  // life-stage note moves to "For you" as a clearer card (see lifeStageFix).
  const clash = lifeStageClash(careFlags);
  const careLines = summarizeCareNotes(clash && careFlags ? { ...careFlags, notes: (careFlags.notes || []).filter((n) => n.code !== STAGE_NOTE_CODE) } : careFlags);
  const careShelfKey = sections.find((s) => s.shelf?.care)?.key;
  const careHref = firstCareLink(seed?.care)?.href;
  const findCare = careShelfKey
    ? () => {
      const el = document.querySelector(`#ayna-area-${CSS.escape(careShelfKey)} .ay-shelf-care`);
      if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
    : undefined;
  const careBanner = !careFirst && careLines.length > 0 && <CareNote className="ay-care-banner" lines={careLines} prominent={Boolean(careFlags?.careProminent)} onFindCare={findCare} findCareHref={findCare ? undefined : careHref} />;

  // "For you": the small things that are not shelves, behind one row that opens a sheet.
  const forYou = [];
  if (clash && !gone.has(clash.key)) forYou.push({ key: clash.key, short: 'Check your life stages', node: <section className="eco-app-card is-stages" aria-labelledby="eco-app-stages">
    <p className="eco-app-card__tab">Needs a quick check</p>
    <h3 id="eco-app-stages">Check your life stages</h3>
    <p><b>{clash.picked}</b> {clash.why} {clash.effect}</p>
    <div className="eco-app-card__acts">
      <button type="button" className="eco-app-go" onClick={() => { setSheet(false); (onFixLifeStages || onRetake)?.(); }}>Update life stages</button>
      <button type="button" className="eco-app-quiet" onClick={() => dismiss(clash.key)}>Not now</button>
    </div>
  </section> });
  if (onRetake && !quizDraft && remainingOptional > 0 && onPersonalize && !gone.has('personal')) forYou.push({ key: 'personal', short: 'Make my matches more personal', node: <section className="eco-app-card is-quiz" aria-labelledby="ay-nudge-title">
    <h3 id="ay-nudge-title">Make my matches more personal</h3>
    <p>{remainingOptional} quick question{remainingOptional === 1 ? '' : 's'}, all optional. It opens at the first one you have not answered.</p>
    <div className="eco-app-card__acts">
      <button type="button" className="eco-app-go" onClick={() => { setSheet(false); onPersonalize(); }}>Answer</button>
      <button type="button" className="eco-app-quiet" onClick={() => { setSheet(false); onRetake(); }}>Change my earlier answers</button>
    </div>
    <button type="button" className="eco-app-x" onClick={() => dismiss('personal')} aria-label="Hide this card"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
  </section> });
  const newsKey = news ? `ann:${news.title}` : '';
  if (news && !gone.has(newsKey)) forYou.push({ key: newsKey, short: news.title, node: <section className="eco-app-card is-news" aria-labelledby="eco-app-news">
    <p className="eco-app-card__tab">New from ayna</p>
    <h3 id="eco-app-news">{news.title}</h3>
    {onGoCommunity && <div className="eco-app-card__acts"><button type="button" className="eco-app-quiet" onClick={() => { setSheet(false); onGoCommunity(); }}>Read it in Community <span aria-hidden="true">→</span></button></div>}
    <button type="button" className="eco-app-x" onClick={() => dismiss(newsKey)} aria-label="Hide this announcement"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
  </section> });

  // Search and shelf chips (Products view): filter the shelves in place.
  const q = query.trim().toLowerCase();
  const hit = (p) => !q || [p.name, p.brand, p.category].some((v) => String(v || '').toLowerCase().includes(q));
  const chipSections = sections.filter((sct) => sct.products.length || sct.picks?.length);
  const activeChip = chipSections.some((sct) => sct.key === chip) ? chip : 'all';
  const visibleSections = sections
    .filter((sct) => activeChip === 'all' || sct.key === activeChip)
    .map((sct) => (q ? { ...sct, products: sct.products.filter(hit), picks: (sct.picks || []).filter(hit) } : sct))
    .filter((sct) => !q || sct.products.length || sct.picks.length);
  const matchCount = q ? visibleSections.reduce((n, sct) => n + sct.products.length, 0) : 0;
  const anyMatch = !q || visibleSections.length > 0;

  // The page's one primary action: this month's check-in when it is due. It
  // lives in the summary card with "For you", not in a bar floating over the
  // shelves (walkthrough P1-15: the dock covered shelf names and dashboard
  // text). Ask ayna stays in the header, so it is not repeated here.
  const checkinLabel = `Check in for ${new Date().toLocaleString('en-US', { month: 'long' })}`;
  const showCheckin = Boolean(checkinDue && onOpenMonthlyCheckin);
  const forYouButton = forYou.length > 0 && <button type="button" className="eco-app-foryou" aria-haspopup="dialog" onClick={() => setSheet(true)}>
    <span className="eco-app-foryou__count" aria-hidden="true">{forYou.length}</span>For you<span className="sr-only"> ({forYou.length})</span>
  </button>;
  const chev = <svg className="eco-app-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>;
  const showTabs = Boolean(onEcoTab);

  return <div ref={rootRef} className={`ayna-fresh-ecosystem ayna-cabinet-home eco-app${careFirst ? ' is-care-first' : ''}`}>
    {homeTop || <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onBack={onBack} onOpenSaved={onOpenSaved} onGoEco={() => {}} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />}

    {careBlock}

    <section className={`eco-app-hero${ecoTab === 'dashboard' && showTabs ? ' is-today' : ''}`} aria-labelledby="ayna-cabinet-title">
      <div className="eco-app-titlerow">
        <h1 id="ayna-cabinet-title" ref={titleRef}>My ecosystem</h1>
      </div>
      {ecoTab !== 'dashboard' && currentProducts.length > 0 && <form className="eco-app-search" role="search" onSubmit={(e) => { e.preventDefault(); if (q && !anyMatch) onBrowse?.(query.trim()); }}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your ecosystem" aria-label="Search your ecosystem" />
      </form>}
      {/* One progress card (counts, needs covered, Wrapped) in place of the ring: the shelf counts live on the chips below. */}
      {/* Summary card: real counts, needs covered, Wrapped (no stamp: QA, Oct 27). */}
      {ecoTab !== 'dashboard' && myProducts.length > 0 && <div className="eco-app-stack">
        <span className="eco-app-stack__back" aria-hidden="true" />
        <div className="eco-app-stack__card">
          {/* Counted by utils/ecosystemCounts: the same numbers as Wrapped and the website. */}
          <p className="eco-app-stack__nums" aria-label="Your ecosystem at a glance"><span><b>{counts.products}</b>{counts.products === 1 ? 'product' : 'products'}</span></p>
          {counts.needs > 0 && <>
            <p className="eco-app-stack__needs"><b>{counts.needsCovered} of {counts.needs}</b> {counts.needs === 1 ? 'need' : 'needs'} covered</p>
            <span className="eco-app-stack__bar" role="progressbar" aria-label={needsCoveredLine(counts)} aria-valuemin={0} aria-valuemax={counts.needs} aria-valuenow={counts.needsCovered}><i style={{ width: `${Math.max(4, Math.round((counts.needsCovered / counts.needs) * 100))}%` }} /></span>
          </>}
          {showCheckin && <button type="button" className="eco-app-checkin" onClick={onOpenMonthlyCheckin}>{checkinLabel}</button>}
          {(onReplayStory || forYouButton) && <div className="eco-app-stack__row">
            {onReplayStory && <button type="button" className="eco-app-replay" onClick={onReplayStory}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>Replay your summary</button>}
            {forYouButton}
          </div>}
        </div>
      </div>}
      {ecoTab !== 'dashboard' && myProducts.length === 0 && forYouButton && <div className="eco-app-stack__row is-loose">{forYouButton}</div>}
      {/* Empty: one clear way in (the quiz), the Shop as the quiet second choice. */}
      {ecoTab !== 'dashboard' && !hasAnything && !quizDraft && (hasAnswers
        ? <EmptyState compact art="search" tone="pink" title="No strong matches yet" body="Nothing in the catalog fits your answers well enough yet. Change an answer, or browse Explore by need." actionLabel={onRetake ? 'Edit my answers' : undefined} onAction={onRetake} secondaryLabel="Explore products" onSecondary={() => onBrowse?.()} />
        // Name what is missing (You audit P3): with health data connected it is the products, not everything.
        : healthConnectedCount > 0
          ? <EmptyState compact art="search" tone="pink" title="No products yet" body="Your health data is connected. Answer a few short questions and your matches land here, grouped by need." actionLabel={onStartQuiz ? 'See my matches' : undefined} onAction={onStartQuiz} secondaryLabel="Explore products" onSecondary={() => onBrowse?.()} />
          : <EmptyState compact art="search" tone="pink" title="Nothing here yet" body="Answer a few short questions and your matches land here, grouped by need." actionLabel={onStartQuiz ? 'See my matches' : undefined} onAction={onStartQuiz} secondaryLabel="Explore products" onSecondary={() => onBrowse?.()} />)}
      {/* An unfinished quiz stays in view; everything else waits in "For you". */}
      {ecoTab !== 'dashboard' && quizDraft && onResumeQuiz && <FinishQuizCard progress={quizDraft} onContinue={onResumeQuiz} onStartOver={onStartOverQuiz} />}
      {ecosystemNotice && <p className="ayna-cabinet-notice" role="status">{ecosystemNotice}</p>}
    </section>

    {showTabs && <div className="eco-seg" role="group" aria-label="Ecosystem view" data-on={ecoTab === 'dashboard' ? 'dashboard' : 'products'}>
      <span className="eco-seg__thumb" aria-hidden="true" />
      {[['dashboard', 'Home'], ['products', 'Products']].map(([id, label]) => <button key={id} type="button" aria-pressed={ecoTab === id} className={ecoTab === id ? 'is-on' : ''} onClick={() => onEcoTab(id)}>{label}</button>)}
    </div>}

    {ecoTab === 'dashboard' && showTabs ? <div className="ay-eco-routine">
      {/* The dashboard tab is part of ayna Pro (founder, PR #87). */}
      <ProFeatureGate feature="dashboard" onEcosystem={() => onEcoTab?.('products')}>
      <HealthDashboard authUser={authUser} selectedNeedIds={goalIds} hormonalBC={usesHormonalBC(quizAnswers)} products={myProducts} routineProducts={myProducts.filter((product) => !routineExcluded[product.id])} routineOutcomes={routineOutcomes} matches={suggestedEcosystemProducts} onOpenProduct={onOpenProduct} onConnect={onConnectHealth} onAddGoal={onAddGoal} onOpenRoutine={myProducts.length ? () => routineRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }) : undefined} onOpenCheckin={showCheckin ? onOpenMonthlyCheckin : undefined} onSignIn={() => onRequireAuth?.('health data')} quizAnswers={quizAnswers} onEditAnswers={onEditIntakeStep || onRetake} onSaveToProfile={onUpdateIntake || null} rundown={{ matchOpts, saved: Object.values(savedProducts || {}), onToggleSaved, onWhyMatch: onOpenWhyMatch, onOpenRead: (id) => { const a = articles.find((x) => x.id === id); if (a) onOpenArticle?.(a); }, onExplore: onBrowse ? () => onBrowse() : undefined }} />
      {myProducts.length > 0 && <div ref={routineRef} className="ay-eco-plan" id="ay-eco-plan">
        <Routine products={myProducts} insights={healthInsights} needIds={goalIds} outcomes={routineOutcomes} onLogOutcome={onLogRoutineOutcome} onOpenProduct={onOpenProduct} budget={budgetMax(quizAnswers)} excluded={routineExcluded} onToggleExcluded={onToggleRoutineProduct} />
        <ShoppingList products={myProducts} insights={healthInsights} excluded={routineExcluded} have={routineHave} onToggleHave={onToggleHave} onOpenProduct={onOpenProduct} onSavePlaylist={onSavePlaylist} onOpenPlaylist={onOpenPlaylist} budget={budgetMax(quizAnswers)} onRequireAuth={onRequireAuth} />
      </div>}
      {onOpenMonthlyCheckin && checkin}
      </ProFeatureGate>
    </div> : <>
    {hasAnything && <div className="eco-views" role="tablist" aria-label="Ecosystem lists">
      {[['mine', 'Mine', currentProducts.length], ['picks', 'ayna picks', picksForYou.length], ['saved', 'Saved', savedList.length], ['routine', 'Routine', null]].map(([id, label, n]) => (
        <button key={id} type="button" role="tab" aria-selected={view === id} className={view === id ? 'is-on' : ''} onClick={() => { setView(id); setChip('all'); }}>{label}{n != null && n > 0 && <small>{n}</small>}</button>
      ))}
    </div>}

    {view === 'picks' && <section className="eco-list" aria-label="ayna picks for you">
      {picksForYou.length ? <ul>{picksForYou.map((p) => <NameRow key={p.id} product={p} pct={pctFor(p)} onOpen={onOpenProduct} actionLabel="Add" onAction={onAddToEcosystem} done={myIds.has(p.id)} />)}</ul>
        : <p className="eco-list__empty">No new picks right now. <button type="button" onClick={() => onBrowse?.()}>Explore products</button></p>}
    </section>}
    {view === 'saved' && <section className="eco-list" aria-label="Saved products">
      {savedList.length ? <ul>{savedList.map((p) => <NameRow key={p.id} product={p} pct={pctFor(p)} onOpen={onOpenProduct} actionLabel="Add" onAction={onAddToEcosystem} done={myIds.has(p.id)} />)}</ul>
        : <p className="eco-list__empty">Tap the heart on any product to save it here.</p>}
    </section>}
    {view === 'routine' && <>
      {/* Glance first: the day timeline with her products by when she uses them; the full plans fold away. */}
      <div className="eco-list"><RoutineTimeline compact {...routineSource} max={3} ecoMax={6} onOpenProduct={onOpenProduct} onCheckIn={openCheckIn} /></div>
      <details className="eco-more">
        <summary>Full routines, when to use each product and your shopping list</summary>
      {routines.routines.length > 0 && <div className="ay-eco-routines" style={{ padding: '0 var(--d-gutter, 20px)' }}><NeedRoutines state={routines} variant="app" onOpenProduct={onOpenProduct} onCheckIn={openCheckIn} /></div>}
      {myProducts.length > 0 && <div className="ay-eco-plan" id="ay-eco-plan">
        <Routine folded products={myProducts} insights={healthInsights} needIds={goalIds} outcomes={routineOutcomes} onLogOutcome={onLogRoutineOutcome} onOpenProduct={onOpenProduct} budget={budgetMax(quizAnswers)} excluded={routineExcluded} onToggleExcluded={onToggleRoutineProduct} />
        <ShoppingList products={myProducts} insights={healthInsights} excluded={routineExcluded} have={routineHave} onToggleHave={onToggleHave} onOpenProduct={onOpenProduct} onSavePlaylist={onSavePlaylist} onOpenPlaylist={onOpenPlaylist} budget={budgetMax(quizAnswers)} onRequireAuth={onRequireAuth} />
      </div>}
      </details>
    </>}

    {(view === 'mine' || !hasAnything) && <>
    {chipSections.length > 1 && !q && <div className="eco-app-chips" role="group" aria-label="Show a shelf">
      <button type="button" aria-pressed={activeChip === 'all'} onClick={() => setChip('all')}>All</button>
      {chipSections.map((sct) => <button key={sct.key} type="button" aria-pressed={activeChip === sct.key} onClick={() => setChip(activeChip === sct.key ? 'all' : sct.key)}><i style={{ background: toneFor(sct) }} aria-hidden="true" />{shortNeedLabel(sct.label)}<small>{sct.products.length || sct.picks?.length || 0}</small></button>)}
    </div>}
    {q && <p className="eco-app-found" role="status">{anyMatch ? `${matchCount} in your ecosystem` : 'Nothing in your ecosystem matches.'}{' '}<button type="button" onClick={() => onBrowse?.(query.trim())}>Search the Shop for “{query.trim()}”</button></p>}
    {careFirst && hasAnything && <p className="ay-care-first__after">Products, when you are ready</p>}

    <div className={careFirst ? 'ay-eco-secondary' : undefined}>
      {visibleSections.map((section) => {
        const { shelf } = section;
        const empty = section.products.length === 0 && !(section.picks?.length);
        const shown = section.products.length ? section.products : section.picks || [];
        const grid = activeChip !== 'all' && !q;
        const tone = toneFor(section);
        return <section key={section.key} id={`ayna-area-${section.key}`} className={`ay-shelf2 eco-app-shelf${empty ? ' is-empty-shelf' : ''}${grid ? ' is-grid' : ''}`} style={{ '--area-tone': tone, '--area-ink': tone === '#3E2723' ? '#FFEDAC' : '#3E2723' }} aria-labelledby={`ayna-area-title-${section.key}`}>
          <div className="ay-shelf2-head">
            <h2 id={`ayna-area-title-${section.key}`}>{section.label}</h2>
            {shown.length > 0 && <span className="ay-shelf2-count" aria-label={`${shown.length} on this shelf`}>{shown.length}</span>}
            <button type="button" className="ay-shelf2-add" onClick={() => onBrowse?.(shortNeedLabel(section.label))} aria-label={`Add to ${section.label}`}>Add</button>
          </div>
          {shelf && shelf.shortBy > 0 && shelf.picks.length > 0 && <p className="ay-shelf2-note">{onlyNote(shelf.picks.length, section.phrase)}</p>}
          {empty && <div className="ay-shelf2-empty">
            <p>No strong matches for {section.phrase} yet.</p>
            <button type="button" onClick={() => onBrowse?.(shortNeedLabel(section.label))}>Explore {shortNeedLabel(section.label).toLowerCase()}</button>
          </div>}
          {!section.products.length && shown.length > 0 && <p className="ay-shelf2-note">Nothing here yet. <button type="button" className="eco-link" onClick={() => setView('picks')}>See {shown.length} ayna pick{shown.length === 1 ? '' : 's'}</button></p>}
          {section.products.length > 0 && <div className="ay-shelf2-row">{shown.map((product) => section.products.length
            ? <div className="ay-shelf2-pick eco-app-mine" key={product.id}><ProductCard product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={quizAnswers} matchOpts={matchOpts} needId={section.shelf?.needId} onOpenWhyMatch={onOpenWhyMatch} isSaved={!!savedProducts[product.id]} onToggleSaved={onToggleSaved} />
              {/* A living routine (You audit 12): "Day 12 · Is it working?" from the date she added it, to her daily log. */}
              {routineDay(product.addedAt) && openCheckIn && <button type="button" className="eco-app-working" onClick={openCheckIn}><span className="ayk-status is-quiet">Day {routineDay(product.addedAt)}</span>Is it working?</button>}</div>
            : <div className="ay-shelf2-pick" key={product.id}><ProductCard product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={quizAnswers} matchOpts={matchOpts} needId={section.shelf?.needId} onOpenWhyMatch={onOpenWhyMatch} /><button type="button" onClick={() => onAddToEcosystem?.(product)}><PlusIcon size={16} />{ADD_TO_ROUTINE}</button></div>)}
            <button type="button" className="ay-shelf2-slot" onClick={() => onBrowse?.(shortNeedLabel(section.label))} aria-label={`Find a product for ${section.label}`}><PlusIcon size={20} />Find one</button>
          </div>}
          {shelf?.care && !careFirst && <details className="ay-shelf-care"><summary>Care options for {section.phrase}</summary><CareLinks care={shelf.care} /></details>}
        </section>;
      }).flatMap((node, index) => (index === 0 ? [
        node,
        careBanner ? <div key="care-note" className="ay-carenote-slot">{careBanner}</div> : null,
        // How her health data shaped the order (or the invite to connect): after the first shelf, so shelves lead.
        seed ? <HealthShapedNote key="hsn" shaped={seed.healthShaped} userId={authUser?.id || null} onConnect={onConnectHealth || onOpenHealthData} className="ay-eco-hsn" /> : null,
      ].filter(Boolean) : [node]))}
      {visibleSections.length === 0 && seed && <HealthShapedNote shaped={seed.healthShaped} userId={authUser?.id || null} onConnect={onConnectHealth || onOpenHealthData} className="ay-eco-hsn" />}
      {visibleSections.length === 0 && careBanner}

    </div>
    {earlierProducts.length > 0 && <section className="ayna-cabinet-more" aria-label="Earlier picks"><details><summary>Earlier picks <span>{earlierProducts.length}</span></summary><p>Kept in your ecosystem outside your current shortlist.</p><ul className="eco-list__rows">{earlierProducts.map((product) => <NameRow key={product.id} product={product} pct={pctFor(product)} onOpen={onOpenProduct} />)}</ul></details></section>}
    </>}
    </>}

    {ecoTab !== 'dashboard' && relatedReads.length > 0 && <section className="ayna-cabinet-reads" aria-labelledby="ayna-cabinet-reads-title"><div className="ayna-cabinet-section-head"><h2 id="ayna-cabinet-reads-title">Read next</h2></div>{relatedReads.slice(0, 3).map((article) => <ArticleCard key={article.id} article={article} compact onClick={() => onOpenArticle?.(article)} />)}</section>}


    {/* Settings-style inset list: health, check-in, answers, reset. */}
    <section className="eco-app-list-wrap" aria-labelledby="ay-eco-manage-title">
      <h2 id="ay-eco-manage-title" className="eco-app-list-h">Manage your ecosystem</h2>
      <ul className="eco-app-list">
        {authUser && onOpenHealthData && ecoTab !== 'dashboard' && <li><button type="button" onClick={() => { if (onEcoTab) { onEcoTab('dashboard'); scrollToTabs(); } else onOpenHealthData(); }}>
          <span className="eco-app-list__ic is-pink" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg></span>
          <span className="eco-app-list__txt"><b>{healthConnectedCount ? 'Your health' : 'Bring in your health data'}</b><small>{healthSummary ? `${healthSummary.title}: ${healthSummary.headline}` : healthConnectedCount ? 'Your trends appear after about two weeks of data.' : 'Connect Apple Health, Oura or upload a file to see your trends.'}</small></span>{chev}
        </button></li>}
        {(ecoTab !== 'dashboard' || !myProducts.length) && onOpenMonthlyCheckin && <li><button type="button" onClick={onOpenMonthlyCheckin}>
          <span className="eco-app-list__ic is-butter" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10h16" /></svg></span>
          <span className="eco-app-list__txt"><b>Monthly check-in</b><small>A few quick questions so your matches keep up with how you feel.</small></span>{chev}
        </button></li>}
        {onRetake && <li><button type="button" onClick={onRetake}>
          <span className="eco-app-list__ic is-butter" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" /></svg></span>
          <span className="eco-app-list__txt"><b>Your quiz answers</b><small>Something changed? Update them anytime.</small></span>{chev}
        </button></li>}
        <li><button type="button" className="is-destructive" onClick={onRequestEcosystemReset}>
          <span className="eco-app-list__ic is-ink" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" /></svg></span>
          <span className="eco-app-list__txt"><b>Reset your ecosystem</b></span>
        </button></li>
      </ul>
    </section>
    <LegalFooter strip />

    {sheet && forYou.length > 0 && <div className="eco-app-sheet" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setSheet(false); }}>
      <div className="eco-app-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="eco-app-sheet-title">
        <span className="eco-app-sheet__grab" aria-hidden="true" />
        <div className="eco-app-sheet__head"><h2 id="eco-app-sheet-title">For you</h2><button type="button" className="eco-app-sheet__done" onClick={() => setSheet(false)} autoFocus>Done</button></div>
        <div className="eco-app-sheet__list">{forYou.map((it) => <div key={it.key} className="eco-app-sheet__item">{it.node}</div>)}</div>
      </div>
    </div>}
  </div>;
}
