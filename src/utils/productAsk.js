// Ask about this product (founder, Oct 24): one heading, three starters that
// fit her, one box, and a conversation anchored to the product. Shared by the
// app and website product pages.
import { matchText, shownMatchPercent, isSafetyHold, isBleedingEvaluation, SAFETY_HOLD, MATCH_UNAVAILABLE } from './matchDisplay.js';
import { whyLine } from './whyLine.js';

export const PRODUCT_ASK_TITLE = 'Ask about this product';
export const PRODUCT_ASK_PLACEHOLDER = 'Ask about this product…';

/**
 * Three starters that change with what ayna knows (PDP audit 7.8): her match
 * ("Why is my match 92%?"), her IUD for a cup or disc, cup or disc for her
 * flow, which size when the product comes in sizes; then the general ones.
 * Called with no options it returns the original three.
 */
export function productAskStarters({ hasProfile = false, percent = null, kind = '', hasIud = false, hasSizes = false } = {}) {
  const out = [];
  if (hasProfile && shownMatchPercent(percent) != null) out.push(`Why is my match ${shownMatchPercent(percent)}%?`);
  else out.push(hasProfile ? 'Why is this my match?' : 'Who is this good for?');
  if (kind && hasIud) out.push(`Is this OK with my IUD?`);
  if (kind && hasProfile) out.push('Cup or disc for my flow?');
  if (hasSizes) out.push('Which size should I get?');
  out.push('Anything I should know before using it?', 'How does this compare with another option?');
  return [...new Set(out)].slice(0, 3);
}

/**
 * Her match for the product in one line, from the one engine (on her device),
 * for the product chat to restate. Never a number the engine did not give;
 * a safety hold says so instead of any percent.
 */
export function productMatchContext(product, details) {
  if (!details || details.matchStatus === 'no-profile') return '';
  if (isSafetyHold(details)) return `${SAFETY_HOLD}, ${MATCH_UNAVAILABLE.toLowerCase()}. ${details.safetyHold?.reason || ''}`.trim();
  if (isBleedingEvaluation(details)) return `No match: ${details.bleedingEvaluation?.text || ''}`.trim();
  if (details.matchStatus === 'excluded' || details.eligible === false) return 'Not in her matches.';
  if (details.matchStatus !== 'scored' || !(details.percent > 0)) return 'No clear match to her needs.';
  const why = whyLine(product, details);
  return `${matchText(details.percent)}${details.needLabel ? ` for ${details.needLabel}` : ''}.${why ? ` ${why}.` : ''}`;
}
