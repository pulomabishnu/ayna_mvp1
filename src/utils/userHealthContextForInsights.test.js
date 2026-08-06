import { describe, it, expect } from 'vitest';
import { buildUserHealthContextString } from './userHealthContextForInsights';

describe('buildUserHealthContextString — internal-product comfort', () => {
  it('adds no line when the quiz question was never answered', () => {
    const text = buildUserHealthContextString({ frustrations: ['Cramps'] }, null);
    expect(text).not.toMatch(/internal-product comfort/i);
  });

  it('flags discomfort and tells the model not to push internal products', () => {
    const text = buildUserHealthContextString({ internalComfort: 'No' }, null);
    expect(text).toMatch(/not comfortable with internal products/i);
    expect(text).toMatch(/do not push/i);
  });

  it('flags hesitancy and asks for concrete reassurance, not just feature lists', () => {
    const text = buildUserHealthContextString({ internalComfort: 'Open to trying' }, null);
    expect(text).toMatch(/nervous but open to trying/i);
    expect(text).toMatch(/insertion\/removal technique/i);
  });

  it('says nothing product-category-specific — applies to tampons, cups, and discs alike', () => {
    const text = buildUserHealthContextString({ internalComfort: 'Open to trying' }, null);
    expect(text).toMatch(/tampons, cups, discs/i);
    expect(text).not.toMatch(/menstrual cup\b/i);
  });

  it('a confident "Yes" answer adds no special instruction', () => {
    const text = buildUserHealthContextString({ internalComfort: 'Yes' }, null);
    expect(text).not.toMatch(/internal-product comfort/i);
  });
});
