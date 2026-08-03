/**
 * /api/product-chat — Answer user questions about a specific product.
 * Uses the already-generated aiInsights (clinical/science/community narratives)
 * plus core product data as context, so we don't need a full retrieval pass.
 */
/* global process */
import { verifyUser, consumeUsage, refundUsage } from './_usageLimit.js';
import { isPremiumUser } from './_entitlement.js';
import { callWithFallback, parseProviderOrder } from './_llm.js';

/**
 * Every field below arrives in the request body and is interpolated into the
 * prompt, so each one is length-capped and stripped of newlines/backticks.
 *
 * Uncapped, a single `product.summary` could fill the model's context (~$0.20
 * of input per request, ~100x normal) and — because the quota was only charged
 * on success — be replayed indefinitely. The newline stripping limits how
 * easily injected text can pose as a new prompt section.
 */
function clamp(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\r\n]+/g, ' ').replace(/`/g, "'").trim().slice(0, max);
}

function buildEcosystemSummary(ecosystemProducts) {
  if (!Array.isArray(ecosystemProducts) || ecosystemProducts.length === 0) return '';
  const lines = ecosystemProducts
    .slice(0, 20)
    // Guarded: a body of {"ecosystemProducts":[null]} previously threw a
    // TypeError outside any try/catch and surfaced as an unhandled 500.
    .filter(p => p && typeof p === 'object')
    .map(p => {
      const brand = p.brand ? ` by ${clamp(p.brand, 80)}` : '';
      const cat = p.category ? ` (${clamp(p.category, 40)})` : '';
      const source = p.aynaRecommended ? ' [Ayna recommended]' : ' [user added]';
      return `- ${clamp(p.name, 120) || 'Unknown'}${brand}${cat}${source}`;
    });
  return lines.join('\n');
}

function buildPrompt(question, product, aiInsights, userContext, ecosystemProducts) {
  const name = clamp(product?.name, 120) || 'this product';
  const brand = clamp(product?.brand, 80);
  const summary = clamp(product?.summary, 1200);
  const ingredients = clamp(product?.ingredients || product?.safety?.materials, 800);
  const doctorOpinion = clamp(product?.doctorOpinion, 800);
  const communityReview = clamp(product?.communityReview, 800);
  const rawSafety = (product?.safety && typeof product.safety === 'object') ? product.safety : {};
  const safety = {
    fdaStatus: clamp(rawSafety.fdaStatus, 200),
    sideEffects: clamp(rawSafety.sideEffects, 400),
    recalls: clamp(rawSafety.recalls, 400),
  };
  const effectiveness = clamp(product?.effectiveness, 600);

  // aiInsights is client-supplied and lands BELOW the RULES block — i.e. in the
  // stronger position — so an unbounded value here was the cleanest way to
  // override the medical-safety rules above. Capped hard.
  const clinicalCtx = clamp(aiInsights?.clinicalNarrative, 1500);
  const scienceCtx = clamp(aiInsights?.scienceSummary, 1000);
  const communityCtx = clamp(aiInsights?.communitySummary, 1000);

  const ecoSummary = buildEcosystemSummary(ecosystemProducts);

  return `You are Ayna, a knowledgeable women's health assistant. The user is viewing "${name}" and has asked a question. Answer using the product information, research context, user health profile, and their personal product ecosystem provided below.

RULES:
- Answer in 2–4 concise sentences directly addressing the question.
- Be specific — reference the actual product(s) the user asks about by name.
- If the user asks about a product NOT listed in the product information below, use your general knowledge about that product to answer. Ayna helps users understand any women's health product, not just ones in the explicit context.
- When comparing products, weigh the user's health profile — her conditions, concerns, and preferences — to give a personally relevant answer.
- Never diagnose, prescribe, or tell the user what to do medically. For medical decisions, say "consult your healthcare provider."
- Never fabricate specific ingredient lists or clinical study data you don't know. You may share well-established general knowledge.
- Do not say you "haven't recommended" a product or that it's "not in your context" — if the user asks about it, engage with it.

PRODUCT IN VIEW:
- Name: ${name}${brand ? ` by ${brand}` : ''}
- Summary: ${summary}
${ingredients ? `- Ingredients / Materials: ${ingredients}` : ''}
${effectiveness ? `- Effectiveness: ${effectiveness}` : ''}
${safety.fdaStatus ? `- FDA status: ${safety.fdaStatus}` : ''}
${safety.sideEffects ? `- Side effects: ${safety.sideEffects}` : ''}
${safety.recalls ? `- Recalls: ${safety.recalls}` : ''}
${doctorOpinion ? `- Clinician view: ${doctorOpinion}` : ''}
${communityReview ? `- Community feedback: ${communityReview}` : ''}

RESEARCH CONTEXT:
${clinicalCtx ? `Clinical: ${clinicalCtx}` : ''}
${scienceCtx ? `Scientific: ${scienceCtx}` : ''}
${communityCtx ? `Community: ${communityCtx}` : ''}

${userContext ? `USER HEALTH PROFILE:\n${userContext}\n` : ''}
${ecoSummary ? `USER'S CURRENT PRODUCT ECOSYSTEM (products she already uses or is considering):\n${ecoSummary}\n` : ''}
USER QUESTION: ${question}

Answer:`.trim();
}

// The local callAnthropic/callOpenAI pair that lived here was replaced by
// _llm.js: both swallowed the provider status (`if (!res.ok) return null`), so a
// revoked key, a 429 and an overload were indistinguishable from "the model had
// nothing to say" — and this route turned that into a HTTP 200 apology.

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') {
    // Was '*'. These are same-origin, bearer-authenticated routes: a wildcard
    // preflight let a hostile origin's request run server-side (spending the
    // user's quota) before the browser discarded the response.
    const allowList = (process.env.ALLOWED_ORIGINS || '')
      .split(',').map((o) => o.trim()).filter(Boolean);
    if (req.headers.origin && allowList.includes(req.headers.origin)) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user, error, admin } = await verifyUser(req);
  if (!user) return res.status(401).json({ error });

  const isPremium = isPremiumUser(user);

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  const { question, product, aiInsights, userContext, ecosystemProducts } = body || {};
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'question is required' });
  }
  if (!product || typeof product !== 'object') {
    return res.status(400).json({ error: 'product is required' });
  }

  // Reserve the slot BEFORE spending money, and refund on failure.
  //
  // The old order was check -> call providers -> increment only on success.
  // Since every input that decides "success" comes from the request body, a
  // client could force the failure branch (e.g. an aiInsights value telling the
  // model to reply with a single space, so the trimmed answer is falsy) and get
  // unlimited *billed* Anthropic + OpenAI calls that never touched the counter.
  // It was also a check-then-act race: N concurrent requests all read the same
  // pre-increment value and all passed.
  let usagePeriod = null;
  let usageUsed = 0;
  let usageLimit = null;
  if (!isPremium) {
    const { allowed, used, limit, period, degraded } = await consumeUsage(admin, user.id, 'chat');
    if (!allowed) return res.status(429).json({ error: 'weekly_limit_reached', used, limit, action: 'chat' });
    usagePeriod = degraded ? null : period;
    usageUsed = used;
    usageLimit = limit;
  }
  const refund = async () => {
    if (usagePeriod) await refundUsage(admin, user.id, 'chat', usagePeriod);
  };

  const prompt = buildPrompt(
    question.trim().slice(0, 500),
    product,
    aiInsights || {},
    // Had no cap at all here, unlike product-insights which caps it at 4000.
    typeof userContext === 'string' ? userContext.slice(0, 4000) : '',
    ecosystemProducts
  );
  const order = parseProviderOrder('AI_INSIGHTS_PROVIDER_ORDER', 'anthropic,openai');

  let answer = null;
  try {
    const out = await callWithFallback(order, {
      system: "You are Ayna, a knowledgeable and empathetic women's health assistant. Answer questions concisely using only the provided context. Never fabricate facts.",
      prompt,
      maxTokens: 1024,
      timeoutMs: 20_000,
    });
    answer = out.text.trim();
  } catch (e) {
    console.error('[product-chat] all providers failed:', e?.status || '', e?.message);
  }

  if (!answer) {
    await refund();
    // 502, not 200. Returning a friendly apology with a success status made
    // generation failures invisible to the client, to monitoring, and to the
    // user's own retry logic.
    return res.status(502).json({
      error: 'generation_failed',
      answer: "I'm sorry, I wasn't able to answer that right now. Please try again or consult the product details tabs above.",
    });
  }

  // Report the authoritative count back. The client used to query user_ai_usage
  // directly and swallow the error, so the counter read 0 whenever the read
  // failed and the user was surprised by a 429.
  return res.status(200).json({
    answer,
    usage: isPremium ? { unlimited: true } : { used: usageUsed, limit: usageLimit },
  });
}
