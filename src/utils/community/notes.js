// Small pure helpers for the Community redesign (website + app).
// Relative times, the one highlighted member quote, prompt tiles and the
// share link. No components here, so they are easy to test.

import { relativeTime } from '../relativeTime.js';

/** "Just now", "5m ago", "Yesterday", "Oct 12": the one shared formatter (utils/relativeTime.js). */
export const relTime = relativeTime;

/** The full date for a tooltip / screen readers. */
export function fullTime(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
}

/**
 * Split a quote into the part we highlight and the rest: the whole thing when
 * it's short, else its first sentence, else the first ~80 characters on a
 * word boundary.
 */
export function splitHighlight(text) {
  const body = String(text || '').replace(/\s+/g, ' ').trim();
  if (body.length <= 90) return { lead: body, rest: '' };
  const m = /^(.{20,140}?[.!?])(\s|$)/.exec(body);
  if (m) return { lead: m[1], rest: body.slice(m[1].length).trim() };
  const cut = body.lastIndexOf(' ', 80);
  const at = cut > 30 ? cut : 80;
  return { lead: body.slice(0, at), rest: body.slice(at).trim() };
}

/**
 * The one member quote worth showing big: a real post or review other
 * members found helpful (2+), short enough to read at a glance. Null when
 * nothing qualifies, so the block simply doesn't render.
 */
export function pickMemberQuote(posts = [], { isBlocked = () => false, minHelpful = 2 } = {}) {
  const seen = new Set();
  const pool = (posts || []).filter((p) => {
    if (!p?.id || seen.has(p.id)) return false;
    seen.add(p.id);
    const len = String(p.body || '').trim().length;
    return (p.kind === 'post' || p.kind === 'review' || !p.kind)
      && (Number(p.helpful_count) || 0) >= minHelpful
      && len >= 24 && len <= 220
      && !isBlocked(p.author_id);
  });
  if (!pool.length) return null;
  pool.sort((a, b) => (Number(b.helpful_count) || 0) - (Number(a.helpful_count) || 0)
    || new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const post = pool[0];
  return { post, ...splitHighlight(post.body) };
}

/**
 * Prompt tiles that start a post. `starter` is text placed in the composer
 * (she edits or deletes it); a post that is only the starter counts as empty.
 */
export const PROMPTS = [
  { key: 'question', kind: 'question', title: 'Ask a question', hint: 'Answers from women who tried it', starter: '', tone: 'sky', icon: 'question' },
  { key: 'review', kind: 'review', title: 'Review a product', hint: 'Stars, and how it really went', starter: '', tone: 'pink', icon: 'star' },
  { key: 'unpopular', kind: 'post', title: 'Unpopular opinion', hint: 'Say the thing', starter: 'Unpopular opinion: ', tone: 'espresso', icon: 'spark' },
  { key: 'askme', kind: 'post', title: 'Ask me about', hint: 'Something you know a lot about', starter: 'Ask me about ', tone: 'butter', icon: 'hand' },
];

/** True when the composer holds nothing but an untouched prompt starter. */
export function isOnlyStarter(body, starter) {
  const b = String(body || '').trim();
  return !b || Boolean(starter && b === String(starter).trim());
}

/** A link to one post that works from the website and the app. */
export function postShareUrl(id) {
  if (!id) return '';
  let base = 'https://www.aynahealth.co';
  try {
    const native = window.Capacitor?.isNativePlatform?.();
    const host = window.location.hostname || '';
    if (!native && host && host !== 'aynahealth.co' && !host.endsWith('.aynahealth.co')) base = window.location.origin;
  } catch { /* no window: keep the public site */ }
  return `${base}/community/p/${encodeURIComponent(id)}`;
}

/**
 * Share a post: the system share sheet when there is one, else copy the link.
 * Resolves to 'shared' | 'copied' | 'dismissed' | 'failed'.
 */
export async function sharePost(post) {
  const url = postShareUrl(post?.id);
  if (!url) return 'failed';
  const text = post?.kind === 'question' ? 'A question on ayna Community' : post?.kind === 'review' ? 'A review on ayna Community' : 'A post on ayna Community';
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: 'ayna Community', text, url });
      return 'shared';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'dismissed';
  }
  try { await navigator.clipboard.writeText(url); return 'copied'; } catch { return 'failed'; }
}

/** A stable tone for a default avatar, from the name. */
export function avatarTone(name) {
  const s = String(name || 'ayna');
  const n = [...s].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ['pink', 'sky', 'butter'][n % 3];
}

/** Default-avatar tone class: 'anon' for anonymous, else a stable paper tone. */
// P1-22: one avatar style everywhere (website + app): the same pink paper
// circle with an espresso outline; initials for members, ayna's asterisk for
// anonymous posts. avatarTone stays for anything that still wants a tone.
export const faceTone = (name, anonymous) => (anonymous ? 'anon' : 'pink');

/** Apply a Helpful or Save toggle to a post object (optimistic update). */
export function applyToggle(post, kind, on) {
  if (!post) return post;
  if (kind === 'save') return { ...post, viewer_saved: on };
  const n = Number(post.helpful_count) || 0;
  const was = Boolean(post.viewer_found_helpful);
  if (was === on) return post;
  return { ...post, viewer_found_helpful: on, helpful_count: Math.max(0, n + (on ? 1 : -1)) };
}
