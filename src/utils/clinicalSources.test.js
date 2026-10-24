import { describe, it, expect } from 'vitest';
import { hasClinicalSources, CLINICAL_SOURCES_LABEL } from './clinicalSources.js';

describe('hasClinicalSources', () => {
  it('counts a non-brand clinical view', () => {
    expect(hasClinicalSources({ doctorOpinion: 'x', clinicianOpinionSource: 'independent' })).toBe(true);
  });
  it('does not count the brand talking about itself', () => {
    expect(hasClinicalSources({ doctorOpinion: 'x', clinicianOpinionSource: 'brand' })).toBe(false);
    expect(hasClinicalSources({})).toBe(false);
  });
  it('never claims clinical backing in its label', () => {
    expect(CLINICAL_SOURCES_LABEL).not.toMatch(/backed|proven|reviewed by/i);
  });
});
