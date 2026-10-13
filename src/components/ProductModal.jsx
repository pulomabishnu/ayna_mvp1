import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProductImageFallback } from './ProductTileImage';
import ProductCard from './ProductCard';
import { ALL_PRODUCTS, getProfileMatchPercentForProduct, getProductMatchDetailsForProduct, CATEGORY_LABELS } from '../data/products';
import { exclusionLines } from '../utils/matchDisplay';
import '../styles/match-ui.css';
import { getAynaRating } from '../data/aynaReviews';
import { resolveProductImage, isPlaceholderProductImage } from '../utils/resolveProductImage';
import { isPartnerBrandItem } from '../utils/partnerBrands';
import { handleImageErrorWithRetry } from '../utils/imageRetry';
import { getSupabaseClient } from '../utils/supabaseClient';
import { renderMarkdownLite } from '../utils/renderMarkdownLite';
import WhyMatchPanel from './WhyMatchPanel';
import MatchPill from './MatchPill';
import ProductSections from './passport/ProductSections';
import { buildProductSections, headerFacts, matchLine, priceParts, noDash } from '../data/passport/content';
import { PRODUCT_BUY_URLS } from '../data/productBuyUrls';
import posthog from 'posthog-js';
import '../styles/audit-pdp.css';
import '../styles/verify-content.css';

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
  // Optional: renders a visible in-page "Back" control.
  onBack = null,
  // Opens the composer with this product attached ('post' | 'review' |
  // 'playlist' | 'recommend').
  onCommunityAction = null,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
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
    const url = `${window.location.origin}/product/${encodeURIComponent(product?.id || '')}`;
    const isPhone = typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_QUERY).matches;
    if (isPhone && navigator.share) {
      try { await navigator.share({ title: product?.name, url }); return; } catch (e) { if (e?.name === 'AbortError') return; }
    }
    const ok = await copyText(url);
    showToast(ok ? 'Link copied' : 'Couldn’t copy the link');
  };

  const [reviewInput, setReviewInput] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [resolvedModalImage, setResolvedModalImage] = useState('');

  // Most catalog entries only ever carry a single `image` URL. When that's a
  // placeholder, this tries once to resolve a real product photo instead.
  useEffect(() => {
    let active = true;
    if (!product?.name) return () => { active = false; };
    if (!isPlaceholderProductImage(product.image, product.type === 'digital')) return () => { active = false; };
    resolveProductImage(product.name, product.brand || '', '', product.type || '').then((url) => {
      if (!active || !url) return;
      setResolvedModalImage(url);
    });
    return () => { active = false; };
  }, [product?.id, product?.name, product?.brand, product?.image, product?.type]);

  const heroImageSrc = resolvedModalImage || product?.image || '';

  const explicitMatchPercent = useMemo(() => getRealMatchPercent(product), [product]);
  const profileMatchPercent = useMemo(
    () => getProfileMatchPercentForProduct(product, quizResults, healthProfile, matchOpts),
    [product, quizResults, healthProfile, matchOpts]
  );
  const matchPercent = profileMatchPercent ?? explicitMatchPercent;
  // The engine's per-need view feeds the one-line "what it matches" and the
  // deeper "Why ayna matched it to you" section. Raw per-need numbers are
  // never shown in the header.
  const matchDetails = useMemo(
    () => (quizResults ? getProductMatchDetailsForProduct(product, quizResults, healthProfile, matchOpts) : null),
    [product, quizResults, healthProfile, matchOpts]
  );
  const matchExclusions = matchDetails?.matchStatus === 'excluded' ? exclusionLines(matchDetails) : [];
  const headMatchLine = useMemo(() => matchLine(matchDetails), [matchDetails]);
  const buyUrl = useMemo(() => getBuyUrl(product), [product]);
  const usesAffiliateLink = Boolean(
    isExactBuyUrl(product?.affiliateUrl) &&
    buyUrl === String(product.affiliateUrl).trim()
  );

  const aynaData = useMemo(
    () => (aynaReviews && product ? (aynaReviews[product.id] || { ratings: [], reviews: [] }) : { ratings: [], reviews: [] }),
    [aynaReviews, product]
  );
  // Only ratings real people left on ayna. The catalog's userRating has no
  // count or source behind it, so it is not shown.
  const aynaRating = getAynaRating(product, aynaData);

  // Bottom of the page: products that fit this person (when they have a
  // profile), then more from the same category.
  const suggestions = useMemo(() => {
    if (!product) return { matches: [], similar: [] };
    const owned = new Set((ecosystemProducts || []).map((p) => p?.id).filter(Boolean));
    const pool = ALL_PRODUCTS.filter((p) => p && p.id && p.name && p.id !== product.id && !owned.has(p.id));
    let matches = [];
    if (quizResults) {
      matches = pool
        .map((p) => ({ p, m: getProfileMatchPercentForProduct(p, quizResults, healthProfile, matchOpts) }))
        .filter((x) => Number.isFinite(x.m) && x.m >= 50)
        .sort((x, y) => y.m - x.m)
        .slice(0, 4)
        .map((x) => ({ ...x.p, _match: Math.round(x.m) }));
    }
    const used = new Set(matches.map((p) => p.id));
    const similar = pool.filter((p) => !used.has(p.id) && p.category === product.category).slice(0, 4);
    return { matches, similar };
  }, [product, ecosystemProducts, quizResults, healthProfile, matchOpts]);

  const eyebrow = useMemo(() => {
    if (!product) return '';
    const categoryLabel = String(CATEGORY_LABELS[product.category] || product.type || '').replace(/^[^\w]+\s*/, '');
    return [categoryLabel, product.brand].filter(Boolean).join(' · ');
  }, [product]);

  const safetyAlert = useMemo(() => {
    const t = getSafetyAlertText(product);
    return t ? noDash(t) : null;
  }, [product]);

  // At most four facts in the header; claims the engine could not confirm
  // for her (details.blockedClaims) are never shown.
  const facts = useMemo(
    () => headerFacts(product, { blockedClaims: matchDetails?.blockedClaims || [] }),
    [product, matchDetails]
  );
  const sections = useMemo(
    () => buildProductSections(product, { details: matchDetails, aynaData, aynaRating }),
    [product, matchDetails, aynaData, aynaRating]
  );

  if (!product) return null;

  const price = priceParts(product);
  const priceText = product.price || product.stage || '';
  const openPlaylist = onCommunityAction ? () => onCommunityAction('playlist') : null;
  const openProductByName = (name) => {
    const target = ALL_PRODUCTS.find((p) => String(p?.name || '').toLowerCase() === String(name || '').toLowerCase());
    if (target && onOpenProduct) onOpenProduct(target);
  };

  const partnerBadge = isPartnerBrandItem(product) ? (
    <span className="pdp-partner" title="ayna has a partnership with this brand. It does not affect your recommendation.">
      ayna partner
    </span>
  ) : null;

  const buyButton = (extraClass = '') => (buyUrl ? (
    <a
      className={`pdp-btn pdp-btn--navy pdp-btn--buy ${extraClass}`.trim()}
      href={buyUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => posthog.capture('product_buy_now_clicked', {
        productId: product.id,
        category: product.category,
        destination: buyUrl,
      })}
    >
      Buy now
    </a>
  ) : (
    <button type="button" className={`pdp-btn pdp-btn--navy pdp-btn--buy ${extraClass}`.trim()} disabled>
      Buy now
    </button>
  ));

  const actionButtons = (
    <div className="pdp-actions pdp-buybox">
      <div className="pdp-actions__primary">
        {buyButton()}
        {onAddToEcosystem && (
          <button
            type="button"
            className={`pdp-btn pdp-actions__ecosystem${isInEcosystem ? ' is-on' : ''}`}
            aria-pressed={isInEcosystem}
            title={isInEcosystem ? 'Removes it from your ecosystem' : 'Adds it to your ecosystem'}
            onClick={() => onAddToEcosystem(product)}
          >
            {isInEcosystem ? 'Remove from ecosystem' : 'Add to ecosystem'}
          </button>
        )}
        {onToggleSaved && (
          <SaveMenu isSaved={isSaved} onToggleSaved={onToggleSaved} onAddToPlaylist={openPlaylist} product={product} />
        )}
      </div>
      {usesAffiliateLink && <p className="pdp-buybox__note">ayna may earn a commission if you buy through this link.</p>}
    </div>
  );

  const galleryTile = (
    <div className="pdp-head__tile" style={{ position: 'relative' }}>
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

  const relatedGrid = (suggestions.matches.length > 0 || suggestions.similar.length > 0) && (
    <div className="pdp-suggest">
      {suggestions.matches.length > 0 && (
        <section>
          <h3>Matches your profile</h3>
          <div className="pdp-suggest__grid">{suggestions.matches.map(suggestionCard)}</div>
        </section>
      )}
      {suggestions.similar.length > 0 && (
        <section>
          <h3>{suggestions.matches.length > 0 ? 'More like this' : 'You might also like'}</h3>
          <div className="pdp-suggest__grid">{suggestions.similar.map(suggestionCard)}</div>
        </section>
      )}
    </div>
  );

  const rateControls = isInEcosystem && onRate ? (
    <div className="pdp-rate">
      <span className="ay-psec-label">Rate it</span>
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

  const hasPeople = sections.some((s) => s.id === 'people');
  const extraSections = [
    ...(rateControls && !hasPeople ? [{ id: 'people', title: 'What people say', preview: 'Rate it', node: rateControls }] : []),
    {
      id: 'ask',
      title: 'Ask ayna',
      preview: 'Questions about this product',
      node: <AskAynaProductTab product={product} aiContext={{}} quizResults={quizResults} ecosystemProducts={ecosystemProducts} />,
    },
  ];
  const sectionExtras = {
    people: rateControls,
    match: <button type="button" className="ay-psec-action" onClick={() => setShowWhy(true)}>See the full breakdown</button>,
  };

  return (
    <div className="mockup-page pdp-page-wrap">
      <div className="pdp-page">

        {showWhy && <WhyMatchPanel product={product} quizResults={quizResults} healthProfile={healthProfile} matchOpts={matchOpts} onClose={() => setShowWhy(false)} onUpdateHealth={() => { window.location.href = '/quiz'; }} />}

        <div className="pdp-topbar">
          {onBack ? (
            <button type="button" className="pdp-back" onClick={onBack}>
              ← Back
            </button>
          ) : <span />}
          <div className="pdp-topbar__right">
            {!(matchPercent > 0) && (
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

        <div className="pdp-head">
          <div>
            {galleryTile}
          </div>

          <div className="pdp-head__detail pdp-h2">
            <div className="pdp-head__eyebrow">{eyebrow}{partnerBadge && <> · {partnerBadge}</>}</div>
            <h1 className="pdp-head__name">{product.name}</h1>

            {(price.known || price.perUnit) && (
              <div className="pdp-h2-price">
                {price.known && <span className="pdp-h2-price__main">{price.main}</span>}
                {price.perUnit && <span className="pdp-h2-price__unit">{price.perUnit}</span>}
                {price.known && price.sub && <small>{price.sub}</small>}
              </div>
            )}

            {matchPercent > 0 && (
              <div className="pdp-h2-match">
                <MatchPill percent={matchPercent} onClick={() => setShowWhy(true)} label={`${matchPercent}% match${headMatchLine ? `. ${headMatchLine}` : ''}. See why`} />
                {headMatchLine && <span className="pdp-h2-match__line">{headMatchLine}</span>}
              </div>
            )}
            {!(matchPercent > 0) && matchExclusions.length > 0 && (
              <button type="button" className="pdp-h2-fitnote" onClick={() => setShowWhy(true)}>
                {matchExclusions[0]}
              </button>
            )}
            {!(matchPercent > 0) && !matchExclusions.length && isInEcosystem && (
              <p className="pdp-h2-fitnote is-static">In your ecosystem</p>
            )}

            {facts.length > 0 && (
              <ul className="pdp-h2-facts" aria-label="About this product">
                {facts.map((f) => (
                  <li key={f.label} className={`is-${f.type}`}>
                    {f.type === 'check' && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>}
                    {f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer">{f.label}</a> : f.label}
                  </li>
                ))}
              </ul>
            )}

            {safetyAlert && <SafetyAlert text={safetyAlert} />}

            {actionButtons}
          </div>
        </div>

        <div className="pdp-below pdp-below--passport">
          <ProductSections
            key={product.id}
            sections={sections}
            extras={sectionExtras}
            extraSections={extraSections}
            onXref={openProductByName}
          />

          {(onCommunityAction || onOmit) && (
            <section className="pdp-community-actions pdp-community-actions--flat" aria-labelledby="pdp-community-h">
              {onCommunityAction && <>
                <h3 id="pdp-community-h">Community</h3>
                <div className="pdp-community-actions__grid">
                  {[['post', 'Mention in a post'], ['review', 'Write a review'], ['recommend', 'Recommend to a friend']].map(([kind, label]) => (
                    <button key={kind} type="button" className={kind === 'post' ? 'is-primary' : undefined} onClick={() => onCommunityAction(kind)}>{label}</button>
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
        </div>

        {relatedGrid}
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
          <ImageLightbox src={heroImageSrc} alt={product.name} onClose={() => setLightboxOpen(false)} />
        </section>
      )}
    </div>
  );
}
