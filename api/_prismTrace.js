/* global process */
/**
 * PRISM live tracing — one HTTP POST to /api/traces per model call.
 *
 * Off unless PRISMTRACE_API_KEY is set, so local dev and tests make no extra
 * requests. Never throws: a tracing outage must not fail a user's request.
 * Awaited by the caller (with a short timeout) because Vercel freezes the
 * function once the response is sent, which would drop a fire-and-forget POST.
 */
import { createHash, randomUUID } from 'node:crypto';

const TRACE_TIMEOUT_MS = 2_000;

export function prismTraceEnabled() {
  return Boolean(process.env.PRISMTRACE_API_KEY && process.env.PRISMTRACE_PROJECT_ID);
}

const CONVERSATION_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Session id for a trace. PRISM only builds a trajectory from traces that
 * share a session_id, so a random id per call leaves every turn split into its
 * own one-message session. Not prefixed by route: a chat turn and the product
 * search it navigates to belong to the same visit, so they share a session.
 *   - the client's per-tab session id (`conversationId` in the request body,
 *     from src/utils/conversationId.js getAppSessionId) groups one visit;
 *   - otherwise a hashed user id + UTC day groups one user's calls;
 *   - otherwise undefined, and emitTrace falls back to a per-call id.
 */
export function traceSessionId({ conversationId, userId } = {}) {
  if (typeof conversationId === 'string' && CONVERSATION_ID_RE.test(conversationId)) {
    return `ayna:${conversationId}`;
  }
  if (userId) return hashedSessionId('ayna', `${userId}:${new Date().toISOString().slice(0, 10)}`);
  return undefined;
}

/**
 * The chat as the user saw it: the UI's recent history ({role, text}) plus the
 * new message, as {role, content} turns. Client-supplied, so capped and
 * restricted to user/assistant roles.
 */
export function traceMessages(chatHistory, message) {
  const prior = Array.isArray(chatHistory) ? chatHistory.slice(-6) : [];
  const turns = prior
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
    .map((m) => ({ role: m.role, content: m.text.slice(0, 2000) }));
  if (typeof message === 'string' && message.trim()) turns.push({ role: 'user', content: message.trim().slice(0, 2000) });
  return turns;
}

/** Stable, non-reversible session id so an SMS thread groups without sending the raw user id. */
export function hashedSessionId(prefix, value) {
  if (!value) return undefined;
  return `${prefix}:${createHash('sha256').update(String(value)).digest('hex').slice(0, 16)}`;
}

export async function emitTrace({
  name,
  sessionId,
  provider,
  model,
  system,
  prompt,
  messages,
  output = '',
  rawOutput,
  latencyMs = 0,
  error,
  stopReason,
} = {}) {
  if (!prismTraceEnabled()) return;
  const host = (process.env.PRISMTRACE_HOST || 'https://prism-api-prod.up.railway.app').replace(/\/$/, '');
  try {
    const res = await fetch(`${host}/api/traces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PRISMtrace-Key': process.env.PRISMTRACE_API_KEY,
      },
      body: JSON.stringify({
        project_id: process.env.PRISMTRACE_PROJECT_ID,
        model: model || provider || 'unknown',
        // `messages` is the conversation as the user saw it (prior turns + her
        // new message). Without it the whole rendered prompt goes in as one
        // user message, which is what the model actually received.
        input_messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          ...(Array.isArray(messages) && messages.length
            ? messages.map((m) => ({ role: m.role, content: String(m.content ?? '') }))
            : [{ role: 'user', content: String(prompt ?? '') }]),
        ],
        output_message: output,
        latency_ms: Math.round(latencyMs),
        session_id: sessionId || randomUUID(),
        metadata: {
          name: name || 'llm',
          provider,
          // Keep the full rendered prompt findable when input_messages shows
          // the conversation instead.
          prompt: Array.isArray(messages) && messages.length ? String(prompt ?? '').slice(0, 20_000) : undefined,
          // The model's raw reply, when output_message is the readable version of it.
          raw_output: rawOutput ? String(rawOutput).slice(0, 20_000) : undefined,
          stop_reason: stopReason || undefined,
          error: error ? String(error?.message || error) : undefined,
          error_status: error?.status || undefined,
          env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
        },
      }),
      signal: AbortSignal.timeout(TRACE_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error('[prism] ingest failed:', res.status, (await res.text().catch(() => '')).slice(0, 200));
    }
  } catch (e) {
    console.error('[prism] ingest error:', e?.message || e);
  }
}
