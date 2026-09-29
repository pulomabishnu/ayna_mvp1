import { describe, it, expect } from 'vitest';
import { isTrustedScientificSource, applyTrustedSourceGuardrail } from './trustedSources.js';
import { ALL_PRODUCTS } from '../data/products.js';
import { getVerificationLinks } from './verificationLinks.js';

describe('isTrustedScientificSource', () => {
  it('accepts government, society, and journal sources', () => {
    for (const url of [
      'https://pubmed.ncbi.nlm.nih.gov/23574713/',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC3819307/',
      'https://www.nccih.nih.gov/health/aloe-vera',
      'https://medlineplus.gov/druginfo/meds/a682793.html',
      'https://www.cdc.gov/std/treatment-guidelines/bv.htm',
      'https://www.acog.org/womens-health/faqs/vulvovaginal-health',
      'https://www.uptodate.com/contents/vulvovaginal-atrophy',
      'https://doi.org/10.1371/journal.pone.0080074',
    ]) {
      expect(isTrustedScientificSource(url), url).toBe(true);
    }
  });

  it('rejects brand, blog, news, and press-release sources', () => {
    for (const url of [
      'https://alubri.com/pages/science',
      'https://www.healthline.com/health/womens-health/organic-tampons',
      'https://www.nytimes.com/wirecutter/reviews/best-period-underwear/',
      'https://www.prnewswire.com/news-releases/x.html',
      'https://www.headspace.com/science',
      'https://notnih.gov.example.com/page',
      'not a url',
    ]) {
      expect(isTrustedScientificSource(url), url).toBe(false);
    }
  });
});

describe('applyTrustedSourceGuardrail', () => {
  it('filters every link shape and leaves community links alone', () => {
    const out = applyTrustedSourceGuardrail({
      verificationLinks: {
        doctor: { url: 'https://www.healthline.com/x', text: 'Healthline' },
        scientific: [{ url: 'https://pubmed.ncbi.nlm.nih.gov/1/' }, { url: 'https://brand.com/science' }],
        community: { links: [{ url: 'https://www.reddit.com/r/x' }] },
      },
      scientificCitations: [{ url: 'https://www.acog.org/x' }, { url: 'https://brand.com/y' }],
      ingredientScience: [{ name: 'X', citations: [{ url: 'https://alubri.com/a' }, { url: 'https://www.nccih.nih.gov/b' }] }],
    });
    expect(out.verificationLinks.doctor).toEqual({ links: [] });
    expect(out.verificationLinks.scientific.map((l) => l.url)).toEqual(['https://pubmed.ncbi.nlm.nih.gov/1/']);
    expect(out.verificationLinks.community.links).toHaveLength(1);
    expect(out.scientificCitations.map((l) => l.url)).toEqual(['https://www.acog.org/x']);
    expect(out.ingredientScience[0].citations.map((l) => l.url)).toEqual(['https://www.nccih.nih.gov/b']);
  });
});

describe('catalog scientific evidence', () => {
  it('only cites trusted sources on every product', () => {
    const offenders = [];
    for (const p of ALL_PRODUCTS) {
      const urls = [
        ...getVerificationLinks(p, 'scientific'),
        ...getVerificationLinks(p, 'doctor'),
        ...(p.scientificCitations || []),
        ...(p.ingredientScience || []).flatMap((i) => i.citations || []),
      ].map((l) => l?.url || l?.href).filter(Boolean);
      for (const url of urls) if (!isTrustedScientificSource(url)) offenders.push(`${p.id}: ${url}`);
    }
    expect(offenders).toEqual([]);
  });
});
