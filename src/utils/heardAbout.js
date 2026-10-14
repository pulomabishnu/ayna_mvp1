// "Where did you hear about us?" on account creation (website AuthGate and the
// app's SigninScreen). Required on the create-account forms (2026-10 spec), single choice. Saved in Supabase auth user
// metadata next to first_name and the consent fields, so no table or
// migration is needed:
//   heard_about        one of HEARD_ABOUT_OPTIONS[].value
//   heard_about_other  short free text, only when heard_about === 'other'
export const HEARD_ABOUT_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'friend_family', label: 'Friend or family' },
  { value: 'clinician', label: 'Clinician' },
  { value: 'search', label: 'Search' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

export const HEARD_ABOUT_OTHER_MAX = 60;

/** Metadata fields for a choice; {} when nothing was picked. */
export function heardAboutMetadata(value, otherText = '') {
  if (!HEARD_ABOUT_OPTIONS.some((o) => o.value === value)) return {};
  const meta = { heard_about: value };
  const other = String(otherText || '').trim().replace(/\s+/g, ' ').slice(0, HEARD_ABOUT_OTHER_MAX);
  if (value === 'other' && other) meta.heard_about_other = other;
  return meta;
}
