import { describe, expect, it } from 'vitest';
import { HEARD_ABOUT_OPTIONS, heardAboutMetadata } from './heardAbout.js';
import { isValidUsZip } from '../mobile/data/intakeModel.js';

describe('heardAboutMetadata', () => {
  it('is empty when nothing (or something unknown) is picked', () => {
    expect(heardAboutMetadata('')).toEqual({});
    expect(heardAboutMetadata('billboard')).toEqual({});
  });
  it('stores the choice, and the text only for Other', () => {
    expect(heardAboutMetadata('tiktok', 'ignored')).toEqual({ heard_about: 'tiktok' });
    expect(heardAboutMetadata('other', '  a   podcast ')).toEqual({ heard_about: 'other', heard_about_other: 'a podcast' });
    expect(heardAboutMetadata('other', '')).toEqual({ heard_about: 'other' });
  });
  it('offers Other last', () => {
    expect(HEARD_ABOUT_OPTIONS.at(-1).value).toBe('other');
  });
});

describe('isValidUsZip', () => {
  it('accepts five digits only', () => {
    expect(isValidUsZip('10027')).toBe(true);
    expect(isValidUsZip('1')).toBe(false);
    expect(isValidUsZip('1002')).toBe(false);
    expect(isValidUsZip('00000')).toBe(false);
    expect(isValidUsZip('')).toBe(false);
    expect(isValidUsZip('1002a')).toBe(false);
  });
});
