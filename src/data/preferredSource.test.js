import { describe, expect, it, vi } from 'vitest';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

import posthog from 'posthog-js';
import { PREFERRED_SOURCE_URL, trackPreferredSourceClick } from './preferredSource';

describe('preferred source (Google)', () => {
  it('tracks preferred_source_clicked with the location', () => {
    trackPreferredSourceClick('landing_end');
    trackPreferredSourceClick('footer');
    expect(posthog.capture).toHaveBeenCalledWith('preferred_source_clicked', { location: 'landing_end' });
    expect(posthog.capture).toHaveBeenCalledWith('preferred_source_clicked', { location: 'footer' });
  });

  it('keeps the Google deeplink intact', () => {
    expect(PREFERRED_SOURCE_URL).toBe('https://www.google.com/preferences/source?q=aynahealth.co');
  });
});
