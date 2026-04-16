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
      const tiers = (Array.isArray(entry?.tiers) ? entry.tiers : [])
        .map((tier) => {
          const product = enrichProduct(tier?.product);
          if (!product) return null;
          const alternatives = (Array.isArray(tier?.alternatives) ? tier.alternatives : [])
            .map((alt, i) => enrichProduct(alt, `-alt${i}`))
            .filter(Boolean)
            .slice(0, 3);
          return {
            ...tier,
            name: String(tier?.name || '').trim() || 'Tier',
            product,
            alternatives,
            safetyFlags: Array.isArray(tier?.safetyFlags) ? tier.safetyFlags : [],
          };
        })
        .filter(Boolean);
      if (!tiers.length) return null;
      return {
        concern: String(entry?.concern || '').trim() || 'Recommendations',
        tiers,
        notes: Array.isArray(entry?.notes) ? entry.notes.slice(0, 5).map((x) => String(x)) : [],
      };
    })
    .filter(Boolean);
}

function buildPrompt(intake = {}, feedback = {}) {
  const concerns = selectedConcerns(intake);
  const concernFollowups = intake?.concernFollowups && typeof intake.concernFollowups === 'object' ? intake.concernFollowups : {};

  return `
You are Ayna's recommendation engine — a women's health AI that generates deeply personalized product recommendations.

USER HEALTH PROFILE:
- Age: ${intake?.age || 'unknown'}
- Location: ${intake?.location || 'unknown'}
- Primary concerns: ${concerns.join(', ') || 'none provided'}
- Custom concerns: ${(Array.isArray(intake?.customConcerns) ? intake.customConcerns : []).join(', ') || 'none'}
- Diagnosed conditions: ${(Array.isArray(intake?.conditions) ? intake.conditions : []).join(', ') || 'none'}
- Menstrual cycle: ${intake?.menstrualCycle || 'unknown'}
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
- Concern-specific follow-ups: ${JSON.stringify(concernFollowups)}

LEARNING SIGNALS — use these to get smarter for this user over time:
- Products she has saved/tracked: ${(feedback?.trackedProductIds || []).join(', ') || 'none'}
- Products in her ecosystem: ${(feedback?.ecosystemProductIds || []).join(', ') || 'none'}
- Products she has hidden: ${(feedback?.omittedProductIds || []).join(', ') || 'none'}
- Cross-session memory: ${JSON.stringify(feedback?.learningMemory || {})}

TASK:
Generate product recommendations for this specific user. For each concern area relevant to her profile, generate three tiers of recommendations. Each recommendation must be a REAL product that actually exists and is available for purchase.

IMPORTANT RULES:
- Never recommend products she has tried and disliked
- Never recommend products she has already hidden
- If she has endometriosis: always flag products with synthetic fragrances, dioxins, chlorine bleaching, or BPA
- If she has PCOS: prioritize products that support hormone balance; flag hormone-disrupting ingredients
- If she is trying to conceive: flag any supplements contraindicated in pregnancy
- If pain level is 8 or higher: always include a telehealth recommendation
- Only show concern areas relevant to her profile — do not show all concerns to every user
- Never make diagnostic claims — say "may help with" not "treats" or "cures"
- Every whyItWorks explanation must reference at least one specific detail from her profile
- Never recommend products with active FDA recalls
- Use the learning signals to avoid repeating products she has already seen and to weight toward her demonstrated preferences
- The more times this user has interacted with Ayna, the smarter and more specific your recommendations should get
- Product "url" fields must be valid https URLs to the brand or major retailer product page when possible; otherwise use https://www.google.com/search?q= plus encoded product name

Return ONLY a valid JSON object in exactly this format — no markdown, no explanation, just JSON:

{
  "recommendations": [
    {
      "concern": "string — the concern area label",
      "tiers": [
        {
          "name": "TIER 1 - IMMEDIATE PHYSICAL PRODUCT",
          "product": {
            "id": "unique-slug-no-spaces",
            "name": "Exact real product name",
            "brand": "Brand name",
            "category": "category string",
            "type": "physical",
            "summary": "2-3 sentence description of what this product is and does",
            "whyItWorks": "2-3 sentences explaining exactly why this product fits THIS user's specific profile, conditions, and preferences — must reference her specific details",
            "considerations": "Any ingredients, materials, or interactions she should be aware of given her specific conditions. Leave empty string if none.",
            "price": "$XX or $XX/month",
            "image": "",
            "tags": ["tag1", "tag2"],
            "safety": {
              "recalls": "No known recalls",
              "materials": "brief materials note",
              "sideEffects": "brief side effects note if relevant",
              "opinionAlerts": ""
            },
            "clinicianOpinionSource": "",
            "clinicianAttribution": "",
            "url": "https://product-website.com"
          },
          "alternatives": [
            {
              "id": "unique-slug",
              "name": "Alternative product name",
              "brand": "Brand",
              "summary": "1-2 sentence description",
              "price": "$XX",
              "type": "physical",
              "image": "",
              "url": "https://product-website.com"
            }
          ]
        },
        {
          "name": "TIER 2 - SUPPLEMENT OR WELLNESS PRODUCT",
          "product": { },
          "alternatives": [ ]
        },
        {
          "name": "TIER 3 - DIGITAL OR TELEHEALTH OPTION",
          "product": { },
          "alternatives": [ ]
        }
      ],
      "notes": ["optional safety or personalization note for this concern"]
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
