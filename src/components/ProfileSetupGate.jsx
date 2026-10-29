import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { getMyCommunityProfile } from '../utils/community/communityStoreCore.js';
import ProfileSetupStep from './ProfileSetupStep.jsx';

/**
 * Finish setting up the profile (founder, Oct 29): every signed-in account
 * without a username gets the photo + username step, whatever way she signed
 * in (email code, Google, Apple, or an older account). Shown once per device
 * until she finishes; "Finish later" hides it for this session only.
 */
const LATER_KEY = 'ayna_profile_setup_later_v1';
export default function ProfileSetupGate({ user, firstName = '', variant = 'web', blocked = false }) {
  const [need, setNeed] = useState(false);
  useEffect(() => {
    let live = true;
    setNeed(false);
    const supabase = getSupabaseClient();
    if (!user?.id || !supabase || user.is_anonymous) return undefined;
    try { if (sessionStorage.getItem(LATER_KEY) === user.id) return undefined; } catch { /* storage blocked */ }
    getMyCommunityProfile(supabase, user.id).then((p) => { if (live && !p?.username) setNeed(true); }).catch(() => {});
    return () => { live = false; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!need || blocked) return null;
  const done = () => { try { sessionStorage.setItem(LATER_KEY, user.id); } catch { /* storage blocked */ } setNeed(false); };
  return (
    <div className={`ay-psetup-gate is-${variant}`} role="dialog" aria-modal="true" aria-label="Set up your profile">
      <div className="ay-psetup-card ay-psetup-gate__card">
        <ProfileSetupStep supabase={getSupabaseClient()} user={user} firstName={firstName || user?.user_metadata?.first_name || ''} onDone={done} allowLater />
      </div>
    </div>
  );
}
