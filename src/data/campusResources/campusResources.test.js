import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SCHOOLS, searchSchools, groupResources } from './index';
import { NATIONAL_RESOURCES } from './national';
import { CATEGORY_BY_ID } from './categories';
import { CASE_BLOCKS, SOURCES, PETITION } from './janeDoe';

const all = [...NATIONAL_RESOURCES, ...SCHOOLS.flatMap((s) => s.resources)];

describe('campus resources data integrity', () => {
  it('every resource has an official https source, a verified date, and a valid category', () => {
    for (const r of all) {
      expect(r.name, r.id).toBeTruthy();
      expect(r.sourceUrl, r.id).toMatch(/^https:\/\//);
      expect(r.sourceLabel, r.id).toBeTruthy();
      expect(r.lastVerified, r.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(CATEGORY_BY_ID[r.category], r.id).toBeTruthy();
    }
  });
  it('phone numbers are 10 digits and ids are unique', () => {
    for (const r of all) if (r.phone) expect(r.phone.replace(/\D/g, ''), r.id).toHaveLength(10);
    expect(new Set(all.map((r) => r.id)).size).toBe(all.length);
  });
  it('RAINN hotline matches the verified values', () => {
    const rainn = NATIONAL_RESOURCES.find((r) => r.id === 'rainn-hotline');
    expect(rainn.phone).toBe('800-656-4673');
    expect(rainn.text).toEqual({ number: '64673', keyword: 'HOPE' });
  });
  it('searches by name and alias; unknown schools return nothing (never guessed)', () => {
    expect(searchSchools('cornell')[0].id).toBe('cornell-university');
    expect(searchSchools('Ithaca')[0].id).toBe('cornell-university');
    expect(searchSchools('Hogwarts University')).toEqual([]);
    expect(searchSchools('')).toEqual([]);
  });
  it('Cornell covers each requested category', () => {
    const ids = groupResources(SCHOOLS[0].resources).map((g) => g.id);
    for (const id of ['confidential', 'medical', 'mental-health', 'reporting', 'title-ix', 'safety', 'local']) expect(ids).toContain(id);
  });
  it('case copy has sources, a petition link, and names no one', () => {
    expect(PETITION.url).toBe('https://www.change.org/p/cornell-alumni-supporting-jane-doe');
    for (const b of CASE_BLOCKS) for (const k of b.sources) expect(SOURCES[k].url).toMatch(/^https:\/\//);
  });
});

describe('multi-school data', () => {
  it('school ids are unique and all phone fields are 10 digits', () => {
    const ids = SCHOOLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    SCHOOLS.forEach((s) => s.resources.forEach((r) => {
      const nums = [r.phone, ...(r.extraPhones || []).map((p) => p.number)].filter(Boolean);
      nums.forEach((n) => expect(String(n).replace(/\D/g, '')).toHaveLength(10));
      if (r.text) expect(String(r.text.number).replace(/\D/g, '')).toMatch(/^(\d{5,6}|\d{10})$/);
    }));
  });
  it('search does not mismatch similar names', () => {
    expect(searchSchools('michigan state').map((s) => s.id)).toEqual(['michigan-state-university']);
    expect(searchSchools('ucla').map((s) => s.id)).toContain('ucla');
    expect(searchSchools('michigan').map((s) => s.id)).toContain('university-of-michigan');
    expect(searchSchools('evanston').map((s) => s.id)).toContain('northwestern-university');
    expect(searchSchools('ithaca').map((s) => s.id)).toContain('cornell-university');
  });
});

describe('privacy', () => {
  it('CampusResources component never calls analytics', () => {
    const src = readFileSync(new URL('../../components/CampusResources.jsx', import.meta.url), 'utf8');
    expect(src).not.toMatch(/posthog\.(capture|identify)|window\.posthog|gtag\(/);
  });
  it('main.jsx drops all analytics events on /campus-resources', () => {
    const src = readFileSync(new URL('../../main.jsx', import.meta.url), 'utf8');
    expect(src).toMatch(/campus-resources/);
  });
});
