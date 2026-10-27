import { describe, expect, it } from 'vitest';
import { takeaway } from './takeaway.js';

describe('takeaway: plain words against her own usual', () => {
  it('sleep under her usual, in minutes', () => {
    expect(takeaway({ metric: 'sleep_minutes', week: 400, usual: 454 })).toMatchObject({ dir: -1, text: '54 min under your usual' });
  });
  it('steps within 3% read as about usual', () => {
    expect(takeaway({ metric: 'steps', week: 8201, usual: 8332 })).toMatchObject({ dir: 0, text: 'About your usual' });
  });
  it('no usual yet says so, never a number', () => {
    expect(takeaway({ metric: 'steps', week: 5000, usual: null }).text).toBe('Still learning your usual');
  });
  it('no value: nothing to say', () => {
    expect(takeaway({ metric: 'steps', week: null, avg: null })).toBeNull();
  });
});
