import { useEffect, useMemo, useState } from 'react';
import { trackApp } from '../utils/appAnalytics.js';
import { PANEL_ICONS } from '../components/pdpIcons.jsx';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct } from '../../data/products.js';
import ProductCard from '../components/ProductCard.jsx';
import { getBuyUrl } from '../data/buyUrl.js';
import { matchPercentFor } from '../utils/matchScore.js';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { renderMarkdownLite } from '../../utils/renderMarkdownLite.jsx';
import { isPartnerBrandItem, getPartnerDisclosureText } from '../../utils/partnerBrands.js';
import WhyMatchScreen from './WhyMatchScreen.jsx';
import { exclusionLines } from '../../utils/matchDisplay.js';
import MatchPill from '../../components/MatchPill.jsx';
import { whyLine } from '../../utils/whyLine.js';
import ProductEvidence from '../../components/pdp/ProductEvidence.jsx';
import { useResearchState } from '../../data/researchLoader.js';
import { attributeBadges } from '../../components/pdp/evidenceModel.js';
import { firstSentence } from '../../components/pdp/sentences.js';
import { evidenceLevel } from '../../components/pdp/evidenceLevel.js';
import { getPassport } from '../../data/passport';
import { recallFacts } from '../../utils/productFacts.js';
import { matchLine } from '../../data/passport/content.js';
import { buildGlance, perUnitLabel } from '../../components/pdp/glance.js';
import { galleryImages, retailerLinks, similarProducts, sameNeedProducts } from '../../components/pdp/commerce.js';
import GalleryThumbs from '../../components/pdp/GalleryThumbs.jsx';
import ImageZoomViewer from '../components/ImageZoomViewer.jsx';
import ComparePanel from '../../components/pdp/ComparePanel.jsx';
import { worksWith } from '../../utils/aynaIntegrations.js';
import LegalFooter from '../components/LegalFooter.jsx';
import ProductImage from '../components/ProductImage.jsx';
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

function toneFor(product) {
  const functions = product?.healthFunctions || [];
  const category = product?.category;
  if (functions.some((item) => ['perimenopause', 'hormone-balance'].includes(item)) || ['telehealth', 'digital', 'therapy', 'tracker'].includes(category) || product?.type === 'digital') return 'peri';
  if (functions.includes('fertility') || ['diagnostics', 'supplement', 'vitamin'].includes(category)) return 'butter';
  if (['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'pelvic-floor'].includes(category)) return 'mint';
  return 'pink';
}

/** The one safety line next to Buy (pink, the alert colour); Safety tab has the rest. */
function SafetyFlag({ text }) {
  return (
    <div className="ay-pdp-safetyflag" role="note">
      <span aria-hidden="true" className="ay-safety-mark">!</span>
      <p>{text || 'Safety note on file.'}</p>
      <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('ay-open-tab', { detail: 'safety' }))}>All safety info</button>
    </div>
  );
}

/**
 * Ask Ayna, ported from AskAynaProductTab in src/components/ProductModal.jsx
 *, same /api/product-chat contract, same getSupabaseClient() bearer-token
 * auth, same not-signed-in / weekly-limit-reached handling. Only the markup
 * changed (mobile's own inline-style patterns instead of the desktop
 * pdp-* classes).
 */
function AskAynaTab({ product, quizAnswers, ecosystemProducts, onRequireAuth }) {
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

  const suggestions = [
    `What is ${product?.name ? 'this' : 'it'} and how is it used?`,
    'Who is this good for?',
    'Any safety concerns I should know about?',
  ];

  const ask = async (question) => {
    const q = String(question || '').trim();
    if (!q || sending) return;
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
      {messages.length === 0 && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {suggestions.map((s) => (
              <button
                type="button"
                disabled={sending}
                key={s}
                onClick={() => ask(s)}
                style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, minHeight: 44, border: 0, padding: '8px 13px', borderRadius: 99, background: 'var(--ayna-chip-bg)', color: 'var(--ayna-text-muted)', cursor: 'pointer' }}
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
          placeholder={session === undefined ? 'One moment…' : 'Ask about this product…'}
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
  whyMatched,
  reads = [],
  quizAnswers = null,
  ecosystemProducts = [],
  onOpenProduct,
  // Matching engine behavior signals and the "Not for me" action.
  matchOpts,
  isOmitted = false,
  onToggleOmit,
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
    if (onOpenProduct && more.length < 4) more = [...more, ...sameNeedProducts(product, { pool: photoPool, limit: 4 - more.length, exclude: [...used, ...more.map((p) => p.id)] })];
    return { compare, more, personal };
  }, [product, onOpenProduct, ecosystemProducts, quizAnswers, matchOpts]);

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
  const exclusions = quizAnswers && matchDetails.matchStatus === 'excluded' ? exclusionLines(matchDetails) : [];
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
  const buyUrl = getBuyUrl(product);
  const isPartner = isPartnerBrandItem(product);
  const partnerDisclosure = getPartnerDisclosureText(product);
  // Same information architecture as the website's product page
  // (components/pdp/ProductEvidence): ayna's summary, At a glance, then the
  // Clinical opinion / Scientific literature / Reviews / Safety / How to use /
  // Details tabs with their source cards.
  const glance = buildGlance(product, { details: quizAnswers ? matchDetails : null, whyMatched });
  const brandLine = brand && String(brand).trim().toLowerCase() !== String(name || '').trim().toLowerCase() ? brand : categoryLabel;
  // Evidence in one line under the price; the same meter as At a glance.
  const evidence = evidenceLevel(product);
  // One recall answer for the page (utils/productFacts), as on the website.
  const recall = (() => {
    const live = getPassport(product)?.recall;
    if (live?.status === 'recalled') return { status: 'past', label: 'Active recall found', detail: '' };
    return recallFacts(product);
  })();
  // The one caution that sits next to Buy, in plain words from the record (same rule as the website).
  const topWarning = (() => {
    const first = (t) => {
      const one = firstSentence(t, { min: 8, max: 400 }).replace(/\s*—\s*/g, ', ').trim();
      const colon = one.indexOf(':');
      if (one.length > 100 && colon > 8 && colon <= 70) return `${one.slice(0, colon)}.`;
      return one.length > 120 ? firstSentence(one, { max: 120 }) : one;
    };
    if (recall.status === 'past' || recall.status === 'note') return first(recall.detail || recall.label);
    if (glance?.alert) return first(glance.alert);
    const preg = getPassport(product)?.safety?.pregnancy;
    const pv = preg?.known && !preg.notApplicable ? (Array.isArray(preg.value) ? preg.value.join(', ') : String(preg.value || '')) : '';
    if (pv && /not|avoid|consult|ask|doctor|clinician|don.t|do not|unsafe|caution/i.test(pv)) return `Pregnancy: ${firstSentence(pv, { min: 8, max: 200 })}`.replace(/^Pregnancy:\s*Brand:\s*(.*?)\.?$/i, 'Pregnancy: $1 (per the brand).');
    const TIP = /^(wash|rinse|boil|clean|store|keep it|dry|sanitize|sterili[sz]e|empty)\b/i;
    const w = (product.warnings || []).find((x) => x && !TIP.test(String(x).trim()));
    return w ? first(w) : '';
  })();
  const images = galleryImages(product);
  const shownImage = images[Math.min(photo, Math.max(images.length - 1, 0))] || image;
  const retailers = retailerLinks(product, buyUrl);
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
  const hasDisplayPrice = shownPrice.main !== 'Price at retailer';

  // Round badges beside the photo: only facts on file (FSA/HSA, fragrance, prescription, app).
  const badges = attributeBadges(product, glance);
  const variantLabels = (product.variants || []).map((v) => String(v?.label || '').replace(/\s*—\s*/g, ', ')).filter(Boolean);
  const variantKind = variantLabels.some((l) => /\d|\b(xs|s|m|l|xl|small|medium|large|regular|super|light|heavy|mini|plus|size|pack|count|oz|ml)\b/i.test(l)) ? 'Sizes' : 'Options';
  const barPrice = hasDisplayPrice && String(shownPrice.main).length <= 9 ? shownPrice.main : '';
  // Where to buy without a verified product link: the brand's own site when the
  // record names one (the website does the same), else the stores it lists.
  const siteOnFile = !buyUrl ? (product.whereToBuy || []).map((w) => String(w).trim()).find((w) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(w)) : null;
  const shopAction = buyUrl
    ? { href: buyUrl, label: category === 'telehealth' ? 'Book' : product.type === 'digital' ? 'Get the app' : 'Shop', sr: '(opens the seller’s site)', placement: 'product_detail' }
    : retailers[0] ? { href: retailers[0].url, label: 'Shop', sr: `at ${retailers[0].name} (opens the store’s site)`, placement: 'product_detail_retailer' }
    : siteOnFile ? { href: `https://${siteOnFile.toLowerCase()}`, label: 'Visit site', sr: `(opens ${siteOnFile.toLowerCase()})`, placement: 'product_detail_site' } : null;
  const storesOnFile = !shopAction ? [...new Set((product.whereToBuy || []).map((w) => String(w).trim()).filter(Boolean))].map((w) => (/^app store$/i.test(w) ? 'the App Store' : w)) : [];
  const andList = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

  // One dark pill: price, save, ecosystem, buy. In the page under the price,
  // not pinned to the bottom (founder: nothing stays put while the page
  // scrolls; deep round 2).
  const buyBar = (
    <div className="ayq-bar">
      <div className="ayq-bar__pill">
        {barPrice && <span className="ayq-bar__price">{barPrice}</span>}
        <button type="button" className="ayq-bar__icon" onClick={onToggleSaved} aria-label={isSaved ? 'Remove from Saved' : 'Save'} aria-pressed={isSaved}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={HEART_PATH} /></svg>
        </button>
        {/* No store link: never a dead primary (same rule as the website's
            product page). Her own site if we know it, else "Add to ecosystem"
            takes the primary slot and the page says where it is sold. */}
        <button type="button" className={`ayq-bar__eco${isInEcosystem ? ' is-on' : ''}${shopAction ? '' : ' is-primary'}`} aria-pressed={isInEcosystem} aria-label={isInEcosystem ? 'Remove from ecosystem' : 'Add to ecosystem'} onClick={onAddToEcosystem}>
          {isInEcosystem ? 'In ecosystem' : shopAction ? '+ Ecosystem' : '+ Add to ecosystem'}
        </button>
        {shopAction && <a className="ayq-bar__buy" href={shopAction.href} target="_blank" rel="noopener noreferrer" onClick={() => trackApp('product_buy_now_clicked', { productId: product?.id, category: product?.category, placement: shopAction.placement })}>{shopAction.label}<span className="sr-only"> {shopAction.sr}</span></a>}
      </div>
    </div>
  );

  return (
    <div id="ay-pdp" className="ayna-fresh-product-detail ay-pdp" style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--ayna-bg)', color: 'var(--ayna-text)' }}>
      <div key={product.id} className="ay-pdp-scroll" style={{ flex: 1, overflowY: 'auto', animation: 'ay-page .25s ease-out' }}>
        <div className="ay-pdp-top">
          <button type="button" className="ay-pdp-round" onClick={onBack} aria-label="Back to products">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
          </button>
          {shareCopied && <span className="ay-pdp-copied" role="status">Link copied</span>}
          <button type="button" className="ay-pdp-round" aria-label={`Share ${name} with a friend`} onClick={handleShare}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V3" /><path d="M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
          </button>
        </div>

        {/* Tinted stage with the product on a white stamp, then a rounded sheet that overlaps it. */}
        <div className={`ayq-apphero tone-${tone}${image ? '' : ' is-missing-image'}`}>
          <div className="ayq-apphero__stage">
            <div className="ayq-stamp ayq-apphero__stamp">
              <div className="ayq-apphero__tile" data-vt-target="product">
                <ProductImage key={shownImage} product={product} src={shownImage} alt={name} allowBrandLogo={product?.type === 'digital'} />
                {images.length > 0 && (
                  <button type="button" className="ay-pdp-zoom-open" aria-label={`View ${name} photo full screen`} onClick={() => setZoomOpen(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2M11 8.5v5M8.5 11h5" /></svg>
                  </button>
                )}
              </div>
            </div>
            {badges.length > 0 && (
              <ul className="ayq-badges" aria-label="Facts about this product">
                {badges.map((b) => <li key={b.id}><span>{b.label}</span>{b.note && <small>{b.note}</small>}</li>)}
              </ul>
            )}
          </div>
          {images.length > 1 && <div className="ay-pdp-thumbs ayq-apphero__thumbs"><GalleryThumbs images={images} index={photo} onSelect={setPhoto} name={name} /></div>}
        </div>

        <div className="ayq-sheet ay-pdp-title">
          {/* First screen (master prompt 112): name, brand, price, why ayna
              surfaced it, the evidence in one line, how it fits, one action.
              The % match sits with its one-line why (founder, Oct 24). The line
              under the name now opens "What it is" further down. */}
          {brandLine && <div className="ay-pdp-eyebrow">{brandLine}</div>}
          <h1>{shownName}</h1>
          {(price || perUnit) && <div className="ay-pdp-price">
            {price && <span className={hasDisplayPrice ? 'is-price' : 'is-note'}>{shownPrice.main}</span>}
            {perUnit && <small className="is-unit">{perUnit}</small>}
            {price && shownPrice.sub && <small>{shownPrice.sub}</small>}
          </div>}
          <ul className="ay-pdp-why" aria-label="Why it is here">
            {matchPercent != null && <li><button type="button" className="ay-pdp-why__row is-match" onClick={openWhyMatch} aria-label={`${matchPercent}% match${headLine ? `. ${headLine}` : ''}. See why`}><MatchPill percent={matchPercent} size="sm" /><span>{headLine || 'Why ayna picked this for you'}</span><span className="ay-pdp-why__go">See why</span></button></li>}
            {evidence.level > 0 && <li><button type="button" className="ay-pdp-why__row ay-pdp-evline" onClick={() => window.dispatchEvent(new CustomEvent('ay-open-tab', { detail: 'literature' }))}>
              <span className="ay-pdp-evline__bars" data-level={evidence.level} aria-hidden="true"><i /><i /><i /></span>
              <span><b>{evidence.word}</b>{evidence.need && ` for ${evidence.need}`}</span>
              <span className="sr-only">. See the evidence</span>
            </button></li>}
            {(matchDetails.matchStatus === 'no-relevance' || matchDetails.matchStatus === 'excluded') && quizAnswers && <li><button type="button" className="ay-pdp-why__row is-fit" onClick={openWhyMatch}><span>{matchDetails.matchStatus === 'excluded' ? (exclusions[0] || 'Not a fit right now') : 'No clear match'}</span><span className="ay-pdp-why__go">See why</span></button></li>}
            {matchDetails.matchStatus === 'no-profile' && <li><button type="button" className="ay-pdp-why__row is-fit" onClick={onStartQuiz}><span>See how it fits you</span><span className="ay-pdp-why__go">Get matched</span></button></li>}
          </ul>
          {buyBar}
          {topWarning && <SafetyFlag text={topWarning} />}
          {!shopAction && <p className="ay-pdp-nolink">{storesOnFile.length ? `${product.type === 'digital' ? 'On' : 'Sold at'} ${andList(storesOnFile.slice(0, 4))}. We don’t have a direct link yet.` : 'We don’t have a store link for this yet.'}</p>}
          {variantLabels.length > 0 && (
            <div className="ayq-variants">
              <p>{variantKind}</p>
              <ul>{variantLabels.map((l) => <li key={l}>{l}</li>)}</ul>
            </div>
          )}
          {onToggleOmit && <div className="ay-pdp-omit"><button type="button" onClick={onToggleOmit} aria-pressed={isOmitted}>{isOmitted ? 'Undo “Not for me”' : 'Not for me'}</button>{isOmitted && <small>Hidden from your matches.</small>}</div>}
          {works.ayna && onOpenHealthData && <button type="button" className="ay-pdp-works" onClick={onOpenHealthData}>Works with ayna: connect {works.ayna.name} in Health data</button>}
          {retailers.length > 0 && (
            <div className="ay-retailers">
              <span id="ay-pdp-also-at">Also at</span>
              <ul aria-labelledby="ay-pdp-also-at">
                {retailers.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.name}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg></a></li>)}
              </ul>
            </div>
          )}
          {isPartner ? (
            <div className="ayna-figma-partner-disclosure">
              <button type="button" onClick={() => setPartnerOpen((v) => !v)} aria-expanded={partnerOpen}>
                <span>Partner</span><span>{partnerOpen ? 'Hide disclosure' : 'We may earn a commission'}</span><span aria-hidden="true">{partnerOpen ? '−' : '+'}</span>
              </button>
              {partnerOpen && <div className="ayna-figma-partner-copy">{partnerDisclosure}<a href="https://www.aynahealth.co/startups" target="_blank" rel="noopener noreferrer">Read about our brand partnerships</a></div>}
            </div>
          ) : buyUrl && <p className="ay-pdp-commission">Some links earn ayna a commission. It never changes your matches.</p>}
        </div>
        <div className="ay-pdp-passport">
          <ProductEvidence
            key={product.id}
            loading={!researchLoaded}
            product={product}
            image={images[0] || ''}
            safetyLead={topWarning}
            glance={glance}
            recall={recall}
            heroLine=""
            sections
            onOpenReview={onOpenReview}
            onWriteReview={onCommunityAction ? () => onCommunityAction('review') : null}
            extraRows={[{ label: 'Sold by', value: buyUrl ? (/amazon\.|amzn\./i.test(buyUrl) ? 'Amazon' : (() => { try { return new URL(buyUrl).hostname.replace(/^www\./, ''); } catch { return ''; } })()) : '' }]}
          />

          <section className="ay-pdp-askcard" id="ay-sec-ask" tabIndex={-1} aria-labelledby="ay-pdp-ask-h">
            <div className="ay-pdp-sechead">
              <h2 id="ay-pdp-ask-h">Questions? Ask ayna</h2>
              <p>Ask anything about this product.</p>
            </div>
            <AskAynaTab product={product} quizAnswers={quizAnswers} ecosystemProducts={ecosystemProducts} onRequireAuth={onRequireAuth} />
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
          <div className="ay-pdp-community-grid">
            {[['post', 'Mention in a post'], ['review', 'Write a review'], ['playlist', 'Add to playlist'], ['recommend', 'Recommend to a friend']].map(([kind, label]) => <button key={kind} type="button" className={kind === 'post' ? 'is-primary' : undefined} onClick={() => onCommunityAction(kind)}>{label}</button>)}
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
      {zoomOpen && images.length > 0 && <ImageZoomViewer images={images} startIndex={Math.min(photo, images.length - 1)} name={name} onClose={() => setZoomOpen(false)} />}
    </div>
  );
}
