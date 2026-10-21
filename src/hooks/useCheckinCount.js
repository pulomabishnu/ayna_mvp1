import { useEffect, useState } from 'react';
import { countMonthlyCheckins } from '../utils/monthlyCheckinStore.js';

/** Real count of her monthly check-ins (null while loading or when unknown). */
export default function useCheckinCount(userId) {
  const [state, setState] = useState({ userId: null, count: null });
  useEffect(() => {
    if (!userId) return undefined;
    let live = true;
    countMonthlyCheckins().then((count) => { if (live) setState({ userId, count }); });
    return () => { live = false; };
  }, [userId]);
  return state.userId === userId ? state.count : null;
}
