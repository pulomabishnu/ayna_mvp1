import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
import posthog from 'posthog-js';
import { recommendationViewEvents, trackRecommendationViews, _resetRecommendationViews } from './recommendationAnalytics';

describe('recommendation_viewed', () => {
  beforeEach(() => { posthog.capture.mockClear(); _resetRecommendationViews(); });

  it('builds productId, category and 1-based position', () => {
    expect(recommendationViewEvents([{ id: 'p-a', category: 'menstrual' }, null, { id: 'p-b' }], 'ecosystem')).toEqual([
      { productId: 'p-a', category: 'menstrual', position: 1, surface: 'ecosystem' },
      { productId: 'p-b', category: 'unknown', position: 3, surface: 'ecosystem' },
    ]);
  });

  it('logs each product once per surface', () => {
    const list = [{ id: 'p-a', category: 'x' }, { id: 'p-b', category: 'y' }];
    trackRecommendationViews(list, 'ecosystem');
    trackRecommendationViews(list, 'ecosystem');
    trackRecommendationViews(list, 'home_top_picks');
    expect(posthog.capture).toHaveBeenCalledTimes(4);
    expect(posthog.capture).toHaveBeenCalledWith('recommendation_viewed', { productId: 'p-a', category: 'x', position: 1, surface: 'ecosystem' });
  });

  it('never sends more than 24 positions', () => {
    trackRecommendationViews(Array.from({ length: 40 }, (_, i) => ({ id: `p-${i}` })), 'shop');
    expect(posthog.capture).toHaveBeenCalledTimes(24);
  });
});
