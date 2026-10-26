// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { cleanProps, setAnalyticsClient, trackEvent, trackAppOpened, trackCheckin, trackPdpViewed, trackFirstMatchShown, trackQuizStarted, EVENTS } from './analyticsEvents.js';

let sent;
beforeEach(() => { sent = []; setAnalyticsClient({ capture: (n, p) => sent.push([n, p]) }); window.localStorage.clear(); });

describe('analyticsEvents: ids, surface and counts only', () => {
  it('drops anything that is not an allowed key or a safe value', () => {
    expect(cleanProps({ surface: 'app', product_id: 'diva-cup', symptoms: 'cramps', query: 'heavy bleeding', position: 2.4, where: 'has spaces no' })).toEqual({ surface: 'app', product_id: 'diva-cup', position: 2 });
  });
  it('unknown events are not sent', () => {
    trackEvent('cycle_day_logged', { surface: 'app' });
    expect(sent).toEqual([]);
  });
  it('app_opened once per local day with days since first open', () => {
    trackAppOpened({ surface: 'app' }, new Date(2026, 9, 1, 9));
    trackAppOpened({ surface: 'app' }, new Date(2026, 9, 1, 23));
    trackAppOpened({ surface: 'app' }, new Date(2026, 9, 8, 7));
    expect(sent.map(([n, p]) => [n, p.days_since_first_open])).toEqual([[EVENTS.APP_OPENED, 0], [EVENTS.APP_OPENED, 7]]);
  });
  it('check-ins per week counts local days in the last 7', () => {
    trackCheckin({ surface: 'web' }, new Date(2026, 9, 1, 8));
    trackCheckin({ surface: 'web' }, new Date(2026, 9, 1, 22));
    trackCheckin({ surface: 'web' }, new Date(2026, 9, 3, 8));
    trackCheckin({ surface: 'web' }, new Date(2026, 9, 9, 8));
    expect(sent.map(([, p]) => p.checkins_this_week)).toEqual([1, 1, 2, 2]);
  });
  it('pdp_viewed flags products with 5+ reviews; first match only once', () => {
    trackPdpViewed({ surface: 'web', product_id: 'p1', review_count: 6 });
    expect(sent[0][1]).toEqual({ surface: 'web', product_id: 'p1', review_count: 6, has_5_reviews: true });
    trackQuizStarted({ surface: 'web' });
    trackFirstMatchShown({ surface: 'web', matches_count: 12 });
    trackFirstMatchShown({ surface: 'web', matches_count: 12 });
    expect(sent.filter(([n]) => n === EVENTS.FIRST_MATCH_SHOWN)).toHaveLength(1);
  });
});
