import { useCallback, useState } from 'react';

// Persists which routine bucket (if any) each ecosystem product has been
// manually sorted into. There's no real dosing/timing data anywhere in the
// catalog, so — unlike the recommendation logic elsewhere in the app — this
// is deliberately NOT computed: the user tells us their own routine instead
// of the app guessing one. One bucket per product keeps the mental model
// simple ("where does this live in your routine"); mirrors the localStorage
// pattern already used by useSavedProducts/useThemeMode.
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
  try {
    const raw = localStorage.getItem(ROUTINE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function persistRoutine(map) {
  try {
    localStorage.setItem(ROUTINE_KEY, JSON.stringify(map));
  } catch {
    // Best-effort — same as savedProductsStore, a full/unavailable
    // localStorage shouldn't crash the screen.
  }
}

export function useRoutine() {
  const [routineMap, setRoutineMap] = useState(loadRoutine);

  const setProductBucket = useCallback((productId, bucket) => {
    if (!productId || !ROUTINE_BUCKETS.includes(bucket)) return;
    setRoutineMap((prev) => {
      const next = { ...prev, [productId]: bucket };
      persistRoutine(next);
      return next;
    });
  }, []);

  const removeFromRoutine = useCallback((productId) => {
    setRoutineMap((prev) => {
      if (!(productId in prev)) return prev;
      const next = { ...prev };
      delete next[productId];
      persistRoutine(next);
      return next;
    });
  }, []);

  return { routineMap, setProductBucket, removeFromRoutine };
}
