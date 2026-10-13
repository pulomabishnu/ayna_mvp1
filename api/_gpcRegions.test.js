import { describe, it, expect } from 'vitest';
import { isMandatoryGpcRegion, MANDATORY_GPC_STATE_CODES } from './_gpcRegions.js';

describe('isMandatoryGpcRegion', () => {
  it('is true for each state on the mandatory list', () => {
    for (const code of MANDATORY_GPC_STATE_CODES) {
      expect(isMandatoryGpcRegion('US', code)).toBe(true);
    }
  });

  it('is case-insensitive on the region code', () => {
    expect(isMandatoryGpcRegion('US', 'ca')).toBe(true);
  });

  it('is false for a US state not on the list', () => {
    expect(isMandatoryGpcRegion('US', 'VA')).toBe(false);
    expect(isMandatoryGpcRegion('US', 'UT')).toBe(false);
  });

  it('is false for a non-US country regardless of region code', () => {
    expect(isMandatoryGpcRegion('CA', 'ON')).toBe(false); // Ontario, Canada — not a US state
  });

  it('is false when the region is missing or empty', () => {
    expect(isMandatoryGpcRegion('US', '')).toBe(false);
    expect(isMandatoryGpcRegion('US', undefined)).toBe(false);
  });
});
