import React, { useState, useMemo, useEffect } from 'react';
import ProductEvidenceRail from './ProductEvidenceRail';
import { getProfileMatchLabelsForProduct, getProfileMatchPercentForProduct, CATEGORY_LABELS } from '../data/products';
import { getAynaRating } from '../data/aynaReviews';
import { resolveProductImage, isPlaceholderProductImage } from '../utils/resolveProductImage';
import { isPartnerBrandItem } from '../utils/partnerBrands';
import { handleImageErrorWithRetry } from '../utils/imageRetry';
import posthog from 'posthog-js';

/** Remembers whether this browser prefers the tabs (1f) or evidence rail (1g) layout. */
const PRODUCT_VIEW_KEY = 'ayna_product_detail_view_v1';

const AYNA_TABS = [
  { id: 'summary', label: 'Ayna summary' },
  { id: 'clinician', label: 'Clinician opinion' },
  { id: 'community', label: 'Community' },
  { id: 'specs', label: 'Specs' },
];

function truncate(s, max) {
  if (!s || typeof s !== 'string') return '';
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** First sentence only, so a long safety/materials blob stays a spec row, not a paragraph — cut on a word boundary. */
function firstSentence(text, max = 140) {
  const t = String(text || '').trim();
  if (!t) return '';
  const cut = t.split(/(?<=[.!?])\s/)[0] || t;
  if (cut.length <= max) return cut;
  const truncated = cut.slice(0, max);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}…`;
}

// A short, real name for a source URL's host — used for the small chips on the
// Ayna summary card. Falls back to a title-cased guess from the domain itself
// rather than a generic "Source" label, but never invents an institution name
// that isn't actually the linked domain.
const FRIENDLY_HOSTS = {
  'acog.org': 'ACOG',
  'www.acog.org': 'ACOG',
  'mayoclinic.org': 'Mayo Clinic',
  'www.mayoclinic.org': 'Mayo Clinic',
  'fda.gov': 'FDA',
  'www.fda.gov': 'FDA',
  'pubmed.ncbi.nlm.nih.gov': 'PubMed',
  'ncbi.nlm.nih.gov': 'NIH',
  'www.ncbi.nlm.nih.gov': 'NIH',
  'nih.gov': 'NIH',
  'www.nih.gov': 'NIH',
  'cdc.gov': 'CDC',
  'www.cdc.gov': 'CDC',
  'medlineplus.gov': 'MedlinePlus',
  'reddit.com': 'Reddit',
  'www.reddit.com': 'Reddit',
  'tiktok.com': 'TikTok',
  'www.tiktok.com': 'TikTok',
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'instagram.com': 'Instagram',
  'www.instagram.com': 'Instagram',
  'facebook.com': 'Facebook',
  'nytimes.com': 'NYT Wirecutter',
  'thewirecutter.com': 'NYT Wirecutter',
  'instyle.com': 'InStyle',
  'hopkinsmedicine.org': 'Johns Hopkins Medicine',
  'www.hopkinsmedicine.org': 'Johns Hopkins Medicine',
  'healthline.com': 'Healthline',
  'www.healthline.com': 'Healthline',
  'webmd.com': 'WebMD',
  'www.webmd.com': 'WebMD',
};

function hostLabel(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (FRIENDLY_HOSTS[host]) return FRIENDLY_HOSTS[host];
    const parts = host.split('.');
    const base = parts.length >= 2 ? parts[parts.length - 2] : host;
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return null;
  }
}

function humanizeTag(tag) {
  return String(tag || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * The three short fact rows shown in the evidence layout's center column,
 * next to the product name (mockup 1g: "Best for / Time per day / Skip if").
 * Our catalog has no per-product usage cadence, so this maps the mockup's
 * intent onto the real fields we do have and only returns rows with
 * something real to say.
 */
function buildFactRows(product) {
  const bestFor = (product.healthFunctions || []).concat(product.tags || [])
    .slice(0, 3)
    .map(humanizeTag)
    .join(', ');
  const materials = firstSentence(product.safety?.materials, 56);
  const skipIf = firstSentence(product.safety?.sideEffects, 56) || firstSentence(product.safety?.allergens, 56);
  return [
    bestFor ? { label: 'Best for', value: bestFor } : null,
    materials ? { label: 'Materials', value: materials } : null,
    skipIf ? { label: 'Skip if', value: skipIf } : null,
  ].filter(Boolean);
}

const PLATFORM_LABELS = {
  reddit: 'Reddit',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
};

function normalizePercent(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  if (pct < 0 || pct > 100) return null;
  return Math.round(pct);
}

function getRealMatchPercent(product) {
  const candidates = [
    product?.matchPercentage,
    product?.matchPercent,
    product?.matchScore,
    product?.aynaMatchPercentage,
    product?.aynaMatchPercent,
    product?.aynaMatch,
  ];
  for (const value of candidates) {
    const pct = normalizePercent(value);
    if (pct != null) return pct;
  }
  return null;
}

function getBuyUrl(product) {
  const directCandidates = [
    product?.affiliateUrl,
    product?.buyUrl,
    product?.productUrl,
    product?.url,
  ];
  for (const candidate of directCandidates) {
    const url = String(candidate || '').trim();
    if (/^https?:\/\//i.test(url)) return url;
  }

  const shops = Array.isArray(product?.whereToBuy) ? product.whereToBuy : [];
  for (const shop of shops) {
    const mapped = product?.whereToBuyLinks?.[shop];
    if (typeof mapped === 'string' && /^https?:\/\//i.test(mapped.trim())) return mapped.trim();
  }

  if (product?.whereToBuyLinks && typeof product.whereToBuyLinks === 'object') {
    for (const mapped of Object.values(product.whereToBuyLinks)) {
      if (typeof mapped === 'string' && /^https?:\/\//i.test(mapped.trim())) return mapped.trim();
    }
  }
  return null;
}

export default function ProductModal({
  product,
  onOmit,
  isOmitted,
  onToggleCompare,
  isInCompare,
  onAddToEcosystem,
  isInEcosystem,
  onToggleSaved,
  isSaved = false,
  aynaReviews = null,
  onRate,
  onReview,
  quizResults = null,
  healthProfile = null,
  ecosystemProducts = null,
  // Navigates to another product's own dedicated page (e.g. from "Pairs
  // with your ecosystem"). Same handler every other product card in the
  // app already uses — clicking one here is real in-app navigation, not a
  // nested modal.
  onOpenProduct = null,
}) {
  // The mockup draws the product page two ways — 1f, tabs with the Ayna
  // summary, and 1g, an evidence rail beside the specs. Both are built, and
  // this toggle switches between them so MVP users can tell us which one
  // they prefer. The choice is remembered per browser and reported to PostHog.
  const [detailView, setDetailView] = useState(() => {
    try {
      const stored = localStorage.getItem(PRODUCT_VIEW_KEY);
      return stored === 'rail' || stored === 'tabs' ? stored : 'tabs';
    } catch {
      return 'tabs';
    }
  });
  const chooseDetailView = (next) => {
    setDetailView(next);
    try { localStorage.setItem(PRODUCT_VIEW_KEY, next); } catch { /* private mode */ }
    posthog.capture('product_detail_view_changed', { view: next, productId: product?.id });
  };

  const [activeTab, setActiveTab] = useState('summary');
  const [reviewInput, setReviewInput] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [resolvedModalImage, setResolvedModalImage] = useState('');

  // Most catalog entries only ever carry a single `image` URL — when that's a
  // placeholder, this tries once to resolve a real product photo instead.
  // There is never a plural `images` array in our data, so the gallery never
  // shows thumbnails: a fake multi-image gallery would just be invented UI.
  useEffect(() => {
    // No reset-to-'' here: App.jsx remounts this component fresh (key={id})
    // on every product change, so resolvedModalImage already starts at its
    // initial '' for the new product without an extra setState in the effect.
    let active = true;
    if (!product?.name) return () => { active = false; };
    if (!isPlaceholderProductImage(product.image)) return () => { active = false; };
    resolveProductImage(product.name, product.brand || '').then((url) => {
      if (!active || !url) return;
      setResolvedModalImage(url);
    });
    return () => { active = false; };
  }, [product?.id, product?.name, product?.brand, product?.image]);

  const heroImageSrc = resolvedModalImage || product?.image || '';

  const matchLabels = useMemo(
    () => getProfileMatchLabelsForProduct(product, quizResults, healthProfile),
    [product, quizResults, healthProfile]
  );
  const explicitMatchPercent = useMemo(() => getRealMatchPercent(product), [product]);
  const profileMatchPercent = useMemo(
    () => getProfileMatchPercentForProduct(product, quizResults, healthProfile),
    [product, quizResults, healthProfile]
  );
  const hasEcosystemContext = isInEcosystem || (Array.isArray(ecosystemProducts) && ecosystemProducts.length > 0);
  const matchPercent = explicitMatchPercent ?? (hasEcosystemContext ? profileMatchPercent : null);
  const headMatchLabel = matchLabels[0] || null;
  const buyUrl = useMemo(() => getBuyUrl(product), [product]);

  const aynaData = useMemo(
    () => (aynaReviews && product ? (aynaReviews[product.id] || { ratings: [], reviews: [] }) : { ratings: [], reviews: [] }),
    [aynaReviews, product]
  );
  const aynaReviewCount = (aynaData.reviews || []).length;
  const aynaRating = getAynaRating(product, aynaData) ?? product?.userRating ?? null;

  // Board 1f's "Pairs with your ecosystem" strip. The mockup hardcodes four
  // sample products — this uses the signed-in user's own tracked products
  // instead, so it's never invented. Hidden entirely when she has none yet,
  // rather than backfilling with catalog filler that isn't actually "hers".
  const pairsWithEcosystem = useMemo(() => {
    if (!Array.isArray(ecosystemProducts) || !product) return [];
    return ecosystemProducts
      .filter((p) => p && p.id && p.id !== product.id && p.name)
      .slice(0, 4);
  }, [ecosystemProducts, product]);

  const eyebrow = useMemo(() => {
    if (!product) return '';
    const categoryLabel = String(CATEGORY_LABELS[product.category] || product.category || '').replace(/^[^\w]+\s*/, '');
    return [categoryLabel, product.brand].filter(Boolean).join(' · ').toUpperCase();
  }, [product]);

  // Ayna summary card: the catalog's own short, single-sentence fields —
  // never a live AI call, so there's no loading state, quota, or paywall to
  // show, and nothing here is longer than what's actually on file.
  const summarySentences = useMemo(() => {
    if (!product) return [];
    const parts = [product.summary, product.effectiveness]
      .map((s) => (s || '').trim())
      .filter(Boolean);
    const out = [];
    for (const p of parts) {
      const already = out.some((o) => o.toLowerCase() === p.toLowerCase() || o.toLowerCase().includes(p.slice(0, 30).toLowerCase()));
      if (!already) out.push(p);
    }
    return out.slice(0, 2);
  }, [product]);

  const sourceCounts = useMemo(() => {
    const doctor = product?.verificationLinks?.doctor?.links?.length || 0;
    const scientific = product?.verificationLinks?.scientific?.links?.length || 0;
    const community = product?.verificationLinks?.community?.links?.length || 0;
    return { doctor, scientific, community, total: doctor + scientific + community };
  }, [product]);

  const sourceChips = useMemo(() => {
    if (!product) return [];
    const allLinks = [
      ...(product.verificationLinks?.doctor?.links || []),
      ...(product.verificationLinks?.scientific?.links || []),
    ];
    const labels = [];
    for (const link of allLinks) {
      const label = hostLabel(link.url || link.href);
      if (label && !labels.includes(label)) labels.push(label);
      if (labels.length >= 2) break;
    }
    if (aynaReviewCount > 0) labels.push(`${aynaReviewCount} community report${aynaReviewCount === 1 ? '' : 's'}`);
    return labels.slice(0, 3);
  }, [product, aynaReviewCount]);

  const communityTags = useMemo(() => {
    const links = product?.verificationLinks?.community?.links || [];
    const labels = [];
    for (const link of links) {
      const label = PLATFORM_LABELS[link.platform] || null;
      if (label && !labels.includes(label)) labels.push(label);
      if (labels.length >= 3) break;
    }
    return labels;
  }, [product]);

  const communitySnippets = useMemo(() => {
    if ((aynaData.reviews || []).length > 0) {
      return aynaData.reviews.slice(0, 2).map((r) => truncate(r.text, 220)).filter(Boolean);
    }
    if (product?.communityReview) return [truncate(product.communityReview, 220)];
    return [];
  }, [aynaData, product]);

  const specRows = useMemo(() => {
    if (!product) return [];
    const categoryLabel = String(CATEGORY_LABELS[product.category] || product.category || '').replace(/^[^\w]+\s*/, '');
    const materials = firstSentence(product.safety?.materials, 160);
    const whereToBuy = Array.isArray(product.whereToBuy) ? product.whereToBuy.slice(0, 3).join(', ') : '';
    return [
      product.brand ? { label: 'Brand', value: product.brand } : null,
      categoryLabel ? { label: 'Category', value: categoryLabel } : null,
      product.price ? { label: 'Price', value: product.price } : null,
      materials ? { label: 'Materials', value: materials } : null,
      whereToBuy ? { label: 'Where to buy', value: whereToBuy } : null,
    ].filter(Boolean);
  }, [product]);

  const factRows = useMemo(() => (product ? buildFactRows(product) : []), [product]);

  if (!product) return null;

  const ecosystemBtnLabel = isInEcosystem ? 'In ecosystem' : 'Add to ecosystem';
  const wishlistBtnLabel = isSaved ? 'Wishlisted' : 'Wishlist';

  const actionButtons = (
    <div className="pdp-actions">
      <div className="pdp-actions__primary">
        {buyUrl ? (
          <a
            className="pdp-btn pdp-btn--navy pdp-btn--buy"
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('product_buy_now_clicked', {
              productId: product.id,
              category: product.category,
              destination: buyUrl,
            })}
          >
            Buy Now
          </a>
        ) : (
          <button type="button" className="pdp-btn pdp-btn--navy pdp-btn--buy" disabled>
            Buy Now
          </button>
        )}
        {onToggleSaved && (
          <button
            type="button"
            className={`pdp-btn ${isSaved ? 'pdp-btn--outline-on' : 'pdp-btn--outline'}`}
            aria-pressed={isSaved}
            onClick={() => onToggleSaved(product)}
          >
            {wishlistBtnLabel}
          </button>
        )}
      </div>
      {onAddToEcosystem && (
        <button
          type="button"
          className="pdp-actions__ecosystem"
          aria-pressed={isInEcosystem}
          onClick={() => onAddToEcosystem(product)}
        >
          {ecosystemBtnLabel}
        </button>
      )}
      {isPartnerBrandItem(product) && (
        <span className="pdp-head__badge" title="Ayna has a partnership with this brand — it does not affect your recommendation.">
          🤝 Ayna Partner
        </span>
      )}
    </div>
  );

  const galleryTile = (
    <div className="pdp-head__tile">
      {heroImageSrc && !isPlaceholderProductImage(heroImageSrc) ? (
        <img
          src={heroImageSrc}
          alt={product.name}
          onError={(e) => handleImageErrorWithRetry(e, () => { e.currentTarget.style.display = 'none'; })}
        />
      ) : (
        <span className="pdp-head__initial" aria-hidden="true">
          {String(product.brand || product.name || '?').trim().charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );

  const relatedGrid = pairsWithEcosystem.length > 0 && (
    <div style={{ padding: '0 clamp(1rem, 5vw, 2.5rem) 2.5rem' }}>
      <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.4rem', marginBottom: '1.25rem' }}>
        Pairs with your ecosystem
      </h3>
      <div className="pdp-related-grid">
        {pairsWithEcosystem.map((related) => (
          <button
            key={related.id}
            type="button"
            onClick={() => onOpenProduct && onOpenProduct(related)}
            style={{
              background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 0,
            }}
          >
            <span style={{
              aspectRatio: '1.2', borderRadius: '8px',
              background: 'linear-gradient(160deg, #F3EADC, #EFE3D2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '2rem', color: '#D9A96B',
              overflow: 'hidden',
            }} aria-hidden="true">
              {related.image && !isPlaceholderProductImage(related.image) ? (
                <img
                  src={related.image}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => handleImageErrorWithRetry(e, () => { e.currentTarget.style.display = 'none'; })}
                />
              ) : (
                String(related.brand || related.name || '?').trim().charAt(0).toUpperCase()
              )}
            </span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', lineHeight: 1.3, marginTop: '0.6rem', color: 'var(--color-text-main)' }}>
              {related.name}
            </span>
            {related.price && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                {related.price}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mockup-page" style={{ marginTop: '2rem', marginBottom: '3rem' }}>
      <div style={{
        backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: 'min(1180px, 100%)', margin: '0 auto',
        boxShadow: 'var(--shadow-lg)', position: 'relative'
      }}>

        {/* Which of the mockup's two product layouts to show (1f / 1g). */}
        <div className="pdp-viewswitch" style={{ paddingTop: '1.5rem' }}>
          <div className="pdp-viewswitch__group" role="group" aria-label="Product detail layout">
            <button
              type="button"
              className={detailView === 'tabs' ? 'is-active' : undefined}
              aria-pressed={detailView === 'tabs'}
              onClick={() => chooseDetailView('tabs')}
            >
              Summary
            </button>
            <button
              type="button"
              className={detailView === 'rail' ? 'is-active' : undefined}
              aria-pressed={detailView === 'rail'}
              onClick={() => chooseDetailView('rail')}
            >
              Evidence
            </button>
          </div>
        </div>

        {detailView === 'tabs' && (<>
          {/* Product head — mockup board 1f: square product tile beside the
              eyebrow / name / price / actions column. */}
          <div className="pdp-head">
            {galleryTile}

            <div className="pdp-head__detail">
              <div className="pdp-head__eyebrow">{eyebrow}</div>

              <h2 className="pdp-head__name">{product.name}</h2>

              <div className="pdp-head__pricerow">
                {(product.price || product.stage) && (
                  <span className="pdp-head__price">{product.price || product.stage}</span>
                )}
                {matchPercent != null ? (
                  <span className="pdp-head__match">{matchPercent}% match</span>
                ) : isInEcosystem ? (
                  <span className="pdp-head__match">In your ecosystem</span>
                ) : headMatchLabel ? (
                  <span className="pdp-head__match">{headMatchLabel}</span>
                ) : null}
              </div>

              {actionButtons}

              {/* Small tabs, matching mockup 1f — dark underline on the active
                  tab, muted text on the rest, one compact card below. */}
              <div className="pdp-tabpanel">
                <div className="pdp-tabs" role="tablist" aria-label="Product information">
                  {AYNA_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      className={activeTab === tab.id ? 'is-active' : undefined}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'summary' && (
                  <div className="pdp-summary-card">
                    {sourceCounts.total > 0 && (
                      <div className="pdp-summary-card__meta">
                        <span className="pdp-summary-card__dot" />
                        AYNA SUMMARY · {sourceCounts.total} SOURCE{sourceCounts.total === 1 ? '' : 'S'}
                      </div>
                    )}
                    {summarySentences.length > 0 ? (
                      <p className="pdp-summary-card__body">{summarySentences.join(' ')}</p>
                    ) : (
                      <p className="pdp-summary-card__empty">No summary yet.</p>
                    )}
                    {sourceChips.length > 0 && (
                      <div className="pdp-summary-card__chips">
                        {sourceChips.map((chip) => (
                          <span key={chip} className="pdp-head__badge">{chip}</span>
                        ))}
                      </div>
                    )}
                    <div className="pdp-summary-card__foot">Research + review summary. Not medical advice.</div>
                  </div>
                )}

                {activeTab === 'clinician' && (
                  <div className="pdp-summary-card">
                    {product.doctorOpinion ? (
                      <>
                        <p className="pdp-summary-card__body" style={{ marginTop: 0 }}>{product.doctorOpinion}</p>
                        {product.clinicianAttribution && (
                          <div className="pdp-summary-card__foot">{product.clinicianAttribution}</div>
                        )}
                      </>
                    ) : (
                      <p className="pdp-summary-card__empty">No clinician note yet.</p>
                    )}
                  </div>
                )}

                {activeTab === 'community' && (
                  <div className="pdp-summary-card">
                    {(aynaRating != null || aynaReviewCount > 0) && (
                      <div className="pdp-community__rating">
                        {aynaRating != null && <strong>{aynaRating.toFixed(1)}</strong>}
                        {aynaReviewCount > 0 && <span>{aynaReviewCount} review{aynaReviewCount === 1 ? '' : 's'}</span>}
                      </div>
                    )}
                    {communitySnippets.length > 0 ? (
                      communitySnippets.map((snippet, i) => (
                        <p key={i} className="pdp-community__snippet">{snippet}</p>
                      ))
                    ) : aynaRating == null && aynaReviewCount === 0 ? (
                      <p className="pdp-summary-card__empty">No community notes yet.</p>
                    ) : null}
                    {communityTags.length > 0 && (
                      <div className="pdp-summary-card__chips">
                        {communityTags.map((tag) => (
                          <span key={tag} className="pdp-head__badge">{tag}</span>
                        ))}
                      </div>
                    )}
                    {isInEcosystem && onRate && (
                      <>
                        <div className="pdp-community__rate">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className={`pdp-community__star${star <= (hoverRating || 0) ? ' is-on' : ''}`}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => onRate(product, star)}
                              aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        {onReview && (
                          <div className="pdp-community__reviewrow">
                            <input
                              type="text"
                              value={reviewInput}
                              onChange={(e) => setReviewInput(e.target.value)}
                              placeholder="Add a short review…"
                            />
                            <button
                              type="button"
                              className="pdp-btn pdp-btn--outline"
                              disabled={!reviewInput.trim()}
                              onClick={() => {
                                if (reviewInput.trim()) {
                                  onReview(product, reviewInput.trim());
                                  setReviewInput('');
                                }
                              }}
                            >
                              Post
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'specs' && (
                  <div className="pdp-summary-card">
                    {specRows.length > 0 ? (
                      <div className="pdp-rail__specs" style={{ borderTop: 'none', paddingTop: 0 }}>
                        {specRows.map((row, i) => (
                          <div key={row.label} className={`pdp-rail__spec${i === specRows.length - 1 ? ' pdp-rail__spec--last' : ''}`}>
                            <span>{row.label}</span>
                            <span>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="pdp-summary-card__empty">No specs yet.</p>
                    )}
                    {(onToggleCompare || onOmit) && (
                      <div className="pdp-specs__utility">
                        {onToggleCompare && (
                          <button type="button" className="pdp-head__link" onClick={() => onToggleCompare(product)}>
                            {isInCompare ? 'In comparison' : 'Add to compare'}
                          </button>
                        )}
                        {onOmit && (
                          <button type="button" className="pdp-head__link" onClick={() => onOmit(product)}>
                            {isOmitted ? 'Restore' : 'Omit'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {relatedGrid}
        </>)}

        {detailView === 'rail' && (
          <div className="pdp-evidence-head">
            {galleryTile}

            <div className="pdp-evidence-head__info">
              <div className="pdp-head__eyebrow">{eyebrow}</div>
              <h2 className="pdp-head__name" style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)' }}>{product.name}</h2>
              {(product.price || product.stage) && (
                <span className="pdp-head__price">{product.price || product.stage}</span>
              )}
              {summarySentences[0] && (
                <p className="pdp-evidence-head__desc">{summarySentences[0]}</p>
              )}
              {actionButtons}
              {factRows.length > 0 && (
                <div className="pdp-rail__specs">
                  {factRows.map((row, i) => (
                    <div key={row.label} className={`pdp-rail__spec${i === factRows.length - 1 ? ' pdp-rail__spec--last' : ''}`}>
                      <span>{row.label}</span>
                      <span>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ProductEvidenceRail
              product={product}
              matchLabels={matchLabels}
              matchPercent={matchPercent}
              aynaReviewCount={aynaReviewCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
