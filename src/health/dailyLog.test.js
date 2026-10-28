import { describe, expect, it } from 'vitest';
import {
  applyLogSync, dirtyLogEntries, LEGACY_CHECKIN_KEY, LOG_FIELDS, LOG_KEY, logOwner, logRange, mergeLogs, normalizeEntry,
  readLog, saveLogEntry, setLogOwner, weekTakeaway, addDays,
} from './dailyLog.js';

const mem = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), raw: m };
};
const at = (s) => new Date(s);

describe('daily log entries', () => {
  it('saves a patch for a day and reads it back with every field', () => {
    const storage = mem();
    saveLogEntry('2026-10-24', { pain: 2, flow: 'heavy' }, { storage, now: at('2026-10-24T08:00:00Z') });
    const e = readLog(storage)['2026-10-24'];
    expect(e).toMatchObject({ day: '2026-10-24', pain: 2, flow: 'heavy', pms: null, sleep: null, mood: null, skin: null, updatedAt: '2026-10-24T08:00:00.000Z' });
  });

  it('keeps pain 0 ("None") distinct from not logged (null)', () => {
    const storage = mem();
    saveLogEntry('2026-10-24', { pain: 0 }, { storage });
    const e = readLog(storage)['2026-10-24'];
    expect(e.pain).toBe(0);
    expect(e.pms).toBeNull();
  });

  it('ignores values that are not allowed and unknown fields', () => {
    const storage = mem();
    saveLogEntry('2026-10-24', { pain: 9, flow: 'gushing', sleep: 2, weight: 60 }, { storage });
    const e = readLog(storage)['2026-10-24'];
    expect(e).toMatchObject({ pain: null, flow: null, sleep: 2 });
    expect(e).not.toHaveProperty('weight');
    expect(saveLogEntry('not-a-day', { pain: 1 }, { storage })).toBeNull();
  });

  it('null clears a field', () => {
    const storage = mem();
    saveLogEntry('2026-10-24', { sleep: 3 }, { storage, now: at('2026-10-24T08:00:00Z') });
    saveLogEntry('2026-10-24', { sleep: null }, { storage, now: at('2026-10-24T09:00:00Z') });
    expect(readLog(storage)['2026-10-24'].sleep).toBeNull();
  });

  it('logRange returns logged days only, oldest first', () => {
    const storage = mem();
    for (const d of ['2026-10-20', '2026-10-22', '2026-10-25']) saveLogEntry(d, { pms: 1 }, { storage });
    expect(logRange('2026-10-19', '2026-10-24', readLog(storage)).map((e) => e.day)).toEqual(['2026-10-20', '2026-10-22']);
    expect(logRange('bad', '2026-10-24', readLog(storage))).toEqual([]);
  });

  it('exposes six fields with mood and skin behind More', () => {
    expect(LOG_FIELDS.map((f) => f.id)).toEqual(['pain', 'flow', 'pms', 'sleep', 'mood', 'skin']);
    expect(LOG_FIELDS.filter((f) => f.primary).map((f) => f.id)).toEqual(['pain', 'flow', 'pms', 'sleep']);
  });

  it('survives blocked storage', () => {
    const storage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readLog(storage)).toEqual({});
    expect(() => saveLogEntry('2026-10-24', { pain: 1 }, { storage })).not.toThrow();
    expect(readLog(storage)['2026-10-24'].pain).toBe(1); // kept for this session
  });
});

describe('migration from the old check-in', () => {
  it('brings sleep, mood and skin in once and leaves the old key untouched', () => {
    const old = JSON.stringify({ '2026-10-01': { sleep: 1, mood: 2, skin: 3 }, '2026-10-02': { sleep: 2 }, junk: { sleep: 1 } });
    const storage = mem({ [LEGACY_CHECKIN_KEY]: old });
    const log = readLog(storage);
    expect(log['2026-10-01']).toMatchObject({ sleep: 1, mood: 2, skin: 3, pain: null, flow: null });
    expect(log['2026-10-02'].sleep).toBe(2);
    expect(Object.keys(log)).toHaveLength(2);
    expect(storage.raw.get(LEGACY_CHECKIN_KEY)).toBe(old);
    // A later edit is newer than the migrated value; a second read doesn't re-import over it.
    saveLogEntry('2026-10-01', { sleep: 3 }, { storage, now: at('2026-10-05T00:00:00Z') });
    expect(readLog(storage)['2026-10-01'].sleep).toBe(3);
  });

  it('migrated days upload once she signs in', () => {
    const storage = mem({ [LEGACY_CHECKIN_KEY]: JSON.stringify({ '2026-10-01': { sleep: 1 } }) });
    readLog(storage);
    expect(dirtyLogEntries(storage)).toEqual([]); // signed out: nothing to upload
    setLogOwner('user-a', storage);
    expect(dirtyLogEntries(storage).map((e) => e.day)).toEqual(['2026-10-01']);
  });
});

describe('owners', () => {
  it('signing in folds signed-out days into her account; signing out shows an empty log', () => {
    const storage = mem();
    saveLogEntry('2026-10-24', { pain: 1 }, { storage });
    expect(logOwner(storage)).toBe('device');
    setLogOwner('user-a', storage);
    expect(readLog(storage)['2026-10-24'].pain).toBe(1);
    setLogOwner(null, storage);
    expect(readLog(storage)).toEqual({});
    setLogOwner('user-b', storage);
    expect(readLog(storage)).toEqual({}); // another person on the same phone never sees hers
    setLogOwner('user-a', storage);
    expect(readLog(storage)['2026-10-24'].pain).toBe(1);
  });

  it('applyLogSync clears only unchanged uploaded days and merges the server', () => {
    const storage = mem();
    setLogOwner('u', storage);
    saveLogEntry('2026-10-23', { pain: 1 }, { storage, now: at('2026-10-23T08:00:00Z') });
    saveLogEntry('2026-10-24', { pain: 2 }, { storage, now: at('2026-10-24T08:00:00Z') });
    const uploaded = dirtyLogEntries(storage);
    saveLogEntry('2026-10-24', { pain: 3 }, { storage, now: at('2026-10-24T09:00:00Z') }); // changed while uploading
    applyLogSync({ owner: 'u', uploaded, server: [{ day: '2026-10-20', sleep: 2, updatedAt: '2026-10-20T10:00:00Z' }] }, storage);
    expect(dirtyLogEntries(storage).map((e) => e.day)).toEqual(['2026-10-24']);
    expect(readLog(storage)['2026-10-20'].sleep).toBe(2);
    expect(applyLogSync({ owner: 'someone-else', server: [] }, storage)).toBe(false);
  });
});

describe('mergeLogs', () => {
  it('newest stamp wins per field and day', () => {
    const local = { '2026-10-24': { day: '2026-10-24', pain: 2, sleep: 1, updatedAt: '2026-10-24T10:00:00Z', fieldAt: { pain: '2026-10-24T10:00:00Z', sleep: '2026-10-24T07:00:00Z' } } };
    const server = [{ day: '2026-10-24', pain: 1, sleep: 3, updatedAt: '2026-10-24T09:00:00Z', fieldAt: { pain: '2026-10-24T06:00:00Z', sleep: '2026-10-24T09:00:00Z' } }];
    const m = mergeLogs(local, server)['2026-10-24'];
    expect(m.pain).toBe(2);
    expect(m.sleep).toBe(3);
    expect(m.updatedAt).toBe('2026-10-24T10:00:00.000Z');
  });
  it('falls back to updatedAt without field stamps, keeps days from both sides', () => {
    const m = mergeLogs([{ day: '2026-10-01', mood: 1, updatedAt: '2026-10-01T01:00:00Z' }], [{ day: '2026-10-01', mood: 3, updatedAt: '2026-10-01T02:00:00Z' }, { day: '2026-10-02', skin: 2 }]);
    expect(m['2026-10-01'].mood).toBe(3);
    expect(m['2026-10-02'].skin).toBe(2);
  });
  it('drops invalid entries', () => {
    expect(mergeLogs([{ day: 'x' }, null], undefined)).toEqual({});
    expect(normalizeEntry({ day: '2026-02-30x' })).toBeNull();
  });
});

describe('week takeaway', () => {
  const today = '2026-10-24';
  const d = (n) => addDays(today, -n);
  it('says something calm only with at least 3 days', () => {
    expect(weekTakeaway({}, today)).toMatch(/A few taps a day/);
    expect(weekTakeaway({ [d(0)]: { day: d(0), sleep: 3 } }, today)).toMatch(/few more days/);
  });
  it('reads pain the right way round (lower is easier)', () => {
    const log = Object.fromEntries([[3, 3], [2, 3], [1, 1], [0, 1]].map(([n, v]) => [d(n), { day: d(n), pain: v }]));
    expect(weekTakeaway(log, today)).toBe('Pain has been lower lately.');
  });
  it('reads sleep the right way round (higher is easier)', () => {
    const log = Object.fromEntries([[3, 1], [2, 1], [1, 3], [0, 3]].map(([n, v]) => [d(n), { day: d(n), sleep: v }]));
    expect(weekTakeaway(log, today)).toBe('Sleep has been better lately.');
  });
  it('never uses cause or diagnosis words', () => {
    const log = Object.fromEntries([0, 1, 2].map((n) => [d(n), { day: d(n), pms: 2 }]));
    expect(weekTakeaway(log, today)).toBe('PMS has been steady this week.');
  });
});
