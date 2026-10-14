// The ayna team. Two separate concepts:
//   * verified team member: shows the check + title ("CMO, ayna") next to the
//     account's name everywhere in Community. All three founders.
//   * admin: may create/edit/publish/delete Announcements. ONLY Puloma and
//     Eliz (the founder's current final rule, 2026-10-13). Ameera keeps her
//     verified "CMO, ayna" badge but cannot write announcements.
//
// Keyed by the account's confirmed sign-in email (lowercase). This file only
// gates the UI; the database enforces the same split
// (supabase/migrations/20261013120000_community_announcements.sql,
// community_team_members.is_admin + RLS), so editing this file, or anything a
// user can change about their own account (user_metadata included), never
// grants posting.
//
// All three sign-in emails confirmed by Ameera on 2026-10-13.
export const AYNA_TEAM = {
  'ameera@aynahealth.co': { firstName: 'Ameera', title: 'CMO, ayna', admin: false, confirmed: true },
  'puloma@aynahealth.co': { firstName: 'Puloma', title: 'CEO, ayna', admin: true, confirmed: true },
  'eliz@aynahealth.co': { firstName: 'Eliz', title: 'COO, ayna', admin: true, confirmed: true },
};

export const AYNA_TEAM_DOMAIN = 'aynahealth.co';

export function teamMemberForEmail(email) {
  const key = String(email || '').trim().toLowerCase();
  if (!key) return null;
  const member = AYNA_TEAM[key];
  return member ? { email: key, ...member } : null;
}

/** Verified team account (badge), not necessarily an admin. */
export function isVerifiedTeamMember(user) {
  return Boolean(teamMemberForEmail(user?.email));
}

/** Admin: may write Announcements. Puloma and Eliz only. */
export function isAynaAdmin(user) {
  return Boolean(teamMemberForEmail(user?.email)?.admin);
}

/** Can this signed-in user post Announcements? (UI gate; RLS is the real gate.) */
export function canPostAnnouncements(user) {
  return isAynaAdmin(user);
}
