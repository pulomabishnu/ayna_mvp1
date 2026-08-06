import { describe, it, expect } from 'vitest';
import { STARTUPS, UNRELEASED_STARTUPS, RELEASED_STARTUPS, isStartupUsAvailable } from './startups';

describe('brand-category entries — carved out of the availability split', () => {
  const brandEntries = STARTUPS.filter((s) => s.category === 'brand');

  it('has at least one brand-category entry to test against', () => {
    expect(brandEntries.length).toBeGreaterThan(0);
  });

  it('every brand entry is already available in the US per isStartupUsAvailable — confirms the carve-out is doing real work, not a no-op', () => {
    // If this weren't true, excluding "brand" from the split wouldn't change
    // anything: these entries would already land in UNRELEASED_STARTUPS on
    // their own merits.
    const allAlreadyAvailable = brandEntries.every((s) => isStartupUsAvailable(s));
    expect(allAlreadyAvailable).toBe(true);
  });

  it('every brand entry appears in UNRELEASED_STARTUPS (shown in the Startups tab) regardless of availability', () => {
    const ids = new Set(UNRELEASED_STARTUPS.map((s) => s.id));
    for (const entry of brandEntries) {
      expect(ids.has(entry.id)).toBe(true);
    }
  });

  it('no brand entry appears in RELEASED_STARTUPS, so Discovery never double-lists them', () => {
    const ids = new Set(RELEASED_STARTUPS.map((s) => s.id));
    for (const entry of brandEntries) {
      expect(ids.has(entry.id)).toBe(false);
    }
  });

  it('every brand entry has productReleased: true, so the Startups tab shows "Add to ecosystem" / "Product website", not a misleading "Join Waitlist"', () => {
    for (const entry of brandEntries) {
      expect(entry.productReleased).toBe(true);
    }
  });

  it('every brand entry has a real, working-looking https url', () => {
    for (const entry of brandEntries) {
      expect(entry.url).toMatch(/^https:\/\//);
    }
  });
});

describe('non-brand startups — unaffected by the carve-out', () => {
  it('a genuinely unreleased (non-brand) startup still lands in UNRELEASED_STARTUPS', () => {
    const stillWaiting = STARTUPS.find((s) => s.category !== 'brand' && !isStartupUsAvailable(s));
    expect(stillWaiting).toBeTruthy();
    expect(UNRELEASED_STARTUPS.some((s) => s.id === stillWaiting.id)).toBe(true);
  });

  it('a genuinely released (non-brand) startup still lands in RELEASED_STARTUPS', () => {
    const released = STARTUPS.find((s) => s.category !== 'brand' && isStartupUsAvailable(s));
    expect(released).toBeTruthy();
    expect(RELEASED_STARTUPS.some((s) => s.id === released.id)).toBe(true);
  });
});
