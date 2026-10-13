import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProductImageFallback } from './ProductTileImage';
import ProductCard from './ProductCard';
import { ALL_PRODUCTS, getProfileMatchLabelsForProduct, getProfileMatchPercentForProduct, CATEGORY_LABELS } from '../data/products';
import { getAynaRating } from '../data/aynaReviews';
import { resolveProductImage, isPlaceholderProductImage } from '../utils/resolveProductImage';
import { isPartnerBrandItem } from '../utils/partnerBrands';
import { handleImageErrorWithRetry } from '../utils/imageRetry';
import { getSupabaseClient } from '../utils/supabaseClient';
import { renderMarkdownLite } from '../utils/renderMarkdownLite';
import MatchGauge from './MatchGauge';
import WhyMatchPanel from './WhyMatchPanel';
import { PANEL_ICONS, PANEL_TONES } from '../mobile/components/pdpIcons.jsx';
import { PRODUCT_BUY_URLS } from '../data/productBuyUrls';
import { getVerificationLinks, hostLabel } from '../utils/verificationLinks';
import { productHref, isPlainLeftClick } from '../utils/productRoute';
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

const TAG_ACRONYMS = { pcos: 'PCOS', ibs: 'IBS', uti: 'UTI', ivf: 'IVF', pms: 'PMS', pmdd: 'PMDD', hrt: 'HRT', iud: 'IUD', bv: 'BV', ob: 'OB' };
// Same wording as the app: sentence case, health acronyms kept.
function humanizeTag(tag) {
  const text = String(tag || '').replace(/[-_]/g, ' ').toLowerCase();
  return text.split(' ').map((word, i) => TAG_ACRONYMS[word] || (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)).join(' ');
}

/** No em dashes in anything we show; catalog copy still has some. */
function noDash(text) {
  return String(text || '').replace(/\s*—\s*/g, ', ').replace(/^,\s*/, '').trim();
}

// Tag types (P01). "fit" = who it suits, "attribute" = what it is / how it's
// made. Real warnings come from the safety note, never from a tag.
const ATTRIBUTE_TAGS = new Set([
  'organic', 'sustainability', 'comfort', 'privacy', 'non-hormonal', 'hormone-free', 'hormonal',
  'cruelty-free', 'vegan', 'reusable', 'external-only', 'travel-friendly', 'ph-neutral',
  'beginner-friendly', 'wearable', 'warming', 'telehealth', 'single-use', 'non-toxic', 'herbal',
  'graduated-set', 'gentle', 'drug-free', 'clinician-informed', 'dual-stimulation', 'accessory', 'education',
]);
const TAG_LABELS = { sustainability: 'Sustainable', comfort: 'Comfort', privacy: 'Privacy-first' };
const TAG_TIPS = {
  fit: 'Who this suits, based on the product details on file.',
  attribute: 'What this product is or how it is made.',
};
// Tags that say nothing on their own.
const HIDDEN_TAGS = new Set(['cost', 'discomfort']);

/**
 * 'safety-concern' in the catalog means "a pick for people who care about
 * what's in it". Say what the product actually avoids, from its own
 * materials/allergen text, or drop the tag.
 */
function safetyConcernLabel(product) {
  const text = [product?.safety?.allergens, product?.safety?.materials, product?.summary, product?.ingredients].join(' ').toLowerCase();
  if (/fragrance[- ]free|unscented|no fragrance|free (?:from|of)[^.]*fragrance/.test(text)) return 'Good if you avoid fragrance';
  if (/plastic[- ]free|no plastic|free (?:from|of)[^.]*plastic/.test(text)) return 'Good if you avoid plastic';
  if (/chlorine[- ]free|no chlorine|free (?:from|of)[^.]*chlorine/.test(text)) return 'Good if you avoid chlorine bleach';
  return null;
}

/** Tags from the same text the summary uses, so they never contradict it. */
function buildTypedTags(product) {
  if (!product) return [];
  const summaryText = [product.summary, product.effectiveness].join(' ').toLowerCase();
  const caveats = String(product?.safety?.opinionAlerts || '').toLowerCase();
  const out = [];
  const seen = new Set();
  for (const raw of product.tags || []) {
    const tag = String(raw || '').toLowerCase();
    if (!tag || HIDDEN_TAGS.has(tag)) continue;
    if (tag === 'heavy-flow') {
      const saysLighter = /light(?:-| )to(?:-| )moderate|light flow|lighter flow|moderate flow/.test(summaryText) && !/heavy/.test(summaryText);
      const caveatHeavy = /(less|not) (?:as )?absorbent[^.]*heavy|not enough for heavy/.test(caveats);
      if (saysLighter || caveatHeavy) continue;
    }
    let label;
    let type;
    if (tag === 'safety-concern') {
      label = safetyConcernLabel(product);
      type = 'fit';
      if (!label) continue;
    } else {
      label = TAG_LABELS[tag] || humanizeTag(tag);
      type = ATTRIBUTE_TAGS.has(tag) ? 'attribute' : 'fit';
    }
    if (seen.has(label)) continue;
    seen.add(label);
    out.push({ label, type, tip: TAG_TIPS[type] });
  }
  // Fit first, then attributes, max 4.
  return [...out.filter((t) => t.type === 'fit'), ...out.filter((t) => t.type === 'attribute')].slice(0, 4);
}

/**
 * Catalog summaries sometimes say "(see LOLA Organic Tampons for the founder
 * story)". Pull that out of the sentence and turn it into a real link.
 */
function splitCrossRef(text) {
  const m = String(text || '').match(/\s*\(see ([^()]+?) for (?:the )?([^()]+)\)/i);
  if (!m) return { text, ref: null };
  const name = m[1].trim().toLowerCase();
  const target = ALL_PRODUCTS.find((p) => String(p?.name || '').toLowerCase() === name) || null;
  return { text: String(text).replace(m[0], ''), ref: target ? { product: target, what: m[2].trim() } : null };
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

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

/**
 * Every source the page cites, in one list (P03): research/clinical links,
 * curated citations, ingredient fact sheets, the how-to-use page and the
 * community threads. A link on the brand's own site is labelled "Brand" so it
 * never reads as independent research.
 */
function buildAllSources(product) {
  if (!product) return [];
  const brandHosts = new Set([product.url, product.productUrl, product.faqUrl].map(hostOf).filter(Boolean));
  const brandSlug = String(product.brand || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const isBrand = (url) => {
    const h = hostOf(url);
    if (!h) return false;
    if (brandHosts.has(h)) return true;
    return brandSlug.length >= 3 && h.replace(/[^a-z0-9]/g, '').includes(brandSlug);
  };
  const seen = new Set();
  const out = [];
  const add = (url, { title, summary, kind, publisher, year }) => {
    if (!url || seen.has(url)) return;
    const pub = publisher || hostLabel(url);
    if (!pub) return;
    seen.add(url);
    const k = kind === 'Community' ? 'Community' : isBrand(url) ? 'Brand' : kind;
    out.push({ url, title: noDash(title || pub), publisher: pub, kind: k, summary: summary ? noDash(summary) : null, year: year || null });
  };
  for (const key of ['doctor', 'scientific']) {
    for (const l of getVerificationLinks(product, key)) add(l?.url || l?.href, { title: l.text, summary: l.summary, kind: 'Research', year: l.year });
  }
  for (const c of product.scientificCitations || []) add(c.url, { title: c.text, summary: c.summary, kind: 'Research', year: c.year });
  for (const c of product.doctorOpinionCitations || []) add(c.url, { title: c.label, kind: 'Research', year: c.year });
  for (const item of product.ingredientScience || []) {
    const multi = (item.citations || []).length > 1;
    for (const c of item.citations || []) add(c.url, { title: multi ? c.label : `${item.name} fact sheet`, kind: 'Research', year: c.year });
  }
  if (product.howToUse?.sourceUrl) add(product.howToUse.sourceUrl, { title: product.howToUse.sourceLabel || 'How to use', kind: 'Brand' });
  if (product.communityReviewSourceUrl) add(product.communityReviewSourceUrl, { title: product.communityReviewSourceLabel, kind: 'Community' });
  for (const l of getVerificationLinks(product, 'community')) {
    add(l?.url || l?.href, { title: l.text, summary: l.summary, kind: 'Community', publisher: PLATFORM_LABELS[l.platform] });
  }
  return out;
}

function meaningful(value) {
  const t = String(value || '').trim();
  return t && !/^(n\/?a|none|not applicable|unknown)$/i.test(t) ? t : '';
}

const FACT_ACRONYMS = { pcos: 'PCOS', ibs: 'IBS', uti: 'UTI', ivf: 'IVF', pms: 'PMS', pmdd: 'PMDD', hrt: 'HRT', iud: 'IUD', bv: 'BV' };
function factTag(tag) {
  return String(tag || '').replace(/[-_]/g, ' ').toLowerCase().split(' ')
    .map((w, i) => FACT_ACRONYMS[w] || (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ');
}
function factSentence(text, max = 90) {
  const t = String(text || '').trim();
  if (!t) return '';
  const cut = t.split(/(?<=[.!?])\s/)[0] || t;
  if (cut.length <= max) return cut;
  const tr = cut.slice(0, max); const sp = tr.lastIndexOf(' ');
  return `${(sp > max * 0.6 ? tr.slice(0, sp) : tr).trimEnd()}…`;
}
/** Best for / Materials / Skip if, same rows as the app. */
function buildFactRows(product) {
  const bestFor = [...new Set((product.healthFunctions || []).concat(product.tags || []).map(factTag))].slice(0, 3).join(', ');
  const materials = meaningful(product.safety?.materials);
  const ingredients = meaningful(product.ingredients);
  const same = materials && ingredients && materials.toLowerCase().replace(/[^a-z0-9]/g, '') === ingredients.toLowerCase().replace(/[^a-z0-9]/g, '');
  const skipIf = factSentence(meaningful(product.safety?.sideEffects)) || factSentence(meaningful(product.safety?.allergens));
  return [
    bestFor ? { label: 'Best for', value: bestFor } : null,
    materials && !same ? { label: 'Materials', value: materials } : null,
    skipIf ? { label: 'Skip if', value: skipIf } : null,
  ].filter(Boolean);
}

const SOURCE_GROUPS = [['Research', 'Research and clinical'], ['Brand', 'From the brand'], ['Community', 'Community']];

function SourceRow({ source, compact = false }) {
  return (
    <li className="pdp-src">
      <a href={source.url} target="_blank" rel="noopener noreferrer">
        <span className="pdp-src__title">{source.title}</span>
        <span className="pdp-src__meta">{[source.publisher, source.year].filter(Boolean).join(' · ')}{compact && source.kind !== 'Research' ? ` · ${source.kind}` : ''}</span>
        {!compact && source.summary && <span className="pdp-src__summary">{source.summary}</span>}
      </a>
    </li>
  );
}

/** A reviewer badge needs a real, named reviewer on the product (P02). */
function getNamedReviewer(product) {
  const r = product?.clinicianReviewer || product?.reviewedBy;
  if (!r || typeof r !== 'object') return null;
  const name = String(r.name || '').trim();
  const credential = String(r.credential || r.credentials || '').trim();
  const date = String(r.date || r.reviewedAt || '').trim();
  if (!name || !credential || !date) return null;
  return { name, credential, date, url: r.url || r.profileUrl || null };
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
  // Navigates to another product's own dedicated page.
  onOpenProduct = null,
  // Optional: renders a visible in-page "Back" control.
  onBack = null,
  // Opens the composer with this product attached ('post' | 'review' |
  // 'playlist' | 'recommend').
  onCommunityAction = null,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [showWhy, setShowWhy] = useState(false);
  const [showSources, setShowSources] = useState(false);
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

  const matchLabels = useMemo(
    () => getProfileMatchLabelsForProduct(product, quizResults, healthProfile),
    [product, quizResults, healthProfile]
  );
  const explicitMatchPercent = useMemo(() => getRealMatchPercent(product), [product]);
  const profileMatchPercent = useMemo(
    () => getProfileMatchPercentForProduct(product, quizResults, healthProfile),
    [product, quizResults, healthProfile]
  );
  const matchPercent = profileMatchPercent ?? explicitMatchPercent;
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
  const aynaRatingCount = Array.isArray(aynaData.ratings) ? aynaData.ratings.length : 0;
  // P09: only ratings real people left on ayna. The catalog's userRating has
  // no count or source behind it, so it is not shown.
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
        .map((p) => ({ p, m: getProfileMatchPercentForProduct(p, quizResults) }))
        .filter((x) => Number.isFinite(x.m) && x.m > 0)
        .sort((x, y) => y.m - x.m)
        .slice(0, 4)
        .map((x) => ({ ...x.p, _match: Math.round(x.m) }));
    }
    const used = new Set(matches.map((p) => p.id));
    const similar = pool.filter((p) => !used.has(p.id) && p.category === product.category).slice(0, 4);
    return { matches, similar };
  }, [product, ecosystemProducts, quizResults]);

  const eyebrow = useMemo(() => {
    if (!product) return '';
    const categoryLabel = String(CATEGORY_LABELS[product.category] || product.type || '').replace(/^[^\w]+\s*/, '');
    return [categoryLabel, product.brand].filter(Boolean).join(' · ');
  }, [product]);

  // Summary copy (P10): catalog sentences, cross-references turned into links,
  // no em dashes.
  const summary = useMemo(() => {
    if (!product) return { sentences: [], ref: null };
    let ref = null;
    const parts = [product.summary, product.effectiveness]
      .map((s) => {
        const split = splitCrossRef((s || '').trim());
        if (split.ref && !ref) ref = split.ref;
        return noDash(split.text);
      })
      .filter(Boolean);
    const out = [];
    for (const p of parts) {
      const already = out.some((o) => o.toLowerCase() === p.toLowerCase() || o.toLowerCase().includes(p.slice(0, 30).toLowerCase()));
      if (!already) out.push(p);
    }
    return { sentences: out.slice(0, 2), ref };
  }, [product]);

  const safetyAlert = useMemo(() => {
    const t = getSafetyAlertText(product);
    return t ? noDash(t) : null;
  }, [product]);

  const typedTags = useMemo(() => buildTypedTags(product), [product]);
  const reviewer = useMemo(() => getNamedReviewer(product), [product]);
  const allSources = useMemo(() => buildAllSources(product), [product]);

  const fdaLabel = useMemo(() => {
    const s = String(product?.safety?.fdaStatus || '').trim();
    if (!s || s.includes('⚠') || s.length > 32) return null;
    return /^fda/i.test(s) ? s : `FDA: ${s}`;
  }, [product]);

  const trustChecks = [
    String(product?.safety?.recalls || '') && !String(product?.safety?.recalls || '').includes('⚠️') ? 'No recalls on file' : null,
    String(product?.privacy?.sellsData || '').includes('❌') ? 'Doesn’t sell your data' : null,
    fdaLabel,
  ].filter(Boolean);

  const whoItsFor = Array.isArray(product?.whoItsFor) ? product.whoItsFor : [];
  const howToUse = product?.howToUse?.steps?.length > 0 ? product.howToUse : null;

  // Same tabs as the app's product screen (ayna summary, Clinician opinion,
  // Scientific literature, Reviews, Who it's for, How to use, Ask ayna).
  const visibleTabs = useMemo(() => [
    { id: 'summary', label: 'ayna summary', icon: 'summary' },
    { id: 'clinician', label: 'Clinician opinion', icon: 'clinician' },
    { id: 'scientific', label: 'Scientific literature', icon: 'scientific' },
    { id: 'community', label: 'Reviews', icon: 'community' },
    ...(whoItsFor.length > 0 ? [{ id: 'whoitsfor', label: 'Who it’s for', icon: 'community' }] : []),
    ...(howToUse ? [{ id: 'howtouse', label: 'How to use', icon: 'summary' }] : []),
    { id: 'ask', label: 'Ask ayna', icon: 'ask' },
  ], [whoItsFor.length, howToUse]);
  const factRows = useMemo(() => (product ? buildFactRows(product) : []), [product]);
  const sourceIndex = useMemo(() => {
    const c = { Research: 0, Brand: 0, Community: 0 };
    allSources.forEach((s) => { if (c[s.kind] != null) c[s.kind] += 1; });
    return { ...c, total: c.Research + c.Brand + c.Community };
  }, [allSources]);

  const evidenceChips = useMemo(() => allSources.filter((s) => s.kind !== 'Community').slice(0, 4), [allSources]);
  const communitySources = useMemo(() => allSources.filter((s) => s.kind === 'Community'), [allSources]);

  const communitySnippets = useMemo(() => {
    if ((aynaData.reviews || []).length > 0) {
      return aynaData.reviews.slice(0, 2).map((r) => truncate(r.text, 2000)).filter(Boolean);
    }
    if (product?.communityReview) return [noDash(product.communityReview)];
    return [];
  }, [aynaData, product]);

  if (!product) return null;

  const priceText = product.price || product.stage || '';
  const sourcesCount = allSources.length;
  const sourcesLabel = `${sourcesCount} source${sourcesCount === 1 ? '' : 's'}`;
  const openPlaylist = onCommunityAction ? () => onCommunityAction('playlist') : null;

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

  const sourcesButton = sourcesCount > 0 && (
    <button type="button" className="pdp-sources-btn" aria-expanded={showSources} aria-controls="pdp-inline-sources" onClick={() => setShowSources((v) => !v)}>
      {sourcesLabel}
      <span aria-hidden="true">{showSources ? '▴' : '▾'}</span>
    </button>
  );

  const currentTab = visibleTabs.find((t) => t.id === activeTab) || visibleTabs[0];

  return (
    <div className="mockup-page pdp-page-wrap">
      <div className="pdp-page">

        {showWhy && <WhyMatchPanel product={product} quizResults={quizResults} onClose={() => setShowWhy(false)} onUpdateHealth={() => { window.location.href = '/quiz'; }} />}

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

          <div className="pdp-head__detail">
            <div className="pdp-head__eyebrow">{eyebrow}{partnerBadge && <> · {partnerBadge}</>}</div>

            <div className="pdp-head__titlerow">
              <h1 className="pdp-head__name">{product.name}</h1>
              {matchPercent > 0 && (
                <button type="button" className="pdp-dial" onClick={() => setShowWhy(true)} aria-label={`${matchPercent} percent match. Why?`}>
                  <MatchGauge percent={matchPercent} size={40} theme="light" />
                  <span>Why?</span>
                </button>
              )}
            </div>

            <div className="pdp-head__pricerow">
              {priceText && <span className="pdp-head__price">{priceText}</span>}
              {!(matchPercent > 0) && isInEcosystem ? (
                <span className="pdp-head__match">In your ecosystem</span>
              ) : !(matchPercent > 0) && headMatchLabel ? (
                <span className="pdp-head__match">{headMatchLabel}</span>
              ) : null}
            </div>

            {(typedTags.length > 0 || trustChecks.length > 0 || reviewer) && (
              <ul className="pdp-typed-tags" aria-label="About this product">
                {typedTags.map((t) => (
                  <li key={t.label} className={`pdp-ttag pdp-ttag--${t.type}`} title={t.tip}>{t.label}</li>
                ))}
                {trustChecks.map((t) => (
                  <li key={t} className="pdp-ttag pdp-ttag--attribute" title="From the safety details on file.">✓ {t}</li>
                ))}
                {reviewer && (
                  <li className="pdp-ttag pdp-ttag--attribute">
                    {reviewer.url ? (
                      <a href={reviewer.url} target="_blank" rel="noopener noreferrer">✓ Reviewed by {reviewer.name}, {reviewer.credential} · {reviewer.date}</a>
                    ) : (
                      <>✓ Reviewed by {reviewer.name}, {reviewer.credential} · {reviewer.date}</>
                    )}
                  </li>
                )}
              </ul>
            )}

            {safetyAlert && <SafetyAlert text={safetyAlert} />}

            {actionButtons}
          </div>
        </div>

        <div className="pdp-below">
          <div className="pdp-tabpanel">
            {/* Same sections as the app's product screen, nothing hidden. */}
            {sourceIndex.total > 0 && (
              <div className="pdp-srcindex" aria-label="Sources on file">
                {[['Research', 'Research', 'scientific'], ['Brand', 'From the brand', 'clinician'], ['Community', 'Community', 'community']].map(([kind, label, tab]) => (
                  <button key={kind} type="button" onClick={() => setActiveTab(tab)} aria-label={`${label}: ${sourceIndex[kind]} sources`}>
                    <span>{label}</span><strong>{sourceIndex[kind]}</strong><small>{sourceIndex[kind] === 1 ? 'source' : 'sources'}</small>
                  </button>
                ))}
              </div>
            )}

            <div className="pdp-tabs pdp-tabs--app" role="tablist" aria-label="Product information">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`pdp-tab-${tab.id}`}
                  data-tone={PANEL_TONES[tab.icon] || 'ink'}
                  aria-selected={currentTab.id === tab.id}
                  aria-controls="pdp-tabpanel"
                  className={currentTab.id === tab.id ? 'is-active' : undefined}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {PANEL_ICONS[tab.icon] && <svg viewBox="0 0 24 24" aria-hidden="true">{PANEL_ICONS[tab.icon]}</svg>}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="pdp-panel" id="pdp-tabpanel" role="tabpanel" aria-labelledby={`pdp-tab-${currentTab.id}`} data-tone={PANEL_TONES[currentTab.icon] || 'ink'}>
              <div className="pdp-panel__title">
                <h2>{currentTab.label}</h2>
                {currentTab.id === 'summary' && sourcesButton}
              </div>

              {currentTab.id === 'summary' && (
                <>
                  {showSources && sourcesCount > 0 && (
                    <div className="pdp-inline-sources" id="pdp-inline-sources">
                      <ul>{allSources.map((s) => <SourceRow key={s.url} source={s} compact />)}</ul>
                    </div>
                  )}
                  {headMatchLabel && (
                    <div className="pdp-fit">
                      <strong>Why this fits you</strong>
                      <p>{matchLabels.slice(0, 3).map((l) => noDash(l)).join('. ')}.</p>
                    </div>
                  )}
                  {summary.sentences.length > 0 ? (
                    <p className="pdp-panel__body">{summary.sentences.join(' ')}</p>
                  ) : (
                    <p className="pdp-panel__empty">No summary yet.</p>
                  )}
                  {summary.ref && (
                    <p className="pdp-panel__xref">
                      See{' '}
                      <a
                        href={productHref(summary.ref.product.id)}
                        onClick={(e) => { if (!onOpenProduct || !isPlainLeftClick(e)) return; e.preventDefault(); onOpenProduct(summary.ref.product); }}
                      >
                        {summary.ref.product.name}
                      </a>
                      {' '}for the {summary.ref.what}.
                    </p>
                  )}
                  {trustChecks.length > 0 && (
                    <ul className="pdp-checks">{trustChecks.map((c) => <li key={c}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>{c}</li>)}</ul>
                  )}
                  {factRows.length > 0 && (
                    <dl className="pdp-facts">{factRows.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{noDash(row.value)}</dd></div>)}</dl>
                  )}
                  {Array.isArray(product.ingredientScience) && product.ingredientScience.length > 0 && (
                    <section className="pdp-panel__section">
                      <h3>What’s inside</h3>
                      <ul className="pdp-bullets">
                        {product.ingredientScience.map((item) => (
                          <li key={item.name}><strong>{item.name}:</strong> {noDash(item.text)}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {meaningful(product.ingredients) && (
                    <section className="pdp-panel__section"><h3>Ingredients</h3><p className="pdp-panel__body pdp-pre">{noDash(product.ingredients)}</p></section>
                  )}
                  {meaningful(product.safety?.fdaStatus) && (
                    <section className="pdp-panel__section"><h3>FDA status</h3><p className="pdp-panel__body">{noDash(product.safety.fdaStatus)}</p></section>
                  )}
                  {Array.isArray(product.whereToBuy) && product.whereToBuy.length > 0 && (
                    <section className="pdp-panel__section"><h3>Where to buy</h3><p className="pdp-panel__body">{product.whereToBuy.join(' · ')}</p></section>
                  )}
                  {onOmit && (
                    <div className="pdp-panel__foot pdp-panel__foot--end">
                      <button type="button" className="pdp-head__link" onClick={() => onOmit(product)}>
                        {isOmitted ? 'Undo “Not for me”' : 'Not for me'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {currentTab.id === 'clinician' && (
                product.doctorOpinion ? (
                  <>
                    <p className="pdp-panel__body" style={{ whiteSpace: 'pre-line' }}>{noDash(product.doctorOpinion)}</p>
                    {evidenceChips.length > 0 && (
                      <div className="pdp-panel__chips">
                        {evidenceChips.map((s) => (
                          <a key={s.url} className="pdp-chip" href={s.url} target="_blank" rel="noopener noreferrer" title={s.title}>
                            {s.publisher}{s.kind === 'Brand' ? ' (brand)' : ''}
                          </a>
                        ))}
                      </div>
                    )}
                    {product.clinicianAttribution && (
                      <div className="pdp-panel__foot"><span>{noDash(product.clinicianAttribution)}</span></div>
                    )}
                  </>
                ) : <p className="pdp-panel__empty">No clinician opinion yet.</p>
              )}

              {currentTab.id === 'scientific' && (
                <>
                  {meaningful(product.effectiveness) && <p className="pdp-panel__body">{noDash(product.effectiveness)}</p>}
                  {SOURCE_GROUPS.map(([kind, title]) => {
                    const list = allSources.filter((s) => s.kind === kind);
                    if (list.length === 0) return null;
                    return (
                      <section key={kind} className="pdp-panel__section">
                        <h3>{title}</h3>
                        <ul className="pdp-srclist">{list.map((s) => <SourceRow key={s.url} source={s} />)}</ul>
                      </section>
                    );
                  })}
                  {allSources.length === 0 && <p className="pdp-panel__empty">No studies linked yet.</p>}
                </>
              )}

              {currentTab.id === 'community' && (
                <>
                  {(aynaRating != null || aynaReviewCount > 0) && (
                    <p className="pdp-rating">
                      {aynaRating != null && <><span aria-hidden="true">★</span> {aynaRating.toFixed(1)} · {aynaRatingCount} rating{aynaRatingCount === 1 ? '' : 's'}</>}
                      {aynaRating != null && aynaReviewCount > 0 && ' · '}
                      {aynaReviewCount > 0 && <>{aynaReviewCount} review{aynaReviewCount === 1 ? '' : 's'}</>}
                    </p>
                  )}
                  {communitySnippets.map((snippet, i) => <p key={i} className="pdp-panel__body">{snippet}</p>)}
                  {communitySources.length > 0 && <ul className="pdp-srclist">{communitySources.map((s) => <SourceRow key={s.url} source={s} />)}</ul>}
                  {communitySnippets.length === 0 && communitySources.length === 0 && aynaRating == null && (
                    <p className="pdp-panel__empty">No review summary yet.</p>
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
                    </>
                  )}
                </>
              )}

              {currentTab.id === 'whoitsfor' && (
                <ol className="pdp-who">{whoItsFor.map((item, i) => <li key={item}><b>{i + 1}</b><span>{noDash(item)}</span></li>)}</ol>
              )}

              {currentTab.id === 'howtouse' && (
                <>
                  {howToUse.intro && <p className="pdp-panel__body">{noDash(howToUse.intro)}</p>}
                  <ol className="pdp-bullets pdp-bullets--steps">{howToUse.steps.map((step) => <li key={step}>{noDash(step)}</li>)}</ol>
                  {howToUse.sourceUrl && (
                    <div className="pdp-panel__chips">
                      <a className="pdp-chip" href={howToUse.sourceUrl} target="_blank" rel="noopener noreferrer">{hostLabel(howToUse.sourceUrl) || 'Source'}</a>
                    </div>
                  )}
                </>
              )}

              {currentTab.id === 'ask' && (
                <AskAynaProductTab
                  product={product}
                  aiContext={{}}
                  quizResults={quizResults}
                  ecosystemProducts={ecosystemProducts}
                />
              )}
            </div>
          </div>

          {onCommunityAction && (
            <section className="pdp-community-actions pdp-community-actions--flat" aria-labelledby="pdp-community-h">
              <h3 id="pdp-community-h">Community</h3>
              <div className="pdp-community-actions__grid">
                {[['post', 'Mention in a post'], ['review', 'Write a review'], ['recommend', 'Recommend to a friend']].map(([kind, label]) => (
                  <button key={kind} type="button" className={kind === 'post' ? 'is-primary' : undefined} onClick={() => onCommunityAction(kind)}>{label}</button>
                ))}
              </div>
            </section>
          )}
        </div>

        {relatedGrid}
      </div>

      {/* P13: sticky Buy bar on phones. */}
      <aside className="pdp-sticky" aria-label="Buy">
        {priceText && <span className="pdp-sticky__price">{priceText}</span>}
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
