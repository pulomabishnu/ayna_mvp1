/**
 * Vercel serverless: when Discovery search has no catalog hits, suggest product ideas via Claude (Anthropic).
 * Ephemeral JSON only — not persisted. No model-supplied URLs (we build search links client-side).
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

function normalizeSuggestion(raw, index) {
  const name = sanitizeStr(raw?.name, 120);
  const summary = sanitizeStr(raw?.summary, 900);
  const priceHint = sanitizeStr(raw?.priceHint || raw?.price || 'Varies', 80);
  const safetyNote = sanitizeStr(raw?.safetyNote, 400);
  let category = sanitizeStr(raw?.category, 64).toLowerCase().replace(/\s+/g, '-');
  if (!ALLOWED_CATEGORIES.has(category)) category = 'other';
  const type = String(raw?.type || 'physical').toLowerCase() === 'digital' ? 'digital' : 'physical';
  const searchTerms = uniqueStrings(raw?.searchTerms, 6, 80);

  if (!name || name.length < 2 || !summary || summary.length < 20) return null;

  const id = `gen-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    name,
    category,
    type,
    summary,
    price: priceHint || 'Varies',
    safetyNote: safetyNote || 'This is general information only. Ask your clinician before trying new treatments or supplements.',
    searchTerms: searchTerms.length ? searchTerms : [name],
    llmGenerated: true,
    ratingNote: 'AI suggestion — not in Ayna catalog',
    tags: [],
    image: '/ayna_placeholder.png',
  };
}

function uniqueStrings(arr, max, maxLen) {
  const seen = new Set();
  const out = [];
  for (const x of Array.isArray(arr) ? arr : []) {
    const s = sanitizeStr(String(x), maxLen);
    if (s.length < 3) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

function buildPrompt(query, categoryHint, symptomHint) {
  const cat =
    categoryHint && categoryHint !== 'all'
      ? `User has category filter: "${categoryHint}". Prefer suggestions in or near this category when it fits the query.`
      : '';
  const sym =
    symptomHint && symptomHint !== 'all'
      ? `User filtered supplements by symptom theme: "${symptomHint}".`
      : '';
  return `You help with women's health product discovery for the app Ayna.

User search query: "${query.replace(/"/g, '\\"')}"
${cat}
${sym}

Return a single JSON object ONLY (no markdown) with this exact shape:
{"suggestions":[{"name":"string","category":"one of the allowed slugs","type":"physical"|"digital","summary":"2-4 sentences, educational, no brand endorsement","priceHint":"short string like \\"Varies\\" or \\"~$15–40\\" — never a URL","safetyNote":"one sentence: consult a clinician when relevant","searchTerms":["2-5 short generic search phrases for web shopping — no URLs, no http"]}]}

Rules:
- Suggest 3 to 5 items that could plausibly match what the user is looking for.
- Use generic product types (e.g. "overnight organic pads", "period tracking app") — do not claim a specific commercial product exists or is safe/effective.
- category must be one of: ${[...ALLOWED_CATEGORIES].join(', ')}
- Never include URLs, links, or "http" in any field.
- If the query is not health-related, return {"suggestions":[]} .`;
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
      max_tokens: 2000,
      temperature: 0.35,
      system:
        "Return a single valid JSON object only. No markdown code fences unless the JSON is the only content. No URLs or http in any string. Educational women's health assistant.",
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
  const suggestions = list.map((s, i) => normalizeSuggestion(s, i)).filter(Boolean).slice(0, 6);

  return res.status(200).json({
    suggestions,
    generatedAt: new Date().toISOString(),
  });
}
