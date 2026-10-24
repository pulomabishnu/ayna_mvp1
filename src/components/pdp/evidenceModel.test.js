import { describe, it, expect } from 'vitest';
import { noDash, meaningful, paragraphs, collectLinks, isNegative, parseRating, linkKind, buildEvidence } from './evidenceModel.js';

describe('evidence model: nothing the team wrote is lost', () => {
  it('turns em dashes into sentence breaks, not comma splices', () => {
    expect(noDash('It works — it is cheap')).toBe('It works. It is cheap');
    expect(noDash('LOLA — 2021')).toBe('LOLA, 2021');
  });

  it('drops placeholders but keeps the note after them', () => {
    expect(meaningful('N/A (Software)')).toBe('');
    expect(meaningful('N/A')).toBe('');
    expect(meaningful('N/A (Software). Risk of pregnancy if the method is not followed perfectly.')).toBe('Risk of pregnancy if the method is not followed perfectly.');
    expect(meaningful('Hypoallergenic')).toBe('Hypoallergenic');
  });

  it('splits a long paragraph without changing a word', () => {
    const long = Array.from({ length: 12 }, (_, i) => `Sentence number ${i + 1} says one plain thing here.`).join(' ');
    const out = paragraphs(long, 200);
    expect(out.length).toBeGreaterThan(1);
    expect(out.join(' ')).toBe(long);
  });

  it('merges two links to the same page and keeps every sentence of both summaries', () => {
    const [l] = collectLinks([
      { url: 'https://pubmed.ncbi.nlm.nih.gov/1/', text: 'Short title', summary: 'A review of trials. Not product-specific.' },
      { url: 'https://pubmed.ncbi.nlm.nih.gov/1/', text: 'A longer, fuller title', summary: 'Moisturizers may help dryness (low certainty). Not product-specific.' },
    ], 'Brand');
    expect(l.title).toBe('A longer, fuller title');
    expect(l.altTitles).toEqual(['Short title']);
    expect(l.summary).toBe('A review of trials. Not product-specific. Moisturizers may help dryness (low certainty).');
  });

  it('flags a study that found no benefit', () => {
    expect(isNegative('About 2 g a day for 6 months did not significantly reduce UTIs compared with placebo (51% vs 56%).')).toBe(true);
    expect(isNegative('Daily use slowed skin aging.')).toBe(false);
  });

  it('reads a star rating written into a summary', () => {
    expect(parseRating('4.5 out of 5 stars from 34 ratings (75% five-star)')).toEqual({ value: '4.5', count: '34' });
    expect(parseRating('4.0/5 from 274 Amazon ratings')).toEqual(null);
  });

  it('labels links by what they are instead of dropping them', () => {
    expect(linkKind('https://www.amazon.com/dp/X', 'kieró').tier).toBe('retail');
    expect(linkKind('https://helloneycher.com/products/x', 'Neycher').tier).toBe('brand');
    expect(linkKind('https://www.reddit.com/r/periods/search/?q=x', 'LOLA').label).toBe('Search of community posts');
    expect(linkKind('https://www.law360.com/cases/1', 'LOLA').tier).toBe('legal');
    // Founder rule (Oct 24): only .gov health pages count; an unopened PubMed paper and a medical society are labelled, not dropped.
    expect(linkKind('https://pubmed.ncbi.nlm.nih.gov/2/', 'LOLA')).toEqual({ tier: 'paper', label: 'Study record, not yet checked by ayna' });
    expect(linkKind('https://medlineplus.gov/ency/article/003150.htm', 'LOLA').tier).toBe('credible');
    expect(linkKind('https://www.acog.org/womens-health/faqs/x', 'LOLA')).toEqual({ tier: 'nongov', label: 'Not a .gov source, not checked by ayna' });
    expect(linkKind('https://www.mayoclinic.org/x', 'LOLA').tier).toBe('nongov');
  });

  it('keeps every short-answer sentence, the full opinion and non-credible links', () => {
    const m = buildEvidence({
      id: 'x', name: 'X', brand: 'Acme', type: 'physical', category: 'supplement',
      summary: 'First sentence here. Second sentence here.',
      doctorOpinionShort: 'One. Two is here. Three is here too.',
      doctorOpinion: 'Para one.\n\nPara two.',
      doctorOpinionCitations: [{ url: 'https://acme.com/p', label: 'acme.com: product page' }, { url: 'https://www.fda.gov/x', label: 'FDA: page' }],
      safety: { sideEffects: 'N/A', fdaStatus: 'Dietary supplement' },
    }, { heroLine: 'First sentence here.' });
    expect(m.expert.short).toEqual(['One.', 'Two is here.', 'Three is here too.']);
    expect(m.expert.opinion).toEqual(['Para one.', 'Para two.']);
    expect(m.expert.sources.map((s) => s.url)).toEqual(['https://www.fda.gov/x']);
    expect(m.expert.other.map((s) => s.kind.tier)).toEqual(['brand']);
    expect(m.summary).toEqual(['Second sentence here.']);
    expect(m.safety.sideEffects).toBe('');
    expect(m.additions.some((a) => a.id === 'fda-supplements')).toBe(true);
  });
});
