/**
 * Vercel serverless: AI summaries + server-built search links only (no model-supplied URLs).
 * Providers: Anthropic Claude, OpenAI (default order). Optional: Gemini via AI_INSIGHTS_PROVIDER_ORDER.
 */
/* global process */

import { deriveBrandSearchContext } from '../src/utils/productBrandContext.js';

const MAX_NARRATIVE_LEN = 2200;
const MAX_EXTRA_SUMMARY_LEN = 800;

function envList(key, fallback) {
  const raw = (process.env[key] || fallback || '').trim();
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function hasUrlLike(s) {
  if (typeof s !== 'string') return false;
  return /https?:\/\/|www\.\w/i.test(s);
}

function sanitizePhrase(s, maxLen) {
  if (typeof s !== 'string') return '';
  const t = s.trim().replace(/\s+/g, ' ');
  if (!t || hasUrlLike(t)) return '';
  return t.slice(0, maxLen);
}

function uniquePhrases(arr, maxCount, maxLen) {
  const seen = new Set();
  const out = [];
  for (const item of Array.isArray(arr) ? arr : []) {
    const p = sanitizePhrase(String(item), maxLen);
    if (!p || p.length < 3) continue;
    const k = p.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
    if (out.length >= maxCount) break;
  }
  return out;
}

function buildUserPrompt(product, userContextText = '') {
  const name = product?.name || 'Unknown product';
  const category = product?.category || '';
  const summary = product?.summary || '';
  const tags = Array.isArray(product?.tags) ? product.tags.join(', ') : '';
  const type = product?.type || '';
  const brandCtx = deriveBrandSearchContext(product);
  const brandBlock =
    brandCtx.emphasizeBrandInSearches && brandCtx.brandName
      ? `

Brand / comparison context (use this so readers can compare this brand to others in the same category):
- Brand to surface in searches and narrative: ${brandCtx.brandName}
- Product kind (plain language): ${brandCtx.deviceKindLabel || category}
- Many vendors sell ${brandCtx.deviceKindLabel || 'this kind of product'} under different brand names. In clinicalNarrative, scienceSummary, and communitySummary, add one short sentence acknowledging that materials, fit, sizing, app behavior, or evidence may differ by brand—without claiming this brand is better or worse than others.
- pubmedSearchQueries: include at least one phrase that combines the product kind with the brand name or with comparison-relevant terms (e.g. efficacy, safety, sizing) so results are not only generic category reviews.
- patientEducationQueries: include at least one phrase that names the brand plus the device or product kind (short), OR a neutral phrase about choosing between brands in this category if the brand name is long.
- communitySearchQueries: include at least one phrase that includes the brand name plus product kind (e.g. for forum/video search) so users find brand-specific threads; you may also keep one broader category query.
`
      : '';

  const readerBlock =
    userContextText && userContextText.trim().length > 0
      ? `

Reader health context (tailor summaries to this person when relevant; educational only; never diagnose; never tell them to stop a prescribed medication—suggest discussing with their clinician for interactions or contraindications):
${userContextText.trim()}

Tailoring rules when reader context is present:
- Personalize clinicalNarrative, scienceSummary, and communitySummary: briefly note why this category might matter for their stated concerns (e.g. heavy flow, menopause, UTI history, latex or fragrance sensitivity, imported conditions)—without individual medical directives.
- pubmedSearchQueries, patientEducationQueries, and communitySearchQueries may include one helpful qualifier tied to their context (e.g. "heavy menstrual bleeding management", "latex-free menstrual cup") when it fits the product category. Never echo names, emails, or street addresses.
- If context is irrelevant to this product type, keep text generic as usual.
`
      : '';

  return `Product context (for educational writing only):
- Name: ${name}
- Category: ${category}
- Type: ${type}
- Summary: ${summary}
- Tags: ${tags}
${readerBlock}
Return a SINGLE JSON object with this exact shape (no markdown, no URLs anywhere in any field):
{
  "clinicalNarrative": "2-4 sentences: neutral clinical / product-category context. Educational only. No diagnosis or treatment instructions for the reader. When reader context is provided, open with one short clause on relevance to their profile when appropriate.",
  "scienceSummary": "1-2 sentences: how evidence or trials are typically discussed for this category (not about this specific product unless clearly a named drug/device). Mention evidence limitations when the reader has complex conditions and evidence may not be product-specific.",
  "communitySummary": "1-2 sentences: how patients often discuss this topic in forums — clearly anecdotal, not factual claims. If reader sensitivities apply (e.g. fragrance), note that forum posts are unverified.",
  "pubmedSearchQueries": ["short search phrase 1", "short search phrase 2"],
  "patientEducationQueries": ["plain phrase for patient-education search 1"],
  "communitySearchQueries": ["short phrase to search Reddit/YouTube"]
}

STRICT RULES:
- Do NOT include links, domains, "http", "www", PMIDs, or citation strings.
- pubmedSearchQueries: 2-4 items, each 3-80 characters, MeSH-friendly short phrases (English).
- patientEducationQueries: 1-2 items for consumer health search (symptom or topic).
- communitySearchQueries: 1-3 items for social search. When brand/comparison context is provided above, include the brand in at least one query; otherwise use product type + use case.
- If unsure, use shorter, more generic phrases rather than specific claims.`;
}

function stripJsonFence(s) {
  if (typeof s !== 'string') return s;
  let t = s.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (m) t = m[1].trim();
  return t;
}

function normalizeParsed(raw) {
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(stripJsonFence(raw));
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== 'object') return null;

  const clinicalNarrative = sanitizePhrase(obj.clinicalNarrative, MAX_NARRATIVE_LEN);
  const scienceSummary = sanitizePhrase(obj.scienceSummary, MAX_EXTRA_SUMMARY_LEN);
  const communitySummary = sanitizePhrase(obj.communitySummary, MAX_EXTRA_SUMMARY_LEN);

  const pubmedSearchQueries = uniquePhrases(obj.pubmedSearchQueries, 4, 120);
  const patientEducationQueries = uniquePhrases(obj.patientEducationQueries, 2, 120);
  let communitySearchQueries = uniquePhrases(obj.communitySearchQueries, 3, 100);

  if (!clinicalNarrative && !scienceSummary && pubmedSearchQueries.length === 0) return null;

  if (communitySearchQueries.length === 0) {
    const base = pubmedSearchQueries[0];
    communitySearchQueries = uniquePhrases(
      base ? [`${base} patient experience`, `${base} review`] : ['women health product discussion'],
      3,
      100
    );
  }

  return {
    clinicalNarrative:
      clinicalNarrative ||
      scienceSummary ||
      'Below are safe search links you can use to explore evidence and patient-oriented sources. This is not medical advice.',
    scienceSummary,
    communitySummary,
    pubmedSearchQueries,
    patientEducationQueries:
      patientEducationQueries.length > 0 ? patientEducationQueries : pubmedSearchQueries.slice(0, 2),
    communitySearchQueries,
  };
}

/** If this is a multi-brand category, ensure at least one PubMed / Medline / community query names the brand. */
function mergeBrandSearchQueries(product, normalized) {
  const ctx = deriveBrandSearchContext(product);
  if (!ctx.emphasizeBrandInSearches || !ctx.brandName) return normalized;
  const b = ctx.brandName;
  const dk = ctx.deviceKindLabel || 'product';
  const brandToken = b.split(/\s+/)[0].toLowerCase();

  const mentionsBrand = (arr) =>
    Array.isArray(arr) &&
    arr.some((q) => typeof q === 'string' && brandToken.length >= 2 && q.toLowerCase().includes(brandToken));

  const pubmed = [...(normalized.pubmedSearchQueries || [])];
  const patient = [...(normalized.patientEducationQueries || [])];
  const community = [...(normalized.communitySearchQueries || [])];

  if (!mentionsBrand(community)) {
    community.unshift(sanitizePhrase(`${b} ${dk}`, 100));
  }
  if (!mentionsBrand(pubmed)) {
    pubmed.unshift(sanitizePhrase(`${dk} ${b}`, 120));
  }
  if (!mentionsBrand(patient)) {
    patient.unshift(sanitizePhrase(`${b} ${dk}`, 120));
  }

  return {
    ...normalized,
    pubmedSearchQueries: uniquePhrases(pubmed, 6, 120),
    patientEducationQueries: uniquePhrases(patient, 4, 120),
    communitySearchQueries: uniquePhrases(community, 5, 100),
  };
}

function buildSafeLinks(parsed) {
  const literatureLinks = [];
  for (const q of parsed.pubmedSearchQueries) {
    literatureLinks.push({
      url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`,
      text: `PubMed search: ${q.length > 55 ? `${q.slice(0, 52)}…` : q}`,
      summary: 'Opens PubMed with this query. Link is generated by Ayna — not supplied by the AI.',
      justification: 'Official NLM search URL',
    });
  }

  const clinicianLinks = [];
  for (const q of parsed.patientEducationQueries) {
    clinicianLinks.push({
      url: `https://medlineplus.gov/search.html?query=${encodeURIComponent(q)}`,
      text: `MedlinePlus search: ${q.length > 50 ? `${q.slice(0, 47)}…` : q}`,
      summary: 'NIH MedlinePlus patient-oriented results for this phrase.',
      justification: 'Official MedlinePlus search URL',
    });
  }

  const communityLinks = [];
  for (const q of parsed.communitySearchQueries) {
    const tail = q.toLowerCase().includes('women') || q.toLowerCase().includes("women's") ? q : `${q} women's health`;
    communityLinks.push({
      url: `https://www.reddit.com/search/?q=${encodeURIComponent(tail)}`,
      text: `Reddit search: ${q.length > 45 ? `${q.slice(0, 42)}…` : q}`,
      summary: 'Jump to Reddit search — verify posts yourself; not medical advice.',
      justification: 'Official Reddit search URL',
      platform: 'reddit',
    });
    communityLinks.push({
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(tail)}`,
      text: `YouTube search: ${q.length > 45 ? `${q.slice(0, 42)}…` : q}`,
      summary: 'Jump to YouTube search results — creator content varies in quality.',
      justification: 'Official YouTube search URL',
      platform: 'youtube',
    });
  }

  return { clinicianLinks, literatureLinks, communityLinks };
}

async function callOpenAI(product, userContextText = '') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You write careful JSON for a women\'s health education product. Never output URLs or fake citations. Prefer short, generic search phrases when uncertain.',
        },
        { role: 'user', content: buildUserPrompt(product, userContextText) },
      ],
    }),
  });
  if (!res.ok) {
    console.error('OpenAI error', res.status, (await res.text()).slice(0, 300));
    return null;
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  return typeof raw === 'string' ? raw : null;
}

/** Model ids to try; override first with ANTHROPIC_MODEL. */
function anthropicModelCandidates() {
  const preferred = (process.env.ANTHROPIC_MODEL || '').trim();
  const out = [];
  const add = (m) => {
    if (m && !out.includes(m)) out.push(m);
  };
  add(preferred);
  add('claude-haiku-4-5-20251001');
  return out;
}

const ANTHROPIC_SYSTEM =
  "You produce only valid JSON for a women's health education app. Never include URLs, links, domains, or fabricated citations. Use short search phrases only. Output a single JSON object only — no markdown, no code fences, no text before or after the JSON.";

async function callAnthropic(product, userContextText = '') {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const payloadBase = {
    max_tokens: 1200,
    temperature: 0.25,
    system: ANTHROPIC_SYSTEM,
    messages: [{ role: 'user', content: buildUserPrompt(product, userContextText) }],
  };

  for (const model of anthropicModelCandidates()) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ...payloadBase, model }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Anthropic error', model, res.status, errText.slice(0, 400));
      if (res.status === 404) continue;
      return null;
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (typeof text === 'string' && text.trim()) return text;
  }
  return null;
}

/**
 * Optional: Vercel AI Gateway (OpenAI-compatible) — only if you use a gateway API key from Vercel.
 * Not the same as a Google AI Studio / Gemini API key (use GEMINI_API_KEY for that).
 */
function getGeminiAiGatewayApiKey() {
  return (
    process.env.GEMINI_AI_GATEWAY_API_KEY ||
    process.env.AI_GATEWAY_API_KEY ||
    ''
  ).trim() || null;
}

/** Direct Google Generative Language API (AI Studio / BYOK env names). */
function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  ).trim() || null;
}

/** Safe booleans only — helps verify env vars reached this serverless function (no secret values). */
function providerEnvPresence() {
  return {
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    GOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
    GEMINI_AI_GATEWAY_API_KEY: !!process.env.GEMINI_AI_GATEWAY_API_KEY,
    AI_GATEWAY_API_KEY: !!process.env.AI_GATEWAY_API_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
  };
}

const DEFAULT_GATEWAY_GEMINI_MODEL = 'google/gemini-2.5-flash';

/**
 * Gemini through Vercel AI Gateway (optional). Uses OpenAI Chat Completions shape.
 */
async function callGeminiViaVercelAiGateway(product, userContextText = '') {
  const apiKey = getGeminiAiGatewayApiKey();
  if (!apiKey) return null;
  const base = (process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1').replace(/\/$/, '');
  const model = process.env.AI_GATEWAY_GEMINI_MODEL || DEFAULT_GATEWAY_GEMINI_MODEL;
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You write careful JSON for a women\'s health education product. Never output URLs or fake citations. Prefer short, generic search phrases when uncertain.',
        },
        { role: 'user', content: buildUserPrompt(product, userContextText) },
      ],
    }),
  });
  if (!res.ok) {
    console.error('AI Gateway (Gemini) error', res.status, (await res.text()).slice(0, 400));
    return null;
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  return typeof raw === 'string' ? raw : null;
}

/** Model ids to try in order (AI Studio); override first with GEMINI_MODEL. */
function geminiModelCandidates() {
  const preferred = (process.env.GEMINI_MODEL || '').trim();
  const out = [];
  const add = (m) => {
    if (m && !out.includes(m)) out.push(m);
  };
  add(preferred);
  add('gemini-2.0-flash');
  add('gemini-1.5-flash');
  add('gemini-1.5-flash-8b');
  return out;
}

/** Direct Gemini REST API (when you use a Google AI Studio key in env, not the Gateway key). */
async function callGeminiDirect(product, userContextText = '') {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const body = {
    contents: [{ role: 'user', parts: [{ text: buildUserPrompt(product, userContextText) }] }],
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens: 1200,
      responseMimeType: 'application/json',
    },
    systemInstruction: {
      parts: [
        {
          text: 'Output valid JSON only. Never include URLs or http. Short conservative search phrases only.',
        },
      ],
    },
  };

  for (const model of geminiModelCandidates()) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini error', model, res.status, errText.slice(0, 400));
      if (res.status === 404) continue;
      return null;
    }
    let data;
    try {
      data = await res.json();
    } catch {
      return null;
    }
    const cand = data?.candidates?.[0];
    if (!cand) {
      console.error('Gemini no candidates', model, JSON.stringify(data).slice(0, 500));
      continue;
    }
    if (cand.finishReason && cand.finishReason !== 'STOP' && cand.finishReason !== 'MAX_TOKENS') {
      console.error('Gemini finishReason', model, cand.finishReason);
    }
    const raw = cand?.content?.parts?.[0]?.text;
    if (typeof raw === 'string' && raw.trim()) return raw;
  }
  return null;
}

/** @returns {{ raw: string, geminiRoute?: 'gateway' | 'direct' } | null} */
async function callGemini(product, userContextText = '') {
  // Prefer direct Google Gemini API (GEMINI_API_KEY / AI Studio). Optional fallback: Vercel AI Gateway.
  if (getGeminiApiKey()) {
    const direct = await callGeminiDirect(product, userContextText);
    if (direct) return { raw: direct, geminiRoute: 'direct' };
  }
  if (getGeminiAiGatewayApiKey()) {
    const viaGateway = await callGeminiViaVercelAiGateway(product, userContextText);
    if (viaGateway) return { raw: viaGateway, geminiRoute: 'gateway' };
  }
  return null;
}

async function runModel(product, provider, userContextText = '') {
  let raw = null;
  let providerUsed = provider === 'anthropic' ? 'claude' : provider === 'google' ? 'gemini' : provider;
  if (provider === 'claude' || provider === 'anthropic') raw = await callAnthropic(product, userContextText);
  else if (provider === 'gemini' || provider === 'google') {
    const g = await callGemini(product, userContextText);
    if (g) {
      raw = g.raw;
      providerUsed = g.geminiRoute === 'gateway' ? 'gemini (Vercel AI Gateway)' : 'gemini';
    }
  } else if (provider === 'openai') raw = await callOpenAI(product, userContextText);
  if (!raw) return null;
  const normalized = normalizeParsed(raw);
  if (!normalized) return null;
  const merged = mergeBrandSearchQueries(product, normalized);
  return { provider: providerUsed, normalized: merged };
}

function anyApiKeyConfigured() {
  return !!(
    process.env.ANTHROPIC_API_KEY ||
    getGeminiAiGatewayApiKey() ||
    getGeminiApiKey() ||
    process.env.OPENAI_API_KEY
  );
}

function canUseProvider(p) {
  const x = p === 'anthropic' ? 'claude' : p === 'google' ? 'gemini' : p;
  if (x === 'claude') return !!process.env.ANTHROPIC_API_KEY;
  if (x === 'gemini') return !!(getGeminiAiGatewayApiKey() || getGeminiApiKey());
  if (x === 'openai') return !!process.env.OPENAI_API_KEY;
  return false;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!anyApiKeyConfigured()) {
    console.warn(
      'product-insights: no provider keys visible to this function. Set GEMINI_API_KEY (or others) in Vercel and redeploy.'
    );
    return res.status(503).json({
      error: 'not_configured',
      message:
        'No AI provider key set. Add one of: ANTHROPIC_API_KEY (Claude), OPENAI_API_KEY, or optionally GEMINI_API_KEY / GEMINI_AI_GATEWAY_API_KEY. Default order is claude,openai — add gemini to AI_INSIGHTS_PROVIDER_ORDER if needed.',
      hint:
        'In Vercel: Project → Settings → Environment Variables → add GEMINI_API_KEY for Production (and Preview if you test previews). Save, then Deployments → Redeploy — env vars apply at deploy time.',
      envPresent: providerEnvPresence(),
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const product = body?.product;
  if (!product || typeof product !== 'object') {
    return res.status(400).json({ error: 'Missing product' });
  }

  const userContextRaw = body?.userContext;
  const userContextText =
    typeof userContextRaw === 'string' ? userContextRaw.trim().slice(0, 4000) : '';

  const order = envList('AI_INSIGHTS_PROVIDER_ORDER', 'claude,openai');
  const normalizedIds = order.filter((p) => ['claude', 'anthropic', 'gemini', 'google', 'openai'].includes(p));
  const fallback = ['claude', 'openai'];
  const anyConfigured = ['claude', 'gemini', 'openai'];
  let tryProviders = (normalizedIds.length ? normalizedIds : fallback).filter((p) => canUseProvider(p));
  if (tryProviders.length === 0) {
    tryProviders = anyConfigured.filter((p) => canUseProvider(p));
  }

  let lastError = null;
  for (const p of tryProviders) {
    try {
      const out = await runModel(
        product,
        p === 'anthropic' ? 'claude' : p === 'google' ? 'gemini' : p,
        userContextText
      );
      if (!out) continue;
      const { clinicianLinks, literatureLinks, communityLinks } = buildSafeLinks(out.normalized);
      return res.status(200).json({
        clinicalNarrative: out.normalized.clinicalNarrative,
        scienceSummary: out.normalized.scienceSummary || '',
        communitySummary: out.normalized.communitySummary || '',
        clinicianLinks,
        literatureLinks,
        communityLinks,
        providerUsed: out.provider,
        linkMode: 'server_built_search',
        generatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
      lastError = e;
    }
  }

  return res.status(502).json({
    error: 'all_providers_failed',
    message: lastError?.message || 'Could not generate insights. Check provider keys and quotas.',
  });
}
