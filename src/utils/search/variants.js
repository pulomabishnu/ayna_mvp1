/**
 * Programmatic misspellings for important terms, on top of the hand-written
 * list in src/data/searchSynonyms.js: dropped letters, swapped neighbours,
 * doubled letters, QWERTY-neighbour slips and common sound-alike swaps.
 * The engine only keeps a generated variant when it is not itself a real
 * word, so "pads" never turns into a typo of something else.
 */

const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const NEIGHBOURS = (() => {
  const map = {};
  KEYBOARD_ROWS.forEach((row, r) => {
    [...row].forEach((ch, i) => {
      const set = new Set();
      if (row[i - 1]) set.add(row[i - 1]);
      if (row[i + 1]) set.add(row[i + 1]);
      const above = KEYBOARD_ROWS[r - 1];
      const below = KEYBOARD_ROWS[r + 1];
      if (above) { if (above[i]) set.add(above[i]); if (above[i + 1]) set.add(above[i + 1]); }
      if (below) { if (below[i]) set.add(below[i]); if (below[i - 1]) set.add(below[i - 1]); }
      map[ch] = [...set];
    });
  });
  return map;
})();

const SOUND_SWAPS = [['ph', 'f'], ['f', 'ph'], ['c', 'k'], ['k', 'c'], ['s', 'z'], ['z', 's'], ['ie', 'ei'], ['ei', 'ie'], ['tion', 'shun'], ['tion', 'sion'], ['ea', 'ee'], ['ee', 'ea'], ['ou', 'o'], ['y', 'i'], ['i', 'y'], ['ck', 'k'], ['x', 'cks'], ['ae', 'e'], ['oe', 'e']];

/** All generated variants for one word (excludes the word itself). */
export function generateTypoVariants(word, { keyboard = true } = {}) {
  const w = String(word || '').toLowerCase();
  const out = new Set();
  if (w.length < 5 || !/^[a-z]+$/.test(w)) return [];
  for (let i = 0; i < w.length; i += 1) {
    // dropped letter (keep the first letter: people rarely miss it)
    if (i > 0) out.add(w.slice(0, i) + w.slice(i + 1));
    // doubled letter
    out.add(w.slice(0, i + 1) + w[i] + w.slice(i + 1));
    // swapped neighbours
    if (i < w.length - 1 && w[i] !== w[i + 1]) out.add(w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2));
    // keyboard slip (not on the first letter)
    if (keyboard && i > 0) for (const n of NEIGHBOURS[w[i]] || []) out.add(w.slice(0, i) + n + w.slice(i + 1));
  }
  // un-doubled letter ("cranbery")
  for (let i = 1; i < w.length; i += 1) if (w[i] === w[i - 1]) out.add(w.slice(0, i) + w.slice(i + 1));
  // sound-alike swaps
  for (const [from, to] of SOUND_SWAPS) {
    let idx = w.indexOf(from, 1);
    while (idx > 0) { out.add(w.slice(0, idx) + to + w.slice(idx + from.length)); idx = w.indexOf(from, idx + 1); }
  }
  // all inner vowels after the first syllable dropped once each pair ("mgnesium" style handled above; this is "magnsm")
  const noVowels = w[0] + w.slice(1).replace(/[aeiou]/g, '');
  if (noVowels.length >= 4 && noVowels !== w) out.add(noVowels);
  out.delete(w);
  return [...out].filter((v) => v.length >= 4);
}
