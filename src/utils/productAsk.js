// Ask about this product (founder, Oct 24): one heading, three starters that
// fit her, one box, and a conversation anchored to the product. Shared by the
// app and website product pages.
import { matchText, isSafetyHold, SAFETY_HOLD, MATCH_UNAVAILABLE } from './matchDisplay.js';
import { whyLine } from './whyLine.js';

export const PRODUCT_ASK_TITLE = 'Ask about this product';
export const PRODUCT_ASK_PLACEHOLDER = 'Ask anything about this product…';

/** Three starters. With a profile, the first asks about her match; without one, who it is for. */
export function productAskStarters({ hasProfile = false } = {}) {
  return [
    hasProfile ? 'Why is this my match?' : 'Who is this good for?',
    'Anything I should know before using it?',
    'How does this compare with another option?',
  ];
}

/**
 * Her match for the product in one line, from the one engine (on her device),
 * for the product chat to restate. Never a number the engine did not give;
 * a safety hold says so instead of any percent.
 */
export function productMatchContext(product, details) {
  if (!details || details.matchStatus === 'no-profile') return '';
  if (isSafetyHold(details)) return `${SAFETY_HOLD}, ${MATCH_UNAVAILABLE.toLowerCase()}. ${details.safetyHold?.reason || ''}`.trim();
  if (details.matchStatus === 'excluded' || details.eligible === false) return 'Not in her matches.';
  if (details.matchStatus !== 'scored' || !(details.percent > 0)) return 'No clear match to her needs.';
  const why = whyLine(product, details);
  return `${matchText(details.percent)}${details.needLabel ? ` for ${details.needLabel}` : ''}.${why ? ` ${why}.` : ''}`;
}
