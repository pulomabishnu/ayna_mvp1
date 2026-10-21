import { describe, it, expect } from 'vitest';
import { searchProducts, searchArticles, analyzeSearch } from './index.js';
import { ARTICLES } from '../../components/Articles.jsx';
import { canonicalize } from '../../matching/ontology.js';

// PCOS is now PMOS (Oct 20). People will type either name for a while; both
// must find the same products and the same article.
const ids = (list) => list.map((x) => x?.product?.id || x?.id || x).filter(Boolean);

describe('search: PMOS and PCOS are the same thing', () => {
  for (const [a, b] of [['pmos', 'pcos'], ['PMOS', 'PCOS'], ['pmos hair growth', 'pcos hair growth'], ['polyendocrine metabolic ovarian syndrome', 'polycystic ovary syndrome']]) {
    it(`"${a}" finds what "${b}" finds`, () => {
      const old = ids(searchProducts(b)).slice(0, 10);
      const now = ids(searchProducts(a)).slice(0, 10);
      expect(old.length).toBeGreaterThan(0);
      expect(now.length).toBeGreaterThan(0);
      const overlap = now.filter((id) => old.includes(id)).length;
      expect(overlap / Math.min(old.length, now.length)).toBeGreaterThanOrEqual(0.6);
    });
  }

  it('the library article comes up for "pmos"', () => {
    const found = ids(searchArticles('pmos', ARTICLES));
    expect(found).toContain('pcos-basics');
  });

  it('typing PMOS in a health answer reads as the condition', () => {
    for (const text of ['I have PMOS', 'diagnosed with polyendocrine metabolic ovarian syndrome', 'I have PCOS']) {
      expect(JSON.stringify(canonicalize(text))).toMatch(/"pcos"/);
    }
    expect(analyzeSearch('pmos')).toBeTruthy();
  });
});
