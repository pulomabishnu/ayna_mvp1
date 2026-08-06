import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const lookupMock = vi.fn();
vi.mock('node:dns/promises', () => ({
  lookup: (...args) => lookupMock(...args),
}));

let fetchOfficialSiteText;
const realFetch = globalThis.fetch;

function htmlOk(html, contentType = 'text/html; charset=utf-8') {
  return {
    ok: true,
    headers: { get: (k) => (k.toLowerCase() === 'content-type' ? contentType : null) },
    text: async () => html,
  };
}

beforeEach(async () => {
  vi.resetModules();
  lookupMock.mockReset();
  ({ fetchOfficialSiteText } = await import('./_officialSiteFetch.js'));
});

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('fetchOfficialSiteText — SSRF guard', () => {
  it('refuses a non-http(s) scheme without ever resolving DNS', async () => {
    const result = await fetchOfficialSiteText('file:///etc/passwd');
    expect(result).toBeNull();
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('refuses "localhost" outright', async () => {
    const result = await fetchOfficialSiteText('http://localhost:8080/admin');
    expect(result).toBeNull();
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('refuses a hostname that resolves to a private IPv4 range (e.g. internal service)', async () => {
    lookupMock.mockResolvedValue({ address: '10.0.0.5', family: 4 });
    globalThis.fetch = vi.fn();
    const result = await fetchOfficialSiteText('http://internal.example.com/secrets');
    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('refuses a hostname that resolves to the cloud metadata range (169.254.x.x)', async () => {
    lookupMock.mockResolvedValue({ address: '169.254.169.254', family: 4 });
    globalThis.fetch = vi.fn();
    const result = await fetchOfficialSiteText('http://metadata.example.com/latest/meta-data/');
    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('refuses a hostname that resolves to loopback (127.x.x.x)', async () => {
    lookupMock.mockResolvedValue({ address: '127.0.0.1', family: 4 });
    globalThis.fetch = vi.fn();
    const result = await fetchOfficialSiteText('http://looksfine.example.com/');
    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('refuses a hostname that resolves to a private IPv6 range', async () => {
    lookupMock.mockResolvedValue({ address: '::1', family: 6 });
    globalThis.fetch = vi.fn();
    const result = await fetchOfficialSiteText('http://looksfine.example.com/');
    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('fails closed when DNS resolution errors, rather than fetching anyway', async () => {
    lookupMock.mockRejectedValue(new Error('ENOTFOUND'));
    globalThis.fetch = vi.fn();
    const result = await fetchOfficialSiteText('http://nonexistent.example.invalid/');
    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('never follows a redirect (would bypass the DNS check on the second hop)', async () => {
    lookupMock.mockResolvedValue({ address: '93.184.216.34', family: 4 });
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('unexpected redirect'));
    const result = await fetchOfficialSiteText('https://example.com/');
    expect(result).toBeNull();
    expect(globalThis.fetch.mock.calls[0][1].redirect).toBe('error');
  });

  it('allows a hostname that resolves to a genuine public IP', async () => {
    lookupMock.mockResolvedValue({ address: '93.184.216.34', family: 4 });
    globalThis.fetch = vi.fn().mockResolvedValue(htmlOk('<html><body><p>Real product info.</p></body></html>'));
    const result = await fetchOfficialSiteText('https://example.com/product');
    expect(result).toBe('Real product info.');
  });
});

describe('fetchOfficialSiteText — extraction', () => {
  beforeEach(() => {
    lookupMock.mockResolvedValue({ address: '93.184.216.34', family: 4 });
  });

  it('strips script and style tags entirely, not just their surrounding tags', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(htmlOk(
      '<html><head><style>.x{color:red}</style></head><body><script>alert(1)</script><p>Visible text.</p></body></html>'
    ));
    const result = await fetchOfficialSiteText('https://example.com/');
    expect(result).toBe('Visible text.');
  });

  it('decodes common HTML entities', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(htmlOk('<p>Safe &amp; effective &mdash; consult a doctor&#39;s advice</p>'));
    const result = await fetchOfficialSiteText('https://example.com/');
    expect(result).toContain('Safe & effective');
    expect(result).toContain("doctor's advice");
  });

  it('rejects a non-HTML content type (e.g. a PDF or JSON API response)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(htmlOk('{"not":"html"}', 'application/json'));
    const result = await fetchOfficialSiteText('https://example.com/api');
    expect(result).toBeNull();
  });

  it('returns null on a non-2xx response instead of throwing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, headers: { get: () => null } });
    const result = await fetchOfficialSiteText('https://example.com/gone');
    expect(result).toBeNull();
  });

  it('returns null, not a crash, on a network failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNRESET'));
    const result = await fetchOfficialSiteText('https://example.com/');
    expect(result).toBeNull();
  });

  it('caps extracted text length', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(htmlOk(`<p>${'a'.repeat(5000)}</p>`));
    const result = await fetchOfficialSiteText('https://example.com/long');
    expect(result.length).toBeLessThanOrEqual(3000);
  });

  it('caches a result and does not refetch the same URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(htmlOk('<p>Cached content.</p>'));
    globalThis.fetch = fetchMock;
    const first = await fetchOfficialSiteText('https://example.com/cached');
    const second = await fetchOfficialSiteText('https://example.com/cached');
    expect(first).toBe('Cached content.');
    expect(second).toBe('Cached content.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lookupMock).toHaveBeenCalledTimes(1);
  });
});

describe('fetchOfficialSiteText — input handling', () => {
  it('returns null for a missing/empty url without touching DNS or fetch', async () => {
    globalThis.fetch = vi.fn();
    expect(await fetchOfficialSiteText('')).toBeNull();
    expect(await fetchOfficialSiteText(undefined)).toBeNull();
    expect(await fetchOfficialSiteText(null)).toBeNull();
    expect(lookupMock).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
