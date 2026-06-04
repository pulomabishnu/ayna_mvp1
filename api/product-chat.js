/**
 * /api/product-chat — Answer user questions about a specific product.
 * Uses the already-generated aiInsights (clinical/science/community narratives)
 * plus core product data as context, so we don't need a full retrieval pass.
 */
/* global process */
import { verifyUser, checkUsage, incrementUsage } from './_usageLimit.js';

function buildEcosystemSummary(ecosystemProducts) {
  if (!Array.isArray(ecosystemProducts) || ecosystemProducts.length === 0) return '';
  const lines = ecosystemProducts
    .slice(0, 20)
    .map(p => {
      const brand = p.brand ? ` by ${p.brand}` : '';
      const cat = p.category ? ` (${p.category})` : '';
      const source = p.aynaRecommended ? ' [Ayna recommended]' : ' [user added]';
      return `- ${p.name || 'Unknown'}${brand}${cat}${source}`;
    });
  return lines.join('\n');
}

function buildPrompt(question, product, aiInsights, userContext, ecosystemProducts) {
  const name = product?.name || 'this product';
  const brand = product?.brand || '';
  const summary = product?.summary || '';
  const ingredients = product?.ingredients || product?.safety?.materials || '';
  const doctorOpinion = product?.doctorOpinion || '';
  const communityReview = product?.communityReview || '';
  const safety = product?.safety || {};
  const effectiveness = product?.effectiveness || '';

  const clinicalCtx = aiInsights?.clinicalNarrative || '';
  const scienceCtx = aiInsights?.scienceSummary || '';
  const communityCtx = aiInsights?.communitySummary || '';

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

async function callAnthropic(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
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
      max_tokens: 500,
      temperature: 0.3,
      system: 'You are Ayna, a knowledgeable and empathetic women\'s health assistant. Answer questions about any women\'s health product using the provided context and your general knowledge.',
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.content?.[0]?.text?.trim() || null;
}

async function callOpenAI(prompt) {
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
      max_tokens: 400,
      temperature: 0.3,
      messages: [
        { role: 'system', content: 'You are Ayna, a knowledgeable and empathetic women\'s health assistant. Answer questions concisely using only the provided context. Never fabricate facts.' },
        { role: 'user', content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user, error, admin } = await verifyUser(req);
  if (!user) return res.status(401).json({ error });

  const isPremium = user.user_metadata?.is_premium === true;
  let chatPeriod;
  if (!isPremium) {
    const { over, used, limit, period } = await checkUsage(admin, user.id, 'chat');
    if (over) return res.status(429).json({ error: 'weekly_limit_reached', used, limit, action: 'chat' });
    chatPeriod = period;
  }

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

  const prompt = buildPrompt(question.trim().slice(0, 500), product, aiInsights || {}, userContext || '', ecosystemProducts);

  const order = (process.env.AI_INSIGHTS_PROVIDER_ORDER || 'anthropic,openai')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

  let answer = null;
  for (const provider of order) {
    try {
      if (provider === 'anthropic' || provider === 'claude') answer = await callAnthropic(prompt);
      else if (provider === 'openai') answer = await callOpenAI(prompt);
      if (answer) break;
    } catch (e) {
      console.error(`[product-chat] ${provider} error:`, e?.message);
    }
  }

  if (!answer) {
    return res.status(200).json({
      answer: "I'm sorry, I wasn't able to answer that right now. Please try again or consult the product details tabs above.",
    });
  }

  if (!isPremium) await incrementUsage(admin, user.id, 'chat', chatPeriod);
  return res.status(200).json({ answer });
}
