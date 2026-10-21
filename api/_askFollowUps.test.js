import { describe, it, expect } from 'vitest';
import { buildFollowUpContext, followUpPromptContext, validateFollowUps, MAX_FOLLOW_UPS } from './_askFollowUps.js';

const ctx = (over = {}) => buildFollowUpContext({
  ecosystemProducts: [{ id: 'p-sootheher-elaris-pod', name: 'Elaris Pod', brand: 'SootheHer' }],
  reads: [{ id: 'heat-for-cramps', title: 'Heat For Cramps and PCOS' }],
  hasHealthData: true,
  answer: 'Heat helps. The Elaris Pod in your Ecosystem is a solid option.',
  ...over,
});

describe('validateFollowUps', () => {
  it('keeps each whitelisted type with a label', () => {
    const out = validateFollowUps([
      { type: 'open_product', productId: 'p-sootheher-elaris-pod' },
      { type: 'browse', intent: { category: 'cramp-relief' }, label: 'More products for cramps' },
      { type: 'ask', text: 'What helps on day 2?' },
      { type: 'open_dashboard' },
    ], ctx());
    expect(out).toEqual([
      { type: 'open_product', productId: 'p-sootheher-elaris-pod', label: 'Open Elaris Pod' },
      { type: 'browse', intent: { category: 'cramp-relief' }, label: 'More products for cramps' },
      { type: 'ask', text: 'What helps on day 2?', label: 'What helps on day 2?' },
      { type: 'open_dashboard', label: 'See my dashboard' },
    ]);
  });

  it('drops unknown types and non-objects', () => {
    expect(validateFollowUps([{ type: 'open_url', url: 'https://x.com' }, { type: 'buy', productId: 'p-thermacare' }, 'ask', null, 7], ctx())).toEqual([]);
    expect(validateFollowUps('nope', ctx())).toEqual([]);
    expect(validateFollowUps(undefined, ctx())).toEqual([]);
  });

  it('drops invalid product and read ids', () => {
    const out = validateFollowUps([
      { type: 'open_product', productId: 'p-made-up' },
      { type: 'open_product' },
      // Real catalog product, but not hers and not named in the answer.
      { type: 'open_product', productId: 'p-thermacare' },
      { type: 'open_library', articleId: 'not-a-read' },
      { type: 'open_library', articleId: 'heat-for-cramps' },
    ], ctx());
    expect(out).toEqual([{ type: 'open_library', articleId: 'heat-for-cramps', label: 'Read heat for cramps and PCOS' }]);
  });

  it('accepts a catalog product only when the answer names it', () => {
    const c = ctx({ ecosystemProducts: [], answer: 'Try the Comfytemp Portable Heating Pad on your lower belly.' });
    expect(validateFollowUps([{ type: 'open_product', productId: 'p-portable-heating' }], c)).toEqual([
      { type: 'open_product', productId: 'p-portable-heating', label: 'Open Comfytemp Portable Heating Pad' },
    ]);
  });

  it('drops a browse with an unknown category and no query', () => {
    expect(validateFollowUps([{ type: 'browse', intent: { category: 'rocket-fuel' } }], ctx())).toEqual([]);
    expect(validateFollowUps([{ type: 'browse', intent: { category: 'cramp-relief' }, label: 'More VIBOOS heating pads' }], ctx()))
      .toEqual([{ type: 'browse', intent: { category: 'cramp-relief' }, label: 'More cramp relief' }]);
  });

  it('caps the list at four, deduped', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ type: 'ask', text: `Question number ${i}?` }));
    const out = validateFollowUps([{ type: 'ask', text: 'Question number 0?' }, ...many], ctx());
    expect(out).toHaveLength(MAX_FOLLOW_UPS);
    expect(out.map((f) => f.text)).toEqual(['Question number 0?', 'Question number 1?', 'Question number 2?', 'Question number 3?']);
  });

  it('drops ask text that is too long, has a link, or names an outside brand', () => {
    const long = 'What else could help with cramps on the first two days of my period?';
    expect(long.length).toBeGreaterThan(60);
    expect(validateFollowUps([
      { type: 'ask', text: long },
      { type: 'ask', text: 'See https://example.com' },
      { type: 'ask', text: 'Is VIBOOS any good?' },
      { type: 'ask', text: '' },
    ], ctx())).toEqual([]);
    // Her own brand is fine.
    expect(validateFollowUps([{ type: 'ask', text: 'How do I clean my SootheHer pod?' }], ctx())).toHaveLength(1);
  });

  it('only offers the dashboard when she has health data or screen context', () => {
    expect(validateFollowUps([{ type: 'open_dashboard' }], ctx({ hasHealthData: false }))).toEqual([]);
    expect(validateFollowUps([{ type: 'open_dashboard' }], ctx({ hasHealthData: false, screenContext: 'Cycle: day 1.' }))).toHaveLength(1);
  });

  it('tells the model which ids exist', () => {
    const text = followUpPromptContext(ctx());
    expect(text).toContain('p-sootheher-elaris-pod | Elaris Pod');
    expect(text).toContain('heat-for-cramps | Heat For Cramps and PCOS');
    expect(text).toContain('cramp-relief');
  });
});
