// Structured extraction for "Anything else?" and other free-text answers.
//
// Free text is never appended to a prompt. It is turned into typed items
// with a confidence band:
//   HIGH   can influence ranking
//   MEDIUM small adjustment only
//   LOW    stored, never used for ranking or safety
// Free text can NEVER create a hard safety exclusion from a guess. "Some
// creams make me itch" becomes topical_reaction_history with
// trigger 'unknown_trigger', not an allergy to any ingredient. The one
// exception is an explicit, first-person allergy statement naming a known
// allergen ("I'm allergic to latex"), which is a statement, not a guess.

import { canonicalize, normalizeText, confidenceBand } from './ontology.js';

const FORMAT_WORDS = [
  { re: /\b(pills?|capsules?|tablets?|softgels?)\b/, id: 'pill_capsule' },
  { re: /\bgumm(y|ies)\b/, id: 'gummy' },
  { re: /\bpowders?\b/, id: 'powder' },
  { re: /\b(teas?|drinks?)\b/, id: 'drink_tea' },
  { re: /\b(creams?|lotions?|gels?)\b/, id: 'topical' },
  { re: /\bpatch(es)?\b/, id: 'patch' },
  { re: /\bsuppositor(y|ies)\b/, id: 'suppository' },
  { re: /\b(devices?|wearables?|gadgets?)\b/, id: 'device' },
  { re: /\b(tampons?|pads?|cups?|discs?)\b/, id: 'period_care' },
];
function formatsIn(text) { return FORMAT_WORDS.filter((f) => f.re.test(text)).map((f) => f.id); }

const REACTION_TYPES = [
  { re: /\bburn(s|ed|ing)?\b/, type: 'irritation_burning' },
  { re: /\bitch(y|es|ed|ing)?\b/, type: 'itching' },
  { re: /\brash(es)?\b|\bhives\b/, type: 'rash' },
  { re: /\bbreak(s)? out\b|\bbroke out\b|\bbreakouts?\b/, type: 'breakout' },
  { re: /\birritat/, type: 'irritation' },
  { re: /\bswell(ing|ed)?\b/, type: 'swelling' },
  { re: /\bdry(ness)?\b/, type: 'dryness' },
];
const BODY_AREAS = [
  { re: /\bvagina|vaginal|vulva|down there|intimate\b/, area: 'vulvovaginal' },
  { re: /\bskin\b|\bface\b|\bbody\b/, area: 'skin' },
  { re: /\bstomach\b|\bgut\b|\bdigest/, area: 'digestive' },
];
const TOPICAL_WORDS = /\b(creams?|lotions?|gels?|balms?|washes?|soaps?|lubes?|lubricants?|moisturi[sz]ers?|wipes?|serums?|oils?)\b/;

function item(field, value, confidence, evidence, extra = {}) {
  return { field, value, confidence, evidence, source: 'user_free_text', ...extra };
}

/**
 * Extract structured items from one free-text answer.
 * @param {string} text
 * @param {{ knownNames?: string[] }} [options] catalog product and brand names, used to raise confidence of product mentions
 * @returns {{ raw: string, items: object[] }}
 */
export function extractFreeText(text, options = {}) {
  const raw = String(text ?? '');
  const items = [];
  if (!normalizeText(raw)) return { raw, items };
  const sentences = raw.split(/[.!?;\n]+|,\s*(?=and |but |also |i )/i)
    .flatMap((part) => normalizeText(part).split(/\s+(?:and|but|also)\s+(?=i\b|my\b|some\b)/))
    .map((s) => s.trim())
    .filter(Boolean);

  for (const s of sentences) {
    // Format dislikes
    let m = s.match(/\b(hate|cannot|can not|do not like|dislike|struggle with|trouble|hard time|will not|refuse to|no more)\b.{0,25}\b(swallow(ing)?|taking|take|use|using)?\b.{0,15}/);
    if (m || /\bno (pills?|capsules?|gummies|powders?|teas?|creams?|patches)\b/.test(s)) {
      const f = formatsIn(s);
      if (f.length) {
        const strong = /\b(hate|cannot|can not|will not|refuse|no (pills?|capsules?))\b/.test(s);
        items.push(item('format_dislikes', f, strong ? 'HIGH' : 'MEDIUM', s));
      }
    }
    if (/\bnot a (big )?fan of\b/.test(s)) {
      const f = formatsIn(s);
      if (f.length) items.push(item('format_dislikes', f, 'MEDIUM', s));
    }
    // Strict format preference ("I only use gummies", "I won't use anything else")
    m = s.match(/\bonly (use|want|take|do)\b/);
    if (m) {
      const f = formatsIn(s);
      if (f.length) items.push(item('format_only', f, 'HIGH', s));
    }

    // Price limit
    m = s.match(/\b(under|less than|below|max(imum)?|no more than|up to|cap(ped)? at|budget (is|of)?|around)\s*\$?\s*(\d{1,4})\b/);
    if (m) {
      const value = Number(m[5]);
      const hasMoney = /\$|dollars?|budget|spend|price|cost|bucks/.test(s);
      items.push(item('max_price', value, hasMoney ? 'HIGH' : 'LOW', s));
    } else if (/\b(cheap|affordable|tight budget|on a budget|cannot afford|expensive)\b/.test(s)) {
      items.push(item('price_sensitivity', 'higher', 'MEDIUM', s));
    }

    // Sensitive skin
    if (/\bsensitive skin\b|\bmy skin is (very )?sensitive\b/.test(s)) {
      items.push(item('sensitivities', ['sensitive_skin'], 'HIGH', s));
      items.push(item('inferred_preferences', ['irritation_avoidance'], 'MEDIUM', s));
    }

    // Explicit allergy statement (first person, names a known allergen)
    m = s.match(/\bi am allergic to ([a-z][a-z\s'-]{1,40})/) || s.match(/\bi have an? ([a-z\s-]{1,30}) allergy\b/);
    if (m) {
      const c = canonicalize(m[1], { kinds: ['allergen'] });
      if (c.canonical_id && c.confidence >= 0.9) items.push(item('explicit_allergy', c.canonical_id, 'HIGH', s, { canonical: c }));
      else items.push(item('allergy_mention_unresolved', m[1].trim(), 'LOW', s));
    }

    // Reactions without a confirmed trigger
    const reaction = REACTION_TYPES.find((r) => r.re.test(s));
    const reactionVerb = /\b(make|makes|made|gave|give|gives|cause[sd]?|caused)\b.{0,12}\bme\b|\bburned my\b|\bburnt my\b|\bi (react|reacted|get|got)\b/.test(s);
    if (reaction && reactionVerb && !/\ballergic to\b/.test(s)) {
      const area = BODY_AREAS.find((b) => b.re.test(s))?.area || (TOPICAL_WORDS.test(s) ? 'skin' : 'unknown');
      const topical = TOPICAL_WORDS.test(s);
      items.push(item(topical ? 'topical_reaction_history' : 'reaction_history', {
        reaction_type: reaction.type, body_area: area, trigger: 'unknown_trigger', ingredient_blamed: null,
      }, 'MEDIUM', s, { safety_exclusion: false }));
    }

    // Positive product history ("I love Rael pads")
    m = s.match(/\b(love|loved|swear by|really like|like|works? (great|well) for me|favorite is|obsessed with)\b\s+(my\s+|the\s+)?([a-z0-9][a-z0-9.'&\s-]{1,40})/);
    if (m && !/\b(do not|did not|not)\b\s+(love|like)/.test(s)) {
      const name = m[4].replace(/\b(but|because|and|so|they|it|which)\b.*$/, '').trim();
      const known = (options.knownNames || []).some((n) => {
        const nn = normalizeText(n);
        return nn && (name.includes(nn) || nn.startsWith(name.split(' ')[0]) && name.split(' ')[0].length > 2);
      });
      if (name && name.length > 1 && !(formatsIn(name).length && name.split(' ').length === 1)) items.push(item('positive_product_history', name, known ? 'HIGH' : 'MEDIUM', s));
    }
    // Negative product history (stored only)
    m = s.match(/\b([a-z0-9][a-z0-9.'&\s-]{1,30})\s+(did not|does not|never) work/);
    if (m) items.push(item('negative_product_history', m[1].trim(), 'LOW', s));

    // Leave-out / should-be wishes in prose ("prefer no fragrance", "vegan please")
    m = s.match(/\b(avoid|no|without|free of|prefer not)\b\s+(fragrance|dyes?|parabens?|sulfates?|phthalates?|latex|added sugar|artificial sweeteners?)\b/);
    if (m) {
      const attr = { fragrance: 'fragrance', dye: 'dyes', dyes: 'dyes', paraben: 'parabens', parabens: 'parabens', sulfate: 'sulfates', sulfates: 'sulfates', phthalate: 'phthalates', phthalates: 'phthalates', latex: 'latex', 'added sugar': 'added_sugar', 'artificial sweetener': 'artificial_sweeteners', 'artificial sweeteners': 'artificial_sweeteners' }[m[2]];
      if (attr) items.push(item('leave_out_preference', attr, 'MEDIUM', s, { strength: 'cosmetic' }));
    }
    for (const word of ['vegan', 'organic', 'cruelty-free', 'cruelty free', 'reusable', 'black-owned', 'black owned', 'eco-friendly', 'sustainable']) {
      if (s.includes(word)) {
        const c = canonicalize(word, { kinds: ['value'] });
        if (c.canonical_id) items.push(item('should_be_preference', c.canonical_id, 'MEDIUM', s));
      }
    }

    // Mentioned needs / life stage context via the ontology
    const need = canonicalize(s, { kinds: ['need'] });
    if (need.canonical_id && need.method === 'synonym_rule') {
      const band = need.contextual_only || need.specificity === 'low' ? 'LOW' : confidenceBand(need.confidence);
      items.push(item('mentioned_need', need.canonical_id, band, s, { canonical: need }));
    }
    const stage = canonicalize(s, { kinds: ['life_stage'] });
    if (stage.canonical_id && stage.method === 'synonym_rule') {
      // Context only. A life stage typed in prose never activates a gate by itself.
      items.push(item('mentioned_life_stage', stage.canonical_id, 'LOW', s, { canonical: stage }));
    }

    // Goals (stored only)
    m = s.match(/\b(want|trying|hoping|goal is) to ([a-z\s]{3,60})/);
    if (m && !/conceive|get pregnant/.test(m[2])) items.push(item('goal', m[2].trim(), 'LOW', s));
  }

  // De-duplicate identical field/value pairs, keeping the highest confidence.
  const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  const byKey = new Map();
  for (const it of items) {
    const key = `${it.field}|${JSON.stringify(it.value)}`;
    if (!byKey.has(key) || rank[it.confidence] > rank[byKey.get(key).confidence]) byKey.set(key, it);
  }
  return { raw, items: [...byKey.values()] };
}

/** Weight of a free-text item in ranking: HIGH 1, MEDIUM 0.5, LOW 0. */
export function freeTextWeight(confidence) {
  return confidence === 'HIGH' ? 1 : confidence === 'MEDIUM' ? 0.5 : 0;
}

/**
 * Collapse extracted items into the shape the profile uses
 * (spec example: { format_dislikes, max_price, sensitivities, positive_product_history, inferred_preferences }).
 * LOW items are kept in `stored` only.
 */
export function summarizeFreeText(extraction) {
  const out = {
    format_dislikes: [], format_only: [], max_price: null, price_sensitivity: null, sensitivities: [], positive_product_history: [],
    inferred_preferences: [], explicit_allergies: [], reaction_history: [], leave_out: [], should_be: [], mentioned_needs: [],
    stored: [], source: 'user_free_text',
  };
  for (const it of extraction?.items || []) {
    if (it.confidence === 'LOW') { out.stored.push(it); continue; }
    const w = freeTextWeight(it.confidence);
    switch (it.field) {
      case 'format_dislikes': it.value.forEach((v) => out.format_dislikes.push({ id: v, weight: w })); break;
      case 'format_only': it.value.forEach((v) => out.format_only.push({ id: v, weight: w })); break;
      case 'max_price': out.max_price = { value: it.value, weight: w }; break;
      case 'price_sensitivity': out.price_sensitivity = { value: it.value, weight: w }; break;
      case 'sensitivities': it.value.forEach((v) => out.sensitivities.push({ id: v, weight: w })); break;
      case 'inferred_preferences': it.value.forEach((v) => out.inferred_preferences.push({ id: v, weight: w })); break;
      case 'positive_product_history': out.positive_product_history.push({ name: it.value, weight: w }); break;
      case 'explicit_allergy': out.explicit_allergies.push({ id: it.value, weight: w }); break;
      case 'topical_reaction_history':
      case 'reaction_history': out.reaction_history.push({ ...it.value, kind: it.field, weight: w }); break;
      case 'leave_out_preference': out.leave_out.push({ attr: it.value, strength: 'cosmetic', weight: w }); break;
      case 'should_be_preference': out.should_be.push({ id: it.value, weight: w }); break;
      case 'mentioned_need': out.mentioned_needs.push({ id: it.value, weight: w, canonical: it.canonical }); break;
      default: out.stored.push(it);
    }
  }
  return out;
}
