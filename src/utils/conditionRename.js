/**
 * PCOS is now PMOS (Ameera, Oct 20 2026). Polycystic ovary syndrome was
 * renamed polyendocrine metabolic ovarian syndrome (PMOS) in The Lancet,
 * May 2026. ayna says PMOS everywhere people read: website, app, AI replies,
 * SMS, emails.
 *
 * renamePcos() is the one rewrite used by:
 *   - the page-wide text net (src/utils/noEmDashDom.js), for anything that
 *     arrives at runtime: catalog rows, saved answers, community posts;
 *   - every model reply (api/_llm.js) and SMS / email copy.
 *
 * What it never touches:
 *   - URLs and paths (…/pcos/…, …polycystic-ovary-syndrome-pcos…), so links
 *     keep working;
 *   - subreddit names (r/PCOS is that community's real name);
 *   - identifiers (condition_support.pcos, PCOS_REINFORCING_NEEDS, pcos-basics)
 *     because only whole words are matched;
 *   - "polycystic ovaries" (an ultrasound finding, not the syndrome's name).
 *
 * Internal ids and saved answers ('pcos', 'PCOS symptoms') stay as they are
 * so nobody's profile breaks; people only ever see the new name. Search
 * accepts both: typing "pmos" or "pcos" finds the same things
 * (src/data/searchSynonyms.js, src/matching/ontology.js).
 */
export const PMOS_SHORT = 'PMOS';
export const PMOS_FULL = 'polyendocrine metabolic ovarian syndrome';

const QUICK = /pcos|polycystic ovar(?:y|ian) syndrome/i;
// Pieces of text that must stay verbatim: links, bare domains, paths, r/ names.
const PROTECTED = /(?:\bhttps?:\/\/|\bwww\.)\S+|\br\/[A-Za-z0-9_]+|[A-Za-z0-9_.-]*\/[A-Za-z0-9_./-]*pcos[A-Za-z0-9_./-]*|\b[a-z0-9-]+\.(?:com|org|gov|net|co|edu|io|uk)\/\S*/gi;

function matchCase(source, replacement) {
  if (source === source.toUpperCase() && /[A-Z]/.test(source)) return replacement.toUpperCase();
  if (/^[A-Z]/.test(source)) {
    // "Polycystic Ovary Syndrome" (title case) -> "Polyendocrine Metabolic Ovarian Syndrome"
    const words = source.split(/\s+/);
    if (words.length > 1 && words.every((w) => /^[A-Z]/.test(w))) {
      return replacement.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function renamePlain(text, lowercase) {
  let out = text
    .replace(/polycystic ovar(?:y|ian) syndrome/gi, (m) => matchCase(m, PMOS_FULL))
    // Whole word only (\b treats _ as a word character, so PCOS_FLAGS and
    // condition_support.pcos never match; a leading "." or "#" is checked below).
    .replace(/(^|[^A-Za-z0-9_.$#@/-])(PCOS|Pcos|pcos)(?![A-Za-z0-9_$])(-?)/g, (all, pre, word, dash) => {
      // A lowercase "pcos-…" is a slug or id (pcos-basics, pcos-management).
      if (word === 'pcos' && (dash || !lowercase)) return all;
      const next = word === 'PCOS' ? 'PMOS' : word === 'Pcos' ? 'Pmos' : 'pmos';
      return pre + next + dash;
    })
    // Hashtags read as words: #pcos -> #pmos
    .replace(/#(PCOS|Pcos|pcos)(?![A-Za-z0-9_])/g, (all, word) => (word === 'pcos' && !lowercase ? all : `#${word === 'PCOS' ? 'PMOS' : word === 'Pcos' ? 'Pmos' : 'pmos'}`));
  // Text that already named both ("PCOS/PMOS", "PCOS (PMOS)") now says it twice.
  out = out
    .replace(/\bPMOS\s*\/\s*PMOS\b/g, 'PMOS')
    .replace(/\bPMOS\s*\(\s*PMOS\s*\)/g, 'PMOS')
    .replace(/\bPMOS,? (?:or|aka|also called|now called|now also called) PMOS\b/gi, 'PMOS');
  return out;
}

/**
 * `lowercase: false` leaves the all-lowercase word "pcos" alone. Use it for
 * machine output (model JSON), where "pcos" is usually an id or tag the code
 * matches on; only the capitalized name and the full name are renamed there.
 */
export function renamePcos(text, { lowercase = true } = {}) {
  if (typeof text !== 'string' || !QUICK.test(text)) return text;
  let out = '';
  let last = 0;
  PROTECTED.lastIndex = 0;
  let m;
  while ((m = PROTECTED.exec(text))) {
    out += renamePlain(text.slice(last, m.index), lowercase) + m[0];
    last = m.index + m[0].length;
    if (m[0].length === 0) PROTECTED.lastIndex += 1;
  }
  return out + renamePlain(text.slice(last), lowercase);
}

/** Deep version for JSON-ish values (model replies parsed to objects). Keys are left alone. */
export function renamePcosDeep(value, opts) {
  if (typeof value === 'string') return renamePcos(value, opts);
  if (Array.isArray(value)) return value.map((v) => renamePcosDeep(v, opts));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = renamePcosDeep(v, opts);
    return out;
  }
  return value;
}
