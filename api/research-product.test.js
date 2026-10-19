import { describe, it, expect, vi, afterEach } from 'vitest';
import { mockRes, mockReq, withEnv } from './_test-helpers.js';
import { sanitizeDraft, isCredibleUrl, isSearchUrl, plain, dropUrls } from './_productResearch.js';
import { mergeApprovedResearch } from '../src/utils/approvedResearch.js';

vi.mock('@supabase/supabase-js', () => ({ createClient: () => globalThis.__mockAdmin }));

describe('research safety checks', () => {
  it('keeps only government, journal and medical-society sources for clinical and science', () => {
    const { draft, issues } = sanitizeDraft('clinical', { clinicalSources: [
      { url: 'https://www.fda.gov/consumers/x', label: 'FDA' },
      { url: 'https://www.healthline.com/x', label: 'Healthline' },
      { url: 'https://brand.com/blog', label: 'Brand' },
    ] });
    expect(draft.clinicalSources.map((s) => s.label)).toEqual(['FDA']);
    expect(issues.length).toBe(2);
  });
  it('refuses search-result links', () => {
    expect(isSearchUrl('https://pubmed.ncbi.nlm.nih.gov/?term=x&q=y')).toBe(true);
    expect(isCredibleUrl('https://www.reddit.com/r/x/search/?q=lola')).toBe(false);
  });
  it('drops a named doctor and claim words, and removes dashes', () => {
    const { draft } = sanitizeDraft('who', { whoItsFor: ['Dr. Sterling recommends it', 'A miracle cure', 'People with dryness — after menopause'] });
    expect(draft.whoItsFor).toEqual(['People with dryness, after menopause']);
    expect(plain('4–8 hours')).toBe('4 to 8 hours');
  });
  it('drops a review summary with no review pages linked', () => {
    const { draft } = sanitizeDraft('reviews', { communityReview: 'People like it.', sources: [] });
    expect(draft.communityReview).toBe('');
  });
  it('drops how-to steps with no source page', () => {
    const { draft } = sanitizeDraft('how', { howToUse: { intro: 'x', steps: ['Do it.'] } });
    expect(draft.howToUse).toBeNull();
  });
  it('removes links that did not load', () => {
    const d = dropUrls({ scienceSources: [{ url: 'https://a.gov/1' }, { url: 'https://a.gov/2' }] }, new Set(['https://a.gov/2']));
    expect(d.scienceSources).toHaveLength(1);
  });
});

describe('approved research only fills empty sections', () => {
  it('never replaces what the team wrote', () => {
    const team = { id: 'p', whoItsFor: ['Team bullet'], howToUse: { intro: 'Team intro', steps: [] }, communityReview: 'Team review' };
    const out = mergeApprovedResearch(team, {
      who: { whoItsFor: ['Research bullet'] },
      how: { howToUse: { intro: 'R', steps: ['Step'] } },
      reviews: { communityReview: 'Research review', sources: [{ url: 'https://x.com' }] },
    });
    expect(out.whoItsFor).toEqual(['Team bullet']);
    expect(out.howToUse.intro).toBe('Team intro');
    expect(out.communityReview).toBe('Team review');
  });
  it('fills a section the team left empty', () => {
    const out = mergeApprovedResearch({ id: 'p' }, { who: { whoItsFor: ['Research bullet'] } });
    expect(out.whoItsFor).toEqual(['Research bullet']);
  });
});

describe('admin gate', () => {
  let restore;
  afterEach(() => { restore?.(); globalThis.__mockAdmin = undefined; });
  function admin(email, confirmed = true) {
    return {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'u', email, email_confirmed_at: confirmed ? '2026-10-01T00:00:00Z' : null } }, error: null })) },
      from: () => ({ select: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }) }),
    };
  }
  it('turns away anyone not on ADMIN_EMAILS', async () => {
    restore = withEnv({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k', ADMIN_EMAILS: 'eliz@aynahealth.co' });
    globalThis.__mockAdmin = admin('someone@else.com');
    vi.resetModules();
    const handler = (await import('./research-product.js')).default;
    const res = mockRes();
    await handler(mockReq({ method: 'GET', query: { list: '1' } }), res);
    expect(res.statusCode).toBe(403);
  });
  it('turns away an ADMIN_EMAILS address that was never confirmed', async () => {
    restore = withEnv({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k', ADMIN_EMAILS: 'eliz@aynahealth.co' });
    globalThis.__mockAdmin = admin('eliz@aynahealth.co', false);
    vi.resetModules();
    const handler = (await import('./research-product.js')).default;
    const res = mockRes();
    await handler(mockReq({ method: 'GET', query: { list: '1' } }), res);
    expect(res.statusCode).toBe(403);
  });
  it('lets a team admin list drafts', async () => {
    restore = withEnv({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k', ADMIN_EMAILS: 'eliz@aynahealth.co' });
    globalThis.__mockAdmin = admin('Eliz@aynahealth.co');
    vi.resetModules();
    const handler = (await import('./research-product.js')).default;
    const res = mockRes();
    await handler(mockReq({ method: 'GET', query: { list: '1' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.drafts).toEqual([]);
  });
});
