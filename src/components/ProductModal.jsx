import { getVariantSelection } from '../utils/productVariantSelection';
import { recordRetailerVisit } from '../utils/feedbackClient';
import React, { useState, useMemo, useEffect } from 'react';
import { getAppSessionId } from '../utils/conversationId';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import { getProfileMatchLabelsForProduct, getProfileMatchPercentForProduct, CATEGORY_LABELS } from '../data/products';
import { getAynaRating } from '../data/aynaReviews';
import { resolveProductImage, isPlaceholderProductImage } from '../utils/resolveProductImage';
import { isPartnerBrandItem, getPartnerDisclosureText } from '../utils/partnerBrands';
import { handleImageErrorWithRetry } from '../utils/imageRetry';
import { getSupabaseClient } from '../utils/supabaseClient';
import { renderMarkdownLite } from '../utils/renderMarkdownLite';
import MatchGauge from './MatchGauge';
import WhyMatchPanel from './WhyMatchPanel';
import { hasProfileSignal, shouldClampSummary } from '../utils/whyMatch';
import { resolveBuyUrl, isAmazonUrl, buyGoesToAmazonListing } from '../utils/buyLink';
import { getVerificationLinks, toSourceChips, hostLabel } from '../utils/verificationLinks';
import { getSafetyAlertText, buildSummarySentences } from '../utils/productSafetyAlert';
import posthog from 'posthog-js';
import { productHref } from '../utils/productRoute';

const AYNA_TABS = [
  { id: 'summary', label: 'ayna Summary' },
  { id: 'clinician', label: 'Clinician Opinion' },
  { id: 'scientific', label: 'Scientific Literature' },
  { id: 'community', label: 'Social Media + Reviews' },
  { id: 'ask', label: 'Ask Ayna' },
];

function productShareUrl(product) {
  const path = productHref(product);

  if (typeof window === 'undefined') {
    return `https://www.aynahealth.co${path}`;
  }

  const host = window.location.hostname;
  const isPreview =
    host === 'localhost'
    || host === '127.0.0.1'
    || host.endsWith('.vercel.app');

  const origin = isPreview
    ? window.location.origin
    : 'https://www.aynahealth.co';

  return `${origin}${path}`;
}

function fallbackCopyText(value) {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * Product Q&A — for a user who doesn't know what a product actually IS (a
 * real MVP report: a first-time viewer saw a "pelvic wand" and the static
 * summary didn't explain what it does or how it's used). api/product-chat.js
 * already existed, fully built and tested (auth, quota, prompt-injection
 * guards, official-site grounding) but had zero frontend callers anywhere in
 * the app — this is that first caller, not a new chat system.
 */
function AskAynaProductTab({ product, aiContext, quizResults, ecosystemProducts }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState(undefined); // undefined = still checking

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseClient();
    // getSupabaseClient() returns null when Supabase env vars aren't
    // configured (local dev without .env.local, or a misconfigured
    // deploy) — every other call site in this app treats that as "not
    // signed in" rather than crashing, so match that here.
    if (!supabase) {
      setSession(null);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data?.session || null);
    }).catch(() => { if (!cancelled) setSession(null); });
    return () => { cancelled = true; };
  }, []);

  const suggestions = [
    `What is ${product?.name ? 'this' : 'it'} and how is it used?`,
    'Who is this good for?',
    'Any safety concerns I should know about?',
  ];

  const ask = async (question) => {
    const q = String(question || '').trim();
    if (!q || sending) return;
    setError('');
    setInput('');
    const nextMessages = [...messages, { role: 'user', text: q }];
    setMessages(nextMessages);
    setSending(true);
    try {
      const token = session?.access_token;
      if (!token) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      const res = await fetch('/api/product-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          question: q,
          product,
          aiInsights: aiContext || {},
          userContext: quizResults?.fullHealthIntake ? JSON.stringify(quizResults.fullHealthIntake).slice(0, 4000) : '',
          ecosystemProducts: Array.isArray(ecosystemProducts) ? ecosystemProducts.slice(0, 20) : [],
          chatHistory: messages.slice(-6),
          conversationId: getAppSessionId(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      if (res.status === 429) throw Object.assign(new Error('weekly_limit_reached'), { code: 'weekly_limit_reached' });
      if (!res.ok || !data?.answer) throw new Error(data?.error || 'Could not get an answer right now.');
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }]);
    } catch (e) {
      if (e?.code === 'not_signed_in') {
        setError('Sign in to ask Ayna about this product — free accounts get a few AI chats per week.');
      } else if (e?.code === 'weekly_limit_reached') {
        setError("You've used your free chats for this week. They reset weekly, or upgrade for unlimited.");
      } else {
        setError(e?.message || 'Something went wrong. Try again in a moment.');
      }
      setMessages(nextMessages); // keep her question visible even though it failed
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pdp-summary-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {messages.length === 0 && (
        <>
          <p className="pdp-summary-card__body" style={{ marginTop: 0 }}>
            New to this kind of product, or not sure what it's actually for? Ask Ayna anything about it.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="pdp-head__badge"
                style={{ cursor: 'pointer', border: 'none' }}
                onClick={() => ask(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
      {messages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '320px', overflowY: 'auto' }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'user' ? 'var(--color-primary)' : 'var(--color-secondary-fade)',
                color: m.role === 'user' ? '#fff' : 'inherit',
                borderRadius: '12px',
                padding: '0.55rem 0.8rem',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.role === 'assistant' ? renderMarkdownLite(m.text) : m.text}
            </div>
          ))}
          {sending && (
            <div style={{ alignSelf: 'flex-start', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Ayna is thinking…
            </div>
          )}
        </div>
      )}
      {error && (
        <p style={{ color: 'var(--color-danger, #b3261e)', fontSize: '0.85rem', margin: 0 }}>{error}</p>
      )}
      <form
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
        style={{ display: 'flex', gap: '0.5rem' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={session === undefined ? 'Loading…' : 'Ask about this product…'}
          disabled={sending || session === undefined}
          style={{
            flex: 1, padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)', fontSize: '0.9rem', background: 'var(--color-surface)',
          }}
        />
        <button type="submit" className="pdp-btn pdp-btn--navy" disabled={sending || !input.trim() || session === undefined}>
          Ask
        </button>
      </form>
      <p className="pdp-summary-card__foot" style={{ margin: 0 }}>
        Ayna's answers are educational, not medical advice.
      </p>
    </div>
  );
}

/** Full-size photo view — click to enlarge, click backdrop/X/Escape to close. */
// A dense, un-collapsible safety paragraph (e.g. Always Infinity FlexFoam's
// ~75-word PFAS note) could push Buy Now/Wishlist below the fold on a normal
// screen — a first-time visitor scrolled straight into a wall of red-flagged
// text before ever seeing the purchase buttons (found live, 2026-08-24 bug
// bash). Collapsed to one line by default; the warning icon/label always
// stays visible (this is exactly the content that shouldn't be missable),
// only the full paragraph is hidden until tapped.
// `sources` (optional, product.safetyNoteSources): [{ url, label }] links
// backing the note, shown under the full text once it's expanded.
function SafetyAlert({ text, sources = [] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="pdp-safety-alert">
      <button
        type="button"
        className="pdp-safety-alert__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <strong>Safety note</strong>
        <span className="pdp-safety-alert__chevron" aria-hidden="true">{expanded ? '▴' : '▾'}</span>
      </button>
      {expanded ? (
        <>
          <p>{text}</p>
          {sources.length > 0 && (
            <ul className="pdp-safety-alert__sources" style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.8125rem', lineHeight: 1.5 }}>
              {sources.map((src) => (
                <li key={src.url}>
                  <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                    {src.label || hostLabel(src.url)}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="pdp-safety-alert__preview">{text}</p>
      )}
    </div>
  );
}

function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Product photo'}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 4000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(20, 16, 12, 0.82)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        padding: '2rem', cursor: 'zoom-out',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute', top: '1.25rem', right: '1.5rem',
          background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
          width: '2.25rem', height: '2.25rem', borderRadius: '50%',
          fontSize: '1.25rem', lineHeight: 1, cursor: 'pointer',
        }}
      >
        ×
      </button>
      <img
        src={src}
        alt={alt || ''}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain',
          borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', cursor: 'default',
        }}
      />
    </div>
  );
}

function truncate(s, max) {
  if (!s || typeof s !== 'string') return '';
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

// getSafetyAlertText and buildSummarySentences now live in
// ../utils/productSafetyAlert (getSafetyAlertText is shared with
// Discovery.jsx's safety scoring and Recommendations.jsx's "Safety note"
// badge, which independently duplicated this check). Re-exported here so
// existing imports of them from this module keep working.
export { getSafetyAlertText, buildSummarySentences } from '../utils/productSafetyAlert';

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
  // Not truncated like the other rows — a curated materials/ingredient list
  // (e.g. Neycher's) is meant to be read in full here, not cut at the first
  // period.
  const materials = (product.safety?.materials || '').trim();
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
  // Set only when this product page was reached by clicking a search
  // result — lets buy-now carry the same searchQuery so PostHog can trace
  // search -> click -> purchase.
  searchOrigin = null,
  // Optional: renders a visible in-page "Back" control. Product pages are
  // real routes (/product/:id) reachable via direct/shared links, so unlike
  // a nested modal there's no other on-screen way back to Discovery.
  onBack = null,
  // Community entry points (recommend to a friend, add to playlist, write a
  // review). Rendered under the buy/save actions; null when signed out.
  communitySlot = null,
  // Optional: starts the quiz / ecosystem builder. When passed, viewers with
  // no profile yet see a "Build your ecosystem to see your match" CTA where
  // the match % would be.
  onStartQuiz = null,
  // Optional: opens the health-profile editor from the "not enough to score"
  // state of the match breakdown.
  onEditHealthProfile = null,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(product.defaultVariantId || '');
  const choice = getVariantSelection(product, selectedVariantId);
  const displayName = choice.displayName;

  const [reviewInput, setReviewInput] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [resolvedModalImage, setResolvedModalImage] = useState(null);
  const imageIdentity = JSON.stringify([product?.id, product?.name, product?.brand, product?.url, product?.type, product?.image]);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [whyMatchOpen, setWhyMatchOpen] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

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
    if (!isPlaceholderProductImage(product.image, product.type === 'digital')) return () => { active = false; };
    resolveProductImage(product.name, product.brand || '', product.url || '', product.type || '').then((url) => {
      if (!active || !url) return;
      setResolvedModalImage({ identity: imageIdentity, url });
    });
    return () => { active = false; };
  }, [imageIdentity, product?.id, product?.name, product?.brand, product?.image, product?.url, product?.type]);

  const heroImageSrc = choice.hasVariants ? choice.image : (resolvedModalImage?.identity === imageIdentity ? resolvedModalImage.url : '') || product?.image || '';

  const matchLabels = useMemo(
    () => getProfileMatchLabelsForProduct(product, quizResults, healthProfile),
    [product, quizResults, healthProfile]
  );
  const profileMatchPercent = useMemo(
    () => getProfileMatchPercentForProduct(product, quizResults, healthProfile),
    [product, quizResults, healthProfile]
  );
  const matchPercent = profileMatchPercent;
  const headMatchLabel = matchLabels[0] || null;
  const viewerHasProfile = hasProfileSignal(quizResults, healthProfile);
  const showBuildMatchCta = matchPercent == null && !viewerHasProfile && typeof onStartQuiz === 'function';
  const toggleWhyMatch = () => {
    if (!whyMatchOpen) posthog.capture('product_why_match_opened', { productId: product?.id, matchPercent });
    setWhyMatchOpen(!whyMatchOpen);
  };
  const whyMatchPanelId = `pdp-whymatch-${product?.id || 'product'}`;
  const whyMatchPanel = whyMatchOpen && matchPercent != null ? (
    <WhyMatchPanel
      id={whyMatchPanelId}
      product={product}
      quizResults={quizResults}
      healthProfile={healthProfile}
      onClose={() => setWhyMatchOpen(false)}
      onUpdateHealth={onEditHealthProfile}
    />
  ) : null;
  const buildMatchCta = showBuildMatchCta ? (
    <button type="button" className="pdp-buildmatch" onClick={onStartQuiz}>
      Build your ecosystem to see your match <span aria-hidden="true">→</span>
    </button>
  ) : null;
  const buyUrl = resolveBuyUrl(product, choice.variant);
  const sizeChosenOnAmazon = choice.hasVariants && buyGoesToAmazonListing(product, choice.variant);
  const isAmazonBuyLink = useMemo(() => isAmazonUrl(buyUrl), [buyUrl]);

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
    const categoryLabel = String(CATEGORY_LABELS[product.category] || product.type || '').replace(/^[^\w]+\s*/, '');
    return [categoryLabel, product.brand].filter(Boolean).join(' · ').toUpperCase();
  }, [product]);

  // ayna summary card: see buildSummarySentences for what feeds it and why.
  const summarySentences = useMemo(() => buildSummarySentences(product), [product]);

  const safetyAlert = useMemo(() => getSafetyAlertText(product), [product]);

  // "Who it's for" / "How to use" only exist as tabs for the handful of
  // products with that level of brand-supplied detail on file — inserted
  // dynamically rather than added to the static AYNA_TABS list so every
  // other product doesn't grow two permanently-empty tabs.
  const visibleTabs = useMemo(() => {
    const extra = [];
    if (Array.isArray(product?.whoItsFor) && product.whoItsFor.length > 0) {
      extra.push({ id: 'whoitsfor', label: 'Who it’s for' });
    }
    if (product?.howToUse?.steps?.length > 0) {
      extra.push({ id: 'howtouse', label: 'How to use' });
    }
    if (extra.length === 0) return AYNA_TABS;
    // After Social Media, not before — inserted ahead of 'ask' (Ask Ayna),
    // which always stays last.
    const askIdx = AYNA_TABS.findIndex((t) => t.id === 'ask');
    return [...AYNA_TABS.slice(0, askIdx), ...extra, ...AYNA_TABS.slice(askIdx)];
  }, [product]);

  const sourceCounts = useMemo(() => {
    const doctor = getVerificationLinks(product, 'doctor').length;
    const scientific = getVerificationLinks(product, 'scientific').length;
    const community = getVerificationLinks(product, 'community').length;
    return { doctor, scientific, community, total: doctor + scientific + community };
  }, [product]);

  const sourceChips = useMemo(() => {
    if (!product) return [];
    const allLinks = [
      ...getVerificationLinks(product, 'doctor'),
      ...getVerificationLinks(product, 'scientific'),
    ];
    const chips = [];
    const seenLabels = new Set();
    for (const chip of toSourceChips(allLinks)) {
      if (seenLabels.has(chip.label)) continue;
      seenLabels.add(chip.label);
      chips.push(chip);
      if (chips.length >= 2) break;
    }
    if (aynaReviewCount > 0) {
      chips.push({ label: `${aynaReviewCount} community report${aynaReviewCount === 1 ? '' : 's'}`, url: null });
    }
    return chips.slice(0, 3);
  }, [product, aynaReviewCount]);

  // The clinician-opinion tab states a claim ("hormonal birth control can
  // deplete B vitamins…") with no link a reader can check — the actual
  // citations only ever showed up as generic chips on a different tab
  // (ayna summary), disconnected from the claim they support. Flagged live
  // 2026-08-25: "if we're stating stuff we need to have links to sources."
  // Doctor + scientific links both back clinical claims, so both show here —
  // except when a product curates its own product.scientificCitations, which
  // exists specifically so category-level citations show only on the
  // Scientific literature tab. That field is only ever non-empty alongside
  // an empty verificationLinks.scientific, which applyCatalogEvidence (in
  // catalogEvidence.js) treats as "nothing curated yet" and can backfill
  // with its own real citations — silently defeating that separation. So a
  // curated scientificCitations list means "scientific evidence for this
  // product is already handled elsewhere," and 'scientific' links are left
  // out of this chip row entirely rather than deduped link-by-link.
  const clinicianSourceLinks = useMemo(() => {
    const hasCuratedScientific = (product?.scientificCitations || []).length > 0;
    return toSourceChips([
      ...getVerificationLinks(product, 'doctor'),
      ...(hasCuratedScientific ? [] : getVerificationLinks(product, 'scientific')),
    ]);
  }, [product]);

  // Dedicated "Scientific literature" tab: every doctor + scientific citation
  // in full (not the small link-chip form used elsewhere), each with its own
  // summary/text so a reader can see what a source actually says before
  // clicking through. Flagged live 2026-08-25 — "ALL PRODUCTS MUST HAVE
  // SOURCES AND REVIEWS."
  const scientificLiteratureEntries = useMemo(() => {
    const seenUrls = new Set();
    const entries = [];
    for (const [key, kind] of [['scientific', 'Scientific'], ['doctor', 'Clinical']]) {
      for (const link of getVerificationLinks(product, key)) {
        const url = link?.url || link?.href;
        if (!url || seenUrls.has(url)) continue;
        const label = hostLabel(url);
        if (!label) continue;
        seenUrls.add(url);
        entries.push({ url, label, kind, text: link.text || null, summary: link.summary || null });
      }
    }
    return entries;
  }, [product]);

  // Curated category-level citations (product.scientificCitations) — kept
  // out of verificationLinks for the same reason as ingredientCitationEntries
  // below: that data also feeds the Clinician opinion card's chip row, which
  // here only wants doctorOpinionCitations (the two clinical-study links).
  // Excludes any URL already surfaced by scientificLiteratureEntries — a
  // product left with an empty verificationLinks.scientific can get real
  // citations auto-restored there (see applyCatalogEvidence in
  // catalogEvidence.js), and those restored links sometimes cite the exact
  // same paper this curated list already names.
  const curatedScientificEntries = useMemo(() => {
    const seenUrls = new Set(scientificLiteratureEntries.map((e) => e.url));
    const entries = [];
    for (const c of product?.scientificCitations || []) {
      if (!c.url || seenUrls.has(c.url)) continue;
      const label = hostLabel(c.url);
      if (!label) continue;
      seenUrls.add(c.url);
      entries.push({ url: c.url, label, kind: 'Scientific', text: c.text || null, summary: c.summary || null });
    }
    return entries;
  }, [product, scientificLiteratureEntries]);

  // Per-ingredient citations, rendered as extra cards on the Scientific
  // literature tab only — deliberately NOT part of verificationLinks, since
  // that also feeds the Clinician opinion card's chip row (pools doctor +
  // scientific), and several ingredient-level NIH links there would bury the
  // 1-2 study-level citations that chip row actually wants to surface.
  // Same cross-source dedup as curatedScientificEntries above.
  const ingredientCitationEntries = useMemo(() => {
    const seenUrls = new Set([
      ...scientificLiteratureEntries.map((e) => e.url),
      ...curatedScientificEntries.map((e) => e.url),
    ]);
    const entries = [];
    for (const item of product?.ingredientScience || []) {
      // When one ingredient entry cites more than one source, the
      // citation's own label distinguishes the cards instead of both
      // showing the same shared ingredient name and text.
      const multi = (item.citations || []).length > 1;
      for (const c of item.citations || []) {
        if (!c.url || seenUrls.has(c.url)) continue;
        const label = hostLabel(c.url);
        if (!label) continue;
        seenUrls.add(c.url);
        entries.push({ url: c.url, label, kind: 'Scientific', text: multi ? c.label : item.name, summary: item.text });
      }
    }
    return entries;
  }, [product, scientificLiteratureEntries, curatedScientificEntries]);

  // Every social-media "review" now carries its own link, right next to the
  // review text it belongs to — the old version showed a synthesized
  // paragraph with 3 generic platform badges underneath, disconnected from
  // any specific claim. Flagged live 2026-08-25: "the social media page must
  // have reviews with links." Falls back to the synthesized summary only
  // when there's no real per-source citation to show instead.
  const communityCitationEntries = useMemo(() => {
    const seenUrls = new Set();
    const entries = [];
    for (const link of getVerificationLinks(product, 'community')) {
      const url = link?.url || link?.href;
      if (!url || seenUrls.has(url)) continue;
      const label = PLATFORM_LABELS[link.platform] || hostLabel(url);
      if (!label) continue;
      seenUrls.add(url);
      entries.push({ url, label, text: link.text || null, summary: link.summary || null });
    }
    return entries;
  }, [product]);

  const communitySnippets = useMemo(() => {
    // The Community tab is where someone reads the full thing, not a
    // preview card — a synthesized communityReview is one short paragraph
    // to begin with, so it shouldn't be cut off at all. Real user-submitted
    // reviews (aynaData.reviews) get a much more generous cap than before
    // (220 chars was cutting off ordinary-length reviews mid-sentence).
    if ((aynaData.reviews || []).length > 0) {
      return aynaData.reviews.slice(0, 2).map((r) => truncate(r.text, 2000)).filter(Boolean);
    }
    if (product?.communityReview) return [product.communityReview];
    return [];
  }, [aynaData, product]);

  const factRows = useMemo(() => (product ? buildFactRows(product) : []), [product]);

  if (!product) return null;

  const ecosystemBtnLabel = isInEcosystem ? 'In ecosystem' : 'Add to ecosystem';
  const wishlistBtnLabel = isSaved ? 'Wishlisted' : 'Wishlist';

  const shareUrl = productShareUrl(product);
  const shareText = `Check out ${product.name} on ayna.`;

  const recordShare = (channel) => {
    posthog.capture('product_shared', {
      productName: product.name,
      productPath: productHref(product),
      category: product.category,
      channel,
    });
  };

  const copyShareLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        fallbackCopyText(shareUrl);
      }

      setShareCopied(true);
      recordShare('copy_link');
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      fallbackCopyText(shareUrl);
      setShareCopied(true);
      recordShare('copy_link');
      window.setTimeout(() => setShareCopied(false), 1800);
    }
  };

  const handleShare = async () => {
    const payload = {
      title: `${product.name} | ayna`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(payload);
        recordShare('native');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    setShareMenuOpen((open) => !open);
  };

  const encodedShareText = encodeURIComponent(`${shareText}\n${shareUrl}`);
  const emailSubject = encodeURIComponent(`${product.name} | ayna`);
  const emailBody = encodeURIComponent(`${shareText}\n\n${shareUrl}`);

  const retailerName = (() => {
    try {
      const host = new URL(buyUrl).hostname.replace(/^www\./, '');
      if (/(^|\.)amazon\./.test(host) || host === 'amzn.to') return 'Amazon';
      const base = host.split('.').slice(-2, -1)[0] || host;
      return base.charAt(0).toUpperCase() + base.slice(1);
    } catch { return ''; }
  })();

  const actionButtons = (
    <div className="pdp-actions">
      {choice.hasVariants && <label style={{ display: 'block', width: '100%', marginBottom: '0.8rem', fontSize: '0.9rem' }}>
        Size / option
        <select aria-label="Size / option" value={selectedVariantId} onChange={event => setSelectedVariantId(event.target.value)} style={{ display: 'block', width: '100%', padding: '0.7rem', marginTop: '0.35rem', border: '1px solid #d6d0c7', borderRadius: '8px', background: '#fff', color: '#242a52' }}>
          <option value="">Choose a size / option</option>
          {product.variants.map(variant => <option key={variant.id} value={variant.id}>{variant.label}</option>)}
        </select>
        <small style={{ display: 'block', marginTop: '0.35rem' }}>{sizeChosenOnAmazon ? 'Buy Now opens this product on Amazon — pick the same size there. Confirm current price and availability with the retailer.' : 'Buy Now opens this exact option. Confirm current price and availability with the retailer.'}</small>
      </label>}
      <div className="pdp-actions__primary">
        {buyUrl ? (
          <a
            className="pdp-btn pdp-btn--navy pdp-btn--buy"
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              recordRetailerVisit(product, choice.variant);
              posthog.capture('product_buy_now_clicked', {
              productId: product.id,
              category: product.category,
              destination: buyUrl,
              source: searchOrigin?.source,
              searchQuery: searchOrigin?.searchQuery,
            });
            }}
          >
            {retailerName ? `Buy at ${retailerName}` : 'Buy Now'}
          </a>
        ) : (
          <button type="button" className="pdp-btn pdp-btn--navy pdp-btn--buy" disabled>
            Buy Now
          </button>
        )}
        {buyUrl && (
          <p className="pdp-buy-note">
            Opens {retailerName || 'the retailer'} in a new tab. ayna may earn a commission; price and shipping are set by the retailer.
          </p>
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
      {communitySlot}
    </div>
  );

  const galleryTile = (
    <div>
      <div className="pdp-head__tile">
        {/* resolvedModalImage, when set, came back from the server's
            type-aware /api/product-image — trust it as-is instead of
            re-running it through isPlaceholderProductImage, which doesn't
            know the product is 'digital' and would reject a legitimate
            app/telehealth logo again. Only the raw catalog fallback still
            needs that heuristic. */}
        {heroImageSrc && (resolvedModalImage || !isPlaceholderProductImage(heroImageSrc, product.type === 'digital')) ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={`View larger photo of ${displayName}`}
            style={{ all: 'unset', display: 'block', width: '100%', height: '100%', cursor: 'zoom-in' }}
          >
            <img
              key={heroImageSrc}
              src={heroImageSrc}
              alt={displayName}
              onError={(e) => handleImageErrorWithRetry(e, () => { e.currentTarget.style.display = 'none'; })}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          </button>
        ) : (
          <ProductImageFallback />
        )}
      </div>
      {isPartnerBrandItem(product) && (
        <p className="pdp-partner-disclosure">
          <span className="pdp-head__badge" title="ayna has a partnership with this brand. It does not affect your recommendation.">
            ayna Partner
          </span>{' '}
          <span className="pdp-partner-note">
            {getPartnerDisclosureText(product)}
          </span>
        </p>
      )}
      {isAmazonBuyLink && !isPartnerBrandItem(product) && (
        <p className="pdp-partner-disclosure pdp-amazon-disclosure">
          <span className="pdp-partner-note">
            ayna receives a commission on purchases. We have no direct partnership with this brand.
          </span>
        </p>
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
              <ProductTileImage
                product={related}
                imgStyle={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px', boxSizing: 'border-box' }}
                letterNode={<ProductImageFallback compact />}
              />
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

        {onBack && (
          <button type="button" className="pdp-back" onClick={onBack}>
            ← Back
          </button>
        )}

        {/* Which of the mockup's two product layouts to show (1f / 1g). */}
        <div className="pdp-viewswitch" style={{ paddingTop: '1.5rem' }}>
          <div className="pdp-share pdp-share--top">
            <button
              type="button"
              className="pdp-share__icon"
              aria-label="Share product"
              title="Share product"
              aria-expanded={shareMenuOpen}
              onClick={handleShare}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v12" />
                <path d="m7 8 5-5 5 5" />
                <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
              </svg>
            </button>

            {shareMenuOpen && (
              <div className="pdp-share__menu" role="menu" aria-label="Share product">
                <button type="button" role="menuitem" onClick={copyShareLink}>
                  {shareCopied ? 'Link copied' : 'Copy link'}
                </button>

                <a
                  role="menuitem"
                  href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
                  onClick={() => recordShare('email')}
                >
                  Email
                </a>

                <a
                  role="menuitem"
                  href={`sms:?&body=${encodedShareText}`}
                  onClick={() => recordShare('sms')}
                >
                  Text
                </a>

                <a
                  role="menuitem"
                  href={`https://wa.me/?text=${encodedShareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordShare('whatsapp')}
                >
                  WhatsApp
                </a>
              </div>
            )}
          </div>

        </div>

        <>
          {/* Product head — mockup board 1f: square product tile beside the
              eyebrow / name / price / actions column. */}
          <div className="pdp-head">
            <div>
              {galleryTile}

              {/* Fills the dead space below a short square image while the
                  detail column (name/price/tabs/tab content) runs much
                  taller — same fix as the Evidence view's left column. Only
                  on the Scientific literature tab (where this ingredient
                  detail is relevant), not shown under every tab, and only
                  when a catalog entry has this on file. */}
              {Array.isArray(product.ingredientScience) && product.ingredientScience.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ font: '500 9.5px "DM Mono", ui-monospace, monospace', letterSpacing: '0.1em', color: '#8c8078', marginBottom: 8 }}>
                    INSIDE
                  </div>
                  {/* Optional per-product disclosure, e.g. that these are
                      only the brand's highlighted key ingredients rather
                      than the full ingredient list. */}
                  {product.ingredientScienceNote && (
                    <p style={{ fontSize: 12, lineHeight: 1.5, color: '#8c8078', margin: '0 0 10px' }}>
                      {product.ingredientScienceNote}
                    </p>
                  )}
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {product.ingredientScience.map((item) => (
                      <li key={item.name} style={{ fontSize: 13, lineHeight: 1.5, color: '#3f3831', marginBottom: 10 }}>
                        <strong>{item.name}:</strong> {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pdp-head__detail">
              <div className="pdp-head__eyebrow">{eyebrow}</div>

              <h2 className="pdp-head__name">{displayName}</h2>

              <div className="pdp-head__pricerow">
                {(product.price || product.stage) && (
                  <span className="pdp-head__price" style={choice.hasVariants && !choice.variant?.priceLabel ? { fontSize: '1rem' } : undefined}>{choice.hasVariants ? choice.variant?.priceLabel || 'See retailer for price' : product.price || product.stage}</span>
                )}
                {matchPercent != null ? (
                  <button
                    type="button"
                    className="pdp-head__match pdp-head__match--gauge pdp-whymatch-toggle"
                    onClick={toggleWhyMatch}
                    aria-expanded={whyMatchOpen}
                    aria-controls={whyMatchPanelId}
                  >
                    <MatchGauge percent={matchPercent} size={28} theme="light" />
                    match
                    <span className="pdp-whymatch-toggle__why">
                      Why? <span className="pdp-whymatch-toggle__chev" aria-hidden="true">▾</span>
                    </span>
                  </button>
                ) : isInEcosystem ? (
                  <span className="pdp-head__match">In your ecosystem</span>
                ) : headMatchLabel ? (
                  <span className="pdp-head__match">{headMatchLabel}</span>
                ) : null}
              </div>

              {whyMatchPanel}
              {buildMatchCta}

              {safetyAlert && <SafetyAlert text={safetyAlert} sources={product.safetyNoteSources || []} />}

              {actionButtons}

              {/* Small tabs, matching mockup 1f — dark underline on the active
                  tab, muted text on the rest, one compact card below. */}
              <div className="pdp-tabpanel pdp-onepage">

                <div className="pdp-section" style={{ order: 1 }}>
                  <h3 className="pdp-section__title">ayna summary</h3>
                  {(
                  <div className="pdp-summary-card">
                    {sourceCounts.total > 0 && (
                      <div className="pdp-summary-card__meta">
                        <span className="pdp-summary-card__dot" />
                        ayna SUMMARY · {sourceCounts.total} SOURCE{sourceCounts.total === 1 ? '' : 'S'}
                      </div>
                    )}
                    {summarySentences.length > 0 ? (() => {
                      const summaryText = summarySentences.join(' ');
                      const clampable = shouldClampSummary(summaryText);
                      return (
                        <>
                          <p
                            id={`pdp-summary-${product.id}`}
                            className={`pdp-summary-card__body${clampable && !summaryExpanded ? ' pdp-summary-clamp' : ''}`}
                          >
                            {summaryText}
                          </p>
                          {clampable && (
                            <button
                              type="button"
                              className="pdp-readmore"
                              aria-expanded={summaryExpanded}
                              aria-controls={`pdp-summary-${product.id}`}
                              onClick={() => setSummaryExpanded((v) => !v)}
                            >
                              {summaryExpanded ? 'Show less' : 'Read more'}
                            </button>
                          )}
                        </>
                      );
                    })() : (
                      <p className="pdp-summary-card__empty">No summary yet.</p>
                    )}
                    {sourceChips.length > 0 && (
                      <div className="pdp-summary-card__chips">
                        {sourceChips.map((chip) => (
                          chip.url ? (
                            <a
                              key={chip.label}
                              className="pdp-head__badge"
                              href={chip.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {chip.label}
                            </a>
                          ) : (
                            <span key={chip.label} className="pdp-head__badge">{chip.label}</span>
                          )
                        ))}
                      </div>
                    )}
                    <div className="pdp-summary-card__foot">Research + review summary. Not medical advice.</div>
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

                <div className="pdp-section" style={{ order: 2 }}>
                  <h3 className="pdp-section__title">{product.doctorOpinion && !product.clinicianAttribution ? 'What the brand claims' : 'Clinician opinion'}</h3>
                  {(
                  <div className="pdp-summary-card">
                    {product.doctorOpinion ? (
                      <>
                        <p className="pdp-summary-card__body" style={{ marginTop: 0, whiteSpace: 'pre-line' }}>{product.doctorOpinion}</p>
                        {product.clinicianAttribution && (
                          <div className="pdp-summary-card__foot">{product.clinicianAttribution}</div>
                        )}
                        {(clinicianSourceLinks.length > 0 || Array.isArray(product.doctorOpinionCitations)) && (
                          <div className="pdp-summary-card__chips">
                            {clinicianSourceLinks.map((chip) => (
                              <a
                                key={chip.url}
                                className="pdp-head__badge"
                                href={chip.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={chip.text || chip.url}
                              >
                                {chip.label}
                              </a>
                            ))}
                            {/* Kept out of verificationLinks on purpose — that data
                                also feeds the Scientific literature tab's citation
                                list, and this link belongs only here, on the
                                clinical claim it backs, not mixed into that list. */}
                            {(product.doctorOpinionCitations || []).map((c) => (
                              <a
                                key={c.url}
                                className="pdp-head__badge"
                                href={c.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={c.label}
                              >
                                {hostLabel(c.url) || c.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="pdp-summary-card__empty">No clinician note yet.</p>
                    )}
                  </div>
                  )}
                </div>

                {visibleTabs.some((t) => t.id === 'whoitsfor') && <div className="pdp-section" style={{ order: 5 }}>
                  <h3 className="pdp-section__title">Who it’s for</h3>
                  {(
                  <div className="pdp-summary-card">
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {(product.whoItsFor || []).map((item) => (
                        <li key={item} style={{ display: 'flex', gap: 10, fontSize: 14, lineHeight: 1.55, color: '#3f3831', marginBottom: 10 }}>
                          <span style={{ flex: 'none', color: '#B4732A' }}>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  )}
                </div>}

                {visibleTabs.some((t) => t.id === 'howtouse') && <div className="pdp-section" style={{ order: 6 }}>
                  <h3 className="pdp-section__title">How to use</h3>
                  {(
                  <div className="pdp-summary-card">
                    {product.howToUse?.intro && (
                      <p className="pdp-summary-card__body" style={{ marginTop: 0 }}>{product.howToUse.intro}</p>
                    )}
                    <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none' }}>
                      {(product.howToUse?.steps || []).map((step) => (
                        <li key={step} style={{ display: 'flex', gap: 10, fontSize: 14, lineHeight: 1.55, color: '#3f3831', marginBottom: 10 }}>
                          <span style={{ flex: 'none', color: '#B4732A' }}>•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                    {product.howToUse?.sourceUrl && (
                      <div style={{ marginTop: 10 }}>
                        <a
                          href={product.howToUse.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pdp-head__badge"
                          title={product.howToUse.sourceLabel || product.howToUse.sourceUrl}
                        >
                          {hostLabel(product.howToUse.sourceUrl) || 'Source'}
                        </a>
                      </div>
                    )}
                  </div>
                  )}
                </div>}

                <div className="pdp-section" style={{ order: 4 }}>
                  <h3 className="pdp-section__title">Social media + reviews</h3>
                  {(
                  <div className="pdp-summary-card">
                    {(aynaRating != null || aynaReviewCount > 0) && (
                      <div className="pdp-community__rating">
                        {aynaRating != null && <strong>{aynaRating.toFixed(1)}</strong>}
                        {aynaReviewCount > 0 && <span>{aynaReviewCount} review{aynaReviewCount === 1 ? '' : 's'}</span>}
                      </div>
                    )}
                    {communityCitationEntries.length > 0 ? (
                      <div className="pdp-scientific__list">
                        {communityCitationEntries.map((entry) => (
                          <a
                            key={entry.url}
                            className="pdp-scientific__entry"
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <div className="pdp-scientific__entry-head">
                              <span className="pdp-scientific__entry-source">{entry.label}</span>
                            </div>
                            {entry.text && <p className="pdp-scientific__entry-text">{entry.text}</p>}
                            {entry.summary && <p className="pdp-scientific__entry-summary">{entry.summary}</p>}
                          </a>
                        ))}
                      </div>
                    ) : communitySnippets.length > 0 ? (
                      communitySnippets.map((snippet, i) => (
                        <p key={i} className="pdp-community__snippet">{snippet}</p>
                      ))
                    ) : aynaRating == null && aynaReviewCount === 0 ? (
                      <p className="pdp-summary-card__empty">No community notes yet.</p>
                    ) : null}
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
                              {star}
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
                </div>

                {factRows.length > 0 && (
                  <div className="pdp-section" style={{ order: 8 }}>
                    <h3 className="pdp-section__title">Details</h3>
                    <div className="pdp-summary-card">
                      {factRows.map((row) => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '6px 0', fontSize: 14 }}>
                          <span style={{ color: '#8c8078' }}>{row.label}</span>
                          <span style={{ textAlign: 'right' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pdp-section" style={{ order: 9 }}>
                  <h3 className="pdp-section__title">Ask ayna</h3>
                  {(
                  <AskAynaProductTab
                    product={product}
                    aiContext={{}}
                    quizResults={quizResults}
                    ecosystemProducts={ecosystemProducts}
                  />
                  )}
                </div>

                <div className="pdp-section" style={{ order: 3 }}>
                  <h3 className="pdp-section__title">Research</h3>
                  {(
                  <div className="pdp-summary-card">
                    {ingredientCitationEntries.length > 0 && product.ingredientScienceNote && (
                      <p className="pdp-summary-card__empty" style={{ marginTop: 0, marginBottom: 14 }}>{product.ingredientScienceNote}</p>
                    )}
                    {(scientificLiteratureEntries.length + curatedScientificEntries.length + ingredientCitationEntries.length) > 0 ? (
                      <div className="pdp-scientific__list">
                        {[...scientificLiteratureEntries, ...curatedScientificEntries, ...ingredientCitationEntries].map((entry) => (
                          <a
                            key={entry.url}
                            className="pdp-scientific__entry"
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <div className="pdp-scientific__entry-head">
                              <span className="pdp-scientific__entry-kind">{entry.kind}</span>
                              <span className="pdp-scientific__entry-source">{entry.label}</span>
                            </div>
                            {entry.text && <p className="pdp-scientific__entry-text">{entry.text}</p>}
                            {entry.summary && <p className="pdp-scientific__entry-summary">{entry.summary}</p>}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="pdp-summary-card__empty">No scientific literature yet.</p>
                    )}
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {relatedGrid}
        </>

      </div>

      {lightboxOpen && heroImageSrc && (
        <ImageLightbox src={heroImageSrc} alt={displayName} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
