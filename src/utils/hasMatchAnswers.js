import { getSelectedNeeds } from '../data/catalog.js';

/**
 * Does she have answers to match against? The same source as For you: any
 * need the engine reads from her quiz (signed out too), or the older
 * frustrations / a health import. Used by the website's "Best match" sort
 * (QA round 2: it asked for the quiz although For you knew her answers).
 */
export function hasMatchAnswers({ quizResults = null, healthProfile = null, hasQuizFrustrations = false, hasHealthImport = false } = {}) {
  if (hasQuizFrustrations || hasHealthImport) return true;
  if (!quizResults) return false;
  try { return getSelectedNeeds(quizResults, healthProfile).length > 0; } catch { return false; }
}
