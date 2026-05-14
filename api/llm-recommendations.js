/* global process */
import { retrieveKnowledgeForIntake, buildKnowledgeContext } from '../src/utils/ragRetrieval.js';

function anyApiKeyConfigured() {
  return !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

function selectedConcerns(intake = {}) {
  const blocked = new Set(['general discomfort', 'other']);
  const concerns = new Set();

  // 1. Explicitly selected by user
  const explicit = Array.isArray(intake.primaryConcerns) ? intake.primaryConcerns : (intake.primaryConcern ? [intake.primaryConcern] : []);
  for (const c of explicit) {
    const v = String(c || '').trim();
    if (v && !blocked.has(v.toLowerCase())) concerns.add(v);
  }

  const conditions = (Array.isArray(intake.conditions) ? intake.conditions : []).map(c => String(c).toLowerCase());
  const symptoms   = (Array.isArray(intake.symptoms)   ? intake.symptoms   : []).map(s => String(s).toLowerCase());
  const goals      = (Array.isArray(intake.goals)      ? intake.goals      : []).map(g => String(g).toLowerCase());
  const allText    = [...conditions, ...symptoms, ...goals, String(intake.dislikedProductsText || ''), String(intake.currentMedications || '')].join(' ').toLowerCase();
  const has = (...terms) => terms.some(t => allText.includes(t));
  const hasConcern = (substr) => [...concerns].some(c => c.toLowerCase().includes(substr));

  // 2. Derive from conditions
  if (conditions.some(c => c.includes('pcos')) && !hasConcern('pcos'))
    concerns.add('PCOS management (supplements, telehealth, apps)');
  if (conditions.some(c => c.includes('endometriosis')) && !hasConcern('endometriosis'))
    concerns.add('Endometriosis management (supplements, devices, telehealth)');
  if (conditions.some(c => c.includes('thyroid') || c.includes('hypothyroid') || c.includes('hyperthyroid')) && !hasConcern('hormone balance'))
    concerns.add('Hormone balance (supplements, lifestyle)');

  // 3. Derive from symptoms
  if (symptoms.some(s => s.includes('bloat')) && !hasConcern('bloat'))
    concerns.add('Hormonal bloating');
  if (symptoms.some(s => s.includes('cramp')) && !hasConcern('cramp'))
    concerns.add('Cramp and pain relief (devices, supplements, heat)');
  if (symptoms.some(s => s.includes('fatigue') || s.includes('energy')) && !hasConcern('sleep'))
    concerns.add('Sleep and energy');
  if (symptoms.some(s => s.includes('mood') || s.includes('anxiety') || s.includes('depression')) && !hasConcern('mental'))
    concerns.add('Mental health and cycle mood support');
  if (symptoms.some(s => s.includes('acne') || s.includes('hair loss') || s.includes('hair thin')) && !hasConcern('skin'))
    concerns.add('Skin and hair (hormone-related)');
  if (symptoms.some(s => s.includes('insomnia') || s.includes('sleep')) && !hasConcern('sleep'))
    concerns.add('Sleep and energy');

  // 4. Derive from signals / other intake fields
  if ((intake.tryingToConceive === 'yes' || has('conceive', 'ttc', 'fertility')) && !hasConcern('fertil'))
    concerns.add('Fertility and conception (supplements, trackers, telehealth)');
  if ((/\buti(s)?\b/.test(allText) || allText.includes('urinary tract')) && !hasConcern('uti'))
    concerns.add('UTI support');
  if (has('vaginal', 'ph balance', 'bacterial vaginosis', 'bv', 'yeast') && !hasConcern('vaginal') && !hasConcern('gut'))
    concerns.add('Gut and vaginal health (probiotics, pH balance)');
  if ((intake.menstrualCycle === 'irregular' || intake.menstrualCycle === 'irregular_perimenopause') && !hasConcern('hormone') && !hasConcern('pcos'))
    concerns.add('Hormone balance (supplements, lifestyle)');
  if ((intake.menstrualCycle === 'no_menopause' || intake.menstrualCycle === 'irregular_perimenopause') && !hasConcern('menopause'))
    concerns.add('Perimenopause and menopause support');

  // 5. Direct goal → concern mapping — every selected goal gets its own product track
  // "find safer products" and "reduce chemical exposure" are NOT separate tracks —
  // they are cross-cutting preferences injected into every prompt instead (see buildPromptForOneConcern).
  const GOAL_CONCERN = {
    'track my cycle':                                    'Cycle tracking (apps, wearables, devices)',
    'learn what ingredients to avoid for my conditions': null, // cross-cutting preference, not a separate concern
    'find a provider or specialist':                     'Telehealth and specialist matching',
    'find mental health support for cycle symptoms':     'Mental health and cycle mood support',
    'improve my gut or vaginal health':                  'Gut and vaginal health (probiotics, pH balance)',
    'support fertility / ttc':                           'Fertility and conception (supplements, trackers, telehealth)',
    'manage perimenopause or menopause':                 'Perimenopause and menopause support',
    'build my health routine':                           'Women\'s health apps and services for building a health routine (cycle tracking, wellness coaching, health platforms)',
    'manage symptoms':                                   null, // covered by primaryConcerns + symptom derivation
    'understand my condition':                           null, // covered by condition-specific tracks above
    'find safer products':                               null,
    'reduce chemical exposure':                          null,
  };
  for (const g of goals) {
    const mapped = GOAL_CONCERN[g.trim()];
    if (mapped && !hasConcern(mapped.toLowerCase().slice(0, 20))) concerns.add(mapped);
  }

  const result = [...concerns].filter(c => !blocked.has(c.toLowerCase()));
  return result.length ? result : [];
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
    healthFunctions: undefined, // always computed client-side from concern; strip any LLM-generated value
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
  const knowledgeChunks = retrieveKnowledgeForIntake(intake, 8);
  const knowledgeContext = buildKnowledgeContext(knowledgeChunks);

  return `
You are Ayna's clinical recommendation engine. Ayna is a women's health platform that operates at the intersection of clinical accuracy and consumer accessibility.

YOUR ROLE:
You are acting as a knowledgeable women's health clinical advisor. Reason the way a skilled OB/GYN or women's health specialist would during an intake assessment — reading the full clinical picture, identifying the most likely mechanisms, knowing what's within OTC scope and what warrants professional evaluation. Ayna is not a licensed clinician and cannot diagnose or prescribe. But your recommendations must be as accurate, evidence-based, and personalized as a specialist's guidance.

You CAN: make clinical inferences from symptom patterns and history, recommend OTC supplements and products grounded in clinical evidence, recommend appropriate telehealth specialists, explain clinical mechanisms, flag when a symptom pattern warrants professional evaluation before an OTC approach.

You CANNOT: diagnose, prescribe medications, or guarantee outcomes.

CLINICAL INTAKE — treat this like a specialist's first appointment:
- Age: ${intake?.age || 'unknown'}
- Location: ${intake?.location || 'unknown'}
- Insurance: ${intake?.insurancePlan || 'not provided'}
- Primary concerns: ${concerns.join(', ') || 'none provided'}
- Additional concerns: ${(Array.isArray(intake?.customConcerns) ? intake.customConcerns : []).join(', ') || 'none'}
- Diagnosed conditions: ${(Array.isArray(intake?.conditions) ? intake.conditions : []).join(', ') || 'none'}
- Family history: ${(Array.isArray(intake?.familyHistory) ? intake.familyHistory : []).join(', ') || 'not provided'}
- Symptom duration: ${intake?.symptomDuration || 'not provided'}
- Last OB/GYN visit: ${intake?.lastObgynVisit || 'not provided'}
- Current medications & supplements: ${intake?.currentMedications || 'none listed'}
- Menstrual cycle status: ${intake?.menstrualCycle || 'unknown'}
- Flow level: ${intake?.flowLevel || 'unknown'}
- Pain level: ${intake?.painLevel ? `${intake.painLevel}/10` : 'unknown'}
- Symptoms: ${(Array.isArray(intake?.symptoms) ? intake.symptoms : []).join(', ') || 'none'}
- Trying to conceive: ${intake?.tryingToConceive || 'unknown'}
- Hormonal birth control: ${intake?.hormonalBirthControl || 'unknown'}${intake?.hormonalBirthControlType ? ` (${intake.hormonalBirthControlType})` : ''}
- Product preferences (hard filters): ${(Array.isArray(intake?.productPreferences) ? intake.productPreferences : []).join(', ') || 'none'}
- Tried and disliked: ${intake?.dislikedProductsText || 'none'} — reason: ${intake?.dislikedReason || 'none'}
- Goals: ${(Array.isArray(intake?.goals) ? intake.goals : []).join(', ') || 'none'}
- Wearable / health app data: ${intake?.wearableSummary?.text || intake?.healthDataText || 'none provided'}
- Concern-specific details: ${JSON.stringify(concernFollowups)}

CLINICAL REASONING — do this before generating recommendations:
1. What does the clinical picture suggest? Read the full intake the way a specialist would — symptoms + conditions + family history + duration together, not each in isolation.
2. What are the most likely underlying mechanisms driving her concerns?
3. Does she have enough diagnostic information for an OTC approach to be appropriate, or does she need labs/evaluation first? (e.g., PCOS without knowing insulin status, unexplained heavy flow, severe pain — these may warrant telehealth as the primary recommendation)
4. What OTC interventions have solid clinical evidence for her specific presentation, not just for her condition label?
5. What drug interactions or contraindications apply given her current medications?
6. Is there a specialist she should see? Which type?

LEARNING SIGNALS:
- Products she has saved: ${(feedback?.trackedProductIds || []).join(', ') || 'none'}
- Products already in her ecosystem: ${(feedback?.ecosystemProductIds || []).join(', ') || 'none'}
- Products she has hidden: ${(feedback?.omittedProductIds || []).join(', ') || 'none'}
- Times she has used Ayna: ${feedback?.learningMemory?.interactionCount || 0}
- Last concerns she viewed: ${(feedback?.learningMemory?.lastConcerns || []).join(', ') || 'none'}

${knowledgeContext ? `${knowledgeContext}\n\n` : ''}PRODUCT SELECTION PROCESS — follow this for every concern:
1. Read the clinical knowledge base above carefully — it contains ACOG guidance, NIH ODS evidence, and safety information specific to this user's conditions
2. Identify what the clinical knowledge says about this concern for this specific user's profile
3. Draw on your full knowledge of ALL brands that make products in that category — large mainstream, small indie, DTC, clinical brands
4. Rank candidates by: (a) alignment with clinical guidance above, (b) ingredient safety for her specific conditions, (c) relevance to her profile, (d) availability in the US market
5. Recommend the single best match — grounded in the clinical knowledge provided, not just general AI memory

CLINICAL REASONING FRAMEWORK — apply your medical training, not hardcoded rules:

SCOPE LIMITS — Ayna is a health educator and product platform, not a clinician:
- Never recommend prescription medications by name. If a condition may warrant prescription treatment, recommend a telehealth service that can evaluate and prescribe. Say: "a telehealth provider who specializes in [condition] can assess whether medication is right for you."
- OTC supplements, devices, apps, and telehealth services are all within scope.

WHEN TO LEAD WITH TELEHEALTH:
- When a supplement's appropriateness depends on labs or diagnostics the user hasn't mentioned having (e.g., PCOS without A1c or insulin sensitivity data), lead with the telehealth track. Note what testing would clarify which product approach fits this person. For example: "Inositol is most beneficial for insulin-resistant PCOS — a telehealth provider can run labs to confirm whether this fits you" rather than recommending inositol blindly.
- When a condition presents with unexplained or severe symptoms, recommend clinical evaluation first.
- High pain (8+/10): always include telehealth as a primary recommendation — that level of pain warrants clinical evaluation, not just products.

INGREDIENT & SAFETY SCREENING — use clinical judgment, not a list:
- Apply your full clinical knowledge to screen products for each user's specific conditions. Flag problematic ingredients proactively based on what you know about the condition, not a hardcoded rule.
- For any condition with known endocrine or ingredient sensitivities, apply that knowledge and explain WHY it matters for this user's specific profile.
- For fertility/TTC: apply your knowledge of what is contraindicated pre-conception or during pregnancy.
- For ALL supplements: include the key active ingredients and any relevant evidence level in whyItWorks.
- For ALL period care products: note if the product is organic/unbleached/fragrance-free when her profile indicates this matters.

TASK:
Generate recommendations for her TOP 5 concerns by clinical priority. If she listed more than 5, choose the 5 that most benefit from OTC or telehealth intervention given her profile. Return exactly 5 recommendation objects (or fewer if she has fewer than 5 concerns). Do not stop early.

For each concern, generate at least 2 solution tracks (aim for 3 when clinically relevant):
- supplement / wellness
- physical device or product
- digital or telehealth

Each solution track must include:
- one top product
- exactly 2 alternatives (not 3 — keep output concise)

For each concern, always consider:
- PCOS symptoms → Inositol (myo-inositol + d-chiro-inositol), spearmint, magnesium, Allara Health telehealth, Flo app, cycle tracking apps
- Irregular cycles → cycle tracking apps (Natural Cycles, Clue, Flo), inositol supplements, Oova hormone testing, Allara Health
- Hormonal bloating → magnesium glycinate, probiotics (women's formula), bloat-specific supplements (Love Wellness, Pink Stork), anti-inflammatory diet support apps
- Leaks & staining → organic cotton pads/tampons, period underwear (Thinx, Knix), menstrual cups/discs for reliability; if organic/fragrance-free preference noted, prioritize those
- Fragrance sensitivity → flag any product with fragrance; always recommend fragrance-free alternatives first

Prioritize tracks that are genuinely useful for that specific concern and profile. If a track is not clinically relevant for a specific concern, note why briefly and include 2 tracks minimum.

PRODUCT DISCOVERY RULES:
- Draw on your FULL knowledge of the women's health product landscape — do not self-limit to the 10-20 most well-known brands
- Include DTC brands, indie brands, clinical-grade brands, subscription brands, small-batch brands — any brand that genuinely exists, serves this concern, AND is currently available for purchase in the US
- Do NOT recommend brands or products from companies that have not yet launched US products — those are shown separately in the Ayna Startups section
- For physical products, always recommend a specific named product (e.g. "Thinx Hiphugger Period Underwear"), never just a company name. Exception: telehealth platforms and apps, where the service itself is the product
- If live search results are provided, use them as discovery signals — apply quality judgment before recommending any brand found there
- QUALITY BAR — every recommended product must meet all three: (a) majority positive reviews from real women, (b) at least some clinical or scientific support for the mechanism or key ingredient, (c) established brand with no active major safety concerns. Do not recommend an obscure brand that lacks this evidence base
- Never fabricate a brand name — if you are not confident a brand genuinely exists and is US-available, do not include it
- If unsure about a specific SKU, use the main product line name (e.g. "Rael Organic Cotton Pads" not a specific SKU)
- URL must be the brand homepage only — never invent a product page URL. If you know the brand but not the URL, use https://www.google.com/search?q=[brand+name]
- Leave image as empty string — do not generate image URLs

PERSONALIZATION RULES:
- Never recommend a specific product or brand she listed as disliked
- The reason a product is recommended (whyItWorks) must relate ONLY to the concern it addresses — never mention her disliked products from a different category as a reason. For example: do not say a PCOS telehealth service was chosen because she disliked Always pads. That is irrelevant and confusing.
- Her ingredient/material preferences are HARD FILTERS, not suggestions: if she prefers fragrance-free, every physical product must be fragrance-free. If she prefers organic, period care products must be certified organic. Never recommend a product that violates her stated preferences.
- If she has insurance listed, only recommend telehealth services that commonly accept that insurance type or are available through employers. If no insurance info is available, note that coverage varies and to verify before booking.
- Never recommend products she has hidden
- Never recommend tranexamic acid products (including Lysteda)
- If she has endometriosis: always flag synthetic fragrances, dioxins, chlorine bleaching, BPA
- If she has PCOS: prioritize hormone-balancing products; flag endocrine disruptors
- If she is trying to conceive: flag supplements contraindicated in pregnancy
- If pain level is 8 or higher: always include a telehealth recommendation
- Only generate concerns she actually has — match concern labels exactly to what she selected
- Never say "treats" or "cures" — say "may help with"
- Every whyItWorks must do TWO things: (1) briefly explain HOW this product works mechanically or clinically for this type of concern (the mechanism), and (2) reference at least one specific detail from her profile (the personal fit). Example: "Pelvic wands apply targeted pressure to myofascial trigger points that cause referred period pain — given your reported 8/10 pain level, muscle tension is likely a significant contributor to your cramps." Keep to 2-3 sentences. Never just say "this fits your X concern" without explaining the mechanism.
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
          "safetyFlags": ["only include if this specific product actually contains a flagged ingredient — do NOT flag fragrance-free, organic, or clean-label products with fragrance/paraben warnings"],
          "product": {
            "id": "brand-productname-slug",
            "name": "Exact real product name",
            "brand": "Brand name",
            "category": "category",
            "type": "physical or digital",
            "summary": "1-2 sentences describing what this product is",
            "whyItWorks": "2 sentences: mechanism + her profile fit",
            "considerations": "1 sentence on safety or ingredient notes. Empty string if none.",
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

// ─── Live product web search via Serper ──────────────────────────────────────

async function searchProductsForConcerns(concerns, intake) {
  const serperKey = process.env.SERPER_API_KEY;
  if (!serperKey || !concerns.length) return null;

  const prefs = Array.isArray(intake?.productPreferences)
    ? intake.productPreferences.slice(0, 3).join(' ')
    : '';
  const conditions = Array.isArray(intake?.conditions)
    ? intake.conditions.filter((c) => c !== 'none' && c !== 'other').slice(0, 2).join(' ')
    : '';
  const location = intake?.location ? intake.location : 'US';

  const results = {};

  await Promise.all(
    concerns.slice(0, 5).map(async (concern) => {
      const cleanConcern = concern.replace(/\(.*?\)/g, '').trim();
      const query = [
        `best ${cleanConcern} product women`,
        conditions && `${conditions}`,
        prefs && `${prefs}`,
        `2024 2025 brand`,
      ]
        .filter(Boolean)
        .join(' ');

      try {
        const r = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: query, num: 8, gl: 'us' }),
          signal: AbortSignal.timeout(5000),
        });
        if (!r.ok) return;
        const data = await r.json();
        const hits = (data?.organic || [])
          .filter((h) => h.title && h.snippet)
          .slice(0, 6)
          .map((h) => ({ title: h.title, snippet: h.snippet.slice(0, 180), url: h.link || '' }));
        if (hits.length) results[concern] = hits;
      } catch {
        // search failure is non-fatal
      }
    })
  );

  return Object.keys(results).length ? results : null;
}

function formatSearchContext(searchResults) {
  if (!searchResults) return '';
  const lines = [
    '',
    'LIVE PRODUCT SEARCH RESULTS (real-time — use these to discover products and brands beyond your training data):',
  ];
  for (const [concern, hits] of Object.entries(searchResults)) {
    lines.push(`\n${concern}:`);
    hits.forEach((h, i) => {
      lines.push(`  ${i + 1}. ${h.title}`);
      if (h.snippet) lines.push(`     ${h.snippet}`);
      if (h.url) lines.push(`     Source: ${h.url}`);
    });
  }
  lines.push('');
  lines.push('Use these results to DISCOVER brands and products you may not have in training data — but still apply quality judgment before recommending.');
  lines.push('Only include a brand from search results if you have enough knowledge to confirm it meets the quality bar: real company, majority positive women\'s reviews, clinical or scientific backing for the mechanism.');
  lines.push('A brand appearing in search results is a signal to investigate, not an automatic endorsement.');
  return lines.join('\n');
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
      max_tokens: 4000,
      temperature: 0.2,
      system: 'Return a single valid JSON object only. No markdown code fences.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.content?.[0]?.text || null;
}

function getProviderOrder() {
  return (process.env.AI_RECOMMENDATIONS_PROVIDER_ORDER || 'anthropic,openai')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

async function callProvider(provider, prompt) {
  if (provider === 'openai') return callOpenAI(prompt);
  if (provider === 'anthropic' || provider === 'claude') return callAnthropic(prompt);
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

// ─── Concurrency limiter ──────────────────────────────────────────────────────
async function mapConcurrent(items, fn, limit = 4) {
  const results = new Array(items.length).fill(null);
  let nextIdx = 0;
  async function worker() {
    while (nextIdx < items.length) {
      const i = nextIdx++;
      try { results[i] = await fn(items[i], i); } catch { results[i] = null; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ─── Per-concern search context ───────────────────────────────────────────────
function formatSearchContextForConcern(concern, hits) {
  if (!hits?.length) return '';
  const lines = [`\nLIVE SEARCH for "${concern}":`];
  hits.forEach((h, i) => {
    lines.push(`  ${i + 1}. ${h.title}`);
    if (h.snippet) lines.push(`     ${h.snippet}`);
    if (h.url) lines.push(`     Source: ${h.url}`);
  });
  lines.push('Use as discovery signal only — quality bar still applies.');
  return lines.join('\n');
}

// ─── Single-concern prompt ────────────────────────────────────────────────────
function buildPromptForOneConcern(concern, intake = {}, feedback = {}, searchHits = null) {
  const concernFollowup = intake?.concernFollowups?.[concern];
  const knowledgeChunks = retrieveKnowledgeForIntake({ ...intake, primaryConcerns: [concern] }, 4);
  const knowledgeContext = buildKnowledgeContext(knowledgeChunks);

  const goals = (Array.isArray(intake?.goals) ? intake.goals : []).map(g => String(g).toLowerCase().trim());
  const wantsSaferProducts = goals.some(g => g === 'find safer products' || g === 'reduce chemical exposure' || g === 'learn what ingredients to avoid for my conditions');
  const saferProductsInstruction = wantsSaferProducts
    ? '\nSAFER PRODUCTS PREFERENCE (applies to ALL recommendations): This user wants to avoid chemical exposure and find safer products. For every physical product recommended, prioritize: certified organic, fragrance-free, unbleached/chlorine-free, BPA-free, clean-label options. Flag any ingredient concerns proactively. This is a hard preference across all tracks.'
    : '';

  return `
You are Ayna's clinical recommendation engine. Reason like a skilled OB/GYN or women's health specialist.

You CAN: make clinical inferences, recommend OTC products and supplements grounded in evidence, recommend telehealth specialists, explain mechanisms.
You CANNOT: diagnose, prescribe medications, or guarantee outcomes.

PATIENT PROFILE:
- Age: ${intake?.age || 'unknown'}, Location: ${intake?.location || 'unknown'}, Insurance: ${intake?.insurancePlan || 'not provided'}
- All concerns: ${selectedConcerns(intake).join(', ') || 'none'}
- Conditions: ${(Array.isArray(intake?.conditions) ? intake.conditions : []).join(', ') || 'none'}
- Family history: ${(Array.isArray(intake?.familyHistory) ? intake.familyHistory : []).join(', ') || 'not provided'}
- Symptom duration: ${intake?.symptomDuration || 'not provided'}, Last OB/GYN: ${intake?.lastObgynVisit || 'not provided'}
- Medications: ${intake?.currentMedications || 'none'}
- Cycle: ${intake?.menstrualCycle || 'unknown'}, Flow: ${intake?.flowLevel || 'unknown'}, Pain: ${intake?.painLevel ? `${intake.painLevel}/10` : 'unknown'}
- Symptoms: ${(Array.isArray(intake?.symptoms) ? intake.symptoms : []).join(', ') || 'none'}
- TTC: ${intake?.tryingToConceive || 'unknown'}, Birth control: ${intake?.hormonalBirthControl || 'unknown'}${intake?.hormonalBirthControlType ? ` (${intake.hormonalBirthControlType})` : ''}
- Preferences (hard filters): ${(Array.isArray(intake?.productPreferences) ? intake.productPreferences : []).join(', ') || 'none'}
- Tried and disliked: ${intake?.dislikedProductsText || 'none'} — reason: ${intake?.dislikedReason || 'none'}
- Goals: ${(Array.isArray(intake?.goals) ? intake.goals : []).join(', ') || 'none'}
- Wearable data: ${intake?.wearableSummary?.text || intake?.healthDataText || 'none'}
- Ecosystem (already has): ${(feedback?.ecosystemProductIds || []).join(', ') || 'none'}
- Hidden products: ${(feedback?.omittedProductIds || []).join(', ') || 'none'}
${knowledgeContext ? `\nCLINICAL KNOWLEDGE:\n${knowledgeContext}` : ''}${searchHits ? '\n' + formatSearchContextForConcern(concern, searchHits) : ''}

SCOPE: Never name prescription medications. If a concern requires diagnosis or labs, lead with telehealth. Pain 8+/10: always include telehealth.${saferProductsInstruction}

QUALITY BAR: Every product must have (a) majority positive reviews from real women, (b) clinical/scientific support for the mechanism, (c) established US-available brand. No fabricated brands.

PERSONALIZATION:
- Product preferences are HARD FILTERS — if she prefers organic/fragrance-free, every physical product must meet that.
- Never recommend a brand she listed as disliked.
- whyItWorks must be in plain everyday language — no medical jargon. Explain: (1) simply how the product works (mechanism in lay terms), (2) why it fits her specific profile (condition, pain level, preference), (3) what makes it the top pick over the alternatives. A user should read this and immediately understand why you chose THIS product for HER over everything else available.
- Recommend specific product names (e.g. "Thinx Hiphugger Period Underwear"), not company names. Exception: telehealth platforms and apps.
- Never recommend products she has hidden.
- Never recommend tranexamic acid products.

TASK: Generate recommendations for this ONE concern only: "${concern}"${concernFollowup ? `\nUser context: ${JSON.stringify(concernFollowup)}` : ''}

Generate exactly 3 solution tracks for this concern: (1) supplement or wellness product, (2) physical device or period care product, (3) app or telehealth service. If a track isn't clinically relevant for this concern, substitute another meaningful product type. Each track: 1 top product + 2 brief alternatives.

Return ONLY valid JSON — exactly this shape:
{
  "recommendations": [
    {
      "concern": "${concern}",
      "tiers": [
        {
          "id": "tier-supplement",
          "name": "Supplement or wellness",
          "subcategory": "supplement",
          "matchExplanation": "1 sentence",
          "safetyFlags": [],
          "product": { "id": "slug", "name": "Name", "brand": "Brand", "category": "supplement", "type": "physical", "summary": "1-2 sentences", "whyItWorks": "2 sentences: mechanism + personal fit", "considerations": "", "price": "$XX", "image": "", "url": "https://brand.com", "safety": { "recalls": "No known recalls", "materials": "", "sideEffects": "", "opinionAlerts": "" }, "clinicianOpinionSource": "", "clinicianAttribution": "" },
          "alternatives": [
            { "id": "a1", "name": "Alt 1", "brand": "Brand", "summary": "1 sentence", "whyItWorks": "1 sentence", "price": "$XX", "type": "physical", "image": "", "url": "https://brand.com", "safety": { "recalls": "No known recalls", "materials": "", "sideEffects": "", "opinionAlerts": "" } },
            { "id": "a2", "name": "Alt 2", "brand": "Brand", "summary": "1 sentence", "whyItWorks": "1 sentence", "price": "$XX", "type": "physical", "image": "", "url": "https://brand.com", "safety": { "recalls": "No known recalls", "materials": "", "sideEffects": "", "opinionAlerts": "" } }
          ]
        },
        {
          "id": "tier-physical",
          "name": "Physical product or device",
          "subcategory": "physical product",
          "matchExplanation": "1 sentence",
          "safetyFlags": [],
          "product": { "id": "slug2", "name": "Name", "brand": "Brand", "category": "device", "type": "physical", "summary": "1-2 sentences", "whyItWorks": "2 sentences: mechanism + personal fit", "considerations": "", "price": "$XX", "image": "", "url": "https://brand.com", "safety": { "recalls": "No known recalls", "materials": "", "sideEffects": "", "opinionAlerts": "" }, "clinicianOpinionSource": "", "clinicianAttribution": "" },
          "alternatives": [
            { "id": "a3", "name": "Alt 3", "brand": "Brand", "summary": "1 sentence", "whyItWorks": "1 sentence", "price": "$XX", "type": "physical", "image": "", "url": "https://brand.com", "safety": { "recalls": "No known recalls", "materials": "", "sideEffects": "", "opinionAlerts": "" } },
            { "id": "a4", "name": "Alt 4", "brand": "Brand", "summary": "1 sentence", "whyItWorks": "1 sentence", "price": "$XX", "type": "physical", "image": "", "url": "https://brand.com", "safety": { "recalls": "No known recalls", "materials": "", "sideEffects": "", "opinionAlerts": "" } }
          ]
        },
        {
          "id": "tier-digital",
          "name": "App or telehealth",
          "subcategory": "telehealth",
          "matchExplanation": "1 sentence",
          "safetyFlags": [],
          "product": { "id": "slug3", "name": "Name", "brand": "Brand", "category": "telehealth", "type": "digital", "summary": "1-2 sentences", "whyItWorks": "2 sentences: mechanism + personal fit", "considerations": "", "price": "Free or $XX/mo", "image": "", "url": "https://brand.com", "safety": { "recalls": "No known recalls", "materials": "", "sideEffects": "", "opinionAlerts": "" }, "clinicianOpinionSource": "", "clinicianAttribution": "" },
          "alternatives": [
            { "id": "a5", "name": "Alt 5", "brand": "Brand", "summary": "1 sentence", "whyItWorks": "1 sentence", "price": "Free or $XX/mo", "type": "digital", "image": "", "url": "https://brand.com", "safety": { "recalls": "No known recalls", "materials": "", "sideEffects": "", "opinionAlerts": "" } },
            { "id": "a6", "name": "Alt 6", "brand": "Brand", "summary": "1 sentence", "whyItWorks": "1 sentence", "price": "Free or $XX/mo", "type": "digital", "image": "", "url": "https://brand.com", "safety": { "recalls": "No known recalls", "materials": "", "sideEffects": "", "opinionAlerts": "" } }
          ]
        }
      ],
      "notes": []
    }
  ]
}`.trim();
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

  // Wrap everything so unhandled throws return a useful error instead of Vercel's opaque 500
  try {
    return await handleRequest(req, res);
  } catch (e) {
    console.error('[LLM API] Unhandled error:', e?.message, e?.stack?.slice(0, 400));
    return res.status(500).json({ error: e?.message || String(e), type: 'unhandled_exception' });
  }
}

async function handleRequest(req, res) {

  if (!anyApiKeyConfigured()) {
    return res.status(503).json({
      error: 'not_configured',
      message: 'No LLM API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.',
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

  const allConcerns = selectedConcerns(intake);
  // Slice to the requested batch if batchIndex + batchSize provided
  const batchIndex = Number.isInteger(body?.batchIndex) ? body.batchIndex : 0;
  const batchSize  = Number.isInteger(body?.batchSize)  && body.batchSize > 0 ? body.batchSize : null;
  const concerns = batchSize !== null
    ? allConcerns.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize)
    : allConcerns;

  if (!concerns.length) {
    return res.status(200).json({ recommendations: [], concernsTotal: allConcerns.length, providerUsed: null, generatedAt: new Date().toISOString() });
  }

  const searchResults = await searchProductsForConcerns(concerns, intake);
  const order = getProviderOrder();

  const perConcernResults = await mapConcurrent(
    concerns,
    async (concern) => {
      const searchHits = searchResults?.[concern] || null;
      const prompt = buildPromptForOneConcern(concern, intake, feedback, searchHits);
      for (const provider of order) {
        const raw = await callProvider(provider, prompt);
        if (!raw) continue;
        const parsed = tryParseJsonCandidate(raw);
        console.log('Concern:', concern, '| Provider:', provider, '| Length:', String(raw || '').length, '| Parsed:', !!parsed);
        if (parsed) return { parsed, provider };
      }
      console.warn('No parseable response for concern:', concern);
      return null;
    },
    5  // up to 5 concurrent — matches the max batch size so all concerns run in parallel
  );

  const providerUsed = perConcernResults.find((r) => r?.provider)?.provider || '';
  const allEntries = perConcernResults
    .filter(Boolean)
    .flatMap((r) => (Array.isArray(r.parsed?.recommendations) ? r.parsed.recommendations : []));

  if (!allEntries.length) {
    return res.status(200).json({
      recommendations: [],
      providerUsed: providerUsed || null,
      generatedAt: new Date().toISOString(),
      warning: 'parse_error_fallback',
      message: 'No parseable recommendations returned.',
    });
  }

  const recs = enrichRecommendations(allEntries);

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

