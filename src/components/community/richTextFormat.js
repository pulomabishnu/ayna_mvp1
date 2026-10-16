// Editor helper for the announcement composer (see richText.jsx for the format).
/**
 * Turns the doc-style editor's DOM into the stored text format:
 * <b>/<strong> → **x**, <u> → __x__, <i>/<em> → *x*, list items → "- " / "1. ",
 * each block on its own line. Only reads text; never keeps HTML.
 */
export function serializeEditor(root) {
  const wrap = (mark, inner) => {
    const t = inner.replace(/\n+$/, '');
    if (!t.trim()) return inner;
    const lead = t.match(/^\s*/)[0];
    const trail = t.match(/\s*$/)[0];
    return `${lead}${mark}${t.trim()}${mark}${trail}`;
  };
  const walk = (node, depth = 0) => {
    let out = '';
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) { out += n.textContent.replace(/\u00a0/g, ' ').replace(/\n/g, ' '); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName.toLowerCase();
      const bold = tag === 'b' || tag === 'strong' || /bold|[6-9]00/.test(n.style?.fontWeight || '');
      if (tag === 'br') { out += '\n'; return; }
      if (tag === 'ul' || tag === 'ol') {
        if (out && !out.endsWith('\n')) out += '\n';
        let k = 0;
        n.childNodes.forEach((li) => {
          if (li.nodeType !== 1) return;
          if (li.tagName.toLowerCase() === 'li') {
            k += 1;
            const body = walk(li, depth + 1).replace(/\n+/g, ' ').trim();
            out += `${'  '.repeat(depth)}${tag === 'ul' ? '- ' : `${k}. `}${body}\n`;
          } else out += walk(li, depth + 1);
        });
        return;
      }
      if (tag === 'div' || tag === 'p') {
        if (out && !out.endsWith('\n')) out += '\n';
        const inner = walk(n, depth);
        out += inner.endsWith('\n') ? inner : `${inner}\n`;
        return;
      }
      const inner = walk(n, depth);
      if (bold) out += wrap('**', inner);
      else if (tag === 'u') out += wrap('__', inner);
      else if (tag === 'i' || tag === 'em') out += wrap('*', inner);
      else out += inner;
    });
    return out;
  };
  return walk(root).replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').replace(/^\n+|\s+$/g, '');
}
