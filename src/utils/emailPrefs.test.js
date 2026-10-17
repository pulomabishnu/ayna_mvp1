import { describe, it, expect } from 'vitest';
import { normalizeEmailPrefs, EMAIL_DEFAULTS, EMAIL_GROUPS } from './emailPrefs.js';

describe('email preferences', () => {
  it('fills defaults: everything on, weekly roundups', () => {
    expect(normalizeEmailPrefs(null)).toEqual(EMAIL_DEFAULTS);
    expect(EMAIL_DEFAULTS.partners).toBe(true);
    expect(EMAIL_DEFAULTS.communityFreq).toBe('weekly');
  });
  it('keeps her choices and drops junk', () => {
    const p = normalizeEmailPrefs({ community: false, ecosystemFreq: 'instant', communityFreq: 'hourly', admin: true, safety: 'no' });
    expect(p.community).toBe(false);
    expect(p.ecosystemFreq).toBe('instant');
    expect(p.communityFreq).toBe('weekly');
    expect(p.safety).toBe(true);
    expect('admin' in p).toBe(false);
  });
  it('lists every group with a default', () => {
    for (const g of EMAIL_GROUPS) expect(typeof EMAIL_DEFAULTS[g.id]).toBe('boolean');
  });
});
