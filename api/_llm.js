/* global process */
/**
 * Shared LLM transport for every /api route that talks to Anthropic or OpenAI.
 *
 * Replaces the `if (!res.ok) return null` pattern that was duplicated across
 * five routes. That pattern collapsed "revoked API key" (401), "rate limited"
 * (429), "overloaded" (529) and "the model said nothing" into one indisting-
 * uishable null, so callers silently dropped work, retried nothing, and
 * reported success. Every failure here carries its status and is classified as
 * retryable or not.
 */

export class LlmError extends Error {
  constructor(message, { provider, status = 0, retryable = false, body = '' } = {}) {
    super(message);
    this.name = 'LlmError';
    this.provider = provider;
    this.status = status;
    this.retryable = retryable;
    this.body = body;
  }
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_ATTEMPTS = 3;
/** Never sleep longer than this for a server-supplied Retry-After. */
const MAX_BACKOFF_MS = 8_000;

/** 429 and 5xx are transient; 4xx (bad key, bad model, bad request) are not. */
function isRetryableStatus(status) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

/**
 * Honor the provider's own backoff hint when present, else exponential with
 * jitter. Jitter matters because our concerns fan out concurrently — without
 * it every worker retries on the same tick and re-triggers the same 429.
 */
function backoffMs(attempt, retryAfterHeader) {
  const retryAfter = Number.parseFloat(retryAfterHeader || '');
  if (Number.isFinite(retryAfter) && retryAfter >= 0) {
    return Math.min(retryAfter * 1000, MAX_BACKOFF_MS);
  }
  const base = Math.min(500 * 2 ** attempt, MAX_BACKOFF_MS);
  return base / 2 + Math.random() * (base / 2);
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new LlmError('aborted', { retryable: false }));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new LlmError('aborted', { retryable: false })); }, { once: true });
  });
}

/** Combine our per-attempt timeout with any caller deadline. */
function attemptSignal(timeoutMs, outerSignal) {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (!outerSignal) return timeout;
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([timeout, outerSignal]);
  return timeout;
}

async function requestWithRetry(url, init, { provider, timeoutMs, maxAttempts, signal }) {
  let last = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (signal?.aborted) throw new LlmError('deadline exceeded before request', { provider, retryable: false });
    let res;
    try {
      res = await fetch(url, { ...init, signal: attemptSignal(timeoutMs, signal) });
    } catch (e) {
      // Network error or timeout — transient by nature.
      last = new LlmError(`${provider} request failed: ${e?.message || e}`, {
        provider, status: 0, retryable: true,
      });
      if (attempt < maxAttempts - 1) { await sleep(backoffMs(attempt), signal); continue; }
      throw last;
    }

    if (res.ok) return res;

    const body = await res.text().catch(() => '');
    const retryable = isRetryableStatus(res.status);
    last = new LlmError(`${provider} returned ${res.status}`, {
      provider, status: res.status, retryable, body: body.slice(0, 400),
    });
    // A bad key or bad model will fail identically forever — don't burn the budget.
    if (!retryable) throw last;
    if (attempt < maxAttempts - 1) {
      await sleep(backoffMs(attempt, res.headers.get('retry-after')), signal);
      continue;
    }
    throw last;
  }
  throw last || new LlmError(`${provider} failed`, { provider });
}

/**
 * @returns {Promise<{text: string, stopReason: string, truncated: boolean, provider: string}>}
 *   `truncated` is true when the model hit max_tokens — the caller must treat
 *   the payload as incomplete rather than trying to parse a half-written object.
 */
export async function callAnthropic({
  system,
  prompt,
  maxTokens = 4000,
  model,
  temperature = 0.2,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  signal,
} = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new LlmError('ANTHROPIC_API_KEY is not set', { provider: 'anthropic', retryable: false });
  const res = await requestWithRetry(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model || process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
        max_tokens: maxTokens,
        temperature,
        ...(system ? { system } : {}),
        messages: [{ role: 'user', content: prompt }],
      }),
    },
    { provider: 'anthropic', timeoutMs, maxAttempts, signal }
  );

  const data = await res.json();
  const text = data?.content?.[0]?.text;
  const stopReason = data?.stop_reason || '';
  if (typeof text !== 'string' || !text.trim()) {
    throw new LlmError('anthropic returned no text', { provider: 'anthropic', status: res.status });
  }
  return { text, stopReason, truncated: stopReason === 'max_tokens', provider: 'anthropic' };
}

export async function callOpenAI({
  system,
  prompt,
  maxTokens = 4000,
  model,
  temperature = 0.2,
  jsonMode = false,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  signal,
} = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new LlmError('OPENAI_API_KEY is not set', { provider: 'openai', retryable: false });
  const res = await requestWithRetry(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature,
        max_tokens: maxTokens,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt },
        ],
      }),
    },
    { provider: 'openai', timeoutMs, maxAttempts, signal }
  );

  const data = await res.json();
  const choice = data?.choices?.[0];
  const text = choice?.message?.content;
  const stopReason = choice?.finish_reason || '';
  if (typeof text !== 'string' || !text.trim()) {
    throw new LlmError('openai returned no text', { provider: 'openai', status: res.status });
  }
  return { text, stopReason, truncated: stopReason === 'length', provider: 'openai' };
}

function firstEnv(...names) {
  for (const name of names) {
    if (process.env[name]) return process.env[name];
  }
  return undefined;
}

/**
 * Gemini can be reached two ways: directly with a Google AI Studio key, or
 * through Vercel's AI Gateway (an OpenAI-compatible proxy). The gateway key
 * takes priority when both are set, since a gateway deployment is usually a
 * deliberate choice to centralize billing/observability.
 */
function geminiCredentials() {
  const gatewayKey = firstEnv('GEMINI_AI_GATEWAY_API_KEY', 'AI_GATEWAY_API_KEY');
  if (gatewayKey) {
    return {
      mode: 'gateway',
      apiKey: gatewayKey,
      baseUrl: (process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1').replace(/\/$/, ''),
      model: process.env.AI_GATEWAY_GEMINI_MODEL || 'google/gemini-2.5-flash',
    };
  }
  const directKey = firstEnv('GEMINI_API_KEY', 'GOOGLE_AI_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY', 'GOOGLE_API_KEY');
  if (directKey) {
    return { mode: 'direct', apiKey: directKey, model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' };
  }
  return null;
}

export async function callGemini({
  system,
  prompt,
  maxTokens = 4000,
  model,
  temperature = 0.2,
  jsonMode = false,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  signal,
} = {}) {
  const creds = geminiCredentials();
  if (!creds) throw new LlmError('no Gemini credentials configured', { provider: 'gemini', retryable: false });

  if (creds.mode === 'gateway') {
    // The gateway speaks the OpenAI chat-completions shape regardless of the
    // underlying model, so this mirrors callOpenAI rather than the native API.
    const res = await requestWithRetry(
      `${creds.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${creds.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || creds.model,
          temperature,
          max_tokens: maxTokens,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: prompt },
          ],
        }),
      },
      { provider: 'gemini', timeoutMs, maxAttempts, signal }
    );
    const data = await res.json();
    const choice = data?.choices?.[0];
    const text = choice?.message?.content;
    const stopReason = choice?.finish_reason || '';
    if (typeof text !== 'string' || !text.trim()) {
      throw new LlmError('gemini (gateway) returned no text', { provider: 'gemini', status: res.status });
    }
    return { text, stopReason, truncated: stopReason === 'length', provider: 'gemini' };
  }

  const res = await requestWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${model || creds.model}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': creds.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    },
    { provider: 'gemini', timeoutMs, maxAttempts, signal }
  );
  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const text = (candidate?.content?.parts || []).map((p) => p.text || '').join('');
  const stopReason = candidate?.finishReason || '';
  if (!text.trim()) {
    throw new LlmError('gemini returned no text', { provider: 'gemini', status: res.status });
  }
  return { text, stopReason, truncated: stopReason === 'MAX_TOKENS', provider: 'gemini' };
}

export function providerConfigured(name) {
  const n = name === 'claude' ? 'anthropic' : name;
  if (n === 'anthropic') return !!process.env.ANTHROPIC_API_KEY;
  if (n === 'openai') return !!process.env.OPENAI_API_KEY;
  if (n === 'gemini') return !!geminiCredentials();
  return false;
}

export function parseProviderOrder(envName, fallback) {
  return (process.env[envName] || fallback || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .map((s) => (s === 'claude' ? 'anthropic' : s))
    .filter((s) => s === 'anthropic' || s === 'openai' || s === 'gemini')
    .filter((s, i, arr) => arr.indexOf(s) === i);
}

/**
 * Try providers in order. Unlike the previous per-route loops, a non-retryable
 * failure on provider A still falls through to provider B, but the reason is
 * preserved and re-thrown if every provider fails — so the caller can return a
 * real status code instead of a generic 502.
 */
export async function callWithFallback(order, args = {}) {
  const errors = [];
  for (const provider of order) {
    if (!providerConfigured(provider)) continue;
    try {
      if (provider === 'anthropic') return await callAnthropic({ ...args, ...(args.anthropic || {}) });
      if (provider === 'openai') return await callOpenAI({ ...args, ...(args.openai || {}) });
      if (provider === 'gemini') return await callGemini({ ...args, ...(args.gemini || {}) });
    } catch (e) {
      console.error(`[llm] ${provider} failed:`, e?.status || '', e?.message, e?.body ? `| ${e.body}` : '');
      errors.push(e);
      if (args.signal?.aborted) break;
    }
  }
  const first = errors[0];
  throw new LlmError(
    errors.length ? `all providers failed: ${errors.map((e) => `${e.provider}=${e.status || 'err'}`).join(', ')}` : 'no provider configured',
    { provider: first?.provider || 'none', status: first?.status || 0, body: first?.body || '' }
  );
}

// ─── JSON recovery ────────────────────────────────────────────────────────────

/** Balanced-brace scan that ignores braces inside strings. */
export function extractBalancedJsonObject(input) {
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
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return '';
}

/**
 * Tolerant JSON parse for model output: strips code fences, extracts the
 * balanced object, and drops trailing commas. Returns null when unrecoverable.
 */
export function tryParseJsonCandidate(raw) {
  const text = String(raw || '')
    .replace(/^\uFEFF/, '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
  if (!text) return null;
  const candidates = [text, extractBalancedJsonObject(text)].filter(Boolean);
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        return JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1'));
      } catch { /* try next candidate */ }
    }
  }
  return null;
}
