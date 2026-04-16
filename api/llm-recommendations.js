/* global process */

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  )
    .trim() || null;
}

function anyApiKeyConfigured() {
  return !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || getGeminiApiKey());
}

function selectedConcerns(intake = {}) {
  if (Array.isArray(intake.primaryConcerns) && intake.primaryConcerns.length) return intake.primaryConcerns;
  if (intake.primaryConcern) return [intake.primaryConcern];
  return [];
}

function safeHttpsUrl(u) {
  if (!u || typeof u !== 'string') return '';
  const t = u.trim();
  if (!/^https:\/\//i.test(t)) return '';
  try {
    const x = new URL(t);
    if (x.protocol !== 'https:') return '';
    return t.slice(0, 800);
  } catch {
    return '';
  }
}

function enrichProduct(p, idSuffix = '') {
  if (!p || typeof p !== 'object' || !String(p.name || '').trim()) return null;
  const id =
    p.id && String(p.id).trim()
      ? String(p.id).trim().slice(0, 120)
      : `gen-${String(p.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 48)}${idSuffix}-${Math.random().toString(36).slice(2, 7)}`;
  const url = safeHttpsUrl(p.url);
  return {
    ...p,
    id,
    category: String(p.category || 'other').toLowerCase().replace(/\s+/g, '-').slice(0, 64),
    type: String(p.type || 'physical').toLowerCase() === 'digital' ? 'digital' : 'physical',
    image: typeof p.image === 'string' && p.image.trim() ? p.image.trim() : '',
    tags: Array.isArray(p.tags) ? p.tags.map((x) => String(x)).slice(0, 12) : [],
    safety: {
      recalls: p.safety?.recalls != null ? String(p.safety.recalls) : '',
      materials: p.safety?.materials != null ? String(p.safety.materials) : '',
      sideEffects: p.safety?.sideEffects != null ? String(p.safety.sideEffects) : '',
      opinionAlerts: p.safety?.opinionAlerts != null ? String(p.safety.opinionAlerts) : '',
    },
    url: url || undefined,
    searchTerms:
      Array.isArray(p.searchTerms) && p.searchTerms.length > 0
        ? p.searchTerms.map((x) => String(x)).slice(0, 6)
        : [p.name, p.brand].filter(Boolean),
    whereToBuy: url ? ['Brand site'] : [],
    llmGenerated: true,
    intakeGenerated: true,
  };
}

function enrichRecommendations(recs) {
  const list = Array.isArray(recs) ? recs : [];
  return list
    .map((entry) => {
      const topProduct = enrichProduct(entry?.topProduct);
      if (!topProduct) return null;
      const alternatives = (Array.isArray(entry?.alternatives) ? entry.alternatives : [])
        .map((alt, i) => enrichProduct(alt, `-alt${i}`))
        .filter(Boolean)
        .slice(0, 3);
      return {
        concern: String(entry?.concern || '').trim() || 'Recommendations',
        topProduct,
        alternatives,
        notes: Array.isArray(entry?.notes) ? entry.notes.slice(0, 5).map((x) => String(x)) : [],
        // Keep tiers array for backward compatibility with any code still using it
        tiers: [{
          name: 'Top pick',
          product: topProduct,
          alternatives,
          safetyFlags: [],
        }],
      };
    })
    .filter(Boolean);
}

function buildPrompt(intake = {}, feedback = {}) {
  const concerns = selectedConcerns(intake);
  const concernFollowups = intake?.concernFollowups && typeof intake.concernFollowups === 'object' ? intake.concernFollowups : {};

  return `
You are Ayna's recommendation engine. Ayna is a women's health product platform. Your job is to act like a knowledgeable women's health expert and recommend the BEST real products available for this specific user based on her health profile.

USER HEALTH PROFILE:
- Age: ${intake?.age || 'unknown'}
- Location: ${intake?.location || 'unknown'}
- Primary concerns: ${concerns.join(', ') || 'none provided'}
- Custom concerns: ${(Array.isArray(intake?.customConcerns) ? intake.customConcerns : []).join(', ') || 'none'}
- Diagnosed conditions: ${(Array.isArray(intake?.conditions) ? intake.conditions : []).join(', ') || 'none'}
- Menstrual cycle status: ${intake?.menstrualCycle || 'unknown'}
- Cycle length: ${intake?.averageCycleLength || 'unknown'} days
- Period length: ${intake?.averagePeriodLength || 'unknown'} days
- Flow level: ${intake?.flowLevel || 'unknown'}
- Pain level: ${intake?.painLevel || 'unknown'}/10
- Symptoms: ${(Array.isArray(intake?.symptoms) ? intake.symptoms : []).join(', ') || 'none'}
- Trying to conceive: ${intake?.tryingToConceive || 'unknown'}
- Hormonal birth control: ${intake?.hormonalBirthControl || 'unknown'} ${intake?.hormonalBirthControlType ? `(${intake.hormonalBirthControlType})` : ''}
- Product preferences: ${(Array.isArray(intake?.productPreferences) ? intake.productPreferences : []).join(', ') || 'none'}
- Preferred product types: ${(Array.isArray(intake?.preferredProductTypes) ? intake.preferredProductTypes : []).join(', ') || 'none'}
- Currently uses: ${intake?.currentProductsText || 'none'}
- Tried and disliked: ${intake?.dislikedProductsText || 'none'} — reason: ${intake?.dislikedReason || 'none'}
- Goals: ${(Array.isArray(intake?.goals) ? intake.goals : []).join(', ') || 'none'}
- Concern-specific details: ${JSON.stringify(concernFollowups)}

LEARNING SIGNALS:
- Products she has saved: ${(feedback?.trackedProductIds || []).join(', ') || 'none'}
- Products already in her ecosystem: ${(feedback?.ecosystemProductIds || []).join(', ') || 'none'}
- Products she has hidden: ${(feedback?.omittedProductIds || []).join(', ') || 'none'}
- Times she has used Ayna: ${feedback?.learningMemory?.interactionCount || 0}
- Last concerns she viewed: ${(feedback?.learningMemory?.lastConcerns || []).join(', ') || 'none'}

PRODUCT SELECTION PROCESS — follow this for every concern:
1. Identify what category of product would genuinely help this user's specific concern and profile
2. Draw on your full knowledge of ALL brands that make products in that category — large mainstream brands, small indie brands, DTC brands, clinical brands, everything
3. Rank candidates by: (a) clinical reputation and safety record, (b) relevance to this user's specific conditions and preferences, (c) availability in the US market, (d) user and community reputation
4. Recommend the single best match — not the most popular product, the most relevant one for her specific profile

TASK:
For each of her primary concerns, generate the single best product recommendation and 3 real alternatives. The best product is whatever actually works best for that concern given her specific profile — it could be a pad, a supplement, an app, a device, a telehealth service, anything. Do not force one physical and one supplement and one digital for every concern. Just recommend what is actually best.

ANTI-HALLUCINATION RULES:
- Only recommend a product if you are highly confident it exists and is currently sold
- If unsure about a specific SKU, use the main product line name (e.g. "Rael Organic Cotton Pads" not a specific SKU code)
- Small and indie brands are encouraged if reputable and relevant — do not default to mainstream only
- The url field must be the brand's actual homepage only (e.g. https://www.rael.com) — never invent a product page URL, never use a Google search URL, never fabricate a URL. If you only know the brand name and not the exact URL, use https://www.google.com/search?q= plus the URL-encoded brand name
- Leave image as empty string always — do not generate image URLs
- Never invent a brand name. If you are not certain a brand exists, do not include it

PERSONALIZATION RULES:
- Never recommend products she has tried and disliked
- Never recommend products she has hidden
- If she has endometriosis: always flag synthetic fragrances, dioxins, chlorine bleaching, BPA
- If she has PCOS: prioritize hormone-balancing products; flag endocrine disruptors
- If she is trying to conceive: flag supplements contraindicated in pregnancy
- If pain level is 8 or higher: always include a telehealth recommendation
- Only generate concerns she actually has — match concern labels exactly to what she selected
- Never say "treats" or "cures" — say "may help with"
- Every whyItWorks must reference at least one specific detail from her profile
- Never recommend products with active FDA recalls
- Use learning signals to avoid repeating products she has already seen

Return ONLY a valid JSON object. No markdown, no explanation, just JSON:

{
  "recommendations": [
    {
      "concern": "exact concern label from her primary concerns",
      "topProduct": {
        "id": "brand-productname-slug",
        "name": "Exact real product name",
        "brand": "Brand name",
        "category": "category",
        "type": "physical or digital",
        "summary": "2-3 sentences describing what this product is",
        "whyItWorks": "2-3 sentences explaining why this fits THIS user specifically, referencing her profile details",
        "considerations": "Ingredient or safety notes relevant to her conditions. Empty string if none.",
        "price": "$XX",
        "image": "",
        "tags": ["tag1", "tag2"],
        "safety": {
          "recalls": "No known recalls",
          "materials": "",
          "sideEffects": "",
          "opinionAlerts": ""
        },
        "clinicianOpinionSource": "",
        "clinicianAttribution": "",
        "url": "https://brandhomepage.com"
      },
      "alternatives": [
        {
          "id": "brand-productname-slug-alt1",
          "name": "Alternative product name",
          "brand": "Brand",
          "summary": "1-2 sentence description",
          "whyItWorks": "1 sentence on why this is a good alternative",
          "price": "$XX",
          "type": "physical or digital",
          "image": "",
          "url": "https://brandhomepage.com",
          "safety": { "recalls": "No known recalls", "materials": "", "sideEffects": "", "opinionAlerts": "" }
        }
      ],
      "notes": []
    }
  ]
}
`.trim();
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
      max_tokens: 4000,
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
      max_tokens: 6000,
      temperature: 0.2,
      system: 'Return a single valid JSON object only. No markdown code fences.',
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
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json', maxOutputTokens: 8192 },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

async function generateWithProviders(prompt) {
  const order = (process.env.AI_RECOMMENDATIONS_PROVIDER_ORDER || 'anthropic,openai,gemini')
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
      message: 'No LLM API key found. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY.',
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

  const prompt = buildPrompt(intake, feedback);
  const ai = await generateWithProviders(prompt);
  console.log(
    'AI provider used:',
    ai?.provider,
    '| Response length:',
    ai?.raw?.length,
    '| First 200 chars:',
    String(ai?.raw || '').slice(0, 200)
  );

  if (!ai?.raw) {
    return res.status(503).json({
      error: 'no_ai_response',
      message: 'Could not generate recommendations. Check your API key and quota.',
    });
  }

  let parsed;
  try {
    let clean = ai.raw || '';
    // Strip markdown fences
    clean = String(clean)
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();
    // Extract the outermost JSON object
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      clean = clean.slice(start, end + 1);
    }
    parsed = JSON.parse(clean);
  } catch {
    console.error('JSON parse error. Raw response (first 800 chars):', String(ai.raw || '').slice(0, 800));
    return res.status(500).json({
      error: 'parse_error',
      message: 'AI returned invalid JSON.',
      preview: String(ai.raw || '').slice(0, 300),
    });
  }

  const recs = enrichRecommendations(parsed?.recommendations);

  return res.status(200).json({
    recommendations: recs,
    providerUsed: ai.provider,
    generatedAt: new Date().toISOString(),
  });
}
