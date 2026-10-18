import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DATA_TYPES, HEALTH_SOURCES, SOURCE_GROUPS, availabilityFor, formatSynced } from './healthConnections.js';
import HealthConnectionsScreen from '../screens/profile/HealthConnectionsScreen.jsx';

describe('health connection sources', () => {
  it('has unique ids, known groups and known data types', () => {
    const ids = HEALTH_SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const groups = new Set(SOURCE_GROUPS.map((g) => g.id));
    for (const source of HEALTH_SOURCES) {
      expect(groups.has(source.group)).toBe(true);
      expect(source.dataTypes.length).toBeGreaterThan(0);
      for (const t of source.dataTypes) expect(DATA_TYPES[t]).toBeTruthy();
      if (source.access === 'device') expect(['ios', 'android']).toContain(source.platform);
    }
  });

  it('keeps on-device sources in the native app', () => {
    const apple = HEALTH_SOURCES.find((s) => s.id === 'apple-health');
    const oura = HEALTH_SOURCES.find((s) => s.id === 'oura');
    expect(availabilityFor(apple, { isNative: false }).ok).toBe(false);
    expect(availabilityFor(apple, { isNative: true, nativePlatform: 'android' }).ok).toBe(false);
    expect(availabilityFor(apple, { isNative: true, nativePlatform: 'ios' }).ok).toBe(true);
    expect(availabilityFor(oura, { isNative: false }).ok).toBe(true);
  });

  it('formats sync times', () => {
    const now = Date.parse('2026-10-17T12:00:00Z');
    expect(formatSynced('2026-10-17T12:00:00Z', now)).toBe('Synced just now');
    expect(formatSynced('2026-10-17T11:30:00Z', now)).toBe('Synced 30 min ago');
    expect(formatSynced('2026-10-17T09:00:00Z', now)).toBe('Synced 3h ago');
  });

  it('renders the list with every source and the brand promise', () => {
    const html = renderToStaticMarkup(createElement(HealthConnectionsScreen, { selectedId: null, onSelect: () => {} }));
    for (const s of HEALTH_SOURCES) expect(html).toContain(s.name);
    expect(html).toContain('Brands never do');
  });
});
