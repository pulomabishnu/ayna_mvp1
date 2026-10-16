// Toolbar helper for the announcement composer (see richText.jsx for the format).
/** Wraps the textarea selection in markers (or prefixes the selected lines for lists). */
export function applyFormat(el, value, kind) {
  const start = el?.selectionStart ?? value.length;
  const end = el?.selectionEnd ?? value.length;
  const sel = value.slice(start, end);
  if (kind === 'ul' || kind === 'ol') {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const block = value.slice(lineStart, end) || '';
    const lines = (block || '').split('\n');
    const out = lines.map((l, i) => (kind === 'ul' ? `- ${l.replace(/^\s*[-•]\s+/, '')}` : `${i + 1}. ${l.replace(/^\s*\d+[.)]\s+/, '')}`)).join('\n');
    const next = value.slice(0, lineStart) + out + value.slice(end);
    return { value: next, start: lineStart, end: lineStart + out.length };
  }
  const mark = kind === 'bold' ? '**' : kind === 'underline' ? '__' : '*';
  const inner = sel || (kind === 'bold' ? 'bold text' : kind === 'underline' ? 'underlined text' : 'italic text');
  const next = value.slice(0, start) + mark + inner + mark + value.slice(end);
  return { value: next, start: start + mark.length, end: start + mark.length + inner.length };
}
