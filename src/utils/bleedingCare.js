import { getMatchCareFlags, fitsHerProfile, getProductMatchDetailsForProduct } from '../data/products.js';
import { isBleedingEvaluation } from './matchDisplay.js';

// Bleeding after menopause (founder, Oct 24), for surfaces outside Today and
// the product page (the quiz reveal on web and app). Same engine path: the
// profile note is the engine's own period_need_vs_stage contradiction, and the
// title is the one Today's care item uses (health/decisionEngine.js).
export const BLEEDING_CARE_TITLE = 'Get bleeding after menopause checked';

/** { title, text, source } when her answers trigger the evaluation message, else null. */
export function bleedingCareNote(answers, healthProfile = null, opts = {}) {
  if (!answers) return null;
  try {
    const note = (getMatchCareFlags(answers, healthProfile, opts).notes || []).find((n) => n.code === 'period_need_vs_stage');
    return note?.text ? { title: BLEEDING_CARE_TITLE, text: note.text, source: note.source || null } : null;
  } catch {
    return null;
  }
}

/**
 * Can this product be shown as a pick for her? Not when the engine sends it to
 * bleeding evaluation (no products for that bleeding, never a percent) or it
 * does not fit her profile at all (fitsHerProfile: period products after
 * menopause, exclusions, "Not for me"). True without answers.
 */
export function showableAsPick(product, answers, healthProfile = null, opts = {}) {
  if (!product || !answers) return Boolean(product);
  try {
    if (isBleedingEvaluation(getProductMatchDetailsForProduct(product, answers, healthProfile, opts))) return false;
    return fitsHerProfile(product, answers, healthProfile, opts);
  } catch {
    return true;
  }
}
