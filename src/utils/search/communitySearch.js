import { analyzeSearch } from './index.js';

/**
 * Community search with spelling tolerance: searches what was typed and, when
 * the engine is confident a word was misspelled ("endomitriosis"), the
 * corrected text too, then merges. Names and handles are never rewritten:
 * the literal search always runs, the corrected one only adds results.
 */
export async function searchCommunityTolerant(searchFn, supabase, query, limit) {
  const literal = await searchFn(supabase, query, limit);
  let fixed = null;
  try {
    const a = analyzeSearch(query);
    const confident = a.didYouMean && a.tokens.every((t) => t.status !== 'corrected' || (t.confidence || 0) >= 0.8);
    if (confident && a.didYouMean.toLowerCase() !== String(query).trim().toLowerCase()) fixed = await searchFn(supabase, a.didYouMean, limit);
  } catch { fixed = null; }
  if (!fixed) return literal;
  const merge = (a = [], b = [], key) => {
    const seen = new Set(a.map((x) => x?.[key]));
    return [...a, ...b.filter((x) => !seen.has(x?.[key]))];
  };
  return {
    people: merge(literal.people, fixed.people, 'user_id'),
    posts: merge(literal.posts, fixed.posts, 'id'),
    playlists: merge(literal.playlists, fixed.playlists, 'id'),
  };
}
