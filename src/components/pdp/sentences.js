// Split text into sentences without breaking on "v.", "Dr.", "U.S." or a
// question mark inside quotes ("...what's in a tampon?" and neither...).
const ABBR = /(?:\b(?:v|vs|Dr|Mr|Mrs|Ms|St|No|Inc|Co|Ltd|approx|e\.g|i\.e|etc|U\.S|Jr|Sr|Fig|al)\.|\b[A-Z]\.)$/;

export function splitSentences(text) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return [];
  const out = [];
  let start = 0;
  const re = /[.!?]+["'”’)\]]*(?=\s+|$)/g;
  let m;
  while ((m = re.exec(s))) {
    const end = m.index + m[0].length;
    const chunk = s.slice(start, end);
    const after = s.slice(end).trimStart();
    // Not a real end: an abbreviation, or the next word starts lower case.
    if (ABBR.test(s.slice(start, m.index + 1)) || (after && /^[a-z]/.test(after))) continue;
    out.push(chunk.trim());
    start = end;
  }
  if (start < s.length && s.slice(start).trim()) out.push(s.slice(start).trim());
  return out.filter(Boolean);
}

/** The first sentence (or two, if the first is very short), capped in length. */
export function firstSentence(text, { min = 20, max = 240 } = {}) {
  const parts = splitSentences(String(text || '').replace(/^⚠️?\s*/, ''));
  if (!parts.length) return '';
  let lead = parts[0];
  if (lead.length < min && parts[1]) lead = `${lead} ${parts[1]}`;
  if (lead.length > max) {
    const cut = lead.slice(0, max);
    lead = `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '')}…`;
  }
  return lead;
}
