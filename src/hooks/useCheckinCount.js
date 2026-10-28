import { useEffect, useState } from 'react';
import { countMonthlyCheckins } from '../utils/monthlyCheckinStore.js';

const TIMEOUT_MS = 6000;

/**
 * Her monthly check-in count and whether the lookup has finished.
 * `settled` turns true when the count arrives, when it can't be read, or
 * after 6 seconds, so a tile never shows a loading bar forever (P1-16).
 */
export function useCheckinCountStatus(userId) {
  const [state, setState] = useState({ userId: null, count: null, settled: false });
  useEffect(() => {
    if (!userId) return undefined;
    let live = true;
    const timer = setTimeout(() => { if (live) setState((st) => (st.userId === userId && st.settled ? st : { userId, count: null, settled: true })); }, TIMEOUT_MS);
    countMonthlyCheckins()
      .then((count) => { if (live) setState({ userId, count, settled: true }); })
      .catch(() => { if (live) setState({ userId, count: null, settled: true }); });
    return () => { live = false; clearTimeout(timer); };
  }, [userId]);
  return state.userId === userId ? state : { userId, count: null, settled: false };
}

/** Real count of her monthly check-ins (null while loading or when unknown). */
export default function useCheckinCount(userId) {
  return useCheckinCountStatus(userId).count;
}
