/**
 * The decision block (PDP audit Oct 25, sections 13 and 14): the pure part.
 * Every value comes from the product record or the match engine. Nothing is
 * invented: a fact that is not on file is left out, never guessed.
 *
 * - costPerUse: ayna's own maths from the real price and a real lifespan or
 *   supply on file ("$29 ≈ $0.24 a cycle if it lasts 10 years"). Never the
 *   brand's savings claim; skipped when either number is missing.
 * - highlightsFor: 2 to 4 big-number tiles (25-37 mL, 12 hrs, 10 yrs, FSA/HSA).
 * - metaLineFor: "Menstrual cup · Reusable up to 10 years · FSA/HSA".
 * - matchBreakdownFor: the "Why 92%?" explainer's three lists.
 * - alsoAt: other stores with a live link only ("Also at Target").
 */
import { isSafetyHold, isBleedingEvaluation } from '../../utils/matchDisplay.js';
import { breakdownFromDetails, PARTNER_NOTE } from '../../matching/breakdown.js';
import { whyLine } from '../../utils/whyLine.js';
import { sizeCount } from './glance.js';
import { wearHours, cupOrDisc } from './pdpParts.js';

const money = (n) => `$${n < 1 ? n.toFixed(2) : n < 10 ? n.toFixed(2) : n.toFixed(2).replace(/\.00$/, '')}`;

/** The single price in the catalog string ("$29 (reusable…)" -> 29), or null for ranges, "from", plans and "A or B". */
export function singlePrice(product) {
  const p = String(product?.price || '').trim();
  if (!p || /[-–]\s*\$?\d|~|\bfrom\b|\babout\b|\/\s*(mo|month|year|yr|visit|session)|per (month|session|visit)|\bor\b\s*\$|subscription/i.test(p)) return null;
  const m = p.match(/^\$\s*(\d+(?:\.\d{1,2})?)\b/);
  return m ? Number(m[1]) : null;
}

const recordText = (product) => [product?.price, product?.summary, product?.effectiveness, product?.priceNote].filter(Boolean).join(' ');

/** A reusable lifespan stated on the record ("reusable up to 10 years" -> { years: 10, upTo: true }). */
export function lifespanYears(product) {
  const t = recordText(product);
  const m = t.match(/\b(?:reusable|lasts?|use it)\b[^.()]{0,24}?\b(up to\s+)?(\d{1,2})\s*(?:years?|yrs?)\b/i)
    || t.match(/\b(up to\s+)?(\d{1,2})\s*(?:years?|yrs?)\s+(?:of use|reusable|lifespan)\b/i);
  if (!m) return null;
  const years = Number(m[2]);
  return years > 0 && years <= 15 ? { years, upTo: Boolean(m[1]) } : null;
}

/** A supply stated in the price ("180-day supply" -> 180 days). */
export function supplyDays(product) {
  const m = String(product?.price || '').match(/\b(\d{1,4})[- ]day supply\b/i);
  return m ? Number(m[1]) : null;
}

/**
 * @returns {null | { text: string, unit: 'cycle'|'day', math: string }}
 * text: "≈ $0.24 a cycle if it lasts 10 years"; math: how ayna got there, for screen readers and the tooltip.
 */
export function costPerUse(product) {
  const price = singlePrice(product);
  if (!price) return null;
  const life = lifespanYears(product);
  if (life) {
    const cycles = life.years * 12;
    const each = price / cycles;
    return {
      unit: 'cycle',
      value: Number(each.toFixed(2)),
      text: `≈ ${money(each)} a cycle if it lasts ${life.years} years`,
      math: `ayna’s maths: ${money(price)} ÷ ${cycles} cycles (${life.years} years × 12 a year). The ${life.upTo ? 'up to ' : ''}${life.years}-year lifespan is from the product listing; the price is the one on this page.`,
    };
  }
  const days = supplyDays(product);
  if (days) {
    const each = price / days;
    return { unit: 'day', value: Number(each.toFixed(2)), text: `≈ ${money(each)} a day`, math: `ayna’s maths: ${money(price)} ÷ ${days} days (the ${days}-day supply on the listing).` };
  }
  return null;
}

/** Capacity in mL from the record ("Holds 25mL (regular) to 37mL (large)" -> "25–37 mL"). */
export function capacityMl(product) {
  const t = [product?.effectiveness, product?.summary].filter(Boolean).join(' ');
  const range = t.match(/\b(\d{1,2})\s*mL\b[^.]{0,30}?\b(?:to|or)\s+(\d{1,2})\s*mL\b/i);
  if (range) return Number(range[1]) === Number(range[2]) ? `${range[1]} mL` : `${range[1]}–${range[2]} mL`;
  const one = t.match(/\b(?:holds?|capacity(?: is)?)\s+(?:up to\s+)?(\d{1,2})\s*mL\b/i);
  return one ? `${one[1]} mL` : '';
}

const FSA = (product, glance) => {
  const f = (glance?.facts || []).find((x) => x.id === 'fsa' && !x.unknown);
  return f?.value === 'Eligible';
};

/** 2 to 4 highlight tiles: { id, icon, value, caption, from }. Only facts on file. */
export function highlightsFor(product, glance = null) {
  if (!product) return [];
  const out = [];
  const cap = capacityMl(product);
  if (cap) out.push({ id: 'capacity', icon: 'drop', value: cap, caption: 'holds' });
  const h = wearHours(product);
  if (h && cupOrDisc(product)) out.push({ id: 'wear', icon: 'clock', value: `${h} hrs`, caption: 'max wear' });
  const life = lifespanYears(product);
  if (life) out.push({ id: 'life', icon: 'recycle', value: `${life.years} yrs`, caption: life.upTo ? 'reusable, up to' : 'reusable' });
  const size = sizeCount(product);
  if (!cap && size?.n && size.n > 1 && size.word) out.push({ id: 'count', icon: 'size', value: String(size.n), caption: size.word });
  const days = supplyDays(product);
  if (days) out.push({ id: 'supply', icon: 'calendar', value: `${days} days`, caption: 'supply' });
  const dose = String(product.name || '').match(/\b(\d+(?:\.\d+)?)\s*(mg|mcg|IU)\b/i);
  if (dose && !cap) out.push({ id: 'dose', icon: 'tag', value: `${dose[1]} ${dose[2].toLowerCase() === 'iu' ? 'IU' : dose[2].toLowerCase()}`, caption: 'strength' });
  if (FSA(product, glance)) out.push({ id: 'fsa', icon: 'receipt', value: 'FSA/HSA', caption: 'eligible' });
  return out.length >= 2 ? out.slice(0, 4) : [];
}

const KIND = { cup: 'Menstrual cup', disc: 'Menstrual disc', tampon: 'Tampons', pad: 'Pads', 'period-underwear': 'Period underwear' };
/** "Menstrual cup · Reusable up to 10 years · FSA/HSA", from data on file only. */
export function metaLineFor(product, glance = null, format = '') {
  if (!product) return '';
  const parts = [];
  parts.push(KIND[product.category] || format || '');
  const life = lifespanYears(product);
  if (life) parts.push(`Reusable ${life.upTo ? 'up to ' : ''}${life.years} years`);
  const days = supplyDays(product);
  if (days) parts.push(`${days}-day supply`);
  if (FSA(product, glance)) parts.push('FSA/HSA');
  return parts.filter(Boolean).join(' · ');
}

/**
 * The "Why 92%?" explainer's data, from the one engine (src/matching
 * breakdownFromDetails, p8/match-honesty): what raised the score, what lowered
 * it and what ayna doesn't know yet, whose parts add up to the percent; the
 * product-specific reason line; and the partnership note. Safety holds and the
 * bleeding evaluation never get a percent or a breakdown here.
 * @returns {{ percent: number|null, reason: string, note: string, raised: {text, delta?}[], lowered: {text, delta?}[], unknown: {text}[] }}
 */
export function matchBreakdownFor(product, details) {
  const none = { percent: null, reason: '', note: PARTNER_NOTE, raised: [], lowered: [], unknown: [] };
  if (!details || isSafetyHold(details) || isBleedingEvaluation(details)) return none;
  const b = breakdownFromDetails(product, details);
  if (!b || b.percent == null) return { ...none, reason: whyLine(product, details) || '' };
  const items = (xs) => (xs || []).filter((x) => x && x.text).map((x) => ({ text: String(x.text), ...(Number.isFinite(x.delta) ? { delta: x.delta } : {}) }));
  return { percent: b.percent, reason: b.reason || '', note: b.note || PARTNER_NOTE, raised: items(b.raised), lowered: items(b.lowered), unknown: items(b.unknown) };
}

/** Other stores with a live link (never "No link yet"): "Also at Target · $29". */
export function alsoAt(rows = []) {
  return (rows || []).filter((r) => r && !r.primary && r.url).map((r) => ({ name: r.name, url: r.url, price: r.price || '' }));
}
