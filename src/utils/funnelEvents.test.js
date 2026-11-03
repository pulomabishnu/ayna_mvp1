import { describe, it, expect, beforeEach } from 'vitest';
import { setFunnelClient, trackLandingCta, trackQuizStep } from './funnelEvents.js';

const sent = [];
beforeEach(() => { sent.length = 0; setFunnelClient({ capture: (n, p) => sent.push([n, p]) }); });

describe('drop-off events', () => {
  it('records which home-page button, and nothing else', () => {
    trackLandingCta('sign_up_free');
    trackLandingCta('anything else');
    expect(sent).toEqual([['landing_cta_clicked', { cta: 'sign_up_free', surface: 'web' }]]);
  });
  it('records the question she sees (its name, never her answer), once per view', () => {
    trackQuizStep({ stepId: 'support', number: 3, total: 4 });
    trackQuizStep({ stepId: 'support', number: 3, total: 4 });
    trackQuizStep({ stepId: 'Cramps or period pain', number: 3, total: 4 });
    expect(sent).toEqual([['quiz_step_viewed', { step_id: 'support', step_number: 3, step_total: 4, part: 'core', surface: 'web' }]]);
  });
});
