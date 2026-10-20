import NEED_MAP_RESEARCH from '../../data/matching/needMap.research.js';
import { needPhrase } from '../../matching/ontology';
const RESEARCH_BY_PRODUCT = NEED_MAP_RESEARCH.reduce((m, r) => { if (!m.has(r.product)) m.set(r.product, []); m.get(r.product).push(r); return m; }, new Map());
import PLAIN from '../../data/matching/plainRationales.js';
const GRADE_WORDS = { A: 'Strong evidence', B: 'Some evidence', C: 'Limited evidence' };
import UrgentSigns from './UrgentSigns.jsx';
import { urgentSignsFor } from '../../utils/urgentSigns';
import { splitSentences } from './sentences';
import { isCredible } from './credible';
import { useApprovedResearch } from '../../utils/approvedResearch';
import React, { useEffect, useMemo, useState } from 'react';
import { getVerificationLinks, hostLabel } from '../../utils/verificationLinks';
import { humanPublisher } from './glance';
import { normalizeFdaStatus } from '../../utils/fdaStatus';
import { getPassport } from '../../data/passport';
import { fmtDate } from './fmtDate';
import { researchSourceCount } from './commerce';
import GlossaryTerm from '../GlossaryTerm';
import { findHardTerms, planGlossaryTerms } from '../../data/glossary';
import ProductCommunityReviews from './ProductCommunityReviews.jsx';
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
  if (!items.length) return null;
  return (
    <div className={`ay-src${compact ? ' is-compact' : ''}`}>
      {label && <h4 className="ay-src__h">{label}</h4>}
      <ul>
        {items.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="ay-src__card">
              <span className="ay-src__text">
                <span className="ay-src__pub">{[s.publisher, s.year].filter(Boolean).join(' · ')}</span>
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
function Paras({ text }) {
  const used = React.useContext(TermsCtx);
  return String(text).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => <p key={p.slice(0, 48)} className="ay-ev__body">{withTerms(p, used)}</p>);
}

/** Short version first; the full text one tap away (it replaces the short one, nothing is hidden). */
function ShortThenFull({ short, full }) {
  const [open, setOpen] = useState(false);
  const lead = short || sentences(full).slice(0, 2).join(' ');
  if (!full || full.length <= lead.length + 40) return <Paras text={full || lead} />;
  return (
    <div className="ay-ev__stf">
      <Paras text={open ? full : lead} />
      <button type="button" className="ay-ev__morebtn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? 'Show less' : 'Read more'}</button>
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
const takeaway = (t) => { const x = sentences(noDash(String(t || '')))[0] || ''; return x.length > 200 ? `${x.slice(0, 190).replace(/\s+\S*$/, '')}…` : x; };

export default function ProductEvidence({ product: baseProduct, image = '', safetyLead = '', glance = null, aynaData = null, aynaRating: aynaRatingProp = null, ratingCount: ratingCountProp = 0, rateControls = null, safety = null, recall = null, heroLine = '', extraRows = [], onOpenReview = null }) {
  // Research the team approved in /admin/research fills any empty section.
  const product = useApprovedResearch(baseProduct);
  const d = useEvidence(product, aynaData);
  // Community reviews of this product, live: the average and count below are
  // worked out from these rows, so an edited or deleted review updates them.
  const reviewRows = useProductReviews(baseProduct?.id);
  const liveStats = reviewRows.length ? summarizeReviewRows(reviewRows)[baseProduct?.id] : null;
  const aynaRating = liveStats ? liveStats.average : aynaRatingProp;
  const ratingCount = liveStats ? liveStats.count : ratingCountProp;
  // The evidence bands (clinicians, research, safety, how to use, details):
  // the first starts open, the key line of each is always visible in its row.
  const [open, setOpen] = useState(() => new Set(['clinical']));
  const [ingPick, setIngPick] = useState(0);
  const [activeNav, setActiveNav] = useState('overview');
  const goTo = (id) => {
    window.requestAnimationFrame(() => {
      const el = document.getElementById(`ay-ps-${id}`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };
  const openBand = (id) => {
    setOpen((cur) => new Set([...cur, id]));
    goTo(id);
  };
  useEffect(() => {
    // A product card's star line opens the page straight on Reviews.
    if (takeProductTab() === 'reviews') goTo('reviews');
  }, []);
  useEffect(() => {
    // "All safety info" under Buy (and the old tab ids) open the matching band.
    const on = (e) => {
      const id = e.detail === 'details' || !e.detail ? 'safety' : e.detail;
      if (['overview', 'inside', 'evidence', 'reviews'].includes(id)) goTo(id);
      else openBand(id);
    };
    window.addEventListener('ay-open-tab', on);
    return () => window.removeEventListener('ay-open-tab', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    // The pill nav fills the pill of the section being read: the last one whose top has passed the nav.
    let raf = 0;
    const update = () => {
      raf = 0;
      const nav = document.querySelector('.ay-ps-nav');
      const line = (nav ? nav.getBoundingClientRect().bottom : 0) + 24;
      let cur = 'overview';
      ['overview', 'inside', 'evidence', 'reviews'].forEach((id) => {
        const el = document.getElementById(`ay-ps-${id}`);
        if (el && el.getBoundingClientRect().top <= line) cur = id;
      });
      setActiveNav(cur);
    };
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', onScroll); if (raf) window.cancelAnimationFrame(raf); };
  }, [baseProduct?.id]);
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
    (d.who.length || helps.length || d.avoidIf.length || d.platform || d.integrations.length) && { id: 'who', label: 'Who it’s for', body: <>
      {d.who.length > 0 && <ul className="ay-tabs__list">{d.who.map((w) => <li key={w}>{withTerms(w, plan)}</li>)}</ul>}
      {helps.length > 0 && <p className="ay-ev__by"><b>Helps with:</b> {helps.join(', ')}</p>}
      {d.avoidIf.length > 0 && <p className="ay-ev__by"><b>Skip it if you react to:</b> {d.avoidIf.join(', ')}</p>}
      {(d.platform || d.integrations.length > 0) && <p className="ay-ev__by"><b>Works with:</b> {[d.platform, ...d.integrations].filter(Boolean).join(', ')}</p>}
    </> },
    (d.clinician || d.clinicalNote || thingsRaised || d.clinicalLinks.length) && { id: 'clinical', label: 'Clinical opinion', body: <>
      {d.clinician && <ShortThenFull short={d.clinicianShort} full={d.clinician} />}
      {d.clinicalNote && <ShortThenFull full={d.clinicalNote} />}
      {(d.attribution || d.clinicalNote) && <p className="ay-ev__by">{[d.attribution, d.clinicalNote && 'The added context comes from the clinical guidance under its sources.'].filter(Boolean).join(' ')}</p>}
      {thingsRaised && <><h3 className="ay-part__h">ayna’s note</h3><ShortThenFull full={thingsRaised} /></>}
      {d.clinicalSummary && <ShortThenFull full={d.clinicalSummary} />}
      <Links items={d.clinicalLinks} label="Sources" />
    </> },
    (graded.length || science.rest || d.scienceSummary || d.ingredients.length || d.studies.length) && { id: 'science', label: 'What the research says', body: <>
      {science.rest && <ShortThenFull full={science.rest} />}
      {d.scienceSummary && <ShortThenFull full={d.scienceSummary} />}
      {/* Ingredients have their own section (What's inside and why it works). */}
      {d.studies.length > 0 && <Links items={d.studies} label="Studies" />}
      {graded.length > 0 && <>
        <h3 className="ay-part__h">ayna’s evidence check</h3>
        <ul className="ay-ev2__grades">
          {graded.map((g) => (
            <li key={g.need}>
              <span className={`ay-ev2__grade is-${g.strength === 'none' ? 'none' : g.grade.toLowerCase()}`}>{g.strength === 'none' ? 'Not a fit' : GRADE_WORDS[g.grade]}</span>
              <span><b>{needPhrase(g.need).replace(/^./, (c) => c.toUpperCase())}.</b> {noDash(PLAIN[`${g.product}|${g.need}`] || g.rationale)} <a href={g.source_url} target="_blank" rel="noopener noreferrer">Source: {humanPublisher(new URL(g.source_url).hostname.replace(/^www\./, '')) || hostLabel(g.source_url)}</a></span>
            </li>
          ))}
        </ul>
        <p className="ay-ev__by">Graded from clinical guidelines, systematic reviews and government health sources. Strong means guidelines back this kind of product for this need; limited means little or no good evidence.</p>
      </>}
    </> },
    // Same test ProductSafety uses, so an empty Safety section never shows.
    safety && (glance?.alert || d.warnings.length || d.pregnancy || d.fdaRaw || d.sideEffects || d.allergens || d.avoidIf.length || (!d.isDigital && recall && recall.status !== 'unknown')) && { id: 'safety', label: 'Safety', body: safety },
    { id: 'reviews', label: 'Reviews', body: <>
      {ratingLine}
      {breakdown && (
        <ul className="ay-ev__bars" aria-label="Ratings from ayna members">
          {breakdown.map((b) => <li key={b.n}><span>{b.n} ★</span><i><s style={{ width: `${Math.round((b.c / memberRatingCount) * 100)}%` }} /></i><span>{b.c}</span></li>)}
        </ul>
      )}
      <ProductCommunityReviews productId={baseProduct?.id} rows={reviewRows} onOpenReview={onOpenReview} />
      {communityText && <ShortThenFull full={communityText} />}
      {d.communitySummary && <ShortThenFull full={d.communitySummary} />}
      {d.ratingNote && <p className="ay-ev__by">{d.ratingNote}</p>}
      {d.incentivized.length > 0 && <p className="ay-ev__by">Reviews on {d.incentivized.join(', ')} may include incentivized reviews.</p>}
      {(communityText || d.communitySummary) && <p className="ay-ev__by">Online reviews and posts are people’s experiences, not clinical evidence.</p>}
      {d.memberReviews.length > 0 && <><h3 className="ay-part__h">From ayna members</h3>{d.memberReviews.map((r) => <blockquote key={r.slice(0, 40)} className="ay-ev__quote">{r}</blockquote>)}</>}
      {!ratingLine && !reviewRows.length && !communityText && !d.communitySummary && !d.memberReviews.length && <p className="ay-ev__body">No reviews yet.</p>}
      {rateControls}
      <Links items={[...onlineLinks, ...(d.brand ? [{ url: `https://www.trustpilot.com/search?query=${encodeURIComponent(d.brand)}`, title: `${d.brand} on Trustpilot`, publisher: 'Trustpilot' }] : [])]} label="Read more reviews online" />
    </> },
    d.how && { id: 'how', label: 'How to use', body: <>
      {d.how.intro && <Paras text={d.how.intro} />}
      <ol className="ay-tabs__steps">{d.how.steps.map((st, i) => <li key={st}><b aria-hidden="true">{String(i + 1).padStart(2, '0')}</b><span>{st}</span></li>)}</ol>
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
        {d.badges.length > 0 && <p className="ay-ev__body">{d.badges.join(' · ')}</p>}
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

  // Numbered evidence bands, in the order people look for them.
  const bands = [
    byId.clinical && { id: 'clinical', title: 'What clinicians say', line: clinicalLine, count: d.clinicalLinks.length, note: d.independent ? '' : 'From the brand', more: 'Read the evidence', body: byId.clinical.body },
    byId.science && { id: 'science', title: 'What the research says', line: researchLine, count: researchCount || d.studies.length, more: 'Read the research', body: byId.science.body },
    byId.safety && { id: 'safety', title: 'Safety', line: safetyLine || 'See the safety checks on file.', count: d.safetyLinks.length, note: recall?.status === 'past' ? 'Recall on file' : '', more: 'See all safety info', body: byId.safety.body },
    byId.how && { id: 'how', title: 'How to use it', line: howLine, count: 0, stepsCount: d.how.steps.length, more: 'See the steps', body: byId.how.body },
    (byId.details || byId.sources) && { id: 'details', title: 'Details and sources', line: allSources.length ? `What's in it, size and price, and all ${plural(allSources.length, 'source')} we checked.` : 'What it is made of, size and price.', count: 0, more: 'See the details', body: <>
      {byId.details?.body}
      {byId.sources && <><h3 className="ay-part__h">Sources{allSources.length ? ` (${allSources.length})` : ''}</h3>{byId.sources.body}</>}
    </> },
  ].filter(Boolean);
  const toggleBand = (id) => setOpen((cur) => { const n = new Set(cur); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  // Up to three real facts from the record (never "Not on file").
  const factRow = (glance?.facts || [])
    .filter((f) => !f.unknown && f.value)
    .filter((f) => ['format', 'size', 'fsa', 'fda', 'platform'].includes(f.id))
    .filter((f) => f.id !== 'fsa' || f.value === 'Eligible')
    .filter((f) => String(f.value).length <= 48)
    .slice(0, 3)
    .map((f) => ({ id: f.id, label: f.id === 'fsa' ? 'FSA/HSA' : f.label, value: f.id === 'fsa' ? 'Eligible' : noDash(f.value) }));

  // The evidence spotlight: only real numbers (sources on file), never study results.
  const bigNumbers = [
    researchCount > 0 && { n: researchCount, text: researchCount === 1 ? 'research source ayna checked' : 'research sources ayna checked' },
    d.clinicalLinks.length > 0 && { n: d.clinicalLinks.length, text: d.clinicalLinks.length === 1 ? 'clinical guidance source' : 'clinical guidance sources' },
  ].filter(Boolean);
  const spotHeadline = gradeLine || researchLine || clinicalLine;
  const showSpot = Boolean(spotHeadline) && (bigNumbers.length > 0 || Boolean(gradeLine));

  const ing = d.ingredients[Math.min(ingPick, Math.max(d.ingredients.length - 1, 0))];
  const hasWho = d.who.length > 0 || helps.length > 0 || d.avoidIf.length > 0 || d.platform || d.integrations.length > 0;
  const nav = [
    { id: 'overview', label: 'Overview' },
    d.ingredients.length > 0 && { id: 'inside', label: 'Ingredients' },
    bands.length > 0 && { id: 'evidence', label: 'Evidence' },
    { id: 'reviews', label: aynaRating != null && ratingCount > 0 ? `Reviews (${ratingCount})` : 'Reviews' },
  ].filter(Boolean);
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <TermsCtx.Provider value={plan}>
    <div id="ay-tabs" className="ay-ps">
      <nav className="ay-ps-nav" aria-label="On this page">
        <ul>
          {nav.map((n) => (
            <li key={n.id}>
              <a href={`#ay-ps-${n.id}`} className={activeNav === n.id ? 'is-on' : undefined} aria-current={activeNav === n.id ? 'true' : undefined} onClick={(e) => { e.preventDefault(); setActiveNav(n.id); goTo(n.id); }}>{n.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="ay-ps-overview" className="ay-ps-sec" aria-labelledby="ay-ps-overview-h">
        <h2 id="ay-ps-overview-h" className="ay-ps-h">What it is</h2>
        {factRow.length > 0 && (
          <ol className="ay-ps-facts" aria-label="Key facts">
            {factRow.map((f, i) => (
              <li key={f.id}><span className="ay-ps-facts__n" aria-hidden="true">{i + 1}</span><span><small>{f.label}</small><b>{f.value}</b></span></li>
            ))}
          </ol>
        )}
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
      </section>

      {d.ingredients.length > 0 && (
        <section id="ay-ps-inside" className="ay-ps-sec" aria-labelledby="ay-ps-inside-h">
          <h2 id="ay-ps-inside-h" className="ay-ps-h">What’s inside and why it works</h2>
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
          {d.ingredientNote && <p className="ay-ev__by ay-ps-center">{d.ingredientNote}</p>}
        </section>
      )}

      {bands.length > 0 && (
        <section id="ay-ps-evidence" className="ay-ps-sec" aria-labelledby="ay-ps-evidence-h">
          <h2 id="ay-ps-evidence-h" className="ay-ps-h">What the evidence says</h2>
          <p className="ay-ps-sub">The short answer is on each row. Open one for the full notes and sources.</p>
          {showSpot && (
            <div className="ay-ps-spot">
              <div className="ay-ps-spot__text">
                <p className="ay-ps-spot__kicker">ayna’s evidence check</p>
                <p className="ay-ps-spot__h">{spotHeadline}</p>
                {bigNumbers.length > 0 && (
                  <dl className="ay-ps-spot__nums">
                    {bigNumbers.map((b) => <div key={b.text}><dt>{b.n}</dt><dd>{b.text}</dd></div>)}
                  </dl>
                )}
                {byId.science && <button type="button" className="ay-ps-btn" onClick={() => openBand('science')}>See the research<Chevron /></button>}
              </div>
              {image && <div className="ay-ps-spot__photo"><img src={image} alt="" loading="lazy" onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }} /></div>}
            </div>
          )}
          <ol className="ay-ps-bands">
            {bands.map((b, i) => {
              const isOpen = open.has(b.id);
              const meta = [b.count > 0 && plural(b.count, 'source'), b.stepsCount > 0 && plural(b.stepsCount, 'step'), b.note].filter(Boolean);
              return (
                <li key={b.id} id={`ay-ps-${b.id}`} className={`ay-ps-band is-${b.id}${isOpen ? ' is-open' : ''}`}>
                  <h3 className="ay-ps-band__h">
                    <button type="button" aria-expanded={isOpen} aria-controls={`ay-ps-${b.id}-body`} onClick={() => toggleBand(b.id)}>
                      <span className="ay-ps-band__num" aria-hidden="true">({pad(i + 1)})</span>
                      <span className="ay-ps-band__main">
                        <span className="ay-ps-band__title">{b.title}</span>
                        {b.line && <span className="ay-ps-band__line">{b.line}</span>}
                        {meta.length > 0 && <span className="ay-ps-band__meta">{meta.join(' · ')}</span>}
                      </span>
                      <span className="ay-ps-band__go">
                        <span>{isOpen ? 'Close' : b.more}</span>
                        <Chevron />
                      </span>
                    </button>
                  </h3>
                  <div id={`ay-ps-${b.id}-body`} className="ay-ps-band__body" hidden={!isOpen}>
                    {b.body}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section id="ay-ps-reviews" className="ay-ps-sec ay-ps-reviews" aria-labelledby="ay-ps-reviews-h">
        <h2 id="ay-ps-reviews-h" className="ay-ps-h">What people say</h2>
        {byId.reviews.body}
      </section>
    </div>
    </TermsCtx.Provider>
  );
}

/** Chevron used on every "open" control. */
function Chevron() {
  return <svg className="ay-ps-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
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
      {(d.warnings.length > 0 || d.pregnancy) && <ul className="ay-safety__list">{d.pregnancy && <li>Pregnancy: {d.pregnancy}</li>}{d.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
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

