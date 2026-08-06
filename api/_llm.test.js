/* global process */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  callAnthropic,
  callOpenAI,
  callGemini,
  callWithFallback,
  parseProviderOrder,
  tryParseJsonCandidate,
  extractBalancedJsonObject,
  LlmError,
} from './_llm.js';

const realFetch = globalThis.fetch;

function anthropicOk(text, stopReason = 'end_turn') {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({ content: [{ text }], stop_reason: stopReason }),
  };
}
function openaiOk(text, finish = 'stop') {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({ choices: [{ message: { content: text }, finish_reason: finish }] }),
  };
}
function geminiOk(text, finishReason = 'STOP') {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({ candidates: [{ content: { parts: [{ text }] }, finishReason }] }),
  };
}
function httpError(status, headers = {}) {
  return {
    ok: false,
    status,
    headers: new Headers(headers),
    text: async () => `{"error":"status ${status}"}`,
  };
}

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-anthropic';
  process.env.OPENAI_API_KEY = 'test-openai';
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_AI_API_KEY;
  delete process.env.GEMINI_AI_GATEWAY_API_KEY;
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.AI_GATEWAY_BASE_URL;
});

/** Run a promise to completion while auto-advancing the fake backoff timers. */
async function runWithTimers(promise) {
  const settled = promise.then(
    (v) => ({ ok: true, v }),
    (e) => ({ ok: false, e })
  );
  // Each retry sleeps; flush repeatedly so the loop can proceed.
  for (let i = 0; i < 20; i++) {
    await vi.advanceTimersByTimeAsync(10_000);
  }
  const r = await settled;
  if (r.ok) return r.v;
  throw r.e;
}

describe('retry policy', () => {
  it('retries a 429 and succeeds — the old code dropped the work silently', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(httpError(429, { 'retry-after': '1' }))
      .mockResolvedValueOnce(anthropicOk('{"ok":true}'));
    globalThis.fetch = fetchMock;

    const out = await runWithTimers(callAnthropic({ prompt: 'hi' }));
    expect(out.text).toBe('{"ok":true}');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries 5xx', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(httpError(529))
      .mockResolvedValueOnce(httpError(500))
      .mockResolvedValueOnce(anthropicOk('ok'));
    globalThis.fetch = fetchMock;

    const out = await runWithTimers(callAnthropic({ prompt: 'hi' }));
    expect(out.text).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does NOT retry a 401 — a revoked key fails the same way forever', async () => {
    const fetchMock = vi.fn().mockResolvedValue(httpError(401));
    globalThis.fetch = fetchMock;

    await expect(runWithTimers(callAnthropic({ prompt: 'hi' }))).rejects.toMatchObject({
      name: 'LlmError',
      status: 401,
      retryable: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('gives up after maxAttempts and preserves the status', async () => {
    const fetchMock = vi.fn().mockResolvedValue(httpError(429));
    globalThis.fetch = fetchMock;

    await expect(runWithTimers(callAnthropic({ prompt: 'hi', maxAttempts: 3 }))).rejects.toMatchObject({ status: 429 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries a network error', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce(anthropicOk('recovered'));
    globalThis.fetch = fetchMock;

    const out = await runWithTimers(callAnthropic({ prompt: 'hi' }));
    expect(out.text).toBe('recovered');
  });
});

describe('temperature override', () => {
  it('defaults to 0.2 when not specified', async () => {
    const fetchMock = vi.fn().mockResolvedValue(anthropicOk('ok'));
    globalThis.fetch = fetchMock;
    await runWithTimers(callAnthropic({ prompt: 'hi' }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.temperature).toBe(0.2);
  });

  it('is forwarded to Anthropic when specified', async () => {
    const fetchMock = vi.fn().mockResolvedValue(anthropicOk('ok'));
    globalThis.fetch = fetchMock;
    await runWithTimers(callAnthropic({ prompt: 'hi', temperature: 0.25 }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.temperature).toBe(0.25);
  });

  it('is forwarded to OpenAI when specified', async () => {
    const fetchMock = vi.fn().mockResolvedValue(openaiOk('ok'));
    globalThis.fetch = fetchMock;
    await runWithTimers(callOpenAI({ prompt: 'hi', temperature: 0.25 }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.temperature).toBe(0.25);
  });
});

describe('truncation detection', () => {
  it('flags stop_reason=max_tokens so a half-written object is not treated as complete', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(anthropicOk('{"recommendations":[', 'max_tokens'));
    const out = await runWithTimers(callAnthropic({ prompt: 'hi' }));
    expect(out.truncated).toBe(true);
  });

  it('flags finish_reason=length on OpenAI', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(openaiOk('{"a":', 'length'));
    const out = await runWithTimers(callOpenAI({ prompt: 'hi' }));
    expect(out.truncated).toBe(true);
  });

  it('does not flag a normal completion', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(anthropicOk('{"a":1}'));
    const out = await runWithTimers(callAnthropic({ prompt: 'hi' }));
    expect(out.truncated).toBe(false);
  });
});

describe('provider fallback', () => {
  it('falls through to the second provider when the first fails hard', async () => {
    const fetchMock = vi.fn().mockImplementation((url) =>
      Promise.resolve(String(url).includes('anthropic') ? httpError(401) : openaiOk('from openai'))
    );
    globalThis.fetch = fetchMock;

    const out = await runWithTimers(callWithFallback(['anthropic', 'openai'], { prompt: 'hi' }));
    expect(out.text).toBe('from openai');
    expect(out.provider).toBe('openai');
  });

  it('throws an aggregated error naming every provider when all fail', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(httpError(401));
    await expect(
      runWithTimers(callWithFallback(['anthropic', 'openai'], { prompt: 'hi' }))
    ).rejects.toMatchObject({ name: 'LlmError' });
  });

  it('skips providers with no configured key rather than failing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    globalThis.fetch = vi.fn().mockResolvedValue(openaiOk('only openai'));
    const out = await runWithTimers(callWithFallback(['anthropic', 'openai'], { prompt: 'hi' }));
    expect(out.provider).toBe('openai');
  });

  it('treats an empty completion as a failure instead of returning it', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(anthropicOk('   '));
    await expect(runWithTimers(callAnthropic({ prompt: 'hi' }))).rejects.toBeInstanceOf(LlmError);
  });
});

describe('Gemini', () => {
  it('calls the direct API when a Gemini key is set', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini';
    const fetchMock = vi.fn().mockResolvedValue(geminiOk('hello from gemini'));
    globalThis.fetch = fetchMock;

    const out = await runWithTimers(callGemini({ prompt: 'hi' }));
    expect(out.text).toBe('hello from gemini');
    expect(out.provider).toBe('gemini');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('generativelanguage.googleapis.com');
    expect(init.headers['x-goog-api-key']).toBe('test-gemini');
  });

  it('prefers the AI Gateway when a gateway key is set', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini';
    process.env.AI_GATEWAY_API_KEY = 'test-gateway';
    const fetchMock = vi.fn().mockResolvedValue(openaiOk('hello from gateway'));
    globalThis.fetch = fetchMock;

    const out = await runWithTimers(callGemini({ prompt: 'hi' }));
    expect(out.text).toBe('hello from gateway');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('ai-gateway.vercel.sh');
    expect(init.headers.Authorization).toBe('Bearer test-gateway');
  });

  it('flags MAX_TOKENS as truncated', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini';
    globalThis.fetch = vi.fn().mockResolvedValue(geminiOk('{"a":', 'MAX_TOKENS'));
    const out = await runWithTimers(callGemini({ prompt: 'hi' }));
    expect(out.truncated).toBe(true);
  });

  it('throws when no Gemini credentials are configured', async () => {
    await expect(callGemini({ prompt: 'hi' })).rejects.toMatchObject({ provider: 'gemini', retryable: false });
  });

  it('participates in provider fallback', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini';
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    globalThis.fetch = vi.fn().mockResolvedValue(geminiOk('gemini answered'));

    const out = await runWithTimers(callWithFallback(['anthropic', 'openai', 'gemini'], { prompt: 'hi' }));
    expect(out.provider).toBe('gemini');
    expect(out.text).toBe('gemini answered');
  });
});

describe('parseProviderOrder', () => {
  it('normalizes "claude" to anthropic and dedupes', () => {
    process.env.T = 'claude, anthropic ,openai';
    expect(parseProviderOrder('T', '')).toEqual(['anthropic', 'openai']);
  });
  it('drops unknown providers', () => {
    process.env.T = 'mistral,openai';
    expect(parseProviderOrder('T', '')).toEqual(['openai']);
  });
  it('keeps gemini in the order', () => {
    process.env.T = 'gemini,openai';
    expect(parseProviderOrder('T', '')).toEqual(['gemini', 'openai']);
  });
  it('falls back when the env var is unset', () => {
    delete process.env.T;
    expect(parseProviderOrder('T', 'anthropic,openai')).toEqual(['anthropic', 'openai']);
  });
});

describe('JSON recovery', () => {
  it('parses a fenced object', () => {
    expect(tryParseJsonCandidate('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it('parses an object with prose around it', () => {
    expect(tryParseJsonCandidate('Sure! {"a":1} hope that helps')).toEqual({ a: 1 });
  });
  it('tolerates a trailing comma', () => {
    expect(tryParseJsonCandidate('{"a":1,}')).toEqual({ a: 1 });
  });
  it('returns null for truncated JSON rather than a partial object', () => {
    expect(tryParseJsonCandidate('{"recommendations":[{"a":1}')).toBeNull();
  });
  it('ignores braces inside strings when balancing', () => {
    expect(extractBalancedJsonObject('{"a":"}not the end{","b":2}')).toBe('{"a":"}not the end{","b":2}');
  });
  it('returns null on empty input', () => {
    expect(tryParseJsonCandidate('')).toBeNull();
    expect(tryParseJsonCandidate(null)).toBeNull();
  });
});
