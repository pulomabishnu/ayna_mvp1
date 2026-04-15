/* global process */
import { ALL_PRODUCTS } from '../src/data/products.js';
import { generateTieredRecommendations } from '../src/utils/recommendationEngine.js';

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  ).trim() || null;
}

function anyApiKeyConfigured() {
  return !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || getGeminiApiKey());
}

function selectedConcerns(intake = {}) {
  if (Array.isArray(intake.primaryConcerns) && intake.primaryConcerns.length) return intake.primaryConcerns;
  if (intake.primaryConcern) return [intake.primaryConcern];
  return [];
}

function concernTags(concernKey = '') {
  const key = String(concernKey).toLowerCase();
  const tags = new Set();
  if (/period|flow|leak|pad|tampon|cup|disc|underwear/.test(key)) tags.add('heavy-flow'), tags.add('leaks');
  if (/cramp|pain/.test(key)) tags.add('cramps');
  if (/pcos|hormone/.test(key)) tags.add('pcos');
  if (/endo/.test(key)) tags.add('endometriosis');
  if (/fertility|conceiv|ttc/.test(key)) tags.add('fertility');
  if (/uti|vaginal|ph/.test(key)) tags.add('uti');
  if (/menopause|perimenopause/.test(key)) tags.add('menopause');
  if (/sexual|pelvic/.test(key)) tags.add('pelvic-floor');
  if (/mental|mood|sleep|energy/.test(key)) tags.add('comfort');
  if (/telehealth|provider/.test(key)) tags.add('uti'), tags.add('pcos'), tags.add('endometriosis'), tags.add('fertility');
  return [...tags];
}

function isSupplementProduct(product) {
  const category = String(product?.category || '').toLowerCase();
  const tags = (product?.tags || []).map((t) => String(t || '').toLowerCase());
  return category.includes('supplement') || category.includes('vitamin') || category.includes('wellness') || tags.includes('supplement');
}

function isDigitalOrTelehealthProduct(product) {
  const type = String(product?.type || 'physical').toLowerCase();
  const category = String(product?.category || '').toLowerCase();
  return type === 'digital' || category.includes('telehealth') || category.includes('app') || category.includes('tracker');
}

function isTierMatch(product, tierName = '', tierIndex = 0) {
  const name = String(tierName || '').toLowerCase();
  const expectsPhysical = tierIndex === 0 || name.includes('physical');
  const expectsSupplement = tierIndex === 1 || name.includes('supplement') || name.includes('wellness');
  const expectsDigital = tierIndex === 2 || name.includes('digital') || name.includes('telehealth');

  if (expectsPhysical) return String(product?.type || 'physical').toLowerCase() === 'physical' && !isSupplementProduct(product);
  if (expectsSupplement) return isSupplementProduct(product);
  if (expectsDigital) return isDigitalOrTelehealthProduct(product);
  return true;
}

function isConcernMatch(product, concernKey = '') {
  const tags = product?.tags || [];
  const expected = concernTags(concernKey);
  if (!expected.length) return true;
  return expected.some((t) => tags.includes(t));
}

function shortlistCandidates(intake = {}) {
  const concerns = selectedConcerns(intake);
  const concernDriven = concerns.length
    ? ALL_PRODUCTS.filter((p) => concerns.some((c) => concernTags(c).some((t) => (p.tags || []).includes(t))))
    : [];

  const fallbackTiered = generateTieredRecommendations(intake);
  const fallbackProducts = fallbackTiered.flatMap((entry) =>
    entry.tiers.flatMap((tier) => [tier.product, ...(Array.isArray(tier.alternatives) ? tier.alternatives : [])])
  );

  const map = new Map();
  [...concernDriven, ...fallbackProducts, ...ALL_PRODUCTS.slice(0, 140)].forEach((p) => {
    if (!p?.id || map.has(p.id)) return;
    map.set(p.id, p);
  });
  return [...map.values()].slice(0, 180);
}

function productLite(p) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    type: p.type || 'physical',
    tags: Array.isArray(p.tags) ? p.tags.slice(0, 12) : [],
    clinicianOpinionSource: p.clinicianOpinionSource || '',
    clinicianAttribution: p.clinicianAttribution || '',
    safety: {
      recalls: p?.safety?.recalls || '',
      materials: p?.safety?.materials || '',
      sideEffects: p?.safety?.sideEffects || '',
      opinionAlerts: p?.safety?.opinionAlerts || '',
    },
    summary: p.summary || '',
  };
}

function buildPrompt(intake = {}, feedback = {}, candidates = []) {
  const concerns = selectedConcerns(intake);
  const cycle = `menstrualCycle=${intake?.menstrualCycle || 'unknown'}, cycleLength=${intake?.averageCycleLength || 'unknown'}, periodLength=${intake?.averagePeriodLength || 'unknown'}`;
  return `
You are generating recommendations for Ayna, a women's health app.

USER PROFILE:
- Age: ${intake?.age || 'unknown'}
- Location: ${intake?.location || 'unknown'}
- Concerns: ${concerns.join(', ') || 'none provided'}
- Custom concerns: ${(Array.isArray(intake?.customConcerns) ? intake.customConcerns : []).join(', ') || 'none'}
- Conditions: ${(Array.isArray(intake?.conditions) ? intake.conditions : []).join(', ') || 'none'}
- Cycle: ${cycle}
- Flow level: ${intake?.flowLevel || 'unknown'}
- Pain level: ${intake?.painLevel || 'unknown'}/10
- Symptoms: ${(Array.isArray(intake?.symptoms) ? intake.symptoms : []).join(', ') || 'none'}
- Product preferences: ${(Array.isArray(intake?.productPreferences) ? intake.productPreferences : []).join(', ') || 'none'}
- Preferred product types: ${(Array.isArray(intake?.preferredProductTypes) ? intake.preferredProductTypes : []).join(', ') || 'none'}
- Current products: ${(Array.isArray(intake?.currentProducts) ? intake.currentProducts : []).join(', ') || 'none'}
- Tried and disliked: ${(Array.isArray(intake?.dislikedProducts) ? intake.dislikedProducts : []).join(', ') || 'none'}; reason=${intake?.dislikedReason || 'none'}
- Goals: ${(Array.isArray(intake?.goals) ? intake.goals : []).join(', ') || 'none'}

LEARNING SIGNALS (use these to get better over time for this user):
- Tracked/liked product IDs: ${(feedback?.trackedProductIds || []).join(', ') || 'none'}
- In ecosystem product IDs: ${(feedback?.ecosystemProductIds || []).join(', ') || 'none'}
- Hidden product IDs: ${(feedback?.omittedProductIds || []).join(', ') || 'none'}
- Persistent learning memory (cross-session): ${JSON.stringify(feedback?.learningMemory || {})}

AVAILABLE CANDIDATES (you MUST only use these IDs):
${JSON.stringify(candidates.map(productLite))}

TASK:
Return a SINGLE JSON object:
{
  "recommendations": [
    {
      "concern": "string concern label",
      "tiers": [
        { "name": "TIER 1 - IMMEDIATE PHYSICAL PRODUCT", "topProductId": "id", "alternativeProductIds": ["id1","id2","id3"] },
        { "name": "TIER 2 - SUPPLEMENT OR WELLNESS PRODUCT", "topProductId": "id", "alternativeProductIds": ["id1","id2","id3"] },
        { "name": "TIER 3 - DIGITAL OR TELEHEALTH OPTION", "topProductId": "id", "alternativeProductIds": ["id1","id2","id3"] }
      ],
      "notes": ["optional note"]
    }
  ]
}

RULES:
- Only include relevant concerns; do not invent unrelated categories.
- Do not assume heavy flow, cramps, or high pain unless explicitly present in profile.
- Never use products user disliked.
- Never use products with recall warnings.
- Favor independent clinician-verified products when possible.
- For each tier: 1 top product + up to 3 alternatives.
- Never output markdown.
  `.trim();
}

function safeParse(raw) {
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeOutput(parsed, byId, intake) {
  const out = [];
  const allowedConcerns = new Set(generateTieredRecommendations(intake).map((x) => x.concern));
  const source = Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];
  source.forEach((entry) => {
    const concern = String(entry?.concern || '').trim();
    if (!concern) return;
    if (allowedConcerns.size > 0 && !allowedConcerns.has(concern)) return;
    const tiers = [];
    (Array.isArray(entry?.tiers) ? entry.tiers : []).forEach((t, idx) => {
      const top = byId.get(String(t?.topProductId || ''));
      if (!top) return;
      if (!isConcernMatch(top, concern)) return;
      if (!isTierMatch(top, t?.name, idx)) return;
      const altIds = Array.isArray(t?.alternativeProductIds) ? t.alternativeProductIds : [];
      const alt = altIds
        .map((id) => byId.get(String(id)))
        .filter(Boolean)
        .filter((p) => p.id !== top.id)
        .filter((p) => isConcernMatch(p, concern))
        .filter((p) => isTierMatch(p, t?.name, idx))
        .slice(0, 3);
      tiers.push({
        name: String(t?.name || '').trim() || 'Tier',
        product: top,
        safetyFlags: [],
        alternatives: alt,
      });
    });
    if (!tiers.length) return;
    out.push({ concern, tiers, notes: Array.isArray(entry?.notes) ? entry.notes.slice(0, 3) : [] });
  });
  if (out.length) return out;
  return generateTieredRecommendations(intake);
}

async function callOpenAI(prompt) {
  if (!process.env.OPENAI_API_KEY) return null;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Output valid JSON only.' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || null;
}

async function callAnthropic(prompt) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      temperature: 0.2,
      system: 'Return a single valid JSON object only.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.content?.[0]?.text || null;
}

async function callGemini(prompt) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json', maxOutputTokens: 1200 },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

async function generateWithProviders(prompt) {
  const order = (process.env.AI_RECOMMENDATIONS_PROVIDER_ORDER || 'openai,anthropic,gemini')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  for (const provider of order) {
    let raw = null;
    if (provider === 'openai') raw = await callOpenAI(prompt);
    else if (provider === 'anthropic' || provider === 'claude') raw = await callAnthropic(prompt);
    else if (provider === 'gemini' || provider === 'google') raw = await callGemini(prompt);
    if (raw) return { raw, provider };
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!anyApiKeyConfigured()) {
    return res.status(503).json({
      error: 'not_configured',
      message: 'No LLM API key found. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY.',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }
  const intake = body?.intake || {};
  const feedback = body?.feedback || {};
  if (!intake || typeof intake !== 'object') {
    return res.status(400).json({ error: 'missing_intake' });
  }

  const candidates = shortlistCandidates(intake);
  const byId = new Map(candidates.map((p) => [p.id, p]));
  const prompt = buildPrompt(intake, feedback, candidates);
  const ai = await generateWithProviders(prompt);

  if (!ai?.raw) {
    return res.status(200).json({
      recommendations: generateTieredRecommendations(intake),
      providerUsed: 'rule_based_fallback',
    });
  }

  const parsed = safeParse(ai.raw);
  const normalized = normalizeOutput(parsed, byId, intake);
  return res.status(200).json({
    recommendations: normalized,
    providerUsed: ai.provider,
    generatedAt: new Date().toISOString(),
  });
}
