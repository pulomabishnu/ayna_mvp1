import { describe, it, expect, beforeEach } from 'vitest';
import { setFunnelClient, trackLandingCta, trackQuizStep, landingCtaCopy } from './funnelEvents.js';

const sent = [];
beforeEach(() => { sent.length = 0; setFunnelClient({ capture: (n, p) => sent.push([n, p]) }); });

describe('drop-off events', () => {
  it('records which home-page button, and nothing else', () => {
    trackLandingCta('sign_up_free');
    trackLandingCta('anything else');
    expect(sent).toEqual([['landing_cta_clicked', { cta: 'sign_up_free', surface: 'web' }]]);
  });
  it('the button words: "Sign up free" unless the landing-cta-copy flag picks "Get my free matches"; the words go with the click', () => {
    expect(landingCtaCopy()).toBe('sign_up_free');
    setFunnelClient({ capture: (n, p) => sent.push([n, p]), getFeatureFlag: () => 'get_my_free_matches' });
    expect(landingCtaCopy()).toBe('get_my_free_matches');
    setFunnelClient({ capture: (n, p) => sent.push([n, p]), getFeatureFlag: () => 'something odd' });
    expect(landingCtaCopy()).toBe('sign_up_free');
    trackLandingCta('start_quiz', 'web', 'sign_up_free');
    expect(sent.at(-1)).toEqual(['landing_cta_clicked', { cta: 'start_quiz', surface: 'web', copy: 'sign_up_free' }]);
  });
  it('records the question she sees (its name, never her answer), once per view', () => {
    trackQuizStep({ stepId: 'support', number: 3, total: 4 });
    trackQuizStep({ stepId: 'support', number: 3, total: 4 });
    trackQuizStep({ stepId: 'Cramps or period pain', number: 3, total: 4 });
    expect(sent).toEqual([['quiz_step_viewed', { step_id: 'support', step_number: 3, step_total: 4, part: 'core', surface: 'web' }]]);
  });
});
