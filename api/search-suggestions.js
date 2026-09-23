/**
 * Vercel serverless: when Discovery's literal text search has no catalog hits,
 * the model maps the user's words onto products that ARE in Ayna's reviewed
 * catalog (e.g. "heavy days" -> overnight pads).
 *
 * PRODUCT INTEGRITY (2026-09-22 audit): the model only returns catalog ids.
 * Every suggestion is rebuilt from the catalog record (_catalogGrounding.js);
 * anything not in the catalog is dropped. The old Redis "discovered products"
 * persistence of model-invented suggestions was removed.
 */
/* global process */

import { checkProductInsightsRateLimit } from './_rateLimitProductInsights.js';
import { verifyUser } from './_usageLimit.js';
import { tryParseJsonCandidate, callWithFallback, parseProviderOrder, providerConfigured } from './_llm.js';
import {
  loadGroundingCatalog,
  buildCatalogIndex,
  resolveCatalogProduct,
  hydrateFromCatalog,
  formatCatalogForPrompt,
  CATALOG_ONLY_RULES,
} from './_catalogGrounding.js';

// Mirrors PRESCRIPTION_DRUG_PATTERN in api/llm-recommendations.js — keep the two in sync.
const PRESCRIPTION_DRUG_PATTERN = new RegExp(
  [
    '\\bprescription\\b', 'tranexamic', 'tranexemic', '\\blysteda\\b',
    // Hormonal birth control
    '\\byaz\\b', 'yasmin', '\\bjunel\\b', 'loestrin', 'ortho\\s*tri-?cyclen', '\\bsprintec\\b',
    'nuvaring', 'annovera', '\\bxulane\\b', '\\btwirla\\b', 'nexplanon', '\\bmirena\\b',
    'kyleena', '\\bskyla\\b', 'liletta', 'depo-?provera',
    // Hormone replacement therapy
    '\\bpremarin\\b', '\\bestrace\\b', 'prometrium', 'vivelle', 'climara', '\\bduavee\\b',
    'estring', 'evamist', 'prempro', 'activella', 'bijuva',
    // PMDD / menopause / mood
    '\\bprozac\\b', '\\bsarafem\\b', 'fluoxetine', '\\bzoloft\\b', 'sertraline',
    '\\blexapro\\b', 'escitalopram', '\\bpaxil\\b', 'paroxetine', 'effexor', 'venlafaxine',
    'wellbutrin', 'bupropion', '\\bbrisdelle\\b', '\\bveozah\\b', 'fezolinetant',
    // UTI antibiotics
    '\\bmacrobid\\b', 'nitrofurantoin', '\\bbactrim\\b', '\\bcipro\\b', 'ciprofloxacin',
    '\\bmonurol\\b', 'fosfomycin',
    // PCOS / metabolic
    '\\bmetformin\\b', 'glucophage', 'spironolactone', '\\baldactone\\b',
    // Endometriosis
    '\\borilissa\\b', 'elagolix', 'myfembree',
    // Migraine triptans (sometimes cross-recommended for hormonal headaches)
    '\\bimitrex\\b', 'sumatriptan',
    // GLP-1s (sometimes cross-recommended for PCOS/weight goals)
    '\\bozempic\\b', '\\bwegovy\\b', 'semaglutide', '\\bmounjaro\\b', '\\bzepbound\\b', 'tirzepatide',
  ].join('|'),
  'i'
);

function hasUrlLike(s) {
  if (typeof s !== 'string') return false;
  return /https?:\/\/|www\.\w/i.test(s);
}

function sanitizeStr(s, maxLen) {
  if (typeof s !== 'string') return '';
  let t = s.trim().replace(/\s+/g, ' ');
  if (hasUrlLike(t)) return '';
  return t.slice(0, maxLen);
}

/**
 * Model output -> catalog product, or null. The model contributes only the
 * catalog id and an optional one-line reason; every fact comes from the
 * catalog record.
 */
function normalizeSuggestion(raw, index) {
  const product = resolveCatalogProduct(raw, index);
  if (!product) return null;
  if (PRESCRIPTION_DRUG_PATTERN.test(`${product.brand || ''} ${product.name}`) && product.category !== 'telehealth') return null;
  return hydrateFromCatalog(product, { whyItWorks: raw?.reason || raw?.whyItWorks }, { searchMatched: true });
}

function normalizeQuerySummary(s) {
  const t = sanitizeStr(s, 700);
  return t.length >= 20 ? t : '';
}

function scopeCatalog(catalog, categoryHint) {
  if (!categoryHint || categoryHint === 'all') return catalog;
  const hint = categoryHint.toLowerCase();
  const scoped = catalog.filter((p) => String(p.category || '').toLowerCase() === hint);
  return scoped.length ? scoped : catalog;
}

function buildPrompt(query, categoryHint, symptomHint, personalized, profileSummary, maxResults, dislikedProducts, catalog) {
  const cat =
    categoryHint && categoryHint !== 'all'
      ? `User category filter: "${categoryHint}". Prefer products that fit this aisle when relevant.`
      : '';
  const sym =
    symptomHint && symptomHint !== 'all'
      ? `User filtered supplements by symptom theme: "${symptomHint}".`
      : '';
  const profileLine = personalized && profileSummary
    ? `User health profile: ${profileSummary}. Use this only to rank catalog products within the searched type.`
    : '';
  const dislikedLine = dislikedProducts
    ? `The user has tried and disliked these products — do NOT include them: ${dislikedProducts}`
    : '';
  return `You are the search layer for Ayna, a women's health product app. The user's words did not literally match a product name, so map what they MEAN onto products in Ayna's catalog below. The search query defines the product TYPE (e.g. "iron supplements" -> only iron supplements); a profile may only re-rank within that type.

User search: "${query.replace(/"/g, '\\"')}"
${cat}${sym ? '\n' + sym : ''}${profileLine ? '\n' + profileLine : ''}${dislikedLine ? '\n' + dislikedLine : ''}

AYNA CATALOG:
${formatCatalogForPrompt(catalog)}

${CATALOG_ONLY_RULES}

Return ONE JSON object ONLY (no markdown), up to ${maxResults} suggestions, most relevant first:
{
  "querySummary": "1-2 sentences tying the user's words to the kinds of products below. Never cite a specific guideline number, PMID or quote. Remind users to verify fit with a clinician when medical.",
  "relatedSearches": ["3-4 short natural search phrases the user might try next"],
  "suggestions": [
    { "catalogId": "exact id from the catalog", "reason": "one short plain-language line on why it matches this search" }
  ]
}

More rules:
- Never suggest a prescription medication. For prescription needs, suggest a catalog telehealth service instead.
- If the query is not women's health/wellness shopping related, or nothing in the catalog fits, return {"querySummary":"","relatedSearches":[],"suggestions":[]}.`;
}

/**
 * Was Anthropic-only via a hand-rolled fetch — a single provider's outage
 * (e.g. the account running out of credits, found live 2026-08-25) took down
 * every search on the site with no fallback. Now goes through the same
 * multi-provider callWithFallback every other AI route uses: a non-retryable
 * failure on the first configured provider falls through to the next one
 * instead of failing the whole request.
 */
async function callSuggestionsModel(prompt) {
  const order = parseProviderOrder('AI_DISCOVERY_PROVIDER_ORDER', 'anthropic,openai,gemini');
  try {
    const out = await callWithFallback(order, {
      system:
        "Return a single valid JSON object only. No markdown fences. No URLs. Only return catalog ids from the provided Ayna catalog — never invent products. Educational women's health context; never diagnose.",
      prompt,
      // Was reduced to 2048 on the assumption that was "~10x what 20 short
      // suggestions need." It wasn't: the schema below asks for a 2-3 sentence
      // summary, up to 6 tags, retailers, search terms, and a safety note PER
      // suggestion — 20 of those run ~2,800+ tokens before querySummary/
      // relatedSearches. 2048 truncated mid-JSON on every request needing
      // close to the full 20 (confirmed live in production — every real
      // search failed with invalid_model_json). Raising to 4096 still wasn't
      // enough (many requests still hit max_tokens live). 8192 is the
      // original value this was reduced from, before the "~10x" assumption
      // turned out to be wrong for the schema as it exists today.
      //
      // Tempting to shrink this now that Discovery.jsx requests far fewer
      // suggestions per search (8/6, down from 20/10) — resist that without
      // a live-verified measurement first. This exact reasoning ("fewer
      // items requested, so a smaller ceiling should have headroom") is what
      // failed at 4096 for 20 items; a regression test below pins 8192 as
      // the only value actually confirmed safe.
      maxTokens: 8192,
      temperature: 0.2,
      jsonMode: true,
      trace: { name: 'search-suggestions' },
    });
    if (out.truncated) {
      // Truncated output can't be recovered after the fact — this is here so a
      // future max_tokens regression shows up as a clear log line instead of a
      // bare invalid_model_json with no indication of why.
      console.warn(`search-suggestions: ${out.provider} hit max_tokens; response is truncated and will likely fail to parse`);
    }
    return out.text;
  } catch (e) {
    console.error('search-suggestions: all providers failed:', e?.status || '', e?.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  // This route is intentionally unauthenticated (anonymous Discovery search)
  // and it spends Anthropic tokens per call, so it must not be drivable from
  // arbitrary origins: `Access-Control-Allow-Origin: *` on the POST response
  // let any third-party page bill Ayna via its own visitors' browsers.
  // Same-origin requests send no Origin header and are unaffected.
  const allowList = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map((o) => o.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowList.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // This route spends Anthropic tokens and is anonymous by default so that
  // Discovery works signed-out. That is a deliberate product tradeoff, not an
  // oversight: an IP-rotating script can still run up the bill.
  //
  // Set REQUIRE_AUTH_FOR_SEARCH_SUGGESTIONS=1 to close it. Signed-out search
  // then returns 401 and the client falls back to catalog-only results — no
  // code change, no redeploy beyond the env var.
  if (/^(1|true)$/i.test(process.env.REQUIRE_AUTH_FOR_SEARCH_SUGGESTIONS || '')) {
    const { user, error: authError } = await verifyUser(req);
    if (!user) {
      return res.status(401).json({ error: authError || 'auth_required', suggestions: [] });
    }
  }

  const rl = await checkProductInsightsRateLimit(req);
  if (!rl.ok) {
    return res.status(429).json({
      error: 'rate_limited',
      retryAfterSec: rl.retryAfterSec ?? 60,
    });
  }

  const providerOrder = parseProviderOrder('AI_DISCOVERY_PROVIDER_ORDER', 'anthropic,openai,gemini');
  if (!providerOrder.some(providerConfigured)) {
    return res.status(503).json({
      error: 'no_ai_provider',
      message: 'Set ANTHROPIC_API_KEY or OPENAI_API_KEY in project environment variables.',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  const query = sanitizeStr(body?.query, 500);
  if (query.length < 2) {
    return res.status(400).json({ error: 'query_too_short' });
  }

  // Every other input here is sanitized (query 500 + quote-escaped,
  // profileSummary 400, dislikedProducts 300); these two got neither a cap nor
  // quote escaping, and land inside a quoted string in the prompt — on an
  // endpoint with no auth. Unbounded token sink and the cleanest injection point.
  const categoryHint = sanitizeStr(body?.category, 64).replace(/"/g, '');
  const symptomHint = sanitizeStr(body?.symptom, 64).replace(/"/g, '');
  const personalized = !!body?.personalized;
  const profileSummary = sanitizeStr(body?.profileSummary || '', 400);
  const dislikedProducts = sanitizeStr(body?.dislikedProducts || '', 300);
  // Raised from 20: trimming the per-suggestion schema below (shorter
  // summaries, fewer tags/search terms) freed up token budget for more
  // results without increasing typical generation time.
  const maxResults = typeof body?.maxResults === 'number' ? Math.min(Math.max(body.maxResults, 1), 25) : 25;

  // Catalog-only: no web search grounding — the model can't add products,
  // so outside search results would only invite fabricated names.
  const catalog = await loadGroundingCatalog();
  const catalogIndex = buildCatalogIndex(catalog);
  const promptCatalog = scopeCatalog(catalog, categoryHint);

  const rawJson = await callSuggestionsModel(buildPrompt(query, categoryHint, symptomHint, personalized, profileSummary, maxResults, dislikedProducts, promptCatalog));
  if (!rawJson) {
    return res.status(502).json({ error: 'claude_failed' });
  }

  // Tolerant parse (same helper _llm.js's callers use): strips stray code
  // fences, extracts a balanced JSON object out of surrounding prose, and
  // drops trailing commas — a naive JSON.parse rejected all of these even
  // when the model's actual suggestions were intact and usable.
  const parsed = tryParseJsonCandidate(rawJson);
  if (!parsed) {
    return res.status(502).json({ error: 'invalid_model_json' });
  }

  const list = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
  const seen = new Set();
  const suggestions = list
    .map((s) => normalizeSuggestion(s, catalogIndex))
    .filter(Boolean)
    .filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)))
    .slice(0, maxResults);
  const querySummary = normalizeQuerySummary(parsed?.querySummary);
  const relatedSearches = Array.isArray(parsed?.relatedSearches)
    ? parsed.relatedSearches.map((s) => sanitizeStr(s, 80)).filter((s) => s.length > 2).slice(0, 6)
    : [];

  return res.status(200).json({
    querySummary,
    relatedSearches,
    suggestions,
    generatedAt: new Date().toISOString(),
  });
}
