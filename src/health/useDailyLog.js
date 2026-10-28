/**
 * React hook for the daily log card: local first, synced when signed in.
 *
 * saveState: 'idle' | 'saved_device' (signed out: kept on this phone or
 * computer) | 'saving' | 'saved' (on her account) | 'pending' (kept here,
 * uploads when back online or once syncing is switched on).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { readLog, saveLogEntry, setLogOwner } from './dailyLog.js';
import { setTriesOwner } from './outcomes.js';
import { syncUserData } from './userDataSync.js';

const SYNC_DELAY_MS = 1200;

export function useDailyLog(userId = null) {
  const [log, setLog] = useState(() => { setLogOwner(userId); setTriesOwner(userId); return readLog(); });
  const [saveState, setSaveState] = useState('idle');
  // Sign-in or sign-out: switch whose log this device shows (adjusting state
  // during render, React's pattern for state that follows a prop).
  const [ownerSeen, setOwnerSeen] = useState(userId);
  if (ownerSeen !== userId) {
    setLogOwner(userId);
    setTriesOwner(userId);
    setOwnerSeen(userId);
    setLog(readLog());
  }
  const timer = useRef(null);
  const touched = useRef(false);

  const runSync = useCallback(async (force = false) => {
    if (!userId) return;
    const { status } = await syncUserData({ userId, force });
    setLog(readLog());
    if (!touched.current) return;
    setSaveState(status === 'synced' ? 'saved' : status === 'signed_out' ? 'saved_device' : 'pending');
  }, [userId]);

  // First sync on sign-in; again when the connection comes back.
  useEffect(() => {
    if (!userId) return undefined;
    Promise.resolve().then(() => runSync());
    const online = () => runSync(true);
    globalThis.addEventListener?.('online', online);
    return () => {
      globalThis.removeEventListener?.('online', online);
      clearTimeout(timer.current);
    };
  }, [userId, runSync]);

  const save = useCallback((day, patch) => {
    saveLogEntry(day, patch);
    setLog(readLog());
    touched.current = true;
    if (!userId) { setSaveState('saved_device'); return; }
    setSaveState('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => runSync(true), SYNC_DELAY_MS);
  }, [userId, runSync]);

  return { log, save, saveState };
}
