/**
 * Tests for posthogInternal.js
 *
 * Internal users and their known PostHog distinct IDs:
 * Puloma phone:  019f23fa-2ddc-7baf-b219-bf4b5c6dceb4
 * Puloma laptop: 019f23fd-c46e-77a1-b38a-6198fa08a799
 * Eliz phone:    019f23f6-e815-77bc-ae5f-ce0421ef345c
 * Eliz laptop:   pending
 *
 * Run: npx vitest run src/utils/posthogInternal.test.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getInternalIds, tagInternalUserIfNeeded, debugPosthogStatus } from './posthogInternal';

const PULOMA_PHONE  = '019f23fa-2ddc-7baf-b219-bf4b5c6dceb4';
const PULOMA_LAPTOP = '019f23fd-c46e-77a1-b38a-6198fa08a799';
const ELIZ_PHONE    = '019f23f6-e815-77bc-ae5f-ce0421ef345c';
const OTHER_ID      = 'some-random-user-not-internal';
const ALL_INTERNAL  = `${PULOMA_PHONE},${PULOMA_LAPTOP},${ELIZ_PHONE}`;

// ── getInternalIds ───────────────────────────────────

describe('getInternalIds', () => {
  beforeEach(() => vi.unstubAllEnvs());

  it('returns empty Set when env var is not set', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', '');
    expect(getInternalIds().size).toBe(0);
  });

  it('returns Set with all three current internal IDs', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', ALL_INTERNAL);
    const ids = getInternalIds();
    expect(ids.size).toBe(3);
    expect(ids.has(PULOMA_PHONE)).toBe(true);
    expect(ids.has(PULOMA_LAPTOP)).toBe(true);
    expect(ids.has(ELIZ_PHONE)).toBe(true);
  });

  it('does not contain a random user ID', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', ALL_INTERNAL);
    expect(getInternalIds().has(OTHER_ID)).toBe(false);
  });

  it('handles a fourth ID added later (Eliz laptop)', () => {
    const ELIZ_LAPTOP = 'future-eliz-laptop-id';
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', `${ALL_INTERNAL},${ELIZ_LAPTOP}`);
    const ids = getInternalIds();
    expect(ids.size).toBe(4);
    expect(ids.has(ELIZ_LAPTOP)).toBe(true);
  });

  it('trims whitespace from all IDs', () => {
    vi.stubEnv(
      'VITE_POSTHOG_INTERNAL_IDS',
      `  ${PULOMA_PHONE}  ,  ${PULOMA_LAPTOP}  ,  ${ELIZ_PHONE}  `
    );
    const ids = getInternalIds();
    expect(ids.has(PULOMA_PHONE)).toBe(true);
    expect(ids.has(PULOMA_LAPTOP)).toBe(true);
    expect(ids.has(ELIZ_PHONE)).toBe(true);
    expect(ids.has(`  ${PULOMA_PHONE}  `)).toBe(false);
  });

  it('filters out empty entries from malformed input', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', `${PULOMA_PHONE},,${ELIZ_PHONE},`);
    expect(getInternalIds().size).toBe(2);
  });
});

// ── tagInternalUserIfNeeded ──────────────────────────

describe('tagInternalUserIfNeeded', () => {
  let ph;

  beforeEach(() => {
    vi.unstubAllEnvs();
    ph = {
      get_distinct_id: vi.fn(),
      people: { set: vi.fn() },
    };
  });

  it('returns false and does nothing when posthog instance is null', () => {
    expect(tagInternalUserIfNeeded(null)).toBe(false);
  });

  it('returns false when env var is empty', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', '');
    ph.get_distinct_id.mockReturnValue(PULOMA_PHONE);
    expect(tagInternalUserIfNeeded(ph)).toBe(false);
    expect(ph.people.set).not.toHaveBeenCalled();
  });

  it('returns false when current ID is not in internal list', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', ALL_INTERNAL);
    ph.get_distinct_id.mockReturnValue(OTHER_ID);
    expect(tagInternalUserIfNeeded(ph)).toBe(false);
    expect(ph.people.set).not.toHaveBeenCalled();
  });

  it('tags Puloma phone as internal', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', ALL_INTERNAL);
    ph.get_distinct_id.mockReturnValue(PULOMA_PHONE);
    expect(tagInternalUserIfNeeded(ph)).toBe(true);
    expect(ph.people.set).toHaveBeenCalledWith({ is_internal: true });
  });

  it('tags Puloma laptop as internal', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', ALL_INTERNAL);
    ph.get_distinct_id.mockReturnValue(PULOMA_LAPTOP);
    expect(tagInternalUserIfNeeded(ph)).toBe(true);
    expect(ph.people.set).toHaveBeenCalledWith({ is_internal: true });
  });

  it('tags Eliz phone as internal', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', ALL_INTERNAL);
    ph.get_distinct_id.mockReturnValue(ELIZ_PHONE);
    expect(tagInternalUserIfNeeded(ph)).toBe(true);
    expect(ph.people.set).toHaveBeenCalledWith({ is_internal: true });
  });

  it('tags a future fourth device (Eliz laptop) when added to env var', () => {
    const ELIZ_LAPTOP = 'future-eliz-laptop-id';
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', `${ALL_INTERNAL},${ELIZ_LAPTOP}`);
    ph.get_distinct_id.mockReturnValue(ELIZ_LAPTOP);
    expect(tagInternalUserIfNeeded(ph)).toBe(true);
    expect(ph.people.set).toHaveBeenCalledWith({ is_internal: true });
  });

  it('does not tag a real user who is not internal', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', ALL_INTERNAL);
    ph.get_distinct_id.mockReturnValue(OTHER_ID);
    expect(tagInternalUserIfNeeded(ph)).toBe(false);
    expect(ph.people.set).not.toHaveBeenCalled();
  });

  it('does not throw when get_distinct_id throws', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', ALL_INTERNAL);
    ph.get_distinct_id.mockImplementation(() => { throw new Error('not ready'); });
    expect(() => tagInternalUserIfNeeded(ph)).not.toThrow();
    expect(tagInternalUserIfNeeded(ph)).toBe(false);
  });

  it('does not throw when people.set throws', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', ALL_INTERNAL);
    ph.get_distinct_id.mockReturnValue(PULOMA_PHONE);
    ph.people.set.mockImplementation(() => { throw new Error('network error'); });
    expect(() => tagInternalUserIfNeeded(ph)).not.toThrow();
    expect(tagInternalUserIfNeeded(ph)).toBe(false);
  });

  it('is safe to call multiple times on the same session', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', ALL_INTERNAL);
    ph.get_distinct_id.mockReturnValue(PULOMA_PHONE);
    tagInternalUserIfNeeded(ph);
    tagInternalUserIfNeeded(ph);
    tagInternalUserIfNeeded(ph);
    expect(ph.people.set).toHaveBeenCalledTimes(3);
    expect(ph.people.set).toHaveBeenCalledWith({ is_internal: true });
  });
});

// ── debugPosthogStatus ───────────────────────────────

describe('debugPosthogStatus', () => {
  let ph;
  let consoleSpy;

  beforeEach(() => {
    vi.unstubAllEnvs();
    ph = {
      get_distinct_id: vi.fn(),
      get_property: vi.fn(),
      people: { set: vi.fn() },
    };
    consoleSpy = {
      group: vi.spyOn(console, 'group').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      groupEnd: vi.spyOn(console, 'groupEnd').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  it('logs error and returns early when posthog is null', () => {
    debugPosthogStatus(null);
    expect(consoleSpy.error).toHaveBeenCalledWith(
      expect.stringContaining('PostHog instance is null')
    );
    expect(consoleSpy.group).not.toHaveBeenCalled();
  });

  it('logs status report when posthog is initialized', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', PULOMA_PHONE);
    ph.get_distinct_id.mockReturnValue(PULOMA_PHONE);
    ph.get_property.mockReturnValue(true);
    debugPosthogStatus(ph);
    expect(consoleSpy.group).toHaveBeenCalledWith('[Ayna/PostHog] Status Report');
    expect(consoleSpy.groupEnd).toHaveBeenCalled();
  });

  it('warns when distinct ID is not in internal list', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', PULOMA_PHONE);
    ph.get_distinct_id.mockReturnValue(OTHER_ID);
    ph.get_property.mockReturnValue(null);
    debugPosthogStatus(ph);
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      expect.stringContaining('NOT in the internal list')
    );
  });

  it('does not warn when distinct ID IS in internal list', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', PULOMA_PHONE);
    ph.get_distinct_id.mockReturnValue(PULOMA_PHONE);
    ph.get_property.mockReturnValue(true);
    debugPosthogStatus(ph);
    expect(consoleSpy.warn).not.toHaveBeenCalled();
  });

  it('handles get_distinct_id throwing gracefully', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', PULOMA_PHONE);
    ph.get_distinct_id.mockImplementation(() => { throw new Error('not ready'); });
    ph.get_property.mockReturnValue(null);
    expect(() => debugPosthogStatus(ph)).not.toThrow();
  });
});
