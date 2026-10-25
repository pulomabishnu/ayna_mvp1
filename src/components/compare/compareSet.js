/**
 * Compare 2 to 4 products (team direction 21, UX spec 27). Rows, in order:
 * match, price, intended use, format, evidence, ingredients, safety
 * considerations, preferences, reviews. Real fields only; a row where no
 * product has anything on file is dropped.
 *
 * - Match comes from the one engine (the caller's matchFor / detailsFor),
 *   with the one rule: under 50 is "Partial fit", never a number.
 * - Evidence shows a grade only when it was graded from a .gov page
 *   (evidenceLevel.gradedResearch); anything else says it is not graded.
 * - Intended use is what the brand or the team wrote it is for, labelled
 *   as such, never as proof it works.
 * - "Best match for your profile" only when the engine has enough to go on
 *   (scored, medium or high confidence, a clear lead), with the reason.
 *   Never "best" on its own.
 */
import { compareRows } from '../pdp/commerce.js';
import { formatLabel, NOT_ON_FILE } from '../pdp/glance.js';
import { gradedResearch, LEVEL_WORDS } from '../pdp/evidenceLevel.js';
import { needPhrase } from '../../matching/ontology.js';
import { matchText, isSafetyHold, SAFETY_HOLD, MATCH_UNAVAILABLE } from '../../utils/matchDisplay.js';
import { whyFirstLine, whyLine } from '../../utils/whyLine.js';

import { COMPARE_MAX, COMPARE_MIN } from '../../utils/compareStore.js';

export { COMPARE_MAX, COMPARE_MIN };

const GRADE_LEVEL = { A: 3, B: 2, C: 1 };
const PREF_TEXTS = [
  /^Within your budget$/i, /^Above your usual budget$/i, /^In a format you prefer$/i,
  /^From a brand you said you like$/i, /^From a brand you trust$/i, /^Costs less over time/i,
  /^Sized for a lighter flow$/i,
];

const firstSentence = (t) => {
  const s = String(t || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const m = s.match(/^(.{20,180}?[.!?])(\s|$)/);
  return (m ? m[1] : s.slice(0, 160)).replace(/\s+[—–]\s+/g, ', ');
};

/** What it is for: the team's "who it's for" line, else the first line of its summary. */
export function intendedUse(product) {
  const who = (product?.whoItsFor || []).map((x) => String(x || '').trim()).filter(Boolean);
  if (who.length) return firstSentence(who[0]);
  return firstSentence(product?.summary) || NOT_ON_FILE;
}

/** Only .gov-graded evidence: "Some evidence for period cramps", else "Not graded yet". */
export function govEvidence(product) {
  const top = gradedResearch(product?.id).find((g) => g.strength !== 'none');
  if (!top) return 'Not graded yet';
  const level = GRADE_LEVEL[top.grade] || 0;
  return level ? `${LEVEL_WORDS[level]} for ${needPhrase(top.need)}` : 'Not graded yet';
}

function preferences(details) {
  if (!details) return NOT_ON_FILE;
  const texts = (details.reasonDetails || []).map((r) => String(r?.text || '')).filter((t) => PREF_TEXTS.some((re) => re.test(t)));
  return texts.length ? [...new Set(texts)].join(', ') : 'None of your preferences named';
}

function reviews(product, ratingFor) {
  const ours = ratingFor ? ratingFor(product) : null;
  if (ours && Number.isFinite(ours.value) && ours.count > 0) return `★ ${ours.value.toFixed(1)} from ${ours.count} ayna member${ours.count === 1 ? '' : 's'}`;
  if (product?.userRating && product?.userRatingSourceUrl) return `★ ${product.userRating} online rating, not checked by ayna`;
  return NOT_ON_FILE;
}

/**
 * @param {Array} products 2 to 4 products
 * @param {{ matchFor?: (p) => number|null, detailsFor?: (p) => object|null, ratingFor?: (p) => { value, count }|null }} opts
 * @returns {Array<{ id, label, values: string[], notes?: string[] }>}
 */
export function compareSetRows(products = [], { matchFor = null, detailsFor = null, ratingFor = null } = {}) {
  const list = products.filter(Boolean).slice(0, COMPARE_MAX);
  const base = Object.fromEntries(compareRows(list).map((r) => [r.label, r.values]));
  const rows = [];
  if (matchFor || detailsFor) {
    rows.push({
      id: 'match', label: 'Your match',
      values: list.map((p) => {
        const d = detailsFor ? detailsFor(p) : null;
        const pct = matchFor ? matchFor(p) : d?.percent;
        if (d && (d.matchStatus === 'excluded' || d.eligible === false)) return 'Not a fit for you right now';
        // Held back for safety: never a number (founder, Oct 24); the reason is in the note.
        if (isSafetyHold(d)) return `${SAFETY_HOLD} · ${MATCH_UNAVAILABLE}`;
        return Number(pct) > 0 ? matchText(pct) : 'No clear match';
      }),
      notes: list.map((p) => { const d = detailsFor ? detailsFor(p) : null; if (isSafetyHold(d)) return [d.safetyHold?.reason, d.safetyHold?.fix?.label].filter(Boolean).join(' '); return d ? whyLine(p, d) : ''; }),
    });
  }
  rows.push({ id: 'price', label: 'Price', values: base.Price || list.map(() => NOT_ON_FILE) });
  rows.push({ id: 'use', label: 'Intended use', values: list.map(intendedUse), hint: 'What the brand or ayna’s team says it is for' });
  rows.push({ id: 'format', label: 'Format', values: list.map((p) => formatLabel(p) || NOT_ON_FILE) });
  rows.push({ id: 'evidence', label: 'Evidence', values: list.map(govEvidence), hint: 'Graded only from .gov health pages' });
  if (base['Ingredients or materials']) rows.push({ id: 'ingredients', label: 'Ingredients or materials', values: base['Ingredients or materials'] });
  if (base['Safety notes']) rows.push({ id: 'safety', label: 'Safety considerations', values: base['Safety notes'] });
  if (detailsFor) rows.push({ id: 'prefs', label: 'Your preferences', values: list.map((p) => preferences(detailsFor(p))) });
  rows.push({ id: 'reviews', label: 'Reviews', values: list.map((p) => reviews(p, ratingFor)) });
  return rows.filter((r) => r.values.some((v) => v && v !== NOT_ON_FILE));
}

/**
 * "Best match for your profile", or null. Needs: at least two products,
 * every one scored by the engine, the top one 50+ with medium or high
 * confidence, and a clear lead over the next.
 */
export function bestForProfile(products = [], detailsFor = null) {
  if (!detailsFor || products.length < COMPARE_MIN) return null;
  const items = products.map((p) => ({ product: p, details: detailsFor(p) }));
  if (items.some((it) => !it.details || it.details.matchStatus === 'no-profile')) return null;
  const scored = items.filter((it) => it.details.matchStatus === 'scored' && it.details.eligible !== false && Number.isFinite(it.details.percent));
  if (!scored.length) return null;
  const ranked = [...scored].sort((a, b) => b.details.percent - a.details.percent);
  const top = ranked[0];
  const next = ranked[1];
  const conf = String(top.details.confidence || '');
  if (top.details.percent < 50 || !(conf === 'high' || conf === 'medium')) return null;
  if (next && top.details.percent - next.details.percent < 3) return null;
  const why = whyFirstLine(items) || whyLine(top.product, top.details, { max: 2 });
  if (!why) return null;
  return { product: top.product, why };
}
