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

import { canonicalize, canonicalizeAll, normalizeText, confidenceBand } from './ontology.js';
import { findMedicationsInText } from './medications.js';

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

// First-person, certain life-stage statements. Questions, guesses and
// negations ("could this be menopause", "not pregnant") are not reports.
const STAGE_WORDS = [
  { re: /peri ?menopaus\w*|\bperi\b/, id: 'perimenopause' },
  { re: /post ?menopaus\w*/, id: 'postmenopause' },
  { re: /menopaus\w*/, id: 'menopause' },
  { re: /pregnan\w*|\d+ weeks? pregnant|expecting/, id: 'pregnant' },
  { re: /postpartum|just had (a|my) baby/, id: 'postpartum' },
  { re: /breastfeeding|nursing|pumping/, id: 'breastfeeding' },
];
function reportedStage(s) {
  if (/\b(maybe|might|could|wonder|wondering|think|probably|possibly|if i|whether|not sure|worried|scared|afraid|planning|plan to|want to get|hoping)\b/.test(s)) return null;
  for (const w of STAGE_WORDS) {
    const src = w.re.source;
    const first = new RegExp(`\\b(i am|im|i have been|currently|going through|now)\\s+(in\\s+|in my\\s+|going through\\s+)?(${src})`);
    const attributed = new RegExp(`\\b(from|because of|due to|since|with|during|thanks to)\\s+(my\\s+|the\\s+)?(${src})`);
    const possessive = new RegExp(`\\bmy\\s+(${src})`);
    const hit = s.match(first) || s.match(attributed) || s.match(possessive);
    if (!hit) continue;
    const before = s.slice(Math.max(0, hit.index - 12), hit.index);
    if (/\bnot\b|\bno\b|\bnever\b/.test(before) || /\b(i am|currently) not\b/.test(s)) return null;
    return w.id;
  }
  return null;
}

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
    m = s.match(/\b(avoid|no|without|free of|prefer not|hate|do not (want|like)|nothing|not anything|cannot (use|stand|do))\b\s+(anything\s+|any\s+|products? with\s+)?(fragrance|dyes?|parabens?|sulfates?|phthalates?|latex|added sugar|artificial sweeteners?)\b/);
    if (m) m = [m[0], m[1], m[5]];
    if (!m && /\b(fragrance[- ]free|unscented|no scents?|nothing scented|anything scented|hate (the )?(smell of )?(scented|perfumed)|scented (stuff|things|products)( irritate| bother)?)\b/.test(s)) m = [s, 'no', 'fragrance'];
    if (!m && /\b(dye[- ]free)\b/.test(s)) m = [s, 'no', 'dyes'];
    if (!m && /\bparaben[- ]free\b/.test(s)) m = [s, 'no', 'parabens'];
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

    // Mentioned needs: every one in the sentence, not just the first
    // ("bloating before my period and acne on my jaw" = both). Negated
    // mentions ("no cramps") are skipped by canonicalizeAll.
    for (const need of canonicalizeAll(s, { kinds: ['need'] })) {
      if (!['synonym_rule', 'lexicon', 'exact_option'].includes(need.method)) continue;
      const band = need.contextual_only || need.specificity === 'low' ? 'LOW' : confidenceBand(need.confidence);
      for (const id of [need.canonical_id, ...(need.also || [])]) items.push(item('mentioned_need', id, band, s, { canonical: { ...need, canonical_id: id, raw_user_text: s }, care: need.care || null }));
    }
    // A diagnosis she names in the first person ("I have Hashimoto's",
    // "diagnosed with endo"). A statement, like an explicit allergy. Never
    // a guess: "maybe PCOS?" or "worried I have endo" is not a diagnosis.
    if (/\b(i have|i ve got|i have got|i was diagnosed|i got diagnosed|diagnosed with|i live with|i am living with|i have been diagnosed)\b/.test(s)
      && !/\b(maybe|might|could|think|wonder|worried|scared|afraid|not sure|suspect|possibly|probably|if i)\b/.test(s)) {
      for (const c of canonicalizeAll(s, { kinds: ['condition'] })) if (c.confidence >= 0.9) items.push(item('explicit_condition', c.canonical_id, 'HIGH', s, { canonical: c }));
    }
    // Medicines and supplements she says she takes ("I'm on Lexapro"), for
    // interaction checks. Stopped or past use is ignored.
    if (/\b(i (am )?(take|taking|on)|i use|currently on|i started|prescribed)\b/.test(s) && !/\b(stopped|quit|used to|no longer|came off|went off)\b/.test(s)) {
      for (const med of findMedicationsInText(s)) items.push(item('mentioned_medication', med, 'HIGH', s));
    }
    const stage = canonicalize(s, { kinds: ['life_stage'] });
    if (stage.canonical_id && stage.method === 'synonym_rule') {
      // A life stage typed in prose is stored. Only a first-person, certain
      // statement ("I am in perimenopause", "my night sweats from menopause")
      // becomes a REPORTED CONTEXT (HIGH), which can unlock contextual product
      // matches. It never activates a safety exclusion by itself.
      const reported = reportedStage(s);
      if (reported) items.push(item('reported_context', reported, 'HIGH', s, { canonical: stage }));
      else items.push(item('mentioned_life_stage', stage.canonical_id, 'LOW', s, { canonical: stage }));
    }

    // Lifestyle constraints that affect usage effort (stored as a soft signal).
    if (/\b(no time|busy|travel a lot|always traveling|on the go|hate routines?|forget to take|keep forgetting|too many steps)\b/.test(s)) {
      items.push(item('effort_sensitivity', 'lower_effort', 'MEDIUM', s));
    }
    // Favorite brands in prose ("my favorite brand is Saalt") are positive history above;
    // brand dislikes are stored only and never become an absolute avoid.
    m = s.match(/\b(hate|do not like|dislike|never again|stay away from)\b\s+(the\s+)?([a-z0-9][a-z0-9.'&-]{2,30})\s+(brand|products?)\b/);
    if (m) items.push(item('brand_dislike', m[3], 'LOW', s));

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
    reported_contexts: [], effort_sensitivity: null, explicit_conditions: [], mentioned_medications: [], care_terms: [], stored: [], source: 'user_free_text',
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
      case 'mentioned_need': out.mentioned_needs.push({ id: it.value, weight: w, canonical: it.canonical }); if (it.care) out.care_terms.push(it.evidence); break;
      case 'explicit_condition': out.explicit_conditions.push({ id: it.value, weight: w, evidence: it.evidence }); break;
      case 'mentioned_medication': out.mentioned_medications.push({ raw: it.value, weight: w, evidence: it.evidence }); break;
      case 'reported_context': out.reported_contexts.push({ stage: it.value, weight: w, evidence: it.evidence }); break;
      case 'effort_sensitivity': out.effort_sensitivity = { value: it.value, weight: w }; break;
      default: out.stored.push(it);
    }
  }
  return out;
}
