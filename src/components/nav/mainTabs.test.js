import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { MAIN_TABS, APP_TABS, APP_EXPLORE_SECTIONS, AYNA_HOME_VIEWS, EXPLORE_SECTIONS, YOU_SECTIONS, LEGACY_REDIRECTS, legacyPathFor } from './mainTabs.js';

const vercel = JSON.parse(fs.readFileSync(new URL('../../../vercel.json', import.meta.url), 'utf8'));

describe('main tabs (founder, Oct 24 2026)', () => {
  it('are Today, Explore, Ask ayna, Community, You, in that order', () => {
    expect(MAIN_TABS.map((t) => t.label)).toEqual(['Today', 'Explore', 'Ask ayna', 'Community', 'You']);
  });
  it('the app has Explore, Library, ayna (centre), Community, You (founder, Oct 24 20:12)', () => {
    expect(APP_TABS.map((t) => t.label)).toEqual(['Explore', 'Library', 'ayna', 'Community', 'You']);
    expect(APP_TABS.find((t) => t.center).key).toBe('ayna');
    expect(APP_EXPLORE_SECTIONS.map((s) => s.label)).toEqual(['For you', 'Categories', 'Products', 'Services']);
    expect(AYNA_HOME_VIEWS.map((v) => v.label)).toEqual(['Chat', 'Products', 'My dashboard']);
  });
  it('Explore has the five spec sections and You the seven', () => {
    expect(EXPLORE_SECTIONS.map((s) => s.label)).toEqual(['For you', 'Categories', 'Products', 'Services', 'Resources']);
    expect(YOU_SECTIONS.map((s) => s.label)).toEqual(['My ecosystem', 'Saved', 'My health', 'Tracking', 'Connected data', 'My activity', 'Settings and privacy']);
  });
  it('every old address has a permanent server redirect to its new home', () => {
    for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) {
      const r = (vercel.redirects || []).find((x) => x.source === from && !x.has);
      expect(r, from).toBeTruthy();
      expect(r.destination).toBe(to);
      expect(r.permanent).toBe(true);
    }
  });
  it('/ecosystem?view=dashboard goes to Today, before the plain /ecosystem redirect', () => {
    const i = vercel.redirects.findIndex((x) => x.source === '/ecosystem' && x.has);
    const j = vercel.redirects.findIndex((x) => x.source === '/ecosystem' && !x.has);
    expect(vercel.redirects[i].destination).toBe('/today');
    expect(i).toBeLessThan(j);
  });
  it('maps moved pages to their old address for analytics', () => {
    expect(legacyPathFor('/explore/products')).toBe('/shop');
    expect(legacyPathFor('/explore/resources/')).toBe('/library');
    expect(legacyPathFor('/you/ecosystem')).toBe('/ecosystem');
    expect(legacyPathFor('/today')).toBe('/health');
    expect(legacyPathFor('/community')).toBe(null);
  });
});
