/**
 * Vercel serverless: when Discovery search has no catalog hits, Claude suggests real branded
 * products. Suggestions that aren't already in the hardcoded catalog get
 * persisted to a shared Redis-backed "discovered products" store (see
 * persistNewDiscoveries below) so the same product isn't independently
 * re-discovered — and doesn't need re-generating — the next time any user
 * searches for it.
 */
/* global process */

import { checkProductInsightsRateLimit } from './_rateLimitProductInsights.js';
import { verifyUser } from './_usageLimit.js';
import { tryParseJsonCandidate, callWithFallback, parseProviderOrder, providerConfigured } from './_llm.js';
import { ALL_PRODUCTS } from '../src/data/products.js';

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

const ALLOWED_CATEGORIES = new Set([
  'pad',
  'tampon',
  'cup',
  'disc',
  'period-underwear',
  'supplement',
  'tracker',
  'telehealth',
  'mental-health',
  'fitness',
  'diagnostics',
  'hormone-monitoring',
  'menopause',
  'fertility',
  'pelvic-health',
  'pelvic-floor',
  'cramp-relief',
  'postpartum',
  'pregnancy',
  'sex-tech',
  'intimate-care',
  'contraception',
  'other',
]);

const DISCOVERED_PRODUCTS_KEY = 'ayna:discovered-products';

let redisPromise = null;
function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!redisPromise) {
    redisPromise = (async () => {
      const { Redis } = await import('@upstash/redis');
      return new Redis({ url, token });
    })();
  }
  return redisPromise;
}

// Dedup key: normalized product NAME only, not brand+name — brand is
// deliberately NOT part of the key so multiple distinct products from the
// same brand (e.g. "Always Radiant" and "Always Infinity") are never treated
// as duplicates of each other. AI-generated suggestions already fold the
// brand into `name` when it isn't already present (see buildDisplayName
// above), so name-only matching still catches true brand+product duplicates.
function normalizeProductKey(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Built once per cold start and reused across warm invocations — the catalog
// is static within a deployment, so there's no reason to re-normalize ~100+
// product names on every search request.
let hardcodedNameSet = null;
function getHardcodedNameSet() {
  if (!hardcodedNameSet) {
    hardcodedNameSet = new Set(
      ALL_PRODUCTS.map((p) => normalizeProductKey(p?.name)).filter(Boolean)
    );
  }
  return hardcodedNameSet;
}

/**
 * For each suggestion not already in the hardcoded catalog, checks the
 * shared Redis "discovered products" hash and persists it if it's genuinely
 * new — strict per-product dedup (by normalized name), while still allowing
 * any number of different products from the same brand. Best-effort: a
 * Redis outage degrades to "nothing persisted this request," never to a
 * failed search.
 */
async function persistNewDiscoveries(suggestions, query) {
  const redis = getRedis();
  if (!redis) return;
  const hardcoded = getHardcodedNameSet();
  const client = await redis;

  await Promise.all(
    suggestions.map(async (s) => {
      const key = normalizeProductKey(s.name);
      if (!key || hardcoded.has(key)) return;
      try {
        const alreadyDiscovered = await client.hexists(DISCOVERED_PRODUCTS_KEY, key);
        if (alreadyDiscovered) return;
        await client.hset(DISCOVERED_PRODUCTS_KEY, {
          [key]: JSON.stringify({
            name: s.name,
            brand: s.brand || '',
            category: s.category,
            url: s.url || '',
            firstSeenQuery: query,
            discoveredAt: Date.now(),
          }),
        });
      } catch (e) {
        console.error('[search-suggestions] discovery persist failed:', e?.message);
      }
    })
  );
}

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

// The model's product page URL is advisory, not verified — it can be wrong or
// hallucinated. This only rejects obviously-malformed values; the actual
// SSRF-safe fetch (with resolved-IP validation) happens downstream in
// api/product-image.js before anything derived from this URL is ever used.
function sanitizeOfficialUrl(s) {
  if (typeof s !== 'string') return '';
  const t = s.trim().slice(0, 300);
  if (!t) return '';
  let parsed;
  try {
    parsed = new URL(t);
  } catch {
    return '';
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
  if (parsed.username || parsed.password) return '';
  const host = parsed.hostname.toLowerCase();
  if (!host || host === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return '';
  return parsed.toString();
}

// ─── Live web search grounding ────────────────────────────────────────────
//
// Without this, a suggestion's existence rests entirely on the model's own
// training-data recall — "only suggest brands you're confident exist" below.
// That's the right anti-hallucination default, but it means a real, smaller,
// or newer brand the model just doesn't happen to recall confidently (found
// live: "Oboo", "Femigist" — both real, both returned zero suggestions,
// zero catalog matches) looks identical to a query for something that
// doesn't exist at all. Same technique api/llm-recommendations.js already
// uses for category-level discovery (searchProductsForConcerns), applied
// here to the exact typed query instead: real search results let the model
// confirm a specific product's existence instead of relying on recall alone,
// without loosening the actual fabrication rules — it still may only report
// what these results actually show.
async function searchWebForQuery(query) {
  const serperKey = process.env.SERPER_API_KEY;
  if (!serperKey) return null;
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: `${query} buy`, num: 8, gl: 'us' }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const hits = (data?.organic || [])
      .filter((h) => h.title && h.snippet)
      .slice(0, 6)
      .map((h) => ({ title: h.title, snippet: h.snippet.slice(0, 200), url: h.link || '' }));
    return hits.length ? hits : null;
  } catch {
    // Search failure is non-fatal — the prompt just falls back to
    // recall-only, i.e. today's behavior.
    return null;
  }
}

function formatSearchHitsForPrompt(hits) {
  if (!hits || !hits.length) return '';
  const lines = hits.map((h, i) => `${i + 1}. ${h.title} — ${h.snippet}${h.url ? ` (${h.url})` : ''}`);
  return `\n\nLIVE WEB SEARCH RESULTS for this exact query (real, current — use these to confirm a specific product actually exists, especially for a smaller or newer brand you would not otherwise be fully confident naming from memory alone). Only report what these results actually show — a brand or product name that doesn't appear here and that you're not independently confident about is still not something to include:\n${lines.join('\n')}`;
}

function clampTypicalRating(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  const r = Math.round(x * 10) / 10;
  if (r < 3 || r > 5) return null;
  return r;
}

function uniqueStrings(arr, max, maxLen) {
  const seen = new Set();
  const out = [];
  for (const x of Array.isArray(arr) ? arr : []) {
    const s = sanitizeStr(String(x), maxLen);
    if (s.length < 2) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

/** Retailer labels only (no URLs). */
function sanitizeRetailers(arr, max) {
  const out = [];
  const seen = new Set();
  for (const x of Array.isArray(arr) ? arr : []) {
    const s = sanitizeStr(String(x), 48);
    if (s.length < 2 || hasUrlLike(s)) continue;
    if (!/^[a-zA-Z0-9 &.'+\-]{2,48}$/.test(s)) continue;
    const low = s.toLowerCase();
    if (seen.has(low)) continue;
    seen.add(low);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

function buildDisplayName(brand, name) {
  const b = sanitizeStr(brand, 80);
  const n = sanitizeStr(name, 130);
  if (!n) return '';
  if (!b) return n;
  if (n.toLowerCase().includes(b.toLowerCase())) return n;
  return `${b} ${n}`.trim().slice(0, 140);
}

function normalizeSuggestion(raw, index) {
  const brandRaw = sanitizeStr(raw?.brand, 80);
  const name = buildDisplayName(brandRaw, raw?.name || raw?.productName);
  const summary = sanitizeStr(raw?.summary, 900);
  const priceHint = sanitizeStr(raw?.priceHint || raw?.price || 'See retailer', 80);
  const safetyNote = sanitizeStr(raw?.safetyNote, 400);
  let category = sanitizeStr(raw?.category, 64).toLowerCase().replace(/\s+/g, '-');
  if (!ALLOWED_CATEGORIES.has(category)) category = 'other';
  const type = String(raw?.type || 'physical').toLowerCase() === 'digital' ? 'digital' : 'physical';
  const tags = uniqueStrings(raw?.tags, 8, 48);
  // Capped at 3 to match ProductModal.jsx, which only ever renders
  // whereToBuy.slice(0, 3) — asking the model for more than the UI shows
  // wastes output tokens (and thus latency) for no visible benefit.
  const whereToBuy = sanitizeRetailers(raw?.whereToBuy || raw?.retailers, 3);
  const searchTerms = uniqueStrings(raw?.searchTerms, 6, 100);
  const typical = clampTypicalRating(raw?.typicalUserRating ?? raw?.estimatedRating);
  const officialUrl = sanitizeOfficialUrl(raw?.officialUrl);

  if (!name || name.length < 3 || !summary || summary.length < 25) return null;

  // The prompt already says never to suggest a prescription drug, but that's
  // advisory — same gap fixed with a code-level backstop in
  // api/llm-recommendations.js (PRESCRIPTION_DRUG_PATTERN there). Telehealth
  // platforms are exempt: their whole purpose is connecting someone to a
  // prescriber, so their summary legitimately names what they treat/prescribe.
  if (category !== 'telehealth' && PRESCRIPTION_DRUG_PATTERN.test(`${brandRaw} ${name} ${summary}`)) return null;

  const id = `gen-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    brand: brandRaw || undefined,
    name,
    category,
    type,
    summary,
    price: priceHint || 'See retailer',
    safetyNote:
      safetyNote ||
      'Educational information only. Check labels, availability, and pricing with retailers. Ask your clinician before changing care.',
    searchTerms: searchTerms.length ? searchTerms : [name],
    whereToBuy: whereToBuy.length ? whereToBuy : ['Amazon', 'Target', 'Google'],
    url: officialUrl || undefined,
    tags,
    llmGenerated: true,
    aiEstimatedRating: typical != null,
    userRating: typical != null ? typical : undefined,
    ratingNote: typical != null ? undefined : 'Not in Ayna database — no verified rating',
    badges: uniqueStrings(raw?.badges, 2, 32),
    image: '/ayna_placeholder.png',
  };
}

function normalizeQuerySummary(s) {
  const t = sanitizeStr(s, 700);
  return t.length >= 20 ? t : '';
}

function buildPrompt(query, categoryHint, symptomHint, personalized, profileSummary, maxResults, dislikedProducts, searchHits) {
  const cat =
    categoryHint && categoryHint !== 'all'
      ? `User category filter: "${categoryHint}". Prefer products that fit this aisle when relevant.`
      : '';
  const sym =
    symptomHint && symptomHint !== 'all'
      ? `User filtered supplements by symptom theme: "${symptomHint}".`
      : '';
  const profileLine = personalized && profileSummary
    ? `User health profile: ${profileSummary}. Use this to rank which products within the searched category are most relevant — do NOT use it to recommend products from a different category.`
    : '';
  const dislikedLine = dislikedProducts
    ? `The user has tried and disliked these products — do NOT include them: ${dislikedProducts}`
    : '';
  const countLine = personalized
    ? `Return the top ${maxResults} most relevant options for this specific user's profile.`
    : `Return the top ${maxResults} options available in the US market, ranked by relevance, reputation, and availability.`;
  const cats = [...ALLOWED_CATEGORIES].join(', ');
  return `You are the product-discovery layer for Ayna, a women's health app. Propose REAL, SHIPPABLE products/apps — specific brand names and product lines a shopper could find at major US retailers or official brand/app stores. The search query defines the product TYPE to return (e.g. "iron supplements" → only iron supplements, never trackers/apps/period care, no matter what the profile says); the user profile below, if given, may only re-rank WITHIN that type — never switch category. ${countLine}

User search: "${query.replace(/"/g, '\\"')}"
${cat}${sym ? '\n' + sym : ''}${profileLine ? '\n' + profileLine : ''}${dislikedLine ? '\n' + dislikedLine : ''}${formatSearchHitsForPrompt(searchHits)}

Return ONE JSON object ONLY (no markdown) with up to ${maxResults} suggestions in this shape. Keep every field as brief as the guidance below allows — concise output is faster to generate and lets more suggestions fit in the response:
{
  "querySummary": "1-2 sentences: tie the user's words to the kinds of products below; name categories (e.g. pads, telehealth). Where genuinely applicable, briefly cite ACOG (menstrual/PCOS/endo/menopause/fertility/contraception/UTI/pelvic floor), NIH ODS (supplements), FDA (device/product safety), or Cochrane (evidence quality) by name for credibility — only when confident their guidance actually covers this topic, and never fabricate a specific guideline number, PMID, or direct quote. Remind users to verify fit with a clinician when medical.",
  "relatedSearches": ["3-4 short natural search phrases the user might try next based on this search — real queries a person would type, not category labels"],
  "suggestions": [
    {
      "brand": "Brand name",
      "name": "Product line or SKU name (include brand in name OR set brand separately)",
      "category": "one slug from: ${cats}",
      "type": "physical" | "digital",
      "summary": "1-2 sentences: what it is, who it is for, how it helps — neutral, not medical advice",
      "priceHint": "A hedged price RANGE only, e.g. ~$12-18 or Subscription ~$15/mo — never a single exact price. Attach a pack/count size (e.g. '14-16 pads') only if you're confident that's genuinely this brand's real configuration — a wrong invented count is worse than none; if unsure of quantity, give price alone.",
      "tags": ["up to 4 short tags: heavy-flow", "organic", "app", ...],
      "whereToBuy": ["up to 3 retailer NAMES only, no URLs — e.g. Amazon, Target, Brand website, App Store"],
      "officialUrl": "THIS SPECIFIC PRODUCT's own page on the brand's official site (e.g. https://brand.com/products/this-exact-product) — NOT the homepage/root domain, which is useless for fetching a product photo. If one of the live web search results above is clearly this exact product's own page, use that URL. Otherwise only include it if you're independently confident of the real product-page URL; omit entirely rather than guess or fall back to the homepage. The one exception to the no-URLs rule below.",
      "typicalUserRating": 4.2,
      "safetyNote": "one short line: e.g. consult clinician for prescriptions, patch tests for topicals",
      "searchTerms": ["1-2 web search phrases that include brand + product kind for Google"]
    }
  ]
}

RULES (apply to every suggestion):
- Draw on your full knowledge of relevant brands — mainstream, indie, DTC, clinical, international — sold in the US. Rank by: relevance to the query, clinical reputation/safety record, availability, community reputation.
- Only suggest brands/products you are confident genuinely exist and sell in the US market. Never invent a brand name, product line, feature, or service — even as a placeholder. Confidence can come from either your own knowledge OR the live web search results above (a smaller/newer real brand you wouldn't otherwise recall confidently is fine to include if those results clearly confirm it) — but never extrapolate a name, price, or count beyond what the search results actually show, and if neither source supports it, leave it out — it likely doesn't exist.
- Same standard applies to pack sizes/counts as to brand names: state a specific count (e.g. "60 capsules") only if you're confident that's the real configuration for this brand+product — an invented-but-plausible count is a fabrication just like an invented brand, and it's more deceptive because it looks precise. When unsure, give a price range with no count attached.
- NEVER suggest any product whose brand is "Ayna" — that's the app the user is already in, not a product to recommend
- Never include URLs, domains, or "http" in any field except officialUrl (retailer names as plain text only); for officialUrl, only include it if you're confident it's the real current URL, else omit rather than guess
- typicalUserRating: optional 3.0-5.0 only with real signal — omit if unsure
- If the query is not women's health/wellness shopping related, return {"querySummary":"","suggestions":[]}
- NEVER suggest a prescription medication as a product — this includes hormonal birth control (pills, patches, rings, IUDs, implants), hormone replacement therapy, prescription antidepressants/anxiolytics, prescription antibiotics, and prescription weight-loss drugs (GLP-1s), even if the search names the condition it treats. For a query about something that requires a prescription (e.g. "birth control pills", "UTI antibiotics"), suggest telehealth platforms/services that can prescribe it instead of naming the drug itself.`;
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
        "Return a single valid JSON object only. No markdown fences. You must not output URLs or http(s) in any field. Real brand and product names only. Educational women's health context; never diagnose.",
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

  // Grounds the exact typed query in a real, current web search before
  // asking the model to generate — see searchWebForQuery's own comment for
  // why. A missing/failing search key degrades to today's recall-only
  // behavior (formatSearchHitsForPrompt returns '' for null hits), never to
  // a failed search.
  const searchHits = await searchWebForQuery(query);

  const rawJson = await callSuggestionsModel(buildPrompt(query, categoryHint, symptomHint, personalized, profileSummary, maxResults, dislikedProducts, searchHits));
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
  const suggestions = list
    .map((s, i) => normalizeSuggestion(s, i))
    .filter(Boolean)
    .filter((s) => !/\bayna\b/i.test(s.brand || '') && !/\bayna\b/i.test(s.name || ''))
    .slice(0, maxResults);
  const querySummary = normalizeQuerySummary(parsed?.querySummary);
  const relatedSearches = Array.isArray(parsed?.relatedSearches)
    ? parsed.relatedSearches.map((s) => sanitizeStr(s, 80)).filter((s) => s.length > 2).slice(0, 6)
    : [];

  await persistNewDiscoveries(suggestions, query);

  return res.status(200).json({
    querySummary,
    relatedSearches,
    suggestions,
    generatedAt: new Date().toISOString(),
  });
}
