import React, { useMemo, useState } from 'react';
import { getVerificationLinks, hostLabel } from '../../utils/verificationLinks';
import { humanPublisher } from './glance';
import { normalizeFdaStatus } from '../../utils/fdaStatus';
import { getPassport } from '../../data/passport';
import { fmtDate } from './fmtDate';

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

function Paras({ text }) {
  return String(text).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => <p key={p.slice(0, 48)} className="ay-ev__body">{p}</p>);
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

export default function ProductEvidence({ product, aynaData = null, aynaRating = null, ratingCount = 0, rateControls = null, recall = null, alertText = '' }) {
  const d = useMemo(() => {
    if (!product) return null;
    const brand = product.brand || '';
    const pp = getPassport(product);
    const independent = product.clinicianOpinionSource !== 'brand';
    const clinicalLinks = collect([...(product.doctorOpinionCitations || []), ...getVerificationLinks(product, 'doctor')], brand);
    const ingredients = (product.ingredientScience || []).filter((i) => i?.name).map((i) => ({
      name: noDash(i.name), text: noDash(i.text), links: collect((i.citations || []).map((c) => ({ ...c, title: c.label })), brand),
    }));
    const ingredientUrls = new Set(ingredients.flatMap((i) => i.links.map((l) => l.url)));
    const studies = collect([...getVerificationLinks(product, 'scientific'), ...(product.scientificCitations || [])], brand).filter((s) => !ingredientUrls.has(s.url));
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
    };
  }, [product, aynaData]);
  const [allIngredients, setAllIngredients] = useState(false);
  if (!d) return null;

  const jumps = [['clinical', 'Clinical opinion'], ['science', 'Scientific literature'], ['reviews', 'Reviews'], ['safety', 'Safety']];
  const jump = (id) => document.getElementById(`ay-sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const shownIngredients = allIngredients ? d.ingredients : d.ingredients.slice(0, 3);
  const noReviews = !d.communityText && !d.community.length && !(ratingCount > 0) && !d.memberReviews.length;

  return (
    <div className="ay-ev2">
      <nav className="ay-ev2__jump" aria-label="On this page">
        {jumps.map(([id, label]) => <button key={id} type="button" onClick={() => jump(id)}>{label}</button>)}
      </nav>

      <section id="ay-sec-clinical" className="ay-ev2__sec" aria-labelledby="ay-clinical-h">
        <header className="ay-ev2__head">
          <h2 id="ay-clinical-h">Clinical opinion</h2>
          <span className={`ay-ev2__badge ${d.independent ? 'is-indep' : 'is-brand'}`}>{d.independent ? 'Independent sources' : 'Based on brand claims'}</span>
        </header>
        {d.clinician ? <ShortThenFull short={d.clinicianShort} full={d.clinician} /> : <p className="ay-ev__empty">No clinical opinion on file yet.</p>}
        {d.attribution && <p className="ay-ev__by">{d.attribution}</p>}
        <Links items={d.clinicalLinks} label={d.clinicalLinks.length ? plural(d.clinicalLinks.length, 'source') : ''} />
      </section>

      <section id="ay-sec-science" className="ay-ev2__sec" aria-labelledby="ay-science-h">
        <header className="ay-ev2__head"><h2 id="ay-science-h">Scientific literature</h2></header>
        {d.bottomLine && <><h3 className="ay-ev2__sub">The bottom line</h3><Paras text={d.bottomLine} /></>}
        {d.ingredients.length > 0 && <>
          <h3 className="ay-ev2__sub">What’s inside, and the research</h3>
          <ul className="ay-ev2__ingr">
            {shownIngredients.map((i) => (
              <li key={i.name}>
                <strong>{i.name}</strong>
                {i.text && <p>{i.text}</p>}
                {i.links.length > 0 && <ul className="ay-ev2__ingr-links">{i.links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer">{l.title}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a> <small>{l.publisher}</small></li>)}</ul>}
              </li>
            ))}
          </ul>
          {d.ingredients.length > 3 && <button type="button" className="ay-ev2__showall" aria-expanded={allIngredients} onClick={() => setAllIngredients((v) => !v)}>{allIngredients ? 'Show fewer' : `Show all ${d.ingredients.length}`}</button>}
        </>}
        <Links items={d.studies} label={d.studies.length ? plural(d.studies.length, 'study', 'studies') : ''} />
        {(d.ingredients.length > 0 || d.studies.length > 0) && !d.productSpecific && <p className="ay-ev__by">This research is about the ingredients or this type of product, not a study of this exact product.</p>}
        {!d.bottomLine && !d.ingredients.length && !d.studies.length && <p className="ay-ev__empty">No studies linked yet.</p>}
      </section>

      <section id="ay-sec-reviews" className="ay-ev2__sec" aria-labelledby="ay-reviews-h">
        <header className="ay-ev2__head"><h2 id="ay-reviews-h">Reviews</h2></header>
        {aynaRating != null && ratingCount > 0
          ? <p className="ay-ev__rating"><b>★ {aynaRating.toFixed(1)}</b> from {plural(ratingCount, 'ayna member')}</p>
          : d.brandRating && <p className="ay-ev__rating"><b>★ {d.brandRating.value}</b> from {d.brandRating.count} reviews <span className="ay-ev2__badge is-brand">Brand-reported, not verified by ayna</span></p>}
        {d.memberReviews.map((r) => <blockquote key={r.slice(0, 40)} className="ay-ev__quote">{r}</blockquote>)}
        {!(ratingCount > 0) && <p className="ay-ev__by">No independent ayna reviews yet.</p>}
        {d.communityText && <><h3 className="ay-ev2__sub">What people say online</h3><Paras text={d.communityText} /></>}
        <Links items={d.community} label={d.community.length ? 'Where people talk about it' : ''} />
        {!noReviews && <p className="ay-ev__by">Public posts and ratings. Not clinical evidence.</p>}
        {rateControls}
      </section>

      <section id="ay-sec-safety" className="ay-ev2__sec" aria-labelledby="ay-safety-h">
        <header className="ay-ev2__head"><h2 id="ay-safety-h">Safety</h2></header>
        {alertText && <p className="ay-ev2__alert" role="note">{noDash(alertText)}</p>}
        {(d.warnings.length > 0 || d.pregnancy) && <>
          <h3 className="ay-ev2__sub">Before you use</h3>
          <ul className="ay-ev2__list">{d.pregnancy && <li>Pregnancy: {d.pregnancy}</li>}{d.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </>}
        <dl className="ay-ev2__rows">
          {!d.isDigital && d.fdaRaw && <div><dt>FDA status</dt><dd>{d.fda?.label ? <><b>{d.fda.label}.</b> </> : null}{fmtDate(d.fdaRaw)}</dd></div>}
          {d.sideEffects && <div><dt>{d.isDigital ? 'Things to know' : 'Possible side effects'}</dt><dd>{d.sideEffects}</dd></div>}
          {d.allergens && <div><dt>Allergens</dt><dd>{d.allergens}</dd></div>}
          {d.avoidIf.length > 0 && <div><dt>Skip if you react to</dt><dd>{d.avoidIf.join(', ')}</dd></div>}
          {!d.isDigital && recall && recall.status !== 'unknown' && <div><dt>Recalls</dt><dd>{recall.status === 'none' ? 'No recalls found.' : noDash(recall.detail || recall.label || '')}</dd></div>}
          {d.privacy && meaningful(d.privacy.dataStorage) && <div><dt>Data storage</dt><dd>{noDash(d.privacy.dataStorage)}</dd></div>}
          {d.privacy && meaningful(d.privacy.keyPolicy) && <div><dt>Privacy</dt><dd>{noDash(d.privacy.keyPolicy)}</dd></div>}
        </dl>
        <Links items={d.safetyLinks} label={d.safetyLinks.length ? 'Safety sources' : ''} />
      </section>
    </div>
  );
}

