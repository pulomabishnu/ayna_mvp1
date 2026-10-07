// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_TEXT_SIZE_INDEX,
  TEXT_SIZE_STEPS,
  TEXT_SIZE_STORAGE_KEY,
  applyTextSizeIndex,
  initTextSize,
  normalizeTextSizeIndex,
  readStoredTextSizeIndex,
  setTextSizeIndex,
  storeTextSizeIndex,
  textScaleFor,
} from './textSize';

describe('text size mapping', () => {
  it('has four steps matching the server range 0-3', () => {
    expect(TEXT_SIZE_STEPS).toHaveLength(4);
    expect(TEXT_SIZE_STEPS.map((s) => s.scale)).toEqual([0.9, 1, 1.15, 1.3]);
    expect(DEFAULT_TEXT_SIZE_INDEX).toBe(1);
  });

  it('normalizes numbers, numeric strings and junk', () => {
    expect(normalizeTextSizeIndex(0)).toBe(0);
    expect(normalizeTextSizeIndex(3)).toBe(3);
    expect(normalizeTextSizeIndex('2')).toBe(2);
    expect(normalizeTextSizeIndex(4)).toBe(1);
    expect(normalizeTextSizeIndex(-1)).toBe(1);
    expect(normalizeTextSizeIndex(1.5)).toBe(1);
    expect(normalizeTextSizeIndex('')).toBe(1);
    expect(normalizeTextSizeIndex(null)).toBe(1);
    expect(normalizeTextSizeIndex('abc')).toBe(1);
  });

  it('maps an index to its scale', () => {
    expect(textScaleFor(0)).toBe(0.9);
    expect(textScaleFor(3)).toBe(1.3);
    expect(textScaleFor(99)).toBe(1);
  });
});

describe('text size persistence + application', () => {
  beforeEach(() => {
    localStorage.clear();
    applyTextSizeIndex(DEFAULT_TEXT_SIZE_INDEX);
  });

  it('round-trips through localStorage and defaults when empty or corrupt', () => {
    expect(readStoredTextSizeIndex()).toBe(1);
    storeTextSizeIndex(3);
    expect(localStorage.getItem(TEXT_SIZE_STORAGE_KEY)).toBe('3');
    expect(readStoredTextSizeIndex()).toBe(3);
    localStorage.setItem(TEXT_SIZE_STORAGE_KEY, 'huge');
    expect(readStoredTextSizeIndex()).toBe(1);
  });

  it('survives storage that throws', () => {
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readStoredTextSizeIndex(broken)).toBe(1);
    expect(() => storeTextSizeIndex(2, broken)).not.toThrow();
  });

  it('sets the CSS variable + attribute for non-default sizes and clears them at default', () => {
    const root = document.documentElement;
    applyTextSizeIndex(2);
    expect(root.style.getPropertyValue('--ayna-text-scale')).toBe('1.15');
    expect(root.getAttribute('data-ayna-text-size')).toBe('large');
    applyTextSizeIndex(1);
    expect(root.style.getPropertyValue('--ayna-text-scale')).toBe('');
    expect(root.hasAttribute('data-ayna-text-size')).toBe(false);
  });

  it('setTextSizeIndex applies and stores; initTextSize re-applies the stored value', () => {
    expect(setTextSizeIndex(0)).toBe(0);
    expect(localStorage.getItem(TEXT_SIZE_STORAGE_KEY)).toBe('0');
    applyTextSizeIndex(1);
    expect(initTextSize()).toBe(0);
    expect(document.documentElement.getAttribute('data-ayna-text-size')).toBe('small');
  });
});
