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
import { evidenceLevel, LEVEL_WORDS } from '../pdp/evidenceLevel.js';
import { buildProductProfile } from '../../matching/productProfile.js';
import { recallFacts } from '../../utils/productFacts.js';
import { safetyAlertText } from '../../data/passport/content.js';
import { matchText, isSafetyHold, isBleedingEvaluation, BLEEDING_EVALUATION, SAFETY_HOLD, MATCH_UNAVAILABLE } from '../../utils/matchDisplay.js';
import { whyFirstLine, whyLine } from '../../utils/whyLine.js';

import { COMPARE_MAX, COMPARE_MIN } from '../../utils/compareStore.js';

export { COMPARE_MAX, COMPARE_MIN };

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

/**
 * Only .gov-graded evidence, worded for what it is: "Supported for this type
 * (MedlinePlus), for period cramps. No study of this exact product." Else "Not graded yet".
 */
export function govEvidence(product) {
  const ev = evidenceLevel(product || {});
  if (!ev.topGrade || !ev.level) return 'Not graded yet';
  return ev.scope === 'type' ? ev.line : `${ev.word}${ev.need ? ` for ${ev.need}` : ''}`;
}

// The physical form, from the product profile (not the shop category).
const FORMAT_WORDS = {
  pill_capsule: 'Pills or capsules', gummy: 'Gummies', powder: 'Powder', drink_tea: 'Drink or tea',
  topical: 'Cream, gel or lotion', patch: 'Patch or wrap', suppository: 'Suppository', device: 'Device',
  period_care: 'Period product', app_service: 'App or service', test_kit: 'At-home test', apparel_support: 'Wearable support',
};
/** "Device · plug-in", "Patch or wrap", "Pills or capsules": the real format, never the category. */
export function formatOf(product) {
  let formats = [];
  try { formats = buildProductProfile(product)?.formats || []; } catch { formats = []; }
  const words = formats.map((f) => FORMAT_WORDS[f]).filter(Boolean);
  const text = `${product?.name || ''} ${product?.summary || ''}`.toLowerCase();
  const power = /\bplug-?in\b|\belectric\b|\bcorded\b/.test(text) ? 'plug-in' : /\bcordless\b|\brechargeable\b|\bbattery\b/.test(text) ? 'rechargeable' : /\bmicrowav/.test(text) ? 'microwavable' : /\bair-activated\b|\bself-heating\b|\bdisposable\b/.test(text) ? 'single use' : '';
  if (words.length) return [...new Set(words)].slice(0, 2).join(', ') + (power && formats.some((f) => ['device', 'patch'].includes(f)) ? ` · ${power}` : '');
  const fallback = formatLabel(product);
  return fallback || NOT_ON_FILE;
}

const shortWarning = (t) => {
  const s = String(t || '').replace(/\s+/g, ' ').trim().replace(/\.$/, '');
  return s.length > 90 ? `${s.slice(0, 88).replace(/[\s,;:]+\S*$/, '')}…` : s;
};
/**
 * Safety considerations: the label warnings on file first (product.warnings,
 * then the side effects line), then recall and pregnancy flags. "None flagged"
 * only when nothing at all is on file.
 */
export function safetyOf(product) {
  const notes = [];
  const warnings = (product?.warnings || []).map(shortWarning).filter(Boolean);
  const side = String(product?.safety?.sideEffects || '').replace(/\s+/g, ' ').trim();
  const first = side.match(/^(.{12,200}?[.!?])(\s|$)/);
  if (side && !/^(none|n\/a|no known|not applicable)/i.test(side)) notes.push(shortWarning(first ? first[1] : side));
  notes.push(...warnings.slice(0, notes.length ? 1 : 2));
  if (recallFacts(product).status === 'past') notes.push('Past recall');
  const alert = safetyAlertText(product);
  if (alert && !notes.length) notes.push(shortWarning(alert));
  const more = notes.length < warnings.length + (side ? 1 : 0) ? ' More on its page.' : '';
  return notes.length ? `${notes.map((n) => (/[.!?…]$/.test(n) ? n : `${n}.`)).join(' ')}${more}` : 'None flagged';
}

function preferences(details) {
  if (!details) return NO_PROFILE;
  const texts = (details.reasonDetails || []).map((r) => String(r?.text || '')).filter((t) => PREF_TEXTS.some((re) => re.test(t)));
  return texts.length ? [...new Set(texts)].join(', ') : 'None of your preferences named';
}

function reviews(product, ratingFor) {
  const ours = ratingFor ? ratingFor(product) : null;
  if (ours && Number.isFinite(ours.value) && ours.count > 0) return `★ ${ours.value.toFixed(1)} from ${ours.count} ayna member${ours.count === 1 ? '' : 's'}`;
  if (product?.userRating && product?.userRatingSourceUrl) return `★ ${product.userRating} online rating, not checked by ayna`;
  return 'No ayna reviews yet';
}

// Match and Preferences always have a row (team direction 21); without her answers they say so.
const NO_PROFILE = 'Needs your health profile';

/**
 * @param {Array} products 2 to 4 products
 * @param {{ matchFor?: (p) => number|null, detailsFor?: (p) => object|null, ratingFor?: (p) => { value, count }|null }} opts
 * @returns {Array<{ id, label, values: string[], notes?: string[] }>}
 */
export function compareSetRows(products = [], { matchFor = null, detailsFor = null, ratingFor = null } = {}) {
  const list = products.filter(Boolean).slice(0, COMPARE_MAX);
  const base = Object.fromEntries(compareRows(list).map((r) => [r.label, r.values]));
  const rows = [];
  if (!matchFor && !detailsFor) {
    rows.push({ id: 'match', label: 'Your match', values: list.map(() => NO_PROFILE), keep: true });
  } else {
    rows.push({
      id: 'match', label: 'Your match',
      values: list.map((p) => {
        const d = detailsFor ? detailsFor(p) : null;
        const pct = matchFor ? matchFor(p) : d?.percent;
        if (d && (d.matchStatus === 'excluded' || d.eligible === false)) return 'Not a fit for you right now';
        // Held back for safety: never a number (founder, Oct 24); the reason is in the note.
        if (isSafetyHold(d)) return `${SAFETY_HOLD} · ${MATCH_UNAVAILABLE}`;
        if (isBleedingEvaluation(d)) return BLEEDING_EVALUATION;
        return Number(pct) > 0 ? matchText(pct) : 'No clear match';
      }),
      notes: list.map((p) => { const d = detailsFor ? detailsFor(p) : null; if (isSafetyHold(d)) return [d.safetyHold?.reason, d.safetyHold?.fix?.label].filter(Boolean).join(' '); if (isBleedingEvaluation(d)) return d.bleedingEvaluation?.text || ''; return d ? whyLine(p, d) : ''; }),
      keep: true,
    });
  }
  rows.push({ id: 'price', label: 'Price', values: base.Price || list.map(() => NOT_ON_FILE) });
  rows.push({ id: 'use', label: 'Intended use', values: list.map(intendedUse), hint: 'What the brand or ayna’s team says it is for' });
  rows.push({ id: 'format', label: 'Format', values: list.map(formatOf) });
  rows.push({ id: 'evidence', label: 'Evidence', values: list.map(govEvidence), hint: 'Graded only from .gov health pages' });
  if (base['Ingredients or materials']) rows.push({ id: 'ingredients', label: 'Ingredients or materials', values: base['Ingredients or materials'] });
  rows.push({ id: 'safety', label: 'Safety considerations', values: list.map(safetyOf), hint: 'From the label and the brand’s warnings' });
  rows.push({ id: 'prefs', label: 'Your preferences', values: list.map((p) => preferences(detailsFor ? detailsFor(p) : null)), keep: true });
  rows.push({ id: 'reviews', label: 'Reviews', values: list.map((p) => reviews(p, ratingFor)), keep: true });
  return rows.filter((r) => r.keep || r.values.some((v) => v && v !== NOT_ON_FILE));
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
