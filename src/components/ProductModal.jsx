import React, { useState, useMemo, useEffect } from 'react';
import ProductEvidenceRail from './ProductEvidenceRail';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import { getProfileMatchLabelsForProduct, getProfileMatchPercentForProduct, CATEGORY_LABELS } from '../data/products';
import { getAynaRating } from '../data/aynaReviews';
import { resolveProductImage, isPlaceholderProductImage } from '../utils/resolveProductImage';
import { isPartnerBrandItem } from '../utils/partnerBrands';
import { handleImageErrorWithRetry } from '../utils/imageRetry';
import { getSupabaseClient } from '../utils/supabaseClient';
import { renderMarkdownLite } from '../utils/renderMarkdownLite';
import MatchGauge from './MatchGauge';
import { PRODUCT_BUY_URLS } from '../data/productBuyUrls';
import { getVerificationLinks, toSourceChips, hostLabel } from '../utils/verificationLinks';
import posthog from 'posthog-js';

/** Remembers whether this browser prefers the tabs (1f) or evidence rail (1g) layout. */
const PRODUCT_VIEW_KEY = 'ayna_product_detail_view_v1';

const AYNA_TABS = [
  { id: 'summary', label: 'ayna summary' },
  { id: 'clinician', label: 'Clinician opinion' },
  { id: 'scientific', label: 'Scientific literature' },
  { id: 'community', label: 'Social Media' },
  { id: 'ask', label: 'Ask Ayna' },
];

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
function SafetyAlert({ text }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="pdp-safety-alert">
      <button
        type="button"
        className="pdp-safety-alert__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <strong>⚠️ Safety note</strong>
        <span className="pdp-safety-alert__chevron" aria-hidden="true">{expanded ? '▴' : '▾'}</span>
      </button>
      {expanded ? (
        <p>{text}</p>
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

/**
 * Surfaces a real, already-on-file safety/opinion concern (e.g. the Always
 * Pads PFAS controversy) regardless of which tab is active. safety.recalls
 * and safety.opinionAlerts were both being written into the catalog with
 * real, accurate detail, but neither was ever rendered anywhere in this
 * file — the default "ayna summary" a user sees first is built only from
 * product.summary + product.effectiveness, both purely positive/performance
 * fields, so a product could read as unqualified positive even when the
 * SAME entry already had a well-documented concern on file just one tab
 * away (or, for opinionAlerts, nowhere at all — grep confirms zero
 * components read that field anywhere in the app before this).
 *
 * '⚠️' is the existing convention for "this is a real flagged concern," not
 * a new one — the same check Discovery.jsx's safety scoring and
 * Recommendations.jsx's "Safety note" badge already use. A product with no
 * flag returns null, so this only ever adds visibility to what the catalog
 * already documented, never invents a concern that isn't on file.
 */
export function getSafetyAlertText(product) {
  const recalls = product?.safety?.recalls;
  if (!recalls || !String(recalls).includes('⚠️')) return null;
  return product?.safety?.opinionAlerts || recalls;
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

/** True for a real URL with something after the domain — not just a bare homepage. */
function hasRealPath(url) {
  try {
    const u = new URL(url);
    return u.pathname.replace(/\/+$/, '').length > 0 || u.search.length > 0;
  } catch {
    return false;
  }
}

function isSearchResultsUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase().replace(/\/+$/, '');

    // Search/category-result routes, including Amazon /s pages.
    if (/(^|\/)(s|search)(\/|$)/.test(path)) return true;

    if (
      u.searchParams.has('k') ||
      u.searchParams.has('searchTerm') ||
      u.searchParams.has('Ntt') ||
      u.searchParams.get('tbm') === 'shop'
    ) return true;

    return false;
  } catch {
    return true;
  }
}

function isExactBuyUrl(value) {
  const url = String(value || '').trim();

  return (
    /^https?:\/\//i.test(url) &&
    hasRealPath(url) &&
    !isSearchResultsUrl(url)
  );
}

function getBuyUrl(product) {
  // 1. Affiliate product URL wins when Ayna has one.
  if (isExactBuyUrl(product?.affiliateUrl)) {
    return String(product.affiliateUrl).trim();
  }

  // 2. Ayna's centrally verified exact destination.
  const verifiedCatalogUrl = PRODUCT_BUY_URLS[product?.id];
  if (isExactBuyUrl(verifiedCatalogUrl)) {
    return verifiedCatalogUrl;
  }

  // 3. Explicit exact product URLs.
  for (const candidate of [product?.productUrl, product?.buyUrl]) {
    if (isExactBuyUrl(candidate)) return String(candidate).trim();
  }

  // 3. Existing catalog URL, but ONLY when it is a real product/service page.
  // Bare homepages and search-result pages are rejected.
  if (isExactBuyUrl(product?.url)) {
    return String(product.url).trim();
  }

  // 4. Explicit retailer product URL only.
  if (product?.whereToBuyLinks && typeof product.whereToBuyLinks === 'object') {
    for (const value of Object.values(product.whereToBuyLinks)) {
      if (isExactBuyUrl(value)) return String(value).trim();
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
  // Optional: renders a visible in-page "Back" control. Product pages are
  // real routes (/product/:id) reachable via direct/shared links, so unlike
  // a nested modal there's no other on-screen way back to Discovery.
  onBack = null,
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
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
    if (!isPlaceholderProductImage(product.image, product.type === 'digital')) return () => { active = false; };
    resolveProductImage(product.name, product.brand || '', '', product.type || '').then((url) => {
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
  const usesAffiliateLink = Boolean(
    isExactBuyUrl(product?.affiliateUrl) &&
    buyUrl === String(product.affiliateUrl).trim()
  );

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

  // ayna summary card: the catalog's own short, single-sentence fields —
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

  const safetyAlert = useMemo(() => getSafetyAlertText(product), [product]);

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
  // Doctor + scientific links both back clinical claims, so both show here.
  const clinicianSourceLinks = useMemo(() => toSourceChips([
    ...getVerificationLinks(product, 'doctor'),
    ...getVerificationLinks(product, 'scientific'),
  ]), [product]);

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
        <span className="pdp-head__badge" title="ayna has a partnership with this brand. It does not affect your recommendation.">
          ayna Partner
        </span>
      )}
    </div>
  );

  const galleryTile = (
    <div className="pdp-head__tile" style={{ position: 'relative' }}>
      {usesAffiliateLink && (
        <span
          title="ayna may earn a commission if you purchase through this link."
          style={{
            position: 'absolute',
            top: '0.55rem',
            right: '0.55rem',
            zIndex: 2,
            fontSize: '0.62rem',
            lineHeight: 1,
            color: 'var(--color-text-muted)',
            background: 'rgba(255,255,255,0.88)',
            padding: '0.3rem 0.4rem',
            borderRadius: '999px',
          }}
        >
          Affiliate link
        </span>
      )}
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
          aria-label={`View larger photo of ${product.name}`}
          style={{ all: 'unset', display: 'block', width: '100%', height: '100%', cursor: 'zoom-in' }}
        >
          <img
            src={heroImageSrc}
            alt={product.name}
            onError={(e) => handleImageErrorWithRetry(e, () => { e.currentTarget.style.display = 'none'; })}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        </button>
      ) : (
        <ProductImageFallback />
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
                  <span className="pdp-head__match pdp-head__match--gauge">
                    <MatchGauge percent={matchPercent} size={28} theme="light" />
                    match
                  </span>
                ) : isInEcosystem ? (
                  <span className="pdp-head__match">In your ecosystem</span>
                ) : headMatchLabel ? (
                  <span className="pdp-head__match">{headMatchLabel}</span>
                ) : null}
              </div>

              {safetyAlert && <SafetyAlert text={safetyAlert} />}

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
                        ayna SUMMARY · {sourceCounts.total} SOURCE{sourceCounts.total === 1 ? '' : 'S'}
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

                {activeTab === 'clinician' && (
                  <div className="pdp-summary-card">
                    {product.doctorOpinion ? (
                      <>
                        <p className="pdp-summary-card__body" style={{ marginTop: 0 }}>{product.doctorOpinion}</p>
                        {product.clinicianAttribution && (
                          <div className="pdp-summary-card__foot">{product.clinicianAttribution}</div>
                        )}
                        {clinicianSourceLinks.length > 0 && (
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
                          </div>
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

                {activeTab === 'ask' && (
                  <AskAynaProductTab
                    product={product}
                    aiContext={{}}
                    quizResults={quizResults}
                    ecosystemProducts={ecosystemProducts}
                  />
                )}

                {activeTab === 'scientific' && (
                  <div className="pdp-summary-card">
                    {scientificLiteratureEntries.length > 0 ? (
                      <div className="pdp-scientific__list">
                        {scientificLiteratureEntries.map((entry) => (
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
              {safetyAlert && <SafetyAlert text={safetyAlert} />}
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

      {lightboxOpen && heroImageSrc && (
        <ImageLightbox src={heroImageSrc} alt={product.name} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
