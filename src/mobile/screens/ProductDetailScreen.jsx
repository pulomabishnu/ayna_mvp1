import { useEffect, useState } from 'react';
import { CATEGORY_LABELS, getProfileMatchPercentForProduct, getProfileMatchLabelsForProduct } from '../../data/products.js';
import { getBuyUrl } from '../data/buyUrl.js';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { renderMarkdownLite } from '../../utils/renderMarkdownLite.jsx';
import { getVerificationLinks, toSourceChips, hostLabel } from '../../utils/verificationLinks.js';
import { isPartnerBrandItem, getPartnerDisclosureText } from '../../utils/partnerBrands.js';
import MatchRing from '../components/MatchRing.jsx';
import WhyMatchScreen from './WhyMatchScreen.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { apiUrl } from '../../utils/apiUrl.js';

const CARD = { background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: 18, boxShadow: '0 2px 10px rgba(41,37,36,.04)' };
const EYEBROW = { fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)' };
const CHIP = { fontSize: 'calc(12px * var(--ayna-text-scale, 1))', background: 'var(--ayna-chip-bg)', border: '1px solid var(--ayna-chip-border)', color: 'var(--ayna-text-muted)', borderRadius: 99, padding: '7px 12px', textDecoration: 'none', display: 'inline-block' };
const PLATFORM_LABELS = { reddit: 'Reddit', tiktok: 'TikTok', youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook' };

/** Same '⚠️'-flag convention as getSafetyAlertText in src/components/ProductModal.jsx — surfaces a real, already-on-file safety concern regardless of which tab is open. */
function getSafetyAlertText(product) {
  const recalls = product?.safety?.recalls;
  if (!recalls || !String(recalls).includes('⚠️')) return null;
  return product?.safety?.opinionAlerts || recalls;
}

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
  return String(tag || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildFactRows(product) {
  const bestFor = (product.healthFunctions || []).concat(product.tags || []).slice(0, 3).map(humanizeTag).join(', ');
  const materials = (product.safety?.materials || '').trim();
  const skipIf = firstSentence(product.safety?.sideEffects, 90) || firstSentence(product.safety?.allergens, 90);
  return [
    bestFor ? { label: 'Best for', value: bestFor } : null,
    materials ? { label: 'Materials', value: materials } : null,
    skipIf ? { label: 'Skip if', value: skipIf } : null,
  ].filter(Boolean);
}

function ChipLink({ chip }) {
  return chip.url ? (
    <a href={chip.url} target="_blank" rel="noopener noreferrer" title={chip.text || chip.url} style={CHIP}>{chip.label}</a>
  ) : (
    <span style={CHIP}>{chip.label}</span>
  );
}

function ChipRow({ chips }) {
  if (!chips?.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
      {chips.map((c) => <ChipLink key={c.url || c.label} chip={c} />)}
    </div>
  );
}

function SpecRow({ label, value, last = false }) {
  return (
    <div style={{ padding: '13px 0', borderTop: last ? undefined : undefined, borderBottom: last ? 'none' : '1px solid var(--ayna-chip-bg)' }}>
      <div style={EYEBROW}>{label}</div>
      <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.5, marginTop: 5, color: 'var(--ayna-text)' }}>{value}</div>
    </div>
  );
}

function LinkRow({ label, value, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0', borderTop: '1px solid var(--ayna-chip-bg)', cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ flex: 1, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{label}</div>
      <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', fontWeight: 600 }}>{value}</div>
      {onClick && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ayna-text-faint)" strokeWidth="2.2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
      )}
    </div>
  );
}

function SafetyBanner({ text }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      style={{ margin: '14px 22px 0', background: '#FEF2F2', border: '1px solid #991B1B', borderLeft: '4px solid #991B1B', borderRadius: 16, padding: '12px 14px', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: '#991B1B' }}>⚠️ Safety note</div>
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
function AskAynaTab({ product, quizAnswers, ecosystemProducts }) {
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
        setError('Sign in to ask Ayna about this product — free accounts get a few AI chats per week.');
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
    <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {messages.length === 0 && (
        <>
          <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.55, color: 'var(--ayna-text-muted)' }}>
            New to this kind of product, or not sure what it's actually for? Ask Ayna anything about it.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {suggestions.map((s) => (
              <div
                key={s}
                onClick={() => ask(s)}
                style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 500, padding: '8px 13px', borderRadius: 99, background: 'var(--ayna-chip-bg)', color: 'var(--ayna-text-muted)', cursor: 'pointer' }}
              >
                {s}
              </div>
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
          style={{ flex: 1, padding: '11px 14px', borderRadius: 99, border: '1px solid var(--ayna-border)', fontSize: 'max(16px, calc(13.5px * var(--ayna-text-scale, 1)))', background: 'var(--ayna-surface)', color: 'var(--ayna-text)' }}
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
            fontFamily: "'DM Sans',sans-serif",
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
  whyMatched,
  reads = [],
  quizAnswers = null,
  ecosystemProducts = [],
}) {
  const [mode, setMode] = useState('summary'); // 'summary' | 'evidence'
  const [activeTab, setActiveTab] = useState('summary');
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
    setMode('summary');
    setActiveTab('summary');
    setPartnerOpen(false);
  }

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
        onBack={() => setShowWhyMatch(false)}
        onViewDetails={() => { setShowWhyMatch(false); setMode('summary'); setActiveTab('summary'); }}
      />
    );
  }

  const matchPercent = getProfileMatchPercentForProduct(product, quizAnswers);
  const matchLabels = getProfileMatchLabelsForProduct(product, quizAnswers) || [];
  const openWhyMatch = () => setShowWhyMatch(true);

  const {
    name,
    category,
    brand,
    price,
    image,
    summary,
    ingredients,
    effectiveness,
    doctorOpinion,
    doctorOpinionShort,
    doctorOpinionCitations = [],
    clinicianAttribution,
    safety = {},
    badges = [],
    tags = [],
    whereToBuy = [],
    warnings,
    whoItsFor,
    howToUse,
    communityReview,
    ingredientScience,
    scientificCitations = [],
  } = product;

  const categoryLabel = CATEGORY_LABELS[category] || (category ? category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');
  const eyebrowLine = [categoryLabel, brand].filter(Boolean).join(' · ');
  const buyUrl = getBuyUrl(product);
  const safetyAlertText = getSafetyAlertText(product);
  const isPartner = isPartnerBrandItem(product);
  const partnerDisclosure = getPartnerDisclosureText(product);
  const pillTags = tags.slice(0, 4).map(humanizeTag);

  const handleShare = async () => {
    const shareData = { title: name, text: `${name} on ayna`, url: product.url || buyUrl || undefined };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled the share sheet */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareData.url ? `${shareData.text} — ${shareData.url}` : shareData.text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch { /* clipboard unavailable — nothing more we can do */ }
  };

  // Scientific literature: doctor + scientific verification links, plus
  // curated scientificCitations and per-ingredient citations — same three
  // sources and same dedupe-by-URL logic as the desktop Scientific
  // literature tab (src/components/ProductModal.jsx).
  const scientificLiteratureEntries = (() => {
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
    for (const c of scientificCitations) {
      if (!c.url || seenUrls.has(c.url)) continue;
      const label = hostLabel(c.url);
      if (!label) continue;
      seenUrls.add(c.url);
      entries.push({ url: c.url, label, kind: 'Scientific', text: c.text || null, summary: c.summary || null });
    }
    for (const item of ingredientScience || []) {
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
  })();

  const communityCitationEntries = (() => {
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
  })();

  const sourceCounts = {
    doctor: getVerificationLinks(product, 'doctor').length,
    scientific: getVerificationLinks(product, 'scientific').length,
    community: getVerificationLinks(product, 'community').length,
  };
  const sourceCountTotal = sourceCounts.doctor + sourceCounts.scientific + sourceCounts.community;

  const summarySourceChips = (() => {
    const chips = [];
    const seenLabels = new Set();
    for (const chip of toSourceChips([...getVerificationLinks(product, 'doctor'), ...getVerificationLinks(product, 'scientific')])) {
      if (seenLabels.has(chip.label)) continue;
      seenLabels.add(chip.label);
      chips.push(chip);
      if (chips.length >= 3) break;
    }
    return chips;
  })();

  // Doctor + scientific links both back clinical claims, so both show on the
  // Clinician Opinion chip row — same as desktop's clinicianSourceLinks.
  // Kept separate from the Scientific Literature tab's full-card list.
  const clinicianChips = toSourceChips([...getVerificationLinks(product, 'doctor'), ...getVerificationLinks(product, 'scientific')]);
  const clinicianCitationChips = doctorOpinionCitations.map((c) => ({ url: c.url, label: hostLabel(c.url) || c.label, text: c.label }));

  const factRows = buildFactRows(product);

  const tabDefs = [
    { id: 'summary', label: 'ayna Summary', show: true },
    { id: 'clinician', label: 'Clinician Opinion', show: !!doctorOpinion },
    { id: 'scientific', label: 'Scientific Literature', show: scientificLiteratureEntries.length > 0 },
    { id: 'social', label: 'Social Media + Reviews', show: communityCitationEntries.length > 0 || !!communityReview },
    { id: 'whoitsfor', label: "Who it's for", show: Array.isArray(whoItsFor) && whoItsFor.length > 0 },
    { id: 'howtouse', label: 'How to use', show: howToUse?.steps?.length > 0 },
    { id: 'inside', label: "What's inside", show: Array.isArray(ingredientScience) && ingredientScience.length > 0 },
    { id: 'ask', label: 'Ask Ayna', show: true },
  ].filter((t) => t.show);

  const goTab = (id) => { setMode('summary'); setActiveTab(id); };
  const hasWhoItsFor = tabDefs.some((t) => t.id === 'whoitsfor');
  const hasHowToUse = tabDefs.some((t) => t.id === 'howtouse');

  return (
    <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--ayna-bg)', color: 'var(--ayna-text)' }}>
      <div style={{ flex: 1, overflowY: 'auto', animation: 'ay-page .25s ease-out', paddingBottom: 104 }}>
        <div style={{ paddingTop: 'max(24px, env(safe-area-inset-top))', paddingLeft: 20, paddingRight: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', flex: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--ayna-heading)' }}>
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>Back</span>
          </div>
          <div style={{ display: 'flex', background: 'var(--ayna-chip-bg)', border: '1px solid var(--ayna-border)', borderRadius: 99, padding: 3, flex: 'none' }}>
            {['summary', 'evidence'].map((m) => (
              <div
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 99,
                  background: mode === m ? 'var(--ayna-cta-bg)' : 'transparent',
                  color: mode === m ? 'var(--ayna-cta-text)' : 'var(--ayna-text-muted)',
                  fontFamily: "'DM Sans',sans-serif",
                  fontWeight: mode === m ? 600 : 500,
                  fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'background .16s ease',
                }}
              >
                {m}
              </div>
            ))}
          </div>
          <div
            onClick={handleShare}
            style={{ width: 36, height: 36, borderRadius: 99, border: '1px solid var(--ayna-border)', background: 'var(--ayna-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ayna-heading)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15V3" /><path d="M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
            </svg>
          </div>
        </div>
        {shareCopied && (
          <div style={{ textAlign: 'right', paddingRight: 20, marginTop: 4, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)' }}>Link copied</div>
        )}

        <div style={{ margin: '14px 20px 0', borderRadius: 24, padding: 24, background: 'var(--ayna-product-panel)' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1',
              background: 'var(--ayna-surface)',
              borderRadius: 14,
              boxShadow: '0 10px 26px -16px rgba(41,37,36,.35)',
              overflow: 'hidden',
            }}
          >
            <ProductImage src={image} alt={name} allowBrandLogo={product?.type === 'digital'} />
            {matchPercent != null && (
              <div
                onClick={openWhyMatch}
                style={{ position: 'absolute', right: 14, bottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
              >
                <MatchRing percent={matchPercent} size={56} />
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1px', color: 'var(--ayna-accent-dark)', background: 'rgba(255,255,255,.9)', borderRadius: 99, padding: '3px 8px' }}>
                  WHY {matchPercent}%
                </div>
              </div>
            )}
          </div>
        </div>

        {isPartner && (
          <div style={{ margin: '10px 22px 0' }}>
            <div onClick={() => setPartnerOpen((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
              <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', fontWeight: 500, background: 'var(--ayna-chip-bg)', borderRadius: 99, padding: '6px 11px', flex: 'none' }}>ayna Partner</div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.4 }}>
                {partnerOpen ? 'Hide the disclosure' : 'Reviewed by us · we may earn a commission'}
              </div>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ayna-text-faint)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', transform: partnerOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            {partnerOpen && (
              <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.6, marginTop: 8 }}>{partnerDisclosure}</div>
            )}
          </div>
        )}

        <div style={{ padding: '18px 22px 0' }}>
          {eyebrowLine && <div style={EYEBROW}>{eyebrowLine}</div>}
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(31px * var(--ayna-text-scale, 1))', lineHeight: 1.1, margin: '9px 0 0', color: 'var(--ayna-heading)' }}>{name}</div>
          {price && <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(24px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', marginTop: 11 }}>{price}</div>}
          {pillTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 13 }}>
              {pillTags.map((t) => (
                <div key={t} style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '.9px', textTransform: 'uppercase', background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', color: 'var(--ayna-text-muted)', borderRadius: 99, padding: '5px 9px' }}>
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>

        {safetyAlertText && <SafetyBanner text={safetyAlertText} />}

        {mode === 'summary' ? (
          <div style={{ padding: '18px 22px 0' }}>
            <div
              className="ay-pdp-rail"
              style={{ position: 'sticky', top: -4, zIndex: 2, margin: '0 -22px', padding: '0 22px 10px', background: 'var(--ayna-bg)', display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none' }}
            >
              {tabDefs.map((tab) => {
                const on = activeTab === tab.id;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 'none',
                      whiteSpace: 'nowrap',
                      fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))',
                      fontWeight: on ? 600 : 500,
                      padding: '9px 14px',
                      borderRadius: 99,
                      cursor: 'pointer',
                      background: on ? 'var(--ayna-cta-bg)' : 'var(--ayna-surface)',
                      color: on ? 'var(--ayna-cta-text)' : 'var(--ayna-text-muted)',
                      border: '1px solid ' + (on ? 'var(--ayna-cta-bg)' : 'var(--ayna-border)'),
                    }}
                  >
                    {tab.label}
                  </div>
                );
              })}
            </div>

            {activeTab === 'summary' && (
              <div style={CARD}>
                {sourceCountTotal > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--ayna-accent-dark)' }} />
                    <div style={EYEBROW}>ayna summary · {sourceCountTotal} source{sourceCountTotal === 1 ? '' : 's'}</div>
                  </div>
                )}
                {summary ? (
                  <div style={{ fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', lineHeight: 1.6, marginTop: sourceCountTotal > 0 ? 12 : 0 }}>{summary}</div>
                ) : (
                  <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)' }}>No summary yet.</div>
                )}
                {effectiveness && (
                  <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: 'var(--ayna-text-muted)', marginTop: 10 }}>{effectiveness}</div>
                )}
                <ChipRow chips={summarySourceChips} />
              </div>
            )}

            {activeTab === 'clinician' && (
              <div style={CARD}>
                <div style={EYEBROW}>Clinician opinion</div>
                {doctorOpinion ? (
                  <div style={{ fontSize: 'calc(14px * var(--ayna-text-scale, 1))', lineHeight: 1.6, marginTop: 10, whiteSpace: 'pre-line' }}>{doctorOpinion}</div>
                ) : (
                  <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', marginTop: 10 }}>No clinician note yet.</div>
                )}
                {clinicianAttribution && (
                  <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', marginTop: 11 }}>{clinicianAttribution}</div>
                )}
                {badges.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 13 }}>
                    {badges.map((b) => (
                      <div key={b} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 'calc(12px * var(--ayna-text-scale, 1))', fontWeight: 500, padding: '7px 13px', borderRadius: 99, background: 'var(--ayna-chip-bg)', color: 'var(--ayna-text-muted)' }}>
                        {b}
                      </div>
                    ))}
                  </div>
                )}
                <ChipRow chips={[...clinicianChips, ...clinicianCitationChips]} />
              </div>
            )}

            {activeTab === 'scientific' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {scientificLiteratureEntries.map((entry) => (
                  <a key={entry.url} href={entry.url} target="_blank" rel="noopener noreferrer" style={{ ...CARD, display: 'block', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ ...EYEBROW, color: 'var(--ayna-text-faint)' }}>{entry.kind}</div>
                      <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', fontWeight: 600 }}>{entry.label}</div>
                    </div>
                    {entry.text && <div style={{ fontSize: 'calc(14px * var(--ayna-text-scale, 1))', fontWeight: 500, lineHeight: 1.4, marginTop: 8 }}>{entry.text}</div>}
                    {entry.summary && <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.58, color: 'var(--ayna-text-muted)', marginTop: 6 }}>{entry.summary}</div>}
                  </a>
                ))}
              </div>
            )}

            {activeTab === 'social' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {communityCitationEntries.length > 0 ? communityCitationEntries.map((entry) => (
                  <a key={entry.url} href={entry.url} target="_blank" rel="noopener noreferrer" style={{ ...CARD, display: 'flex', gap: 12, alignItems: 'flex-start', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, flex: 'none', background: 'var(--ayna-chip-bg)', color: 'var(--ayna-accent-dark)', fontFamily: "'Playfair Display',serif", fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {entry.label.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'calc(11px * var(--ayna-text-scale, 1))', fontWeight: 600, color: 'var(--ayna-text-muted)' }}>{entry.label}</div>
                      {entry.text && <div style={{ fontSize: 'calc(14px * var(--ayna-text-scale, 1))', fontWeight: 500, lineHeight: 1.4, marginTop: 3 }}>{entry.text}</div>}
                      {entry.summary && <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.55, color: 'var(--ayna-text-muted)', marginTop: 5 }}>{entry.summary}</div>}
                    </div>
                  </a>
                )) : communityReview ? (
                  <div style={CARD}>
                    <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.6 }}>{communityReview}</div>
                  </div>
                ) : (
                  <div style={CARD}><div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)' }}>No community notes yet.</div></div>
                )}
              </div>
            )}

            {activeTab === 'whoitsfor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {(whoItsFor || []).map((item, i) => (
                  <div key={item} style={{ ...CARD, display: 'flex', gap: 12, alignItems: 'center', padding: '14px 15px' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 12, background: 'var(--ayna-chip-bg)', color: 'var(--ayna-accent-dark)', fontFamily: "'Playfair Display',serif", fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.5 }}>{item}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'howtouse' && (
              <div style={CARD}>
                {howToUse?.intro && (
                  <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: 'var(--ayna-heading)', background: 'var(--ayna-chip-bg)', borderRadius: 16, padding: 14, marginBottom: 14 }}>
                    {howToUse.intro}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {(howToUse?.steps || []).map((step, i, arr) => (
                    <div key={step} style={{ display: 'flex', gap: 13 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 99, marginTop: 4, background: 'var(--ayna-accent-dark)' }} />
                        {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--ayna-chip-bg)', marginTop: 3 }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingBottom: 15, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.55 }}>{step}</div>
                    </div>
                  ))}
                </div>
                {howToUse?.sourceUrl && <ChipRow chips={[{ url: howToUse.sourceUrl, label: hostLabel(howToUse.sourceUrl) || 'Source', text: howToUse.sourceLabel }]} />}
              </div>
            )}

            {activeTab === 'inside' && (
              <div style={{ ...CARD, padding: '6px 18px' }}>
                {(ingredientScience || []).map((item, i) => (
                  <div key={item.name} style={{ padding: '14px 0', borderTop: i ? '1px solid var(--ayna-chip-bg)' : 'none' }}>
                    <div style={{ fontSize: 'calc(14px * var(--ayna-text-scale, 1))', fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.58, color: 'var(--ayna-text-muted)', marginTop: 5 }}>{item.text}</div>
                  </div>
                ))}
                {safety.materials && (
                  <div style={{ padding: '14px 0', borderTop: (ingredientScience || []).length ? '1px solid var(--ayna-chip-bg)' : 'none', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.58, color: 'var(--ayna-text-muted)', whiteSpace: 'pre-line' }}>
                    {safety.materials}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ask' && (
              <AskAynaTab product={product} quizAnswers={quizAnswers} ecosystemProducts={ecosystemProducts} />
            )}
          </div>
        ) : (
          <div style={{ padding: '18px 22px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ borderRadius: 20, padding: '17px 18px', background: 'linear-gradient(120deg,#242A52,#4E3866 70%,#5D3F73)', color: '#FFFCF9', display: 'flex', alignItems: 'center', gap: 15 }}>
              {matchPercent != null && (
                <div style={{ width: 62, height: 62, borderRadius: 99, flex: 'none', border: '5px solid rgba(255,252,249,.16)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, color: '#F0A84B', lineHeight: 1 }}>{matchPercent}%</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1, color: '#C9C1DE', marginTop: 2 }}>MATCH</div>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.3px', textTransform: 'uppercase', opacity: 0.62 }}>Why you're seeing this</div>
                <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.5, marginTop: 8 }}>
                  {whyMatched || (matchLabels.length > 0 ? matchLabels.slice(0, 3).join(' · ') : 'Based on your ecosystem.')}
                </div>
              </div>
            </div>

            {(summary || effectiveness) && (
              <div style={CARD}>
                {summary && <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.62 }}>{summary}</div>}
                {effectiveness && <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: 'var(--ayna-text-muted)', marginTop: summary ? 8 : 0 }}>{effectiveness}</div>}
              </div>
            )}

            {(doctorOpinionShort || doctorOpinion) && (
              <div style={CARD}>
                <div style={EYEBROW}>Clinician opinion</div>
                <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.62, marginTop: 10 }}>{doctorOpinionShort || doctorOpinion}</div>
                {clinicianAttribution && <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', marginTop: 11 }}>{clinicianAttribution}</div>}
                <ChipRow chips={[...clinicianChips, ...clinicianCitationChips]} />
              </div>
            )}

            {Array.isArray(warnings) && warnings.length > 0 && (
              <div style={{ background: '#FEF2F2', border: '1px solid #991B1B', borderLeft: '4px solid #991B1B', borderRadius: 22, padding: '17px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l9 16H3z" /><path d="M12 9v4" /><path d="M12 16.4v.1" /></svg>
                  <div style={{ ...EYEBROW, color: '#991B1B' }}>Warnings</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
                  {warnings.map((w) => (
                    <div key={w} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: 99, background: '#DC2626', flex: 'none', marginTop: 7 }} />
                      <div style={{ flex: 1, minWidth: 0, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.55, color: '#3f3831' }}>{w}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ ...CARD, padding: '6px 18px' }}>
              {(scientificLiteratureEntries.length > 0) && (
                <LinkRow label="Scientific" value={`${scientificLiteratureEntries.length} source${scientificLiteratureEntries.length === 1 ? '' : 's'}`} onClick={() => goTab('scientific')} />
              )}
              {(communityCitationEntries.length > 0 || communityReview) && (
                <LinkRow label="Social Media + Reviews" value={communityCitationEntries.length > 0 ? `${communityCitationEntries.length} link${communityCitationEntries.length === 1 ? '' : 's'}` : '1 note'} onClick={() => goTab('social')} />
              )}
              {safety.fdaStatus && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderTop: '1px solid var(--ayna-chip-bg)' }}>
                  <div style={{ flex: 'none', width: 60, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))' }}>FDA</div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.5, color: 'var(--ayna-text-muted)', textAlign: 'right' }}>{firstSentence(safety.fdaStatus, 100)}</div>
                </div>
              )}
            </div>

            {factRows.length > 0 && (
              <div style={{ ...CARD, padding: '6px 18px' }}>
                {factRows.map((row, i) => <SpecRow key={row.label} label={row.label} value={row.value} last={i === factRows.length - 1} />)}
              </div>
            )}

            {(hasWhoItsFor || hasHowToUse) && (
              <div style={{ display: 'grid', gridTemplateColumns: hasWhoItsFor && hasHowToUse ? 'repeat(2,minmax(0,1fr))' : '1fr', gap: 9 }}>
                {hasWhoItsFor && (
                  <div onClick={() => goTab('whoitsfor')} style={{ ...CARD, cursor: 'pointer' }}>
                    <div style={{ ...EYEBROW, color: 'var(--ayna-accent-dark)' }}>Who it's for</div>
                    <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.45, color: 'var(--ayna-text-muted)', marginTop: 6 }}>{whoItsFor.length} group{whoItsFor.length === 1 ? '' : 's'} →</div>
                  </div>
                )}
                {hasHowToUse && (
                  <div onClick={() => goTab('howtouse')} style={{ ...CARD, cursor: 'pointer' }}>
                    <div style={{ ...EYEBROW, color: 'var(--ayna-accent-dark)' }}>How to use</div>
                    <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.45, color: 'var(--ayna-text-muted)', marginTop: 6 }}>{howToUse.steps.length} step{howToUse.steps.length === 1 ? '' : 's'} →</div>
                  </div>
                )}
              </div>
            )}

            {!buyUrl && whereToBuy.length > 0 && (
              <div style={CARD}><SpecRow label="Where to buy" value={whereToBuy.join(' · ')} last /></div>
            )}

            {ingredients && (
              <div style={CARD}>
                <div style={EYEBROW}>Inside</div>
                <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.6, marginTop: 8, whiteSpace: 'pre-line' }}>{ingredients}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '18px 22px 0' }}>
          <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55 }}>Research + review summary. Not medical advice.</div>
        </div>

        {reads.length > 0 && (
          <div style={{ padding: '22px 22px 34px' }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', marginBottom: 10 }}>Reads</div>
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
                {r.mins && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', whiteSpace: 'nowrap' }}>{r.mins}</div>}
              </div>
            ))}
          </div>
        )}
        <LegalFooter />
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 20px max(20px, env(safe-area-inset-bottom))', background: 'linear-gradient(to top, var(--ayna-bg) 72%, transparent)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div
          onClick={onToggleSaved}
          role="button"
          aria-pressed={isSaved}
          style={{ width: 50, height: 50, borderRadius: 99, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--ayna-surface)', border: '1px solid ' + (isSaved ? 'var(--ayna-accent-dark)' : 'var(--ayna-border)') }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill={isSaved ? 'var(--ayna-accent-dark)' : 'none'} stroke={isSaved ? 'var(--ayna-accent-dark)' : 'var(--ayna-heading)'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20s-7-4.4-8.9-8.4A4.9 4.9 0 0 1 12 6.3a4.9 4.9 0 0 1 8.9 5.3C19 15.6 12 20 12 20z" />
          </svg>
        </div>
        <div
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
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 'calc(13px * var(--ayna-text-scale, 1))',
            fontWeight: 600,
            background: isInEcosystem ? 'var(--ayna-chip-bg)' : 'var(--ayna-surface)',
            color: 'var(--ayna-heading)',
            border: '1px solid ' + (isInEcosystem ? 'var(--ayna-accent-dark)' : 'var(--ayna-border)'),
          }}
        >
          {isInEcosystem ? '✓ In ecosystem' : '+ Ecosystem'}
        </div>
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
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600,
              fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))',
              boxShadow: '0 14px 26px -14px rgba(36,42,82,.7)',
              textDecoration: 'none',
            }}
          >
            Buy Now
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
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600,
              fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))',
            }}
          >
            {whereToBuy.length > 0 ? whereToBuy[0] : 'No link yet'}
          </div>
        )}
      </div>
    </div>
  );
}
