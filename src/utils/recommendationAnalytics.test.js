import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
import posthog from 'posthog-js';
import { recommendationViewEvents, trackRecommendationViews, _resetRecommendationViews, matchScoreBucket } from './recommendationAnalytics';

describe('recommendation_viewed', () => {
  beforeEach(() => { posthog.capture.mockClear(); _resetRecommendationViews(); });

  it('builds productId, category and 1-based position', () => {
    expect(recommendationViewEvents([{ id: 'p-a', category: 'menstrual' }, null, { id: 'p-b' }], 'ecosystem')).toEqual([
      { productId: 'p-a', product_id: 'p-a', category: 'menstrual', position: 1, rank: 1, brand_id: undefined, is_partner: false, match_score_bucket: 'none', surface: 'ecosystem' },
      { productId: 'p-b', product_id: 'p-b', category: 'unknown', position: 3, rank: 3, brand_id: undefined, is_partner: false, match_score_bucket: 'none', surface: 'ecosystem' },
    ]);
  });

  it('logs each product once per surface', () => {
    const list = [{ id: 'p-a', category: 'x' }, { id: 'p-b', category: 'y' }];
    trackRecommendationViews(list, 'ecosystem');
    trackRecommendationViews(list, 'ecosystem');
    trackRecommendationViews(list, 'home_top_picks');
    expect(posthog.capture).toHaveBeenCalledTimes(4);
    expect(posthog.capture).toHaveBeenCalledWith('recommendation_viewed', { productId: 'p-a', product_id: 'p-a', category: 'x', position: 1, rank: 1, brand_id: undefined, is_partner: false, match_score_bucket: 'none', surface: 'ecosystem' });
  });

  it('never sends more than 24 positions', () => {
    trackRecommendationViews(Array.from({ length: 40 }, (_, i) => ({ id: `p-${i}` })), 'shop');
    expect(posthog.capture).toHaveBeenCalledTimes(24);
  });
});

describe('matchScoreBucket', () => {
  it('bands the match % and never sends the exact score', () => {
    expect(matchScoreBucket({ matchPercent: 94 })).toBe('90+');
    expect(matchScoreBucket({ matchPercentage: 80 })).toBe('75-89');
    expect(matchScoreBucket({ _match: 60 })).toBe('50-74');
    expect(matchScoreBucket({ matchPercent: 30 })).toBe('under_50');
    expect(matchScoreBucket({})).toBe('none');
    expect(matchScoreBucket({ matchPercent: null })).toBe('none');
    const [ev] = recommendationViewEvents([{ id: 'p1', matchPercent: 88 }], 's');
    expect(ev.match_score_bucket).toBe('75-89');
    expect(JSON.stringify(ev)).not.toContain('88');
  });
});

describe('shelf quality summary (Nov 19)', () => {
  it('counts full, short, empty and held shelves with the engine reason codes only', async () => {
    const { shelfQualitySummary, trackShelfQuality, _resetShelfQuality } = await import('./recommendationAnalytics.js');
    _resetShelfQuality();
    const shelves = [
      { needId: 'a', emptyReason: null },
      { needId: 'b', emptyReason: null },
      { needId: 'c', emptyReason: 'needs_safety_details' },
      { needId: 'd', emptyReason: 'care_first' },
      { needId: 'e', emptyReason: 'made_up' },
    ];
    const rows = [
      { products: [{}, {}], services: [{}] },
      { products: [{}], services: [] },
      { products: [], services: [], held: true },
      { products: [], services: [], careFirst: true },
      { products: [], services: [] },
    ];
    const s = shelfQualitySummary(shelves, rows);
    expect(s).toEqual({ shelves_count: 5, picks_count: 4, full_count: 1, short_count: 1, empty_count: 3, held_count: 1, care_first_count: 1, empty_reasons: 'care_first,needs_safety_details' });
    const sent = [];
    trackShelfQuality(s, { surface: 'app' }, (e, p) => sent.push([e, p]));
    trackShelfQuality(s, { surface: 'app' }, (e, p) => sent.push([e, p]));
    expect(sent).toHaveLength(1);
    expect(sent[0][0]).toBe('recommendation_shelves_shown');
    expect(sent[0][1].surface).toBe('app');
  });
});
