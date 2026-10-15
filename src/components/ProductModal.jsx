import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProductImageFallback } from './ProductTileImage';
import ProductCard from './ProductCard';
import { ALL_PRODUCTS, getProfileMatchPercentForProduct, getProductMatchDetailsForProduct, CATEGORY_LABELS } from '../data/products';
import { exclusionLines } from '../utils/matchDisplay';
import '../styles/match-ui.css';
import { getAynaRating } from '../data/aynaReviews';
import { resolveProductImage, isPlaceholderProductImage } from '../utils/resolveProductImage';
import { isPartnerBrandItem, isPrelaunchPartnerItem, getPartnerDisclosureText } from '../utils/partnerBrands';
import { handleImageErrorWithRetry } from '../utils/imageRetry';
import { getSupabaseClient } from '../utils/supabaseClient';
import { renderMarkdownLite } from '../utils/renderMarkdownLite';
import WhyMatchPanel from './WhyMatchPanel';
import MatchPill from './MatchPill';
import { matchLine, priceParts } from '../data/passport/content';
import { buildGlance, perUnitLabel, sizeCount } from './pdp/glance';
import { getPassport } from '../data/passport';
import { buildTypedTags } from '../data/passport/content';
import { ProductMatch, ProductAsk, ProductTrust, ProductGoodToKnow, ProductMore } from './passport/ProductSections';
import { galleryImages, retailerLinks, similarProducts, sameNeedProducts, productJsonLd, breadcrumbJsonLd } from './pdp/commerce';
import GalleryThumbs from './pdp/GalleryThumbs';
import ComparePanel from './pdp/ComparePanel';
import Breadcrumbs from './pdp/Breadcrumbs';
import useJsonLd from './pdp/useJsonLd';
import { jumpTo } from './pdp/jump';
import { resolveBuyUrl, isAmazonUrl, buyGoesToAmazonListing } from '../utils/buyLink';
import { getVariantSelection } from '../utils/productVariantSelection';
import { recordRetailerVisit } from '../utils/feedbackClient';
import { getAppSessionId } from '../utils/conversationId';
import { productHref } from '../utils/productRoute';
import { hostLabel } from '../utils/verificationLinks';
import posthog from 'posthog-js';
import '../styles/audit-pdp.css';
import '../styles/verify-content.css';
import './pdp/pdp.css';

/**
 * Product Q&A, for a user who doesn't know what a product actually IS (a
 * real MVP report: a first-time viewer saw a "pelvic wand" and the static
 * summary didn't explain what it does or how it's used). api/product-chat.js
 * already existed, fully built and tested (auth, quota, prompt-injection
 * guards, official-site grounding) but had zero frontend callers anywhere in
 * the app, this is that first caller, not a new chat system.
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
    // deploy), every other call site in this app treats that as "not
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
        setError('Sign in to ask ayna about this product. Free accounts get a few AI chats each week.');
      } else if (e?.code === 'weekly_limit_reached') {
        setError('You’ve used your free chats for this week. They reset weekly.');
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
            New to this kind of product? Ask ayna anything about it.
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
                background: m.role === 'user' ? 'var(--ay-ink)' : 'var(--ay-cream)',
                color: m.role === 'user' ? 'var(--ay-paper)' : 'inherit',
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
              ayna is thinking…
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
        ayna’s answers are educational, not medical advice.
      </p>
    </div>
  );
}

// A dense safety paragraph must never push Buy now below the fold, but the
// flag itself must never be missable either (2026-08-24 bug bash). The
// header shows one line that jumps to the full note in the Safety section.
function SafetyFlag() {
  return (
    <button type="button" className="pdp-safety-flag" onClick={() => jumpTo('ay-sec-safety')}>
      <span aria-hidden="true">⚠️</span>
      <strong>Safety note on file</strong>
      <span>See it</span>
    </button>
  );
}

/** Full-size photo view: click to enlarge, click backdrop/X/Escape to close. */
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

// getSafetyAlertText and buildSummarySentences live in
// ../utils/productSafetyAlert (shared with Discovery.jsx's safety scoring and
// Recommendations.jsx's "Safety note" badge). Re-exported here so existing
// imports of them from this module keep working.
// eslint-disable-next-line react-refresh/only-export-components
export { getSafetyAlertText, buildSummarySentences } from '../utils/productSafetyAlert';

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

const HEART_PATH = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z';

/** Heart = Save. Opens a tiny menu when there is also a playlist to add to. */
function SaveMenu({ isSaved, onToggleSaved, onAddToPlaylist, product }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const label = isSaved ? 'Saved' : 'Save';
  if (!onAddToPlaylist) {
    return (
      <button type="button" className={`pdp-actions__heart${isSaved ? ' is-on' : ''}`} aria-pressed={isSaved} aria-label={label} title={label} onClick={() => onToggleSaved(product)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART_PATH} /></svg>
      </button>
    );
  }
  return (
    <div className="pdp-save" ref={ref}>
      <button type="button" className={`pdp-actions__heart${isSaved ? ' is-on' : ''}`} aria-haspopup="menu" aria-expanded={open} aria-label={`${label} options`} title={label} onClick={() => setOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART_PATH} /></svg>
      </button>
      {open && (
        <div className="pdp-save__menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { onToggleSaved(product); setOpen(false); }}>
            {isSaved ? 'Remove from saved' : 'Save for later'}
          </button>
          <button type="button" role="menuitem" onClick={() => { onAddToPlaylist(); setOpen(false); }}>
            Add to a playlist
          </button>
        </div>
      )}
    </div>
  );
}

const MOBILE_QUERY = '(max-width: 767px)';

/** Canonical share link: the live domain, except on local/preview hosts. */
function productShareUrl(product) {
  const path = productHref(product);
  if (typeof window === 'undefined') return `https://www.aynahealth.co${path}`;
  const host = window.location.hostname;
  const isPreview = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app');
  return `${isPreview ? window.location.origin : 'https://www.aynahealth.co'}${path}`;
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function ProductModal({
  product,
  onOmit,
  isOmitted,
  onAddToEcosystem,
  isInEcosystem,
  onToggleSaved,
  isSaved = false,
  // Optional map of saved product ids, so suggestion cards can show the
  // right heart state. Without it, suggestion cards show no heart.
  savedProducts = null,
  aynaReviews = null,
  onRate,
  onReview,
  quizResults = null,
  healthProfile = null,
  ecosystemProducts = null,
  // Memoized { behavior } for the matching engine (App.jsx), so the score
  // here matches Shop and Ecosystem.
  matchOpts = undefined,
  // Navigates to another product's own dedicated page.
  onOpenProduct = null,
  onAskAyna = null,
  // Set only when this product page was reached by clicking a search
  // result, so Buy now can carry the same searchQuery (search -> click ->
  // purchase in PostHog).
  searchOrigin = null,
  // Optional: renders a visible in-page "Back" control.
  onBack = null,
  // Breadcrumbs: opens the Shop, filtered to a category when given one.
  // Without it the crumbs are plain links to /shop.
  onOpenShop = null,
  // Opens the composer with this product attached ('post' | 'review' |
  // 'playlist' | 'recommend').
  onCommunityAction = null,
  // Signed-in person, if any. Logged out, the page offers Save instead of
  // "Add to my ecosystem" (there is no ecosystem yet).
  user = undefined,
  onStartQuiz = null,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Size / pack options (product.variants): Buy now, photo, name and price
  // follow the chosen option.
  // Keyed to the product id so moving to another product page starts from
  // that product's own default option.
  const [variantPick, setVariantPick] = useState({ productId: product?.id, id: product?.defaultVariantId || '' });
  const selectedVariantId = variantPick.productId === product?.id ? variantPick.id : (product?.defaultVariantId || '');
  const setSelectedVariantId = (id) => setVariantPick({ productId: product?.id, id });
  const choice = getVariantSelection(product || {}, selectedVariantId);
  const displayName = String(choice.displayName || product?.name || '').replace(/\s*\u2014\s*/g, ', ');
  const [showWhy, setShowWhy] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(0);
  const boardRef = useRef(null);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2200);
  };

  // P11: native share sheet on phones, copy + toast everywhere else.
  const handleShare = async () => {
    const url = productShareUrl(product);
    const isPhone = typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_QUERY).matches;
    if (isPhone && navigator.share) {
      try {
        await navigator.share({ title: `${product?.name} | ayna`, url });
        posthog.capture('product_shared', { productId: product?.id, category: product?.category, channel: 'native' });
        return;
      } catch (e) { if (e?.name === 'AbortError') return; }
    }
    const ok = await copyText(url);
    if (ok) posthog.capture('product_shared', { productId: product?.id, category: product?.category, channel: 'copy_link' });
    showToast(ok ? 'Link copied' : 'Couldn’t copy the link');
  };

  const [reviewInput, setReviewInput] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [resolvedModalImage, setResolvedModalImage] = useState(null);
  const imageIdentity = JSON.stringify([product?.id, product?.name, product?.brand, product?.url, product?.type, product?.image]);

  // Most catalog entries only ever carry a single `image` URL. When that's a
  // placeholder, this tries once to resolve a real product photo instead.
  useEffect(() => {
    let active = true;
    if (!product?.name) return () => { active = false; };
    if (!isPlaceholderProductImage(product.image, product.type === 'digital')) return () => { active = false; };
    resolveProductImage(product.name, product.brand || '', product.url || '', product.type || '').then((url) => {
      if (!active || !url) return;
      setResolvedModalImage({ identity: imageIdentity, url });
    });
    return () => { active = false; };
  }, [imageIdentity, product?.id, product?.name, product?.brand, product?.image, product?.url, product?.type]);
  const resolvedImageUrl = resolvedModalImage?.identity === imageIdentity ? resolvedModalImage.url : '';

  // Gallery: cover first, then any extra photos on file. A chosen size/pack
  // shows only its own photo (never another pack's box).
  const variantImage = choice.variant ? (choice.image || '') : null;
  const galleryList = variantImage != null ? (variantImage ? [variantImage] : []) : galleryImages(product);
  const images = galleryList.length ? galleryList : (variantImage == null && resolvedImageUrl ? [resolvedImageUrl] : []);
  const heroImageSrc = images[Math.min(photo, Math.max(images.length - 1, 0))] || '';

  const explicitMatchPercent = useMemo(() => getRealMatchPercent(product), [product]);
  const profileMatchPercent = useMemo(
    () => getProfileMatchPercentForProduct(product, quizResults, healthProfile, matchOpts),
    [product, quizResults, healthProfile, matchOpts]
  );
  const matchPercent = profileMatchPercent ?? explicitMatchPercent;
  // The engine's per-need view feeds the one-line "what it matches" and the
  // "Why ayna matched it to you" section. Raw per-need numbers are never
  // shown in the header.
  const matchDetails = useMemo(
    () => (quizResults ? getProductMatchDetailsForProduct(product, quizResults, healthProfile, matchOpts) : null),
    [product, quizResults, healthProfile, matchOpts]
  );
  const matchExclusions = matchDetails?.matchStatus === 'excluded' ? exclusionLines(matchDetails) : [];
  const headMatchLine = useMemo(() => matchLine(matchDetails), [matchDetails]);
  // utils/buyLink.js: partners go to their own link; everything else to
  // ayna's Amazon link when Amazon carries it, else the brand/retailer page.
  const buyUrl = product ? resolveBuyUrl(product, choice.variant) : null;
  const sizeChosenOnAmazon = choice.hasVariants && product ? buyGoesToAmazonListing(product, choice.variant) : false;
  const isAmazonBuyLink = isAmazonUrl(buyUrl);
  const isPartner = isPartnerBrandItem(product);
  const isPrelaunch = isPrelaunchPartnerItem(product);
  const usesAffiliateLink = Boolean(!isPartner && !isAmazonBuyLink && product?.affiliateUrl && buyUrl === String(product.affiliateUrl).trim());
  const retailers = retailerLinks(product, buyUrl);

  const aynaData = useMemo(
    () => (aynaReviews && product ? (aynaReviews[product.id] || { ratings: [], reviews: [] }) : { ratings: [], reviews: [] }),
    [aynaReviews, product]
  );
  // Only ratings real people left on ayna. The catalog's userRating has no
  // count or source behind it, so it is not shown.
  const aynaRating = getAynaRating(product, aynaData);
  const ratingCount = Array.isArray(aynaData?.ratings) ? aynaData.ratings.length : 0;

  const glance = useMemo(
    () => buildGlance(product, { details: matchDetails, aynaData, aynaRating }),
    [product, matchDetails, aynaData, aynaRating]
  );

  // Bottom of the page: close alternatives in a compare table, then picks
  // that fit this person (when they have a profile) or things for the same
  // need from other categories.
  const suggestions = useMemo(() => {
    if (!product) return { compare: [], more: [] };
    const owned = new Set((ecosystemProducts || []).map((p) => p?.id).filter(Boolean));
    const pool = ALL_PRODUCTS.filter((p) => p && p.id && p.name && p.id !== product.id);
    const compare = similarProducts(product, { pool, limit: 3 });
    const used = new Set([...compare.map((p) => p.id), ...owned]);
    let more = [];
    // Only products for the same need as this one (no tampons under a TENS
    // device); with a profile, those are ordered by her match.
    const sameNeed = sameNeedProducts(product, { pool, limit: 16, exclude: [...used] });
    if (quizResults) {
      more = sameNeed
        .filter((p) => !used.has(p.id))
        .map((p) => ({ p, m: getProfileMatchPercentForProduct(p, quizResults, healthProfile, matchOpts) }))
        .filter((x) => Number.isFinite(x.m) && x.m >= 50)
        .sort((x, y) => y.m - x.m)
        .slice(0, 4)
        .map((x) => ({ ...x.p, _match: Math.round(x.m) }));
    }
    if (more.length < 4) {
      const have = new Set([...used, ...more.map((p) => p.id)]);
      more = [...more, ...sameNeedProducts(product, { pool, limit: 4 - more.length, exclude: [...have] })];
    }
    return { compare, more, personal: Boolean(quizResults) && more.some((p) => p._match) };
  }, [product, ecosystemProducts, quizResults, healthProfile, matchOpts]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.aynahealth.co';
  useJsonLd('ay-pdp-jsonld', product ? [
    productJsonLd(product, { origin, buyUrl, aynaRating, ratingCount }),
    breadcrumbJsonLd(product, { origin }),
  ] : []);

  if (!product) return null;

  const basePrice = priceParts(product);
  const price = choice.hasVariants
    ? { known: true, main: choice.variant?.priceLabel || 'See retailer for price', sub: '', isPlaceholder: !choice.variant?.priceLabel }
    : basePrice;
  const perUnit = choice.hasVariants ? '' : perUnitLabel(product);
  const priceText = product.price || product.stage || '';
  const brand = glance?.brand && glance.brand.toLowerCase() !== String(product.name).toLowerCase() ? glance.brand : '';
  const openProductByName = (name) => {
    const target = ALL_PRODUCTS.find((p) => String(p?.name || '').toLowerCase() === String(name || '').toLowerCase());
    if (target && onOpenProduct) onOpenProduct(target);
  };

  const noRecalls = (() => { const r = String(product?.safety?.recalls || ''); return Boolean(r) && !r.includes('\u26a0'); })();

  // The one or two cautions that should sit next to the Buy button (pregnancy,
  // the product's own safety alert), in plain words from the record.
  const keyCautions = (() => {
    const out = [];
    const first = (t) => { const m = String(t || '').match(/^(.{8,200}?[.!?])(\s|$)/); return (m ? m[1] : String(t || '')).trim(); };
    const pp = getPassport(product);
    const preg = pp?.safety?.pregnancy;
    const pv = preg?.known && !preg.notApplicable ? (Array.isArray(preg.value) ? preg.value.join(', ') : String(preg.value || '')) : '';
    if (pv && /not|avoid|consult|ask|doctor|clinician|don.t|do not|unsafe|caution/i.test(pv)) out.push(`Pregnancy: ${first(pv)}`);
    return [...new Set(out.filter(Boolean))].slice(0, 2);
  })();
  // Who actually sells it, so the button says where it goes ("Buy at LOLA ↗").
  let sellerName = '';
  try { sellerName = buyUrl ? (isAmazonBuyLink ? 'Amazon' : (isPartner && brand) ? brand : new URL(buyUrl).hostname.replace(/^www\./, '')) : ''; } catch { sellerName = ''; }
  const buyLabel = sellerName && sellerName.length <= 22 ? `Buy at ${sellerName}` : 'Buy from the seller';
  const buyButton = (extraClass = '') => (buyUrl ? (
    <a
      className={`pdp-btn pdp-btn--navy pdp-btn--buy ${extraClass}`.trim()}
      href={buyUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        // Never let the purchase-feedback queue block opening the retailer.
        try { recordRetailerVisit(product, choice.variant); } catch { /* ignore */ }
        posthog.capture('product_buy_now_clicked', {
          productId: product.id,
          category: product.category,
          destination: buyUrl,
          variantId: choice.variant?.id,
          source: searchOrigin?.source,
          searchQuery: searchOrigin?.searchQuery,
        });
      }}
    >
      {isPrelaunch ? (product.waitlistCtaLabel || 'Join the waitlist') : product.type === 'digital' ? `Get started${sellerName ? ` at ${sellerName}` : ''}` : buyLabel}
      {!isPrelaunch && <span className="pdp-btn__ext" aria-hidden="true"> ↗</span>}
      <span className="sr-only"> (opens the seller’s site in a new tab)</span>
    </a>
  ) : (
    <button type="button" className={`pdp-btn pdp-btn--navy pdp-btn--buy ${extraClass}`.trim()} disabled>
      Buy now
    </button>
  ));

  const actionButtons = (
    <div className="pdp-actions pdp-buybox">
      {choice.hasVariants && (
        <label className="pdp-variant" style={{ display: 'block', width: '100%', marginBottom: '0.8rem', fontSize: '0.9rem' }}>
          Size / option
          <select
            aria-label="Size / option"
            value={selectedVariantId}
            onChange={(event) => { setSelectedVariantId(event.target.value); setPhoto(0); }}
            style={{ display: 'block', width: '100%', padding: '0.7rem', marginTop: '0.35rem', border: '1px solid #d6d0c7', borderRadius: '8px', background: '#fff', color: '#242a52' }}
          >
            <option value="">Choose a size / option</option>
            {product.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.label}</option>)}
          </select>
          <small style={{ display: 'block', marginTop: '0.35rem' }}>
            {sizeChosenOnAmazon
              ? 'The Buy button opens this product on Amazon. Pick the same size there, and confirm current price and availability with the retailer.'
              : 'The Buy button opens this exact option. Confirm current price and availability with the retailer.'}
          </small>
        </label>
      )}
      {noRecalls && <p className="pdp-chiprow"><span className="pdp-chip is-ok">{'\u2713'} No recalls on file</span></p>}
      <div className="pdp-actions__primary">
        {buyButton()}
        {onAddToEcosystem && user && (
          <button
            type="button"
            className={`pdp-btn pdp-actions__eco${isInEcosystem ? ' is-on' : ''}`}
            aria-pressed={isInEcosystem}
            onClick={() => onAddToEcosystem(product)}
            title={isInEcosystem ? 'Remove from my ecosystem' : undefined}
          >
            {isInEcosystem ? <><span className="pdp-eco__on">In my ecosystem ✓</span><span className="pdp-eco__off" aria-hidden="true">Remove</span></> : 'Add to my ecosystem'}
          </button>
        )}
        {!user && onToggleSaved && (
          <button type="button" className={`pdp-btn pdp-actions__eco${isSaved ? ' is-on' : ''}`} aria-pressed={isSaved} onClick={() => onToggleSaved(product)}>
            {isSaved ? 'Saved ♥' : 'Save ♡'}
          </button>
        )}
      </div>
      {buyUrl && !isPrelaunch && <p className="pdp-commission">ayna may earn a commission. It never changes your match.</p>}
      {isPartner && (
        <p className="pdp-partner-line">
          ayna Partner. Partnership never changes your match.{' '}
          <button type="button" className="pdp-textlink" aria-expanded={showDisclosure} onClick={() => setShowDisclosure((v) => !v)}>{showDisclosure ? 'Less' : 'More'}</button>
        </p>
      )}
      {retailers.length > 0 && (
        <div className="ay-retailers">
          <span id="pdp-also-at">Also at</span>
          <ul aria-labelledby="pdp-also-at">
          {retailers.map((r) => (
            <li key={r.url}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => posthog.capture('product_retailer_clicked', { productId: product.id, retailer: r.name })}
              >
                {r.name}
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
              </a>
            </li>
          ))}
          </ul>
        </div>
      )}
      {!buyUrl && <p className="pdp-buybox__note">We don’t have a direct link for this one yet. {(product.whereToBuy || []).length ? `Sold at ${product.whereToBuy.join(', ')}.` : ''}</p>}
      {isPartner && showDisclosure && <p className="pdp-buybox__note pdp-partner-note">{getPartnerDisclosureText(product)}</p>}
      {buyUrl && isAmazonBuyLink && !isPartner && (
        <p className="pdp-buybox__note pdp-amazon-disclosure">ayna receives a commission on purchases. We have no direct partnership with this brand.</p>
      )}
      {usesAffiliateLink && <p className="pdp-buybox__note">ayna may earn a commission if you buy through this link.</p>}
    </div>
  );

  const galleryTile = (
    <div className="pdp-gallery">
      <div className="pdp-head__tile" style={{ position: 'relative' }}>
        {heroImageSrc ? (
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
      <GalleryThumbs images={images} index={photo} onSelect={setPhoto} name={product.name} />
    </div>
  );

  const ownedIds = new Set((ecosystemProducts || []).map((p) => p?.id).filter(Boolean));
  const suggestionCard = (item) => (
    <ProductCard
      key={item.id}
      product={item}
      matchPercent={item._match || null}
      isSaved={Boolean(savedProducts && savedProducts[item.id])}
      inEcosystem={ownedIds.has(item.id)}
      onOpen={(p) => onOpenProduct && onOpenProduct(p)}
      onToggleSaved={savedProducts && onToggleSaved ? onToggleSaved : undefined}
    />
  );

  const matchFor = quizResults ? (p) => getProfileMatchPercentForProduct(p, quizResults, healthProfile, matchOpts) : null;
  const compareThumb = (p) => {
    const src = galleryImages(p)[0];
    return src ? <img src={src} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : null;
  };

  const rateControls = isInEcosystem && onRate ? (
    <div className="pdp-rate">
      <span className="ay-gl-label">Rate it</span>
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
          <input type="text" value={reviewInput} onChange={(e) => setReviewInput(e.target.value)} placeholder="Add a short review…" aria-label="Short review" />
          <button
            type="button"
            className="pdp-btn pdp-btn--outline"
            disabled={!reviewInput.trim()}
            onClick={() => { if (reviewInput.trim()) { onReview(product, reviewInput.trim()); setReviewInput(''); } }}
          >
            Post
          </button>
        </div>
      )}
    </div>
  ) : null;

  const safetySources = Array.isArray(product.safetyNoteSources) ? product.safetyNoteSources.filter((src) => src?.url) : [];
  const sectionExtras = {
    // Links backing the safety note (product.safetyNoteSources, from main).
    safety: safetySources.length > 0 ? (
      <ul className="pdp-safety-alert__sources" style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.8125rem', lineHeight: 1.5 }}>
        {safetySources.map((src) => (
          <li key={src.url}>
            <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
              {src.label || hostLabel(src.url)}
            </a>
          </li>
        ))}
      </ul>
    ) : null,
    // Per-product note, e.g. that only the brand's key ingredients are listed.
    inside: product.ingredientScienceNote ? <p className="pdp-buybox__note" style={{ marginTop: '0.5rem' }}>{product.ingredientScienceNote}</p> : null,
    people: rateControls,
    match: <button type="button" className="ay-psec-action" onClick={() => setShowWhy(true)}>See the full breakdown</button>,
  };

  return (
    <div className="mockup-page pdp-page-wrap">
      <div className="pdp-page pdp-page--glance">

        {showWhy && <WhyMatchPanel product={product} quizResults={quizResults} healthProfile={healthProfile} matchOpts={matchOpts} onClose={() => setShowWhy(false)} onUpdateHealth={() => { window.location.href = '/quiz'; }} />}

        <div className="pdp-topbar">
          <div className="pdp-topbar__left">
            {onBack && (
              <button type="button" className="pdp-back" onClick={onBack} aria-label="Back">
                ← <span>Back</span>
              </button>
            )}
            <Breadcrumbs product={product} onNavigate={onOpenShop} />
          </div>
          <div className="pdp-topbar__right">
            {!(matchPercent > 0) && quizResults && (
              <button type="button" className="pdp-fit-link" onClick={() => setShowWhy(true)}>
                How this fits you
              </button>
            )}
            <button type="button" className="pdp-share" onClick={handleShare} aria-label={`Share ${product?.name || 'this product'}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
              Share
            </button>
          </div>
        </div>

        <div className="pdp-head ay3-simple" ref={boardRef}>
          <div className="pdp-head__media">
            {galleryTile}
          </div>

          <div className="pdp-head__detail pdp-h2">
            {brand && <div className="pdp-head__eyebrow">{brand}</div>}
            <h1 className="pdp-head__name">{displayName}</h1>

            {(price.known || perUnit) && (
              <div className="pdp-h2-price">
                {price.known && <span className="pdp-h2-price__main" style={price.isPlaceholder ? { fontSize: '1rem' } : undefined}>{price.main}</span>}
                {perUnit && <span className="pdp-h2-price__unit">{perUnit}</span>}
                {price.known && price.sub && <small>{price.sub}</small>}
              </div>
            )}
            {(() => {
              const size = sizeCount(product);
              const fsa = (glance?.facts || []).find((f) => f.id === 'fsa' && !f.unknown);
              const priceText = `${product.price || ''} ${price.sub || ''}`;
              const quick = [
                // Long pack lists live once, in Buy; the header keeps short ones.
                size?.text && size.text.length <= 40 ? size.text : null,
                fsa && fsa.value === 'Eligible' ? 'FSA/HSA eligible' : null,
                /month|subscription|\/mo\b|per year|\/year/i.test(priceText) ? 'Subscription' : null,
                product.type === 'digital' ? 'At home, online' : null,
                product.requiresPrescription ? 'Prescription required' : null,
              ].filter(Boolean);
              return quick.length > 0 && <ul className="pdp-quick">{quick.map((t) => <li key={t}>{t}</li>)}</ul>;
            })()}

            {glance?.alert && <SafetyFlag />}

            <ProductMatch glance={glance} matchPercent={matchPercent} fallback={headMatchLine} onShowWhy={() => setShowWhy(true)} onFindFit={!user && onStartQuiz ? onStartQuiz : null} />
            {!(matchPercent > 0) && matchExclusions.length > 0 && (
              <button type="button" className="pdp-h2-fitnote" onClick={() => setShowWhy(true)}>
                {matchExclusions[0]}
              </button>
            )}
            {!(matchPercent > 0) && !matchExclusions.length && isInEcosystem && (
              <p className="pdp-h2-fitnote is-static">In your ecosystem</p>
            )}

            <section className="ay-story ay-story--buy" aria-labelledby="ay-buy-h">
              <h2 id="ay-buy-h">Buy</h2>
              {(() => {
                const pp = getPassport(product);
                const checked = pp?.pricing?.price?.verified_at;
                let seller = '';
                try { seller = buyUrl ? (isAmazonBuyLink ? 'Amazon' : isPartner ? `${brand || 'The brand'} (ayna partner)` : new URL(buyUrl).hostname.replace(/^www\./, '')) : ''; } catch { seller = ''; }
                return (
                  <dl className="ay-buy__facts">
                    {price.known && <div><dt>Price</dt><dd>{price.main}{price.sub ? ` ${price.sub}` : ''}</dd></div>}
                    {sizeCount(product)?.text && <div><dt>Size</dt><dd>{choice.variant?.label || sizeCount(product).text}</dd></div>}
                    {seller && <div><dt>Sold by</dt><dd>{seller}</dd></div>}
                    <div><dt>Price check</dt><dd>{checked ? `Checked ${(() => { const d = new Date(`${String(checked).slice(0, 10)}T12:00:00`); return Number.isNaN(d.getTime()) ? checked : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); })()}` : 'Price at retailer'}</dd></div>
                  </dl>
                );
              })()}
              {keyCautions.length > 0 && (
                <div className="ay-buy__cautions" role="note" aria-label="Before you buy">
                  <p className="ay-buy__cautions-h"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 21h20L12 3Z" /><path d="M12 10v5M12 18v.5" /></svg>Before you buy</p>
                  <ul>{keyCautions.map((t) => <li key={t}>{t}</li>)}</ul>
                  <button type="button" className="pdp-textlink" onClick={() => window.dispatchEvent(new CustomEvent('ay-open-section', { detail: 'safety' }))}>All safety details</button>
                </div>
              )}
              {actionButtons}
            </section>


            <ProductAsk productName={displayName} onAsk={onAskAyna} signedIn={Boolean(user)} />

            <ProductTrust glance={glance} aynaRating={aynaRating} ratingCount={ratingCount} extras={sectionExtras} evidenceStrength={String(product.evidenceStrength || '').trim()} onXref={openProductByName} />

            {(() => {
              const priceText = `${product.price || ''} ${price.sub || ''}`;
              const fsa = (glance?.facts || []).find((f) => f.id === 'fsa' && !f.unknown);
              const attrs = buildTypedTags(product).filter((t) => t.type === 'attribute').map((t) => t.label);
              const items = [
                fsa ? (fsa.value === 'Eligible' ? 'FSA/HSA eligible' : 'Not FSA/HSA eligible') : null,
                ...attrs,
                product.requiresPrescription ? 'Prescription required' : null,
                /month|subscription|\/mo\b|per year|\/year/i.test(priceText) ? 'Subscription' : (price.known && /one-time/i.test(priceText) ? 'One-time purchase' : null),
              ].filter(Boolean);
              return <ProductGoodToKnow items={[...new Set(items)].slice(0, 8)} />;
            })()}

          </div>
        </div>

        <div className="pdp-below pdp-below--glance">
          <ProductMore glance={glance} extras={sectionExtras} onXref={openProductByName} />
            {(onCommunityAction || onOmit) && (
            <section className="pdp-community-actions" aria-labelledby="pdp-community-h">
              {onCommunityAction && <>
                <h3 id="pdp-community-h">Community</h3>
                <div className="pdp-community-actions__grid">
                  {[['review', 'Write a review'], ['post', 'Mention in a post'], ['playlist', 'Add to playlist'], ['recommend', 'Recommend to a friend']].map(([kind, label]) => (
                    <button key={kind} type="button" className={kind === 'review' ? 'is-primary' : undefined} onClick={() => onCommunityAction(kind)}>{label}</button>
                  ))}
                </div>
              </>}
              {onOmit && (
                <button type="button" className="pdp-omit-link" onClick={() => onOmit(product)}>
                  {isOmitted ? 'Undo “Not for me”' : 'Not for me'}
                </button>
              )}
            </section>
          )}


          {(
            <ComparePanel product={product} others={suggestions.compare} onOpen={(p) => onOpenProduct && onOpenProduct(p)} matchFor={matchFor} renderThumb={compareThumb} />
          )}

          {suggestions.more.length > 0 && (
            <section className="pdp-suggest pdp-suggest--glance ay3-band ay3-band--ink ay3-scallop ay3-edge-top" aria-labelledby="pdp-more-h">
              <div className="ay-pdp-sechead">
                <h2 id="pdp-more-h">You may also <em>like.</em></h2>
                <p>{suggestions.personal ? 'Picks that fit your profile.' : 'For the same needs, from other parts of the shop.'}</p>
              </div>
              <div className="pdp-suggest__grid">{suggestions.more.map(suggestionCard)}</div>
            </section>
          )}

        </div>
      </div>

      {/* P13: sticky Buy bar on phones. */}
      <aside className="pdp-sticky" aria-label="Buy">
        {priceText && <span className="pdp-sticky__price">{price.known ? price.main : priceText}</span>}
        {buyButton('pdp-sticky__buy')}
        {onToggleSaved && (
          <button type="button" className={`pdp-actions__heart${isSaved ? ' is-on' : ''}`} aria-pressed={isSaved} aria-label={isSaved ? 'Saved' : 'Save'} onClick={() => onToggleSaved(product)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART_PATH} /></svg>
          </button>
        )}
      </aside>

      {/* Not divs: web-play.css styles every direct child div of this page as the old card. */}
      <p className="pdp-toast-region" role="status" aria-live="polite">{toast && <span className="pdp-toast">{toast}</span>}</p>

      {lightboxOpen && heroImageSrc && (
        <section className="pdp-lightbox-host">
          <ImageLightbox src={heroImageSrc} alt={displayName} onClose={() => setLightboxOpen(false)} />
        </section>
      )}
    </div>
  );
}
