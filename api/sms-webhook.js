/**
 * /api/sms-webhook, Twilio inbound SMS webhook.
 * Looks up the texting user by phone number, loads her real health profile,
 * and replies via Claude at a 6th-grade reading level. Logs every inbound
 * and outbound message to sms_conversations (never the phone number itself).
 *
 * Per-feature opt-ins (api/_smsStore.js, supabase/sms_2026-10-19.sql):
 *   - HELP/INFO answers any number; STOP from an unknown number gets silence.
 *   - STOP also turns every feature off in sms_preferences; START clears the
 *     stop but leaves features off until she turns them on in the app.
 *   - Chat needs chat=true (or the legacy website consent, see _smsStore.js);
 *     otherwise one "chats are off" reply per day.
 *   - SMS_DAILY_CHAT_LIMIT answered texts per day, then one notice.
 *   - Her stored profile is only used when health details are on.
 */
/* global process */
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import { retrieveKnowledgeForIntake, buildKnowledgeContext } from '../src/utils/ragRetrieval.js';
import { consumeUsage } from './_usageLimit.js';
import { rateLimit } from './_rateLimit.js';
import { callWithFallback, parseProviderOrder } from './_llm.js';
import { hashedSessionId, traceMessages } from './_prismTrace.js';
import { ALL_PRODUCTS } from '../src/data/products.js';
import { stripLinks } from './_catalogGrounding.js';
import {
  SMS_DAILY_CHAT_LIMIT, countEventsToday, loadPrefsRow, logSmsEvent, prefsFromRow, rowFromPrefs, ALL_OFF,
} from './_smsStore.js';

const NO_ACCOUNT_REPLY =
  "Hi! I'm Ayna. To get personalized health texts, complete your free health profile at https://ayna.health/quiz. It takes 5 minutes.";

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);
const START_KEYWORDS = new Set(['START', 'UNSTOP', 'YES']);
const HELP_KEYWORDS = new Set(['HELP', 'INFO']);

const SUPPORT_EMAIL = () => process.env.SMS_SUPPORT_EMAIL || 'puloma@aynahealth.co';
export const HELP_REPLY = () => `ayna: health product matches and reads. Reply STOP to opt out. Help: ${SUPPORT_EMAIL()}`;
export const CHAT_OFF_REPLY = 'Text chats with ayna are off for this number. Turn them on in the ayna app: You, Settings, Text messages.';
export const DAILY_LIMIT_REPLY = `You've used today's ${SMS_DAILY_CHAT_LIMIT} texts with ayna. You can keep chatting in the app.`;
export const MAX_REPLY_CHARS = 600;

/** Keep a reply to one short SMS thread: cut at a sentence end under the cap. */
export function capReply(text, max = MAX_REPLY_CHARS) {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return end > max / 2 ? cut.slice(0, end + 1) : `${cut.slice(0, max - 3).trimEnd()}...`;
}

/** Reply `message` at most once per New York day per person, otherwise stay silent. */
async function replyOncePerDay(res, admin, userId, kind, message) {
  let already = 0;
  try { already = await countEventsToday(admin, userId, kind); } catch (e) { console.error('[sms-webhook] notice count failed:', e?.message); }
  if (already > 0) return res.status(200).send('');
  await logSmsEvent(admin, userId, kind);
  await logMessage(admin, userId, 'outbound', message);
  return sendTwiml(res, message);
}

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

async function logMessage(admin, userId, direction, body, messageSid = null) {
  try {
    // supabase-js v2 RESOLVES with {error} rather than throwing, so the
    // surrounding try/catch alone never fired and failures were invisible.
    const { error } = await admin
      .from('sms_conversations')
      .insert({ user_id: userId, direction, message_body: body, message_sid: messageSid });
    if (error) throw new Error(error.message);
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

const TELEHEALTH_NAMES = ALL_PRODUCTS
  .filter((p) => p?.category === 'telehealth' && p?.name)
  .map((p) => p.name)
  .slice(0, 40)
  .join(', ');

const SMS_SYSTEM_PROMPT = `You are Ayna, a warm and knowledgeable friend texting with a woman about her health. She has already completed a health profile on the Ayna app, always answer using her actual profile (conditions, symptoms, preferences), never a generic answer.

READING LEVEL, this is critical, many of the women you text have low literacy or limited healthcare access:
- Write at a 6th-grade reading level. Short sentences. Common words.
- If you must use a medical term, define it in plain words right after, in the same sentence.

TONE:
- Warm, like a knowledgeable friend texting back, never clinical, cold, or robotic.
- Never say "diagnose," "treat," or "cure." Say "may help with" instead.

OTC-FIRST, ESCALATE WHEN WARRANTED:
- Lead with free or low-cost over-the-counter (OTC) options when appropriate for her symptoms.
- Escalate to "this needs an in-person visit" only when her symptom severity or duration warrants it (for example: pain she rates 8 or higher out of 10, symptoms lasting an unusually long time, or red-flag symptoms like heavy bleeding or fever).
- When escalating: first acknowledge her reality (for example, "I know getting to a doctor isn't always easy"). Then name ONE option she can choose, a telehealth service from the AYNA TELEHEALTH LIST below, or a general kind of care (urgent care, a community health center, Planned Parenthood), never just "see a doctor." Frame it as an option, not a directive (for example, "one option is..." not "you need to...").

PRODUCT INTEGRITY, never break these:
- Never name a specific product or brand except a service on the AYNA TELEHEALTH LIST. Describe OTC options by type (for example "a heating pad" or "an ibuprofen-type pain reliever"), not brand.
- Never state a price, a stock/availability claim, or a store-specific fact. Never include links or URLs.
- If she names a pharmacy or place, say what TYPE of product to look for and suggest she check with the pharmacist.

AYNA TELEHEALTH LIST:
${TELEHEALTH_NAMES || '(none, use general kinds of care only)'}

LENGTH:
- Keep replies under 320 characters (about 2 text messages) whenever possible. Only go longer if the situation truly needs more detail to be safe and clear.

Reply only with the text message itself, no preamble, no signature.`;

/**
 * Was Anthropic-only via a hand-rolled fetch, a single provider's outage
 * (e.g. the account running out of credits, found live 2026-08-25 alongside
 * the same gap in api/search-suggestions.js) left every texted question
 * unanswerable with no fallback. Now goes through the same multi-provider
 * callWithFallback every other AI route uses.
 */
async function callSmsModel(systemPrompt, userPrompt, userId, traceTurns) {
  const order = parseProviderOrder('AI_SMS_PROVIDER_ORDER', 'anthropic,openai,gemini');
  try {
    const out = await callWithFallback(order, {
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 250,
      temperature: 0.3,
      timeoutMs: 8000,
      trace: { name: 'sms-webhook', sessionId: hashedSessionId('sms', userId), messages: traceTurns },
    });
    return out.text.trim() || null;
  } catch (e) {
    console.error('[sms-webhook] model call failed:', e?.status || '', e?.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.headers['x-twilio-signature'];
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const url = `${proto}://${req.headers.host}${req.url}`;

  // FAIL CLOSED. Previously this whole block was skipped when TWILIO_AUTH_TOKEN
  // was unset or misnamed (very common on preview/staging envs), which accepted
  // every unsigned request. An attacker could POST From=<victim's number> and
  // the handler would look her up, load her health_intakes profile, and return
  // an answer derived from it in the HTTP response body.
  if (!authToken) {
    console.error('[sms-webhook] TWILIO_AUTH_TOKEN is not set, refusing to process unverified webhook');
    return res.status(500).send('Server error');
  }
  if (!signature) {
    console.error('[sms-webhook] missing X-Twilio-Signature');
    return res.status(403).send('Forbidden');
  }
  {
    const params = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : req.body || {};
    let valid = false;
    try {
      valid = twilio.validateRequest(authToken, signature, url, params);
    } catch (e) {
      // validateRequest calls new URL(url) unguarded, a missing Host header
      // threw an uncaught TypeError and surfaced as a 500 instead of a 403.
      console.error('[sms-webhook] signature validation error:', e?.message);
      return res.status(403).send('Forbidden');
    }
    if (!valid) {
      console.error('[sms-webhook] invalid Twilio signature');
      return res.status(403).send('Forbidden');
    }
  }

  const body = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : req.body || {};
  const from = body.From;
  const text = (body.Body || '').trim();
  const messageSid = typeof body.MessageSid === 'string' ? body.MessageSid : null;
  if (!from || !text) return res.status(400).send('Bad request');

  const upper = text.toUpperCase();

  // Carrier rule: HELP gets the same answer for every number, known or not.
  if (HELP_KEYWORDS.has(upper)) return sendTwiml(res, HELP_REPLY());

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
    // Never answer a STOP with a sign-up pitch.
    if (STOP_KEYWORDS.has(upper)) return res.status(200).send('');
    console.log(`[sms-webhook] no verified account for ${maskedTail(from)}`);
    return sendTwiml(res, NO_ACCOUNT_REPLY);
  }

  const { user_id: userId, sms_opted_out: optedOut } = phoneRow;

  // Per-feature opt-ins (supabase/sms_2026-10-19.sql). A read failure is
  // treated as "everything off" so it can never widen what we send.
  let prefsRow = null;
  let prefsReadOk = true;
  try {
    prefsRow = await loadPrefsRow(admin, userId);
  } catch (e) {
    prefsReadOk = false;
    console.error('[sms-webhook] prefs read failed:', e?.message);
  }
  const prefs = prefsReadOk ? prefsFromRow(prefsRow) : { ...ALL_OFF };

  if (STOP_KEYWORDS.has(upper)) {
    const { error: optOutError } = await admin
      .from('phone_numbers')
      .update({ sms_opted_out: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (optOutError) {
      // Do NOT confirm an unsubscribe that did not happen.
      console.error('[sms-webhook] OPT-OUT WRITE FAILED for user', userId, optOutError.message);
      return sendTwiml(res, "Sorry, we couldn't process that just now. Please reply STOP again, or email pulomabishnu@gmail.com.");
    }
    // Every feature goes back to off; turning texts on again is a fresh opt-in in the app.
    const nowIso = new Date().toISOString();
    const { error: prefsStopError } = await admin.from('sms_preferences')
      .upsert({ user_id: userId, ...rowFromPrefs(ALL_OFF), stopped_at: nowIso, updated_at: nowIso }, { onConflict: 'user_id' });
    if (prefsStopError) console.error('[sms-webhook] prefs stop write failed:', prefsStopError.message);
    await logSmsEvent(admin, userId, 'stop');
    await logMessage(admin, userId, 'inbound', text);
    await logMessage(admin, userId, 'outbound', "You're unsubscribed from Ayna texts. Reply START to opt back in.");
    return sendTwiml(res, "You're unsubscribed from Ayna texts. Reply START to opt back in.");
  }

  // Handled unconditionally: previously a user who was NOT opted out and texted
  // "YES" (a START keyword, and a very common conversational reply) fell through
  // to the LLM path, spending a Claude call and an outbound SMS to answer a bare
  // "YES" with no context.
  if (START_KEYWORDS.has(upper)) {
    const chatLine = prefs.chat
      ? "Text me anytime, like 'what helps with PCOS bloating'."
      : 'Choose which texts you get in the ayna app: You, Settings, Text messages.';
    if (!optedOut && !prefsRow?.stopped_at) {
      await logMessage(admin, userId, 'inbound', text);
      return sendTwiml(res, `You're already subscribed. ${chatLine}`);
    }
    if (optedOut) {
      const { error: optInError } = await admin
        .from('phone_numbers')
        .update({ sms_opted_out: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      if (optInError) {
        console.error('[sms-webhook] OPT-IN WRITE FAILED for user', userId, optInError.message);
        return sendTwiml(res, "Sorry, we couldn't process that just now. Please reply START again.");
      }
    }
    if (prefsRow) {
      // Clears the STOP. Her feature settings stay off until she turns them on in the app.
      const { error: prefsStartError } = await admin.from('sms_preferences')
        .update({ stopped_at: null, updated_at: new Date().toISOString() }).eq('user_id', userId);
      if (prefsStartError) console.error('[sms-webhook] prefs start write failed:', prefsStartError.message);
    }
    await logSmsEvent(admin, userId, 'start');
    const backIn = `You're back in${prefs.chat ? '!' : '.'} ${chatLine}`;
    await logMessage(admin, userId, 'inbound', text);
    await logMessage(admin, userId, 'outbound', backIn);
    return sendTwiml(res, backIn);
  }

  // Unique index on message_sid makes a replayed delivery a no-op insert; if the
  // row already exists we have handled this exact message before.
  if (messageSid) {
    const { data: seen } = await admin
      .from('sms_conversations')
      .select('id')
      .eq('message_sid', messageSid)
      .maybeSingle();
    if (seen) {
      console.warn('[sms-webhook] duplicate delivery for', messageSid, ', ignoring');
      return res.status(200).send('');
    }
  }

  await logMessage(admin, userId, 'inbound', text, messageSid);

  if (optedOut) {
    // Respect our own opt-out state even if Twilio's carrier-level STOP somehow didn't catch it.
    return res.status(200).send('');
  }

  if (!prefs.chat || prefsRow?.stopped_at) {
    return replyOncePerDay(res, admin, userId, 'chat_off_notice', CHAT_OFF_REPLY);
  }

  // Founder rule: SMS_DAILY_CHAT_LIMIT answered texts per person per New York
  // day, then one notice, then silence until tomorrow. Checked before the
  // weekly quota so a capped text never spends quota.
  let chatsToday = 0;
  try {
    chatsToday = await countEventsToday(admin, userId, 'chat_reply');
  } catch (e) {
    // Fail closed: an unknown count must not become unlimited LLM + SMS spend.
    console.error('[sms-webhook] daily count failed:', e?.message);
    chatsToday = SMS_DAILY_CHAT_LIMIT;
  }
  if (chatsToday >= SMS_DAILY_CHAT_LIMIT) {
    return replyOncePerDay(res, admin, userId, 'chat_limit_notice', DAILY_LIMIT_REPLY);
  }

  // These three share only userId and are independent of each other.
  const [, intakeRes, recentRes] = await Promise.all([
    admin.from('phone_numbers').update({ last_sms_at: new Date().toISOString() }).eq('user_id', userId),
    admin.from('health_intakes').select('profile').eq('user_id', userId).maybeSingle(),
    admin
      .from('sms_conversations')
      .select('direction, message_body, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);
  // Her stored profile (conditions, symptoms) only shapes a text when she
  // turned on health details for texts.
  const profile = prefs.healthDetails ? intakeRes?.data?.profile || {} : {};
  const recentMessages = recentRes?.data;

  // Weekly quota + a short-window burst limit. Without these a single verified
  // user texting in a loop drives unbounded LLM spend and unbounded outbound
  // SMS cost. Both fail OPEN to a static reply rather than silence, so a
  // limiter outage never leaves an inbound text unanswered.
  const burst = await rateLimit(`sms:in:${userId}`, { max: 6, windowSec: 60, failClosed: false });
  if (!burst.ok) {
    await logMessage(admin, userId, 'outbound', 'rate limited');
    return sendTwiml(res, "You're sending messages quickly, give me a minute and text again.");
  }
  const { allowed: smsAllowed } = await consumeUsage(admin, userId, 'sms');
  if (!smsAllowed) {
    const msg = "You've reached this week's Ayna text limit. It resets Monday, or use the app anytime at https://ayna.health";
    await logMessage(admin, userId, 'outbound', msg);
    return sendTwiml(res, msg);
  }

  await logSmsEvent(admin, userId, 'chat_reply');

  let knowledgeContext = '';
  if (prefs.healthDetails) {
    try {
      const chunks = retrieveKnowledgeForIntake(profile, 5);
      knowledgeContext = buildKnowledgeContext(chunks);
    } catch (e) {
      console.error('[sms-webhook] knowledge retrieval error:', e?.message);
    }
  }

  const userPrompt = buildSmsPrompt(text, profile, knowledgeContext, recentMessages);

  let reply;
  try {
    // The text thread as she sees it. recentMessages is newest-first and
    // already holds this inbound text (logged above), so drop it before
    // traceMessages appends it as the new turn.
    const prior = (recentMessages || []).slice();
    if (prior[0]?.direction === 'inbound' && prior[0]?.message_body === text) prior.shift();
    const traceTurns = traceMessages(
      prior.reverse().map((m) => ({ role: m.direction === 'inbound' ? 'user' : 'assistant', text: m.message_body })),
      text
    );
    reply = await callSmsModel(SMS_SYSTEM_PROMPT, userPrompt, userId, traceTurns);
  } catch (e) {
    console.error('[sms-webhook] Claude error:', e?.message);
  }

  if (!reply) {
    reply = "Sorry, I'm having trouble right now. Please try texting again in a few minutes.";
  } else {
    reply = capReply(stripLinks(sanitizeBannedWords(reply)));
  }

  await logMessage(admin, userId, 'outbound', reply);

  return sendTwiml(res, reply);
}
