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
const CREDIBLE = /(\.gov|\.gov\.[a-z]{2}|\.mil|\.nhs\.uk|nice\.org\.uk|who\.int|europa\.eu|ncbi\.nlm\.nih|pubmed|cochranelibrary|cochrane\.org|doi\.org|nejm\.org|jamanetwork|thelancet|bmj\.com|nature\.com|sciencedirect|springer|wiley|tandfonline|sagepub|frontiersin|mdpi|plos|oup\.com|academic\.oup|journals\.lww|ajog\.org|acog\.org|aafp\.org|asrm\.org|menopause\.org|endocrine\.org|ics\.org|uptodate|mayoclinic\.org|clevelandclinic\.org|hopkinsmedicine|health\.harvard\.edu|medlineplus|cancer\.org|acs\.org|nccih|aad\.org|apa\.org|jmir\.org|healthychildren\.org|aap\.org|fda\.gov|cdc\.gov)/i;
const isCredible = (url) => { try { const u = new URL(url); if (/\/search\b|[?&#](q|query|search)=/i.test(u.pathname + u.search + u.hash)) return false; return CREDIBLE.test(u.hostname + u.pathname); } catch { return false; } };

/**
 * The research the team wrote for each product, in the order people look for
 * it: Clinical opinion, Scientific literature, Reviews, Safety. All four are
 * always on the page, stacked, one card style, with a sticky jump bar. Each
 * field shows once. Long text shows its short version first, then "Read
 * more". The curated words are not rewritten; only em dashes become commas.
 */

const noDash = (t) => String(t || '').replace(/\s*—\s*/g, ', ').replace(/^,\s*/, '').trim();
const meaningful = (v) => { const t = String(v || '').trim(); return t && !/^(n\/?a|none|not applicable|unknown|not on file)\.?$/i.test(t) ? t : ''; };
const sentences = (t) => String(t || '').match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) || [];
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
    out.push({ url, title: noDash(e.title || e.text || e.label || sourceName(url, brand)), summary: e.summary ? noDash(e.summary) : '', year: e.year || '', publisher: sourceName(url, brand, e.platform) });
  });
  return out;
}

function Links({ items, label }) {
  if (!items.length) return null;
  return (
    <div className="ay-ev__links">
      {label && <h4 className="ay-ev__links-h">{label}</h4>}
      <ul>
        {items.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              <span className="ay-ev__pub">{[s.publisher, s.year].filter(Boolean).join(' · ')}</span>
              <span className="ay-ev__title">{s.title}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></span>
            </a>
            {s.summary && <p>{s.summary}</p>}
          </li>
        ))}
      </ul>
    </div>
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

/** Short version first; the full text one tap away. */
function ShortThenFull({ short, full }) {
  const lead = short || sentences(full).slice(0, 2).join(' ');
  if (!full || full.length <= lead.length + 40) return <Paras text={full || lead} />;
  return (
    <>
      <Paras text={lead} />
      <details className="ay-ev__more">
        <summary><span className="is-closed">Read more</span><span className="is-open">Show less</span></summary>
        <Paras text={full} />
      </details>
    </>
  );
}

function plural(n, one, many = `${one}s`) { return `${n} ${n === 1 ? one : many}`; }

function useEvidence(product, aynaData) {
  return useMemo(() => {
    if (!product) return null;
    const brand = product.brand || '';
    const pp = getPassport(product);
    const independent = product.clinicianOpinionSource !== 'brand';
    const clinicalLinks = collect([...(product.doctorOpinionCitations || []), ...getVerificationLinks(product, 'doctor')], brand).filter((l) => isCredible(l.url));
    const ingredients = (product.ingredientScience || []).filter((i) => i?.name).map((i) => ({
      name: noDash(i.name), text: noDash(i.text), links: collect((i.citations || []).map((c) => ({ ...c, title: c.label })), brand).filter((l) => isCredible(l.url)),
    }));
    const ingredientUrls = new Set(ingredients.flatMap((i) => i.links.map((l) => l.url)));
    const studies = collect([...getVerificationLinks(product, 'scientific'), ...(product.scientificCitations || [])], brand).filter((s) => !ingredientUrls.has(s.url) && isCredible(s.url));
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
        return !warnings.some((w) => { const ww = words(w); let hit = 0; sw.forEach((x) => { if (ww.has(x)) hit += 1; }); return hit / sw.size >= 0.5; });
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
      how: product.howToUse?.steps?.length ? { intro: noDash(product.howToUse.intro), steps: product.howToUse.steps.map(noDash).filter(Boolean), url: product.howToUse.sourceUrl || '' } : null,
      platform: noDash(meaningful(product.platform)),
      integrations: (product.integrations || []).map((x) => noDash(typeof x === 'string' ? x : x?.name)).filter(Boolean),
      ingredientsText: noDash(meaningful(product.ingredients)),
      materials: noDash(meaningful(product.safety?.materials)),
      ingredientNote: noDash(meaningful(product.ingredientScienceNote)),
      priceNote: noDash(meaningful(product.priceNote)),
      faq: /^https:\/\//.test(String(product.faqUrl || '')) ? product.faqUrl : '',
      incentivized: (product.incentivizedReviewSites || []).filter((x) => x?.site).map((x) => `${noDash(x.site)}${x.source ? ` (per ${noDash(x.source)})` : ''}`),
      inStock: Object.entries(product.whereToBuyInStock || {}).filter(([, v]) => v).map(([k]) => k),
    };
  }, [product, aynaData]);
}

// Retail and brand pages are where to buy, not reviews: they stay off the Reviews tab.
const RETAIL = /amzn\.|amazon\.|walmart\.|target\.com|cvs\.com|walgreens\.|ulta\.|sephora\./i;

export default function ProductEvidence({ product, glance = null, aynaData = null, aynaRating = null, ratingCount = 0, rateControls = null, safety = null, extraRows = [] }) {
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
  const keyNav = (e) => {
    const i = tabs.findIndex((t) => t.id === cur.id);
    const n = e.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length] : e.key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length] : null;
    if (!n) return;
    e.preventDefault(); setTab(n.id);
    window.requestAnimationFrame(() => document.getElementById(`ay-tab-${n.id}`)?.focus());
  };

  // Each hard word is underlined once per tab, where it first appears (max 6).
  const paras = (t) => String(t || '').split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const textsFor = {
    summary: paras([d.aynaSummary, d.aynaDetail].filter(Boolean).join('\n\n')),
    clinical: [...paras(d.clinicianShort || sentences(d.clinician).slice(0, 2).join(' ')), ...paras(d.clinician)],
    science: [...paras(d.bottomLine), ...d.ingredients.map((i) => i.text)],
    reviews: [...paras(d.communityText), ...paras(d.thingsRaised)],
  };
  const plan = planGlossaryTerms((textsFor[cur.id] || []).map((t) => ({ key: t, text: t })), 6);

  return (
    <TermsCtx.Provider value={plan}>
    <section id="ay-tabs" className="ay-tabs" aria-label="About this product">
      <div className="ay-tabs__bar" role="tablist" aria-label="About this product" onKeyDown={keyNav}>
        {tabs.map((t) => (
          <button key={t.id} id={`ay-tab-${t.id}`} type="button" role="tab" aria-selected={t.id === cur.id} aria-controls="ay-tab-panel" tabIndex={t.id === cur.id ? 0 : -1} className={`ay-tabs__tab is-${t.id}${t.id === cur.id ? ' is-on' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div id="ay-tab-panel" role="tabpanel" aria-labelledby={`ay-tab-${cur.id}`} className={`ay-tabs__panel is-${cur.id}`} key={cur.id}>

        {cur.id === 'summary' && <>
          {d.aynaSummary ? <ShortThenFull full={[d.aynaSummary, d.aynaDetail].filter(Boolean).join('\n\n')} /> : <p className="ay-ev__empty">No summary on file yet.</p>}
          {d.evidenceStrength && <p className="ay-ev__by">Evidence level on file: {d.evidenceStrength}</p>}
          {d.badges.length > 0 && <div className="ay-tabs__block"><h3>What the brand says about it</h3><ul className="ay-tabs__chips">{d.badges.map((b) => <li key={b}>{b}</li>)}</ul><p className="ay-ev__by">The brand’s own labels and awards. Not checked by ayna.</p></div>}
        </>}

        {cur.id === 'who' && <>
          {d.who.length > 0 && <ul className="ay-tabs__list">{d.who.map((w) => <li key={w}>{withTerms(w, plan)}</li>)}</ul>}
          {helps.length > 0 && <div className="ay-tabs__block"><h3>Helps with</h3><ul className="ay-tabs__chips">{helps.map((h) => <li key={h}>{h}</li>)}</ul></div>}
          {d.avoidIf.length > 0 && <div className="ay-tabs__block"><h3>Skip it if you react to</h3><p className="ay-ev__body">{d.avoidIf.join(', ')}</p></div>}
          {(d.platform || d.integrations.length > 0) && <div className="ay-tabs__block"><h3>Works with</h3><p className="ay-ev__body">{[d.platform, ...d.integrations].filter(Boolean).join(', ')}</p></div>}
        </>}

        {cur.id === 'how' && d.how && <>
          {d.how.intro && <Paras text={d.how.intro} />}
          <ol className="ay-tabs__steps">{d.how.steps.map((st, i) => <li key={st}><b aria-hidden="true">{i + 1}</b><span>{st}</span></li>)}</ol>
          {d.faq && <p className="ay-ev__by"><a href={d.faq} target="_blank" rel="noopener noreferrer">{d.brand || 'The brand'}’s FAQ<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></p>}
          {d.how.url && <p className="ay-ev__by"><a href={d.how.url} target="_blank" rel="noopener noreferrer">From {d.brand || 'the brand'}’s instructions<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></p>}
        </>}

        {cur.id === 'clinical' && <>
          <p className={`ay-ev2__badge ${d.independent ? 'is-indep' : 'is-brand'}`}>{d.independent ? 'Independent sources' : 'Based on brand claims'}</p>
          {d.clinician ? <ShortThenFull short={d.clinicianShort} full={d.clinician} /> : <p className="ay-ev__empty">No clinical opinion on file yet.</p>}
          {d.attribution && <p className="ay-ev__by">{d.attribution}</p>}
          <Links items={d.clinicalLinks} label={d.clinicalLinks.length ? plural(d.clinicalLinks.length, 'source') : ''} />
        </>}

        {cur.id === 'science' && <>
          {d.bottomLine && <><h3 className="ay-ev2__sub">The bottom line</h3><ShortThenFull full={d.bottomLine} /></>}
          {d.ingredients.length > 0 && <>
            <h3 className="ay-ev2__sub">What’s inside, and the research</h3>
            <ul className="ay-ev2__ingr">
              {shownIngredients.map((i) => (
                <li key={i.name}>
                  <strong>{i.name}</strong>
                  {i.text && <p>{withTerms(i.text, plan)}</p>}
                  {i.links.length > 0 && <ul className="ay-ev2__ingr-links">{i.links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer">{l.title}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a> <small>{l.publisher}</small></li>)}</ul>}
                </li>
              ))}
            </ul>
            {d.ingredients.length > 3 && <button type="button" className="ay-ev2__showall" aria-expanded={allIngredients} onClick={() => setAllIngredients((v) => !v)}>{allIngredients ? 'Show fewer' : `Show all ${d.ingredients.length}`}</button>}
            {d.ingredientNote && <p className="ay-ev__by">{d.ingredientNote}</p>}
          </>}
          <Links items={d.studies} label={d.studies.length ? plural(d.studies.length, 'study', 'studies') : ''} />
          {(d.ingredients.length > 0 || d.studies.length > 0) && !d.productSpecific && <p className="ay-ev__by">This research is about the ingredients or this type of product, not a study of this exact product.</p>}
          {!d.bottomLine && !d.ingredients.length && !d.studies.length && <p className="ay-ev__empty">No studies linked yet.</p>}
        </>}

        {cur.id === 'reviews' && <>
          {aynaRating != null && ratingCount > 0
            ? <p className="ay-ev__rating"><b>★ {aynaRating.toFixed(1)}</b> from {plural(ratingCount, 'ayna member')}</p>
            : d.brandRating ? <p className="ay-ev__rating"><b>★ {d.brandRating.value}</b> from {d.brandRating.count} reviews <span className="ay-ev2__badge is-brand">Brand-reported, not verified by ayna</span></p>
              : d.userRating ? <p className="ay-ev__rating"><b>★ {d.userRating.value}</b> <a href={d.userRating.url} target="_blank" rel="noopener noreferrer">online rating<span aria-hidden="true"> ↗</span></a></p> : null}
          {d.memberReviews.map((r) => <blockquote key={r.slice(0, 40)} className="ay-ev__quote">{r}</blockquote>)}
          {!(ratingCount > 0) && <p className="ay-ev__by">No ayna member reviews yet.</p>}
          {d.communityText && <><h3 className="ay-ev2__sub">What people say in online reviews</h3><ShortThenFull full={d.communityText} /></>}
          {d.thingsRaised && <><h3 className="ay-ev2__sub">Things people raise</h3><ShortThenFull full={d.thingsRaised} /></>}
          {d.ratingNote && <p className="ay-ev__by">{d.ratingNote}</p>}
          {d.incentivized.length > 0 && <p className="ay-ev__by">Reviews on {d.incentivized.join(', ')} may include incentivized reviews.</p>}
          <Links items={onlineLinks} label={onlineLinks.length ? 'Read more online' : ''} />
          {d.brand && <div className="ay-tabs__block"><h3>Third-party review sites</h3><p className="ay-ev__body"><a href={`https://www.trustpilot.com/search?query=${encodeURIComponent(d.brand)}`} target="_blank" rel="noopener noreferrer">Look up {d.brand} on Trustpilot<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></p></div>}
          <p className="ay-ev__by">Online reviews and posts are people’s experiences, not clinical evidence.</p>
          {rateControls}
        </>}

        {cur.id === 'details' && <>
          {safety}
          {d.ingredientsText && <div className="ay-tabs__block"><h3>{d.isDigital ? 'What’s included' : 'Ingredients'}</h3><p className="ay-ev__body ay-pd__pre">{d.ingredientsText}</p></div>}
          {d.materials && !/^various|^varies/i.test(d.materials) && d.materials !== d.ingredientsText && d.ingredients.filter((i) => d.materials.toLowerCase().includes(i.name.toLowerCase().split(/\s|&|and/)[0])).length < 3 && <div className="ay-tabs__block"><h3>Materials and what’s in the box</h3><p className="ay-ev__body">{d.materials}</p></div>}
          {(facts.length > 0 || extraRows.some((r) => r && r.value) || d.priceNote) && <div className="ay-tabs__block"><h3>Size, price and where to buy</h3>
            <dl className="ay-pd__rows">
              {facts.map((f) => <div key={f.id}><dt>{f.label}</dt><dd>{f.value}{f.note ? <small>{fmtDate(f.note)}</small> : null}</dd></div>)}
              {extraRows.filter((r) => r && r.value).map((r) => <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}
              {d.priceNote && <div><dt>Price note</dt><dd>{d.priceNote}</dd></div>}
              {d.inStock.length > 0 && <div><dt>In stock at</dt><dd>{d.inStock.join(', ')}</dd></div>}
            </dl></div>}
          {(() => {
            const unk = (glance?.sections || []).find((x) => x.id === 'unknown');
            const items = (unk?.blocks || []).filter((b) => b.type === 'list').flatMap((b) => b.items || []).map((t) => noDash(typeof t === 'string' ? t : t?.text)).filter(Boolean);
            return items.length ? <div className="ay-tabs__block"><h3>What we don’t know yet</h3><ul className="ay-safety__list">{items.map((t) => <li key={t}>{t}</li>)}</ul></div> : null;
          })()}
          {allSources.length > 0 && <details className="ay-pd__sources"><summary>All sources ({allSources.length})</summary>
            <ol>{allSources.map((x) => <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.title}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a> <small>{[x.publisher, x.year].filter(Boolean).join(' · ')}</small></li>)}</ol>
          </details>}
        </>}
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
  return (
    <div id="ay-sec-safety" className="ay-safety">
      <h3>Safety</h3>
      {alertText && <p className="ay-safety__alert" role="note">{noDash(alertText)}</p>}
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
        {showRecall && <div><dt>Recalls</dt><dd>{recall.status === 'none' ? 'No recalls found.' : noDash(recall.detail || recall.label || '')}</dd></div>}
        {d.privacy && meaningful(d.privacy.dataStorage) && <div><dt>Data storage</dt><dd>{noDash(d.privacy.dataStorage)}</dd></div>}
        {d.privacy && meaningful(d.privacy.keyPolicy) && <div><dt>Privacy</dt><dd>{noDash(d.privacy.keyPolicy)}</dd></div>}
      </dl>
      <Links items={d.safetyLinks} label={d.safetyLinks.length ? 'Safety sources' : ''} />
    </div>
  );
}

