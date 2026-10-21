import { useEffect, useState } from 'react';
import { countMonthlyCheckins } from '../utils/monthlyCheckinStore.js';

// How many monthly check-ins she has done, for the You stat tile.
// Returns { count, status }: status 'loading' (skeleton), 'ok', or 'failed'
// when the request errors or has not answered after a few seconds, so the
// tile never sits on a skeleton forever (walkthrough P1-16).
const GIVE_UP_MS = 6000;

export default function useCheckinCount(userId) {
  const [state, setState] = useState({ userId: null, count: null, status: 'loading' });
  useEffect(() => {
    if (!userId) return undefined;
    let live = true;
    const timer = setTimeout(() => { if (live) setState((s) => (s.userId === userId && s.status === 'ok' ? s : { userId, count: null, status: 'failed' })); }, GIVE_UP_MS);
    countMonthlyCheckins()
      .then((count) => { if (live) setState({ userId, count, status: Number.isFinite(count) ? 'ok' : 'failed' }); })
      .catch(() => { if (live) setState({ userId, count: null, status: 'failed' }); })
      .finally(() => clearTimeout(timer));
    return () => { live = false; clearTimeout(timer); };
  }, [userId]);
  return state.userId === userId ? state : { count: null, status: 'loading' };
}

/** The tile's value: a skeleton while loading, a dash she can still tap when it failed. */
export function checkinTile({ count, status }, fmt = String) {
  if (status === 'loading') return { value: null };
  if (status === 'failed') return { value: '–', ariaValue: 'Unknown number of' };
  return { value: fmt(count) };
}
