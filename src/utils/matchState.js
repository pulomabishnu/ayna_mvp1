// What a quick product view (the app's product sheet, a Rundown product card)
// says about her match, from the one engine. Founder decision 3 (Oct 24
// night): a product held back for safety shows NO percent anywhere, only
// "Safety hold · Match unavailable" with what is missing. Never 0%.
import { getProductMatchDetailsForProduct } from '../data/products.js';
import { matchText } from './matchDisplay.js';
import { whyLine } from './whyLine.js';

export const SAFETY_HOLD = 'Safety hold · Match unavailable';

/**
 * @returns {{ kind: 'held', label: string, missing: string[] }
 *   | { kind: 'scored', percent: number, label: string, why: string }
 *   | { kind: 'none' }}
 */
export function matchStateFromDetails(product, details) {
  if (!details) return { kind: 'none' };
  if (details.eligibility === 'restricted' || details.restricted === true) {
    return { kind: 'held', label: SAFETY_HOLD, missing: (details.missingSafetyText || []).filter(Boolean).slice(0, 3), productInfo: (details.missingProductInfoText || []).filter(Boolean).slice(0, 2) };
  }
  if (details.matchStatus !== 'scored' || details.eligible === false || !Number.isFinite(details.percent) || details.percent <= 0) return { kind: 'none' };
  const percent = Math.round(details.percent);
  return { kind: 'scored', percent, label: matchText(percent), why: whyLine(product, details) || '' };
}

/** Same, straight from her answers and the app's match inputs (no profile: none). */
export function matchState(product, quizAnswers, matchOpts) {
  if (!product || !quizAnswers) return { kind: 'none' };
  let details = null;
  try { details = getProductMatchDetailsForProduct(product, quizAnswers, null, matchOpts || undefined); } catch { details = null; }
  return matchStateFromDetails(product, details);
}

const andList = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** The hold reason and its fix, in plain words. */
export function holdLine(state) {
  if (state?.kind !== 'held') return '';
  if (state.missing?.length) return `We need one more safety detail: ${andList(state.missing)}. Add it in your health profile and your match shows here.`;
  if (state.productInfo?.length) return `We are still checking ${andList(state.productInfo)}.`;
  return 'We need one more safety detail before we can check this for you.';
}
