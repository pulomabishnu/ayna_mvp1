/**
 * Vercel serverless: when Discovery search has no catalog hits, Claude suggests real branded
 * products (retail names only — no model URLs). Ephemeral JSON, not persisted.
 */
/* global process */

import { checkProductInsightsRateLimit } from './rateLimitProductInsights.js';

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

  if (!name || name.length < 3 || !summary || summary.length < 25) return null;

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

function buildPrompt(query, categoryHint, symptomHint, personalized, profileSummary, maxResults) {
  const cat =
    categoryHint && categoryHint !== 'all'
      ? `User category filter: "${categoryHint}". Prefer products that fit this aisle when relevant.`
      : '';
  const sym =
    symptomHint && symptomHint !== 'all'
      ? `User filtered supplements by symptom theme: "${symptomHint}".`
      : '';
  const profileLine = personalized && profileSummary
    ? `User health profile: ${profileSummary}. Rank results by relevance to this specific user first.`
    : '';
  const countLine = personalized
    ? `Return the top ${maxResults} most relevant options for this specific user's profile.`
    : `Return the top ${maxResults} options available in the US market, ranked by relevance, reputation, and availability.`;
  const cats = [...ALLOWED_CATEGORIES].join(', ');
  return `You are the product-discovery layer for Ayna, a women's health app. Your job is to propose REAL, SHIPPABLE products and apps that best match the user's intent — specific brand names and product lines that a shopper could find at major US retailers or official brand/app stores. ${countLine}

User search: "${query.replace(/"/g, '\\"')}"
${cat}${sym ? '\n' + sym : ''}${profileLine ? '\n' + profileLine : ''}

Return ONE JSON object ONLY (no markdown) with up to 20 suggestions in this shape:
{
  "querySummary": "2-4 sentences: tie the user's words to the kinds of products below; name categories (e.g. pads, telehealth); where relevant, note that options in this category are consistent with guidance from ACOG, NIH, or FDA — for example 'Options like these are commonly discussed in ACOG guidance on menstrual health' or 'The NIH Office of Dietary Supplements has reviewed evidence for supplements in this category'. Never fabricate specific citation numbers or direct quotes. Always remind users to verify fit with a clinician when medical.",
  "relatedSearches": ["4-6 short search phrases the user might want to explore next, based on what they searched — e.g. if they searched 'iron supplements', suggest 'period cramp relief', 'PCOS and iron deficiency', 'telehealth for heavy periods', etc. Each phrase should be a natural search query a person would type, not a category label."],
  "suggestions": [
    {
      "brand": "Brand name",
      "name": "Product line or SKU name (include brand in name OR set brand separately)",
      "category": "slug from allowed list",
      "type": "physical" | "digital",
      "summary": "2-3 sentences: what it is, who it is for, how it helps — neutral, not medical advice",
      "priceHint": "e.g. ~$12-18 or Subscription ~$15/mo — approximate, no links",
      "tags": ["up to 6 short tags: heavy-flow", "organic", "app", ...],
      "whereToBuy": ["Amazon","Target","CVS","Walmart","Brand website","App Store","Google Play"] — retailer NAMES only, no URLs,
      "typicalUserRating": 4.2,
      "safetyNote": "one short line: e.g. consult clinician for prescriptions, patch tests for topicals",
      "searchTerms": ["2-4 web search phrases that include brand + product kind for Google"]
    }
  ]
}

PRODUCT SELECTION PROCESS:
1. Identify what the user is actually looking for based on their search query
2. Draw on your full knowledge of ALL brands that make relevant products — mainstream, indie, DTC, clinical, international brands available in the US market
3. Rank by: (a) clinical reputation and safety record, (b) relevance to the specific query, (c) availability, (d) community reputation
4. Suggest the most relevant and reputable options — not just the most popular ones. Small and indie brands are encouraged if reputable.

ANTI-HALLUCINATION RULES:
- Only suggest products from brands you are confident exist and sell in the US market
- Never invent brand names or product lines
- Never create fictional products, features, or services — even as placeholders
- NEVER suggest any product whose brand is "Ayna" — Ayna is the app the user is already in, not a product to recommend
- Never include URLs, domains, or "http" in any field — retailer names as plain text only
- typicalUserRating: optional number 3.0-5.0 only if you have real signal — omit if unsure
- If you cannot recall seeing a brand's product sold online at a major retailer or the brand's own website, do not include it — it likely does not exist
- If the query is not women's health or wellness shopping related, return {"querySummary":"","suggestions":[]}

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
      await new Promise((r) => setTimeout(r, 2000));
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
  return stripJsonFence(raw);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

  const categoryHint = typeof body?.category === 'string' ? body.category.trim() : '';
  const symptomHint = typeof body?.symptom === 'string' ? body.symptom.trim() : '';
  const personalized = !!body?.personalized;
  const profileSummary = sanitizeStr(body?.profileSummary || '', 400);
  const maxResults = typeof body?.maxResults === 'number' ? Math.min(Math.max(body.maxResults, 1), 20) : 20;

  const rawJson = await callClaudeJson(buildPrompt(query, categoryHint, symptomHint, personalized, profileSummary, maxResults));
  if (!rawJson) {
    return res.status(502).json({ error: 'claude_failed' });
  }

  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
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

  return res.status(200).json({
    querySummary,
    relatedSearches,
    suggestions,
    generatedAt: new Date().toISOString(),
  });
}
