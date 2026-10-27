import { describe, it, expect } from 'vitest';
import { finishedRundown } from './rundownStore.js';

describe('closing the Daily Rundown', () => {
  it('X mid-story stays on Home; finishing goes to the chat', () => {
    expect(finishedRundown({ seen: 2, count: 6 })).toBe(false);
    expect(finishedRundown({ seen: 6, count: 6 })).toBe(true);
    expect(finishedRundown(null)).toBe(false);
  });
});
