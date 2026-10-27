import { describe, it, expect } from 'vitest';
import { isGovHealthSource, isPaperLink } from './govSources.js';
import { relatedNeedSuggestions } from '../matching/relatedNeeds.js';

describe('.gov health sources (founder rule, Oct 24)', () => {
  it('accepts MedlinePlus, NIH institutes, NLM DailyMed and Bookshelf, FDA, CDC, womenshealth.gov and AHRQ', () => {
    for (const u of ['https://medlineplus.gov/ency/article/003150.htm', 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/', 'https://www.nccih.nih.gov/health/garlic',
      'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=x', 'https://www.ncbi.nlm.nih.gov/books/NBK501853/', 'https://www.fda.gov/x', 'https://www.cdc.gov/x', 'https://womenshealth.gov/x', 'https://effectivehealthcare.ahrq.gov/x']) {
      expect(isGovHealthSource(u), u).toBe(true);
    }
  });
  it('rejects medical societies, clinics, the NHS, journals and unopened PubMed/PMC papers', () => {
    for (const u of ['https://www.mayoclinic.org/x', 'https://www.acog.org/x', 'https://www.nhs.uk/x', 'https://menopause.org/x', 'https://www.cochrane.org/x', 'https://pubmed.ncbi.nlm.nih.gov/1/', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1/', 'https://www.fda.gov/search?q=x', 'not a url']) {
      expect(isGovHealthSource(u), u).toBe(false);
    }
    expect(isPaperLink('https://pubmed.ncbi.nlm.nih.gov/1/')).toBe(true);
    expect(isPaperLink('https://www.ncbi.nlm.nih.gov/books/NBK501853/')).toBe(false);
  });
  it('"Often goes together" only shows rates from .gov pages', () => {
    const s = [...relatedNeedSuggestions([], ['infertility'], 10), ...relatedNeedSuggestions([], ['pcos', 'endometriosis', 'thyroid'], 10)];
    expect(s.length).toBeGreaterThan(0);
    for (const r of s) expect(isGovHealthSource(r.source), r.source).toBe(true);
  });
});
