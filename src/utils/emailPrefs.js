// Email settings: which notification emails someone wants (see the
// "ayna notification emails" doc). Stored per account in
// public.email_preferences (supabase/migrations/20261017120000_email_preferences.sql).
// Account emails (sign-in, password, data export, deletion) always send and
// are not listed here.

export const EMAIL_GROUPS = [
  { id: 'safety', label: 'Safety alerts', help: 'A product on your shelf is recalled or gets a new warning. Sent right away.', freq: false },
  { id: 'community', label: 'Community activity', help: 'New followers, comments, replies, friend requests, recommendations and likes on your posts.', freq: true },
  { id: 'announcements', label: 'ayna announcements', help: 'News from the ayna team: events, Q&As, giveaways and new features.', freq: false },
  { id: 'ecosystem', label: 'Your ecosystem', help: 'New matches for your needs, a read picked for you, and when a product you suggested is added.', freq: true },
  { id: 'partners', label: 'Partner news', help: 'Rare news from brands ayna partners with. Never changes your matches.', freq: false },
  { id: 'reminders', label: 'Reminders', help: 'Finish your quiz, or what is new after a while away.', freq: false },
];

export const EMAIL_DEFAULTS = {
  safety: true,
  community: true,
  announcements: true,
  ecosystem: true,
  partners: false,
  reminders: true,
  communityFreq: 'weekly',
  ecosystemFreq: 'weekly',
};

const FREQS = new Set(['weekly', 'instant']);

/** Defaults filled in, unknown keys and bad values dropped. */
export function normalizeEmailPrefs(raw) {
  const out = { ...EMAIL_DEFAULTS };
  const src = raw && typeof raw === 'object' ? raw : {};
  for (const g of EMAIL_GROUPS) if (typeof src[g.id] === 'boolean') out[g.id] = src[g.id];
  for (const k of ['communityFreq', 'ecosystemFreq']) if (FREQS.has(src[k])) out[k] = src[k];
  return out;
}

export async function loadEmailPrefs(supabase, userId) {
  if (!supabase || !userId) return { prefs: normalizeEmailPrefs(null), unsubscribedAll: false, available: false };
  const { data, error } = await supabase.from('email_preferences').select('prefs, unsubscribed_all').eq('user_id', userId).maybeSingle();
  if (error) return { prefs: normalizeEmailPrefs(null), unsubscribedAll: false, available: false, error };
  return { prefs: normalizeEmailPrefs(data?.prefs), unsubscribedAll: Boolean(data?.unsubscribed_all), available: true };
}

export async function saveEmailPrefs(supabase, userId, prefs, unsubscribedAll) {
  if (!supabase || !userId) throw new Error('Sign in to change email settings.');
  const row = { user_id: userId, prefs: normalizeEmailPrefs(prefs), unsubscribed_all: Boolean(unsubscribedAll), updated_at: new Date().toISOString() };
  const { error } = await supabase.from('email_preferences').upsert(row, { onConflict: 'user_id' });
  if (error) throw error;
  return row;
}
