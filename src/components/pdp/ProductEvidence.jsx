import { splitSentences, firstSentence } from './sentences';
import { isCredible } from './credible';
import { useApprovedResearch } from '../../utils/approvedResearch';
import React, { useEffect, useMemo, useState } from 'react';
import { getVerificationLinks, hostLabel } from '../../utils/verificationLinks';
import { humanPublisher } from './glance';
import { normalizeFdaStatus } from '../../utils/fdaStatus';
import { getPassport } from '../../data/passport';
import { fmtDate } from './fmtDate';
import GlossaryTerm from '../GlossaryTerm';
import { findHardTerms, planGlossaryTerms } from '../../data/glossary';

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
              <span className="ay-src__icon" aria-hidden="true">{String(s.publisher || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 1).toUpperCase() || '?'}</span>
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
    const br = brandRatingText.match(/(\d(?:\.\d)?)[-\s]?star[^.]{0,40}?(?:across|from|of)\s+([\d,]+)\s+(?:verified\s+)?reviews/i);
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

export default function ProductEvidence({ product: baseProduct, glance = null, aynaData = null, aynaRating = null, ratingCount = 0, rateControls = null, safety = null, extraRows = [] }) {
  // Research the team approved in /admin/research fills any empty section.
  const product = useApprovedResearch(baseProduct);
  const d = useEvidence(product, aynaData);
  const [tab, setTab] = useState('summary');
  const [allIngredients, setAllIngredients] = useState(false);
  // "All safety info" under Buy opens the Details and safety tab.
  useEffect(() => {
    const on = (e) => { setTab(e.detail || 'details'); window.setTimeout(() => document.getElementById('ay-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); };
    window.addEventListener('ay-open-tab', on);
    return () => window.removeEventListener('ay-open-tab', on);
  }, []);
  if (!d) return null;

  const brandSlug = String(d.brand).toLowerCase().replace(/[^a-z0-9]/g, '');
  const onlineLinks = d.community.filter((l) => { let h = ''; try { h = new URL(l.url).hostname; } catch { return false; } return !RETAIL.test(h) && !(brandSlug.length >= 3 && h.replace(/[^a-z0-9]/g, '').includes(brandSlug)); });
  const helps = glance?.who?.helps || [];
  const facts = (glance?.facts || []).filter((f) => !f.unknown && !['inside', 'fda'].includes(f.id));
  const allSources = glance?.sources || [];
  const shownIngredients = allIngredients ? d.ingredients : d.ingredients.slice(0, 3);

  const tabs = [
    { id: 'summary', label: 'ayna summary' },
    (d.who.length || helps.length || d.avoidIf.length) && { id: 'who', label: 'Who it’s for' },
    d.how && { id: 'how', label: 'How to use' },
    { id: 'clinical', label: 'Clinical opinion' },
    { id: 'science', label: 'Scientific literature' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'details', label: 'Details and safety' },
  ].filter(Boolean);
  const cur = tabs.find((t) => t.id === tab) || tabs[0];
  // Desktop: pick a section on the left; if the panel's top is off screen, bring it back.
  const pick = (id) => {
    setTab(id);
    window.requestAnimationFrame(() => {
      const el = document.getElementById('ay-tabs');
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };
  const keyNav = (e) => {
    const i = tabs.findIndex((t) => t.id === cur.id);
    const n = /^(ArrowDown|ArrowRight)$/.test(e.key) ? tabs[(i + 1) % tabs.length] : /^(ArrowUp|ArrowLeft)$/.test(e.key) ? tabs[(i - 1 + tabs.length) % tabs.length] : null;
    if (!n) return;
    e.preventDefault(); setTab(n.id);
    window.requestAnimationFrame(() => document.getElementById(`ay-tab-${n.id}`)?.focus());
  };

  // Each hard word is underlined once per tab, where it first appears (max 6).
  const paras = (t) => String(t || '').split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const textsFor = {
    summary: paras([d.aynaSummary, d.aynaDetail].filter(Boolean).join('\n\n')),
    clinical: [...paras(d.clinicianShort || sentences(d.clinician).slice(0, 2).join(' ')), ...paras(d.clinician), ...paras(d.clinicalSummary)],
    science: [...paras(d.bottomLine), ...paras(d.scienceSummary), ...d.ingredients.map((i) => i.text)],
    reviews: [...paras(d.communityText), ...paras(d.communitySummary), ...paras(d.thingsRaised)],
  };
  const plan = planGlossaryTerms((textsFor[cur.id] || []).map((t) => ({ key: t, text: t })), 6);

  const ratingLine = aynaRating != null && ratingCount > 0
    ? <p className="ay-ev__rating"><b>★ {aynaRating.toFixed(1)}</b> from {plural(ratingCount, 'ayna member')}</p>
    : d.brandRating ? <p className="ay-ev__rating"><b>★ {d.brandRating.value}</b> from {d.brandRating.count} reviews <span className="ay-ev2__badge is-brand">Brand-reported, not verified by ayna</span></p>
      : d.userRating ? <p className="ay-ev__rating"><b>★ {d.userRating.value}</b> <a href={d.userRating.url} target="_blank" rel="noopener noreferrer">online rating<span aria-hidden="true"> ↗</span></a></p> : null;
  const showMaterials = Boolean(d.materials) && !/^various|^varies/i.test(d.materials) && d.materials.trim().toLowerCase() !== String(d.ingredientsText || '').trim().toLowerCase();
  const unknowns = (() => {
    const unk = (glance?.sections || []).find((x) => x.id === 'unknown');
    return (unk?.blocks || []).filter((b) => b.type === 'list').flatMap((b) => b.items || []).map((t) => noDash(typeof t === 'string' ? t : t?.text)).filter(Boolean);
  })();
  // A safety note (a lawsuit, a warning) belongs in Safety, not in Reviews: show it once.
  const thingsRaised = (() => {
    let t = d.thingsRaised;
    // The brand's star rating already shows as a number under Reviews: say it once.
    if (t && d.brandRating) t = sentences(t).filter((x) => !/\d(\.\d)?[-\s]?star/i.test(x)).join(' ').trim();
    if (!t || !glance?.alert) return t;
    const w = (x) => new Set(String(x).toLowerCase().match(/[a-z]{4,}/g) || []);
    const a = w(glance.alert); const tw = w(t); let hit = 0; tw.forEach((x) => { if (a.has(x)) hit += 1; });
    return tw.size && hit / tw.size >= 0.5 ? '' : t;
  })();
  // A one-line "Holds 30 mL. Up to 12 hours." is specs, not science: it goes with size and price.
  const bottomIsSpecs = Boolean(d.bottomLine) && d.bottomLine.length < 160 && !/stud|trial|evidence|research|review|shown|found|data|clinical/i.test(d.bottomLine);
  // The line under the product name is the summary's first sentence: don't say it twice.
  const summaryText = (() => {
    const full = d.aynaSummary || '';
    const lead = firstSentence(full, { min: 20, max: 240 }).replace(/…$/, '');
    const rest = lead && full.startsWith(lead) ? full.slice(lead.length).trim() : '';
    const body = rest || (d.aynaDetail ? '' : full);
    return [body, d.aynaDetail].filter(Boolean).join('\n\n');
  })();
  const hasRows = bottomIsSpecs || facts.length > 0 || extraRows.some((r) => r && r.value) || d.priceNote || d.inStock.length > 0;

  const renderPanel = (id) => (<>

        {id === 'summary' && <>
          {summaryText ? <ShortThenFull full={summaryText} /> : <p className="ay-ev__empty">No summary on file yet.</p>}
          {d.evidenceStrength && <p className="ay-ev__by">Evidence level on file: {d.evidenceStrength}</p>}
          {d.badges.length > 0 && <div className="ay-tabs__block"><ul className="ay-tabs__chips">{d.badges.map((b) => <li key={b}>{b}</li>)}</ul><p className="ay-ev__by">The brand’s own labels and awards. Not checked by ayna.</p></div>}
        </>}

        {id === 'who' && <>
          {d.who.length > 0 && <ul className="ay-tabs__list">{d.who.map((w) => <li key={w}>{withTerms(w, plan)}</li>)}</ul>}
          {helps.length > 0 && <div className="ay-tabs__block"><h3>Helps with</h3><ul className="ay-tabs__chips">{helps.map((h) => <li key={h}>{h}</li>)}</ul></div>}
          {d.avoidIf.length > 0 && <div className="ay-tabs__block"><h3>Skip it if you react to</h3><p className="ay-ev__body">{d.avoidIf.join(', ')}</p></div>}
          {(d.platform || d.integrations.length > 0) && <div className="ay-tabs__block"><h3>Works with</h3><p className="ay-ev__body">{[d.platform, ...d.integrations].filter(Boolean).join(', ')}</p></div>}
        </>}

        {id === 'how' && d.how && <>
          {d.how.intro && <Paras text={d.how.intro} />}
          <ol className="ay-tabs__steps">{d.how.steps.map((st, i) => <li key={st}><b aria-hidden="true">{i + 1}</b><span>{st}</span></li>)}</ol>
          <Links items={[
            d.faq && { url: d.faq, title: `${d.brand || 'The brand'}’s FAQ`, publisher: sourceName(d.faq, d.brand) },
            d.how.url && { url: d.how.url, title: d.how.label || `${d.brand || 'The brand'}’s instructions`, publisher: sourceName(d.how.url, d.brand) },
          ].filter(Boolean)} />
        </>}

        {id === 'clinical' && <SubTabs key="clinical" items={[
          { id: 'opinion', label: 'Opinion', node: <>
            <p className={`ay-ev2__badge ${d.independent ? 'is-indep' : 'is-brand'}`}>{d.independent ? 'Independent sources' : 'Based on brand claims'}</p>
            {d.clinician ? <ShortThenFull short={d.clinicianShort} full={d.clinician} /> : <p className="ay-ev__empty">No clinical opinion on file yet.</p>}
            {d.clinicalNote && <ShortThenFull full={d.clinicalNote} />}
            {(d.attribution || d.clinicalNote) && <p className="ay-ev__by">{[d.attribution, d.clinicalNote && 'The added context comes from the clinical guidance under Sources.'].filter(Boolean).join(' ')}</p>}
          </> },
          thingsRaised && { id: 'note', label: 'ayna’s note', node: <ShortThenFull full={thingsRaised} /> },
          (d.clinicalLinks.length > 0 || d.clinicalSummary) && { id: 'src', label: `Sources${d.clinicalLinks.length ? ` (${d.clinicalLinks.length})` : ''}`, node: <>
            {d.clinicalSummary && <ShortThenFull full={d.clinicalSummary} />}
            <Links items={d.clinicalLinks} />
          </> },
        ]} />}

        {id === 'science' && <SubTabs key="science" empty={<p className="ay-ev__empty">No studies linked yet.</p>} items={[
          ((d.bottomLine && !bottomIsSpecs) || d.scienceSummary) && { id: 'bottom', label: 'Summary', node: <>
            {d.bottomLine && !bottomIsSpecs && <ShortThenFull full={d.bottomLine} />}
            {d.scienceSummary && <ShortThenFull full={d.scienceSummary} />}
          </> },
          d.ingredients.length > 0 && { id: 'ingr', label: `Ingredients (${d.ingredients.length})`, node: <>
            <ul className="ay-ev2__ingr">
              {shownIngredients.map((i) => (
                <li key={i.name}>
                  <strong>{i.name}</strong>
                  {i.text && <p>{withTerms(i.text, plan)}</p>}
                  {i.links.length > 0 && <Links items={i.links} compact />}
                </li>
              ))}
            </ul>
            {d.ingredients.length > 3 && <button type="button" className="ay-ev2__showall" aria-expanded={allIngredients} onClick={() => setAllIngredients((v) => !v)}>{allIngredients ? 'Show fewer' : `Show all ${d.ingredients.length}`}</button>}
            {d.ingredientNote && <p className="ay-ev__by">{d.ingredientNote}</p>}
          </> },
          d.studies.length > 0 && { id: 'studies', label: `Studies (${d.studies.length})`, node: <Links items={d.studies} /> },
        ]} foot={(d.ingredients.length > 0 || d.studies.length > 0) && !d.productSpecific ? <p className="ay-ev__by">This research is about the ingredients or this type of product, not a study of this exact product.</p> : null} />}

        {id === 'reviews' && <SubTabs key="reviews" items={[
          (ratingLine || d.communityText || d.communitySummary) && { id: 'say', label: 'What people say', node: <>
            {ratingLine}
            {d.communityText && <ShortThenFull full={d.communityText} />}
            {d.communitySummary && <ShortThenFull full={d.communitySummary} />}
            {d.ratingNote && <p className="ay-ev__by">{d.ratingNote}</p>}
            {d.incentivized.length > 0 && <p className="ay-ev__by">Reviews on {d.incentivized.join(', ')} may include incentivized reviews.</p>}
            <p className="ay-ev__by">Online reviews and posts are people’s experiences, not clinical evidence.</p>
          </> },
          (d.brand || onlineLinks.length > 0) && { id: 'online', label: 'Read online', node: <>
            <Links items={[...onlineLinks, ...(d.brand ? [{ url: `https://www.trustpilot.com/search?query=${encodeURIComponent(d.brand)}`, title: `${d.brand} on Trustpilot`, publisher: 'Trustpilot', summary: 'Independent review site.' }] : [])]} />
          </> },
          { id: 'ayna', label: ratingCount > 0 ? `ayna reviews (${ratingCount})` : 'ayna reviews', node: <>
            {aynaRating != null && ratingCount > 0 && <p className="ay-ev__rating"><b>★ {aynaRating.toFixed(1)}</b> from {plural(ratingCount, 'ayna member')}</p>}
            {d.memberReviews.map((r) => <blockquote key={r.slice(0, 40)} className="ay-ev__quote">{r}</blockquote>)}
            {!(ratingCount > 0) && <p className="ay-ev__by">No ayna member reviews yet.</p>}
            {rateControls}
          </> },
        ]} />}

        {id === 'details' && <SubTabs key="details" items={[
          safety && { id: 'safety', label: 'Safety', node: safety },
          (d.ingredientsText || showMaterials) && { id: 'inside', label: d.isDigital ? 'What’s included' : 'What’s in it', node: <>
            {/* Labels only when both are shown; one block needs no title. */}
            {d.ingredientsText && <>{showMaterials && <h3 className="ay-ev2__sub">{d.isDigital ? 'Included' : 'Ingredients'}</h3>}<p className="ay-ev__body ay-pd__pre">{d.ingredientsText}</p></>}
            {showMaterials && <>{d.ingredientsText && <h3 className="ay-ev2__sub">Materials</h3>}<p className="ay-ev__body">{d.materials}</p></>}
          </> },
          hasRows && { id: 'buy', label: 'Size and price', node: (
            <dl className="ay-pd__rows">
              {facts.map((f) => <div key={f.id}><dt>{f.label}</dt><dd>{f.value}{f.note ? <small>{fmtDate(f.note)}</small> : null}</dd></div>)}
              {extraRows.filter((r) => r && r.value).map((r) => <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}
              {bottomIsSpecs && <div><dt>Specs</dt><dd>{d.bottomLine}</dd></div>}
              {d.priceNote && <div><dt>Price note</dt><dd>{d.priceNote}</dd></div>}
              {d.inStock.length > 0 && <div><dt>In stock at</dt><dd>{d.inStock.join(', ')}</dd></div>}
            </dl>
          ) },
          (allSources.length > 0 || unknowns.length > 0) && { id: 'sources', label: `Sources${allSources.length ? ` (${allSources.length})` : ''}`, node: <>
            {unknowns.length > 0 && <div className="ay-unknown"><h3 className="ay-ev2__sub">What we don’t know yet</h3><ul>{unknowns.map((t) => <li key={t}>{t}</li>)}</ul></div>}
            <Links items={allSources.map((x) => ({ url: x.url, title: noDash(x.title), publisher: x.publisher, year: x.year }))}  />
          </> },
        ]} />}
  </>);

  return (
    <TermsCtx.Provider value={plan}>
    <section id="ay-tabs" className={`ay-tabs${tab ? '' : ' is-collapsed'}`} aria-label="About this product">
      <nav className="ay-tabs__nav" aria-label="About this product">
        <ul>
          {tabs.map((t) => (
            <li key={t.id}><button type="button" id={`ay-tab-${t.id}`} aria-current={t.id === cur.id ? 'true' : undefined} aria-controls="ay-tab-panel" className={`ay-tabs__tab is-${t.id}${t.id === cur.id ? ' is-on' : ''}`} onClick={() => pick(t.id)} onKeyDown={keyNav}>{t.label}</button></li>
          ))}
        </ul>
      </nav>
      <div className="ay-tabs__body">
        {tabs.map((t) => (
          <React.Fragment key={t.id}>
            <button type="button" className={`ay-tabs__acc${tab === t.id ? ' is-on' : ''}`} aria-expanded={tab === t.id} aria-controls={tab === t.id ? 'ay-tab-panel' : undefined} onClick={() => setTab(tab === t.id ? '' : t.id)}>
              <span>{t.label}</span><i aria-hidden="true" />
            </button>
            {t.id === cur.id && (
              <div id="ay-tab-panel" role="region" aria-label={t.label} className={`ay-tabs__panel is-${t.id}`}>
                {renderPanel(t.id)}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
    </TermsCtx.Provider>
  );
}

/** Safety lives inside Product details; the warning line under Buy opens it there. */
export function ProductSafety({ product, recall = null, alertText = '', glance = null }) {
  const d = useEvidence(product, null);
  if (!d) return null;
  const showRecall = !d.isDigital && recall && recall.status !== 'unknown';
  if (!(alertText || d.warnings.length || d.pregnancy || d.fdaRaw || d.sideEffects || d.allergens || d.avoidIf.length || showRecall)) return null;
  // The note above often tells the same story as the recall line: say it once.
  const recallFull = showRecall ? noDash(recall.detail || recall.label || '') : '';
  const words = (t) => new Set(String(t).toLowerCase().match(/[a-z]{4,}/g) || []);
  const rw = words(recallFull); const aw = words(alertText);
  let hit = 0; rw.forEach((x) => { if (aw.has(x)) hit += 1; });
  const recallText = rw.size && hit / rw.size >= 0.4 ? (/no recall/i.test(recallFull) ? 'No recall has been issued. The note above has the details.' : 'See the note above.') : recallFull;
  return (
    <div id="ay-sec-safety" className="ay-safety">
      <h3>Safety</h3>
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
      <Links items={d.safetyLinks} label={d.safetyLinks.length ? 'Sources' : ''} />
    </div>
  );
}

