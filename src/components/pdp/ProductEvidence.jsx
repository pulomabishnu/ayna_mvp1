import NEED_MAP_RESEARCH from '../../data/matching/needMap.research.js';
import { needPhrase } from '../../matching/ontology';
const RESEARCH_BY_PRODUCT = NEED_MAP_RESEARCH.reduce((m, r) => { if (!m.has(r.product)) m.set(r.product, []); m.get(r.product).push(r); return m; }, new Map());
import PLAIN from '../../data/matching/plainRationales.js';
const GRADE_WORDS = { A: 'Strong evidence', B: 'Some evidence', C: 'Limited evidence' };
import UrgentSigns from './UrgentSigns.jsx';
import PdpIcon from './PdpIcon.jsx';
import { urgentSignsFor } from '../../utils/urgentSigns';
import { splitSentences, stripLead, shortLine, splitNote } from './sentences';
import { isCredible } from './credible';
import { useApprovedResearch } from '../../utils/approvedResearch';
import React, { useEffect, useMemo, useState } from 'react';
import { getVerificationLinks, hostLabel } from '../../utils/verificationLinks';
import { humanPublisher } from './glance';
import { normalizeFdaStatus } from '../../utils/fdaStatus';
import { getPassport } from '../../data/passport';
import { fmtDate } from './fmtDate';
import { worksWith } from '../../utils/aynaIntegrations';
import { researchSourceCount } from './commerce';
import GlossaryTerm from '../GlossaryTerm';
import { findHardTerms, planGlossaryTerms } from '../../data/glossary';
import ProductCommunityReviews from './ProductCommunityReviews.jsx';
import PdpTabs from './PdpTabs.jsx';
import { useProductReviews } from './useProductReviews.js';
import { summarizeReviewRows, takeProductTab } from '../../utils/community/reviewRatings.js';

// Clinical opinion and Scientific literature cite credible sources only:
// government and public-health agencies, peer-reviewed journals and indexes,
// medical societies and academic medical centers. Anything else (brand sites,
// retailers, magazines, health blogs, court dockets) stays in the All sources
// index under Product details, never in these two sections.

/**
 * The research the team wrote for each product, in the order people look for
 * it: Clinical opinion, Scientific literature, Reviews, Safety. All four are
 * always on the page, stacked, one card style, with a sticky jump bar. Each
 * field shows once. Long text shows its short version first, then "Read
 * more". The curated words are not rewritten; only em dashes become commas.
 */

const noDash = (t) => String(t || '').replace(/\s*—\s*/g, ', ').replace(/^,\s*/, '').trim();
const meaningful = (v) => { const t = String(v || '').trim(); return t && !/^(n\/?a|none|not applicable|unknown|not on file)\.?$/i.test(t) ? t : ''; };
const sentences = (t) => splitSentences(t);
const PLATFORM = { reddit: 'Reddit', tiktok: 'TikTok', youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook', wikipedia: 'Wikipedia', amazon: 'Amazon', walmart: 'Walmart', wirecutter: 'Wirecutter', instyle: 'InStyle', press: 'Press' };
const HOST_NAMES = [[/amzn\.|amazon\./i, 'Amazon'], [/reddit\./i, 'Reddit'], [/tiktok\./i, 'TikTok'], [/youtube\.|youtu\.be/i, 'YouTube'], [/instagram\./i, 'Instagram'], [/facebook\./i, 'Facebook'], [/walmart\./i, 'Walmart'], [/target\./i, 'Target'], [/ulta\./i, 'Ulta'], [/sephora\./i, 'Sephora'], [/nytimes\.com\/wirecutter|wirecutter/i, 'Wirecutter']];

function sourceName(url, brand, platform) {
  let host = '';
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { return PLATFORM[platform] || ''; }
  for (const [re, name] of HOST_NAMES) if (re.test(host)) return name;
  const slug = String(brand || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (slug.length >= 3 && host.replace(/[^a-z0-9]/g, '').includes(slug)) return `${brand} site`;
  if (platform && PLATFORM[platform]) return PLATFORM[platform];
  return humanPublisher(host) || hostLabel(url) || host;
}

function collect(entries, brand) {
  const seen = new Set();
  const out = [];
  entries.forEach((e) => {
    const url = e && (e.url || e.href);
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push({ url, title: noDash(e.title || e.text || e.label || sourceName(url, brand)), summary: e.summary ? noDash(e.summary) : '', why: e.justification ? noDash(e.justification) : '', year: e.year || '', publisher: sourceName(url, brand, e.platform) });
  });
  return out;
}

/** "PubMed: Tampons and..." → "Tampons and..." when the publisher already says PubMed. */
function cleanTitle(title, publisher) {
  const m = String(title || '').match(/^([^:]{2,28}):\s+(.{8,})$/);
  if (!m) return title;
  const k = (t) => String(t || '').toLowerCase().replace(/[^a-z]/g, '');
  const pre = k(m[1]); const pub = k(publisher);
  const rest = m[2].charAt(0).toUpperCase() + m[2].slice(1);
  return pre && pub && (pub.includes(pre) || pre.includes(pub) || /^(nih|nihpmc|pmc|pubmed|fda|cdc|acog|who)$/.test(pre)) ? rest : title;
}

function Links({ items, label, compact = false }) {
  // Long lists show the first two, then "See all".
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  // Every source is in the page from the start (search engines index it); the rest are hidden until "See all".
  const folded = !all && items.length > 3;
  return (
    <div className={`ay-src${compact ? ' is-compact' : ''}`}>
      {label && <h4 className="ay-src__h">{label}{items.length > 3 ? ` (${items.length})` : ''}</h4>}
      <ul>
        {items.map((s, i) => (
          <li key={s.url} hidden={folded && i >= 2}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="ay-src__card">
              <span className="ay-src__text">
                <span className="ay-src__pub">{[s.publisher, s.year].filter(Boolean).join(', ')}</span>
                <span className="ay-src__title">{cleanTitle(s.title, s.publisher)}</span>
                {!compact && s.summary && <span className="ay-src__sum">{s.summary}</span>}
                {!compact && s.why && <span className="ay-src__why">Why it’s here: {s.why}</span>}
              </span>
              <span className="ay-src__go" aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
      {items.length > 3 && <button type="button" className="ay-ev__morebtn" aria-expanded={all} onClick={() => setAll((v) => !v)}>{all ? 'Show fewer' : `See all ${items.length} sources`}</button>}
    </div>
  );
}

/** What kind of source a study is, only when its own title or summary says so. */
const STUDY_TYPES = [[/meta-analys/i, 'Meta-analysis'], [/systematic review|\breview\b/i, 'Review'], [/randomi[sz]ed|controlled trial|\btrial\b/i, 'Trial'], [/guideline|committee opinion|practice bulletin|position statement/i, 'Guideline'], [/cohort|case-control|cross-sectional|observational/i, 'Observational study']];
function studyType(s) {
  const t = `${s.title || ''} ${s.summary || ''}`;
  const hit = STUDY_TYPES.find(([re]) => re.test(t));
  return hit ? hit[1] : '';
}

/** Each source as its own card: who said it, what it is, the finding in plain words, and a link (the whole card opens it). */
function SourceCards({ items, label, kind = 'source', fold = 6 }) {
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  const folded = !all && items.length > fold;
  return (
    <div className="ay-pt-group">
      {label && <h3 className="ay-pt-group__h">{label}</h3>}
      <ul className="ay-pt-cards">
        {items.map((s, i) => {
          const pub = s.publisher || hostLabel(s.url);
          const meta = [kind === 'study' ? studyType(s) : '', s.year].filter(Boolean).join(', ');
          return (
            <li key={s.url} className="ay-pt-card is-link" hidden={folded && i >= fold}>
              <p className="ay-pt-card__src"><b>{pub}</b>{meta && <span>{meta}</span>}</p>
              <h4 className="ay-pt-card__title">{cleanTitle(s.title, s.publisher)}</h4>
              {s.summary && <p className="ay-pt-card__text">{s.summary}</p>}
              {s.why && <p className="ay-pt-card__why">Why it’s here: {s.why}</p>}
              <a className="ay-pt-card__go" href={s.url} target="_blank" rel="noopener noreferrer">Read the source<span aria-hidden="true"> ↗</span><span className="sr-only">: {cleanTitle(s.title, s.publisher)} (opens in a new tab)</span></a>
            </li>
          );
        })}
      </ul>
      {items.length > fold && <button type="button" className="ay-ev__morebtn" aria-expanded={all} onClick={() => setAll((v) => !v)}>{all ? 'Show fewer' : `See all ${items.length}`}</button>}
    </div>
  );
}

/** A section's parts, one after another: the first needs no title, the rest get a short one. */
function SubTabs({ items, empty = null, foot = null }) {
  const list = items.filter(Boolean);
  if (!list.length) return empty;
  return (
    <>
      {list.map((x, i) => (
        <div key={x.id} className={`ay-part is-${x.id}`}>
          {i > 0 && <h3 className="ay-part__h">{x.label}</h3>}
          {x.node}
        </div>
      ))}
      {foot}
    </>
  );
}

/** Hard words get a dotted underline and a definition (first time on the page only, at most 8). */
function withTerms(text, plan) {
  const allowed = plan && plan[text];
  if (!allowed || !allowed.length) return text;
  const out = [];
  let at = 0;
  const left = new Set(allowed);
  for (const hit of findHardTerms(text)) {
    if (!left.has(hit.entry.term)) continue;
    left.delete(hit.entry.term);
    if (hit.index > at) out.push(text.slice(at, hit.index));
    out.push(<GlossaryTerm key={`${hit.index}-${hit.text}`} term={hit.entry.term}>{hit.text}</GlossaryTerm>);
    at = hit.index + hit.length;
  }
  if (!out.length) return text;
  if (at < text.length) out.push(text.slice(at));
  return out;
}
const TermsCtx = React.createContext(null);
// Inside an open evidence row: the row's own summary line, so the body never repeats it.
const LeadCtx = React.createContext('');
const paraList = (text, lead) => String(text || '').split(/\n{2,}/).map((p) => stripLead(p.trim(), lead)).filter(Boolean);
function Paras({ text }) {
  const used = React.useContext(TermsCtx);
  const lead = React.useContext(LeadCtx);
  return paraList(text, lead).map((p) => <p key={p.slice(0, 48)} className="ay-ev__body">{withTerms(p, used)}</p>);
}

/**
 * Short version first; the full text one tap away (it replaces the short one).
 * Both are in the page from the start, so the full text is indexed and
 * nothing is fetched on tap.
 */
function ShortThenFull({ short, full }) {
  const [open, setOpen] = useState(false);
  const id = React.useId();
  const rowLead = React.useContext(LeadCtx);
  const lead = short || sentences(full).slice(0, 2).join(' ');
  if (!full || full.length <= lead.length + 40) return <Paras text={full || lead} />;
  // The row already shows the whole short version: only the full note is left, one tap away.
  if (!paraList(lead, rowLead).length) {
    return (
      <div className="ay-ev__stf">
        <div id={id} hidden={!open}><Paras text={full} /></div>
        <button type="button" className="ay-ev__morebtn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>{open ? 'Show less' : 'Read the full note'}</button>
      </div>
    );
  }
  return (
    <div className="ay-ev__stf">
      <div hidden={open}><Paras text={lead} /></div>
      <div id={id} hidden={!open}><Paras text={full} /></div>
      <button type="button" className="ay-ev__morebtn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>{open ? 'Show less' : 'Read the full note'}</button>
    </div>
  );
}

/** A team-written summary, unless it just repeats the main text. */
function extraSummary(text, main) {
  const t = noDash(meaningful(text));
  // A named doctor we can't trace to a source stays off the page until the team confirms it.
  if (!t || /\bDr\.\s+[A-Z][a-z]+/.test(t)) return '';
  const words = (x) => new Set(String(x || '').toLowerCase().match(/[a-z]{4,}/g) || []);
  const tw = words(t); const mw = words(main);
  let hit = 0; tw.forEach((x) => { if (mw.has(x)) hit += 1; });
  return tw.size && hit / tw.size >= 0.7 ? '' : t;
}

function plural(n, one, many = `${one}s`) { return `${n} ${n === 1 ? one : many}`; }

function useEvidence(product, aynaData) {
  return useMemo(() => {
    if (!product) return null;
    const brand = product.brand || '';
    const pp = getPassport(product);
    const independent = product.clinicianOpinionSource !== 'brand';
    const clinicalLinks = collect([...(product.doctorOpinionCitations || []), ...getVerificationLinks(product, 'doctor'), ...(product.researchClinicalSources || [])], brand).filter((l) => isCredible(l.url));
    const ingredients = (product.ingredientScience || []).filter((i) => i?.name).map((i) => ({
      name: noDash(i.name), text: noDash(i.text), links: collect((i.citations || []).map((c) => ({ ...c, title: c.label })), brand).filter((l) => isCredible(l.url)),
    }));
    const ingredientUrls = new Set(ingredients.flatMap((i) => i.links.map((l) => l.url)));
    const studies = collect([...getVerificationLinks(product, 'scientific'), ...(product.scientificCitations || []), ...(product.researchScienceSources || [])], brand).filter((s) => !ingredientUrls.has(s.url) && isCredible(s.url));
    const community = collect([
      ...(product.communityReviewSourceUrl ? [{ url: product.communityReviewSourceUrl, text: product.communityReviewSourceLabel }] : []),
      ...getVerificationLinks(product, 'community'),
    ], brand);
    // A star rating the brand publishes about itself: shown, and labelled as such.
    const brandRatingText = [product.safety?.opinionAlerts, product.ratingNote, product.communityReview].join(' ');
    // "4.6 out of 5 stars from 119 reviews" first: the older pattern alone read the "5" of "out of 5" as the rating.
    const br = brandRatingText.match(/(?<![\d.])(\d(?:\.\d{1,2})?)\s+out of\s+5\s+stars?[^.]{0,40}?(?:across|from|of)\s+([\d,]+)\s+(?:verified\s+)?reviews/i)
      || brandRatingText.match(/(\d(?:\.\d)?)[-\s]?star[^.]{0,40}?(?:across|from|of)\s+([\d,]+)\s+(?:verified\s+)?reviews/i);
    const brandRating = br ? { value: br[1], count: br[2] } : null;
    // Safety, each fact once.
    const warnings = (product.warnings || []).map(noDash).filter(Boolean);
    const warnText = warnings.join(' ').toLowerCase();
    const preg = pp?.safety?.pregnancy;
    const pregValue = preg?.known && !preg.notApplicable ? noDash(Array.isArray(preg.value) ? preg.value.join(', ') : String(preg.value || '')) : '';
    const sideEffects = sentences(noDash(meaningful(product.safety?.sideEffects)))
      .filter((s) => !/full warnings are (listed|shown) (below|above)/i.test(s))
      .filter((s) => {
        // Drop a sentence the warnings already say, even in other words.
        const words = (t) => new Set(String(t).toLowerCase().match(/[a-z]{4,}/g) || []);
        const sw = words(s);
        if (!sw.size) return true;
        return !warnings.some((w) => { const ww = words(w); let hit = 0; sw.forEach((x) => { if (ww.has(x)) hit += 1; }); return hit / sw.size >= 0.85; });
      })
      .join(' ');
    const fdaRaw = noDash(meaningful(product.safety?.fdaStatus));
    const fda = normalizeFdaStatus(product.safety?.fdaStatus);
    const allergens = noDash(meaningful(product.safety?.allergens));
    const safetyLinks = collect((product.safetyNoteSources || []).map((s) => ({ ...s, title: s.label })), brand);
    return {
      brand, independent, pp,
      aynaSummary: noDash(meaningful(String(product.summary || '').replace(/\s*\(see [^()]+\)/i, ''))),
      aynaDetail: noDash(meaningful(product.recommendationWhyDetail)),
      evidenceStrength: noDash(meaningful(product.evidenceStrength)),
      clinician: noDash(meaningful(product.doctorOpinion)),
      clinicianShort: noDash(meaningful(product.doctorOpinionShort)),
      attribution: noDash(meaningful(product.clinicianAttribution)),
      clinicalLinks,
      bottomLine: noDash(meaningful(product.effectiveness)),
      ingredients, studies,
      productSpecific: Boolean(pp?.evidence?.product_specific),
      communityText: noDash(meaningful(product.communityReview)),
      memberReviews: (aynaData?.reviews || []).map((r) => noDash(r?.text)).filter(Boolean).slice(0, 3),
      community, brandRating,
      warnings,
      pregnancy: pregValue && !/pregnan/i.test(warnText) ? pregValue : '',
      sideEffects, fdaRaw, fda, allergens, safetyLinks,
      avoidIf: (product.avoidIfSensitivity || []).map((t) => String(t).replace(/[-_]/g, ' ')),
      isDigital: product.type === 'digital',
      privacy: product.privacy && typeof product.privacy === 'object' ? product.privacy : null,
      badges: (product.badges || []).map(noDash).filter(Boolean),
      thingsRaised: noDash(meaningful(String(product.safety?.opinionAlerts || '').replace(/^⚠️?\s*/, ''))),
      ratingNote: noDash(meaningful(product.ratingNote)),
      userRating: product.userRating && product.userRatingSourceUrl ? { value: product.userRating, url: product.userRatingSourceUrl } : null,
      who: (product.whoItsFor || []).map(noDash).filter(Boolean),
      how: product.howToUse?.steps?.length ? { intro: noDash(product.howToUse.intro), steps: product.howToUse.steps.map(noDash).filter(Boolean), url: product.howToUse.sourceUrl || '', label: noDash(product.howToUse.sourceLabel || '') } : null,
      platform: noDash(meaningful(product.platform)),
      integrations: (product.integrations || []).map((x) => noDash(typeof x === 'string' ? x : x?.name)).filter(Boolean),
      ingredientsText: noDash(meaningful(product.ingredients)),
      materials: noDash(meaningful(product.safety?.materials)),
      ingredientNote: noDash(meaningful(product.ingredientScienceNote)),
      priceNote: noDash(meaningful(product.priceNote)),
      clinicalNote: noDash(meaningful(product.clinicalNote)),
      clinicalSummary: extraSummary(product.verificationLinks?.doctor?.aiSummary, product.doctorOpinion),
      scienceSummary: extraSummary(product.verificationLinks?.scientific?.aiSummary, product.effectiveness),
      communitySummary: extraSummary(product.verificationLinks?.community?.aiSummary, product.communityReview),
      faq: /^https:\/\//.test(String(product.faqUrl || '')) ? product.faqUrl : '',
      incentivized: (product.incentivizedReviewSites || []).filter((x) => x?.site).map((x) => `${noDash(x.site)}${x.source ? ` (per ${noDash(x.source)})` : ''}`),
      inStock: Object.entries(product.whereToBuyInStock || {}).filter(([, v]) => v).map(([k]) => k),
    };
  }, [product, aynaData]);
}

// Retail and brand pages are where to buy, not reviews: they stay off the Reviews tab.
const RETAIL = /amzn\.|amazon\.|walmart\.|target\.com|cvs\.com|walgreens\.|ulta\.|sephora\./i;

// A sentence that is the brand describing itself, not evidence ("Formulated by board-certified OB/GYNs").
const BRAND_CLAIM = /\b(formulated|developed|designed|created) (by|with)\b|\bdoctor[- ]approved\b|\b(dermatologist|gynecologist|ob\/?gyn)[- ](tested|approved|recommended)\b|\bpositioned by the brand\b|\bthe brand (says|states|claims|reports)\b|\baccording to (the )?brand\b/i;
const STUDY_WORDS = /\bstud(y|ies)\b|\btrial\b|\bmeta-analysis\b|\bevidence\b|\bresearch\b|\bjournal\b/i;
/** Splits text into what the brand says about itself and everything else. */
function splitBrandClaims(text) {
  const brand = []; const rest = [];
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const end = (t) => (/[.!?]$/.test(t) ? t : `${t}.`);
  sentences(text).forEach((x) => {
    if (!BRAND_CLAIM.test(x)) { rest.push(x); return; }
    // "Formulated by OB/GYNs to ...; each ingredient has research ..." holds both: split at the semicolon.
    const parts = x.split(/;\s+/);
    parts.forEach((part) => (BRAND_CLAIM.test(part) && !STUDY_WORDS.test(part) ? brand : rest).push(end(cap(part.trim()))));
  });
  return { brand: brand.join(' '), rest: rest.join(' ') };
}
/** "FDA: Menstrual Cups" → publisher FDA, title Menstrual Cups. */
function labelParts(label) {
  const m = String(label || '').match(/^([^:]{2,40}):\s+(.+)$/);
  return m ? { publisher: m[1].trim(), title: m[2].trim() } : { publisher: '', title: String(label || '').trim() };
}

/** The key line of a band: its first sentence, kept whole unless very long. */
const takeaway = (t) => shortLine(noDash(String(t || '')), 220);

const TAB_IDS = ['clinical', 'literature', 'reviews', 'safety', 'how-to-use', 'details'];

/** A small icon for a how-to step, only when the step's own words make it obvious. */
function stepIcon(text) {
  const t = String(text || '').toLowerCase();
  if (/\b(wash|rinse|clean|boil|steriliz|sanitiz)/.test(t)) return 'drop';
  if (/\bhours?\b/.test(t)) return 'clock';
  if (/\b(remove|take (it )?out|empty|pull)/.test(t)) return 'out';
  if (/\b(insert|apply|dab|fold|place|put)/.test(t)) return 'in';
  return '';
}

export default function ProductEvidence({ product: baseProduct, safetyLead = '', glance = null, aynaData = null, aynaRating: aynaRatingProp = null, ratingCount: ratingCountProp = 0, rateControls = null, safety = null, recall = null, heroLine = '', extraRows = [], onOpenReview = null }) {
  // Research the team approved in /admin/research fills any empty section.
  const product = useApprovedResearch(baseProduct);
  const d = useEvidence(product, aynaData);
  const works = worksWith(product);
  // Community reviews of this product, live: the average and count below are
  // worked out from these rows, so an edited or deleted review updates them.
  const reviewRows = useProductReviews(baseProduct?.id);
  const liveStats = reviewRows.length ? summarizeReviewRows(reviewRows)[baseProduct?.id] : null;
  const aynaRating = liveStats ? liveStats.average : aynaRatingProp;
  const ratingCount = liveStats ? liveStats.count : ratingCountProp;
  // Phones (<= 760px): every section folds to a one-line row with its takeaway,
  // one open at a time (Baymard: collapsed sections suit long mobile pages when
  // the summary shows). Desktop keeps everything open with the sticky nav.
  const PHONE = '(max-width: 760px)';
  const [isPhone, setIsPhone] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(PHONE).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia(PHONE);
    const on = () => setIsPhone(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  const [secOpen, setSecOpen] = useState(null);
  const [ingPick, setIngPick] = useState(0);
  // The chosen tab ('' = the first one there is). The URL hash names it (#clinical), so tabs can be linked to.
  const [tab, setTab] = useState(() => {
    if (typeof window === 'undefined') return '';
    const h = window.location.hash.slice(1);
    return TAB_IDS.includes(h) ? h : '';
  });
  const scrollToTabs = () => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const el = document.getElementById('ay-pt');
      if (!el) return;
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }));
  };
  const chooseTab = (id) => {
    setTab(id);
    try { window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${id}`); } catch { /* sandboxed */ }
  };
  const SECTION_IDS = ['overview', 'inside'];
  // Old row ids still used by other parts of the page map onto the tabs.
  const TAB_ALIAS = { science: 'literature', evidence: 'evidence', how: 'how-to-use', details: 'safety', sources: 'details' };
  const goTo = (raw) => {
    const id = TAB_ALIAS[raw] || raw;
    if (SECTION_IDS.includes(id)) {
      setSecOpen(id);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        document.getElementById(`ay-ps-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
      return;
    }
    if (id !== 'evidence') chooseTab(id);
    scrollToTabs();
  };
  useEffect(() => {
    // A product card's star line opens the page straight on Reviews.
    if (takeProductTab() === 'reviews') goTo('reviews');
    // Opened from a link with a tab in it (#literature): bring the tabs into view.
    else if (TAB_IDS.includes(window.location.hash.slice(1))) scrollToTabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    // "All safety info" under Buy, the star rating above the name and the glance rows open the matching tab.
    const on = (e) => goTo(!e.detail ? 'safety' : e.detail);
    const onHash = () => { const h = window.location.hash.slice(1); if (TAB_IDS.includes(h)) { setTab(h); scrollToTabs(); } };
    window.addEventListener('ay-open-tab', on);
    window.addEventListener('hashchange', onHash);
    return () => { window.removeEventListener('ay-open-tab', on); window.removeEventListener('hashchange', onHash); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!d) return null;

  const brandSlug = String(d.brand).toLowerCase().replace(/[^a-z0-9]/g, '');
  const onlineLinks = d.community.filter((l) => { let h = ''; try { h = new URL(l.url).hostname; } catch { return false; } return !RETAIL.test(h) && !(brandSlug.length >= 3 && h.replace(/[^a-z0-9]/g, '').includes(brandSlug)); });
  const helps = glance?.who?.helps || [];
  // Retailer lists are off the page (team call, Oct 16: buying goes through ayna); apps keep 'Where to get it'.
  const facts = (glance?.facts || []).filter((f) => !f.unknown && !['inside', 'fda'].includes(f.id) && !(f.id === 'where' && !d.isDigital));
  const allSources = glance?.sources || [];

  // A one-line "Holds 30 mL. Up to 12 hours." is specs, not science: it goes in Details.
  const bottomIsSpecs = Boolean(d.bottomLine) && d.bottomLine.length < 160 && !/stud|trial|evidence|research|review|shown|found|data|clinical/i.test(d.bottomLine);
  // The brand describing itself goes in Details as "What the brand says", not in the research.
  const science = bottomIsSpecs ? { brand: '', rest: '' } : splitBrandClaims(d.bottomLine);
  const brandSays = science.brand;
  // The line under the product name is the summary's first sentence: the rest is "What it is".
  const summaryText = (() => {
    const full = d.aynaSummary || '';
    // Whatever the line under the product name didn't already say.
    const shown = String(heroLine || '').replace(/…$/, '').trim();
    let body = full;
    if (shown && full.startsWith(shown)) body = full.slice(shown.length).trim();
    else if (shown && full.trim() === shown) body = '';
    return [body, d.aynaDetail].filter(Boolean).join('\n\n');
  })();
  // A safety note (a lawsuit, a warning) belongs in Safety; the brand's star rating shows once, under Reviews.
  const thingsRaised = (() => {
    let t = d.thingsRaised;
    if (!t || !glance?.alert) return t;
    const w = (x) => new Set(String(x).toLowerCase().match(/[a-z]{4,}/g) || []);
    const a = w(glance.alert); const tw = w(t); let hit = 0; tw.forEach((x) => { if (a.has(x)) hit += 1; });
    return tw.size && hit / tw.size >= 0.5 ? '' : t;
  })();
  // The rating is said once, as a number: drop sentences that only repeat it.
  const communityText = d.brandRating ? sentences(d.communityText).filter((x) => !(x.includes(d.brandRating.value) && x.includes(d.brandRating.count))).join(' ') : d.communityText;
  const showMaterials = Boolean(d.materials) && !/^various|^varies/i.test(d.materials) && d.materials.trim().toLowerCase() !== String(d.ingredientsText || '').trim().toLowerCase();
  const hasRows = bottomIsSpecs || facts.length > 0 || extraRows.some((r) => r && r.value) || d.priceNote || d.inStock.length > 0;

  // Ratings from ayna members: a 5-bar breakdown once there are 6 or more (Baymard).
  const graded = (RESEARCH_BY_PRODUCT.get(baseProduct?.id) || []).slice().sort((x, y) => (x.strength === 'none') - (y.strength === 'none') || x.grade.localeCompare(y.grade));
  const histogram = liveStats?.histogram || aynaData?.histogram || null;
  const memberRatingCount = histogram ? Object.values(histogram).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
  const breakdown = memberRatingCount >= 6 ? [5, 4, 3, 2, 1].map((n) => ({ n, c: Number(histogram[n]) || 0 })) : null;
  const ratingLine = aynaRating != null && ratingCount > 0
    ? <p className="ay-ev__rating"><b>★ {aynaRating.toFixed(1)}</b> from {plural(ratingCount, 'ayna member review')}</p>
    : d.brandRating ? <p className="ay-ev__rating"><b>★ {d.brandRating.value}</b> from {d.brandRating.count} reviews <span className="ay-ev2__badge is-brand">Brand-reported, not verified by ayna</span></p>
      : d.userRating ? <p className="ay-ev__rating"><b>★ {d.userRating.value}</b> <a href={d.userRating.url} target="_blank" rel="noopener noreferrer">online rating<span aria-hidden="true"> ↗</span></a></p> : null;

  // Each hard word is underlined once on the whole page, where it first appears (max 8).
  const paras = (t) => String(t || '').split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const plan = planGlossaryTerms([
    ...paras(summaryText), ...d.who,
    ...paras(d.clinicianShort || sentences(d.clinician).slice(0, 2).join(' ')), ...paras(d.clinician), ...paras(d.clinicalNote), ...paras(thingsRaised), ...paras(d.clinicalSummary),
    ...paras(science.rest), ...paras(d.scienceSummary), ...d.ingredients.map((i) => i.text),
    ...paras(communityText), ...paras(d.communitySummary),
  ].map((t) => ({ key: t, text: t })), 8);

  const howLinks = d.how ? [
    d.faq && { url: d.faq, title: `${d.brand || 'The brand'}’s FAQ`, publisher: sourceName(d.faq, d.brand) },
    d.how.url && (() => { const lp = labelParts(d.how.label); return { url: d.how.url, title: lp.title || `${d.brand || 'The brand'}’s instructions`, publisher: lp.publisher || sourceName(d.how.url, d.brand) }; })(),
  ].filter(Boolean) : [];

  const sections = [
    summaryText && { id: 'what', label: 'What it is', body: <ShortThenFull full={summaryText} /> },
    (d.who.length || helps.length || d.avoidIf.length || works.items.length) && { id: 'who', label: 'Who it’s for', body: <>
      {d.who.length > 0 && <ul className="ay-tabs__list">{d.who.map((w) => <li key={w}>{withTerms(w, plan)}</li>)}</ul>}
      {helps.length > 0 && <p className="ay-ev__by"><b>Helps with:</b> {helps.join(', ')}</p>}
      {d.avoidIf.length > 0 && <p className="ay-ev__by"><b>Skip it if you react to:</b> {d.avoidIf.join(', ')}</p>}
      {works.items.length > 0 && <p className="ay-ev__by"><b>Works with:</b> {works.items.map((t, i) => <React.Fragment key={t}>{i > 0 && ', '}{t === 'ayna' && works.ayna ? <a href="/health-data" title={`Connect ${works.ayna.name} in Health data`}>ayna</a> : t}</React.Fragment>)}</p>}
    </> },
    (d.clinician || d.clinicalNote || thingsRaised || d.clinicalLinks.length) && { id: 'clinical', label: 'Clinical opinion', body: <>
      {(d.clinician || d.clinicalNote || d.attribution) && (
        <div className="ay-pt-text">
          {d.clinician && <ShortThenFull short={d.clinicianShort} full={d.clinician} />}
          {d.clinicalNote && <ShortThenFull full={d.clinicalNote} />}
          {(d.attribution || d.clinicalNote) && <p className="ay-ev__by">{[d.attribution, d.clinicalNote && 'The added context comes from the clinical guidance in the sources below.'].filter(Boolean).join(' ')}</p>}
        </div>
      )}
      {thingsRaised && <div className="ay-pt-callout"><h3 className="ay-pt-callout__h">ayna’s note</h3><ShortThenFull full={thingsRaised} /></div>}
      {d.clinicalSummary && <div className="ay-pt-text"><ShortThenFull full={d.clinicalSummary} /></div>}
      <SourceCards items={d.clinicalLinks} label="What clinicians and health bodies say" />
    </> },
    (graded.length || science.rest || d.scienceSummary || d.studies.length) && { id: 'science', label: 'Scientific literature', body: <>
      {(science.rest || d.scienceSummary) && (
        <div className="ay-pt-text">
          {science.rest && <ShortThenFull full={science.rest} />}
          {d.scienceSummary && <ShortThenFull full={d.scienceSummary} />}
        </div>
      )}
      {/* Ingredients have their own section (What's inside and why it works). */}
      <SourceCards items={d.studies} kind="study" label="Studies and reviews" />
      {graded.length > 0 && (
        <div className="ay-pt-group">
          <h3 className="ay-pt-group__h">ayna’s evidence check</h3>
          <ul className="ay-pt-cards">
            {graded.map((g) => {
              let pub = '';
              try { pub = humanPublisher(new URL(g.source_url).hostname.replace(/^www\./, '')) || hostLabel(g.source_url); } catch { pub = hostLabel(g.source_url); }
              return (
                <li key={g.need} className="ay-pt-card">
                  <p className="ay-pt-card__src"><span className={`ay-pt-grade is-${g.strength === 'none' ? 'none' : g.grade.toLowerCase()}`}>{g.strength === 'none' ? 'Not a fit' : GRADE_WORDS[g.grade]}</span></p>
                  <h4 className="ay-pt-card__title">{needPhrase(g.need).replace(/^./, (c) => c.toUpperCase())}</h4>
                  <p className="ay-pt-card__text">{noDash(PLAIN[`${g.product}|${g.need}`] || g.rationale)}</p>
                  {g.source_url && <a className="ay-pt-card__go" href={g.source_url} target="_blank" rel="noopener noreferrer">Source: {pub}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a>}
                </li>
              );
            })}
          </ul>
          <p className="ay-ev__by">Graded from clinical guidelines, systematic reviews and government health sources. Strong means guidelines back this kind of product for this need; limited means little or no good evidence.</p>
        </div>
      )}
    </> },
    // Same test ProductSafety uses, so an empty Safety section never shows.
    safety && (glance?.alert || d.warnings.length || d.pregnancy || d.fdaRaw || d.sideEffects || d.allergens || d.avoidIf.length || (!d.isDigital && recall && recall.status !== 'unknown')) && { id: 'safety', label: 'Safety', body: safety },
    { id: 'reviews', label: 'Reviews', body: <>
      {/* The rating itself is the panel's first line; here only what that line can't say. */}
      {!(aynaRating != null && ratingCount > 0) && d.brandRating && <p className="ay-ev__by"><span className="ay-ev2__badge is-brand">Brand-reported, not verified by ayna</span></p>}
      {!(aynaRating != null && ratingCount > 0) && !d.brandRating && ratingLine}
      {breakdown && (
        <ul className="ay-ev__bars" aria-label="Ratings from ayna members">
          {breakdown.map((b) => <li key={b.n}><span>{b.n} ★</span><i><s style={{ width: `${Math.round((b.c / memberRatingCount) * 100)}%` }} /></i><span>{b.c}</span></li>)}
        </ul>
      )}
      {(communityText || d.communitySummary) && (
        <div className="ay-pt-text">
          {communityText && <ShortThenFull full={communityText} />}
          {d.communitySummary && <ShortThenFull full={d.communitySummary} />}
          {d.ratingNote && <p className="ay-ev__by">{d.ratingNote}</p>}
          {d.incentivized.length > 0 && <p className="ay-ev__by">Reviews on {d.incentivized.join(', ')} may include incentivized reviews.</p>}
          <p className="ay-ev__by">Online reviews and posts are people’s experiences, not clinical evidence.</p>
        </div>
      )}
      {!(communityText || d.communitySummary) && (d.ratingNote || d.incentivized.length > 0) && (
        <div className="ay-pt-text">
          {d.ratingNote && <p className="ay-ev__by">{d.ratingNote}</p>}
          {d.incentivized.length > 0 && <p className="ay-ev__by">Reviews on {d.incentivized.join(', ')} may include incentivized reviews.</p>}
        </div>
      )}
      <div className="ay-pt-reviews"><ProductCommunityReviews productId={baseProduct?.id} rows={reviewRows} onOpenReview={onOpenReview} initial={4} /></div>
      {d.memberReviews.length > 0 && (
        <div className="ay-pt-group">
          <h3 className="ay-pt-group__h">From ayna members</h3>
          <ul className="ay-pt-cards">{d.memberReviews.map((r) => <li key={r.slice(0, 40)} className="ay-pt-card"><blockquote className="ay-pt-card__quote">{r}</blockquote></li>)}</ul>
        </div>
      )}
      {rateControls}
      <Links items={[...onlineLinks, ...(d.brand ? [{ url: `https://www.trustpilot.com/search?query=${encodeURIComponent(d.brand)}`, title: `${d.brand} on Trustpilot`, publisher: 'Trustpilot' }] : [])]} label="Read more reviews online" />
    </> },
    d.how && { id: 'how', label: 'How to use', body: <>
      {d.how.intro && <Paras text={d.how.intro} />}
      <ol className="ay-tabs__steps ay-ps-timeline">{d.how.steps.map((st, i) => { const ic = stepIcon(st); return <li key={st}><b aria-hidden="true">{i + 1}</b><span>{ic && <PdpIcon name={ic} size={20} className="ay-ps-timeline__ico" />}{st}</span></li>; })}</ol>
      <Links items={howLinks} label="Source" compact />
    </> },
    (d.ingredientsText || showMaterials || hasRows || brandSays || d.badges.length || d.evidenceStrength) && { id: 'details', label: 'Details', body: <>
      {(d.ingredientsText || showMaterials) && <>
        <h3 className="ay-part__h is-first">{d.isDigital ? 'What’s included' : 'What’s in it'}</h3>
        {d.ingredientsText && <>{showMaterials && <h4 className="ay-ev2__sub">{d.isDigital ? 'Included' : 'Ingredients'}</h4>}<p className="ay-ev__body ay-pd__pre">{d.ingredientsText}</p></>}
        {showMaterials && <>{d.ingredientsText && <h4 className="ay-ev2__sub">Materials</h4>}<p className="ay-ev__body">{d.materials}</p></>}
      </>}
      {hasRows && <>
        <h3 className="ay-part__h">Size and price</h3>
        <dl className="ay-pd__rows">
          {facts.map((f) => <div key={f.id}><dt>{f.label}</dt><dd>{f.value}{f.note ? <small>{fmtDate(f.note)}</small> : null}</dd></div>)}
          {extraRows.filter((r) => r && r.value).map((r) => <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}
          {bottomIsSpecs && <div><dt>Specs</dt><dd>{d.bottomLine}</dd></div>}
          {d.priceNote && <div><dt>Price note</dt><dd>{d.priceNote}</dd></div>}
          {d.inStock.length > 0 && <div><dt>In stock at</dt><dd>{d.inStock.join(', ')}</dd></div>}
        </dl>
      </>}
      {(brandSays || d.badges.length > 0) && <>
        <h3 className="ay-part__h">What the brand says</h3>
        {brandSays && <p className="ay-ev__body">{brandSays}</p>}
        {d.badges.length > 0 && <p className="ay-ev__body">{d.badges.join(', ')}</p>}
        <p className="ay-ev__by">The brand’s own claims, labels and awards. Not checked by ayna.</p>
      </>}
      {d.evidenceStrength && <p className="ay-ev__by">Evidence level on file: {d.evidenceStrength}</p>}
    </> },
    // "What we don't know yet" is no longer shown (team call, Oct 16): it sent people off the site.
    allSources.length > 0 && { id: 'sources', label: 'Sources', body: <>
      <Links items={allSources.map((x) => ({ url: x.url, title: noDash(x.title), publisher: x.publisher, year: x.year }))} compact />
    </> },
  ].filter(Boolean);

  const byId = Object.fromEntries(sections.map((x) => [x.id, x]));
  const researchCount = researchSourceCount(baseProduct);
  const SAFE_TIP = /^(wash|rinse|boil|clean|store|keep it|dry|sanitize|sterili[sz]e|empty)\b/i;
  const safetyLine = takeaway(safetyLead || glance?.alert || d.warnings.find((w) => !SAFE_TIP.test(w)) || d.warnings[0] || d.sideEffects || (d.fdaRaw && `FDA status: ${d.fda?.label || d.fdaRaw}.`));
  const topGrade = graded.find((g) => g.strength !== 'none');
  const gradeLine = topGrade ? `${GRADE_WORDS[topGrade.grade]} for ${needPhrase(topGrade.need)}.` : '';
  const researchLine = takeaway(science.rest || d.scienceSummary) || gradeLine || (researchCount ? `${plural(researchCount, 'research source')} on file. Open it to read them.` : '');
  const clinicalLine = takeaway(d.clinicianShort || d.clinician || d.clinicalNote || d.clinicalSummary);
  const howLine = d.how ? takeaway(d.how.intro && !/:\s*$/.test(d.how.intro) ? d.how.intro : d.how.steps[0]) : '';

  // At a glance: fact tiles from the record only (never "Not on file").
  const factOf = (id) => (glance?.facts || []).find((f) => f.id === id && !f.unknown && f.value);
  const howText = d.how ? [d.how.intro, ...d.how.steps].filter(Boolean).join(' ') : '';
  const wear = howText.match(/\b(?:up to|every|for up to|for)\s+\d+(?:\s*(?:to|-|–)\s*\d+)?\s*hours?\b/i);
  const tiles = [
    factOf('format') && { id: 'format', icon: 'format', label: 'Format', value: noDash(factOf('format').value) },
    factOf('size') && String(factOf('size').value).length <= 60 && { id: 'size', icon: 'size', label: 'Size or count', value: noDash(factOf('size').value) },
    factOf('fsa')?.value === 'Eligible' && { id: 'fsa', icon: 'card', label: 'FSA/HSA', value: 'Eligible' },
    factOf('perunit') && { id: 'perunit', icon: 'tag', label: 'Price per unit', value: noDash(factOf('perunit').value) },
    wear && { id: 'wear', icon: 'clock', label: 'From the instructions', value: wear[0].replace(/^./, (c) => c.toUpperCase()), jump: 'how' },
  ].filter(Boolean).slice(0, 4).map((t) => {
    // A short bold value, and its detail on a small line: "60 capsules" + "1 daily, or 2 before sex";
    // "Intimate Care · cream" becomes "Cream" + "Intimate Care".
    const cap = (x) => String(x || '').replace(/^./, (c) => c.toUpperCase());
    const dot = String(t.value).split(/\s+·\s+/);
    if (dot.length > 1) return { ...t, main: cap(dot[dot.length - 1]), note: cap(dot.slice(0, -1).join(', ')) };
    const sp = splitNote(t.value);
    return { ...t, main: sp.value, note: cap(sp.note) };
  });

  // Evidence strength on a three-step scale, from ayna's own grade (or the level on file).
  const level = topGrade ? ({ A: 3, B: 2, C: 1 })[topGrade.grade] || 0
    : /strong/i.test(d.evidenceStrength) ? 3 : /moderate|some/i.test(d.evidenceStrength) ? 2 : /limited|weak|low|insufficient/i.test(d.evidenceStrength) ? 1 : 0;
  const levelWord = ['', 'Limited evidence', 'Some evidence', 'Strong evidence'][level];
  const levelFor = topGrade ? `for ${needPhrase(topGrade.need)}` : '';
  // The sources on file, grouped by kind and counted.
  const MIX = [
    { id: 'research', icon: 'paper', one: 'study or review', many: 'studies and reviews', types: ['product_study', 'ingredient_research'] },
    { id: 'clinical', icon: 'stethoscope', one: 'clinical guideline', many: 'clinical guidelines', types: ['clinical_guideline', 'expert_guidance'] },
    { id: 'regulatory', icon: 'regulator', one: 'regulator page', many: 'regulator pages', types: ['regulatory'] },
    { id: 'community', icon: 'community', one: 'community source', many: 'community sources', types: ['community'] },
  ];
  const mix = MIX.map((m) => ({ ...m, n: allSources.filter((x) => m.types.includes(x.type)).length })).filter((m) => m.n > 0);

  const ing = d.ingredients[Math.min(ingPick, Math.max(d.ingredients.length - 1, 0))];
  const hasWho = d.who.length > 0 || helps.length > 0 || d.avoidIf.length > 0 || d.platform || d.integrations.length > 0;
  const whoLine = d.who[0] ? noDash(d.who[0]) : helps.length ? `Helps with ${helps.join(', ').toLowerCase()}.` : '';
  const reviewLine = aynaRating != null && ratingCount > 0 ? `★ ${aynaRating.toFixed(1)} from ${plural(ratingCount, 'ayna member review')}.`
    : d.brandRating ? `★ ${d.brandRating.value} from ${d.brandRating.count} reviews, as reported by the brand.`
      : takeaway(communityText || d.communitySummary) || 'No reviews yet. Tried it? Be the first.';
  const hasReviews = Boolean(ratingLine || reviewRows.length || communityText || d.communitySummary || d.memberReviews.length || onlineLinks.length || rateControls);
  const detailsLine = allSources.length ? `What's in it, size and price, and all ${plural(allSources.length, 'source')} we checked.` : 'What it is made of, size and price.';
  // The tabs, in the order people look for them. A tab shows only when it has something real in it.
  const tabs = [
    byId.clinical && { id: 'clinical', label: 'Clinical opinion', lead: clinicalLine, body: byId.clinical.body },
    byId.science && { id: 'literature', label: 'Scientific literature', lead: researchLine, body: byId.science.body },
    hasReviews && { id: 'reviews', label: 'Reviews', count: aynaRating != null && ratingCount > 0 ? ratingCount : 0, lead: reviewLine, body: byId.reviews.body },
    byId.safety && { id: 'safety', label: 'Safety', lead: safetyLine, body: byId.safety.body },
    byId.how && { id: 'how-to-use', label: 'How to use', lead: howLine, body: <div className="ay-pt-flow">{byId.how.body}</div> },
    (byId.details || byId.sources) && { id: 'details', label: 'Details', lead: detailsLine, body: <div className="ay-pt-flow">
      {byId.details?.body}
      {byId.sources && <><h3 className="ay-part__h">Sources{allSources.length ? ` (${allSources.length})` : ''}</h3>{byId.sources.body}</>}
    </div> },
  ].filter(Boolean).map((t) => ({ ...t, lead: t.lead || '', body: <LeadCtx.Provider value={t.lead || ''}>{t.body}</LeadCtx.Provider> }));
  const activeTab = tabs.some((t) => t.id === tab) ? tab : (tabs[0]?.id || '');

  const fold = { isPhone, secOpen, onOpen: goTo, onClose: () => setSecOpen(null) };

  return (
    <TermsCtx.Provider value={plan}>
    <div id="ay-tabs" className="ay-ps">
      <section className="ay-ps-glance" aria-labelledby="ay-ps-glance-h">
        <h2 id="ay-ps-glance-h" className="ay-ps-glance__h">At a glance</h2>
        <div className="ay-ps-glance__grid">
          {(level > 0 || mix.length > 0) && (
            <button type="button" className="ay-ps-ev" onClick={() => goTo(tabs.some((t) => t.id === 'literature') ? 'literature' : 'evidence')}>
              {level > 0 && <>
                <span className="ay-ps-ev__word">{levelWord}</span>
                {levelFor && <span className="ay-ps-ev__for">{levelFor.replace(/^./, (c) => c.toUpperCase())}</span>}
                <span className="ay-ps-scale" role="img" aria-label={`${levelWord}, ${level} of 3`}>
                  {[1, 2, 3].map((n) => <i key={n} className={n <= level ? 'is-on' : undefined} />)}
                </span>
                <span className="ay-ps-scale__ends" aria-hidden="true"><span>Limited</span><span>Some</span><span>Strong</span></span>
              </>}
              {mix.length > 0 && (
                <span className="ay-ps-mix">
                  {mix.map((m) => <span key={m.id} className="ay-ps-mix__item"><PdpIcon name={m.icon} size={20} /><b>{m.n}</b> {m.n === 1 ? m.one : m.many}</span>)}
                </span>
              )}
              <span className="ay-ps-glance__go">See the evidence <PdpIcon name="arrow" size={18} /></span>
            </button>
          )}
          <ul className="ay-ps-gl">
            {whoLine && <li><button type="button" onClick={() => goTo('overview')}><PdpIcon name="person" /><span><small>Who it’s for</small>{whoLine}</span></button></li>}
            {safetyLine && byId.safety && <li className="is-safety"><button type="button" onClick={() => goTo('safety')}><PdpIcon name="shield" /><span><small>Safety</small>{safetyLine}</span></button></li>}
            {howLine && byId.how && <li><button type="button" onClick={() => goTo('how-to-use')}><PdpIcon name="steps" /><span><small>How to use</small>{howLine}</span></button></li>}
          </ul>
          {tiles.length > 0 && (
            <ul className="ay-ps-tiles">
              {tiles.map((t) => (
                <li key={t.id}>
                  <PdpIcon name={t.icon} />
                  <span className="ay-ps-tiles__text">
                    <small>{t.label}</small>
                    <b>{t.main}</b>
                    {t.note && <span className="ay-ps-tiles__note">{t.note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {tabs.length > 0 && (
        <section id="ay-pt" className="ay-pt" aria-labelledby="ay-pt-h">
          <h2 id="ay-pt-h" className="sr-only">Evidence, reviews and details</h2>
          <PdpTabs tabs={tabs} active={activeTab} onChange={chooseTab} labelId="ay-pt-h" />
        </section>
      )}

      <Sec fold={fold} id="overview" title="What it is" line={takeaway(summaryText) || whoLine}>
        <div className={`ay-ps-about${summaryText ? '' : ' is-solo'}`}>
          {summaryText && (
            <div className="ay-ps-about__text">
              {byId.what.body}
            </div>
          )}
          {summaryText && <LineArt />}
        </div>
        {hasWho && (
          <div className="ay-ps-for">
            <h3>This is for you if</h3>
            <div className="ay-ps-for__list">
              {d.who.length > 0 && <ul className="ay-ps-stars">{d.who.map((w) => <li key={w}>{withTerms(w, plan)}</li>)}</ul>}
              {helps.length > 0 && <p className="ay-ev__by"><b>Helps with:</b> {helps.join(', ')}</p>}
              {d.avoidIf.length > 0 && <p className="ay-ev__by"><b>Skip it if you react to:</b> {d.avoidIf.join(', ')}</p>}
              {(d.platform || d.integrations.length > 0) && <p className="ay-ev__by"><b>Works with:</b> {[d.platform, ...d.integrations].filter(Boolean).join(', ')}</p>}
            </div>
          </div>
        )}
      </Sec>

      {d.ingredients.length > 0 && (
        <Sec fold={fold} id="inside" title="What’s inside and why it works" line={d.ingredients.slice(0, 4).map((x) => x.name).join(', ') + (d.ingredients.length > 4 ? ` and ${d.ingredients.length - 4} more` : '')}>
          <p className="ay-ps-sub">Tap an ingredient to see what it does and where that comes from.</p>
          <ul className="ay-ps-chips">
            {d.ingredients.map((x, i) => (
              <li key={x.name}>
                <button type="button" aria-pressed={i === ingPick} aria-controls="ay-ps-ing" className={i === ingPick ? 'is-on' : undefined} onClick={() => setIngPick(i)}>{x.name}</button>
              </li>
            ))}
          </ul>
          {ing && (
            <div id="ay-ps-ing" className="ay-ps-ing" aria-live="polite">
              <h3>{ing.name}</h3>
              {ing.text ? <p>{withTerms(ing.text, plan)}</p> : <p>No explanation on file yet.</p>}
              {ing.links.length > 0 && <Links items={ing.links} label={ing.links.length === 1 ? 'Source' : 'Sources'} compact />}
            </div>
          )}
          {d.ingredientNote && <p className="ay-ev__by">{d.ingredientNote}</p>}
        </Sec>
      )}

    </div>
    </TermsCtx.Provider>
  );
}

// One section: a plain heading on desktop; on phones a one-line row (title, takeaway, chevron).
function Sec({ id, title, line, children, fold }) {
  const { isPhone, secOpen, onOpen, onClose } = fold;
  const folded = isPhone && secOpen !== id;
  return (
    <section id={`ay-ps-${id}`} className={`ay-ps-sec${isPhone ? ' is-fold' : ''}${folded ? '' : ' is-open'}`} aria-labelledby={`ay-ps-${id}-h`}>
      {isPhone ? (
        <h2 id={`ay-ps-${id}-h`} className="ay-ps-fold">
          <button type="button" aria-expanded={!folded} aria-controls={`ay-ps-${id}-body`} onClick={() => { if (folded) onOpen(id); else onClose(); }}>
            <span className="ay-ps-fold__main"><span className="ay-ps-fold__title">{title}</span>{line && <span className="ay-ps-fold__line">{shortLine(line)}</span>}</span>
            <PdpIcon name="chevron" className="ay-ps-fold__chev" />
          </button>
        </h2>
      ) : <h2 id={`ay-ps-${id}-h`} className="ay-ps-h">{title}</h2>}
      <div id={`ay-ps-${id}-body`} className="ay-ps-secbody" hidden={folded}>{children}</div>
    </section>
  );
}


/** A small line drawing beside "What it is" (decoration only). */
function LineArt() {
  return (
    <svg className="ay-ps-art" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <circle cx="100" cy="100" r="78" className="ay-ps-art__sun" />
      <path d="M100 168c0-38 0-70 0-96" />
      <path d="M100 120c-22-4-40-20-44-46 26 2 42 20 44 46Z" />
      <path d="M100 98c20-6 36-22 38-46-24 4-38 22-38 46Z" />
      <path d="M100 150c-14-2-26-12-30-28 18 2 28 12 30 28Z" />
      <path d="M62 170h76" />
    </svg>
  );
}

export function ProductSafety({ product, recall = null, alertText = '', glance = null }) {
  const d = useEvidence(product, null);
  if (!d) return null;
  const showRecall = !d.isDigital && recall && recall.status !== 'unknown';
  const urgent = urgentSignsFor(product);
  if (!(alertText || d.warnings.length || d.pregnancy || d.fdaRaw || d.sideEffects || d.allergens || d.avoidIf.length || showRecall || urgent.length)) return null;
  // The note above often tells the same story as the recall line: say it once.
  const recallFull = showRecall ? noDash(recall.detail || recall.label || '') : '';
  const words = (t) => new Set(String(t).toLowerCase().match(/[a-z]{4,}/g) || []);
  const rw = words(recallFull); const aw = words(alertText);
  let hit = 0; rw.forEach((x) => { if (aw.has(x)) hit += 1; });
  const recallText = rw.size && hit / rw.size >= 0.4 ? (/no recall/i.test(recallFull) ? 'No recall has been issued. The note above has the details.' : 'See the note above.') : recallFull;
  return (
    <div id="ay-sec-safety" className="ay-safety">
      {alertText && <div className="ay-safety__alert" role="note"><ShortThenFull full={noDash(alertText)} /></div>}
      {/* Warnings that send her to a clinician first get their own short list. */}
      {(() => {
        const DOC = /\b(doctor|provider|clinician|gyn(a)?ecologist|ob\/?gyn|physician|pharmacist|midwife|lactation|consult|talk to|ask your)\b/i;
        const doc = [...(d.pregnancy && DOC.test(d.pregnancy) ? [`Pregnancy: ${d.pregnancy}`] : []), ...d.warnings.filter((w) => DOC.test(w))];
        const rest = [...(d.pregnancy && !DOC.test(d.pregnancy) ? [`Pregnancy: ${d.pregnancy}`] : []), ...d.warnings.filter((w) => !DOC.test(w))];
        return <>
          {doc.length > 0 && <div className="ay-ps-doc"><h4><PdpIcon name="stethoscope" size={20} />Check with a clinician first</h4><ul>{doc.map((w) => <li key={w}>{w}</li>)}</ul></div>}
          {rest.length > 0 && <ul className="ay-safety__list">{rest.map((w) => <li key={w}>{w}</li>)}</ul>}
        </>;
      })()}
      <dl className="ay-pd__rows">
        {!d.isDigital && d.fdaRaw && <div><dt>FDA status</dt><dd>{d.fda?.label ? <><b>{d.fda.label}.</b> </> : null}{fmtDate(d.fdaRaw)}</dd></div>}
        {d.sideEffects && <div><dt>{d.isDigital ? 'Things to know' : 'Possible side effects'}</dt><dd>{d.sideEffects}</dd></div>}
        {d.allergens && <div><dt>Allergens</dt><dd>{d.allergens}</dd></div>}
        {/* The team's verified label checks (breastfeeding, medicines, fragrance, latex...). */}
        {(((glance?.sections || []).find((x) => x.id === 'safety')?.blocks || []).filter((b) => b.type === 'rows').flatMap((b) => b.rows || []))
          .filter((r) => r && !r.unknown && r.value && !/^(pregnancy|allergens|recalls|data storage|privacy)$/i.test(r.label) && !(/pregnan/i.test(r.label) && d.pregnancy === ''))
          .map((r) => <div key={r.label}><dt>{r.label}</dt><dd>{noDash(r.value)}</dd></div>)}
        {d.avoidIf.length > 0 && <div><dt>Skip if you react to</dt><dd>{d.avoidIf.join(', ')}</dd></div>}
        {showRecall && <div><dt>Recalls</dt><dd>{recall.status === 'none' ? 'No recalls found.' : recallText}</dd></div>}
        {d.privacy && meaningful(d.privacy.dataStorage) && <div><dt>Data storage</dt><dd>{noDash(d.privacy.dataStorage)}</dd></div>}
        {d.privacy && meaningful(d.privacy.keyPolicy) && <div><dt>Privacy</dt><dd>{noDash(d.privacy.keyPolicy)}</dd></div>}
        {d.privacy && typeof d.privacy.sellsData === 'string' && meaningful(d.privacy.sellsData) && <div><dt>Selling your data</dt><dd>{noDash(d.privacy.sellsData)}</dd></div>}
        {d.privacy && typeof d.privacy.hipaa === 'string' && meaningful(d.privacy.hipaa) && <div><dt>HIPAA and data rules</dt><dd>{noDash(d.privacy.hipaa)}</dd></div>}
      </dl>
      <UrgentSigns product={product} flags={urgent} />
      <Links items={d.safetyLinks} label={d.safetyLinks.length ? 'Sources' : ''} />
    </div>
  );
}

