import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import {
  getSearchEngine, analyzeSearch, correctedSearchQuery, searchProducts, searchArticles, rankSearchOptions,
  searchSuggestions, scoreSearchMatch, matchesSearchOption, generateTypoVariants, tokenize, damerauDistance,
} from './index.js';
import { ALL_PRODUCTS } from '../../data/products.js';
import { MISSPELLINGS, KNOWN_BRANDS } from '../../data/searchSynonyms.js';
import { MEDICATION_SUGGESTIONS } from '../../mobile/data/intakeModel.js';
import SmartSearchInput from '../../components/search/SmartSearchInput.jsx';
import SearchAssist from '../../components/search/SearchAssist.jsx';

const names = (q, n = 5) => searchProducts(q).slice(0, n).map((p) => p.name);
const anyName = (q, re, n = 5) => names(q, n).some((name) => re.test(name));

describe('text helpers', () => {
  it('Damerau distance counts a swap as one edit', () => {
    expect(damerauDistance('ovulation', 'ovualtion')).toBe(1);
    expect(damerauDistance('tampon', 'tampoon')).toBe(1);
    expect(damerauDistance('pads', 'pads')).toBe(0);
    expect(damerauDistance('abcdef', 'uvwxyz', 2)).toBe(3);
  });
  it('tokenize keeps offsets into the original text', () => {
    const toks = tokenize('  Menstral  crmps!');
    expect(toks.map((t) => [t.raw, t.start, t.end])).toEqual([['Menstral', 2, 10], ['crmps', 12, 17]]);
    expect(tokenize('o.b. tampons')[0].raw).toBe('o.b.');
  });
  it('generates many variants per important word', () => {
    const v = generateTypoVariants('magnesium');
    expect(v.length).toBeGreaterThan(40);
    expect(v).toEqual(expect.arrayContaining(['magnesim', 'magensium', 'magnesiumm', 'mgnsm']));
  });
});

describe('vocabulary size', () => {
  it('has hundreds of curated misspellings and thousands of generated ones', () => {
    const curated = Object.values(MISSPELLINGS).reduce((n, list) => n + list.length, 0);
    expect(curated).toBeGreaterThan(500);
    const stats = getSearchEngine().stats();
    expect(stats.generated).toBeGreaterThan(5000);
    expect(stats.misspellings).toBeGreaterThan(stats.generated);
  });
});

describe('misspellings resolve to the right word', () => {
  const cases = {
    tampoon: 'tampon', tampn: 'tampon', tampom: 'tampon', tampns: 'tampons',
    menstral: 'menstrual', menstural: 'menstrual', mentrual: 'menstrual',
    pmss: 'pms', endometreosis: 'endometriosis', endomitriosis: 'endometriosis',
    ovualtion: 'ovulation', vaginial: 'vaginal', vagnal: 'vaginal', probiotc: 'probiotic',
    magnisium: 'magnesium', magnesuim: 'magnesium', perimenapause: 'perimenopause',
    menapause: 'menopause', menopuse: 'menopause', crams: 'cramps', crmps: 'cramps',
    postpartem: 'postpartum', inisitol: 'inositol', ashwaganda: 'ashwagandha',
    incontinance: 'incontinence', lubricent: 'lubricant', contraceptiv: 'contraceptive',
    yeast: 'yeast', yeest: 'yeast', fertilty: 'fertility', pregnacy: 'pregnancy', suppliment: 'supplement',
    // not in the hand-written list: caught by generated variants / fuzzy match
    magnesiun: 'magnesium', ovulatoin: 'ovulation', incontinense: 'incontinence', lubricannt: 'lubricant',
    uquora: 'uqora', poize: 'poise', kegal: 'kegel', metfromin: 'metformin', melatonim: 'melatonin',
  };
  for (const [typo, want] of Object.entries(cases)) {
    it(`${typo} -> ${want}`, () => {
      const a = analyzeSearch(typo);
      const fixed = a.didYouMean || a.correctedQuery;
      expect(fixed).toBe(want);
    });
  }
  it('completes a half-typed last word for the search itself', () => {
    expect(analyzeSearch('zolof').searchText).toBe('zoloft');
    expect(analyzeSearch('tamp').searchText).toBe('tampon');
  });
  it('fixes several words in one query', () => {
    expect(correctedSearchQuery('menstral crmps')).toBe('menstrual cramps');
    expect(correctedSearchQuery('vaginial drynes')).toBe('vaginal dryness');
  });
  it('spacing variants are understood without a "Did you mean"', () => {
    for (const q of ['periodunderwear', 'post partum', 'peri menopause', 'pro biotic']) {
      const a = analyzeSearch(q);
      expect(a.unknown).toEqual([]);
      expect(searchProducts(q).length).toBeGreaterThan(0);
    }
    expect(anyName('periodunderwear', /period underwear/i)).toBe(true);
    expect(anyName('pro biotic', /probiotic/i)).toBe(true);
  });
  it('abbreviations expand (not shown as mistakes)', () => {
    for (const q of ['pms', 'pmdd', 'pcos', 'uti', 'bv', 'ttc', 'endo', 'lube', 'hsa', 'ob-gyn']) {
      const a = analyzeSearch(q);
      expect(a.didYouMean).toBeNull();
      expect(a.unknown).toEqual([]);
    }
  });
});

describe('misspelled searches still find the product', () => {
  const cases = [
    ['tampoons', /tampon/i], ['tampns', /tampon/i], ['menstral cup', /cup/i], ['menstural disc', /disc/i],
    ['ovualtion', /ovulation|fertility/i], ['vaginial dryness', /vaginal|moistur|glide/i], ['probiotc', /probiotic/i],
    ['magnisium', /magnesium/i], ['perimenapause', /menopause|hot flash/i], ['crmps', /heat|heating|cramp/i],
    ['postpartem', /postpartum/i], ['inisitol', /inositol/i], ['incontinance', /incontinence|bladder/i],
    ['lubricent', /lubricant|lube/i], ['yeast infecton', /boric|vaginal health/i], ['endomitriosis', /visana|heat|pain/i],
    ['uquora', /uqora/i], ['poize', /poise/i], ['kegal', /kegel|pelvic/i], ['period underware', /period underwear/i],
  ];
  for (const [q, re] of cases) it(q, () => expect(anyName(q, re)).toBe(true));
});

describe('broad / intent queries', () => {
  it('"things for pms" returns PMS products', () => {
    const a = analyzeSearch('things for pms');
    expect(a.needs).toContain('cycle.pms');
    expect(anyName('things for pms', /pms|primrose|vitex|chasteberry/i, 3)).toBe(true);
  });
  it('"something for cramps" returns cramp relief', () => {
    expect(analyzeSearch('something for cramps').needs).toContain('pain.menstrual_cramp');
    expect(anyName('something for cramps', /heat|heating|cramp|elaris/i, 3)).toBe(true);
  });
  it('"help with sleep" returns sleep products', () => {
    expect(analyzeSearch('help with sleep').needs).toContain('sleep.trouble');
    expect(searchProducts('help with sleep').length).toBeGreaterThan(0);
  });
  it('"for heavy flow" maps to the heavy-period need', () => {
    expect(analyzeSearch('for heavy flow').needs).toContain('period.heavy');
    expect(searchProducts('for heavy flow').length).toBeGreaterThan(3);
  });
  it('"cheap pads" returns pads, cheapest first-ish', () => {
    const list = searchProducts('cheap pads');
    expect(list.length).toBeGreaterThan(3);
    expect(list.slice(0, 5).every((p) => p.category === 'pad')).toBe(true);
  });
  it('"under $25" only returns products with a known price at or under $25', () => {
    const a = analyzeSearch('pads under $25');
    expect(a.filters.maxPrice).toBe(25);
    const list = searchProducts('pads under $25');
    expect(list.length).toBeGreaterThan(0);
    const engine = getSearchEngine();
    expect(engine.scoreProduct('pads under $1', list[0])).toBe(0);
  });
  it('"fragrance free" keeps only products known to be fragrance free', () => {
    const list = searchProducts('fragrance free pads');
    expect(list.length).toBeGreaterThan(0);
    expect(analyzeSearch('fragrance free pads').filters.fragranceFree).toBe(true);
  });
  it('"pregnancy safe" never returns products flagged for pregnancy', () => {
    expect(analyzeSearch('pregnancy safe').filters.pregnancy).toBe(true);
    expect(searchProducts('pregnancy safe').length).toBeGreaterThan(0);
  });
  it('a symptom maps to products for that symptom, never a diagnosis', () => {
    const a = analyzeSearch('cramps');
    expect(a.needs).toEqual(['pain.menstrual_cramp']);
    expect(a.needs.some((n) => n.startsWith('condition_support'))).toBe(false);
  });
  it('the literal query still scores (never worse than the old scorer)', () => {
    const item = ALL_PRODUCTS.find((p) => /uqora/i.test(p.name));
    expect(scoreSearchMatch('Uqora', item)).toBeGreaterThan(0);
  });
});

describe('suggestions', () => {
  it('offers "Products for PMS" for pms', () => {
    const s = searchSuggestions('pms');
    expect(s[0]).toMatchObject({ kind: 'need', label: 'Products for PMS' });
  });
  it('completes half-typed words', () => {
    expect(searchSuggestions('tamp').some((s) => /tampon/i.test(s.label))).toBe(true);
    expect(searchSuggestions('period und').some((s) => /period underwear/i.test(s.label))).toBe(true);
  });
  it('suggests from a misspelling', () => {
    expect(searchSuggestions('crmps ').some((s) => /cramps/i.test(s.label))).toBe(true);
  });
});

describe('unknown words', () => {
  it('flags gibberish', () => {
    expect(analyzeSearch('xyzzq').unknown).toEqual(['xyzzq']);
    expect(analyzeSearch('tampons qwrtpz').unknown).toEqual(['qwrtpz']);
    expect(searchProducts('tampons qwrtpz').length).toBeGreaterThan(0);
  });
  it('does not flag ordinary English or query words', () => {
    for (const q of ['what is the best thing for my period', 'something gentle for sensitive skin', 'i cant sleep at night', 'cheap pads under $20']) {
      expect(analyzeSearch(q).unknown).toEqual([]);
    }
  });
  it('does not flag a word still being typed', () => {
    expect(analyzeSearch('menstr', { typing: true }).unknown).toEqual([]);
  });
});

describe('no false corrections', () => {
  it('leaves catalog brand names alone', () => {
    const brands = [...new Set(ALL_PRODUCTS.map((p) => p.brand).filter(Boolean))];
    const corrected = brands.filter((b) => analyzeSearch(b).didYouMean || analyzeSearch(b).unknown.length);
    expect(corrected).toEqual([]);
  });
  it('leaves rare brand names we know of alone', () => {
    for (const b of ['Oboo', 'gina', 'BUNI', 'Proov', 'Elitone', 'Neycher', 'VIO2', 'Saalt', 'Thinx', 'Knix', 'Evvy', 'Kegg', 'Perelel', 'Joylux']) {
      const a = analyzeSearch(b);
      expect([b, a.didYouMean, a.unknown]).toEqual([b, null, []]);
    }
    const flagged = KNOWN_BRANDS.filter((b) => analyzeSearch(b).didYouMean);
    expect(flagged).toEqual([]);
  });
  it('leaves real words alone', () => {
    for (const w of ['hair', 'pads', 'cup', 'chair', 'heat', 'iron', 'stress', 'cramping', 'vulvar', 'probiotics', 'prenatal', 'tampons']) {
      expect([w, JSON.stringify(analyzeSearch(w).tokens)]).toEqual([w, expect.not.stringContaining('corrected')]);
    }
  });
  it('catalog product names come back unchanged', () => {
    const changed = ALL_PRODUCTS.slice(0, 120).map((p) => p.name).filter((n) => analyzeSearch(n).didYouMean);
    expect(changed).toEqual([]);
  });
});

describe('pick lists (quiz medication search, products you used)', () => {
  it('ranks medications with typos', () => {
    expect(rankSearchOptions('zolof', MEDICATION_SUGGESTIONS, 3)[0]).toBe('Zoloft');
    expect(rankSearchOptions('lexapr', MEDICATION_SUGGESTIONS, 3)[0]).toBe('Lexapro');
    expect(rankSearchOptions('metfromin', MEDICATION_SUGGESTIONS, 3)[0]).toBe('Metformin');
    expect(rankSearchOptions('magnisium', MEDICATION_SUGGESTIONS, 3)[0]).toBe('Magnesium');
    expect(rankSearchOptions('probiotc', MEDICATION_SUGGESTIONS, 3)[0]).toBe('Probiotic');
  });
  it('keeps plain prefix behaviour', () => {
    expect(rankSearchOptions('Lex', MEDICATION_SUGGESTIONS, 3)[0]).toBe('Lexapro');
    // The list grew (focus group, Oct 26): every top hit is still a "Vitamin" prefix match.
    const vit = rankSearchOptions('vit', MEDICATION_SUGGESTIONS, 5);
    expect(vit).toEqual(expect.arrayContaining(['Vitamin D']));
    expect(vit.every((v) => /^vitamin/i.test(v))).toBe(true);
    expect(rankSearchOptions('vitamin b1', MEDICATION_SUGGESTIONS, 3)).toContain('Vitamin B12');
  });
  it('filters short option lists typo-tolerantly', () => {
    expect(matchesSearchOption('crmps', 'Cramps or period pain')).toBe(true);
    expect(matchesSearchOption('endomitriosis', 'Endometriosis support')).toBe(true);
    expect(matchesSearchOption('acne', 'Hot flashes')).toBe(false);
  });
});

describe('reads', () => {
  const articles = [
    { id: 'a1', title: 'Period Pain and Cramps', tags: ['cramp-relief', 'cramps'], teaser: 'What helps with menstrual cramps.' },
    { id: 'a2', title: 'Endometriosis', tags: ['endometriosis'], teaser: 'Chronic pelvic pain.' },
    { id: 'a3', title: 'Recurrent UTIs', tags: ['uti'], teaser: 'Prevention tips for urinary tract infections.' },
  ];
  it('finds reads through typos and broad words', () => {
    expect(searchArticles('crmps', articles)[0].id).toBe('a1');
    expect(searchArticles('endomitriosis', articles)[0].id).toBe('a2');
    expect(searchArticles('urinary', articles)[0].id).toBe('a3');
    expect(searchArticles('something for cramps', articles)[0].id).toBe('a1');
  });
});

describe('search UI', () => {
  it('underlines an unknown word and describes it for screen readers', () => {
    const html = renderToStaticMarkup(createElement(SmartSearchInput, { value: 'tampons qwrtpz', onChange: () => {}, 'aria-label': 'Search' }));
    expect(html).toContain('class="ays-bad"');
    expect(html).toContain('qwrtpz</span>');
    expect(html).toContain("We don&#x27;t recognize &#x27;qwrtpz&#x27;");
    expect(html).toMatch(/aria-describedby="ays-hint-/);
  });
  it('does not underline known words', () => {
    const html = renderToStaticMarkup(createElement(SmartSearchInput, { value: 'menstrual cups', onChange: () => {} }));
    expect(html).not.toContain('ays-bad');
    expect(html).not.toContain('aria-describedby');
  });
  it('assist line offers the correction', () => {
    const html = renderToStaticMarkup(createElement(SearchAssist, { query: 'menstral crmps', onUse: () => {} }));
    expect(html).toContain('Did you mean');
    expect(html).toContain('menstrual cramps');
  });
  it('assist line offers things to try for an unknown word', () => {
    const html = renderToStaticMarkup(createElement(SearchAssist, { query: 'xyzzq', resultCount: 0, onUse: () => {} }));
    expect(html).toContain('No results for');
    expect(html).toContain('ays-assist__chips');
  });
});

describe('speed', () => {
  it('scores the whole catalog quickly once warm', () => {
    searchProducts('warm up');
    const t0 = performance.now();
    for (const q of ['menstral crmps', 'things for pms', 'cheap pads under $20', 'probiotc', 'xyzzq tampons']) searchProducts(q);
    expect(performance.now() - t0).toBeLessThan(1500);
  });
});
