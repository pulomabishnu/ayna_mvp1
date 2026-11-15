import { describe, expect, it } from 'vitest';
import { firstTouch, firstTouchFrom } from './campaignAttribution.js';

const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
describe('first-touch attribution', () => {
  it('keeps utm source from the landing URL and reuses it on later visits', () => {
    const s = mem();
    expect(firstTouch(s, { search: '?utm_source=TikTok&utm_medium=social&utm_campaign=launch' }, { referrer: '' })).toEqual({ first_utm_source: 'tiktok', first_utm_medium: 'social', first_utm_campaign: 'launch' });
    expect(firstTouch(s, { search: '' }, { referrer: 'https://google.com' }).first_utm_source).toBe('tiktok');
  });
  it('falls back to a social referrer', () => {
    expect(firstTouchFrom({ referrer: 'https://www.tiktok.com/@ayna' })).toMatchObject({ first_utm_source: 'tiktok', first_utm_medium: 'referral' });
    expect(firstTouchFrom({ referrer: 'https://www.google.com/' })).toBe(null);
  });
});
