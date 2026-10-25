import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { listFeedPosts, listFollowingIds } from '../../utils/community/communityStore.js';
import { topicLabel } from '../../utils/community/topics.js';
import { defaultTopicsFromQuiz } from '../utils/communityTopicFollows.js';

const STORAGE_KEY = 'ayna_community_topics_v1';
export const NEW_POST_DAYS = 7;

/** Her followed Community topics on this phone (same store as Community), else the ones from her profile. */
export function followedTopicsFor(ownerId, quizAnswers) {
  try {
    const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const saved = store?.[ownerId || 'guest']?.follows;
    if (Array.isArray(saved)) return saved.filter(Boolean).slice(0, 12);
  } catch { /* storage blocked */ }
  return defaultTopicsFromQuiz(quizAnswers);
}

const snippet = (text) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > 140 ? `${t.slice(0, 137).replace(/\s+\S*$/, '')}…` : t;
};

/**
 * Real public Community posts for the Daily Rundown's "New in Community"
 * card: from the last week, in her topics or by people she follows, never
 * her own, never inside a private group topic. Nothing when there are none
 * (signed out with no topics, offline, Community not reachable).
 * @returns {Array<{ id, title, topic, kind, isNew: true }>}
 */
export function pickRundownPosts(rows = [], { followedAuthorIds = [], now = Date.now() } = {}) {
  const since = now - NEW_POST_DAYS * 86400000;
  const seen = new Set();
  const authors = new Set(followedAuthorIds);
  return rows
    .filter((p) => p?.id && !seen.has(p.id) && seen.add(p.id))
    .filter((p) => !p.is_mine && !p.topic_id && String(p.body || '').trim().length >= 12)
    .filter((p) => { const t = Date.parse(p.created_at); return Number.isFinite(t) && t >= since && t <= now + 60000; })
    .sort((a, b) => (authors.has(b.author_id) ? 1 : 0) - (authors.has(a.author_id) ? 1 : 0) || Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 3)
    .map((p) => ({ id: p.id, title: snippet(p.body), topic: (p.topics || []).map(topicLabel).find(Boolean) || '', kind: p.kind || 'post', isNew: true }));
}

export function useRundownCommunity(userId, quizAnswers) {
  const [posts, setPosts] = useState([]);
  const topicsKey = followedTopicsFor(userId, quizAnswers).join(',');
  useEffect(() => {
    const supabase = getSupabaseClient();
    const topics = topicsKey ? topicsKey.split(',') : [];
    if (!supabase || (!topics.length && !userId)) return undefined;
    let live = true;
    (async () => {
      const following = userId ? await listFollowingIds(supabase, userId).catch(() => []) : [];
      const ids = (following || []).map((r) => (typeof r === 'string' ? r : r?.following_id || r?.id)).filter(Boolean);
      const [byTopic, byPeople] = await Promise.all([
        topics.length ? listFeedPosts(supabase, { topics, limit: 12 }).catch(() => []) : [],
        ids.length ? listFeedPosts(supabase, { authorIds: ids.slice(0, 50), limit: 6 }).catch(() => []) : [],
      ]);
      if (live) setPosts(pickRundownPosts([...(byPeople || []), ...(byTopic || [])], { followedAuthorIds: ids }));
    })().catch(() => { if (live) setPosts([]); });
    return () => { live = false; };
  }, [userId, topicsKey]);
  return posts;
}
