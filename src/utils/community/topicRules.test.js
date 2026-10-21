import { describe, expect, it } from 'vitest';
import { TOPIC_COLORS, checkTopicContrast, contrastRatio, defaultTextFor, relativeLuminance } from './topicContrast.js';
import { topicNameProblem, topicDescriptionProblem, topicSlug, validateTopicInput, TOPIC_PROBLEMS } from './topicRules.js';

const HEX = Object.fromEntries(TOPIC_COLORS.map((c) => [c.key, c.hex]));

describe('topic contrast (WCAG relative luminance, 4.5:1)', () => {
  it('matches known reference values', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#000000')).toBe(0);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(relativeLuminance('nope')).toBe(null);
  });

  // Every brand pair, text on cover. Ratios computed with the same formula as
  // community_contrast_ratio in the migration.
  const expected = {
    'espresso on butter': true, 'espresso on sky': true, 'espresso on pink': true, 'espresso on espresso': false,
    'butter on espresso': true, 'butter on butter': false, 'butter on sky': false, 'butter on pink': false,
    'sky on espresso': true, 'sky on butter': false, 'sky on sky': false, 'sky on pink': false,
    'pink on espresso': true, 'pink on butter': false, 'pink on sky': false, 'pink on pink': false,
  };
  for (const [pair, ok] of Object.entries(expected)) {
    it(`${pair} ${ok ? 'passes' : 'fails'}`, () => {
      const [text, , bg] = pair.split(' ');
      const res = checkTopicContrast({ textColor: HEX[text], coverColor: HEX[bg] });
      expect(res.ok).toBe(ok);
      if (ok) expect(res.ratio).toBeGreaterThanOrEqual(4.5);
      else expect(res.reason).toMatch(/Same colour|Too hard to read/);
    });
  }

  it('on a photo only butter or espresso titles are allowed (they sit on a solid strip)', () => {
    expect(checkTopicContrast({ textColor: HEX.butter, hasPhoto: true }).ok).toBe(true);
    expect(checkTopicContrast({ textColor: HEX.espresso, hasPhoto: true }).ok).toBe(true);
    expect(checkTopicContrast({ textColor: HEX.pink, hasPhoto: true }).ok).toBe(false);
  });

  it('picks a readable default for every cover', () => {
    for (const c of TOPIC_COLORS) expect(checkTopicContrast({ textColor: defaultTextFor(c.hex), coverColor: c.hex }).ok).toBe(true);
  });
});

describe('topic names', () => {
  it('accepts plain health topics, including ones about doctors', () => {
    for (const name of ['Adenomyosis', 'Living with PCOS', 'Doctor visits', 'Nursing and pumping', 'IVF round 2']) expect(topicNameProblem(name)).toBe('');
  });
  it('enforces length and letters', () => {
    expect(topicNameProblem('ab')).toBe(TOPIC_PROBLEMS.short);
    expect(topicNameProblem('x'.repeat(41))).toBe(TOPIC_PROBLEMS.long);
    expect(topicNameProblem('1234')).toBe(TOPIC_PROBLEMS.letters);
  });
  it('blocks links', () => {
    for (const name of ['shop at glow.com', 'www.thing', 'https://x.io', 'linktr.ee/me']) expect(topicNameProblem(name)).toBeTruthy();
  });
  it('blocks ayna and clinician impersonation', () => {
    expect(topicNameProblem('ayna official')).toBe(TOPIC_PROBLEMS.impersonation);
    expect(topicNameProblem('Mods only')).toBe(TOPIC_PROBLEMS.impersonation);
    expect(topicNameProblem('Ask a doctor')).toBe(TOPIC_PROBLEMS.clinician);
    expect(topicNameProblem('Dr Maya answers')).toBe(TOPIC_PROBLEMS.clinician);
    expect(topicNameProblem('Nurse-approved tips')).toBe(TOPIC_PROBLEMS.clinician);
  });
  it('runs the community rules', () => {
    expect(topicNameProblem('dm me for meds')).toMatch(/community rules/);
  });
  it('points to curated topics instead of copying them', () => {
    expect(topicNameProblem('Endometriosis')).toBe(TOPIC_PROBLEMS.curated);
    expect(topicNameProblem('birth control')).toBe(TOPIC_PROBLEMS.curated);
  });
  it('checks descriptions', () => {
    expect(topicDescriptionProblem('')).toBe('');
    expect(topicDescriptionProblem('x'.repeat(201))).toBe(TOPIC_PROBLEMS.description);
    expect(topicDescriptionProblem('see bit.ly/abc')).toBeTruthy();
  });
});

describe('validateTopicInput', () => {
  const base = { name: '  Living   with adeno ', description: 'For anyone newly told.', coverColor: '#F7BADD', textColor: '#3e2723', titleFont: 'sans', visibility: 'friends' };
  it('returns clean database columns and never status or creator', () => {
    const { row } = validateTopicInput({ ...base, status: 'visible', created_by: 'someone', anonymous: true });
    expect(row).toEqual({ name: 'Living with adeno', description: 'For anyone newly told.', cover_image_url: null, cover_color: '#f7badd', title_font: 'sans', text_color: '#3e2723', visibility: 'friends', creator_anonymous: false });
  });
  it('keeps anonymous only for public topics', () => {
    expect(validateTopicInput({ ...base, visibility: 'public', anonymous: true }).row.creator_anonymous).toBe(true);
  });
  it('rejects unreadable colours and foreign cover paths', () => {
    expect(validateTopicInput({ ...base, textColor: '#ffedac' })).toMatchObject({ field: 'text' });
    expect(validateTopicInput({ ...base, coverImageUrl: 'avatars/u/x.jpg' })).toMatchObject({ field: 'cover' });
    expect(validateTopicInput({ ...base, coverImageUrl: 'covers/123e4567-e89b-12d3-a456-426614174000.jpg', textColor: '#ffedac' }).row.cover_image_url).toMatch(/^covers\//);
  });
  it('makes url-safe slugs', () => {
    expect(topicSlug('Living with PCOS!', 'ab12cd')).toBe('living-with-pcos-ab12cd');
    expect(topicSlug('Ménopause & me', 'zz')).toBe('menopause-me-zz');
    expect(topicSlug('!!', 'q1')).toMatch(/^topic-q1$/);
  });
});
