import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { MAIN_TABS, APP_TABS, APP_TABS_CHAT_FIRST, APP_EXPLORE_SECTIONS, AYNA_HOME_VIEWS, EXPLORE_SECTIONS, YOU_SECTIONS, LEGACY_REDIRECTS, legacyPathFor } from './mainTabs.js';

const vercel = JSON.parse(fs.readFileSync(new URL('../../../vercel.json', import.meta.url), 'utf8'));

describe('main tabs (founder, Oct 24 2026)', () => {
  it('are Shop, Services, Home, Community, Library, in that order (founder, Oct 26; Today renamed Home 21:45)', () => {
    expect(MAIN_TABS.map((t) => t.label)).toEqual(['Shop', 'Services', 'Home', 'Community', 'Library']);
    // The keys stay, so routes, analytics and CSS keep working.
    expect(MAIN_TABS.map((t) => t.key)).toEqual(['explore', 'services', 'today', 'community', 'library']);
    // Shop is the old Explore page (same key and address); Services and Library are its other pages.
    expect(MAIN_TABS.map((t) => t.href)).toEqual(['/explore', '/explore/services', '/today', '/community', '/explore/resources']);
    expect(MAIN_TABS.find((t) => t.label === 'Shop').key).toBe('explore');
    // Ask ayna and You moved to the top bar (the Ask button and the round profile button).
    expect(MAIN_TABS.some((t) => t.key === 'ask' || t.key === 'profile')).toBe(false);
  });
  it('the app has the same five tabs as the website, with the bag, calendar-check and book icons', () => {
    expect(APP_TABS.map((t) => t.label)).toEqual(MAIN_TABS.map((t) => t.label));
    expect(APP_TABS.map((t) => t.key)).toEqual(['explore', 'services', 'home', 'community', 'library']);
    expect(APP_TABS.find((t) => t.key === 'explore').icon).toBe('shop');
    expect(APP_TABS.find((t) => t.key === 'services').icon).toBe('services');
    expect(APP_TABS.find((t) => t.key === 'library').icon).toBe('library');
    // Home is the raised centre button (founder Oct 26 21:45: "make it stand out").
    expect(APP_TABS.find((t) => t.key === 'home')).toMatchObject({ label: 'Home', icon: 'home', center: true });
    expect(APP_TABS.some((t) => t.key === 'ask' || t.key === 'profile')).toBe(false);
    // The chat-first Home for the focus group names the first tab "ayna".
    expect(APP_TABS_CHAT_FIRST.map((t) => t.label)).toEqual(['Shop', 'Services', 'ayna', 'Community', 'Library']);
    expect(APP_EXPLORE_SECTIONS.map((s) => s.label)).toEqual(['For you', 'Needs', 'Products', 'Services', 'Reads']);
    expect(AYNA_HOME_VIEWS.map((v) => v.label)).toEqual(['Chat', 'Products', 'My dashboard']);
  });
  it('Explore has the five spec sections and You the five', () => {
    expect(EXPLORE_SECTIONS.map((s) => s.label)).toEqual(['For you', 'Needs', 'Products', 'Services', 'Reads']);
    expect(YOU_SECTIONS.map((s) => s.label)).toEqual(['My ecosystem', 'Saved', 'My health', 'Activity', 'Settings & privacy']);
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
