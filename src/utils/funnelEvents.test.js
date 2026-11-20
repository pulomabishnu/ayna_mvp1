import { describe, it, expect, beforeEach } from 'vitest';
import { setFunnelClient, trackLandingCta, trackQuizStep, trackQuizAction, landingCtaCopy } from './funnelEvents.js';

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

describe('quiz detail events (Nov 19)', () => {
  it('records completed, skipped, back and stuck, with the step id only', () => {
    trackQuizAction('completed', { stepId: 'age', surface: 'app' });
    trackQuizAction('skipped', { stepId: 'zip', part: 'more' });
    trackQuizAction('back', { stepId: 'concerns' });
    trackQuizAction('invalid', { stepId: 'zip', reason: 'invalid_zip' });
    trackQuizAction('invalid', { stepId: 'age', reason: 'something private' });
    expect(sent).toEqual([
      ['quiz_step_completed', { step_id: 'age', part: 'core', surface: 'app' }],
      ['quiz_step_skipped', { step_id: 'zip', part: 'more', surface: 'web' }],
      ['quiz_back_clicked', { step_id: 'concerns', part: 'core', surface: 'web' }],
      ['quiz_validation_failed', { step_id: 'zip', part: 'core', surface: 'web', reason: 'invalid_zip' }],
      ['quiz_validation_failed', { step_id: 'age', part: 'core', surface: 'web', reason: 'incomplete' }],
    ]);
  });
  it('ignores unknown actions and unsafe step ids', () => {
    trackQuizAction('answered', { stepId: 'age' });
    trackQuizAction('completed', { stepId: 'I have PCOS' });
    expect(sent).toEqual([]);
  });
});
