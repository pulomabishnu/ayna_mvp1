/**
 * One rule for every avatar on the site (G07): first + last initial when we
 * have both names, otherwise the first initial. Never derived from the email.
 */
export function avatarInitials(user, fallback = 'A') {
  const meta = user?.user_metadata || {};
  const first = String(meta.first_name || meta.given_name || '').trim();
  const last = String(meta.last_name || meta.family_name || '').trim();
  const full = String(meta.full_name || meta.name || '').trim();
  const parts = (first || last) ? [first, last].filter(Boolean) : full.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return fallback;
}

export default avatarInitials;
