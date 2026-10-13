/**
 * Text helpers for the shared search engine: normalization, tokenizing with
 * character offsets (for the squiggle overlay), light stemming, and a
 * Damerau-Levenshtein (optimal string alignment) distance with an early exit.
 */

/** Lowercase, strip accents, unify quotes/dashes. Keeps $ . - ' for prices and brand names. */
export function normalizeText(raw) {
  return String(raw ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[–]/g, '-')
    .replace(/&/g, ' and ');
}

/** Bare word form: letters/digits only (o.b. -> ob, ob-gyn -> obgyn). */
export function bareWord(word) {
  return normalizeText(word).replace(/[^a-z0-9]+/g, '');
}

const TOKEN_RE = /[\p{L}\p{N}$][\p{L}\p{N}$'.@+\-/]*/gu;

/**
 * Split raw input into word tokens with their offsets in the ORIGINAL string,
 * so a wavy underline can be drawn under exactly the characters typed.
 * @returns {{ raw: string, word: string, start: number, end: number }[]}
 */
export function tokenize(raw) {
  const text = String(raw ?? '');
  const out = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    let tok = m[0];
    // Trim trailing punctuation that is not part of the word ("cramps." /
    // "pms-"), but keep dotted initials like "o.b.".
    if (!/^(\p{L}\.)+$/u.test(tok)) tok = tok.replace(/[.'\-/+]+$/, '');
    if (!tok) continue;
    const word = normalizeText(tok).replace(/^'+|'+$/g, '');
    if (!word) continue;
    out.push({ raw: tok, word, start: m.index, end: m.index + tok.length });
  }
  return out;
}

/** Candidate base forms of a word (plural/verb endings), most likely first. */
export function stemCandidates(word) {
  const w = String(word || '');
  const out = [];
  if (w.length > 4 && w.endsWith('ies')) out.push(`${w.slice(0, -3)}y`);
  if (w.length > 4 && w.endsWith('es')) out.push(w.slice(0, -2));
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) out.push(w.slice(0, -1));
  if (w.length > 5 && w.endsWith('ing')) { out.push(w.slice(0, -3)); out.push(`${w.slice(0, -3)}e`); }
  if (w.length > 4 && w.endsWith('ed')) { out.push(w.slice(0, -2)); out.push(w.slice(0, -1)); }
  if (w.length > 4 && w.endsWith('ly')) out.push(w.slice(0, -2));
  if (w.length > 3 && !w.endsWith('s')) out.push(`${w}s`);
  return out;
}

/**
 * Damerau-Levenshtein (optimal string alignment): insert, delete, substitute,
 * and swap of two neighbouring letters each cost 1. Returns max + 1 as soon
 * as the distance is known to exceed `max` (keeps per-keystroke search fast).
 */
export function damerauDistance(a, b, max = Infinity) {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  if (!la) return lb;
  if (!lb) return la;
  let prevPrev = new Array(lb + 1).fill(0);
  let prev = new Array(lb + 1);
  let cur = new Array(lb + 1);
  for (let j = 0; j <= lb; j += 1) prev[j] = j;
  for (let i = 1; i <= la; i += 1) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= lb; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prevPrev[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    [prevPrev, prev, cur] = [prev, cur, prevPrev];
  }
  return prev[lb];
}

/** Escape a string for use inside a RegExp. */
export function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** True when `phrase` appears in `text` on word boundaries. Both already normalized. */
export function hasPhrase(text, phrase) {
  if (!phrase) return false;
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(phrase)}([^a-z0-9]|$)`).test(text);
}
