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
import { costPerUse, lifespanYears } from '../pdp/decision.js';
import { priceParts } from '../../data/passport/content.js';
import { formatLabel, NOT_ON_FILE } from '../pdp/glance.js';
import { evidenceLevel, LEVEL_WORDS } from '../pdp/evidenceLevel.js';
import { evidenceFor, levelCountWords, LEVELS } from '../pdp/evidenceLevels.js';
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

/** "1 .gov · 4 peer-reviewed · 3 from Saalt": what is on file per level (people's posts stay in Reviews). */
export function evidenceCountsLine(product) {
  const ev = evidenceFor(product || {});
  return LEVELS.filter((l) => l.id !== 'people' && ev.counts[l.id] > 0).map((l) => levelCountWords(l.id, ev.counts[l.id], ev.brand)).join(' · ');
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

/** The full text behind a shortened cell ("Show more" in the table); null when nothing was cut. */
const clean = (t) => String(t || '').replace(/\s+/g, ' ').trim();
export function intendedUseFull(product) {
  const who = (product?.whoItsFor || []).map(clean).filter(Boolean);
  const full = who.length ? who.join(' ') : clean(product?.summary);
  return full && full !== intendedUse(product) ? full : null;
}
export function safetyFull(product) {
  const notes = [];
  const side = clean(product?.safety?.sideEffects);
  if (side && !/^(none|n\/a|no known|not applicable)/i.test(side)) notes.push(side);
  notes.push(...(product?.warnings || []).map(clean).filter(Boolean));
  if (recallFacts(product).status === 'past') notes.push('Past recall');
  const alert = clean(safetyAlertText(product));
  if (alert && !notes.length) notes.push(alert);
  const full = notes.map((n) => (/[.!?…]$/.test(n) ? n : `${n}.`)).join(' ');
  return full && full !== safetyOf(product) ? full : null;
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
  return '0 reviews';
}

// Match and Preferences always have a row (team direction 21); without her answers they say so.
const NO_PROFILE = 'Needs your health profile';

/**
 * The only rows where one value is objectively better (critique Oct 27: no
 * invented "better" judgements): ayna's cost per use (same unit only, lower is
 * better), a stated reusable lifespan (longer is better) and FSA/HSA (eligible
 * is better). `better[i]` is true only when at least two products have the
 * fact on file and one strictly wins; for FSA/HSA, only when they differ.
 */
export function objectiveRows(list = [], base = null) {
  const rows = [];
  const per = list.map((p) => costPerUse(p));
  const units = new Set(per.filter(Boolean).map((c) => c.unit));
  if (per.some(Boolean)) {
    const known = per.filter(Boolean);
    const min = units.size === 1 && known.length >= 2 ? Math.min(...known.map((c) => c.value)) : null;
    const winners = min == null ? 0 : known.filter((c) => c.value === min).length;
    rows.push({
      id: 'perUse', label: 'Cost per use', hint: 'ayna’s maths from the price and the lifespan or supply on file',
      values: per.map((c) => (c ? c.text.replace(/ if it lasts .*$/, '') : NOT_ON_FILE)),
      better: per.map((c) => Boolean(c && min != null && winners < known.length && c.value === min)),
      objective: true,
    });
  }
  const life = list.map((p) => lifespanYears(p));
  if (life.some(Boolean)) {
    const known = life.filter(Boolean);
    const max = known.length >= 2 ? Math.max(...known.map((l) => l.years)) : null;
    const winners = max == null ? 0 : known.filter((l) => l.years === max).length;
    rows.push({
      id: 'life', label: 'Lifespan', hint: 'As stated on the listing',
      values: life.map((l) => (l ? `${l.upTo ? 'Up to ' : ''}${l.years} years` : NOT_ON_FILE)),
      better: life.map((l) => Boolean(l && max != null && winners < known.length && l.years === max)),
      objective: true,
    });
  }
  const fsa = base?.['FSA/HSA'];
  if (fsa && fsa.some((v) => v !== NOT_ON_FILE)) {
    const differ = new Set(fsa).size > 1;
    rows.push({ id: 'fsa', label: 'FSA/HSA', values: fsa, better: fsa.map((v) => differ && v === 'Eligible'), objective: true });
  }
  return rows;
}

/**
 * @param {Array} products 2 to 4 products
 * @param {{ matchFor?: (p) => number|null, detailsFor?: (p) => object|null, ratingFor?: (p) => { value, count }|null, noProfileText?: string }} opts
 *   noProfileText: what the match row says without her answers (signed out: "See your match"; never a number)
 * @returns {Array<{ id, label, values: string[], notes?: string[] }>}
 */
export function compareSetRows(products = [], { matchFor = null, detailsFor = null, ratingFor = null, noProfileText = NO_PROFILE } = {}) {
  const list = products.filter(Boolean).slice(0, COMPARE_MAX);
  const base = Object.fromEntries(compareRows(list).map((r) => [r.label, r.values]));
  const rows = [];
  if (!matchFor && !detailsFor) {
    rows.push({ id: 'match', label: 'Your match', values: list.map(() => noProfileText), keep: true, noProfile: true });
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
  rows.push({ id: 'price', label: 'Price', values: list.map((p) => { const pr = priceParts(p); return pr.known ? pr.main : NOT_ON_FILE; }) });
  rows.push(...objectiveRows(list, base));
  rows.push({ id: 'use', label: 'Intended use', values: list.map(intendedUse), full: list.map(intendedUseFull), hint: 'What the brand or ayna’s team says it is for' });
  rows.push({ id: 'format', label: 'Format', values: list.map(formatOf) });
  // The grade (only from .gov) plus the same counts per level as the product page (pdp/evidenceLevels).
  rows.push({ id: 'evidence', label: 'Evidence', values: list.map(govEvidence), notes: list.map(evidenceCountsLine), hint: 'Graded only from .gov health pages' });
  if (base['Ingredients or materials']) rows.push({ id: 'ingredients', label: 'Ingredients or materials', values: base['Ingredients or materials'] });
  rows.push({ id: 'safety', label: 'Safety considerations', values: list.map(safetyOf), full: list.map(safetyFull), hint: 'From the label and the brand’s warnings' });
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
