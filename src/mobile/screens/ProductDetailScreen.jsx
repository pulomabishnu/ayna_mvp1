import { useEffect, useMemo, useState } from 'react';
import { PANEL_ICONS } from '../components/pdpIcons.jsx';
import { ALL_PRODUCTS, CATEGORY_LABELS, getProductMatchDetailsForProduct } from '../../data/products.js';
import ProductCard from '../components/ProductCard.jsx';
import { getBuyUrl } from '../data/buyUrl.js';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { renderMarkdownLite } from '../../utils/renderMarkdownLite.jsx';
import { isPartnerBrandItem, getPartnerDisclosureText } from '../../utils/partnerBrands.js';
import WhyMatchScreen from './WhyMatchScreen.jsx';
import { exclusionLines } from '../../utils/matchDisplay.js';
import MatchPill from '../../components/MatchPill.jsx';
import ProductSections from '../../components/passport/ProductSections.jsx';
import { buildProductSections, headerFacts, matchLine } from '../../data/passport/content.js';
import LegalFooter from '../components/LegalFooter.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { apiUrl } from '../../utils/apiUrl.js';
import { productHref } from '../../utils/productRoute.js';
import { getPricePerUnitLabel } from '../../utils/pricePerUnit.js';
import { HEART_PATH } from '../utils/heart.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { displayName } from '../utils/displayName.js';
import '../pdp.css';
import '../eco-needs.css';

/** Same '⚠️'-flag convention as getSafetyAlertText in src/components/ProductModal.jsx — surfaces a real, already-on-file safety concern regardless of which tab is open. */
function getSafetyAlertText(product) {
  const recalls = product?.safety?.recalls;
  if (!recalls || !String(recalls).includes('⚠️')) return null;
  return product?.safety?.opinionAlerts || recalls;
}

function toneFor(product) {
  const functions = product?.healthFunctions || [];
  const category = product?.category;
  if (functions.some((item) => ['perimenopause', 'hormone-balance'].includes(item)) || ['telehealth', 'digital', 'therapy', 'tracker'].includes(category) || product?.type === 'digital') return 'peri';
  if (functions.includes('fertility') || ['diagnostics', 'supplement', 'vitamin'].includes(category)) return 'butter';
  if (['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'pelvic-floor'].includes(category)) return 'mint';
  return 'pink';
}

function SafetyBanner({ text }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      style={{ margin: '14px var(--ay-gutter, 20px) 0', background: '#FEF2F2', border: '1px solid #991B1B', borderLeft: '4px solid #991B1B', borderRadius: 16, padding: '12px 14px', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 700, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: '#991B1B' }}>Safety note</div>
        <span style={{ color: '#991B1B', fontSize: 12 }}>{expanded ? '▴' : '▾'}</span>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.5, color: '#3f3831', display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2, WebkitBoxOrient: 'vertical', overflow: expanded ? 'visible' : 'hidden' }}>
        {text}
      </p>
    </div>
  );
}

/**
 * Ask Ayna, ported from AskAynaProductTab in src/components/ProductModal.jsx
 * — same /api/product-chat contract, same getSupabaseClient() bearer-token
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
    if (!session?.access_token) { onRequireAuth?.('Ask Ayna'); return; }
    setError('');
    setInput('');
    const nextMessages = [...messages, { role: 'user', text: q }];
    setMessages(nextMessages);
    setSending(true);
    try {
      const token = session?.access_token;
      if (!token) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      const res = await fetch(apiUrl('/api/product-chat'), {
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
        onRequireAuth?.('Ask Ayna');
      } else if (e?.code === 'weekly_limit_reached') {
        setError("You've used your free chats for this week. They reset weekly.");
      } else {
        setError(e?.message || 'Something went wrong. Try again in a moment.');
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
                style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 500, minHeight: 44, border: 0, padding: '8px 13px', borderRadius: 99, background: 'var(--ayna-chip-bg)', color: 'var(--ayna-text-muted)', cursor: 'pointer' }}
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
                fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.role === 'assistant' ? renderMarkdownLite(m.text) : m.text}
            </div>
          ))}
          {sending && <div style={{ alignSelf: 'flex-start', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)' }}>Ayna is thinking…</div>}
        </div>
      )}

      {error && <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: '#B3261E', lineHeight: 1.5 }}>{error}</div>}

      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={session === undefined ? 'Loading…' : 'Ask about this product…'}
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
            fontWeight: 600,
            fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))',
            cursor: 'pointer',
            opacity: sending || !input.trim() || session === undefined ? 0.5 : 1,
          }}
        >
          Ask
        </button>
      </form>

      <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)' }}>Ayna's answers are educational, not medical advice.</div>
    </div>
  );
}

export default function ProductDetailScreen({
  product,
  onBack,
  isSaved = false,
  onToggleSaved,
  isInEcosystem = false,
  onAddToEcosystem,
  onCommunityAction,
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
}) {
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  // Rendered locally (not through MobileApp's shared `overlay` state, which
  // only holds one layer) so "back" from here returns to this product
  // instead of closing straight through to whatever screen sits underneath.
  const [showWhyMatch, setShowWhyMatch] = useState(false);

  // Reset per-product UI state on product switch — this screen can receive
  // a new `product` prop without unmounting (MobileApp doesn't key it).
  // Adjusted during render (React's recommended pattern for resetting state
  // when a prop changes) rather than in an effect, to avoid the extra
  // render pass a setState-in-effect would cause.
  const [seenProductId, setSeenProductId] = useState(product?.id);
  if (product?.id !== seenProductId) {
    setSeenProductId(product?.id);
    setPartnerOpen(false);
  }

  // Bottom suggestions, same rules as the website product page: picks that
  // match your profile (when there is one), then more from this category.
  const related = useMemo(() => {
    if (!product || !onOpenProduct) return { matches: [], similar: [] };
    const owned = new Set((ecosystemProducts || []).map((p) => p?.id).filter(Boolean));
    const pool = ALL_PRODUCTS.filter((p) => p && p.id && p.name && p.id !== product.id && !owned.has(p.id));
    const matches = quizAnswers ? pool
      .map((p) => ({ p, m: getProductMatchDetailsForProduct(p, quizAnswers, null, matchOpts) }))
      .filter(({ m }) => m?.matchStatus === 'scored' && Number.isFinite(m.percent) && m.percent >= 50)
      .sort((a, b) => b.m.percent - a.m.percent)
      .slice(0, 4)
      .map(({ p }) => p) : [];
    const used = new Set(matches.map((p) => p.id));
    const similar = pool.filter((p) => !used.has(p.id) && p.category === product.category).slice(0, 4);
    return { matches, similar };
  }, [product, onOpenProduct, ecosystemProducts, quizAnswers, matchOpts]);

  if (!product) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ayna-text-muted)', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))' }}>
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
        onViewDetails={() => setShowWhyMatch(false)}
      />
    );
  }

  const matchDetails = getProductMatchDetailsForProduct(product, quizAnswers, null, matchOpts);
  const matchPercent = quizAnswers && matchDetails.matchStatus === 'scored' && Number.isFinite(matchDetails.percent) && matchDetails.percent > 0 ? matchDetails.percent : null;
  // One pill + one short line. Per-need numbers live in the Why view only.
  const headLine = matchPercent != null ? matchLine(matchDetails) : '';
  const exclusions = quizAnswers && matchDetails.matchStatus === 'excluded' ? exclusionLines(matchDetails) : [];
  const openWhyMatch = () => setShowWhyMatch(true);

  const {
    name,
    category,
    brand,
    price,
    image,
  } = product;

  const categoryLabel = CATEGORY_LABELS[category] || (category ? category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');
  const eyebrowLine = [categoryLabel, brand && String(brand).trim().toLowerCase() !== String(name || '').trim().toLowerCase() ? brand : null].filter(Boolean).join(' · ');
  const buyUrl = getBuyUrl(product);
  const safetyAlertText = getSafetyAlertText(product);
  const isPartner = isPartnerBrandItem(product);
  const partnerDisclosure = getPartnerDisclosureText(product);
  // At most four facts; never a claim the engine could not confirm for her.
  const facts = headerFacts(product, { blockedClaims: matchDetails.blockedClaims || [] });
  const sections = buildProductSections(product, { details: quizAnswers ? matchDetails : null, whyMatched });
  const openProductByName = (target) => {
    const found = ALL_PRODUCTS.find((p) => String(p?.name || '').toLowerCase() === String(target || '').toLowerCase());
    if (found && onOpenProduct) onOpenProduct(found);
  };

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

  const tone = toneFor(product);
  const shownName = displayName(product);
  const perUnit = getPricePerUnitLabel(product);
  // Same price model as the cards (and the website): short main + detail line.
  const shownPrice = formatPrice(product);
  const hasDisplayPrice = shownPrice.main !== 'Price at retailer';

  return (
    <div className="ayna-fresh-product-detail ay-pdp" style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--ayna-bg)', color: 'var(--ayna-text)' }}>
      <div key={product.id} style={{ flex: 1, overflowY: 'auto', animation: 'ay-page .25s ease-out', paddingBottom: 104 }}>
        <div className="ay-pdp-top">
          <button type="button" className="ay-pdp-round" onClick={onBack} aria-label="Back to products">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
          </button>
          {shareCopied && <span className="ay-pdp-copied" role="status">Link copied</span>}
          <button type="button" className="ay-pdp-round" aria-label={`Share ${name} with a friend`} onClick={handleShare}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V3" /><path d="M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
          </button>
        </div>

        <div className={`ayna-fresh-detail-image ay-pdp-hero tone-${tone}${image ? '' : ' is-missing-image'}`} style={{ margin: '16px 20px 0', borderRadius: 17, padding: 0, background: 'var(--ayna-bg-alt)', overflow: 'hidden' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 5',
              background: 'var(--ayna-surface)',
              borderRadius: 17,
              boxShadow: 'none',
              overflow: 'hidden',
            }}
          >
            <ProductImage product={product} src={image} alt={name} allowBrandLogo={product?.type === 'digital'} />
          </div>
        </div>

        <div className="ayna-fresh-detail-title ay-pdp-title ay-pdp-head2">
          {eyebrowLine && <div className="ay-pdp-eyebrow">{eyebrowLine}</div>}
          <h1>{shownName}</h1>
          {(price || perUnit) && <div className="ay-pdp-price">
            {price && <span className={hasDisplayPrice ? 'is-price' : 'is-note'}>{shownPrice.main}</span>}
            {perUnit && <small className="is-unit">{perUnit}</small>}
            {price && shownPrice.sub && <small>{shownPrice.sub}</small>}
          </div>}
          {matchPercent != null && <div className="ay-pdp-match">
            <MatchPill percent={matchPercent} onClick={openWhyMatch} label={`${matchPercent}% match${headLine ? `. ${headLine}` : ''}. See why`} />
            {headLine && <span>{headLine}</span>}
          </div>}
          {(matchDetails.matchStatus === 'no-relevance' || matchDetails.matchStatus === 'excluded') && quizAnswers && <button type="button" className="ay-pdp-fitnote" onClick={openWhyMatch}>{matchDetails.matchStatus === 'excluded' ? (exclusions[0] || 'Not a fit right now') : 'No clear match'} <span aria-hidden="true">→</span></button>}
          {matchDetails.matchStatus === 'no-profile' && <button type="button" className="ayna-figma-guest-match" onClick={onStartQuiz}>See your match <span aria-hidden="true">↗</span></button>}
          {facts.length > 0 && (
            <ul className="ay-pdp-facts2" aria-label="About this product">
              {facts.map((f) => <li key={f.label} className={`is-${f.type}`}>{f.type === 'check' && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>}{f.label}</li>)}
            </ul>
          )}
        </div>

        {isPartner && (
          <div className="ayna-figma-partner-disclosure">
            <button type="button" onClick={() => setPartnerOpen((v) => !v)} aria-expanded={partnerOpen}>
              <span>Partner</span><span>{partnerOpen ? 'Hide disclosure' : 'We may earn a commission'}</span><span aria-hidden="true">{partnerOpen ? '−' : '+'}</span>
            </button>
            {partnerOpen && <div className="ayna-figma-partner-copy">{partnerDisclosure}<a href="https://www.aynahealth.co/startups" target="_blank" rel="noopener noreferrer">Read about our brand partnerships →</a></div>}
          </div>
        )}

        {safetyAlertText && <SafetyBanner text={safetyAlertText} />}

        <div className="ay-pdp-passport">
          <ProductSections
            key={product.id}
            sections={sections}
            onXref={openProductByName}
            extras={{ match: <button type="button" className="ay-psec-action" onClick={openWhyMatch}>See the full breakdown</button> }}
            extraSections={[{ id: 'ask', title: 'Ask ayna', preview: 'Ask a question', node: <AskAynaTab product={product} quizAnswers={quizAnswers} ecosystemProducts={ecosystemProducts} onRequireAuth={onRequireAuth} /> }]}
          />
          {onToggleOmit && <div className="ay-pdp-omit"><button type="button" onClick={onToggleOmit} aria-pressed={isOmitted}>{isOmitted ? 'Undo “Not for me”' : 'Not for me'}</button>{isOmitted && <small>Hidden from your matches.</small>}</div>}
        </div>

        {onCommunityAction && <section className="ay-pdp-community-actions" aria-label="Community">
          <div className="ay-pdp-community-head"><svg viewBox="0 0 24 24" aria-hidden="true">{PANEL_ICONS.community}</svg><h2>Community</h2></div>
          <div className="ay-pdp-community-grid">
            {[['post', 'Mention in a post'], ['review', 'Write a review'], ['playlist', 'Add to playlist'], ['recommend', 'Recommend to a friend']].map(([kind, label]) => <button key={kind} type="button" className={kind === 'post' ? 'is-primary' : undefined} onClick={() => onCommunityAction(kind)}>{label}</button>)}
          </div>
        </section>}

        {related.matches.length > 0 && <section className="ayna-cabinet-collection ay-pdp-related" aria-labelledby="ay-pdp-related-match">
          <div className="ayna-cabinet-section-head"><h2 id="ay-pdp-related-match">Matches your profile</h2></div>
          <div className="ayna-editorial-product-grid">{related.matches.map((p) => <ProductCard key={p.id} product={p} quizAnswers={quizAnswers} onClick={() => onOpenProduct(p)} />)}</div>
        </section>}
        {related.similar.length > 0 && <section className="ayna-cabinet-collection ay-pdp-related" aria-labelledby="ay-pdp-related-similar">
          <div className="ayna-cabinet-section-head"><h2 id="ay-pdp-related-similar">{related.matches.length > 0 ? 'More like this' : 'You might also like'}</h2></div>
          <div className="ayna-editorial-product-grid">{related.similar.map((p) => <ProductCard key={p.id} product={p} quizAnswers={quizAnswers} onClick={() => onOpenProduct(p)} />)}</div>
        </section>}

        {reads.length > 0 && (
          <div style={{ padding: '22px var(--ay-gutter, 20px) 34px' }}>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', marginBottom: 10 }}>Reads</div>
            {reads.map((r) => (
              <div
                key={r.id || r.title}
                onClick={r.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'var(--ayna-surface)',
                  border: '1px solid var(--ayna-border)',
                  borderRadius: 16,
                  padding: '13px 15px',
                  marginBottom: 8,
                  cursor: r.onClick ? 'pointer' : 'default',
                }}
              >
                <div style={{ flex: 1, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.4, fontWeight: 500 }}>{r.title}</div>
                {r.mins && <div style={{ fontFamily: "var(--ayna-font-ui)", fontSize: 'calc(11px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', whiteSpace: 'nowrap' }}>{r.mins}</div>}
              </div>
            ))}
          </div>
        )}
        <LegalFooter />
      </div>

      <div className="ayna-product-purchase-bar ay-pdp-bar" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 20px max(20px, env(safe-area-inset-bottom))', background: 'var(--ayna-surface)', borderTop: '1px solid var(--ayna-border)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          onClick={onToggleSaved}
          aria-label={isSaved ? 'Remove from Saved' : 'Save'}
          aria-pressed={isSaved}
          style={{ width: 50, height: 50, borderRadius: 99, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--ayna-surface)', border: '1px solid ' + (isSaved ? 'var(--ayna-accent-dark)' : 'var(--ayna-border)') }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill={isSaved ? 'var(--ayna-accent-dark)' : 'none'} stroke={isSaved ? 'var(--ayna-accent-dark)' : 'var(--ayna-heading)'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d={HEART_PATH} />
          </svg>
        </button>
        <button
          type="button"
          aria-pressed={isInEcosystem}
          aria-label={isInEcosystem ? 'Remove from ecosystem' : 'Add to ecosystem'}
          onClick={onAddToEcosystem}
          style={{
            flex: 'none',
            height: 50,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            borderRadius: 99,
            cursor: 'pointer',
            fontFamily: "var(--ayna-font-ui)",
            fontSize: 'calc(13px * var(--ayna-text-scale, 1))',
            fontWeight: 600,
            background: isInEcosystem ? 'var(--ayna-chip-bg)' : 'var(--ayna-surface)',
            color: 'var(--ayna-heading)',
            border: '1px solid ' + (isInEcosystem ? 'var(--ayna-accent-dark)' : 'var(--ayna-border)'),
          }}
        >
          {isInEcosystem ? 'Remove from ecosystem' : 'Add to ecosystem'}
        </button>
        {buyUrl ? (
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              textAlign: 'center',
              background: 'var(--ayna-cta-bg)',
              color: 'var(--ayna-cta-text)',
              borderRadius: 99,
              padding: '15px 0',
              fontFamily: "var(--ayna-font-ui)",
              fontWeight: 600,
              fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))',
              boxShadow: '0 14px 26px -14px rgba(36,42,82,.7)',
              textDecoration: 'none',
            }}
          >
            {category === 'telehealth' ? 'Explore' : product.type === 'digital' ? 'View app' : 'Shop'}
          </a>
        ) : (
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              background: 'var(--ayna-border)',
              color: 'var(--ayna-text-muted)',
              borderRadius: 99,
              padding: '15px 0',
              fontFamily: "var(--ayna-font-ui)",
              fontWeight: 600,
              fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))',
            }}
          >
            <span className="ayna-seller-unavailable">No shop link</span>
          </div>
        )}
      </div>
    </div>
  );
}
