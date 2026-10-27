import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { getMyCommunityProfile } from '../utils/community/communityStore.js';
import { publicMediaUrl } from '../utils/community/imageUpload.js';

/** Fired (window event) after she changes her Community photo, so the header updates. */
export const AVATAR_CHANGED_EVENT = 'ayna:avatar-changed';

/**
 * Her profile photo for the round profile button (founder, Oct 26 23:38:
 * "your pfp should be in the profile icon at the top"). The photo is her
 * Community profile's avatar_url, the same one You and Community show.
 * Returns '' when signed out, when she has no photo, or when it fails to load.
 */
export default function useMyAvatarUrl(userId) {
  const [state, setState] = useState({ userId: null, url: '' });
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return undefined;
    let live = true;
    const load = async () => {
      const profile = await getMyCommunityProfile(supabase, userId).catch(() => null);
      if (live) setState({ userId, url: (profile?.avatar_url && publicMediaUrl(profile.avatar_url)) || '' });
    };
    load();
    const onChange = () => { load(); };
    window.addEventListener(AVATAR_CHANGED_EVENT, onChange);
    return () => { live = false; window.removeEventListener(AVATAR_CHANGED_EVENT, onChange); };
  }, [userId]);
  return state.userId === userId ? state.url : '';
}
