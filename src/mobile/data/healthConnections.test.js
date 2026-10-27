import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { HEALTH_SOURCES, SOURCE_GROUPS, availabilityFor, statusLine } from './healthConnections.js';
import { CATEGORIES } from '../../health/metrics.js';
import { SOURCE_POLICY } from '../../health/policy.js';
import { formatValue, parseEdited } from '../../health/format.js';
import HealthConnectionsScreen from '../screens/profile/HealthConnectionsScreen.jsx';
import HealthConnectionsScreenCore from '../screens/profile/HealthConnectionsScreenCore.jsx';
import HealthInsightsScreen from '../screens/profile/HealthInsightsScreen.jsx';

describe('health source catalog', () => {
  it('has unique ids, known groups and known consent categories', () => {
    const ids = HEALTH_SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const groups = new Set(SOURCE_GROUPS.map((g) => g.id));
    for (const s of HEALTH_SOURCES) {
      expect(groups.has(s.group)).toBe(true);
      for (const c of s.categories) expect(CATEGORIES[c]).toBeTruthy();
    }
  });
  it('phone sources are never connectable from a browser or the other platform', () => {
    const apple = HEALTH_SOURCES.find((s) => s.id === 'apple_health');
    const hc = HEALTH_SOURCES.find((s) => s.id === 'health_connect');
    expect(availabilityFor(apple, { isNative: false }).ok).toBe(false);
    expect(availabilityFor(apple, { isNative: true, nativePlatform: 'android' }).ok).toBe(false);
    expect(availabilityFor(hc, { isNative: true, nativePlatform: 'android' }).ok).toBe(true);
  });
  it('blocked and approval-gated sources can never be connected', () => {
    for (const id of ['strava', 'garmin']) {
      expect(availabilityFor(HEALTH_SOURCES.find((s) => s.id === id), { isNative: true, nativePlatform: 'ios' }).ok).toBe(false);
    }
  });
  it('Apple Health Records: iPhone app only', () => {
    const rec = HEALTH_SOURCES.find((s) => s.id === 'records');
    expect(availabilityFor(rec, { isNative: true, nativePlatform: 'ios' }).ok).toBe(true);
    expect(availabilityFor(rec, { isNative: false }).ok).toBe(false);
    expect(availabilityFor(rec, { isNative: true, nativePlatform: 'android' }).ok).toBe(false);
  });
  it('WHOOP is an OAuth source, read live', () => {
    expect(HEALTH_SOURCES.find((s) => s.id === 'whoop').availability).toBe('oauth');
    expect(HEALTH_SOURCES.find((s) => s.id === 'request').kind).not.toMatch(/WHOOP/);
  });
  it('Flo is import-only, never an OAuth "connect"', () => {
    expect(HEALTH_SOURCES.find((s) => s.id === 'flo').availability).toBe('import_only');
  });
  it('Oura data is insights-only until Oura confirms its terms', () => {
    expect(SOURCE_POLICY.oura).toMatchObject({ insights: true, matching: false });
  });
  it('status lines', () => {
    expect(statusLine({ status: 'paused' }).text).toBe('Paused');
    expect(statusLine({ status: 'needs_reauth' }).text).toBe('Reconnect needed');
    expect(statusLine({ status: 'connected', last_synced_at: null }).text).toBe('Not synced yet');
    expect(statusLine({ status: 'disconnected' })).toBeNull();
  });
});

describe('value editing on the review screen', () => {
  it('formats and parses corrections, rejecting impossible values', () => {
    expect(formatValue('sleep_minutes', 392)).toBe('6h 32m');
    expect(parseEdited('sleep_minutes', '6h 40m')).toBe(400);
    expect(parseEdited('resting_hr_bpm', '68 bpm')).toBe(68);
    expect(parseEdited('resting_hr_bpm', '900')).toBeNull();
    expect(parseEdited('menstrual_flow', 'Heavy')).toBe(4);
    expect(parseEdited('basal_temp_c', '97.7 F')).toBeCloseTo(36.5, 1);
  });
});

describe('screens render honestly when signed out', () => {
  it('list shows every source and never claims a connection', () => {
    const html = renderToStaticMarkup(createElement(HealthConnectionsScreen, { selectedId: null, onSelect: () => {}, authUser: null }));
    // The "Request another" row became the anonymous Suggest an app or wearable box (founder Oct 27).
    for (const s of HEALTH_SOURCES.filter((x) => x.id !== 'request')) expect(html).toContain(s.name.replace('&', '&amp;'));
    expect(html).toContain('Suggest an app or wearable');
    expect(html).toContain('Not available');
    expect(html).toContain('Sign in');
    expect(html).not.toContain('>On<');
  });
  it('Apple Health detail in a browser explains it needs the app', () => {
    const html = renderToStaticMarkup(createElement(HealthConnectionsScreenCore, { selectedId: 'apple_health', onSelect: () => {}, authUser: { id: 'u1' } }));
    expect(html).toContain("can&#x27;t be connected from a browser");
    expect(html).toContain('aria-checked="false"');
    expect(html).not.toContain('aria-checked="true"');
  });
  it('Strava explains why it is not connected', () => {
    const html = renderToStaticMarkup(createElement(HealthConnectionsScreen, { selectedId: 'strava', onSelect: () => {}, authUser: { id: 'u1' } }));
    expect(html).toContain('developer terms');
    expect(html).not.toContain('Connect Strava');
  });
  it('insights screen checks Pro access before showing anything', () => {
    expect(renderToStaticMarkup(createElement(HealthInsightsScreen, { authUser: null }))).toContain('Checking access…');
  });
});

describe('what each source can provide (team direction 42-43)', () => {
  it('names the four groups each source can provide', async () => {
    const { providesFor, providesLine, sourceById } = await import('./healthConnections.js');
    expect(providesFor(sourceById('apple_health')).map((g) => g.id)).toEqual(['sleep', 'cycle', 'activity', 'heart']);
    expect(providesLine(sourceById('flo'))).toBe('Cycle and temperature');
    expect(providesLine(sourceById('request'))).toBe('');
  });
  it('explains the permission steps for phone and sign-in sources only', async () => {
    const { connectSteps, sourceById } = await import('./healthConnections.js');
    expect(connectSteps(sourceById('apple_health'))[0]).toMatch(/Health access sheet/);
    expect(connectSteps(sourceById('oura'))[0]).toMatch(/go to Oura/);
    expect(connectSteps(sourceById('upload'))).toEqual([]);
  });
  it('shows the last sync time in words', async () => {
    const { lastSyncedLine } = await import('./healthConnections.js');
    expect(lastSyncedLine(null)).toBe('Not synced yet');
    expect(lastSyncedLine('2026-10-24T13:14:00Z')).toMatch(/^Last synced Oct 24/);
  });
});
