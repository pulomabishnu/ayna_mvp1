import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hasInternalBrowserMarker,
  isFounderEmail,
  tagFounderAnalyticsIfNeeded,
} from './founderAnalytics';

describe('founder analytics exclusion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('recognizes only the three founder emails', () => {
    expect(isFounderEmail('ameera@aynahealth.co')).toBe(true);
    expect(isFounderEmail(' ELIZ@AYNAHEALTH.CO ')).toBe(true);
    expect(isFounderEmail('puloma@aynahealth.co')).toBe(true);
    expect(isFounderEmail('someone@aynahealth.co')).toBe(false);
    expect(isFounderEmail('')).toBe(false);
  });

  it('persists a founder browser marker and tags PostHog without email', () => {
    const ph = {
      register: vi.fn(),
      people: { set: vi.fn() },
    };

    expect(tagFounderAnalyticsIfNeeded(ph, 'ameera@aynahealth.co')).toBe(true);
    expect(hasInternalBrowserMarker()).toBe(true);
    expect(ph.register).toHaveBeenCalledWith({ is_internal: true, internal_role: 'founder' });
    expect(ph.people.set).toHaveBeenCalledWith({ is_internal: true, internal_role: 'founder' });
    expect(JSON.stringify(ph.register.mock.calls)).not.toContain('ameera@aynahealth.co');
  });

  it('keeps the same browser internal on later signed-out visits', () => {
    const ph = {
      register: vi.fn(),
      people: { set: vi.fn() },
    };

    tagFounderAnalyticsIfNeeded(ph, 'eliz@aynahealth.co');
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
