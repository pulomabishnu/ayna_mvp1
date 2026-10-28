import { isGeneratedPick } from '../../utils/ecosystemStore.js';

/**
 * Explore's For you: her matches, minus only what she added herself. Picks
 * ayna built from her answers are suggestions, not hers, so they still count
 * (QA round 2: For you was empty because the auto-built ecosystem took them all).
 */
export function forYouPicks(seeded = [], myProducts = [], limit = 6) {
  const own = new Set((myProducts || []).filter((p) => p?.id && !isGeneratedPick(p)).map((p) => p.id));
  return (seeded || []).filter((p) => p?.id && !own.has(p.id)).slice(0, limit);
}
