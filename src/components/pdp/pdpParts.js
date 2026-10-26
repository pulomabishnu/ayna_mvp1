/**
 * The product page, redesigned (founder, Oct 25: "easy to read and good"):
 * the pure part. Every value here comes from data that is already on the page
 * (the match engine's details, the team's who/warnings lines, the evidence
 * grade, At a glance facts). Nothing is invented; this only decides what goes
 * where. Research: scratchpad/PDP_RESEARCH.md.
 */
import { isSafetyHold, isBleedingEvaluation, whyMatch, exclusionLines, BLEEDING_EVALUATION, MATCH_UNAVAILABLE } from '../../utils/matchDisplay.js';
import { firstSentence, splitNote, splitSentences } from './sentences.js';
import { getPassport } from '../../data/passport/index.js';
import { recallFacts } from '../../utils/productFacts.js';
import { noDash } from './evidenceModel.js';
import { TYPE_WORDS } from './evidenceLevel.js';

const cap = (t) => String(t || '').replace(/^./, (c) => c.toUpperCase());
const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// ---------------------------------------------------------------------------
// The four tabs (PDP audit Oct 25, 7.16, P0): ayna summary first and open by
// default, then Clinical opinion, Scientific literature, Reviews. Names are
// unchanged; only the order moved (it was Clinical / Scientific / ayna summary
// / Reviews with the third tab open).
// ---------------------------------------------------------------------------
export const TAB_ORDER = ['summary', 'clinical', 'literature', 'reviews'];
export const DEFAULT_TAB = 'summary';
export const TAB_LABELS = { summary: 'ayna summary', clinical: 'Clinical opinion', literature: 'Scientific literature', reviews: 'Reviews' };

/** Long lists show this many, then "Show all N" in place (PDP rule 8). */
export const SHOW_FIRST = 3;

/** Split a list into what shows and what waits behind "Show all N". */
export function splitShow(list, n = SHOW_FIRST) {
  const all = (list || []).filter((x) => x != null && x !== '');
  return { shown: all.slice(0, n), rest: all.slice(n), total: all.length };
}

// ---------------------------------------------------------------------------
// The one match line under the price (founder, Oct 24): a % with its plain why,
// or a safety hold, or the bleeding evaluation message. Never 0%.
// ---------------------------------------------------------------------------
/**
 * @returns {{kind:'pct', percent:number, why:string}
 *   | {kind:'hold', hold:object}
 *   | {kind:'evaluation', note:object, text:string}
 *   | {kind:'none', text:string}
 *   | {kind:'quiz'}
 *   | null}
 */
export function matchLineState({ details = null, percent = null, hasProfile = false, why = '', fallback = '', canQuiz = false } = {}) {
  if (!hasProfile || !details || details.matchStatus === 'no-profile') return canQuiz ? { kind: 'quiz' } : null;
  if (isBleedingEvaluation(details)) return { kind: 'evaluation', note: details.bleedingEvaluation || null, text: details.bleedingEvaluation?.text || BLEEDING_EVALUATION };
  if (isSafetyHold(details) || details.eligibility === 'restricted') return { kind: 'hold', hold: details.safetyHold || null, text: MATCH_UNAVAILABLE };
  if (Number.isFinite(percent) && percent > 0) return { kind: 'pct', percent: Math.round(percent), why: why || fallback || '' };
  if (details.matchStatus === 'excluded') return { kind: 'none', text: exclusionLines(details)[0] || 'Not a fit right now' };
  return { kind: 'none', text: 'No clear match for what you told us' };
}

// ---------------------------------------------------------------------------
// "Is it for you": a checklist against her answers, from data on file only.
// ✓ yes (fits), ! check (with a clinician, a hold), ✕ no (not for).
// ---------------------------------------------------------------------------
const NOT_FOR = /^(not (for|the pick|a (good )?fit|meant|recommended|suitable|ideal)|avoid\b|skip\b|don['’]t use|do not use|isn['’]t for)/i;
export const DOC = /\b(doctor|provider|clinician|gyn(a)?ecologist|ob\/?gyn|physician|pharmacist|midwife|lactation|consult|talk to|ask your|healthcare)\b/i;
const MISS = /\b(above|over|outside|not|no|doesn.t|does not|isn.t|missing|lower|less|unknown|can.t|cannot|without)\b/i;

/**
 * @param {object} o
 * @param {object|null} o.details   the engine's details for her (null without a profile)
 * @param {string[]} o.who          the team's "who it's for" lines
 * @param {string[]} o.warnings     the product's warnings (the ones that say to check with a clinician become "!")
 * @returns {{tone:'yes'|'check'|'no', text:string, from:'match'|'hold'|'who'|'warning'}[]}
 */
export function fitChecklist({ details = null, who = [], warnings = [] } = {}) {
  const out = [];
  const seen = new Set();
  const add = (tone, text, from) => {
    const t = noDash(String(text || '')).trim();
    const k = norm(t);
    if (!t || seen.has(k)) return;
    seen.add(k);
    out.push({ tone, text: t, from });
  };
  const personal = details && details.matchStatus && details.matchStatus !== 'no-profile';
  if (personal) {
    if (isBleedingEvaluation(details)) add('check', details.bleedingEvaluation?.text || BLEEDING_EVALUATION, 'hold');
    else if (isSafetyHold(details)) add('check', details.safetyHold?.reason || MATCH_UNAVAILABLE, 'hold');
    else {
      if (details.matchStatus === 'scored') whyMatch(details).reasons.forEach((r) => add(MISS.test(r) ? 'no' : 'yes', r, 'match'));
      if (details.matchStatus === 'excluded') exclusionLines(details).forEach((r) => add('no', r, 'match'));
    }
  }
  const whoLines = (who || []).map((w) => String(w || '').trim()).filter(Boolean);
  const docs = (warnings || []).map((w) => String(w || '').trim()).filter((w) => w && DOC.test(w));
  docs.forEach((w) => add('check', w, 'warning'));
  whoLines.filter((w) => NOT_FOR.test(w)).forEach((w) => add('no', w, 'who'));
  whoLines.filter((w) => !NOT_FOR.test(w)).forEach((w) => add('yes', w, 'who'));
  // Her own results first, then the clinician checks, then who it is for and not for.
  const rank = (x) => (x.from === 'hold' ? 0 : x.from === 'match' ? 1 : x.tone === 'check' ? 2 : x.tone === 'yes' ? 3 : 4);
  return out.map((x, i) => ({ ...x, i })).sort((a, b) => rank(a) - rank(b) || a.i - b.i).map(({ i, ...x }) => x); // eslint-disable-line no-unused-vars
}

// ---------------------------------------------------------------------------
// Evidence meter: the existing grade (evidenceLevel) drawn as 3 bars + a word.
// No grade is its own state, never an empty bar that reads as "bad".
// ---------------------------------------------------------------------------
export function evidenceMeter(ev) {
  const level = Math.max(0, Math.min(3, Number(ev?.level) || 0));
  if (!level) return { level: 0, of: 3, empty: true, label: 'No checked research yet', note: '' };
  const need = ev.need ? ` for ${ev.need}` : '';
  let label = ev.word || '';
  if (ev.scope === 'type') {
    // "Good evidence for this type of product for period cramps · not studied as this exact product" (founder, Oct 25).
    const raw = Math.max(1, TYPE_WORDS.indexOf(ev.word));
    label = `${['', 'Limited', 'Some', 'Good'][raw]} evidence for this type of product${need} · not studied as this exact product`;
  } else if (ev.scope === 'product') label = `${ev.word}${need}`;
  else if (ev.scope === 'team') label = `${ev.word}${need} (the team’s rating, not yet checked)`;
  const note = ev.scope === 'type' ? (ev.line || '') : ev.scope === 'team' ? 'The level the team recorded. Not yet checked against .gov health sources.' : 'Graded by ayna from .gov health sources.';
  return { level, of: 3, empty: false, label, need: '', note };
}

// ---------------------------------------------------------------------------
// At a glance: 4-6 tiles, each a label and one big value (+ a small note).
// ---------------------------------------------------------------------------
export function glanceTiles({ glance = null, m = null } = {}) {
  if (!m) return [];
  const factOf = (id) => (glance?.facts || []).find((f) => f.id === id && !f.unknown && f.value);
  const howText = m.how ? [m.how.intro, ...m.how.steps].join(' ') : '';
  const wear = howText.match(/\b(?:up to|every|for up to|for)\s+\d+(?:\s*(?:to|-|–)\s*\d+)?\s*hours?\b/i);
  const tiles = [
    factOf('format') && { id: 'format', icon: 'format', label: 'Format', value: factOf('format').value },
    factOf('size') && String(factOf('size').value).length <= 60 && { id: 'size', icon: 'size', label: 'Size or count', value: factOf('size').value },
    factOf('perunit') && { id: 'perunit', icon: 'tag', label: 'Price per unit', value: factOf('perunit').value },
    factOf('fsa')?.value === 'Eligible' && { id: 'fsa', icon: 'card', label: 'FSA/HSA', value: 'Eligible' },
    m.safety.fda && { id: 'reg', icon: 'regulator', label: m.isDigital ? 'Regulation' : 'FDA status', value: m.safety.fda.label },
    !m.safety.fda && m.isDigital && m.safety.fdaRaw && m.safety.fdaRaw.length <= 60 && { id: 'reg', icon: 'regulator', label: 'Regulation', value: m.safety.fdaRaw },
    wear && { id: 'wear', icon: 'clock', label: 'How long it lasts', value: cap(wear[0]), note: 'From the instructions' },
    (m.details.platform || m.details.integrations.length > 0) && { id: 'works', icon: 'format', label: 'Works with', value: [m.details.platform, ...m.details.integrations].filter(Boolean).join(', ') },
  ].filter(Boolean).slice(0, 6);
  return tiles.map((t) => {
    const dot = String(t.value).split(/\s+·\s+/);
    if (dot.length > 1) return { ...t, main: cap(dot[dot.length - 1]), note: [cap(dot.slice(0, -1).join(', ')), t.note].filter(Boolean).join('. ') };
    const sp = splitNote(noDash(t.value));
    return { ...t, main: sp.value, note: [cap(sp.note), t.note].filter(Boolean).join('. ') };
  });
}

// ---------------------------------------------------------------------------
// The short answer: 3 bullets max. The team's own short take when there is
// one; otherwise what it is (first sentence), how strong the evidence is, and
// who it is for (first line), all existing text.
// ---------------------------------------------------------------------------
export function leadSentence(product) {
  return firstSentence(noDash(String(product?.summary || '').replace(/\s*\(see [^()]+\)/i, '')), { min: 20, max: 420 });
}

export function shortAnswer({ m = null, lead = '', ev = null } = {}) {
  if (!m) return { bullets: [], rest: [], fromTeam: false };
  if (m.expert.short.length) {
    return { bullets: m.expert.short.slice(0, 3), rest: m.expert.short.slice(3), fromTeam: true };
  }
  const out = [];
  if (lead) out.push(lead);
  const evLine = ev?.scope === 'type' && ev.line ? ev.line : '';
  if (evLine) out.push(evLine);
  const forLine = (m.who || []).find((w) => !NOT_FOR.test(String(w)));
  if (forLine && out.length < 3) out.push(forLine);
  return { bullets: out.slice(0, 3), rest: [], fromTeam: false };
}

// ---------------------------------------------------------------------------
// Safety: the one critical line for the box near the top (recall, the
// product's safety note, a pregnancy caution, the first real warning), and
// the single most important caution for the summary.
// ---------------------------------------------------------------------------
export function pageRecall(product) {
  const live = getPassport(product)?.recall;
  if (live?.status === 'recalled') return { status: 'past', label: 'Active recall found', detail: '' };
  return recallFacts(product);
}

const TIP = /^(wash|rinse|boil|clean|store|keep it|dry|sanitize|sterili[sz]e|empty)\b/i;

// Warnings about death, poisoning, overdose, children or "never" outrank a label's "ask a doctor if pregnant" line.
export const SEVERE = /\b(fatal|death|die|poison(ing)?|overdose|children|child|infant|never)\b/i;
/** True when her answers say pregnant, trying to conceive or postpartum (then pregnancy cautions lead). */
export function pregnancyFirstFrom(answers) {
  const i = answers?.fullHealthIntake || answers || {};
  const text = [...(i.lifeStageSelections || []), ...(i.supportSelections || []), i.pregnancyTrimester, i.ttcDuration, i.postpartumTiming].filter(Boolean).join(' ');
  return /pregnan|conceive|ttc|fertility|postpartum|breastfeed/i.test(text);
}

export function topWarningFor(product, glance, recall = pageRecall(product), { pregnancyFirst = false } = {}) {
  if (!product) return '';
  const first = (t) => {
    // A long note becomes its headline ("2021 lawsuit, later dropped"); the full story is in Safety.
    const one = firstSentence(t, { min: 8, max: 400 }).replace(/\s*—\s*/g, ', ').trim();
    const colon = one.indexOf(':');
    if (one.length > 100 && colon > 8 && colon <= 70) return `${one.slice(0, colon)}.`;
    return one.length > 120 ? firstSentence(one, { max: 120 }) : one;
  };
  if (recall?.status === 'past' || recall?.status === 'note') return first(recall.detail || recall.label);
  if (glance?.alert) return first(glance.alert);
  const preg = getPassport(product)?.safety?.pregnancy;
  const pv = preg?.known && !preg.notApplicable ? (Array.isArray(preg.value) ? preg.value.join(', ') : String(preg.value || '')) : '';
  const pregLine = pv && /not|avoid|consult|ask|doctor|clinician|don.t|do not|unsafe|caution/i.test(pv) ? `Pregnancy: ${firstSentence(pv, { min: 8, max: 200 })}`.replace(/^Pregnancy:\s*Brand:\s*(.*?)\.?$/i, 'Pregnancy: $1 (per the brand).') : '';
  const real = (product.warnings || []).filter((x) => x && !TIP.test(String(x).trim()));
  const severe = real.find((x) => SEVERE.test(String(x)));
  // Pregnancy leads only when she is pregnant, trying to conceive or postpartum; otherwise a severe warning does.
  if (pregLine && pregnancyFirst) return pregLine;
  if (severe) return first(severe);
  if (pregLine) return pregLine;
  return real[0] ? first(real[0]) : '';
}

/** The most important caution for "The short answer", not the one already in the safety box. */
export function mainCaution(m, topWarning = '') {
  if (!m) return '';
  const top = norm(topWarning);
  const same = (t) => top && (norm(t) === top || norm(t).startsWith(top.replace(/ $/, '')) || top.startsWith(norm(t)));
  const real = m.safety.warnings.filter((w) => !TIP.test(String(w).trim()));
  // Clinician checks already show in Is it for you, so the summary's caution is the first other real warning (else a clinician check).
  const pick = [...real.filter((w) => !DOC.test(w)), ...real.filter((w) => DOC.test(w))].find((w) => !same(w));
  return pick || '';
}

// ---------------------------------------------------------------------------
// Sources, strongest first: graded rows (A, B, C), then systematic reviews and
// meta-analyses, trials, other study types, then guidance pages. A study that
// found no clear benefit keeps its flag.
// ---------------------------------------------------------------------------
export function studyRank(s) {
  const t = `${s?.type || ''} ${s?.title || ''}`.toLowerCase();
  if (/meta-?analys|systematic review/.test(t)) return 0;
  if (/randomi[sz]ed|controlled trial|\brct\b|clinical trial/.test(t)) return 1;
  if (/cohort|observational|study/.test(t)) return 2;
  if (/review/.test(t)) return 3;
  return 4;
}

export function sortSources(list) {
  return (list || []).map((s, i) => ({ s, i })).sort((a, b) => studyRank(a.s) - studyRank(b.s) || (Number(b.s.year) || 0) - (Number(a.s.year) || 0) || a.i - b.i).map((x) => x.s);
}

/** A named clinician (who, credential) from the team's attribution line, or null for an ayna synthesis. */
export function clinicianOf(expert) {
  if (!expert || expert.synthesis || !expert.attribution) return null;
  const a = String(expert.attribution);
  const name = a.match(/\bDr\.?\s+[A-Z][\w'’-]+(?:\s+[A-Z][\w'’-]+){0,2}/);
  const cred = a.match(/\b(MD|DO|NP|RN|PA-C|CNM|PharmD|MPH|PhD|FACOG|OB-?GYN|IBCLC)\b(?:,\s*(?:MD|DO|NP|RN|PA-C|CNM|PharmD|MPH|PhD|FACOG|OB-?GYN|IBCLC)\b)*/);
  return { who: name ? name[0] : '', credential: cred ? cred[0] : '', line: a };
}

// ---------------------------------------------------------------------------
// Oct 25 rework (founder: "organized horribly"): one reading column, each
// fact once. Who it's for = ✓ rows (her reasons, then the team's lines),
// Not for = ✕ rows. Clinician checks belong to Safety, not here.
// ---------------------------------------------------------------------------
export function whoLists({ details = null, who = [] } = {}) {
  const items = fitChecklist({ details, who, warnings: [] }).filter((x) => x.from !== 'hold');
  return { yes: items.filter((x) => x.tone === 'yes').map((x) => x.text), no: items.filter((x) => x.tone === 'no').map((x) => x.text) };
}

const FORM_WORD = /\b(capsules?|softgels?|tablets?|gummies|powder|tea|drink mix|liquid|tincture|spray|mist|gel|cream|oil|balm|lotion|serum|wash|cleanser|wipes?|suppositor(?:y|ies)|patch(?:es)?|roll-on)\b/i;
/** What the product physically is, for Key facts ("Tablets", "Portable heating pad", "Digital service"), never its shop category. */
export function keyFormat(product, brand = '') {
  if (!product) return '';
  if (product.type === 'digital') return product.category === 'telehealth' ? 'Virtual care service' : 'Digital service';
  const m = `${product.name || ''} ${product.price || ''}`.match(FORM_WORD);
  if (m) return cap(m[1].toLowerCase().replace(/^capsule$/, 'capsules').replace(/^softgel$/, 'softgels').replace(/^tablet$/, 'tablets'));
  let name = String(product.name || '').replace(/\s*[,(].*$/, '').trim();
  const b = String(brand || product.brand || '').trim();
  if (b && name.toLowerCase().startsWith(b.toLowerCase() + ' ')) name = name.slice(b.length + 1);
  return cap(name.toLowerCase());
}

/** Index of the safety item the hero line echoes (its text starts with, or contains, the hero line). */
export function criticalIndex(texts, topWarning) {
  const t = norm(topWarning).replace(/^pregnancy /, '');
  if (!t) return -1;
  return (texts || []).findIndex((x) => { const n = norm(x).replace(/^pregnancy /, ''); return n && (n.startsWith(t.slice(0, 40)) || t.startsWith(n.slice(0, 40)) || n.includes(t.slice(0, 40))); });
}

// ---------------------------------------------------------------------------
// Oct 25, shopper pass
// ---------------------------------------------------------------------------
const SPEC = /^\s*(\d[\d.,]*\s*(mg|mcg|µg|iu|g|ml|mL|oz|%)\b|\d+\s*(count|ct|pack|capsules?|tablets?|softgels?))/i;
/** The one-liner: the summary's first sentence, unless it is a spec ("65 mg elemental iron…"), which becomes Key facts "Strength". */
const CLAIM = /^(supports?|helps?|promotes?|boosts?|improves?|relieves?|reduces?|balances?|soothes?|eases?|restores?|strengthens?|protects?|enhances?|maintains?|nourishes?|calms?)\b/i;
/** A one-liner that is a benefit claim from the brand's copy reads as the brand's ("Nature Made says it supports…"), never as ayna's verdict. */
export function brandVoice(lead, brand) {
  const t = String(lead || '').trim();
  if (!t || !CLAIM.test(t)) return t;
  return `${String(brand || '').trim() || 'The brand'} says it ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
}

export function splitLead(product) {
  const parts = splitSentences(noDash(String(product?.summary || '').replace(/\s*\(see [^()]+\)/i, '')));
  if (parts.length > 1 && SPEC.test(parts[0])) return { strength: parts[0], lead: parts[1], used: `${parts[0]} ${parts[1]}` };
  const lead = firstSentence(noDash(String(product?.summary || '').replace(/\s*\(see [^()]+\)/i, '')), { min: 20, max: 420 });
  return { strength: '', lead, used: lead };
}

/** Hero price notes: units, sizes and pricing terms stay by the price; a feature word ("rechargeable") moves to Key facts. */
export function heroNotes(notes = []) {
  const keep = []; const moved = [];
  for (const n of notes) (/\d|scale|per |month|year|visit|day|pack|count|supply|free|insurance|subscription|eligible|prescription|online|at home|program/i.test(n) ? keep : moved).push(n);
  return { keep, moved };
}

/** "Cramp & pain relief, Cramps" -> "Cramp & pain relief": one entry per first word (plural or not). */
export function dedupeList(text) {
  const items = String(text || '').split(/,\s*/).map((x) => x.trim()).filter(Boolean);
  const seen = new Set();
  return items.filter((x) => { const k = x.toLowerCase().split(/[\s&/]+/)[0].replace(/s$/, ''); if (seen.has(k)) return false; seen.add(k); return true; }).join(', ');
}

/**
 * Full text, scannable (founder, Oct 26): a long item splits at its first
 * natural break (after the first comma or colon, or before "who", "like",
 * "since", "once" or "("). Returns [lead, rest] with every character kept
 * (only the space at the break moves), or ['', text] for a short item
 * (under 12 words) or one with no break that leaves a 3+ word lead.
 */
export function leadClause(text, minWords = 12) {
  const t = String(text || '');
  if (t.trim().split(/\s+/).length < minWords) return ['', t];
  // Only at a clause boundary (", who", ", which", ", like", ", once", ", since", ":" or " ("),
  // never inside an adjective list, and only when the lead is 4+ words. Unsure: no split.
  const m = t.match(/^(.*?)(,(?=\s+(?:who|which|like|once|since)\b)|:(?=\s)|\s(?=\())/);
  if (!m) return ['', t];
  const lead = m[1] + (m[2].trim() ? m[2] : '');
  const rest = t.slice(m[0].length).replace(/^\s+/, '');
  if (lead.trim().split(/\s+/).length < 4 || !rest) return ['', t];
  return [lead, rest];
}

// ---------------------------------------------------------------------------
// Safety facts panel (founder, Oct 26, after the FDA OTC "Drug Facts" label,
// 21 CFR 201.66): fixed groups in a fixed order, each item verbatim. A
// deterministic keyword mapper puts every existing safety item in a group;
// unmatched items go to "When using it".
// ---------------------------------------------------------------------------
export const SAFETY_GROUPS = [
  { id: 'children', title: 'Keep away from children' },
  { id: 'donot', title: 'Do not use if' },
  { id: 'ask', title: 'Ask a clinician first if' },
  { id: 'preg', title: 'Pregnancy and breastfeeding' },
  { id: 'when', title: 'When using it' },
  { id: 'stop', title: 'Stop and get help if' },
  { id: 'label', title: 'Recalls and label notes' },
];
const G_CHILD = /\b(child|children|kids?|infants?|toddlers?|out of reach|overdose|poison(ing)?)\b/i;
const G_PREG = /\b(pregnan\w*|breast-?feed\w*|nursing|lactat\w*)\b/i;
const G_STOP = /\b(stop (using|use|taking)|seek (medical|immediate|emergency)|get (medical )?help|call (911|your|a)\b|emergency|go to (an?|the) (er|emergency))/i;
const G_DONOT = /^(do not|don['’]t|never|not for|avoid)\b|\b(should not|must not|do not) (use|take)\b/i;
const G_ASK = /\b(doctor|provider|clinician|gyn(a)?ecologist|ob\/?gyn|physician|pharmacist|midwife|consult|talk to|ask your|healthcare|if you (have|take|are taking)|medicines?|medications?)\b/i;

/**
 * @param {string} text the item's words
 * @param {string} kind where it came from: 'preg-row' (Pregnancy / Breastfeeding label rows), 'med-row',
 *   'avoid' (skip if you react to), 'side' (side effects), 'allergens', 'recall', 'privacy', 'addition', or '' for a warning / note
 */
export function safetyGroupOf(text, kind = '') {
  if (kind === 'preg-row') return 'preg';
  if (kind === 'med-row') return 'ask';
  if (kind === 'avoid') return 'donot';
  if (kind === 'side') return 'when';
  if (['allergens', 'recall', 'privacy', 'addition'].includes(kind)) return 'label';
  const t = String(text || '');
  if (G_CHILD.test(t)) return 'children';
  if (G_PREG.test(t)) return 'preg';
  if (G_STOP.test(t)) return 'stop';
  if (G_DONOT.test(t)) return 'donot';
  if (G_ASK.test(t)) return 'ask';
  return 'when';
}

/** Items grouped in the fixed order; a group over 6 items is split into visible sub-groups of up to 6 (never cut). */
export function groupSafety(items) {
  return SAFETY_GROUPS.map((g) => {
    const list = items.filter((x) => x.group === g.id);
    const chunks = [];
    for (let i = 0; i < list.length; i += 6) chunks.push(list.slice(i, i + 6));
    return { ...g, items: list, chunks };
  }).filter((g) => g.items.length);
}
