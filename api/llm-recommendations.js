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
  const blocked = new Set(['general discomfort']);
  if (Array.isArray(intake.primaryConcerns) && intake.primaryConcerns.length) {
    return intake.primaryConcerns
      .map((x) => String(x || '').trim())
      .filter(Boolean)
      .filter((x) => !blocked.has(x.toLowerCase()));
  }
  if (intake.primaryConcern) {
    const v = String(intake.primaryConcern).trim();
    if (v && !blocked.has(v.toLowerCase())) return [v];
  }
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

function isBlockedRecommendationProduct(p) {
  if (!p || typeof p !== 'object') return false;
  const text = [
    p.id,
    p.name,
    p.brand,
    p.summary,
    p.whyItWorks,
    p.considerations,
    p.category,
    p.searchTerms,
  ]
    .flat()
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /tranexamic|tranexemic|\blysteda\b/.test(text);
}

function enrichProduct(p, idSuffix = '') {
  if (!p || typeof p !== 'object' || !String(p.name || '').trim()) return null;
  if (isBlockedRecommendationProduct(p)) return null;
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
      const normalizedTiers = (Array.isArray(entry?.tiers) ? entry.tiers : [])
        .map((tier, tierIdx) => {
          const tierProduct = enrichProduct(tier?.product || tier?.topProduct, `-tier${tierIdx}`);
          if (!tierProduct) return null;
          const tierAlternatives = (Array.isArray(tier?.alternatives) ? tier.alternatives : [])
            .map((alt, altIdx) => enrichProduct(alt, `-tier${tierIdx}-alt${altIdx}`))
            .filter(Boolean)
            .filter((alt) => alt.id !== tierProduct.id)
            .slice(0, 3);
          const tierName = String(tier?.name || '').trim() || `Option ${tierIdx + 1}`;
          const tierSubcategory = String(tier?.subcategory || '').trim();
          return {
            id: String(tier?.id || `tier-${tierIdx + 1}`).trim(),
            name: tierName,
            subcategory: tierSubcategory || tierName,
            product: tierProduct,
            alternatives: tierAlternatives,
            safetyFlags: Array.isArray(tier?.safetyFlags) ? tier.safetyFlags.slice(0, 5).map((x) => String(x)) : [],
            matchExplanation: String(tier?.matchExplanation || tierProduct?.whyItWorks || '').trim(),
          };
        })
        .filter(Boolean);

      const fallbackTop = enrichProduct(entry?.topProduct);
      const fallbackAlts = (Array.isArray(entry?.alternatives) ? entry.alternatives : [])
        .map((alt, i) => enrichProduct(alt, `-alt${i}`))
        .filter(Boolean)
        .slice(0, 3);

      const tiers = normalizedTiers.length > 0
        ? normalizedTiers
        : (fallbackTop
          ? [{
              id: 'tier-1',
              name: 'Top pick',
              subcategory: 'Top pick',
              product: fallbackTop,
              alternatives: fallbackAlts.filter((alt) => alt.id !== fallbackTop.id),
              safetyFlags: [],
              matchExplanation: String(fallbackTop?.whyItWorks || '').trim(),
            }]
          : []);
      const topProduct = tiers[0]?.product || fallbackTop || null;
      if (!topProduct) return null;
      const alternatives = tiers[0]?.alternatives || fallbackAlts;
      return {
        concern: String(entry?.concern || '').trim() || 'Recommendations',
        topProduct,
        alternatives,
        notes: Array.isArray(entry?.notes) ? entry.notes.slice(0, 5).map((x) => String(x)) : [],
        tiers,
      };
    })
    .filter(Boolean);
}

async function lookupDsldProduct(name) {
  if (!name || name.length < 3) return null;
  try {
    const url = `https://api.ods.od.nih.gov/dsld/v9/label?name=${encodeURIComponent(name)}&status=Y&size=1`;
    const r = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Ayna-Health-App/1.0' },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const hit = data?.hits?.hits?.[0]?._source;
    if (!hit) return null;
    const ingredients = Array.isArray(hit.dietaryIngredients)
      ? hit.dietaryIngredients.map((i) => i.ingredientName || i.name).filter(Boolean).slice(0, 8)
      : [];
    return {
      verified: true,
      brand: hit.brandName || hit.manufacturerName || '',
      ingredients,
      dsldId: hit.dsldId || '',
      imageUrl: (hit.imageUrl || '').startsWith('https://') ? hit.imageUrl : '',
      labelUrl: hit.dsldId ? `https://dsld.od.nih.gov/product-label/${hit.dsldId}` : '',
    };
  } catch {
    return null;
  }
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

CLINICAL AUTHORITY SOURCES:
When generating recommendations and writing whyItWorks and considerations, ground your reasoning in guidance from these authoritative sources where relevant:
- ACOG (American College of Obstetricians and Gynecologists) — the gold standard for OB/GYN clinical guidance in the US. Reference ACOG guidance for: menstrual disorders, PCOS, endometriosis, menopause, perimenopause, fertility, contraception, postpartum health, UTIs, and pelvic floor conditions.
- UpToDate — evidence-based clinical decision support used by clinicians at point of care. Reference when describing how clinicians approach a condition or product category.
- OpenEvidence — medical AI grounded in NEJM, JAMA, NCCN, Cochrane, and peer-reviewed literature. Reference when describing the quality of evidence for a product category.
- NIH Office of Dietary Supplements — the authoritative US source for supplement safety, ingredient data, and evidence quality. Reference for all supplement recommendations.
- FDA — device safety, recall status, and regulatory standing for devices and period care products.
- PubMed / NCBI — peer-reviewed biomedical literature. Reference when describing the research base for a product category.
- Cochrane Reviews — systematic review evidence for supplement and device categories.

HOW TO REFERENCE THESE SOURCES:
- In whyItWorks: include one short phrase grounding the recommendation in clinical evidence, e.g. "consistent with ACOG guidance on PCOS management" or "aligned with NIH ODS evidence on magnesium for menstrual pain"
- In considerations: reference ACOG or FDA guidance when flagging safety concerns, e.g. "ACOG advises discussing with your clinician before starting" or "FDA has no active recalls for this product category"
- In notes: include a source-grounded note where relevant, e.g. "ACOG recommends tracking symptoms before trying supplements for menstrual disorders"
- NEVER fabricate a specific bulletin number, PMID, guideline number, or direct quote
- ONLY say "consistent with" or "aligned with" or "supported by" — never claim to be directly quoting
- Only reference an organization when you are confident their guidance genuinely covers this area

EDITORIAL REVIEW SOURCES:
When selecting products, factor in evaluations from trusted independent reviewers:
- NYT Wirecutter — lab-tested reviews for menstrual products (period underwear, tampons, cups, discs), fitness trackers, and health gear. If a product is a Wirecutter top pick or has been positively reviewed there, mention it in whyItWorks.
- InStyle — expert-tested reviews for period underwear and personal care products.
If a recommended product was reviewed or tested by these outlets, note it briefly (e.g. "Wirecutter top pick" or "reviewed favorably by independent outlets"). This helps users trust the recommendation.

PRODUCT SELECTION PROCESS — follow this for every concern:
1. Identify what category of product would genuinely help this user's specific concern and profile
2. Draw on your full knowledge of ALL brands that make products in that category — large mainstream brands, small indie brands, DTC brands, clinical brands, everything
3. Rank candidates by: (a) clinical reputation and safety record, (b) relevance to this user's specific conditions and preferences, (c) availability in the US market, (d) user and community reputation, (e) independent editorial reviews (e.g. Wirecutter, InStyle)
4. Recommend the single best match — not the most popular product, the most relevant one for her specific profile

TASK:
For each of her primary concerns, generate MULTIPLE solution tracks (at least 3 when realistic for that concern), such as:
- supplement / wellness
- physical device or product
- digital or telehealth
- any additional clinically relevant track

Each solution track must include:
- one top product
- exactly 3 alternatives

Prioritize tracks that are genuinely useful for that specific concern and profile. If a track is not clinically relevant for a specific concern, skip it.

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
- Never recommend tranexamic acid products (including Lysteda)
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
      "tiers": [
        {
          "id": "tier-supplement",
          "name": "Supplement option",
          "subcategory": "supplement",
          "matchExplanation": "1-2 sentences on why this solution type fits this user profile for this concern",
          "safetyFlags": ["optional warning"],
          "product": {
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
          ]
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

function getProviderOrder() {
  return (process.env.AI_RECOMMENDATIONS_PROVIDER_ORDER || 'anthropic,openai,gemini')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

async function callProvider(provider, prompt) {
  if (provider === 'openai') return callOpenAI(prompt);
  if (provider === 'anthropic' || provider === 'claude') return callAnthropic(prompt);
  if (provider === 'gemini' || provider === 'google') return callGemini(prompt);
  return null;
}

function extractBalancedJsonObject(input) {
  const s = String(input || '');
  const start = s.indexOf('{');
  if (start === -1) return '';
  let depth = 0;
  let inString = false;
  let escaping = false;
  for (let i = start; i < s.length; i += 1) {
    const ch = s[i];
    if (inString) {
      if (escaping) escaping = false;
      else if (ch === '\\') escaping = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return '';
}

function tryParseJsonCandidate(raw) {
  const text = String(raw || '')
    .replace(/^\uFEFF/, '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
  if (!text) return null;
  const balanced = extractBalancedJsonObject(text);
  const candidates = [text, balanced].filter(Boolean);
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        const fixed = candidate.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(fixed);
      } catch {
        // continue
      }
    }
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
  const order = getProviderOrder();
  let parsed = null;
  let providerUsed = '';
  let lastRaw = '';
  for (const provider of order) {
    const raw = await callProvider(provider, prompt);
    if (!raw) continue;
    lastRaw = raw;
    const parsedAttempt = tryParseJsonCandidate(raw);
    console.log(
      'AI provider tried:',
      provider,
      '| Response length:',
      String(raw || '').length,
      '| First 200 chars:',
      String(raw || '').slice(0, 200),
      '| Parsed:',
      !!parsedAttempt
    );
    if (parsedAttempt) {
      parsed = parsedAttempt;
      providerUsed = provider;
      break;
    }
  }

  if (!lastRaw) {
    return res.status(503).json({
      error: 'no_ai_response',
      message: 'Could not generate recommendations. Check your API key and quota.',
    });
  }

  if (!parsed || typeof parsed !== 'object') {
    console.error('JSON parse error after all providers. Last raw (first 800 chars):', String(lastRaw || '').slice(0, 800));
    return res.status(200).json({
      recommendations: [],
      providerUsed: providerUsed || null,
      generatedAt: new Date().toISOString(),
      warning: 'parse_error_fallback',
      message: 'AI response was malformed; returned fallback recommendations.',
    });
  }

  const recs = enrichRecommendations(parsed?.recommendations);

  const verifiedRecs = await Promise.all(
    recs.map(async (entry) => {
      const product = entry.topProduct;
      if (!product || product.type === 'digital') return entry;
      if (!/(supplement|vitamin|mineral|probiotic)/i.test(product.category || '')) return entry;
      const dsld = await lookupDsldProduct(product.name);
      if (!dsld) return entry;
      return {
        ...entry,
        topProduct: {
          ...product,
          brand: dsld.brand || product.brand,
          image: dsld.imageUrl || product.image || '',
          url: dsld.labelUrl || product.url,
          dsldVerified: true,
          dsldId: dsld.dsldId,
          summary:
            dsld.ingredients.length > 0
              ? `${product.summary} Key ingredients: ${dsld.ingredients.slice(0, 4).join(', ')}.`
              : product.summary,
          safety: {
            ...product.safety,
            materials: dsld.ingredients.slice(0, 5).join(', ') || product.safety?.materials || '',
            recalls: product.safety?.recalls || 'No active FDA recalls on file',
          },
        },
      };
    })
  );

  return res.status(200).json({
    recommendations: verifiedRecs,
    providerUsed,
    generatedAt: new Date().toISOString(),
  });
}
