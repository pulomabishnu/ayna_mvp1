// "What's my % match for <product> and why?" answered from ayna's own match
// engine, on the device, not by the language model: the number and the
// reasons are the same ones the product card and "Why this matches" show, so
// Ask can never make up a different percent. Anything else goes to Ask ayna.

import { findConfidentProductMatch } from './naturalLanguageSearch.js';
import { whyMatch, exclusionLines, confidenceNotes, needBreakdown, shownMatchPercent, SAFETY_HOLD, MATCH_UNAVAILABLE, SAFETY_HOLD_LINE, SAFETY_HOLD_PRODUCT_LINE, HOLD_STATE_TITLE, HOLD_STATE_LINE } from './matchDisplay.js';
import { buildProductProfile } from '../matching/productProfile.js';
import { whyLine } from './whyLine.js';
import { breakdownFromDetails } from '../matching/breakdown.js';

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

// "Is <product> safe for me / with my medicines / in pregnancy?", "Why is
// <product> on hold?", "Can I use <product>?" (review, Oct 29): answered from
// the same engine as the card (its match, hold or exclusion), never by the
// model, which does not know her safety checks. Only when a product is named.
const SAFETY_INTENT = [
  /\b(?:is|are)\b.+\b(?:safe|ok|okay|right|good|suitable)\b/i,
  /\bwhy\b.+\b(?:on\s+hold|held|being\s+reviewed|checking|no\s+match|not\s+(?:in\s+)?my\s+matches)\b/i,
  /\bcan\s+i\s+(?:use|take|try)\b/i,
];
const isSafetyQuestion = (t) => SAFETY_INTENT.some((re) => re.test(t));

const FILLER = /\b(what(?:'|’)?s|what|is|are|my|me|the|a|an|for|with|on|how|well|does|do|would|will|match(?:es|ed)?|score|percent|per|cent|fit|good|and|why|it|this|that|tell|show|please|ayna|to|of|safe|ok|okay|right|suitable|can|i|use|take|try|while|in|pregnancy|pregnant|breastfeeding|medicines?|medications?|meds|hold|held|being|reviewed|checking|no|not|matches)\b|[%?!.,"“”]/gi;

export function isMatchQuestion(text) {
  const t = String(text || '');
  return t.length <= 200 && (MATCH_INTENT.some((re) => re.test(t)) || isSafetyQuestion(t));
}

/** A product named by brand or a distinctive word ("ThermaCare", "Estroven") when the full-name search is unsure. */
function productByName(query, catalog) {
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 3) return { one: null, some: [] };
  const stem = (w) => w.replace(/ies$/, 'y').replace(/(?<!s)s$/, '');
  const hits = catalog.filter((p) => { const n = `${p.brand || ''} ${p.name || ''}`.toLowerCase(); return q.split(/\s+/).every((w) => n.includes(stem(w))); });
  return { one: hits.length === 1 ? hits[0] : null, some: hits.slice(0, 4) };
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
function answerMatchCore(text, ctx) {
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
    if (top) return answerMatchCore(`why is this matched to me`, { ...ctx, focusProduct: top });
  }
  const id = query ? findConfidentProductMatch(query, catalog, null, categoryLabels) : undefined;
  const byName = !id && query ? productByName(query, catalog) : { one: null, some: [] };
  const product = (id && catalog.find((p) => String(p.id) === String(id))) || byName.one || (!query ? focusProduct : null);
  const safetyOnly = isSafetyQuestion(text) && !MATCH_INTENT.some((re) => re.test(text));

  // Several products by that name: each one's status for her, from the
  // engine, and a tap for the full answer.
  if (!product && byName.some.length > 1) {
    const statusOf = (p) => {
      if (!quizAnswers || typeof getDetails !== 'function') return '';
      const d = getDetails(p, quizAnswers, healthProfile, matchOpts);
      if (d?.matchStatus === 'safety-hold') return HOLD_STATE_TITLE[d.safetyHold?.state] || SAFETY_HOLD;
      if (d?.matchStatus === 'excluded' || d?.eligible === false) return 'not in your matches';
      const shown = d?.matchStatus === 'scored' ? shownMatchPercent(d.percent) : null;
      return shown != null ? `${shown}% match` : d?.matchStatus === 'scored' && d.percent > 0 ? 'partial fit' : 'no match for your needs';
    };
    return { productId: null, answer: `There’s more than one. Here’s where each stands for you:\n\n${byName.some.map((p) => { const st = statusOf(p); return `- **${nameOf(p)}**${st ? `: ${st}` : ''}`; }).join('\n')}\n\nTap one for the full reason.`, followUps: byName.some.map((p) => ({ type: 'ask', text: `What is my match for ${nameOf(p)}?`, label: nameOf(p).slice(0, 36) })) };
  }
  // A general safety question with no product named ("can I use a heating
  // pad?") goes to Ask as usual.
  if (!product && safetyOnly) return null;

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
    return { productId: String(product.id), followUps: open, answer: [`**${name}**: ${HOLD_STATE_TITLE[hold?.state] || SAFETY_HOLD} · ${MATCH_UNAVAILABLE}.`, HOLD_STATE_LINE[hold?.state] || (hold?.kind === 'product' ? SAFETY_HOLD_PRODUCT_LINE : SAFETY_HOLD_LINE), hold?.reason || '', hold?.fix?.label ? (hold.fix.step ? `To resolve it: ${hold.fix.label.replace(/^Answer: /, 'answer “')}${hold.fix.label.startsWith('Answer: ') ? '” in your profile.' : ''}` : hold.fix.label) : ''].filter(Boolean).join('\n\n') };
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
  // "Why NN%?" from the same engine numbers as the card and product page
  // (src/matching/breakdown.js): what raised it, what lowered it, what ayna
  // does not know yet. Label: Strong fit 80+, Good fit 60 to 79.
  const bd = breakdownFromDetails(product, details);
  const label = bd?.label && bd.label !== 'Partial fit' ? ` (${bd.label.toLowerCase()})` : '';
  const head = shown == null
    ? `**${name}** is a **partial fit** for you${best?.phrase ? `, for ${best.phrase}` : ''}.${line ? ` ${line}.` : ''}`
    : `**${name}** is ${/^(8|11|18)/.test(String(shown)) ? 'an' : 'a'} **${shown}% match** for you${best?.phrase ? `, for ${best.phrase}` : ''}${label}.${line ? ` ${line}.` : ''}`;
  const notes = confidenceNotes(details, product);
  const raised = bd?.raised?.length ? bd.raised.map((r) => r.text) : why.reasons;
  const parts = [
    head,
    raised.length ? `**What raised it**\n${raised.slice(0, 4).map((r) => `- ✓ ${r}`).join('\n')}` : '',
    bd?.lowered?.length ? `**What lowered it**\n${bd.lowered.slice(0, 3).map((r) => `- ${r.text}`).join('\n')}` : '',
    bd?.unknown?.length ? `**What ayna doesn’t know yet**\n${bd.unknown.slice(0, 3).map((r) => `- ${r.text}`).join('\n')}` : '',
    notes.length ? `**Worth checking**\n${notes.slice(0, 3).map((n) => `- △ ${n}`).join('\n')}` : '',
    why.basedOn.length ? `**What ayna used:** ${why.basedOn.slice(0, 5).join(', ')}.` : '',
    why.hint ? `${why.hint}.` : '',
    'The match is how well it fits what you’ve told ayna, not a medical judgement.',
  ];
  return { productId: String(product.id), followUps: open, answer: parts.filter(Boolean).join('\n\n') };
}

// "Is it safe in pregnancy / while breastfeeding?": what the product's own
// facts say, from the same profile the engine reads. Unknown is said as unknown.
const STAGE_WORDS = { contraindicated: 'not for use', caution: 'check with a clinician first', verified: 'checked as fine by a reviewed source', unknown: 'not confirmed: ayna doesn’t have this fact yet', not_applicable: '' };
function stageFactLine(text, product) {
  const t = String(text || '');
  const preg = /pregnan/i.test(t); const bf = /breastfeed|nursing|lactat/i.test(t);
  if (!product || (!preg && !bf)) return '';
  let pp; try { pp = buildProductProfile(product); } catch { return ''; }
  const lines = [];
  if (preg && STAGE_WORDS[pp.pregnancy?.overall]) lines.push(`**In pregnancy:** ${STAGE_WORDS[pp.pregnancy.overall]}.`);
  if (bf && STAGE_WORDS[pp.breastfeeding?.overall]) lines.push(`**While breastfeeding:** ${STAGE_WORDS[pp.breastfeeding.overall]}.`);
  return lines.length ? `${lines.join('\n')}\nAsk your clinician or pharmacist before using it.` : '';
}

export function answerMatchQuestion(text, ctx) {
  const r = answerMatchCore(text, ctx);
  if (!r?.productId) return r;
  const product = (ctx?.catalog || []).find((p) => String(p.id) === String(r.productId)) || ctx?.focusProduct || null;
  const line = stageFactLine(text, product);
  return line ? { ...r, answer: `${line}\n\n${r.answer}` } : r;
}

/** Loads the catalog and engine only when a match question comes in. */
export async function localMatchAnswer(text, { quizAnswers, healthProfile = null, matchOpts, focusProduct = null } = {}) {
  if (!isMatchQuestion(text)) return null;
  const { ALL_PRODUCTS, CATEGORY_LABELS, getProductMatchDetailsForProduct, getTopMatch } = await import('../data/products.js');
  return answerMatchQuestion(text, { catalog: ALL_PRODUCTS, categoryLabels: CATEGORY_LABELS, quizAnswers, healthProfile, matchOpts, focusProduct, getDetails: getProductMatchDetailsForProduct, getTop: getTopMatch });
}
