/**
 * Input rules for user-created Community topics. Runs in the browser (live
 * messages under each field) and again in api/community-topics.js before the
 * insert; the database trigger community_topic_text_problem is the last line.
 */
import { checkCommunityText } from '../communityRules.js';
import { COMMUNITY_TOPICS } from './topics.js';
import { checkTopicContrast, isTopicColor } from './topicContrast.js';

export const TOPIC_NAME_MIN = 3;
export const TOPIC_NAME_MAX = 40;
export const TOPIC_DESCRIPTION_MAX = 200;
export const TOPIC_VISIBILITY = ['public', 'friends', 'private'];
export const TOPIC_FONTS = ['serif', 'sans'];
export const COVER_PATH_RE = /^covers\/[0-9a-f-]{36}\.(jpg|jpeg|webp|png)$/;

// Plain words people see, per audience.
export const VISIBILITY_COPY = {
  public: { label: 'Public', hint: 'Anyone can find it, join and post. The ayna team checks it before it shows in Community.' },
  friends: { label: 'Friends', hint: 'Your friends can find it and join.' },
  private: { label: 'Invite only', hint: 'Hidden. People join with the invite link you share.' },
};

const LINK_RE = /(https?:\/\/|www\.|[a-z0-9-]+\.(com|co|net|org|io|app|me|ly|shop|store|link|xyz|info|us|uk|ca|au)(\b|\/))/i;
const AYNA_RE = /\b(ayna|aynahealth)\b|\b(official|verified|admins?|moderators?|mods)\b/i;
// A topic can be about doctors ("Doctor visits") but can't claim to be run by one.
const CLINICIAN_RES = [
  /\b(dr|md|rn|np|obgyn)\b/i,
  /\b(ask|by|from|with|led by|run by|hosted by)\s+(an?\s+|the\s+|your\s+|my\s+)?(doctors?|physicians?|clinicians?|gynecologists?|obgyns?|midwife|midwives|nurses?|pharmacists?|dietitians?)\b/i,
  /\b(doctors?|physicians?|clinicians?|gynecologists?|nurses?|midwife|midwives)[\s-]+(approved|answers?|advice|led|run|official)\b/i,
];

export const TOPIC_PROBLEMS = {
  short: `Use at least ${TOPIC_NAME_MIN} characters.`,
  long: `Keep it to ${TOPIC_NAME_MAX} characters.`,
  letters: 'Use some letters in the name.',
  link: 'Links aren’t allowed in topic names or descriptions.',
  impersonation: 'Topic names can’t suggest they’re run by ayna or the team.',
  clinician: 'Topic names can’t suggest a doctor or clinician runs them.',
  curated: 'That’s already an ayna topic. Find it under Topics.',
  description: `Keep the description to ${TOPIC_DESCRIPTION_MAX} characters.`,
};

// Database error codes (supabase/community_user_topics_2026-10-21.sql) -> plain words.
export const TOPIC_ERRORS = {
  community_topic_link: 'Links aren’t allowed in topic names or descriptions.',
  community_topic_rules: 'This breaks our community rules. Try other words.',
  community_topic_impersonation: 'Topic names can’t suggest they’re run by ayna or the team.',
  community_topic_clinician: 'Topic names can’t suggest a doctor or clinician runs them.',
  community_topic_contrast: 'That text colour is too hard to read on this cover.',
  community_topics_full: 'You can run up to 20 topics.',
  community_topic_unavailable: 'This topic isn’t available.',
  community_not_topic_owner: 'Only the topic’s owners can do that.',
  community_owner_cannot_leave: 'You run this topic. Delete it instead of leaving.',
  community_rate_limited: 'You can start 3 topics a day. Try again tomorrow.',
  community_guest_unavailable: 'Sign in to do that.',
  community_invite_invalid: 'That invite link doesn’t work anymore. Ask for a new one.',
};

const squash = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const CURATED = new Set(COMMUNITY_TOPICS.flatMap((t) => [squash(t.key), squash(t.label)]));

export function cleanTopicText(value, max) {
  if (typeof value !== 'string') return '';
  const noControl = [...value].filter((ch) => ch.charCodeAt(0) >= 32 || ch === '\n').join('');
  return noControl.replace(/\s+/g, ' ').trim().slice(0, max);
}

/** First problem with a topic name, or '' when it's fine. */
export function topicNameProblem(raw) {
  const name = cleanTopicText(raw, 200);
  if (name.length < TOPIC_NAME_MIN) return TOPIC_PROBLEMS.short;
  if (name.length > TOPIC_NAME_MAX) return TOPIC_PROBLEMS.long;
  if (!/[a-z]/i.test(name)) return TOPIC_PROBLEMS.letters;
  if (LINK_RE.test(name)) return TOPIC_PROBLEMS.link;
  const rules = checkCommunityText(name);
  if (rules.blocked) return rules.message;
  if (AYNA_RE.test(name)) return TOPIC_PROBLEMS.impersonation;
  if (CLINICIAN_RES.some((re) => re.test(name))) return TOPIC_PROBLEMS.clinician;
  if (CURATED.has(squash(name))) return TOPIC_PROBLEMS.curated;
  return '';
}

export function topicDescriptionProblem(raw) {
  const text = cleanTopicText(raw, 1000);
  if (!text) return '';
  if (text.length > TOPIC_DESCRIPTION_MAX) return TOPIC_PROBLEMS.description;
  if (LINK_RE.test(text)) return TOPIC_PROBLEMS.link;
  const rules = checkCommunityText(text);
  if (rules.blocked) return rules.message;
  if (AYNA_RE.test(text) && /\b(run|official|team|staff)\b/i.test(text)) return TOPIC_PROBLEMS.impersonation;
  return '';
}

/** "Living with PCOS!" -> "living-with-pcos-4f2k9a" (unique enough; the table has a unique index). */
export function topicSlug(name, suffix = Math.random().toString(36).slice(2, 8)) {
  const base = String(name || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/g, '') || 'topic';
  const tail = String(suffix || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'x';
  return `${base.length < 3 ? `${base}-topic` : base}-${tail}`;
}

/**
 * Validates a whole create/edit form. Returns { row } (database columns) or
 * { error, field }. `row` never carries status or created_by: the server sets those.
 */
export function validateTopicInput(input = {}) {
  const name = cleanTopicText(input.name, 200);
  const nameProblem = topicNameProblem(name);
  if (nameProblem) return { error: nameProblem, field: 'name' };
  const description = cleanTopicText(input.description, 1000);
  const descriptionProblem = topicDescriptionProblem(description);
  if (descriptionProblem) return { error: descriptionProblem, field: 'description' };
  const visibility = TOPIC_VISIBILITY.includes(input.visibility) ? input.visibility : 'public';
  const titleFont = TOPIC_FONTS.includes(input.titleFont) ? input.titleFont : 'serif';
  const coverImageUrl = input.coverImageUrl ? String(input.coverImageUrl) : null;
  if (coverImageUrl && !COVER_PATH_RE.test(coverImageUrl)) return { error: 'That photo didn’t finish uploading. Try again.', field: 'cover' };
  const coverColor = isTopicColor(input.coverColor) ? String(input.coverColor).toLowerCase() : '#ffedac';
  const textColor = String(input.textColor || '').toLowerCase();
  const contrast = checkTopicContrast({ textColor, coverColor, hasPhoto: Boolean(coverImageUrl) });
  if (!contrast.ok) return { error: contrast.reason, field: 'text' };
  return {
    row: {
      name,
      description: description || null,
      cover_image_url: coverImageUrl,
      cover_color: coverColor,
      title_font: titleFont,
      text_color: textColor,
      visibility,
      // Anonymous only applies to public topics (friends and invite-only
      // topics are shared by the person who made them).
      creator_anonymous: visibility === 'public' && Boolean(input.anonymous),
    },
  };
}
