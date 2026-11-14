// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
const capture = vi.fn();
vi.mock('posthog-js', () => ({ default: { capture: (...a) => capture(...a) } }));
vi.mock('../data/catalog.js', () => ({ loadCatalog: async () => {}, ALL_PRODUCTS: [], getProductById: () => null }));
const { fetchSearchSuggestions } = await import('./fetchSearchSuggestions.js');

// Notion AYNA-344/345: every AI search in the iPhone app ends in ai_search_completed or
// ai_search_failed, and each carries platform = ios_app.
describe('AI search events from the iPhone app', () => {
  afterEach(() => { delete window.Capacitor; capture.mockReset(); vi.unstubAllGlobals(); });
  it('a network error is ai_search_failed with platform ios_app', async () => {
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios' };
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Load failed'); }));
    await expect(fetchSearchSuggestions({ source: 'app_browse', query: 'sleep mask zz' })).rejects.toThrow();
    const ev = capture.mock.calls.find(([e]) => e === 'ai_search_failed');
    expect(ev?.[1]).toMatchObject({ platform: 'ios_app', code: 'network_error' });
  });
  it('a server error is ai_search_failed; results are ai_search_completed; both ios_app', async () => {
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios' };
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'claude_failed' }), { status: 502 })));
    await fetchSearchSuggestions({ source: 'app_browse', query: 'joint ache cream q1' });
    expect(capture.mock.calls.find(([e]) => e === 'ai_search_failed')?.[1]).toMatchObject({ platform: 'ios_app', code: 'claude_failed', status: 502 });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ suggestions: [] }), { status: 200 })));
    await fetchSearchSuggestions({ source: 'app_browse', query: 'joint ache cream q2' });
    expect(capture.mock.calls.find(([e]) => e === 'ai_search_completed')?.[1]).toMatchObject({ platform: 'ios_app' });
  });
  it('on the website it says web', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ suggestions: [] }), { status: 200 })));
    await fetchSearchSuggestions({ source: 'discovery', query: 'web query q3' });
    expect(capture.mock.calls.find(([e]) => e === 'ai_search_completed')?.[1]).toMatchObject({ platform: 'web' });
  });
});
