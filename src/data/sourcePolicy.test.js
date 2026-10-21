import { describe, it, expect } from 'vitest';
import { isCredibleScienceSource } from './sourcePolicy.js';
import { audit } from '../../scripts/audit-sources.mjs';

describe('source policy', () => {
  it('accepts government, academic, PubMed/PMC and vetted .org sources', () => {
    for (const u of [
      'https://pubmed.ncbi.nlm.nih.gov/12345678/', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC123/',
      'https://medlineplus.gov/menopause.html', 'https://www.nhs.uk/conditions/early-menopause/',
      'https://www.acog.org/womens-health/faqs/menopause', 'https://www.mayoclinic.org/x', 'https://www.cochrane.org/CD000',
      'https://www.health.harvard.edu/blog/x', 'https://www.canada.ca/en/health-canada.html',
    ]) expect(isCredibleScienceSource(u), u).toBe(true);
  });
  it('rejects .com, preprints, journal indexes and redirects', () => {
    for (const u of [
      'https://www.cochranelibrary.com/cdsr/doi/10.1002/x', 'https://srh.bmj.com/content/50/1/21', 'https://www.healthline.com/x',
      'https://www.medrxiv.org/content/x', 'https://doaj.org/article/x', 'https://doi.org/10.1/x', 'https://integration.asrm.org/x',
    ]) expect(isCredibleScienceSource(u), u).toBe(false);
  });
  it('every science and clinical source in the research data passes', async () => {
    const bad = await audit();
    expect(bad.map((b) => `${b.path} ${b.url}`)).toEqual([]);
  });
});
