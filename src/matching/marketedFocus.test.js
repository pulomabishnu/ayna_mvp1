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


// Nov 9 coverage audit: Gas, Breast tenderness and digestive bloating had products the brand sells for them
// that never reached a user who picked that need.
describe('needs that had no matching product', () => {
  const s = (p, need) => buildProductProfile({ type: 'physical', tags: [], ...p }).health_need_relevance?.[need]?.score || 0;
  it('gas, breast tenderness and digestive bloating', () => {
    expect(s({ id: 'p-t-bitters', name: 'Digestive Bitters', category: 'supplement', summary: 'The brand says it eases occasional gas, bloating and indigestion.' }, 'digestive.gas')).toBeGreaterThanOrEqual(0.55);
    expect(s({ id: 'p-t-chaste', name: 'Hormone Support', category: 'supplement', summary: 'Marketed for fewer PMS symptoms like breast tenderness.' }, 'cycle.breast_tenderness')).toBeGreaterThanOrEqual(0.55);
    expect(s({ id: 'p-t-bloat', name: 'Bye Bloat', category: 'supplement', summary: 'A capsule made for occasional bloating.' }, 'bloating.digestive')).toBeGreaterThanOrEqual(0.55);
  });
});

// Nov 9 (founder): "we're not finding cures, we're finding symptom management, make sure every product
// is accounted for". What a product is sold to help with is a match; the evidence grade sets the %.
describe('symptom management counts', () => {
  const s = (p, need) => buildProductProfile({ type: 'physical', tags: [], ...p }).health_need_relevance?.[need]?.score || 0;
  it('fatigue, joint aches, metabolism and bladder leaks', () => {
    expect(s({ id: 'p-t-energy', name: 'Daily Energy Sticks', category: 'supplement', summary: 'A drink mix made for steady energy without a crash.' }, 'energy.fatigue')).toBeGreaterThanOrEqual(0.55);
    expect(s({ id: 'p-t-joint', name: 'Collagen Protein', category: 'supplement', summary: 'The brand says it supports joint comfort and skin.' }, 'pain.joint')).toBeGreaterThanOrEqual(0.55);
    expect(s({ id: 'p-t-metab', name: 'Metabolism Support', category: 'supplement', summary: 'A capsule sold for metabolism and cravings.' }, 'metabolic.weight')).toBeGreaterThanOrEqual(0.55);
    expect(s({ id: 'p-t-pads', name: 'Bladder Leak Pads', category: 'incontinence', summary: 'Pads designed for light bladder leaks.' }, 'urinary.incontinence')).toBeGreaterThanOrEqual(0.55);
  });
  it('a hormone-free product is not marketed for hormone balance', () => {
    expect(s({ id: 'p-t-hf', name: 'Vaginal Gel', category: 'intimate-care', summary: 'A hormone-free gel made for dryness.' }, 'hormonal.general')).toBeLessThan(0.55);
  });
});

// Nov 9 persona tests.
describe('persona test fixes', () => {
  const s = (p, need) => buildProductProfile({ type: 'physical', tags: [], ...p }).health_need_relevance?.[need]?.score || 0;
  it('a cleanser from an antifungal brand is not an antifungal; a hair supplement is not postpartum recovery', () => {
    expect(s({ id: 'p-t-mon', name: 'Monistat Maintain Feminine Cleanser', category: 'intimate-care', summary: 'A daily cleanser.' }, 'vaginal.yeast')).toBe(0);
    expect(s({ id: 'p-t-mon2', name: 'Monistat 3-Dose Yeast Infection Treatment (miconazole)', category: 'intimate-care', summary: 'Miconazole cream.' }, 'vaginal.yeast')).toBeGreaterThanOrEqual(0.8);
    expect(s({ id: 'p-t-hair', name: 'Hair Growth Complex', category: 'supplement', summary: 'A supplement made for postpartum hair shedding and hair growth.' }, 'postpartum.recovery')).toBeLessThan(0.55);
    // The real catalog shape: tagged postpartum + shedding, still not recovery.
    expect(s({ id: 'p-t-hair2', name: 'HAIRLOVE Growth Complex', category: 'supplement', tags: ['hair', 'biotin', 'postpartum', 'shedding'], summary: 'Biotin and keratin for shedding.' }, 'postpartum.recovery')).toBe(0);
  });
});
