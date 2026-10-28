import { useCallback, useEffect, useState } from 'react';
import { listUserTopics } from '../../../utils/community/userTopics.js';

/**
 * Is the topics migration in, and which topics is she in?
 * available stays false until community_feed_topics answers, so screens
 * show only "Suggest a topic" before the migration runs.
 */
export function useUserTopics(supabase, user) {
  const [state, setState] = useState({ available: false, checked: false, mine: [] });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    (async () => {
      if (user) {
        const res = await listUserTopics(supabase, { section: 'mine', limit: 50 });
        if (active) setState({ available: res.available, checked: true, mine: res.rows });
      } else {
        const res = await listUserTopics(supabase, { section: 'browse', limit: 1 });
        if (active) setState({ available: res.available, checked: true, mine: [] });
      }
    })().catch(() => { if (active) setState((s) => ({ ...s, checked: true })); });
    return () => { active = false; };
  }, [supabase, user, tick]);
  return { ...state, reload };
}
