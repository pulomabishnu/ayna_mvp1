// Light formatting for team announcements, stored as plain text:
//   **bold**   __underline__   *italic*   lines starting "- " or "• " are bullets,
//   lines starting "1. " are a numbered list. Rendered as React elements only
//   (never as HTML), so nothing typed can inject markup.
import { Fragment } from 'react';

const INLINE = /(\*\*[^*\n]+?\*\*|__[^_\n]+?__|\*[^*\n]+?\*)/g;

function inline(text, keyBase) {
  return String(text).split(INLINE).map((part, i) => {
    const k = `${keyBase}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={k}>{part.slice(2, -2)}</strong>;
    if (/^__[^_]+__$/.test(part)) return <u key={k}>{part.slice(2, -2)}</u>;
    if (/^\*[^*]+\*$/.test(part)) return <em key={k}>{part.slice(1, -1)}</em>;
    return <Fragment key={k}>{part}</Fragment>;
  });
}

export function RichText({ text, className = '' }) {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  for (const line of lines) {
    const bullet = line.match(/^\s*[-•]\s+(.*)$/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const type = bullet ? 'ul' : num ? 'ol' : 'p';
    const content = bullet ? bullet[1] : num ? num[1] : line;
    const last = blocks[blocks.length - 1];
    if (type !== 'p' && last && last.type === type) last.items.push(content);
    else if (type !== 'p') blocks.push({ type, items: [content] });
    else if (!line.trim()) blocks.push({ type: 'gap' });
    else if (last && last.type === 'p') last.items.push(content);
    else blocks.push({ type: 'p', items: [content] });
  }
  return (
    <div className={`cr-rich ${className}`.trim()}>
      {blocks.map((b, i) => {
        if (b.type === 'gap') return null;
        if (b.type === 'ul' || b.type === 'ol') {
          const L = b.type;
          return <L key={i}>{b.items.map((t, j) => <li key={j}>{inline(t, `${i}-${j}`)}</li>)}</L>;
        }
        return <p key={i}>{b.items.map((t, j) => <Fragment key={j}>{j > 0 && <br />}{inline(t, `${i}-${j}`)}</Fragment>)}</p>;
      })}
    </div>
  );
}
