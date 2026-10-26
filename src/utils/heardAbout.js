// "Where did you hear about us?", asked once right after sign-up, optional
// (HeardAboutPrompt.jsx; onboarding audit, Oct 25). Single choice. Saved in Supabase auth user
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

/** The label string main's admin reviews (api/reviews-admin.js) read from heard_about_us. */
export function heardAboutUsLabel(value, otherText = '') {
  const option = HEARD_ABOUT_OPTIONS.find((o) => o.value === value);
  if (!option) return '';
  const other = String(otherText || '').trim().replace(/\s+/g, ' ').slice(0, HEARD_ABOUT_OTHER_MAX);
  return value === 'other' && other ? `Other: ${other}` : option.label;
}
