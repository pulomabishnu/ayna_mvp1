// "What's my % match for <product> and why?" answered from ayna's own match
// engine, on the device, not by the language model: the number and the
// reasons are the same ones the product card and "Why this matches" show, so
// Ask can never make up a different percent. Anything else goes to Ask ayna.

import { findConfidentProductMatch } from './naturalLanguageSearch.js';
import { whyMatch, exclusionLines, confidenceNotes, needBreakdown, tierWord, shownMatchPercent, SAFETY_HOLD, MATCH_UNAVAILABLE, SAFETY_HOLD_LINE, SAFETY_HOLD_PRODUCT_LINE } from './matchDisplay.js';
import { whyLine } from './whyLine.js';

// Questions about her fit for one product. Kept narrow on purpose: "does this
// match my skin tone" style questions still go to Ask.
const MATCH_INTENT = [
  /(%|percent|per cent)\s*match/i,
  /\bmatch(?:\s+score)?\s+(?:for|with|on)\b/i,
  /\bmy\s+match\b/i,
  /\bhow\s+(?:well\s+)?(?:does|do|would|will)\b.+\b(?:match|fit)\s+me\b/i,
  /\b(?:is|are)\b.+\b(?:a\s+)?good\s+(?:match|fit)\s+for\s+me\b/i,
  /\bwhy\b.+\b(?:match|matched|matches)\b/i,
  /\b(?:my\s+)?(?:top|best)\s+match\b/i,
];

const TOP_MATCH = /\b(?:top|best)\s+match\b/i;

const FILLER = /\b(what(?:'|’)?s|what|is|are|my|me|the|a|an|for|with|on|how|well|does|do|would|will|match(?:es|ed)?|score|percent|per|cent|fit|good|and|why|it|this|that|tell|show|please|ayna|to|of)\b|[%?!.,"“”]/gi;

export function isMatchQuestion(text) {
  const t = String(text || '');
  return t.length <= 200 && MATCH_INTENT.some((re) => re.test(t));
}

/** The product words left after taking out the question words. */
export function productQueryFrom(text) {
  return String(text || '').replace(FILLER, ' ').replace(/\s+/g, ' ').trim();
}

const list = (items) => items.map((t) => `- ${t}`).join('\n');
const nameOf = (p) => String(p?.name || p?.title || 'This product').trim();

/**
 * @param {string} text her question
 * @param {{ catalog: object[], quizAnswers: object|null, healthProfile?: object|null,
 *   matchOpts?: object, categoryLabels?: object, getDetails: Function, getTop?: Function, focusProduct?: object|null }} ctx
 *   getDetails = getProductMatchDetailsForProduct (passed in so this file stays light).
 *   getTop = getTopMatch (her first For you match), for "explain my top match".
 *   focusProduct = the product she is looking at, used when the question names none.
 * @returns {{ answer: string, followUps: object[], productId: string|null } | null}
 *   null when it is not a match question (send it to Ask as usual).
 */
export function answerMatchQuestion(text, ctx) {
  if (!isMatchQuestion(text)) return null;
  const { catalog = [], quizAnswers = null, healthProfile = null, matchOpts, categoryLabels = {}, getDetails, getTop = null, focusProduct = null } = ctx || {};
  const query = TOP_MATCH.test(text) ? '' : productQueryFrom(text);
  // "Explain my top match": the first product of her For you order, from the
  // same engine (getTopMatch: eligible, not held back, not something she said
  // was not relevant or already has, life stage checked first).
  if (TOP_MATCH.test(text) && quizAnswers && typeof getDetails === 'function') {
    let top = typeof getTop === 'function' ? getTop(quizAnswers, healthProfile, matchOpts) : null;
    if (!top) {
      let best = null;
      for (const p of catalog) {
        const d = getDetails(p, quizAnswers, healthProfile, matchOpts);
        if (d?.matchStatus === 'scored' && d.eligible !== false && !d.restricted && d.recommendable !== false && Number.isFinite(d.percent) && (!best || d.percent > best.percent)) best = { p, percent: d.percent };
      }
      top = best?.p || null;
    }
    if (top) return answerMatchQuestion(`why is this matched to me`, { ...ctx, focusProduct: top });
  }
  const id = query ? findConfidentProductMatch(query, catalog, null, categoryLabels) : undefined;
  const product = (id && catalog.find((p) => String(p.id) === String(id))) || (!query ? focusProduct : null);

  if (!product) {
    return {
      productId: null,
      followUps: [],
      answer: query
        ? `I couldn’t tell which product you mean by “${query}”. Try its full name, like the one on the product page, and I’ll give you your match and why.`
        : 'Which product? Tell me its name and I’ll give you your match and why.',
    };
  }

  const name = nameOf(product);
  // Chips need a label (askFollowUps.chipsFor drops unlabelled ones).
  const open = [{ type: 'open_product', productId: String(product.id), label: 'See full match details' }];
  if (!quizAnswers || typeof getDetails !== 'function') {
    return { productId: String(product.id), followUps: open, answer: `I can’t give you a match for **${name}** yet. Answer a few questions about your needs in your profile and I’ll show your match and why.` };
  }

  const details = getDetails(product, quizAnswers, healthProfile, matchOpts);
  const why = whyMatch(details);
  const excluded = details?.matchStatus === 'excluded' || details?.eligible === false;

  if (details?.matchStatus === 'no-profile') {
    return { productId: String(product.id), followUps: open, answer: `I can’t give you a match for **${name}** yet. Answer a few questions about your needs in your profile and I’ll show your match and why.` };
  }
  if (excluded) {
    const lines = exclusionLines(details);
    const reasons = lines.length ? lines : (why.considerations || []).map((c) => c.text).filter(Boolean);
    return { productId: String(product.id), followUps: open, answer: [`**${name}** isn’t in your matches, so it has no match for you.`, reasons.length ? list(reasons.slice(0, 3)) : '', 'This is based on what you’ve shared with ayna. You can change your answers in your profile.'].filter(Boolean).join('\n\n') };
  }
  if (why.restricted || details?.matchStatus === 'safety-hold') {
    // Same words as the card and product page (founder, Oct 24): no percent, the reason, the fix.
    const hold = details?.safetyHold;
    return { productId: String(product.id), followUps: open, answer: [`**${name}**: ${SAFETY_HOLD} · ${MATCH_UNAVAILABLE}.`, hold?.kind === 'product' ? SAFETY_HOLD_PRODUCT_LINE : SAFETY_HOLD_LINE, hold?.reason || '', hold?.fix?.label ? (hold.fix.step ? `To resolve it: ${hold.fix.label.replace(/^Answer: /, 'answer “')}${hold.fix.label.startsWith('Answer: ') ? '” in your profile.' : ''}` : hold.fix.label) : ''].filter(Boolean).join('\n\n') };
  }

  if (details?.matchStatus === 'bleeding-evaluation') {
    // Bleeding after menopause (founder, Oct 24): the prompt-evaluation message, no match.
    return { productId: String(product.id), followUps: open, answer: [`**${name}** has no match for you.`, details.bleedingEvaluation?.text || ''].filter(Boolean).join('\n\n') };
  }

  const percent = details?.percent;
  if (!Number.isFinite(percent) || percent <= 0 || details?.matchStatus !== 'scored') {
    return { productId: String(product.id), followUps: open, answer: `**${name}** doesn’t match any of the needs you’ve told ayna about, so there’s no match to show.` };
  }

  const best = needBreakdown(details).find((r) => r.needId === details.needId) || needBreakdown(details)[0];
  // Same rule as the cards: under 50 there is no number, just "a partial fit".
  const shown = shownMatchPercent(percent);
  const line = whyLine(product, details);
  const head = shown == null
    ? `**${name}** is a **partial fit** for you${best?.phrase ? `, for ${best.phrase}` : ''}.${line ? ` ${line}.` : ''}`
    : best?.phrase
      ? `**${name}** is ${/^(8|11|18)/.test(String(shown)) ? 'an' : 'a'} **${shown}% match** for you, for ${best.phrase}${tierWord(details.tier, percent) ? ` (${tierWord(details.tier, percent).toLowerCase()})` : ''}.`
      : `**${name}** is ${/^(8|11|18)/.test(String(shown)) ? 'an' : 'a'} **${shown}% match** for you${tierWord(details.tier, percent) ? ` (${tierWord(details.tier, percent).toLowerCase()})` : ''}.`;
  const notes = confidenceNotes(details, product);
  const parts = [
    head,
    why.reasons.length ? `**Why**\n${why.reasons.slice(0, 4).map((r) => `- ✓ ${r}`).join('\n')}` : '',
    notes.length ? `**Worth checking**\n${notes.slice(0, 3).map((n) => `- △ ${n}`).join('\n')}` : '',
    why.basedOn.length ? `**What ayna used:** ${why.basedOn.slice(0, 5).join(', ')}.` : '',
    why.hint ? `${why.hint}.` : '',
    'The match is how well it fits what you’ve told ayna, not a medical judgement.',
  ];
  return { productId: String(product.id), followUps: open, answer: parts.filter(Boolean).join('\n\n') };
}

/** Loads the catalog and engine only when a match question comes in. */
export async function localMatchAnswer(text, { quizAnswers, healthProfile = null, matchOpts, focusProduct = null } = {}) {
  if (!isMatchQuestion(text)) return null;
  const { ALL_PRODUCTS, CATEGORY_LABELS, getProductMatchDetailsForProduct, getTopMatch } = await import('../data/products.js');
  return answerMatchQuestion(text, { catalog: ALL_PRODUCTS, categoryLabels: CATEGORY_LABELS, quizAnswers, healthProfile, matchOpts, focusProduct, getDetails: getProductMatchDetailsForProduct, getTop: getTopMatch });
}
