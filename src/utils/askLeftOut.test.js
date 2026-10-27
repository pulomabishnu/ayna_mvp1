import { describe, expect, it } from 'vitest';
import { localAnswer } from './askAnswer.js';
import { localCatalogAnswer } from './askCatalog.js';
import { listableCards, leftOutLine } from './askProducts.js';

// QA3 M10: "What helps with heavy periods?" for a 54-year-old, post-menopause,
// Heavy periods with a Heavy flow listed "Tampon Tribe Organic Teen Pads, Not
// shown: made for teens". Excluded products are never listed; at most a count.
const PERSONA = { personalizationCompleted: true, fullHealthIntake: { personalizationCompleted: true, takesCurrent: 'No', allergyStatus: 'No', safetyConcern: 'No', age: '54', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Heavy periods'], periodFlow: 'Heavy' } };
const text = (a) => [a?.answer, ...(a?.products || []).flatMap((p) => [p.name, p.match?.why])].filter(Boolean).join('\n');

describe('Ask lists never show left-out products', () => {
  it('heavy periods, post-menopause persona', async () => {
    const a = await localAnswer('What helps with heavy periods?', { profile: PERSONA, signedIn: false });
    expect(a).toBeTruthy();
    const all = text(a);
    expect(all).not.toMatch(/Teen/);
    expect(all).not.toMatch(/Not shown/);
    expect(all).not.toMatch(/—/);
    for (const p of a.products || []) {
      expect(p.leftOut).toBeFalsy();
      expect(['evaluation']).not.toContain(p.match?.kind);
    }
    // The engine's care message leads instead.
    expect(a.answer.indexOf('Get bleeding after menopause checked')).toBe(2);
    expect(a.answer).toMatch(/left out because they don’t fit your answers/);
  });
  it('signed out without answers: still no teen products', async () => {
    const a = await localCatalogAnswer('What helps with heavy periods?', { topics: true });
    expect(text(a)).not.toMatch(/Teen/);
  });
  it('helpers', () => {
    const r = listableCards([{ id: 'a' }, { id: 'b', leftOut: true }, { id: 'c' }, { id: 'd' }, { id: 'e' }], 3);
    expect(r.shown.map((c) => c.id)).toEqual(['a', 'c', 'd']);
    expect(r.leftOut).toBe(1);
    expect(leftOutLine(0)).toBe('');
    expect(leftOutLine(1)).toBe('1 product left out because it doesn’t fit your answers.');
  });
});
