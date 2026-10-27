/**
 * Post card parts, shared by the app (CommunityScreen) and the website
 * (WebCommunity). Founder (Oct 27, 01:11): "make it easier to distinguish
 * different posts, it kinda just blends in". Each post is its own card:
 * author row, topic chip, a bold title, the body (3 lines in the feed),
 * a compact product row and the actions.
 *
 * Posts have no title field, so the title is the post's own first sentence
 * (her words, never made up). A post that is one short sentence is all title.
 */
import { topicLabel } from '../../utils/community/topics.js';

export const TITLE_MAX = 110;

/** { title, rest }: the first sentence as the title when it reads as one, the rest as the body. */
export function splitPostTitle(body) {
  const text = String(body || '').trim();
  if (!text) return { title: '', rest: '' };
  const firstLine = text.split(/\n/)[0].trim();
  // A first line that is short on its own (a heading she typed) is the title.
  if (firstLine !== text && firstLine.length <= TITLE_MAX && !/[,;:]$/.test(firstLine)) {
    return { title: firstLine, rest: text.slice(text.indexOf(firstLine) + firstLine.length).trim() };
  }
  // Otherwise the first sentence, when it ends cleanly and isn't too long.
  const m = text.match(/^(.{6,}?[.?!])(\s+|$)/s);
  if (m && m[1].length <= TITLE_MAX && !m[1].includes('\n')) {
    return { title: m[1].trim(), rest: text.slice(m[0].length).trim() };
  }
  if (text.length <= TITLE_MAX && !text.includes('\n')) return { title: text, rest: '' };
  return { title: '', rest: text };
}

/** The chip for the post's first topic, or null. */
export function postTopic(post) {
  const key = (Array.isArray(post?.topics) ? post.topics : []).find(Boolean);
  if (!key) return null;
  const label = topicLabel(key);
  return label ? { key, label: label.charAt(0).toUpperCase() + label.slice(1) } : null;
}
