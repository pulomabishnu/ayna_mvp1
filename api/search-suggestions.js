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

function buildPrompt(query, categoryHint, symptomHint) {
  const cat =
    categoryHint && categoryHint !== 'all'
      ? `User category filter: "${categoryHint}". Prefer products that fit this aisle when relevant.`
      : '';
  const sym =
    symptomHint && symptomHint !== 'all'
      ? `User filtered supplements by symptom theme: "${symptomHint}".`
      : '';
  const cats = [...ALLOWED_CATEGORIES].join(', ');
  return `You are the product-discovery layer for Ayna, a women's health app. The catalog search returned no rows; your job is to propose REAL, SHIPPABLE products and apps that best match the user's intent — specific brand names and product lines that a shopper could find at major US retailers or official brand/app stores.

User search: "${query.replace(/"/g, '\\"')}"
${cat}
${sym}

Return ONE JSON object ONLY (no markdown) with this shape:
{
  "querySummary": "2-4 sentences: tie the user's words to the kinds of products below; name categories (e.g. pads, telehealth); remind that Ayna is surfacing common options and they should verify fit with a clinician when medical.",
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

Rules:
- Suggest 6 to 10 DISTINCT real branded products or well-known apps, ranked most relevant first.
- Use brands and products that actually exist in the US market (or global apps). Do not invent fake companies.
- category must be one of: ${cats}
- Never include URLs, domains as links, or "http" in any string. Retailers are plain words only.
- typicalUserRating: optional number 3.0-5.0 (one decimal) as a rough community-average style estimate — not a medical claim.
- If the query is not women's health / wellness shopping related, return {"querySummary":"","suggestions":[]} .`;
}

async function callClaudeJson(prompt) {
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
    console.error('search-suggestions Claude', res.status, errText.slice(0, 400));
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

  const rawJson = await callClaudeJson(buildPrompt(query, categoryHint, symptomHint));
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
  const suggestions = list.map((s, i) => normalizeSuggestion(s, i)).filter(Boolean).slice(0, 10);
  const querySummary = normalizeQuerySummary(parsed?.querySummary);

  return res.status(200).json({
    querySummary,
    suggestions,
    generatedAt: new Date().toISOString(),
  });
}
