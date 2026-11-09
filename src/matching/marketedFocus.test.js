import { describe, expect, it } from 'vitest';
import { buildProductProfile } from './productProfile.js';

// Nov 9 (founder): a product the brand sells for sleep AND focus shows for both.
describe('marketed for focus', () => {
  it('earplugs sold "for deeper sleep and focus" match trouble concentrating and trouble sleeping', () => {
    const loop = { id: 'p-test-loop-quiet-2', name: 'Loop Quiet 2 Ear Plugs', brand: 'Loop', category: 'sleep', type: 'physical', tags: ['ear plugs', 'noise reduction'], summary: 'Reusable silicone ear plugs. Loop says Quiet 2 is made for deeper sleep and focus.' };
    const rel = buildProductProfile(loop).health_need_relevance || {};
    expect(rel['cognition.concentration']?.score || 0).toBeGreaterThanOrEqual(0.55);
    expect(rel['sleep.trouble']?.score || 0).toBeGreaterThanOrEqual(0.55);
  });
});
