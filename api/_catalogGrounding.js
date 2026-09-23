/* global process */
/**
 * PRODUCT INTEGRITY — shared catalog grounding for every AI route.
 *
 * Rule (2026-09-22 audit): no invented product, brand, URL, price or product
 * fact may reach the UI. A model may only CHOOSE products from Ayna's
 * reviewed catalog (bundled src/data + human-published product_catalog rows)
 * and write personalization text about them. Every product object that
 * leaves an AI route is rebuilt from the catalog record here; anything the
 * model names that is not in the catalog is dropped, never displayed.
 */
import { createClient } from '@supabase/supabase-js';
import { ALL_PRODUCTS } from '../src/data/products.js';
import { isPublishable, toClientProduct } from './products.js';

const DB_CACHE_MS = 5 * 60 * 1000;
let dbCache = { at: 0, rows: null };

function anonClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function loadPublishedDbProducts() {
  if (dbCache.rows && Date.now() - dbCache.at < DB_CACHE_MS) return dbCache.rows;
  const client = anonClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('product_catalog')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data || []).filter(isPublishable).map(toClientProduct);
    dbCache = { at: Date.now(), rows };
    return rows;
  } catch (e) {
    console.warn('[catalog-grounding] DB catalog unavailable, using bundled catalog only:', e?.message);
    return [];
  }
}

/** Bundled catalog + published DB rows (DB wins on id collisions). */
export async function loadGroundingCatalog({ includeDb = true } = {}) {
  const byId = new Map();
  for (const p of ALL_PRODUCTS) if (p?.id && p?.name) byId.set(String(p.id), p);
  if (includeDb) {
    for (const p of await loadPublishedDbProducts()) if (p?.id && p?.name) byId.set(String(p.id), p);
  }
  return [...byId.values()];
}

export function _resetGroundingCacheForTests() {
  dbCache = { at: 0, rows: null };
}

function slug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** brand+name key that collapses "LOLA" + "LOLA Organic Pads" and "LOLA Organic Pads". */
export function productKey(name, brand) {
  const b = slug(brand);
  let n = slug(name);
  if (b && n.startsWith(`${b}-`)) n = n.slice(b.length + 1);
  return b ? `${b}-${n}` : n;
}

export function buildCatalogIndex(products) {
  const byId = new Map();
  const byKey = new Map();
  const byName = new Map();
  for (const p of products || []) {
    if (!p?.id) continue;
    byId.set(String(p.id).toLowerCase(), p);
    byKey.set(productKey(p.name, p.brand), p);
    const nameOnly = slug(p.name);
    // Name-only match is only safe when the name is unambiguous.
    byName.set(nameOnly, byName.has(nameOnly) ? null : p);
  }
  return { byId, byKey, byName, size: byId.size };
}

/**
 * Resolve a model-returned object to a real catalog record, or null.
 * Accepts {catalogId}|{id}; falls back to an EXACT normalized brand+name
 * (or unambiguous exact name) match. Never fuzzy — a near-match is how a
 * real brand gets paired with a product it doesn't make.
 */
export function resolveCatalogProduct(candidate, index) {
  if (!candidate || !index) return null;
  for (const raw of [candidate.catalogId, candidate.id]) {
    const id = String(raw || '').trim().toLowerCase();
    if (id && index.byId.has(id)) return index.byId.get(id);
  }
  const name = String(candidate.name || '').trim();
  if (!name) return null;
  const byKey = index.byKey.get(productKey(name, candidate.brand));
  if (byKey) return byKey;
  return index.byName.get(slug(name)) || null;
}

function cleanText(v, max) {
  if (typeof v !== 'string') return '';
  const t = v.replace(/\s+/g, ' ').trim();
  // Personalization copy must not smuggle in links or buy targets.
  if (/https?:\/\/|www\.\w/i.test(t)) return '';
  return t.slice(0, max);
}

/**
 * The catalog record, plus ONLY the model's personalization prose. Every
 * factual field (name, brand, price, url, image, summary, safety, rating,
 * ingredients, whereToBuy) comes from the catalog.
 */
export function hydrateFromCatalog(catalogProduct, modelFields = {}, extra = {}) {
  if (!catalogProduct) return null;
  const out = { ...catalogProduct, catalogId: catalogProduct.id, catalogVerified: true };
  const why = cleanText(modelFields.whyItWorks, 900);
  const considerations = cleanText(modelFields.considerations, 600);
  const matchExplanation = cleanText(modelFields.matchExplanation, 900);
  if (why) out.whyItWorks = why;
  if (considerations) out.considerations = considerations;
  if (matchExplanation) out.matchExplanation = matchExplanation;
  delete out.llmGenerated;
  return { ...out, ...extra };
}

/** Compact one-line-per-product catalog listing for a prompt. */
export function formatCatalogForPrompt(products, { max = 400 } = {}) {
  return (products || [])
    .slice(0, max)
    .map((p) => {
      const funcs = Array.isArray(p.healthFunctions) ? p.healthFunctions.slice(0, 4).join(',') : '';
      const tags = Array.isArray(p.tags) ? p.tags.slice(0, 5).join(',') : '';
      return [p.id, p.brand || '', p.name, p.category, p.type || '', p.price || '', funcs, tags]
        .map((x) => String(x).replace(/[|\n]/g, ' ').trim())
        .join(' | ');
    })
    .join('\n');
}

export const CATALOG_ONLY_RULES = `CATALOG-ONLY RULE — overrides every other instruction:
- You may ONLY recommend products from the AYNA CATALOG list above. Each line is: id | brand | name | category | type | price | health functions | tags.
- Put the exact catalog id in "catalogId" (and "id"). Copy it character-for-character.
- NEVER name, invent, or describe a product, brand, URL, price, pack size, or rating that is not on that list. Do not use outside knowledge or web results to add products.
- If no catalog product fits, return fewer items or an empty list. An empty result is correct; an invented product is a critical failure.
- Only write your own words in whyItWorks / considerations / matchExplanation (plain language, no URLs). All product facts are filled in from the catalog afterwards.`;

/** Free-text AI answers: keep link text, drop every URL (no invented links). */
export function stripLinks(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/\[([^\]]+)\]\((?:[^)\s]+)\)/g, '$1')
    .replace(/<?https?:\/\/[^\s)>\]]+>?/gi, '')
    .replace(/\bwww\.[^\s)]+/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
