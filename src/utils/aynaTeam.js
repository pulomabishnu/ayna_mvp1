// The ayna team: who can post Announcements and who gets a verified badge.
// Keyed by the account's sign-in email (lowercase). The database enforces the
// same list (supabase/migrations/*_community_announcements.sql,
// community_team_members), so editing only this file never grants posting.
//
// Only puloma@aynahealth.co is confirmed in this repo (privacy policy, terms).
// TODO(team): confirm Ameera's and Eliz's exact @aynahealth.co sign-in emails.
// The two placeholders below follow the firstname@aynahealth.co pattern and
// must be checked before launch (here AND in the migration seed).
export const AYNA_TEAM = {
  'ameera@aynahealth.co': { firstName: 'Ameera', title: 'CMO, ayna', confirmed: false }, // TODO(team): confirm email
  'puloma@aynahealth.co': { firstName: 'Puloma', title: 'CEO, ayna', confirmed: true },
  'eliz@aynahealth.co': { firstName: 'Eliz', title: 'COO, ayna', confirmed: false }, // TODO(team): confirm email
};

export const AYNA_TEAM_DOMAIN = 'aynahealth.co';

export function teamMemberForEmail(email) {
  const key = String(email || '').trim().toLowerCase();
  if (!key) return null;
  const member = AYNA_TEAM[key];
  return member ? { email: key, ...member } : null;
}

/** Can this signed-in user post Announcements? (UI gate; RLS is the real gate.) */
export function canPostAnnouncements(user) {
  return Boolean(teamMemberForEmail(user?.email));
}
