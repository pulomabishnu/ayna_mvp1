import { useEffect, useMemo, useState } from 'react';
import { listTeamBadges } from '../../utils/community/announcementsStore.js';
import { teamMemberForEmail } from '../../utils/aynaTeam.js';

/**
 * Map<user_id, title> of verified team accounts. Loaded once from the
 * community_team_badges() RPC (empty until the migration runs), plus the
 * signed-in user when their own email is on the team list.
 */
export function useTeamBadges(supabase, user) {
  const [badges, setBadges] = useState(() => new Map());
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    listTeamBadges(supabase).then((m) => { if (active) setBadges(m); });
    return () => { active = false; };
  }, [supabase]);
  const ownTitle = teamMemberForEmail(user?.email)?.title || null;
  const userId = user?.id || null;
  return useMemo(() => {
    if (!ownTitle || !userId || badges.get(userId) === ownTitle) return badges;
    return new Map(badges).set(userId, ownTitle);
  }, [badges, ownTitle, userId]);
}
