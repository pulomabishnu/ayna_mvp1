import { describe, it, expect } from 'vitest';
import { renamePcos, renamePcosDeep } from './conditionRename';

describe('renamePcos', () => {
  it('renames the acronym in prose', () => {
    expect(renamePcos('Inositol may help PCOS symptoms.')).toBe('Inositol may help PMOS symptoms.');
    expect(renamePcos('PCOS-related acne and (PCOS)')).toBe('PMOS-related acne and (PMOS)');
    expect(renamePcos('pcos hair growth')).toBe('pmos hair growth');
    expect(renamePcos('Pcos belly')).toBe('Pmos belly');
  });

  it('renames the full name, keeping case', () => {
    expect(renamePcos('Polycystic ovary syndrome explained')).toBe('Polyendocrine metabolic ovarian syndrome explained');
    expect(renamePcos('living with polycystic ovarian syndrome')).toBe('living with polyendocrine metabolic ovarian syndrome');
    expect(renamePcos('Polycystic Ovary Syndrome (PCOS)')).toBe('Polyendocrine Metabolic Ovarian Syndrome (PMOS)');
  });

  it('keeps links, paths and subreddit names exactly', () => {
    const url = 'See https://www.acog.org/womens-health/faqs/polycystic-ovary-syndrome-pcos and www.mayoclinic.org/diseases-conditions/pcos/x';
    expect(renamePcos(url)).toBe(url);
    expect(renamePcos('From r/PCOS: PCOS tips')).toBe('From r/PCOS: PMOS tips');
    expect(renamePcos('/library/pcos-basics')).toBe('/library/pcos-basics');
  });

  it('leaves identifiers alone', () => {
    for (const s of ['condition_support.pcos', 'PCOS_REINFORCING_NEEDS', 'p-spearmint-pcos', 'pcos-basics', 'KNOWLEDGE.PCOS']) {
      expect(renamePcos(s)).toBe(s);
    }
  });

  it('keeps the ultrasound finding "polycystic ovaries"', () => {
    expect(renamePcos('polycystic ovaries on ultrasound')).toBe('polycystic ovaries on ultrasound');
  });

  it('does not say the name twice', () => {
    expect(renamePcos('PCOS/PMOS support')).toBe('PMOS support');
    expect(renamePcos('PCOS (PMOS)')).toBe('PMOS');
  });

  it('renames hashtags', () => {
    expect(renamePcos('#pcos #PCOS')).toBe('#pmos #PMOS');
  });

  it('walks objects without changing keys', () => {
    expect(renamePcosDeep({ pcos: 'PCOS care', list: ['pcos'] })).toEqual({ pcos: 'PMOS care', list: ['pmos'] });
  });

  it('can leave the lowercase id "pcos" alone in machine output', () => {
    expect(renamePcos('{"tag":"pcos","text":"PCOS care"}', { lowercase: false })).toBe('{"tag":"pcos","text":"PMOS care"}');
  });

  it('passes other text through untouched', () => {
    expect(renamePcos('PCOD and endometriosis')).toBe('PCOD and endometriosis');
    expect(renamePcos(42)).toBe(42);
  });
});
