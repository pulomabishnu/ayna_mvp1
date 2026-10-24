import { describe, expect, it, vi } from 'vitest';
import { syncUserData } from './userDataSync.js';
import { dirtyLogEntries, readLog, saveLogEntry } from './dailyLog.js';
import { createTry, dirtyTries, saveTry } from './outcomes.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };
const reply = (status, body) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });
const token = () => Promise.resolve('tok');

describe('syncUserData', () => {
  it('signed out: keeps everything on the device and calls nothing', async () => {
    const storage = mem();
    saveLogEntry('2026-10-24', { pain: 1 }, { storage });
    const fetchImpl = vi.fn();
    expect((await syncUserData({ userId: null, storage, fetchImpl, getToken: token })).status).toBe('signed_out');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(readLog(storage)['2026-10-24'].pain).toBe(1);
  });

  it('uploads changes, then merges what the server has', async () => {
    const storage = mem();
    saveLogEntry('2026-10-24', { pain: 2 }, { storage });
    saveTry(createTry({ kind: 'action', ref: 'Heat', startedDay: '2026-10-01' }), { storage });
    const fetchImpl = vi.fn((path, init) => (init.method === 'POST'
      ? reply(200, { ok: true })
      : reply(200, { entries: [{ day: '2026-10-20', sleep: 1, updatedAt: '2026-10-20T08:00:00Z' }], tries: [] })));
    expect((await syncUserData({ userId: 'u1', storage, fetchImpl, getToken: token })).status).toBe('synced');
    const post = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(post.entries.map((e) => e.day)).toEqual(['2026-10-24']);
    expect(post.tries).toHaveLength(1);
    expect(dirtyLogEntries(storage)).toEqual([]);
    expect(dirtyTries(storage)).toEqual([]);
    expect(readLog(storage)['2026-10-20'].sleep).toBe(1);
    expect(readLog(storage)['2026-10-24'].pain).toBe(2);
  });

  it('table not there yet: keeps local data, waits before trying again', async () => {
    const storage = mem();
    saveLogEntry('2026-10-24', { pms: 2 }, { storage });
    const fetchImpl = vi.fn(() => reply(503, { error: 'not_ready' }));
    const now = Date.parse('2026-10-24T12:00:00Z');
    expect((await syncUserData({ userId: 'u1', storage, fetchImpl, getToken: token, now })).status).toBe('not_ready');
    expect(dirtyLogEntries(storage)).toHaveLength(1);
    expect((await syncUserData({ userId: 'u1', storage, fetchImpl, getToken: token, now: now + 60000 })).status).toBe('waiting');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(readLog(storage)['2026-10-24'].pms).toBe(2);
  });

  it('offline: nothing lost', async () => {
    const storage = mem();
    saveLogEntry('2026-10-24', { sleep: 3 }, { storage });
    const fetchImpl = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    expect((await syncUserData({ userId: 'u1', storage, fetchImpl, getToken: token })).status).toBe('offline');
    expect(dirtyLogEntries(storage)).toHaveLength(1);
  });
});
