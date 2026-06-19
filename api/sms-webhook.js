/**
 * /api/sms-webhook — Twilio inbound SMS webhook.
 * Looks up the texting user by phone number, loads her real health profile,
 * and replies via Claude at a 6th-grade reading level. Logs every inbound
 * and outbound message to sms_conversations (never the phone number itself).
 */
/* global process */
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import { retrieveKnowledgeForIntake, buildKnowledgeContext } from '../src/utils/ragRetrieval.js';

const NO_ACCOUNT_REPLY =
  "Hi! I'm Ayna. To get personalized health texts, complete your free health profile at https://ayna.health/quiz. It takes 5 minutes.";

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);
const START_KEYWORDS = new Set(['START', 'UNSTOP', 'YES']);

const BANNED_WORD_REPLACEMENTS = [
  [/\bdiagnose[sd]?\b/gi, 'may help with'],
  [/\btreats?\b/gi, 'may help with'],
  [/\bcures?\b/gi, 'may help with'],
];

function getAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function maskedTail(phoneNumber) {
  return typeof phoneNumber === 'string' ? `***${phoneNumber.slice(-4)}` : '***';
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function twiml(message) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
}

function sendTwiml(res, message) {
  res.setHeader('Content-Type', 'text/xml');
  return res.status(200).send(twiml(message));
}

function sanitizeBannedWords(text) {
  let out = text;
  for (const [pattern, replacement] of BANNED_WORD_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

async function logMessage(admin, userId, direction, body) {
  try {
    await admin.from('sms_conversations').insert({ user_id: userId, direction, message_body: body });
  } catch (e) {
    console.error('[sms-webhook] log error:', e?.message);
  }
}

function buildSmsPrompt(message, profile, knowledgeContext, recentMessages) {
  const profileSummary = JSON.stringify({
    age: profile?.age,
    location: profile?.location,
    conditions: profile?.conditions,
    symptoms: profile?.symptoms,
    primaryConcerns: profile?.primaryConcerns,
    productPreferences: profile?.productPreferences,
    painLevel: profile?.painLevel,
    insuranceType: profile?.insuranceType,
  });

  const historyLines = (recentMessages || [])
    .slice()
    .reverse()
    .map((m) => `${m.direction === 'inbound' ? 'Her' : 'Ayna'}: ${m.message_body}`)
    .join('\n');

  return `HER HEALTH PROFILE:
${profileSummary}

${knowledgeContext ? `${knowledgeContext}\n\n` : ''}${historyLines ? `RECENT CONVERSATION (most recent last):\n${historyLines}\n\n` : ''}HER NEW TEXT: ${message}

Reply to her text now, following all the rules above.`;
}

const SMS_SYSTEM_PROMPT = `You are Ayna, a warm and knowledgeable friend texting with a woman about her health. She has already completed a health profile on the Ayna app — always answer using her actual profile (conditions, symptoms, preferences), never a generic answer.

READING LEVEL — this is critical, many of the women you text have low literacy or limited healthcare access:
- Write at a 6th-grade reading level. Short sentences. Common words.
- If you must use a medical term, define it in plain words right after, in the same sentence.

TONE:
- Warm, like a knowledgeable friend texting back — never clinical, cold, or robotic.
- Never say "diagnose," "treat," or "cure." Say "may help with" instead.

OTC-FIRST, ESCALATE WHEN WARRANTED:
- Lead with free or low-cost over-the-counter (OTC) options when appropriate for her symptoms.
- Escalate to "this needs an in-person visit" only when her symptom severity or duration warrants it (for example: pain she rates 8 or higher out of 10, symptoms lasting an unusually long time, or red-flag symptoms like heavy bleeding or fever).
- When escalating: first acknowledge her reality (for example, "I know getting to a doctor isn't always easy"). Then name ONE specific resource — a real clinic, mobile health unit, or telehealth service (like Allara Health, Nurx, or Maven Clinic) — never just "see a doctor." Frame it as an option she can choose, not a directive (for example, "one option is..." not "you need to...").

LOCATION-SPECIFIC ANSWERS:
- If she names a location or pharmacy, give a specific, realistic answer about what's typically available there and at what price point, using your general knowledge.

LENGTH:
- Keep replies under 320 characters (about 2 text messages) whenever possible. Only go longer if the situation truly needs more detail to be safe and clear.

Reply only with the text message itself — no preamble, no signature.`;

async function callClaude(systemPrompt, userPrompt) {
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
      max_tokens: 250,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.content?.[0]?.text?.trim() || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.headers['x-twilio-signature'];
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const url = `${proto}://${req.headers.host}${req.url}`;

  if (authToken) {
    const params = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : req.body || {};
    const valid = twilio.validateRequest(authToken, signature || '', url, params);
    if (!valid) {
      console.error('[sms-webhook] invalid Twilio signature');
      return res.status(403).send('Forbidden');
    }
  }

  const body = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : req.body || {};
  const from = body.From;
  const text = (body.Body || '').trim();
  if (!from || !text) return res.status(400).send('Bad request');

  const admin = getAdmin();

  const { data: phoneRow, error: lookupError } = await admin
    .from('phone_numbers')
    .select('user_id, is_verified, sms_opted_out')
    .eq('phone_number', from)
    .maybeSingle();

  if (lookupError) {
    console.error('[sms-webhook] lookup error:', lookupError.message);
    return res.status(500).send('Server error');
  }

  if (!phoneRow || !phoneRow.is_verified) {
    console.log(`[sms-webhook] no verified account for ${maskedTail(from)}`);
    return sendTwiml(res, NO_ACCOUNT_REPLY);
  }

  const { user_id: userId, sms_opted_out: optedOut } = phoneRow;
  const upper = text.toUpperCase();

  if (STOP_KEYWORDS.has(upper)) {
    await admin.from('phone_numbers').update({ sms_opted_out: true, updated_at: new Date().toISOString() }).eq('user_id', userId);
    await logMessage(admin, userId, 'inbound', text);
    await logMessage(admin, userId, 'outbound', "You're unsubscribed from Ayna texts. Reply START to opt back in.");
    return sendTwiml(res, "You're unsubscribed from Ayna texts. Reply START to opt back in.");
  }

  if (START_KEYWORDS.has(upper) && optedOut) {
    await admin.from('phone_numbers').update({ sms_opted_out: false, updated_at: new Date().toISOString() }).eq('user_id', userId);
    await logMessage(admin, userId, 'inbound', text);
    await logMessage(admin, userId, 'outbound', "You're back in! Text me anytime, like 'what helps with PCOS bloating'.");
    return sendTwiml(res, "You're back in! Text me anytime, like 'what helps with PCOS bloating'.");
  }

  await logMessage(admin, userId, 'inbound', text);

  if (optedOut) {
    // Respect our own opt-out state even if Twilio's carrier-level STOP somehow didn't catch it.
    return res.status(200).send('');
  }

  await admin.from('phone_numbers').update({ last_sms_at: new Date().toISOString() }).eq('user_id', userId);

  const { data: intakeRow } = await admin.from('health_intakes').select('profile').eq('user_id', userId).maybeSingle();
  const profile = intakeRow?.profile || {};

  const { data: recentMessages } = await admin
    .from('sms_conversations')
    .select('direction, message_body, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  let knowledgeContext = '';
  try {
    const chunks = retrieveKnowledgeForIntake(profile, 5);
    knowledgeContext = buildKnowledgeContext(chunks);
  } catch (e) {
    console.error('[sms-webhook] knowledge retrieval error:', e?.message);
  }

  const userPrompt = buildSmsPrompt(text, profile, knowledgeContext, recentMessages);

  let reply;
  try {
    reply = await callClaude(SMS_SYSTEM_PROMPT, userPrompt);
  } catch (e) {
    console.error('[sms-webhook] Claude error:', e?.message);
  }

  if (!reply) {
    reply = "Sorry, I'm having trouble right now. Please try texting again in a few minutes.";
  } else {
    reply = sanitizeBannedWords(reply);
  }

  await logMessage(admin, userId, 'outbound', reply);

  return sendTwiml(res, reply);
}
