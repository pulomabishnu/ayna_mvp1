/**
 * Client mirror of public.community_username_problem (supabase/community.sql)
 * for instant feedback. The database trigger is the authority — keep the two
 * lists in sync.
 */
export const RESERVED_USERNAMES = [
  'ayna', 'aynahealth', 'admin', 'administrator', 'root', 'system', 'support', 'help', 'helpdesk', 'mod', 'moderator',
  'moderators', 'staff', 'team', 'official', 'security', 'privacy', 'legal', 'abuse', 'report', 'reports', 'anonymous',
  'anon', 'guest', 'null', 'undefined', 'me', 'you', 'settings', 'community', 'search', 'notifications', 'post', 'posts',
  'u', 'playlist', 'playlists', 'rec', 'api', 'www', 'mail', 'billing', 'account', 'login', 'signup', 'verified',
  'doctor', 'doctors', 'dr', 'md', 'do', 'rn', 'np', 'pa', 'nurse', 'obgyn', 'ob_gyn', 'gyn', 'gynecologist', 'physician',
  'clinician', 'midwife', 'therapist', 'pharmacist', 'dietitian', 'nutritionist', 'medic', 'fda', 'cdc', 'who', 'nih',
];
const RESERVED = new Set(RESERVED_USERNAMES);

export const USERNAME_MESSAGES = {
  format: '3–24 lowercase letters, numbers, dots or underscores — not at the start or end, no doubles.',
  reserved: 'That username is reserved.',
  clinician: "Usernames can't suggest you're a doctor or clinician.",
  abuse: "That username isn't allowed.",
};

/** Returns null when fine, else 'format' | 'reserved' | 'clinician' | 'abuse'. */
export function usernameProblem(u) {
  const name = String(u || '');
  if (!/^[a-z0-9_.]{3,24}$/.test(name)) return 'format';
  if (/^[._]|[._]$/.test(name) || /[._]{2}/.test(name)) return 'format';
  if (RESERVED.has(name)) return 'reserved';
  const bare = name.replace(/[._0-9]/g, '');
  if (/^ayna/.test(bare) || /(admin|moderator|support|official|verified)/.test(bare)) return 'reserved';
  if (/^(dr|doc|doctor)[._]/.test(name) || /[._](md|do|rn|np|dnp|phd|obgyn)$/.test(name)
    || /(doctor|physician|clinician|obgyn|gynecolog|midwife|pharmacist|dietitian|nurse)/.test(bare)) return 'clinician';
  if (/(fuck|shit|cunt|bitch|whore|slut|nigg|faggot|retard|rapist|nazi|porn)/.test(bare)) return 'abuse';
  return null;
}

export function normalizeUsernameInput(raw) {
  return String(raw || '').toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 24);
}

export function suggestUsername(name) {
  const base = String(name || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '').slice(0, 16);
  const stem = base.length >= 3 && !usernameProblem(base) ? base : 'member';
  return `${stem}${Math.floor(100 + Math.random() * 900)}`;
}
