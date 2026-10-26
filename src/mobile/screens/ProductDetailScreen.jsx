import { useEffect, useMemo, useRef, useState } from 'react';
import { trackApp } from '../utils/appAnalytics.js';
import { PANEL_ICONS } from '../components/pdpIcons.jsx';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct } from '../../data/products.js';
import ProductCard from '../components/ProductCard.jsx';
import { matchPercentFor } from '../utils/matchScore.js';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { renderMarkdownLite } from '../../utils/renderMarkdownLite.jsx';
import { isPartnerBrandItem, getPartnerDisclosureText } from '../../utils/partnerBrands.js';
import WhyMatchScreen from './WhyMatchScreen.jsx';
import { isBleedingEvaluation } from '../../utils/matchDisplay.js';
import { whyLine } from '../../utils/whyLine.js';
import ProductEvidence from '../../components/pdp/ProductEvidence.jsx';
import { SafetyLine, MatchLockup, PriceRow, Highlights, ActionsRow, AskPanel } from '../../components/pdp/PdpParts.jsx';
import { costPerUse, highlightsFor, metaLineFor, matchBreakdownFor, alsoAt } from '../../components/pdp/decision.js';
import { haptic } from '../../utils/haptics.js';
import { buyModel } from '../../components/pdp/buyModel.js';
import { heroPriceView } from '../../components/pdp/heroPrice.js';
import { priceParts } from '../../data/passport/priceParts.js';
import { matchLineState, topWarningFor, pageRecall, heroNotes, pregnancyFirstFrom, safetyLineFor, hasIud, cupOrDisc, keyFormat } from '../../components/pdp/pdpParts.js';
import { useResearchState } from '../../data/researchLoader.js';
import { matchLine } from '../../data/passport/content.js';
import { buildGlance, perUnitLabel } from '../../components/pdp/glance.js';
import { galleryImages, similarProducts, sameNeedProducts } from '../../components/pdp/commerce.js';
import ProductGallery from '../../components/pdp/ProductGallery.jsx';
import '../../components/pdp/pdp-tabs.css';
import ComparePanel from '../../components/pdp/ComparePanel.jsx';
import { worksWith } from '../../utils/aynaIntegrations.js';
import LegalFooter from '../components/LegalFooter.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { SaveFollowUpInline } from '../../components/save/SaveFollowUp.jsx';
import { ADD_TO_ROUTINE, IN_ROUTINE } from '../../utils/routineCopy.js';
import { safeProductImageSrc } from '../../utils/resolveProductImage.js';
import { productImageOverride } from '../../data/productImageOverrides.js';
import { apiUrl } from '../../utils/apiUrl.js';
import { productHref } from '../../utils/productRoute.js';
import { HEART_PATH } from '../utils/heart.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { displayName } from '../utils/displayName.js';
import { cardKind } from '../../utils/productCardFacts.js';
import '../pdp.css';
import '../eco-needs.css';
import '../pdp-polish.css';
import '../app-pdp.css';
import { fetchWithTimeout } from '../../utils/network.js';
import { productAskStarters, productMatchContext, PRODUCT_ASK_TITLE, PRODUCT_ASK_PLACEHOLDER } from '../../utils/productAsk.js';
import { localMatchAnswer } from '../../utils/askMatch.js';

function toneFor(product) {
  const functions = product?.healthFunctions || [];
  const category = product?.category;
  if (functions.some((item) => ['perimenopause', 'hormone-balance'].includes(item)) || ['telehealth', 'digital', 'therapy', 'tracker'].includes(category) || product?.type === 'digital') return 'peri';
  if (functions.includes('fertility') || ['diagnostics', 'supplement', 'vitamin'].includes(category)) return 'butter';
  if (['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'pelvic-floor'].includes(category)) return 'mint';
  return 'pink';
}

/**
 * Ask Ayna, ported from AskAynaProductTab in src/components/ProductModal.jsx
 *, same /api/product-chat contract, same getSupabaseClient() bearer-token
 * auth, same not-signed-in / weekly-limit-reached handling. Only the markup
 * changed (mobile's own inline-style patterns instead of the desktop
 * pdp-* classes).
 */
function AskAynaTab({ product, quizAnswers, ecosystemProducts, onRequireAuth, matchOpts, starters = null }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState(undefined); // undefined = still checking

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setSession(null);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data?.session || null);
    }).catch(() => { if (!cancelled) setSession(null); });
    return () => { cancelled = true; };
  }, []);

  const suggestions = starters || productAskStarters({ hasProfile: Boolean(quizAnswers) });

  const ask = async (question) => {
    const q = String(question || '').trim();
    if (!q || sending) return;
    // Her match comes from ayna's engine on this device (same % as the page), no account needed.
    const local = await localMatchAnswer(q, { quizAnswers, matchOpts, focusProduct: product }).catch(() => null);
    if (local) { setError(''); setInput(''); setMessages((prev) => [...prev, { role: 'user', text: q }, { role: 'assistant', text: local.answer }]); return; }
    if (!session?.access_token) { onRequireAuth?.('Ask ayna'); return; }
    setError('');
    setInput('');
    const nextMessages = [...messages, { role: 'user', text: q }];
    setMessages(nextMessages);
    setSending(true);
    try {
      const token = session?.access_token;
      if (!token) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      const res = await fetchWithTimeout(apiUrl('/api/product-chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          question: q,
          product,
          aiInsights: {},
          userContext: quizAnswers?.fullHealthIntake ? JSON.stringify(quizAnswers.fullHealthIntake).slice(0, 4000) : '',
          ecosystemProducts: Array.isArray(ecosystemProducts) ? ecosystemProducts.slice(0, 20) : [],
          matchContext: quizAnswers ? productMatchContext(product, getProductMatchDetailsForProduct(product, quizAnswers, null, matchOpts)) : '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      if (res.status === 429) throw Object.assign(new Error('weekly_limit_reached'), { code: 'weekly_limit_reached' });
      if (!res.ok || !data?.answer) throw new Error(data?.error || 'Could not get an answer right now.');
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }]);
    } catch (e) {
      if (e?.code === 'not_signed_in') {
        onRequireAuth?.('Ask ayna');
      } else if (e?.code === 'weekly_limit_reached') {
        setError("You've used your free chats for this week. They reset weekly.");
      } else {
        setError(e?.message || 'ayna couldn’t answer just now. Check your connection and ask again in a moment.');
      }
      setMessages(nextMessages); // keep the question visible even though it failed
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ay-pdp-ask" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Anchored to the product: every question here is about it. */}
      {messages.length === 0 && (
        <>
          <div className="ayv-askstarters" style={{ display: 'grid', gap: 8 }}>
            {suggestions.map((s) => (
              <button
                type="button"
                disabled={sending}
                key={s}
                onClick={() => ask(s)}
                style={{ width: '100%', textAlign: 'left', fontSize: 'calc(14px * var(--ayna-text-scale, 1))', fontWeight: 600, minHeight: 48, border: '1.5px solid currentColor', padding: '10px 16px', borderRadius: 16, background: 'transparent', color: 'var(--ayna-text)', cursor: 'pointer' }}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}

      {messages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, maxHeight: 340, overflowY: 'auto' }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'user' ? 'var(--ayna-cta-bg)' : 'var(--ayna-chip-bg)',
                color: m.role === 'user' ? 'var(--ayna-cta-text)' : 'var(--ayna-text)',
                borderRadius: 14,
                padding: '10px 13px',
                fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))',
                lineHeight: 1.45,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.role === 'assistant' ? renderMarkdownLite(m.text) : m.text}
            </div>
          ))}
          {sending && <div style={{ alignSelf: 'flex-start', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)' }}>Looking into it…</div>}
        </div>
      )}

      {error && <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', lineHeight: 1.5 }}>{error}</div>}

      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={session === undefined ? 'One moment…' : PRODUCT_ASK_PLACEHOLDER}
          disabled={sending || session === undefined}
          style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: 99, border: '1px solid var(--ayna-border)', fontSize: 'max(16px, calc(13.5px * var(--ayna-text-scale, 1)))', background: 'var(--ayna-surface)', color: 'var(--ayna-text)' }}
        />
        <button
          type="submit"
          disabled={sending || !input.trim() || session === undefined}
          style={{
            padding: '11px 18px',
            borderRadius: 99,
            border: 'none',
            background: 'var(--ayna-cta-bg)',
            color: 'var(--ayna-cta-text)',
            fontFamily: "var(--ayna-font-ui)",
            fontWeight: 500,
            fontSize: 'calc(13px * var(--ayna-text-scale, 1))',
            cursor: 'pointer',
            opacity: sending || !input.trim() || session === undefined ? 0.5 : 1,
          }}
        >
          Ask
        </button>
      </form>

      <div className="ay-pdp-ask-note">ayna's answers are educational, not medical advice.</div>
    </div>
  );
}

export default function ProductDetailScreen({
  product: catalogProduct,
  onBack,
  isSaved = false,
  onToggleSaved,
  isInEcosystem = false,
  onAddToEcosystem,
  onCommunityAction,
  // Opens one community review in Community (from the Reviews list below).
  onOpenReview = null,
  onRequireAuth,
  onStartQuiz,
  // A safety hold's fix: open that setup question (e.g. 'medications').
  onFixSafety = null,
  whyMatched,
  reads = [],
  quizAnswers = null,
  ecosystemProducts = [],
  onOpenProduct,
  // Matching engine behavior signals and the "Not for me" action.
  matchOpts,
  isOmitted = false,
  onToggleOmit,
  // After Save: "Remind me later · Compare" (src/components/save).
  onCompare = null,
  // "ayna" in Works with opens You > Health data.
  onOpenHealthData = null,
}) {
  // The same research layer the website loads (data/researchLoader.js), so the app shows every field.
  const { product, loaded: researchLoaded } = useResearchState(catalogProduct);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  // Rendered locally (not through MobileApp's shared `overlay` state, which
  // only holds one layer) so "back" from here returns to this product
  // instead of closing straight through to whatever screen sits underneath.
  const [showWhyMatch, setShowWhyMatch] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  // Reset per-product UI state on product switch, this screen can receive
  // a new `product` prop without unmounting (MobileApp doesn't key it).
  // Adjusted during render (React's recommended pattern for resetting state
  // when a prop changes) rather than in an effect, to avoid the extra
  // render pass a setState-in-effect would cause.
  const [seenProductId, setSeenProductId] = useState(product?.id);
  if (product?.id !== seenProductId) {
    setSeenProductId(product?.id);
    setPartnerOpen(false);
    setPhoto(0);
    setZoomOpen(false);
    setAskOpen(false);
  }

  // Bottom of the page, same as the website: close alternatives in a
  // compare table, then picks that fit her (or things for the same need).
  const related = useMemo(() => {
    if (!product) return { compare: [], more: [] };
    const owned = new Set((ecosystemProducts || []).map((p) => p?.id).filter(Boolean));
    const pool = ALL_PRODUCTS.filter((p) => p && p.id && p.name && p.id !== product.id);
    const compare = onOpenProduct ? similarProducts(product, { pool, limit: 3 }) : [];
    const used = new Set([...compare.map((p) => p.id), ...owned]);
    // Suggestions are photo cards: products without a photo are left out (same rule as the website's top picks).
    const photoPool = pool.filter((p) => productImageOverride(p) || safeProductImageSrc(p.image || p.imageUrl || p.images?.[0]));
    let more = !onOpenProduct ? [] : quizAnswers ? photoPool
      .filter((p) => !used.has(p.id))
      .map((p) => ({ p, m: getProductMatchDetailsForProduct(p, quizAnswers, null, matchOpts) }))
      .filter(({ m }) => m?.matchStatus === 'scored' && Number.isFinite(m.percent) && m.percent >= 50)
      .sort((a, b) => b.m.percent - a.m.percent)
      .slice(0, 4)
      .map(({ p }) => p) : [];
    const personal = more.length > 0;
    // Bleeding after menopause: no period or bleeding product is suggested, even unscored.
    const fallbackPool = quizAnswers ? photoPool.filter((p) => !isBleedingEvaluation(getProductMatchDetailsForProduct(p, quizAnswers, null, matchOpts))) : photoPool;
    if (onOpenProduct && more.length < 4) more = [...more, ...sameNeedProducts(product, { pool: fallbackPool, limit: 4 - more.length, exclude: [...used, ...more.map((p) => p.id)] })];
    return { compare, more, personal };
  }, [product, onOpenProduct, ecosystemProducts, quizAnswers, matchOpts]);

  // The first time she sees "Add to my routine", one line says what it means.
  // Watched by the sticky Buy bar.
  const actionsRef = useRef(null);
  if (!product) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ayna-text-muted)', fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))' }}>
        No product selected.
      </div>
    );
  }

  if (showWhyMatch) {
    return (
      <WhyMatchScreen
        product={product}
        quizAnswers={quizAnswers}
        matchOpts={matchOpts}
        onBack={() => setShowWhyMatch(false)}
        onUpdateHealth={onStartQuiz}
        onViewDetails={() => setShowWhyMatch(false)}
      />
    );
  }

  const matchDetails = getProductMatchDetailsForProduct(product, quizAnswers, null, matchOpts);
  // The same number as the Shop card, shelf and Swipe (utils/matchScore).
  const matchPercent = quizAnswers ? matchPercentFor(product, quizAnswers, matchOpts) : null;
  // One pill + one short line. Per-need numbers live in the Why view only.
  // The line beside the pill explains the % in plain words (engine reasons).
  const headLine = matchPercent != null ? (whyLine(product, matchDetails) || matchLine(matchDetails)) : '';
  const openWhyMatch = () => setShowWhyMatch(true);

  const {
    name,
    category,
    brand,
    price,
    image,
  } = product;

  // Sentence case at render (docs/terminology.md): the data keeps the team's casing.
  const categoryLabel = cardKind({ category });
  // One source of truth for where she buys (pdp/buyModel, the website's rule).
  const buy = buyModel(product, { brand, name: displayName(product) });
  const isPartner = isPartnerBrandItem(product);
  const partnerDisclosure = getPartnerDisclosureText(product);
  // Same information architecture as the website's product page
  // (components/pdp/ProductEvidence): ayna's summary, At a glance, then the
  // Clinical opinion / Scientific literature / Reviews / Safety / How to use /
  // Details tabs with their source cards.
  const glance = buildGlance(product, { details: quizAnswers ? matchDetails : null, whyMatched });
  const brandLine = brand && String(brand).trim().toLowerCase() !== String(name || '').trim().toLowerCase() ? brand : categoryLabel;
  // One recall answer and the one critical caution for the page, as on the website (pdp/pdpParts).
  const recall = pageRecall(product);
  const topWarning = topWarningFor(product, glance, recall, { pregnancyFirst: pregnancyFirstFrom(quizAnswers) });
  const images = galleryImages(product);
  const matchFor = quizAnswers ? (p) => matchPercentFor(p, quizAnswers, matchOpts) : null;
  const detailsFor = quizAnswers ? (p) => getProductMatchDetailsForProduct(p, quizAnswers, null, matchOpts) : null;

  const handleShare = async () => {
    const origin = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
      ? 'https://www.aynahealth.co'
      : window.location.origin;
    const shareData = { title: name, text: `Take a look at ${name} on ayna`, url: new URL(productHref(product.id), origin).toString() };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled the share sheet */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareData.url ? `${shareData.text}: ${shareData.url}` : shareData.text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch { /* clipboard unavailable, nothing more we can do */ }
  };

  const works = worksWith(product);
  const tone = toneFor(product);
  const shownName = displayName(product);
  const perUnit = perUnitLabel(product);
  // Same price model as the cards (and the website): short main + detail line.
  const shownPrice = formatPrice(product);

  const variantLabels = (product.variants || []).map((v) => String(v?.label || '').replace(/\s*—\s*/g, ', ')).filter(Boolean);
  const variantKind = variantLabels.some((l) => /\d|\b(xs|s|m|l|xl|small|medium|large|regular|super|light|heavy|mini|plus|size|pack|count|oz|ml)\b/i.test(l)) ? 'Sizes' : 'Options';
  const shopAction = buy?.url ? { href: buy.url, label: buy.label, sr: '(opens the seller’s site)', placement: 'product_detail' } : null;
  const storesOnFile = !shopAction ? [...new Set((product.whereToBuy || []).map((w) => String(w).trim()).filter(Boolean))].map((w) => (/^app store$/i.test(w) ? 'the App Store' : w)) : [];
  const andList = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

  // Her match in one line: % + why, a safety hold or the bleeding evaluation (never a %), or Get matched.
  const matchState = matchLineState({ details: matchDetails, percent: matchPercent, hasProfile: Boolean(quizAnswers), why: headLine, fallback: matchLine(matchDetails), canQuiz: true });
  // PDP audit 14: the same decision block as the website, app dialect.
  // "Why 92%?": raised / lowered / not known yet from the one engine (matching/breakdown.js).
  const breakdown = matchBreakdownFor(product, quizAnswers ? matchDetails : null);
  const perUse = costPerUse(product);
  const metaLine = metaLineFor(product, glance, keyFormat(product, brand));
  const highlights = highlightsFor(product, glance);
  const said = `${metaLine} ${highlights.map((h) => `${h.value} ${h.caption}`).join(' ')}`.toLowerCase();
  const heroV = heroPriceView(product, { price: priceParts(product), perUnit, glance, brand });
  const priceNotes = heroNotes(heroV.notes).keep.filter((n) => !said.includes(String(n).toLowerCase().replace(/ eligible$/, '')) && !(perUse && /per (tablet|capsule|softgel|gummy|unit)|a day/i.test(n)));
  const others = alsoAt(buy?.rows);
  const askStarters = productAskStarters({ hasProfile: Boolean(quizAnswers), percent: matchState?.kind === 'pct' ? matchState.percent : null, kind: cupOrDisc(product), hasIud: hasIud(quizAnswers), hasSizes: variantLabels.length > 0 });
  const buyLink = (extra = '') => (shopAction ? <a className={`ay-pdp-buyrow__buy ayv-buy ayv-sticker ${extra}`.trim()} href={shopAction.href} target="_blank" rel="noopener noreferrer" onClick={() => trackApp('product_buy_now_clicked', { productId: product?.id, category: product?.category, placement: extra ? 'summary_end' : shopAction.placement })}>{shopAction.label}<span aria-hidden="true"> ↗</span><span className="sr-only"> {shopAction.sr}</span></a> : null);
  const fitData = { details: quizAnswers ? matchDetails : null, hasProfile: Boolean(quizAnswers), onShowWhy: openWhyMatch };

  return (
    <div id="ay-pdp" className="ayna-fresh-product-detail ay-pdp" style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--ayna-bg)', color: 'var(--ayna-text)' }}>
      <div key={product.id} className="ay-pdp-scroll" data-tour="pdp" style={{ flex: 1, overflowY: 'auto', animation: 'ay-page .25s ease-out' }}>
        <div className="ay-pdp-top">
          <button type="button" className="ay-pdp-round" onClick={onBack} aria-label="Back to products">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
          </button>
          {shareCopied && <span className="ay-pdp-copied" role="status">Link copied</span>}
          <button type="button" className="ay-pdp-round" aria-label={`Share ${name} with a friend`} onClick={handleShare}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V3" /><path d="M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
          </button>
        </div>

        {/* Tinted stage with the product photos on a white stamp: swipe between photos, tap to zoom. */}
        <div className={`ayq-apphero tone-${tone}${image ? '' : ' is-missing-image'}`}>
          <div className="ayq-apphero__stage">
            <div className="ayq-stamp ayq-apphero__stamp">
              <div className="ayq-apphero__tile" data-vt-target="product">
                <ProductGallery
                  images={images}
                  index={photo}
                  onIndex={setPhoto}
                  name={name}
                  product={product}
                  thumbs={false}
                  plate={isSaved ? 'pink' : 'white'}
                  frame="portrait"
                  renderImage={(src) => <ProductImage product={product} src={src} alt={name} allowBrandLogo={product?.type === 'digital'} />}
                  fallback={<ProductImage product={product} src={image} alt={name} allowBrandLogo={product?.type === 'digital'} />}
                  zoomOpen={zoomOpen}
                  onZoom={setZoomOpen}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="ayq-sheet ay-pdp-title">
          {/* First screen (master prompt 112): name, brand, price, why ayna
              surfaced it, the evidence in one line, how it fits, one action.
              The % match sits with its one-line why (founder, Oct 24). The line
              under the name now opens "What it is" further down. */}
          {brandLine && <div className="ay-pdp-eyebrow ayv-brand">{brandLine}</div>}
          <h1>{shownName}</h1>
          {metaLine && <p className="ayv-metaline">{metaLine}</p>}
          {matchState?.kind !== 'quiz' && <MatchLockup state={matchState} breakdown={breakdown} onAskWhy={() => setAskOpen(true)} onFull={openWhyMatch} onFix={onFixSafety} onQuiz={onStartQuiz} idBase="ay-app-why" />}
          <PriceRow main={price ? shownPrice.main : ''} perUse={perUse} notes={priceNotes} />
          <div className="ayv-actions" data-tour="pdp-actions" ref={actionsRef}>{buyLink()}</div>
          {/* The disclosure, always visible under the button (audit 7.9: the app no longer collapses it). */}
          {shopAction && (
            <p className="ay-pdp-commission ayv-fine ayv-disclose">
              <span>{isPartner ? 'ayna partner. We may earn a commission.' : 'Some links earn ayna a commission. It never changes your matches.'}</span>
              {buy.checked && <span>{buy.checked}</span>}
              {others.length > 0 && <span>Also at {others.map((r, i) => <span key={r.url}>{i > 0 && ', '}<a href={r.url} target="_blank" rel="noopener noreferrer">{r.name}{r.price ? ` · ${r.price}` : ''}<span className="sr-only"> (opens in a new tab)</span></a></span>)}</span>}
              {isPartner && <span><button type="button" className="ayp-textlink" aria-expanded={partnerOpen} onClick={() => setPartnerOpen((v) => !v)}>{partnerOpen ? 'Less' : 'How partnerships work'}</button></span>}
            </p>
          )}
          {isPartner && partnerOpen && <div className="ayna-figma-partner-copy ayv-fine">{partnerDisclosure} <a href="https://www.aynahealth.co/startups" target="_blank" rel="noopener noreferrer">Read about our brand partnerships</a></div>}
          {/* Directly under the button: her IUD first when she has one, TSS for cups (PDP audit 7.5). */}
          <SafetyLine lines={safetyLineFor(product, glance, recall, { answers: quizAnswers }).lines} />
          {!shopAction && <p className="ay-pdp-nolink">{storesOnFile.length ? `${product.type === 'digital' ? 'On' : 'Sold at'} ${andList(storesOnFile.slice(0, 4))}. We don’t have a direct link yet.` : 'We don’t have a store link for this yet.'}</p>}
          <ActionsRow
            saved={isSaved}
            saveLabel={isSaved ? `Saved. Remove ${name} from Saved` : `Save ${name}`}
            onSave={() => { haptic('light'); onToggleSaved?.(); }}
            inRoutine={isInEcosystem}
            onRoutine={() => { haptic('light'); onAddToEcosystem?.(); }}
            routineWords={['Routine', IN_ROUTINE]}
            onAsk={() => setAskOpen(true)}
            notForMe={onToggleOmit ? <p className="ayv-acts__more"><button type="button" className="ayv-textbtn" onClick={onToggleOmit} aria-pressed={isOmitted}>{isOmitted ? 'Undo “Not for me”' : 'Not for me'}</button>{isOmitted && <small> Hidden from your matches.</small>}</p> : null}
          />
          <SaveFollowUpInline product={product} onCompare={onCompare} />
          <Highlights items={highlights} note={highlights.length ? 'From the product record. Not tested by ayna.' : ''} />
          {variantLabels.length > 0 && (
            <div className="ayp-options ayv-sizes">
              <p className="ayp-options__h">{variantKind}</p>
              <ul className="ayp-options__list">{variantLabels.map((l) => <li key={l}>{l}</li>)}</ul>
              {variantKind === 'Sizes' && <button type="button" className="ayv-textbtn" onClick={() => setAskOpen(true)}>Which size am I?</button>}
            </div>
          )}
          {matchState?.kind === 'quiz' && <div className="ayv-quizline"><MatchLockup state={matchState} onFull={openWhyMatch} onFix={onFixSafety} onQuiz={onStartQuiz} /></div>}
        </div>
        <div className="ay-pdp-passport">
          <ProductEvidence
            key={product.id}
            loading={!researchLoaded}
            product={product}
            image={images[0] || ''}
            safetyLead={topWarning}
            glance={glance}
            fit={fitData}
            askSlot={<div className="ay-pdp-askcard" id="ay-sec-ask" tabIndex={-1}><div className="ay-pdp-sechead"><h2 id="ay-pdp-ask-h">{PRODUCT_ASK_TITLE}</h2></div><AskAynaTab product={product} quizAnswers={quizAnswers} ecosystemProducts={ecosystemProducts} onRequireAuth={onRequireAuth} matchOpts={matchOpts} /></div>}
            onOpenReview={onOpenReview}
            onWriteReview={onCommunityAction ? () => onCommunityAction('review') : null}
            endCta={buyLink('is-compact')}
          />

          {/* Team direction 9: the first screen is Buy, Save and the match row.
              Routine, variants, "Not for me", connections and other stores sit here. */}
          <section className="ayq-sheet ay-pdp-more" aria-label="More for this product">
            {works.ayna && onOpenHealthData && <button type="button" className="ay-pdp-works" onClick={onOpenHealthData}>Works with ayna: connect {works.ayna.name} in Health data</button>}
          </section>
          {related.compare.length > 0 && (
            <ComparePanel
              product={product}
              others={related.compare}
              onOpen={(p) => onOpenProduct(p)}
              matchFor={matchFor}
              detailsFor={detailsFor}
              renderThumb={(p) => { const src = galleryImages(p)[0]; return src ? <img src={src} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : null; }}
            />
          )}

        </div>

        {related.more.length > 0 && <section className="ayna-cabinet-collection ay-pdp-related" aria-labelledby="ay-pdp-related-more">
          <div className="ay-pdp-sechead"><h2 id="ay-pdp-related-more">You may also like</h2><p>{related.personal ? 'Picks that fit your profile.' : 'For the same needs, from other parts of the shop.'}</p></div>
          <div className="ay-shelf2-row">{related.more.map((p) => <ProductCard key={p.id} product={p} quizAnswers={quizAnswers} onClick={() => onOpenProduct(p)} />)}</div>
        </section>}


        {onCommunityAction && <section className="ay-pdp-community-actions" aria-label="Community">
          <div className="ay-pdp-community-head"><svg viewBox="0 0 24 24" aria-hidden="true">{PANEL_ICONS.community}</svg><h2>Community</h2></div>
          {/* One button, the rest under Share (founder, Oct 25: four big buttons was heavy). */}
          <div className="ayv-community">
            <button type="button" className="ayv-community__main" onClick={() => onCommunityAction('review')}>Write a review</button>
            <details className="ayv-community__more">
              <summary>Share</summary>
              <ul>
                {[['post', 'Mention in a post'], ['playlist', 'Add to playlist'], ['recommend', 'Recommend to a friend']].map(([kind, label]) => <li key={kind}><button type="button" onClick={() => onCommunityAction(kind)}>{label}</button></li>)}
              </ul>
            </details>
          </div>
        </section>}

        {reads.length > 0 && (
          <section className="ay-pdp-reads" aria-labelledby="ay-pdp-reads-h">
            <h2 id="ay-pdp-reads-h">Reads</h2>
            <ul className="ay-group">
              {reads.map((r) => (
                <li key={r.id || r.title}>
                  <button type="button" onClick={r.onClick} disabled={!r.onClick}>
                    <span>{r.title}</span>
                    {r.mins && <small>{r.mins}</small>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <LegalFooter />
      </div>
      {/* Ask about this product: a native-style bottom sheet over the page; closing returns to the same spot (audit 7.8, 14.1). */}
      <AskPanel open={askOpen} onClose={() => setAskOpen(false)} variant="sheet" title={`Ask about ${shownName}`}>
        <AskAynaTab product={product} quizAnswers={quizAnswers} ecosystemProducts={ecosystemProducts} onRequireAuth={onRequireAuth} matchOpts={matchOpts} starters={askStarters} />
      </AskPanel>
    </div>
  );
}
