import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const capture = vi.fn();
vi.mock('posthog-js', () => ({ default: { capture: (...a) => capture(...a) } }));
vi.mock('../data/catalog.js', () => ({ loadCatalog: async () => {} }));
vi.mock('./catalogIntegrity', () => ({ filterProductListToCatalog: (l) => (Array.isArray(l) ? l : []) }));
vi.mock('./conversationId', () => ({ getAppSessionId: () => 'test-session' }));
vi.mock('./apiUrl.js', () => ({ apiUrl: (p) => p }));

const { fetchSearchSuggestions, isRetryableSearchFailure, SEARCH_RETRY_DELAY_MS } = await import('./fetchSearchSuggestions.js');

const reply = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });

describe('fetchSearchSuggestions retry', () => {
  beforeEach(() => {
    capture.mockClear();
    vi.useFakeTimers();
    globalThis.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('only AI-provider failures are retryable, not rate limits', () => {
    expect(isRetryableSearchFailure(502, {})).toBe(true);
    expect(isRetryableSearchFailure(500, { error: 'claude_failed' })).toBe(true);
    expect(isRetryableSearchFailure(500, { error: 'invalid_model_json' })).toBe(true);
    expect(isRetryableSearchFailure(429, { error: 'rate_limited' })).toBe(false);
    expect(isRetryableSearchFailure(401, {})).toBe(false);
    expect(isRetryableSearchFailure(400, { error: 'query_too_short' })).toBe(false);
  });

  it('retries once after a 502 and returns the second answer', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(reply(502, { error: 'claude_failed' }))
      .mockResolvedValueOnce(reply(200, { suggestions: [{ id: 'p1' }], querySummary: 'ok' }));
    vi.stubGlobal('fetch', fetch);
    const p = fetchSearchSuggestions({ query: 'cramps' });
    await vi.advanceTimersByTimeAsync(SEARCH_RETRY_DELAY_MS);
    const out = await p;
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(out.suggestions).toEqual([{ id: 'p1' }]);
    expect(capture).toHaveBeenCalledWith('ai_search_completed', expect.objectContaining({ retried: true }));
  });

  it('gives up after one retry and shows the friendly message', async () => {
    const fetch = vi.fn().mockResolvedValue(reply(502, { error: 'claude_failed' }));
    vi.stubGlobal('fetch', fetch);
    const p = fetchSearchSuggestions({ query: 'cramps' });
    await vi.advanceTimersByTimeAsync(SEARCH_RETRY_DELAY_MS);
    const out = await p;
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(out.error).toMatch(/having trouble/);
    expect(capture).toHaveBeenCalledWith('ai_search_failed', expect.objectContaining({ retried: true, status: 502 }));
  });

  it('does not retry a 429', async () => {
    const fetch = vi.fn().mockResolvedValue(reply(429, { error: 'rate_limited' }));
    vi.stubGlobal('fetch', fetch);
    const out = await fetchSearchSuggestions({ query: 'cramps' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(out.code).toBe('rate_limited');
  });

  it('stops waiting if the search is cancelled during the pause', async () => {
    const fetch = vi.fn().mockResolvedValue(reply(502, { error: 'claude_failed' }));
    vi.stubGlobal('fetch', fetch);
    const ctrl = new AbortController();
    const p = fetchSearchSuggestions({ query: 'cramps', signal: ctrl.signal });
    const settled = expect(p).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(100);
    ctrl.abort();
    await settled;
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
