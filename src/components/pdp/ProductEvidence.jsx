import React, { useMemo, useState } from 'react';
import { getVerificationLinks, hostLabel } from '../../utils/verificationLinks';
import { humanPublisher } from './glance';
import { ALL_PRODUCTS } from '../../data/products';
import { productHref, isPlainLeftClick } from '../../utils/productRoute';

/**
 * The four evidence tabs the team curated for every product, shown word for
 * word: ayna summary, Clinician opinion, Scientific literature and Reviews.
 * Each tab's own links sit right under its text, with the summary written
 * for each link. Nothing here is rewritten or shortened; only em dashes are
 * swapped for commas (site rule).
 */

const noDash = (t) => String(t || '').replace(/\s*—\s*/g, ', ').replace(/^,\s*/, '').trim();
const meaningful = (v) => { const t = String(v || '').trim(); return t && !/^(n\/?a|none|not applicable|unknown)$/i.test(t) ? t : ''; };
const PLATFORM = { reddit: 'Reddit', tiktok: 'TikTok', youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook', wikipedia: 'Wikipedia' };

function publisherOf(url, fallback) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return humanPublisher(host) || hostLabel(url) || fallback || host;
  } catch { return fallback || ''; }
}

function collect(entries) {
  const seen = new Set();
  const out = [];
  entries.forEach((e) => {
    const url = e && (e.url || e.href);
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push({ url, title: noDash(e.title || e.text || e.label || publisherOf(url)), summary: e.summary ? noDash(e.summary) : '', year: e.year || '', publisher: e.platform ? (PLATFORM[e.platform] || publisherOf(url)) : publisherOf(url) });
  });
  return out;
}

/** "(see LOLA Organic Tampons for the founder story)" becomes a real link. */
function splitCrossRef(text) {
  const m = String(text || '').match(/\s*\(see ([^()]+?) for (?:the )?([^()]+)\)/i);
  if (!m) return { text, ref: null };
  const target = ALL_PRODUCTS.find((p) => String(p?.name || '').toLowerCase() === m[1].trim().toLowerCase()) || null;
  return { text: String(text).replace(m[0], ''), ref: target ? { product: target, what: m[2].trim() } : null };
}

function Links({ items, label = 'Sources' }) {
  if (!items.length) return null;
  return (
    <div className="ay-ev__links">
      <p className="ay-ev__links-h">{label} <span>{items.length}</span></p>
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

function Text({ text }) {
  return String(text).split(/\n{2,}/).map((para) => para.trim()).filter(Boolean).map((para) => <p key={para.slice(0, 40)} className="ay-ev__body">{para}</p>);
}

export default function ProductEvidence({ product, aynaData = null, aynaRating = null, ratingCount = 0, rateControls = null, onOpenProduct = null }) {
  const data = useMemo(() => {
    if (!product) return null;
    const brandVoice = product.clinicianOpinionSource === 'brand';
    const summaryRaw = splitCrossRef(meaningful(product.summary) || meaningful(product.effectiveness));
    const science = collect([
      ...getVerificationLinks(product, 'scientific'),
      ...(product.scientificCitations || []),
      ...(product.ingredientScience || []).flatMap((item) => (item.citations || []).map((c) => ({ ...c, title: c.label || `${item.name} fact sheet` }))),
    ]);
    const clinical = collect([...(product.doctorOpinionCitations || []), ...getVerificationLinks(product, 'doctor')]);
    const community = collect([
      ...(product.communityReviewSourceUrl ? [{ url: product.communityReviewSourceUrl, text: product.communityReviewSourceLabel }] : []),
      ...getVerificationLinks(product, 'community'),
    ]);
    return {
      brandVoice,
      summary: noDash(summaryRaw.text),
      summaryRef: summaryRaw.ref,
      effectiveness: meaningful(product.summary) ? noDash(meaningful(product.effectiveness)) : '',
      clinician: noDash(meaningful(product.doctorOpinion)),
      attribution: noDash(meaningful(product.clinicianAttribution)),
      clinical,
      science,
      community,
      communityText: noDash(meaningful(product.communityReview)),
      memberReviews: (aynaData?.reviews || []).map((r) => noDash(r?.text)).filter(Boolean).slice(0, 3),
      evidenceStrength: meaningful(product.evidenceStrength),
    };
  }, [product, aynaData]);
  const [tab, setTab] = useState('summary');
  if (!data) return null;

  const tabs = [
    { id: 'summary', label: 'ayna summary', count: null, tone: 'butter' },
    { id: 'clinician', label: data.brandVoice ? 'From the brand' : 'Clinician opinion', count: data.clinical.length, tone: 'sky' },
    { id: 'science', label: 'Scientific literature', count: data.science.length, tone: 'rose' },
    { id: 'reviews', label: 'Reviews', count: data.community.length + (ratingCount || 0), tone: 'ink' },
  ];
  const cur = tabs.find((t) => t.id === tab) || tabs[0];
  const keyNav = (e) => {
    const i = tabs.findIndex((t) => t.id === tab);
    const next = e.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length] : e.key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length] : null;
    if (!next) return;
    e.preventDefault();
    setTab(next.id);
    window.requestAnimationFrame(() => document.getElementById(`ay-ev-tab-${next.id}`)?.focus());
  };

  return (
    <section className="ay-story ay-ev" aria-labelledby="ay-ev-h">
      <h2 id="ay-ev-h">What we <em>found</em></h2>
      <div className="ay-ev__tabs" role="tablist" aria-label="Evidence" onKeyDown={keyNav}>
        {tabs.map((t) => (
          <button key={t.id} id={`ay-ev-tab-${t.id}`} type="button" role="tab" aria-selected={t.id === tab} aria-controls="ay-ev-panel" tabIndex={t.id === tab ? 0 : -1} className={`ay-ev__tab is-${t.tone}${t.id === tab ? ' is-on' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}{t.count ? <b>{t.count}</b> : null}
          </button>
        ))}
      </div>
      <div id="ay-ev-panel" role="tabpanel" aria-labelledby={`ay-ev-tab-${cur.id}`} className={`ay-ev__panel is-${cur.tone}`}>
        {cur.id === 'summary' && <>
          {data.summary ? <Text text={data.summary} /> : <p className="ay-ev__empty">No summary on file yet.</p>}
          {data.summaryRef && (
            <p className="ay-ev__body">See <a href={productHref(data.summaryRef.product.id)} onClick={(e) => { if (!onOpenProduct || !isPlainLeftClick(e)) return; e.preventDefault(); onOpenProduct(data.summaryRef.product); }}>{data.summaryRef.product.name}</a> for the {data.summaryRef.what}.</p>
          )}
          {data.evidenceStrength && <p className="ay-ev__strength">Evidence level on file: <b>{data.evidenceStrength}</b></p>}
          <Links items={[...data.clinical, ...data.science].slice(0, 4)} label="Key sources" />
        </>}
        {cur.id === 'clinician' && <>
          {data.clinician ? <Text text={data.clinician} /> : <p className="ay-ev__empty">No clinician opinion on file yet.</p>}
          {data.attribution && <p className="ay-ev__by">{data.attribution}</p>}
          <Links items={data.clinical} />
        </>}
        {cur.id === 'science' && <>
          {data.effectiveness && <Text text={data.effectiveness} />}
          <Links items={data.science} label="Studies and research" />
          {!data.effectiveness && !data.science.length && <p className="ay-ev__empty">No studies linked yet.</p>}
        </>}
        {cur.id === 'reviews' && <>
          {aynaRating != null && ratingCount > 0 && <p className="ay-ev__rating"><b>★ {aynaRating.toFixed(1)}</b> from {ratingCount} ayna member{ratingCount === 1 ? '' : 's'}</p>}
          {data.memberReviews.map((r) => <blockquote key={r.slice(0, 40)} className="ay-ev__quote">{r}</blockquote>)}
          {data.communityText && <><Text text={data.communityText} /><p className="ay-ev__by">A summary of public posts. Not verified, and not medical advice.</p></>}
          <Links items={data.community} label="Where people talk about it" />
          {!data.communityText && !data.community.length && !(ratingCount > 0) && <p className="ay-ev__empty">No reviews yet. Be the first.</p>}
          {rateControls}
        </>}
      </div>
    </section>
  );
}
