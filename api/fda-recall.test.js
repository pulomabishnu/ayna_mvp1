import { describe, it, expect } from 'vitest';
import { wordOrPhraseMatches, recallRecordMatchesProduct } from './fda-recall.js';

describe('wordOrPhraseMatches — false negatives the old \\b anchors caused', () => {
  // These are the regressions that made real recalls invisible. `\b` is a
  // word/non-word transition, so a token ending in '+' or ')' or '.' demanded
  // an adjacent word character that real FDA text never has.
  it('matches a name ending in "+" against text where a space follows', () => {
    expect(wordOrPhraseMatches('Recall of Ritual Essential Prenatal 18+ capsules, lot 42', 'Ritual Essential Prenatal 18+')).toBe(true);
  });

  it('matches a name ending in a registered-trademark symbol', () => {
    expect(wordOrPhraseMatches('AZO® Urinary Tract Health tablets recalled', 'AZO®')).toBe(true);
  });

  it('matches a name ending in a period', () => {
    expect(wordOrPhraseMatches('o.b. tampons, all lots', 'o.b.')).toBe(true);
  });

  it('matches across irregular whitespace in the FDA text', () => {
    expect(wordOrPhraseMatches('Cora  Organic   Cotton Tampons', 'Cora Organic Cotton Tampons')).toBe(true);
  });
});

describe('wordOrPhraseMatches — precision is preserved', () => {
  it('does not match a substring inside a longer word', () => {
    expect(wordOrPhraseMatches('Multivitamins for adults', 'Vita')).toBe(false);
  });

  it('does not match a 2-character token', () => {
    expect(wordOrPhraseMatches('ob tampons', 'ob')).toBe(false);
  });

  it('still matches a whole word at a string boundary', () => {
    expect(wordOrPhraseMatches('Thinx', 'Thinx')).toBe(true);
  });
});

describe('recallRecordMatchesProduct — cross-field phrase false positive', () => {
  // The old code joined every field with a space and matched phrases against
  // the concatenation, so a phrase spanning a field boundary matched a product
  // that appears in neither field.
  it('does not match a phrase that only exists across two different fields', () => {
    const item = {
      product_description: 'Sterile gauze pads, 100% Cotton',
      reason_for_recall: 'Tampons may contain foreign material',
    };
    expect(recallRecordMatchesProduct(item, 'Cotton Tampons', '')).toBe(false);
  });

  it('still matches when the phrase genuinely appears in one field', () => {
    const item = { product_description: 'Cotton Tampons, regular absorbency' };
    expect(recallRecordMatchesProduct(item, 'Cotton Tampons', '')).toBe(true);
  });

  it('matches on brand via the openfda block', () => {
    const item = { product_description: 'Prenatal multivitamin 30ct', openfda: { brand_name: ['Ritual'] } };
    expect(recallRecordMatchesProduct(item, 'Essential Prenatal', 'Ritual')).toBe(true);
  });

  it('matches on recalling_firm, which the old field list omitted', () => {
    const item = { product_description: 'Prenatal multivitamin 30ct', recalling_firm: 'Ritual Health Inc' };
    expect(recallRecordMatchesProduct(item, 'Essential Prenatal', 'Ritual')).toBe(true);
  });
});
