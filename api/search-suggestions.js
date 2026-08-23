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
import { tryParseJsonCandidate } from './_llm.js';
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

function getAnthropicApiKey() {
  return (process.env.ANTHROPIC_API_KEY || '').trim() || null;
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

function stripJsonFence(raw) {
  let t = String(raw || '').trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '');
    const last = t.lastIndexOf('```');
    if (last >= 0) t = t.slice(0, last);
  }
  return t.trim();
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
  const whereToBuy = sanitizeRetailers(raw?.whereToBuy || raw?.retailers, 6);
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

function buildPrompt(query, categoryHint, symptomHint, personalized, profileSummary, maxResults, dislikedProducts) {
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
  return `You are the product-discovery layer for Ayna, a women's health app. Your job is to propose REAL, SHIPPABLE products and apps that best match the user's intent — specific brand names and product lines that a shopper could find at major US retailers or official brand/app stores. ${countLine}

User search: "${query.replace(/"/g, '\\"')}"
${cat}${sym ? '\n' + sym : ''}${profileLine ? '\n' + profileLine : ''}${dislikedLine ? '\n' + dislikedLine : ''}

Return ONE JSON object ONLY (no markdown) with up to ${maxResults} suggestions in this shape. Keep every field as brief as the guidance below allows — concise output is faster to generate and lets more suggestions fit in the response:
{
  "querySummary": "1-2 sentences: tie the user's words to the kinds of products below; name categories (e.g. pads, telehealth); where genuinely relevant, note briefly that options in this category are consistent with guidance from ACOG, NIH, or FDA. Never fabricate specific citation numbers or direct quotes. Remind users to verify fit with a clinician when medical.",
  "relatedSearches": ["3-4 short search phrases the user might want to explore next, based on what they searched — e.g. if they searched 'iron supplements', suggest 'period cramp relief', 'PCOS and iron deficiency', 'telehealth for heavy periods', etc. Each phrase should be a natural search query a person would type, not a category label."],
  "suggestions": [
    {
      "brand": "Brand name",
      "name": "Product line or SKU name (include brand in name OR set brand separately)",
      "category": "slug from allowed list",
      "type": "physical" | "digital",
      "summary": "1-2 sentences: what it is, who it is for, how it helps — neutral, not medical advice",
      "priceHint": "A hedged price RANGE only, e.g. ~$12-18 or Subscription ~$15/mo. Do NOT state a single exact price as if it's confirmed, and do NOT attach a specific pack/count size (e.g. '14-16 pads', 'box of 20') unless you are confident that exact configuration is genuinely sold by this brand — a wrong invented count is worse than no count. If unsure of quantity, describe price alone (e.g. '~$15-20 per pack') rather than inventing a plausible-sounding number.",
      "tags": ["up to 4 short tags: heavy-flow", "organic", "app", ...],
      "whereToBuy": ["Amazon","Target","CVS","Walmart","Brand website","App Store","Google Play"] — retailer NAMES only, no URLs,
      "officialUrl": "the exact URL of THIS SPECIFIC PRODUCT'S page on the brand's own official site — e.g. https://brand.com/products/this-exact-product, NOT the brand's homepage or root domain. This is used to fetch a real photo of the product, so a homepage/root-domain URL is useless here even if it's correct — only include it if you're confident of the actual product page URL. Omit this field entirely rather than guess or fall back to the homepage. This is the one exception to the no-URLs rule below.",
      "typicalUserRating": 4.2,
      "safetyNote": "one short line: e.g. consult clinician for prescriptions, patch tests for topicals",
      "searchTerms": ["1-2 web search phrases that include brand + product kind for Google"]
    }
  ]
}

PRODUCT SELECTION PROCESS:
1. Identify what the user is actually looking for based on their search query — the query defines what TYPE of product to return
2. Every suggestion must be a product of the type described in the search query. If the user searches "iron supplements", return only iron supplements — not cycle trackers, apps, period care products, or anything else, no matter what their health profile says
3. User profile context (concerns, conditions) should only influence WHICH products within that category are most relevant — it must never cause you to recommend a different category entirely
4. Draw on your full knowledge of ALL brands that make relevant products — mainstream, indie, DTC, clinical, international brands available in the US market
5. Rank by: (a) direct relevance to the search query, (b) clinical reputation and safety record, (c) availability, (d) community reputation

ANTI-HALLUCINATION RULES:
- Only suggest products from brands you are confident exist and sell in the US market
- Never invent brand names or product lines
- Never create fictional products, features, or services — even as placeholders
- NEVER suggest any product whose brand is "Ayna" — Ayna is the app the user is already in, not a product to recommend
- Never include URLs, domains, or "http" in any field except officialUrl — retailer names as plain text only. For officialUrl specifically, only include it if you're confident it's the real current URL; when unsure, omit the field rather than guess
- typicalUserRating: optional number 3.0-5.0 only if you have real signal — omit if unsure
- If you cannot recall seeing a brand's product sold online at a major retailer or the brand's own website, do not include it — it likely does not exist
- Same rule applies to pack sizes and counts as to brand names: only state a specific count/pack size (e.g. "14 pads", "60 capsules") if you are confident that exact configuration is genuinely sold by this brand+product. A precise-sounding but invented count (e.g. inventing "14-16 pads" for a brand that actually sells 30-count boxes) is a fabrication just like an invented brand name — it just looks more trustworthy because it's a specific number. When unsure of the real pack size, give price as a range with no count attached rather than guessing one.
- If the query is not women's health or wellness shopping related, return {"querySummary":"","suggestions":[]}
- NEVER suggest a prescription medication as a product — this includes hormonal birth control (pills, patches, rings, IUDs, implants), hormone replacement therapy, prescription antidepressants/anxiolytics, prescription antibiotics, and prescription weight-loss drugs (GLP-1s), even if the user's search names the condition it treats. If the query is asking about something that requires a prescription (e.g. "birth control pills", "UTI antibiotics"), suggest telehealth platforms/services that can prescribe it instead of naming the drug itself.

CLINICAL AUTHORITY RULES:
- In querySummary only, where genuinely applicable, reference ACOG, NIH ODS, FDA, or Cochrane by name to add clinical credibility
- Reference ACOG for: menstrual health, PCOS, endometriosis, menopause, fertility, contraception, UTIs, pelvic floor
- Reference NIH ODS for: any supplement category
- Reference FDA for: device safety, period care product regulatory standing
- Reference Cochrane for: evidence quality on supplements or devices
- Never fabricate specific guideline numbers, bulletin numbers, PMIDs, or direct quotes
- Only reference an organization when confident their guidance genuinely covers the query topic`;
}

async function callClaudeJson(prompt, attempt = 0) {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) return null;

  const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
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
      max_tokens: 8192,
      temperature: 0.2,
      system:
        "Return a single valid JSON object only. No markdown fences. You must not output URLs or http(s) in any field. Real brand and product names only. Educational women's health context; never diagnose.",
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('search-suggestions Claude HTTP', res.status, errText.slice(0, 300));
    // Retry once on 429 (rate limit) or 529 (overloaded) after a short wait
    if (attempt === 0 && (res.status === 429 || res.status === 529)) {
      // Shortened: this is billed wall-clock inside the function budget, not
      // free waiting. Long backoff belongs on the client, not here.
      await new Promise((r) => setTimeout(r, 600));
      return callClaudeJson(prompt, 1);
    }
    return null;
  }
  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }
  const raw = data?.content?.[0]?.text;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  if (data?.stop_reason === 'max_tokens') {
    // Truncated output can't be recovered after the fact — this is here so a
    // future max_tokens regression shows up as a clear log line instead of a
    // bare invalid_model_json with no indication of why.
    console.warn('search-suggestions: Claude hit max_tokens; response is truncated and will likely fail to parse');
  }
  return stripJsonFence(raw);
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

  if (!getAnthropicApiKey()) {
    return res.status(503).json({
      error: 'no_anthropic_key',
      message: 'Set ANTHROPIC_API_KEY in project environment variables.',
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

  const rawJson = await callClaudeJson(buildPrompt(query, categoryHint, symptomHint, personalized, profileSummary, maxResults, dislikedProducts));
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
