import { describe, expect, it } from 'vitest';
import { goalProgress } from './goalProgress.js';

const today = '2026-11-11';
const log = { '2026-11-11': { sleep: 3, pain: 2, energy: 1 }, '2026-11-10': { sleep: 1, pain: 0, energy: 2 }, '2026-11-09': { sleep: 2 }, '2026-11-01': { sleep: 3 } };
describe('goalProgress (your own log, last 7 days)', () => {
  it('sleep counts Okay or Good nights', () => { expect(goalProgress({ id: 'sleep.trouble', label: 'Sleep' }, log, today)).toMatchObject({ good: 2, logged: 3 }); });
  it('pain counts None or Mild days', () => { expect(goalProgress({ id: 'pain.menstrual_cramp' }, log, today)).toMatchObject({ good: 1, logged: 2 }); });
  it('other goals count check-in days', () => { expect(goalProgress({ id: 'bleeding.heavy' }, log, today)).toMatchObject({ good: 3, logged: 3 }); });
  it('nothing logged says how to start', () => { expect(goalProgress({ id: 'energy.fatigue' }, {}, today).line).toMatch(/Log how it went today/); });
});
