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

// Nov 9 live-catalog audit: what brands sell a product for becomes a match; look-alike words do not.
const rel = (p) => buildProductProfile({ type: 'physical', tags: [], ...p }).health_need_relevance || {};
const score = (p, need) => rel(p)[need]?.score || 0;
describe('marketed for (catalog audit)', () => {
  it('matches what the brand sells it for', () => {
    expect(score({ id: 'p-t-roll', name: 'Pain Relief Roll-On for Cramps', category: 'cramp-relief', summary: 'A roll-on made for period cramps.' }, 'pain.menstrual_cramp')).toBeGreaterThanOrEqual(0.55);
    expect(score({ id: 'p-t-binder', name: 'Postpartum Abdominal Support Binder', category: 'postpartum', tags: ['postpartum'], summary: 'A belly wrap for core support after birth.' }, 'postpartum.recovery')).toBeGreaterThanOrEqual(0.55);
    expect(score({ id: 'p-t-uti', name: 'Urinary Daily Defense', category: 'supplement', summary: 'A daily supplement intended to help protect against UTIs.' }, 'urinary.recurrent_uti')).toBeGreaterThanOrEqual(0.55);
  });
  it('does not match look-alike words', () => {
    expect(score({ id: 'p-t-kegel', name: 'Kegel Toner', category: 'incontinence', summary: 'A pelvic trainer made for stress incontinence.' }, 'mood.general_anxiety')).toBe(0);
    expect(score({ id: 'p-t-cran', name: 'Urinary Tract Supplement', category: 'supplement', summary: 'Made with a cranberry concentrate to support the urinary tract.' }, 'cognition.concentration')).toBe(0);
    expect(score({ id: 'p-t-mat', name: 'Yoga Mat', category: 'pain-relief', summary: 'A thick mat for yoga. NIH says yoga can help stress.' }, 'mood.general_anxiety')).toBe(0);
    expect(score({ id: 'p-t-greens', name: 'Greens Powder', category: 'supplement', summary: 'A daily greens powder with a probiotic for gut health.' }, 'vaginal.bv')).toBe(0);
  });
});

