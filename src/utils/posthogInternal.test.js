/**
 * Tests for posthogInternal.js
 * Run: npx vitest run src/utils/posthogInternal.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInternalIds, tagInternalUserIfNeeded } from './posthogInternal';

const TEST_ID = '019e4c67-ec98-7bc8-b638-06063106322d';
const OTHER_ID = 'some-other-user-not-internal';

describe('getInternalIds', () => {
  beforeEach(() => vi.unstubAllEnvs());

  it('returns empty Set when env var is not set', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', '');
    expect(getInternalIds().size).toBe(0);
  });

  it('returns Set with one ID', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', TEST_ID);
    const ids = getInternalIds();
    expect(ids.size).toBe(1);
    expect(ids.has(TEST_ID)).toBe(true);
  });

  it('returns Set with multiple comma-separated IDs', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', `${TEST_ID}, abc123, def456`);
    const ids = getInternalIds();
    expect(ids.size).toBe(3);
    expect(ids.has('abc123')).toBe(true);
    expect(ids.has('def456')).toBe(true);
  });

  it('trims whitespace from each ID', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', `  ${TEST_ID}  ,  abc123  `);
    const ids = getInternalIds();
    expect(ids.has(TEST_ID)).toBe(true);
    expect(ids.has('abc123')).toBe(true);
    expect(ids.has(`  ${TEST_ID}  `)).toBe(false);
  });

  it('filters out empty entries from malformed input', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', `${TEST_ID},,abc123,`);
    expect(getInternalIds().size).toBe(2);
  });
});

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
    ph.get_distinct_id.mockReturnValue(TEST_ID);
    expect(tagInternalUserIfNeeded(ph)).toBe(false);
    expect(ph.people.set).not.toHaveBeenCalled();
  });

  it('returns false when current ID is not in internal list', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', TEST_ID);
    ph.get_distinct_id.mockReturnValue(OTHER_ID);
    expect(tagInternalUserIfNeeded(ph)).toBe(false);
    expect(ph.people.set).not.toHaveBeenCalled();
  });

  it('returns true and sets is_internal when ID matches', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', TEST_ID);
    ph.get_distinct_id.mockReturnValue(TEST_ID);
    expect(tagInternalUserIfNeeded(ph)).toBe(true);
    expect(ph.people.set).toHaveBeenCalledWith({ is_internal: true });
  });

  it('returns true when matching one of multiple internal IDs', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', `abc123, ${TEST_ID}, def456`);
    ph.get_distinct_id.mockReturnValue(TEST_ID);
    expect(tagInternalUserIfNeeded(ph)).toBe(true);
    expect(ph.people.set).toHaveBeenCalledWith({ is_internal: true });
  });

  it('does not throw when get_distinct_id throws', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', TEST_ID);
    ph.get_distinct_id.mockImplementation(() => { throw new Error('not ready'); });
    expect(() => tagInternalUserIfNeeded(ph)).not.toThrow();
    expect(tagInternalUserIfNeeded(ph)).toBe(false);
  });

  it('does not throw when people.set throws', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', TEST_ID);
    ph.get_distinct_id.mockReturnValue(TEST_ID);
    ph.people.set.mockImplementation(() => { throw new Error('network error'); });
    expect(() => tagInternalUserIfNeeded(ph)).not.toThrow();
    expect(tagInternalUserIfNeeded(ph)).toBe(false);
  });

  it('can be called multiple times safely', () => {
    vi.stubEnv('VITE_POSTHOG_INTERNAL_IDS', TEST_ID);
    ph.get_distinct_id.mockReturnValue(TEST_ID);
    tagInternalUserIfNeeded(ph);
    tagInternalUserIfNeeded(ph);
    tagInternalUserIfNeeded(ph);
    expect(ph.people.set).toHaveBeenCalledTimes(3);
    expect(ph.people.set).toHaveBeenCalledWith({ is_internal: true });
  });
});
