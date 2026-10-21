/**
 * Ask ayna follow-ups: the tappable next steps under an answer ("Open Elaris
 * Pod", "More products for cramps", "What helps on day 2?").
 *
 * The model PROPOSES them; nothing it returns reaches the UI until it passes
 * this whitelist. Every product or read id must be one we know about, every
 * label is either built from our own data or length-limited and checked
 * against the brand rule, and anything unrecognised is dropped (never
 * repaired into something the model didn't ask for).
 */
import { ALL_PRODUCTS } from '../src/data/products.js';
import { stripLinks } from './_catalogGrounding.js';
import { stripDiagnosticLanguage } from './_llm.js';

export const MAX_FOLLOW_UPS = 4;
export const MAX_ASK_TEXT = 60;
export const MAX_LABEL = 36;
export const FOLLOW_UP_TYPES = ['open_product', 'browse', 'ask', 'open_dashboard', 'open_library'];

const CATALOG_BY_ID = new Map(ALL_PRODUCTS.filter((p) => p?.id && p?.name).map((p) => [String(p.id), p]));
export const BROWSE_CATEGORIES = new Set(ALL_PRODUCTS.map((p) => p?.category).filter(Boolean));
const CATALOG_BRANDS = [...new Set(ALL_PRODUCTS.map((p) => String(p?.brand || '').trim()).filter((b) => b.length >= 3))];

function oneLine(v) {
  return typeof v === 'string' ? v.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim() : '';
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mentions(text, phrase) {
  const p = oneLine(phrase);
  if (!p || !text) return false;
  return new RegExp(`(^|[^a-z0-9])${escapeRe(p.toLowerCase())}([^a-z0-9]|$)`).test(text.toLowerCase());
}

/** A label/question may not name a catalog brand unless that brand is one of hers. */
function namesOutsideBrand(text, allowedBrands) {
  return CATALOG_BRANDS.some((b) => !allowedBrands.has(b.toLowerCase()) && mentions(text, b));
}

function shorten(s, max) {
  const t = oneLine(s);
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

// Library titles are in title case ("Intimate Washes"); a chip label is
// sentence case, so lower Capitalised words and keep acronyms (PCOS, UTI).
function readTitleSentenceCase(title) {
  return oneLine(title).split(' ').map((w) => (/^[A-Z][a-z]/.test(w) ? w.toLowerCase() : w)).join(' ');
}

function sentenceCase(s) {
  const t = oneLine(s);
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

/**
 * Normalises what the client told us about her (already-trimmed lists) into
 * lookup maps. Kept separate so the handler and the tests build it the same way.
 */
export function buildFollowUpContext({ ecosystemProducts, reads, hasHealthData, screenContext, answer } = {}) {
  const ecosystem = new Map();
  (Array.isArray(ecosystemProducts) ? ecosystemProducts : []).slice(0, 40).forEach((p) => {
    const id = p && (typeof p.id === 'string' || typeof p.id === 'number') ? String(p.id).slice(0, 80) : '';
    const name = shorten(p?.name, 60);
    if (id && name) ecosystem.set(id, { name, brand: shorten(p?.brand, 40) });
  });
  const articles = new Map();
  (Array.isArray(reads) ? reads : []).slice(0, 20).forEach((r) => {
    const id = r && typeof r.id === 'string' ? r.id.slice(0, 120) : '';
    const title = shorten(r?.title, 120);
    if (id && title) articles.set(id, title);
  });
  return {
    ecosystem,
    articles,
    hasHealthContext: hasHealthData === true || (typeof screenContext === 'string' && screenContext.trim().length > 0),
    answer: typeof answer === 'string' ? answer : '',
  };
}

/** Lines for the prompt so the model can only propose ids we will accept. */
export function followUpPromptContext(ctx) {
  const parts = [];
  if (ctx.ecosystem.size) {
    parts.push(`HER ECOSYSTEM (id | name; these may be named, and may be opened with open_product):\n${[...ctx.ecosystem].map(([id, p]) => `${id} | ${p.name}`).join('\n')}`);
  }
  if (ctx.articles.size) {
    parts.push(`AYNA READS SHE CAN OPEN (id | title):\n${[...ctx.articles].map(([id, t]) => `${id} | ${t}`).join('\n')}`);
  }
  parts.push(`SHOP CATEGORIES for browse: ${[...BROWSE_CATEGORIES].join(', ')}`);
  parts.push(ctx.hasHealthContext ? 'She has health data, so open_dashboard is allowed.' : 'She has no health data here, so do NOT use open_dashboard.');
  return parts.join('\n\n');
}

/**
 * Whitelist-validates the model's followUps. Returns at most MAX_FOLLOW_UPS
 * items of exactly these shapes, each with a ready-to-show sentence-case label:
 *   { type: 'open_product', productId, label }
 *   { type: 'browse', intent: { category?, query? }, label }
 *   { type: 'ask', text, label }
 *   { type: 'open_dashboard', label }
 *   { type: 'open_library', articleId, label }
 */
export function validateFollowUps(raw, ctx) {
  if (!Array.isArray(raw) || !ctx) return [];
  const allowedBrands = new Set([...ctx.ecosystem.values()].map((p) => p.brand.toLowerCase()).filter(Boolean));
  const out = [];
  const seen = new Set();
  const push = (item, key) => {
    if (seen.has(key) || out.length >= MAX_FOLLOW_UPS) return;
    seen.add(key);
    out.push(item);
  };

  for (const f of raw.slice(0, 12)) {
    if (out.length >= MAX_FOLLOW_UPS) break;
    if (!f || typeof f !== 'object' || !FOLLOW_UP_TYPES.includes(f.type)) continue;

    if (f.type === 'open_product') {
      const id = typeof f.productId === 'string' || typeof f.productId === 'number' ? String(f.productId) : '';
      if (!id) continue;
      const mine = ctx.ecosystem.get(id);
      const catalog = CATALOG_BY_ID.get(id);
      // Hers, or a catalog product the answer itself actually named.
      const name = mine?.name || (catalog && mentions(ctx.answer, catalog.name) ? catalog.name : '');
      if (!name) continue;
      push({ type: 'open_product', productId: id, label: shorten(`Open ${name}`, MAX_LABEL) }, `p:${id}`);
    } else if (f.type === 'browse') {
      const intent = f.intent && typeof f.intent === 'object' ? f.intent : {};
      const category = typeof intent.category === 'string' && BROWSE_CATEGORIES.has(intent.category) ? intent.category : null;
      let query = oneLine(intent.query);
      if (query.length > 40 || /https?:|www\./i.test(query) || namesOutsideBrand(query, allowedBrands)) query = '';
      if (!category && !query) continue;
      let label = oneLine(f.label);
      if (!label || label.length > MAX_LABEL || /https?:|www\./i.test(label) || namesOutsideBrand(label, allowedBrands)) {
        label = `More ${(query || category).replace(/-/g, ' ')}`;
      }
      push({ type: 'browse', intent: { ...(category ? { category } : {}), ...(query ? { query } : {}) }, label: shorten(sentenceCase(label), MAX_LABEL) }, `b:${category || ''}:${query.toLowerCase()}`);
    } else if (f.type === 'ask') {
      const text = oneLine(f.text);
      if (!text || text.length > MAX_ASK_TEXT) continue;
      if (/https?:|www\./i.test(text) || stripLinks(text) !== text) continue;
      if (stripDiagnosticLanguage(text) !== text || namesOutsideBrand(text, allowedBrands)) continue;
      push({ type: 'ask', text: sentenceCase(text), label: sentenceCase(text) }, `a:${text.toLowerCase()}`);
    } else if (f.type === 'open_dashboard') {
      if (!ctx.hasHealthContext) continue;
      push({ type: 'open_dashboard', label: 'See my dashboard' }, 'd');
    } else if (f.type === 'open_library') {
      const id = typeof f.articleId === 'string' ? f.articleId : '';
      const title = ctx.articles.get(id);
      if (!title) continue;
      push({ type: 'open_library', articleId: id, label: shorten(`Read ${readTitleSentenceCase(title)}`, MAX_LABEL) }, `l:${id}`);
    }
  }
  return out;
}
