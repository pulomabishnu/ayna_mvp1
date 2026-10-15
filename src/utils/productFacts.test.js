import { describe, it, expect } from 'vitest';
import { recallFacts } from './productFacts.js';

const r = (recalls) => recallFacts({ safety: { recalls } }).status;
describe('recallFacts', () => {
  it('never calls a named recall "no recalls"', () => {
    expect(r('2021 Lounger recall. Current nursing pillows are safe for supervised feeding only.')).toBe('past');
  });
  it('treats placeholders and brand-site-only reads as unknown', () => {
    expect(r('N/A')).toBe('unknown');
    expect(r('')).toBe('unknown');
    expect(r('Check current regulator and manufacturer recall notices.')).toBe('unknown');
    expect(r('No recalls are mentioned on alubri.com; check current regulator and manufacturer notices.')).toBe('unknown');
    expect(r('No product-specific recall is listed here; check current FDA/brand recall notices.')).toBe('unknown');
  });
  it('recognises real "none found" checks', () => {
    expect(r('No recalls found.')).toBe('none');
    expect(r('No recalls for Pure line.')).toBe('none');
    expect(r('No formal recalls. Note: a 2024 independent lab investigation found…')).toBe('none');
    expect(r('No recalls are listed in its FDA device record; check current FDA and manufacturer notices.')).toBe('none');
  });
  it('keeps lawsuits and label notes out of recall status', () => {
    expect(r('⚠️ 2021 lawsuit, later dropped: a proposed federal class action')).toBe('note');
    expect(r('2022: Thinx settled a $5M class-action lawsuit over PFAS in older products.')).toBe('note');
  });
});
