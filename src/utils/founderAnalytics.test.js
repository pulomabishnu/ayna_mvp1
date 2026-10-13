import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hasInternalBrowserMarker,
  isFounderEmail,
  tagFounderAnalyticsIfNeeded,
} from './founderAnalytics';

function createMemoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(String(key)) ? data.get(String(key)) : null),
    setItem: (key, value) => { data.set(String(key), String(value)); },
    removeItem: (key) => { data.delete(String(key)); },
    clear: () => { data.clear(); },
    key: (index) => Array.from(data.keys())[index] ?? null,
    get length() { return data.size; },
  };
}

describe('founder analytics exclusion', () => {
  beforeEach(() => {
    const localStorage = createMemoryStorage();
    vi.stubGlobal('window', { localStorage });
    vi.stubGlobal('localStorage', localStorage);
  });

  it('recognizes every exact founder email alias observed in PostHog', () => {
    const founderEmails = [
      'ameera@aynahealth.co',
      'ao369@cornell.edu',
      'lalaloops99@gmail.com',
      'o.ameera24@gmail.com',
      'eliz@aynahealth.co',
      'elizcelik2003@gmail.com',
      'puloma@aynahealth.co',
      'pulomabishnu@gmail.com',
    ];

    for (const email of founderEmails) {
      expect(isFounderEmail(email)).toBe(true);
    }
    expect(isFounderEmail(' ELIZ@AYNAHEALTH.CO ')).toBe(true);
  });

  it('does not use broad name substring matching', () => {
    expect(isFounderEmail('elizabeth.customer@example.com')).toBe(false);
    expect(isFounderEmail('ameera-fan@example.com')).toBe(false);
    expect(isFounderEmail('someone@aynahealth.co')).toBe(false);
    expect(isFounderEmail('')).toBe(false);
  });

  it('persists a founder browser marker and tags PostHog without email', () => {
    const ph = {
      register: vi.fn(),
      people: { set: vi.fn() },
    };

    expect(tagFounderAnalyticsIfNeeded(ph, 'ao369@cornell.edu')).toBe(true);
    expect(hasInternalBrowserMarker()).toBe(true);
    expect(ph.register).toHaveBeenCalledWith({ is_internal: true, internal_role: 'founder' });
    expect(ph.people.set).toHaveBeenCalledWith({ is_internal: true, internal_role: 'founder' });
    expect(JSON.stringify(ph.register.mock.calls)).not.toContain('ao369@cornell.edu');
  });

  it('keeps the same browser internal on later signed-out visits', () => {
    const ph = {
      register: vi.fn(),
      people: { set: vi.fn() },
    };

    tagFounderAnalyticsIfNeeded(ph, 'pulomabishnu@gmail.com');
    ph.register.mockClear();
    ph.people.set.mockClear();

    expect(tagFounderAnalyticsIfNeeded(ph)).toBe(true);
    expect(ph.register).toHaveBeenCalledWith({ is_internal: true, internal_role: 'founder' });
  });

  it('does not mark a normal user or browser as internal', () => {
    const ph = {
      register: vi.fn(),
      people: { set: vi.fn() },
    };

    expect(tagFounderAnalyticsIfNeeded(ph, 'user@example.com')).toBe(false);
    expect(hasInternalBrowserMarker()).toBe(false);
    expect(ph.register).not.toHaveBeenCalled();
    expect(ph.people.set).not.toHaveBeenCalled();
  });
});
