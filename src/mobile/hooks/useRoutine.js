import { useCallback, useState } from 'react';

// Routine timing can reveal medication/supplement use and health patterns.
// Keep it in memory only until there is a verified account-scoped backend
// field/table for it. Scrub the legacy localStorage copy on first load.
const ROUTINE_KEY = 'ayna_routine_v1';

export const ROUTINE_BUCKETS = ['morning', 'afternoon', 'evening', 'night', 'monthly', 'yearly'];

export const ROUTINE_BUCKET_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function loadRoutine() {
  try { localStorage.removeItem(ROUTINE_KEY); } catch { /* storage unavailable */ }
  return {};
}

export function useRoutine() {
  const [routineMap, setRoutineMap] = useState(loadRoutine);

  const setProductBucket = useCallback((productId, bucket) => {
    if (!productId || !ROUTINE_BUCKETS.includes(bucket)) return;
    setRoutineMap((prev) => ({ ...prev, [productId]: bucket }));
  }, []);

  const removeFromRoutine = useCallback((productId) => {
    setRoutineMap((prev) => {
      if (!(productId in prev)) return prev;
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }, []);

  const resetRoutine = useCallback(() => setRoutineMap({}), []);

  return { routineMap, setProductBucket, removeFromRoutine, resetRoutine };
}
