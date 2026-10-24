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

/**
 * "60 capsules (1 daily, or 2 before sex)" → { value: "60 capsules", note: "1 daily, or 2 before sex" }.
 * Splits at the first " (" only when the bracket closes the value, so a tile
 * shows a short bold value with the detail on a small line under it.
 */
export function splitNote(text) {
  const s = String(text || '').trim();
  const at = s.indexOf(' (');
  if (at < 1 || !s.endsWith(')')) return { value: s, note: '' };
  const inner = s.slice(at + 2, -1).trim();
  // Nested or unbalanced brackets stay as they are.
  if (!inner || /[()]/.test(inner)) return { value: s, note: '' };
  return { value: s.slice(0, at).trim(), note: inner };
}

/** Normalised text for comparing two sentences (case, quotes, spacing, end punctuation). */
const norm = (t) => String(t || '').toLowerCase().replace(/[“”"‘’']/g, '').replace(/\s+/g, ' ').replace(/[.!?…\s]+$/, '').trim();

/**
 * A paragraph without the lead sentence it starts with (the row already shows
 * that sentence). Returns '' when the paragraph was only the lead.
 */
export function stripLead(paragraph, lead) {
  const p = String(paragraph || '').trim();
  const l = norm(lead);
  if (!p || l.length < 12) return p;
  const parts = splitSentences(p);
  let used = '';
  for (let i = 0; i < parts.length; i += 1) {
    used = norm(parts.slice(0, i + 1).join(' '));
    if (used === l) return parts.slice(i + 1).join(' ').trim();
    if (used.length > l.length) break;
  }
  return p;
}

// Places a long sentence can end early and still say one whole thing.
const CLAUSE = /(?:,|;|:)\s+|\s+(?=(?:rather than|while|whereas|though|although|but|because|since|which|so that|unless|including|with)\s)/gi;

/**
 * A complete short takeaway for a folded row: the first sentence when it fits
 * in about two lines, otherwise that sentence ended at its last clause break
 * that fits. Never an ellipsis.
 */
export function shortLine(text, max = 92) {
  const first = splitSentences(String(text || ''))[0] || '';
  if (first.length <= max) return first;
  let best = 0;
  let m;
  CLAUSE.lastIndex = 0;
  while ((m = CLAUSE.exec(first))) {
    if (m.index > max) break;
    if (m.index >= 32) best = m.index;
  }
  if (!best) return first;
  return `${first.slice(0, best).replace(/[,;:\s]+$/, '')}.`;
}
