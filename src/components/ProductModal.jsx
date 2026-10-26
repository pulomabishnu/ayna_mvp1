import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useResearchState } from '../data/researchLoader';
import { ProductImageFallback } from './ProductTileImage';
import ProductCard from './ProductCard';
import { ALL_PRODUCTS, getProfileMatchPercentForProduct, getProductMatchDetailsForProduct } from '../data/products.js';
import { isSafetyHold, isBleedingEvaluation } from '../utils/matchDisplay.js';
import { whyLine } from '../utils/whyLine';
import '../styles/match-ui.css';
import { getAynaRating, getAynaRatingCount } from '../data/aynaReviews';
import { resolveProductImage, isPlaceholderProductImage } from '../utils/resolveProductImage';
import { isPartnerBrandItem, isPrelaunchPartnerItem, getPartnerDisclosureText } from '../utils/partnerBrands';
import { handleImageErrorWithRetry } from '../utils/imageRetry';
import { getSupabaseClient } from '../utils/supabaseClient';
import { renderMarkdownLite } from '../utils/renderMarkdownLite';
import WhyMatchPanel from './WhyMatchPanel';
import { matchLine, priceParts } from '../data/passport/content';
import { buildGlance, perUnitLabel } from './pdp/glance';
import { heroPriceView } from './pdp/heroPrice';
import HeroPrice from './pdp/HeroPrice.jsx';
import { ProductAsk } from './passport/ProductSections';
import ProductEvidence from './pdp/ProductEvidence';
import { SafetyLine, MatchLockup, PriceRow, Highlights, ActionsRow, AskPanel } from './pdp/PdpParts.jsx';
import { costPerUse, highlightsFor, metaLineFor, matchBreakdownFor, alsoAt } from './pdp/decision.js';
import { productAskStarters } from '../utils/productAsk';
import { hasIud, cupOrDisc, keyFormat } from './pdp/pdpParts.js';
import { buyModel } from './pdp/buyModel.js';
import { heroNotes } from './pdp/pdpParts.js';
import { matchLineState, topWarningFor, pageRecall, pregnancyFirstFrom, safetyLineFor } from './pdp/pdpParts.js';
import { HealthBackedBadge } from './health';
import { galleryImages, similarProducts, sameNeedProducts, productJsonLd, breadcrumbJsonLd } from './pdp/commerce';
import ProductGallery from './pdp/ProductGallery.jsx';
import { readsForProduct } from '../data/readLinks.js';
import { takeProductTabIf } from '../utils/community/reviewRatings.js';
import { useProductReviews } from './pdp/useProductReviews';
import { summarizeReviewRows } from '../utils/community/reviewRatings.js';
import { productImageAlt } from '../utils/seoMeta';
import ComparePanel from './pdp/ComparePanel';
import PhoneFold from './pdp/PhoneFold';
import Breadcrumbs from './pdp/Breadcrumbs';
import useJsonLd from './pdp/useJsonLd';
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
import './pdp/pdp-story.css';
import './pdp/pdp-page.css';
import '../styles/pdp-v4.css';
import './pdp/pdp-tabs.css';
import { fetchWithTimeout } from '../utils/network.js';
import { SaveFollowUpInline } from './save/SaveFollowUp.jsx';


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
      const res = await fetchWithTimeout('/api/product-chat', {
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
        setError(e?.message || 'ayna couldn’t answer just now. Check your connection and ask again in a moment.');
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
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.role === 'assistant' ? renderMarkdownLite(m.text) : m.text}
            </div>
          ))}
          {sending && (
            <div style={{ alignSelf: 'flex-start', fontSize: 14, color: 'var(--color-text-muted)' }}>
              ayna is thinking…
            </div>
          )}
        </div>
      )}
      {error && (
        <p style={{ color: 'var(--color-danger, #b3261e)', fontSize: 14, margin: 0 }}>{error}</p>
      )}
      <form
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
        style={{ display: 'flex', gap: '0.5rem' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={session === undefined ? 'One moment…' : 'Ask anything about this product…'}
          disabled={sending || session === undefined}
          style={{
            flex: 1, padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)', fontSize: 14, background: 'var(--color-surface)',
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
  product: catalogProduct,
  // After Save: "Remind me later · Compare" (src/components/save).
  onCompare = null,
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
  // Opens a Library read (the product page lists reads on the same topic).
  onOpenRead = null,
  // Optional: renders a visible in-page "Back" control.
  onBack = null,
  // Breadcrumbs: opens the Shop, filtered to a category when given one.
  // Without it the crumbs are plain links to /shop.
  onOpenShop = null,
  // Opens the composer with this product attached ('post' | 'review' |
  // 'playlist' | 'recommend').
  onCommunityAction = null,
  // Opens one community review (its post page) from the Reviews tab.
  onOpenReview = null,
  // Signed-in person, if any. Logged out, the page offers Save instead of
  // "Add to my ecosystem" (there is no ecosystem yet).
  user = undefined,
  onStartQuiz = null,
  // A safety hold's fix: open that setup question.
  onFixSafety = null,
}) {
  // Research loads on demand on the product page only (data/researchLoader.js).
  const { product, loaded: researchLoaded } = useResearchState(catalogProduct);
  // Two steps on a page's first render: the hero (photo, name, price, Buy)
  // paints first, then the match engine, the compare table and the
  // suggestions (about half a second on a throttled phone) fill in right after
  // it. Moving between products keeps everything in one step.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (settled) return undefined;
    let timer = 0;
    const frame = requestAnimationFrame(() => { timer = setTimeout(() => setSettled(true), 0); });
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [settled]);
  const [zoomOpen, setZoomOpen] = useState(false);
  // Size / pack options (product.variants): Buy now, photo, name and price
  // follow the chosen option.
  // Keyed to the product id so moving to another product page starts from
  // that product's own default option.
  const [variantPick, setVariantPick] = useState({ productId: product?.id, id: product?.defaultVariantId || '' });
  const selectedVariantId = variantPick.productId === product?.id ? variantPick.id : (product?.defaultVariantId || '');
  const setSelectedVariantId = (id) => setVariantPick({ productId: product?.id, id });
  const choice = getVariantSelection(product || {}, selectedVariantId);
  const displayName = String(choice.displayName || product?.name || '').replace(/\s*\u2014\s*/g, ', ');
  // A card's match pill can open the page straight on Why this match.
  const [showWhy, setShowWhy] = useState(() => takeProductTabIf('why'));
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(0);
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
  // A photo that fails to load drops out of the gallery; with none left, the ayna placeholder tile shows.
  const [failedImages, setFailedImages] = useState([]);
  const shownImages = images.filter((src) => !failedImages.includes(src));

  const explicitMatchPercent = useMemo(() => getRealMatchPercent(product), [product]);
  const profileMatchPercent = useMemo(
    () => (settled ? getProfileMatchPercentForProduct(product, quizResults, healthProfile, matchOpts) : null),
    [product, quizResults, healthProfile, matchOpts, settled]
  );
  // No profile, no %: a stored number on the product is not a fit to her.
  // Bleeding after menopause shows the prompt-evaluation message, never a number either.
  const heldForSafety = useMemo(() => { if (!quizResults || !settled) return false; const d = getProductMatchDetailsForProduct(product, quizResults, healthProfile, matchOpts); return isSafetyHold(d) || isBleedingEvaluation(d); }, [product, quizResults, healthProfile, matchOpts, settled]);
  // A safety hold shows no number at all, not even a stored one (founder, Oct 24).
  const matchPercent = quizResults && !heldForSafety ? (profileMatchPercent ?? explicitMatchPercent) : null;
  // The engine's per-need view feeds the one-line "what it matches" and the
  // "Why ayna matched it to you" section. Raw per-need numbers are never
  // shown in the header.
  const matchDetails = useMemo(
    () => (quizResults && settled ? getProductMatchDetailsForProduct(product, quizResults, healthProfile, matchOpts) : null),
    [product, quizResults, healthProfile, matchOpts, settled]
  );
  const headMatchLine = useMemo(() => matchLine(matchDetails), [matchDetails]);
  // utils/buyLink.js: partners go to their own link; everything else to
  // ayna's Amazon link when Amazon carries it, else the brand/retailer page.
  const buyUrl = product ? resolveBuyUrl(product, choice.variant) : null;
  const sizeChosenOnAmazon = choice.hasVariants && product ? buyGoesToAmazonListing(product, choice.variant) : false;
  const variantsMatter = Boolean(product?.variants?.some((v) => v?.priceLabel || (v?.url && !sizeChosenOnAmazon)));
  const isAmazonBuyLink = isAmazonUrl(buyUrl);
  const isPartner = isPartnerBrandItem(product);
  const isPrelaunch = isPrelaunchPartnerItem(product);

  const aynaData = useMemo(
    () => (aynaReviews && product ? (aynaReviews[product.id] || { ratings: [], reviews: [] }) : { ratings: [], reviews: [] }),
    [aynaReviews, product]
  );
  // Only ratings real people left on ayna. The catalog's userRating has no
  // count or source behind it, so it is not shown.
  const storedRating = getAynaRating(product, aynaData);
  const storedCount = getAynaRatingCount(aynaData);
  // The live community reviews win when there are any (same rule as the Reviews section).
  const liveReviewRows = useProductReviews(product?.id);
  const liveStats = liveReviewRows.length ? summarizeReviewRows(liveReviewRows)[product?.id] : null;
  const aynaRating = liveStats ? liveStats.average : storedRating;
  const ratingCount = liveStats ? liveStats.count : storedCount;

  const glance = useMemo(
    () => buildGlance(product, { details: matchDetails, aynaData, aynaRating }),
    [product, matchDetails, aynaData, aynaRating]
  );

  // Bottom of the page: close alternatives in a compare table, then picks
  // that fit this person (when they have a profile) or things for the same
  // need from other categories.
  const suggestions = useMemo(() => {
    if (!product || !settled) return { compare: [], more: [] };
    const owned = new Set((ecosystemProducts || []).map((p) => p?.id).filter(Boolean));
    // Suggestions are photo cards: products without a real photo are left out (same rule as the app).
    const pool = ALL_PRODUCTS.filter((p) => p && p.id && p.name && p.id !== product.id && galleryImages(p).length > 0);
    const compare = similarProducts(product, { pool, limit: 3 });
    const used = new Set([...compare.map((p) => p.id), ...owned]);
    let more = [];
    // Only products for the same need as this one (no tampons under a TENS
    // device); with a profile, those are ordered by her match.
    // Services suggest other services for the same conditions (not tampons under a clinic).
    const tagSet = new Set(product.tags || []);
    const sameNeed = product.category === 'telehealth'
      ? pool.filter((p) => p.category === 'telehealth' && !used.has(p.id) && (p.tags || []).some((t) => tagSet.has(t))).slice(0, 16)
      : sameNeedProducts(product, { pool, limit: 16, exclude: [...used] });
    if (quizResults) {
      more = sameNeed
        .filter((p) => !used.has(p.id))
        .map((p) => ({ p, m: getProfileMatchPercentForProduct(p, quizResults, healthProfile, matchOpts) }))
        .filter((x) => Number.isFinite(x.m) && x.m >= 50)
        .sort((x, y) => y.m - x.m)
        .slice(0, 4)
        .map((x) => ({ ...x.p, _match: Math.round(x.m), _why: whyLine(x.p, getProductMatchDetailsForProduct(x.p, quizResults, healthProfile, matchOpts)) }));
    }
    if (more.length < 4) {
      const have = new Set([...used, ...more.map((p) => p.id)]);
      // Bleeding after menopause: no period or bleeding product is suggested, even unscored.
      const forBleeding = (p) => quizResults && isBleedingEvaluation(getProductMatchDetailsForProduct(p, quizResults, healthProfile, matchOpts));
      more = [...more, ...sameNeed.filter((p) => !have.has(p.id) && !forBleeding(p)).slice(0, 4 - more.length)];
    }
    return { compare, more, personal: Boolean(quizResults) && more.some((p) => p._match) };
  }, [product, ecosystemProducts, quizResults, healthProfile, matchOpts, settled]);

  // Always the production address, so a preview deploy never claims its own URLs in the JSON-LD.
  const origin = 'https://www.aynahealth.co';
  useJsonLd('ay-pdp-jsonld', product ? [
    productJsonLd(product, { origin, buyUrl, aynaRating, ratingCount }),
    breadcrumbJsonLd(product, { origin }),
  ] : []);

  // The first time she sees "Add to my routine", one line says what it means.
  // Watched by the sticky Buy bar on phones.
  const actionsRef = useRef(null);

  if (!product) return null;

  const basePrice = priceParts(product);
  // One price for the whole page: a variant's own price when it has one,
  // otherwise the catalog price (the same one the compare table uses).
  const price = choice.hasVariants && choice.variant?.priceLabel
    ? { known: true, main: choice.variant.priceLabel, sub: '', isPlaceholder: false }
    : basePrice;
  // "Per unit" only when the units are the same thing (not a bundle or kit of different products).
  const perUnit = choice.hasVariants || /\b(bundle|kit|set|starter)\b/i.test(String(product?.name || '')) ? '' : perUnitLabel(product);
  const brand = glance?.brand && glance.brand.toLowerCase() !== String(product.name).toLowerCase() ? glance.brand : '';
  // eslint-disable-next-line no-unused-vars
  const openProductByName = (name) => {
    const target = ALL_PRODUCTS.find((p) => String(p?.name || '').toLowerCase() === String(name || '').toLowerCase());
    if (target && onOpenProduct) onOpenProduct(target);
  };

  // One recall answer for the whole page (utils/productFacts): a named recall is
  // never shown as "No recalls", and "check current notices" isn't a check.
  const recall = pageRecall(product);
  // The one critical line for the safety box near the top (pdp/pdpParts topWarningFor, shared with the app).
  const topWarning = topWarningFor(product, glance, recall, { pregnancyFirst: pregnancyFirstFrom(quizResults) });
  // Who actually sells it, so the button says where it goes ("Buy at LOLA ↗").
  let sellerName = '';
  const brandName = brand || product.brand || '';
  try { sellerName = buyUrl ? (isAmazonBuyLink ? 'Amazon' : brandName ? brandName : product.type === 'digital' ? product.name : new URL(buyUrl).hostname.replace(/^www\./, '')) : ''; } catch { sellerName = ''; }
  // The verb matches what you're doing there: buy a thing, book care, start a trial.
  const priceSays = `${product.price || ''}`;
  const isCare = product.category === 'telehealth' || product.type === 'digital';
  const verb = /free trial/i.test(priceSays) ? 'Start free trial' : product.category === 'telehealth' ? 'Book' : isCare ? 'Get started' : 'Buy';
  // One source of truth for where she buys (pdp/buyModel, shared with the app): "Buy at Amazon · $30".
  const buy = buyModel(product, { variant: choice.variant, brand: brandName, name: displayName, priceMain: price.known && !price.isPlaceholder && String(price.main).length <= 12 ? price.main : '' });
  const buyLabel = buy?.label || (sellerName && sellerName.length <= 32 ? `${verb} at ${sellerName}` : `${verb} with the seller`);
  const buyButton = (extraClass = '') => (buyUrl ? (
    <a
      className={`ay-btn ay-btn--primary ayp-buy__main ayv-buy ${extraClass}`.trim()}
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
          fromSearch: (searchOrigin?.source || '') === 'search_results',
        });
      }}
    >
      {isPrelaunch ? (product.waitlistCtaLabel || 'Join the waitlist') : buyLabel}
      {!isPrelaunch && <span aria-hidden="true">↗</span>}
      <span className="sr-only"> (opens the seller’s site in a new tab)</span>
    </a>
  // Never a disabled primary button: with no link, the page says where it's sold instead.
  ) : null);

  // Size or option: next to Buy, because it changes where Buy goes.
  const variantBlock = (choice.hasVariants ? (
    <>
      {/* A size picker only when picking changes something here (price, link or photo);
          otherwise just say which sizes exist. */}
      {choice.hasVariants && variantsMatter && (
        <label className="ayp-variant">
          <span className="ayp-variant__label">Size or option</span>
          <select
            aria-label="Size / option"
            value={selectedVariantId}
            onChange={(event) => { setSelectedVariantId(event.target.value); setPhoto(0); }}
          >
            <option value="">Choose a size or option</option>
            {product.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.label}</option>)}
          </select>
          <small>
            {sizeChosenOnAmazon
              ? 'The Buy button opens this product on Amazon. Pick the same size there, and confirm current price and availability with the retailer.'
              : 'The Buy button opens this exact option. Confirm current price and availability with the retailer.'}
          </small>
        </label>
      )}
    </>
  ) : null);

  // Sizes as information, not a picker that does nothing (audit 7.9, #7): the options on file, and "Which size am I?"
  // opens Ask with the question filled in. A real picker (the select above) only when picking changes the link or price.
  const sizesLine = choice.hasVariants && !variantsMatter ? (() => {
    const labels = product.variants.map((v) => String(v.label || '').replace(/\s*—\s*/g, ', ')).filter(Boolean);
    const sizey = labels.some((l) => /\d|\b(xs|s|m|l|xl|small|medium|large|regular|super|light|heavy|mini|plus|size|model|pack|count|oz|ml)\b/i.test(l));
    const kind = sizey ? 'Sizes' : /\b(pillow|cover|slipcover)s?\b/i.test(`${product.name} ${labels.join(' ')}`) ? 'Covers' : /color|colour/i.test(labels.join(' ')) ? 'Colors' : 'Styles';
    return (
      <div className="ayp-options ayv-sizes">
        <p className="ayp-options__h">{kind}</p>
        <ul className="ayp-options__list">{labels.map((l) => <li key={l}>{l}</li>)}</ul>
        {sizey && onAskAyna && <button type="button" className="ayv-textbtn" onClick={() => onAskAyna(`About ${displayName}: Which size should I get?`)}>Which size am I?</button>}
      </div>
    );
  })() : null;

  // First screen (team direction 9): one primary Buy, Save beside it. Everything else is a quiet text action.
  const noLinkBuy = !buyUrl && (buy?.url
    ? <a className="ay-btn ay-btn--primary ayp-buy__main ayv-buy ayv-sticker" href={buy.url} target="_blank" rel="noopener noreferrer">{buy.label} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
    : <p className="ayp-buy__note">No buy link yet.</p>);
  // The disclosure, directly under the button (audit 7.9, 15 Disclosure): commission · price date ·
  // "Also at" only for live links · the return policy. Always visible, never collapsed.
  const others = alsoAt(buy?.rows);
  // Stores on file without a link are not a dead row by the button; they stay in Key facts as "Also sold at".
  const unlinkedStores = (buy?.rows || []).filter((r) => !r.url).map((r) => r.name);
  const purchaseNotes = buyUrl && !isPrelaunch ? (
    <>
      <p className="ayp-buy__fine ayv-fine ayv-disclose">
        <span>{isPartner ? 'ayna partner. We may earn a commission.' : isAmazonBuyLink ? 'ayna may earn a commission from Amazon.' : 'ayna may earn a commission.'}</span>
        {buy?.checked && <span>{buy.checked}</span>}
        {others.length > 0 && <span>Also at {others.map((r, i) => <React.Fragment key={r.url}>{i > 0 && ', '}<a className="ayp-textlink" href={r.url} target="_blank" rel="noopener noreferrer" onClick={() => posthog.capture('product_retailer_clicked', { productId: product.id, retailer: r.name })}>{r.name}{r.price ? ` · ${r.price}` : ''}<span className="sr-only"> (opens in a new tab)</span></a></React.Fragment>)}</span>}
        {isAmazonBuyLink && <span><a className="ayp-textlink" href="https://www.amazon.com/gp/help/customer/display.html?nodeId=GKM69DUUYKQWKWX7" target="_blank" rel="noopener noreferrer">Return policy<span className="sr-only">: Amazon’s return policy (opens in a new tab)</span></a></span>}
        {isPartner && <span><button type="button" className="ayp-textlink" aria-expanded={showDisclosure} onClick={() => setShowDisclosure((v) => !v)}>{showDisclosure ? 'Less' : 'How partnerships work'}</button></span>}
      </p>
      {isPartner && showDisclosure && <p className="ayp-buy__fine ayp-buy__disclosure">{getPartnerDisclosureText(product)}</p>}
    </>
  ) : null;

  const galleryTile = (
    <div className="ayp-gallery">
      <ProductGallery
        images={shownImages}
        index={Math.min(photo, Math.max(shownImages.length - 1, 0))}
        onIndex={setPhoto}
        name={displayName}
        product={product}
        alt={(i) => productImageAlt({ ...product, name: displayName }, i, shownImages.length)}
        onImageError={(e, src) => handleImageErrorWithRetry(e, () => setFailedImages((list) => (list.includes(src) ? list : [...list, src])))}
        fallback={<ProductImageFallback />}
        zoomOpen={zoomOpen}
        onZoom={setZoomOpen}
        plate={isSaved ? 'pink' : 'white'}
        frame="square"
      />
      {/* The fact chips that sat here repeated the facts in the meta line and Highlights (audit 7.2, removed). */}
    </div>
  );

  const ownedIds = new Set((ecosystemProducts || []).map((p) => p?.id).filter(Boolean));
  const suggestionCard = (item) => (
    <ProductCard
      key={item.id}
      product={item}
      matchPercent={item._match || null}
      why={item._why || ''}
      isSaved={Boolean(savedProducts && savedProducts[item.id])}
      inEcosystem={ownedIds.has(item.id)}
      onOpen={(p) => onOpenProduct && onOpenProduct(p)}
      onToggleSaved={savedProducts && onToggleSaved ? onToggleSaved : undefined}
    />
  );

  const matchFor = quizResults ? (p) => getProfileMatchPercentForProduct(p, quizResults, healthProfile, matchOpts) : null;
  const detailsFor = quizResults ? (p) => getProductMatchDetailsForProduct(p, quizResults, healthProfile, matchOpts) : null;
  const compareThumb = (p) => {
    const src = galleryImages(p)[0];
    return src ? <img src={src} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : null;
  };

  const rateControls = isInEcosystem && onRate ? (
    <div className="ayp-rate">
      <span className="ayp-rate__label">Rate it</span>
      <div className="ayp-rate__stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`ayp-rate__star${star <= (hoverRating || 0) ? ' is-on' : ''}`}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => {
              // The star she taps starts a community review with that rating.
              // The review is the one record of it, so editing or deleting it
              // later changes the product's average too.
              if (onCommunityAction) onCommunityAction('review', { rating: star });
              else onRate(product, star);
            }}
            aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
          >
            ★
          </button>
        ))}
      </div>
      {onReview && (
        <div className="ayp-rate__row">
          <input type="text" value={reviewInput} onChange={(e) => setReviewInput(e.target.value)} placeholder="Add a short review…" aria-label="Short review" />
          <button
            type="button"
            className="ay-btn ay-btn--secondary"
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
  // eslint-disable-next-line no-unused-vars
  const sectionExtras = {
    // Links backing the safety note (product.safetyNoteSources, from main).
    safety: safetySources.length > 0 ? (
      <ul className="pdp-safety-alert__sources" style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: 12.5, lineHeight: 1.5 }}>
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

  // Her match in one line under the price: the % with its plain why, a safety hold or the bleeding
  // evaluation (never a %), or "See how it fits you" signed out (pdp/pdpParts matchLineState).
  const matchState = matchLineState({ details: matchDetails, percent: matchPercent, hasProfile: Boolean(quizResults), why: whyLine(product, matchDetails), fallback: headMatchLine, canQuiz: !quizResults && !user && Boolean(onStartQuiz) });
  // "Why 92%?": raised / lowered / not known yet from the one engine (matching/breakdown.js), and its reason line.
  const breakdown = matchBreakdownFor(product, matchDetails);
  const matchRow = !settled && (quizResults || healthProfile)
    ? <div className="ay-skel__bar is-sub ayp-fit__skel" role="status" aria-label="Checking your match" />
    : <MatchLockup state={matchState} breakdown={breakdown} onAskWhy={onAskAyna ? (q) => onAskAyna(`About ${displayName}: ${q}`) : null} onFull={() => setShowWhy(true)} onFix={onFixSafety} onQuiz={onStartQuiz} idBase="ay-web-why" />;
  // Price: 22/600 and ayna's own per-cycle or per-day maths (never the brand's savings claim).
  const priceView = heroPriceView(product, { price, perUnit, glance, brand });
  const perUse = choice.variant?.priceLabel ? null : costPerUse(product);
  const metaLine = metaLineFor(product, glance, keyFormat(product, brand));
  const highlights = highlightsFor(product, glance);
  const said = `${metaLine} ${highlights.map((h) => `${h.value} ${h.caption}`).join(' ')}`.toLowerCase();
  const priceNotes = heroNotes(priceView.notes).keep.filter((n) => !said.includes(String(n).toLowerCase().replace(/ eligible$/, '')) && !(perUse && /per (tablet|capsule|softgel|gummy|unit)|a day/i.test(n)));
  // Is it for you: the website's right column on wide screens, above the tabs otherwise.
  const askStarters = productAskStarters({ hasProfile: Boolean(quizResults), percent: matchState?.kind === 'pct' ? matchState.percent : null, kind: cupOrDisc(product), hasIud: hasIud(quizResults), hasSizes: Boolean(product?.variants?.length) });
  const fitData = { details: matchDetails, hasProfile: Boolean(quizResults), onShowWhy: () => setShowWhy(true), extra: matchDetails?.healthData ? <HealthBackedBadge backed={{ section: matchDetails.healthData.section, tracker: ['tracker', 'wearable'].includes(String(product?.category || '').toLowerCase()) }} /> : null };
  // The safety line directly under the buy button: her IUD first when she has one, TSS for cups (PDP audit 7.5).
  const warningLine = <SafetyLine lines={safetyLineFor(product, glance, recall, { answers: quizResults }).lines} />;
  const relatedReads = readsForProduct(product, 3);

  return (
    <div className="ayp" id="pdp-v4" data-tour="pdp">
      <div className="ay-container ayp__page">

        {showWhy && <WhyMatchPanel product={product} quizResults={quizResults} healthProfile={healthProfile} matchOpts={matchOpts} onClose={() => setShowWhy(false)} onUpdateHealth={() => { window.location.href = '/quiz'; }} />}

        <div className="ayp-top">
          {onBack && (
            <button type="button" className="ayp-top__back" onClick={onBack} aria-label="Back">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
          )}
          <Breadcrumbs product={product} onNavigate={onOpenShop} />
          <button type="button" className="ayp-top__share" onClick={handleShare} aria-label={`Share ${product?.name || 'this product'}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
            <span>Share</span>
          </button>
        </div>

        {/* PDP audit Oct 25 (13, 13.1): three columns from 1024px wide: the gallery, the decision block
            (identity, match, price, one button, disclosure, the safety line, actions), and the tabs.
            Everything to the safety line fits the first screen of a 13" laptop. */}
        <div className="ayv-dk">
          {/* Highlights sit under the photo so they stay in the first screen (audit 7.11, 13.1 #11). */}
          <div className="ayv-dk__gallery">{galleryTile}<Highlights items={highlights} note={highlights.length ? 'From the product record. Not tested by ayna.' : ''} /></div>

          <div className="ayv-dk__decide ayp-buy pdp-head__detail" id="ay-buycard">
            {(brand || product.brand) && <p className="ayv-brand">{brand || product.brand}</p>}
            <h1 className="ay-h1 ayp-buy__name pdp-head__name">{displayName}</h1>
            {metaLine && <p className="ayv-metaline">{metaLine}</p>}
            {aynaRating != null && ratingCount > 0 && (
              <button type="button" className="ayp-buy__rating" onClick={() => window.dispatchEvent(new CustomEvent('ay-open-tab', { detail: 'reviews' }))}>
                <span className="ayp-stars" aria-hidden="true">{[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= Math.round(aynaRating) ? 'is-on' : undefined}>{n <= Math.round(aynaRating) ? '★' : '☆'}</span>)}</span>
                <span><b>{aynaRating.toFixed(1)}</b> from {ratingCount} ayna {ratingCount === 1 ? 'review' : 'reviews'}</span>
                <span className="sr-only">, go to reviews</span>
              </button>
            )}

            {/* Her match: the pill, a reason about this product, and "Why 92%?" opening in place. */}
            {matchState?.kind !== 'quiz' && matchRow}

            {priceView.deposit || priceView.rx
              ? <HeroPrice view={{ ...priceView, notes: priceNotes }} />
              : <PriceRow main={priceView.known ? priceView.main : ''} perUse={perUse} notes={priceNotes} />}

            <section className="ayp-buy__section ay-story--buy" aria-labelledby="ay-buy-h">
              <h2 id="ay-buy-h" className="sr-only">Buy</h2>
              {variantBlock}
              <div className="ayp-buy__actions ayv-actions" ref={actionsRef} data-tour="pdp-actions">
                {buyButton('ayv-sticker')}
                {noLinkBuy}
              </div>
              {purchaseNotes}
              {warningLine}
              <ActionsRow
                saved={isSaved}
                saveLabel={isSaved ? `Saved. Remove ${displayName} from Saved` : `Save ${displayName}`}
                onSave={onToggleSaved ? () => { onToggleSaved(product); showToast(isSaved ? 'Removed from Saved' : user ? 'Saved to My Ecosystem' : 'Saved on this device. Sign in to keep it everywhere.'); } : null}
                inRoutine={isInEcosystem}
                onRoutine={onAddToEcosystem && user ? () => onAddToEcosystem(product) : null}
                onAsk={onAskAyna ? () => setAskOpen(true) : null}
                notForMe={onOmit && user ? <p className="ayv-acts__more"><button type="button" className="ayv-textbtn" onClick={() => onOmit(product)}>{isOmitted ? 'Undo “Not for me”' : 'Not for me'}</button></p> : null}
              />
              {sizesLine}
              <SaveFollowUpInline product={product} onCompare={onCompare} />
              {matchState?.kind === 'quiz' && <div className="ayv-quizline">{matchRow}</div>}
            </section>
          </div>

          {/* Tabs: ayna summary (open), Clinical opinion, Scientific literature, Reviews (PDP audit, Oct 25). */}
          <div className="ayv-dk__tabs ayp-tabsarea pdp-head__info">
            <ProductEvidence loading={!researchLoaded} product={product} safetyLead={topWarning} glance={glance} aynaData={aynaData} aynaRating={aynaRating} ratingCount={ratingCount} rateControls={rateControls} onOpenReview={onOpenReview} onWriteReview={onCommunityAction ? () => onCommunityAction('review') : null} fit={fitData} extraRows={unlinkedStores.length ? [{ label: 'Also sold at', value: unlinkedStores.join(', ') }] : []} askSlot={onAskAyna ? <ProductAsk productName={displayName} onAsk={onAskAyna} hasProfile={Boolean(quizResults)} /> : null} endCta={buyUrl && !isPrelaunch ? buyButton('ayv-sticker is-compact') : null} />
          </div>
        </div>

        {onAskAyna && <AskPanel open={askOpen} onClose={() => setAskOpen(false)} title={`Ask about ${displayName}`} starters={askStarters} onAsk={(q) => { setAskOpen(false); onAskAyna(`About ${displayName}: ${q}`); }} />}

        {/* Compare, then Ask or share side by side on desktop. */}
        {settled && <section className="ay-section ayp-compare" aria-label="Compare with similar">
          <PhoneFold id="pdp-compare" title="Compare with similar" line={suggestions.compare.length ? `Side by side with ${suggestions.compare.slice(0, 2).map((p) => p.name).join(' and ')}.` : 'Pick products to compare side by side.'}>
            <ComparePanel product={product} others={suggestions.compare} onOpen={(p) => onOpenProduct && onOpenProduct(p)} matchFor={matchFor} detailsFor={detailsFor} renderThumb={compareThumb} />
          </PhoneFold>
        </section>}

        {/* Ask about this product now sits at the end of ayna summary; sharing stays here. */}
        {onCommunityAction && (
          <section className="ay-section ayp-askshare" aria-label="Share">
            <section className="ay-group is-padded ayp-tried" aria-labelledby="pdp-community-h">
              <h2 id="pdp-community-h" className="ay-h3">Tried it?</h2>
              <div className="ayp-tried__actions">
                <button type="button" className="ay-btn ay-btn--primary" onClick={() => onCommunityAction('review')}>Write a review</button>
              </div>
              <ul className="ay-group__rows ayp-tried__more" aria-label="More ways to share">
                {[['post', 'Mention in a post'], ['playlist', 'Add to playlist'], ['recommend', 'Recommend to a friend']].map(([kind, label]) => (
                  <li key={kind}><button type="button" className="ay-group__row ay-group__row--link" onClick={() => onCommunityAction(kind)}><span className="ay-group__value">{label}</span><span className="ay-group__end" aria-hidden="true">›</span></button></li>
                ))}
              </ul>
            </section>
          </section>
        )}

        {relatedReads.length > 0 && (
          <section className="ay-section ayp-reads" aria-labelledby="pdp-reads-h">
            <h2 id="pdp-reads-h" className="ay-h2">Read about it</h2>
            <p className="ayp-more__line">Library reads on the same topic, checked against .gov sources.</p>
            <ul className="ayp-reads__list">
              {relatedReads.map((r) => (
                <li key={r.id}>
                  <a href={`/library/${r.id}`} onClick={(e) => { if (!onOpenRead || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return; e.preventDefault(); onOpenRead(r.id); }}>
                    <span className="ayp-reads__title">{r.title}</span>
                    {r.teaser && <span className="ayp-reads__teaser">{r.teaser}</span>}
                    <span className="ayp-reads__go" aria-hidden="true">→</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {suggestions.more.length > 0 && (
          <section className="ay-section ay-shelf ayp-more" aria-labelledby="pdp-more-h">
            <div className="ay-shelf__head">
              <h2 id="pdp-more-h" className="ay-h2">You may also like</h2>
            </div>
            <p className="ayp-more__line">{suggestions.personal ? 'For the same need, ordered by how well each fits you.' : 'For the same need, from other parts of the shop.'}</p>
            <ul className="ay-shelf__row ayp-more__row">{suggestions.more.map((item) => <li key={item.id}>{suggestionCard(item)}</li>)}</ul>
          </section>
        )}
      </div>

      <p className="ayp-toast-region" role="status" aria-live="polite">{toast && <span className="ayp-toast">{toast}</span>}</p>

    </div>
  );
}
