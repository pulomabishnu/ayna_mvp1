/**
 * /api/ask-ayna — the GLOBAL "Ask Ayna" widget's real backend.
 *
 * WHY THIS EXISTS: the widget previously only ran a client-side keyword
 * parser (parseMessageIntoProfile in ProfileChatbot.jsx) that tried to fold
 * a message into her health profile and, if nothing matched, replied with a
 * canned "I didn't spot specific concerns or preferences to add" — it never
 * actually answered a question. Asking "How do I insert a menstrual cup?"
 * got that same non-answer, while the product-page "Ask Ayna" tab (backed
 * by api/product-chat.js) answered fine — the same feature name meant two
 * very different things depending on where you found it (found live,
 * 2026-08-24 bug bash). This endpoint gives the global widget the same real
 * LLM answer capability, plus keeps the one thing the old parser did well —
 * folding a stated concern/sensitivity/preference into her profile — but as
 * a structured field the model returns alongside its answer, not a second,
 * disconnected system guessing at the same message.
 *
 * Same auth/quota pattern as product-chat.js, sharing its 'chat' usage
 * bucket — both are chat-type LLM usage against the same weekly budget.
 */
/* global process */
import { verifyUser, consumeUsage, refundUsage } from './_usageLimit.js';
import { isPremiumUser, hasLegacyClientPremiumFlag } from './_entitlement.js';
import { callWithFallback, parseProviderOrder, tryParseJsonCandidate, stripDiagnosticLanguage } from './_llm.js';

function clamp(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\r\n]+/g, ' ').replace(/`/g, "'").trim().slice(0, max);
}

const PROFILE_CATEGORIES = `
- frustrations: health concerns she's mentioned (examples already in use: "Heavy flow", "Painful cramps", "Hormonal bloating", "Irregular cycles", "Leaks & staining", "General discomfort", "Recurrent UTIs", "PCOS symptoms", "Pelvic pain", "Menopause symptoms", "Endometriosis", "Fertility / TTC" — reuse an existing label when the message clearly matches one, otherwise write a short new one in the same style)
- sensitivities: things her body reacts badly to (e.g. "Fragrance sensitivity", "Latex allergy", "Synthetic materials", "Other allergies")
- productsToAvoid: specific ingredients/materials she wants avoided in recommendations (e.g. "Essential oils", "Fragrance / scented products", "Latex", "Synthetic materials")
- preference: ONE overall priority if she stated one ("Organic/Natural only", "Lower cost", "Comfort/Convenience", "Privacy & data security", "Sustainability/Zero-waste") — null if none stated`;

function buildPrompt({ message, profileSummary, historyText }) {
  return `You are Ayna, a knowledgeable and warm women's health assistant inside the Ayna app. Answer the user's message directly and helpfully.

RULES:
- Answer the actual question or statement — do not deflect to "I didn't understand" unless the message is truly unintelligible.
- 2-5 concise sentences, conversational, specific.
- You are not a doctor. NEVER diagnose, under any framing — this means never naming, listing, or suggesting specific medical conditions as a possible explanation for symptoms she describes, even hedged ("this could be X, Y, or Z" still counts as diagnosing). Never prescribe treatment or tell her what medication to take. When she describes symptoms or asks what might be going on, answer with general, non-diagnostic guidance instead — what that kind of symptom commonly involves, general self-care, what to track or watch for — without naming any candidate condition, and firmly direct her to a healthcare provider for an actual diagnosis. Always still give a substantively useful answer alongside that guidance, never just the disclaimer alone.
- If anything in her message sounds like it could be urgent (severe or worsening pain, heavy or prolonged bleeding, signs of infection like fever, fainting, or anything she describes as sudden/severe) — say so directly and tell her to seek medical care promptly, before anything else in your answer.
- Never fabricate specific studies, statistics, or product facts you don't actually know.
- If she asks how to browse or find products (e.g. "show me pads", "I need supplements for cramps"), tell her what you're doing for her in the answer AND set "browseIntent" (see JSON shape) so the app can actually take her there.

SEPARATELY, decide whether this message reveals something worth remembering in her health profile — a real stated concern, sensitivity, avoidance, or priority, not just a passing question. Only include a category below if she clearly stated something new; leave arrays empty / preference null otherwise. Do not invent something she didn't say.
${PROFILE_CATEGORIES}

${profileSummary ? `HER CURRENT PROFILE (don't re-add anything already listed):\n${profileSummary}\n` : ''}${historyText ? `RECENT CONVERSATION:\n${historyText}\n` : ''}
HER MESSAGE: ${message}

Return ONLY valid JSON, exactly this shape, no markdown code fences:
{
  "answer": "your reply, markdown allowed (**bold**, [text](url), - lists)",
  "profileUpdate": { "frustrations": [], "sensitivities": [], "productsToAvoid": [], "preference": null },
  "browseIntent": { "category": "pad" } or null
}`.trim();
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') {
    const allowList = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
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
  if (hasLegacyClientPremiumFlag(user)) {
    console.warn(`[ask-ayna] user ${user.id} has the legacy client-writable is_premium flag; migrate it to app_metadata`);
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  const { message, profileSummary, chatHistory } = body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  const historyText = Array.isArray(chatHistory)
    ? chatHistory.slice(-6).map((m) => `${m.role === 'user' ? 'Her' : 'Ayna'}: ${clamp(m.text, 400)}`).join('\n')
    : '';

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

  const prompt = buildPrompt({
    message: clamp(message, 500),
    profileSummary: typeof profileSummary === 'string' ? profileSummary.slice(0, 2000) : '',
    historyText,
  });
  const order = parseProviderOrder('AI_INSIGHTS_PROVIDER_ORDER', 'anthropic,openai,gemini');

  let parsed = null;
  try {
    const out = await callWithFallback(order, {
      system: "You are Ayna, a knowledgeable and empathetic women's health assistant. Return a single valid JSON object only, no markdown code fences. Never fabricate facts.",
      prompt,
      jsonMode: true,
      maxTokens: 1024,
      timeoutMs: 20_000,
    });
    parsed = tryParseJsonCandidate(out.text);
  } catch (e) {
    console.error('[ask-ayna] all providers failed:', e?.status || '', e?.message);
  }

  const answer = typeof parsed?.answer === 'string' ? stripDiagnosticLanguage(parsed.answer.trim()) : '';
  if (!answer) {
    await refund();
    return res.status(502).json({
      error: 'generation_failed',
      answer: "I'm sorry, I wasn't able to answer that right now. Please try again in a moment.",
    });
  }

  const rawUpdate = parsed?.profileUpdate && typeof parsed.profileUpdate === 'object' ? parsed.profileUpdate : {};
  const asStringArray = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).slice(0, 10) : []);
  const profileUpdate = {
    frustrations: asStringArray(rawUpdate.frustrations),
    sensitivities: asStringArray(rawUpdate.sensitivities),
    productsToAvoid: asStringArray(rawUpdate.productsToAvoid),
    preference: typeof rawUpdate.preference === 'string' && rawUpdate.preference.trim() ? rawUpdate.preference.trim() : null,
  };
  const browseIntent = parsed?.browseIntent && typeof parsed.browseIntent === 'object' && typeof parsed.browseIntent.category === 'string'
    ? { category: parsed.browseIntent.category.slice(0, 40) }
    : null;

  return res.status(200).json({
    answer,
    profileUpdate,
    browseIntent,
    usage: isPremium ? { unlimited: true } : { used: usageUsed, limit: usageLimit },
  });
}
