import { describe, it, expect } from 'vitest';
import { setupNudge } from './setupNudge.js';
describe('finish setting up reminder', () => {
  it('next evening, with how many steps are left', () => {
    const n = setupNudge(2, new Date('2026-11-16T10:00:00'));
    expect(n.title).toBe('Finish setting up ayna');
    expect(n.body).toMatch(/^2 quick steps left/);
    expect(n.schedule.at.getDate()).toBe(17);
    expect(n.schedule.at.getHours()).toBe(18);
  });
  it('nothing once set-up is done', () => { expect(setupNudge(0)).toBeNull(); });
});
