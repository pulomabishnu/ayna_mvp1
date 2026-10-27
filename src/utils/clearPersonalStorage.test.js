// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { clearPersonalStorage, OWNED_KEYS } from './clearPersonalStorage.js';
import { readLog, saveLogEntry, setLogOwner, dirtyLogEntries } from '../health/dailyLog.js';
import { readSavedReminders, setSavedRemindersOwner } from './savedReminders.js';
import { readGuide, saveGuide } from '../mobile/utils/aynaGuide.js';
import { draftKey } from './community/composerDraft.js';

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

describe('sign-out keeps her on-device data, hidden from the next person', () => {
  it('keeps every per-account store and composer drafts, drops guest drafts and other personal keys', () => {
    for (const k of [...OWNED_KEYS, 'ayna_guide_v1']) localStorage.setItem(k, JSON.stringify({ v: 1, owner: 'user-a', buckets: { 'user-a': { items: { x: { id: 'x' } }, dirty: ['x'] } } }));
    localStorage.setItem(draftKey('web', 'user-a', 'post'), '{"text":"half written"}');
    localStorage.setItem(draftKey('web', null, 'post'), '{"text":"guest"}');
    localStorage.setItem('ayna_zip_v1', '10026');
    clearPersonalStorage();
    for (const k of OWNED_KEYS) {
      const v = JSON.parse(localStorage.getItem(k));
      expect(v.buckets['user-a'].dirty).toEqual(['x']);
      expect(v.owner).toBe('device');
    }
    expect(localStorage.getItem('ayna_guide_v1')).not.toBeNull();
    expect(localStorage.getItem(draftKey('web', 'user-a', 'post'))).not.toBeNull();
    expect(localStorage.getItem(draftKey('web', null, 'post'))).toBeNull();
    expect(localStorage.getItem('ayna_zip_v1')).toBeNull();
  });

  it('an unsynced daily log entry survives sign-out, is not shown to another account, and is back (still unsynced) for her', () => {
    setLogOwner('user-a');
    saveLogEntry('2026-10-24', { pain: 2 });
    expect(dirtyLogEntries()).toHaveLength(1);
    clearPersonalStorage();
    // Signed out: nothing of hers shows.
    expect(Object.keys(readLog())).toEqual([]);
    // Someone else signs in on this computer.
    setLogOwner('user-b');
    expect(Object.keys(readLog())).toEqual([]);
    expect(dirtyLogEntries()).toHaveLength(0);
    // She signs back in: her entry is there and still queued to upload.
    setLogOwner('user-a');
    expect(Object.keys(readLog())).toEqual(['2026-10-24']);
    expect(dirtyLogEntries()).toHaveLength(1);
  });

  it('saved reminders and her guide are not readable by another account', () => {
    setSavedRemindersOwner('user-a');
    localStorage.setItem('ayna_saved_reminders_v1', JSON.stringify({ v: 1, owner: 'user-a', buckets: { 'user-a': { items: { p1: { id: 'p1', name: 'Pads', at: '2026-11-01' } }, dirty: [] } } }));
    saveGuide('user-a', { memories: [{ id: 'm', text: 'mine', added: '2026-10-24' }], trials: [] });
    clearPersonalStorage();
    setSavedRemindersOwner('user-b');
    expect(readSavedReminders()).toEqual([]);
    expect(readGuide('user-b').memories || []).toEqual([]);
    setSavedRemindersOwner('user-a');
    expect(readSavedReminders().map((r) => r.id)).toEqual(['p1']);
    expect(readGuide('user-a').memories.map((m) => m.text)).toEqual(['mine']);
  });
});
