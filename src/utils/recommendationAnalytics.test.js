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
