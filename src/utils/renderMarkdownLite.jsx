import React from 'react';

/**
 * Renders the small markdown subset Ask Ayna's LLM replies actually use
 * **bold**, *italic*, [links](url), and - / 1. lists, as real React elements. Chat
 * text used to be dumped straight into JSX as a plain string, so a reply
 * like "**Flex Cup**" showed the literal asterisks instead of bold text
 * (found live, 2026-08-24 bug bash), on both the global Ask Ayna widget and
 * the product-page Ask Ayna tab.
 *
 * Deliberately NOT a general CommonMark parser and NOT html/dangerouslySet-
 * InnerHTML, LLM output is untrusted text, and building React elements
 * directly (never parsing to an HTML string) means there's no injection
 * surface to sanitize in the first place.
 */

function renderInline(text, keyPrefix) {
  // [label](url), only http(s) links accepted; anything else renders as
  // plain text rather than becoming a live link.
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const withLinks = [];
  let lastIndex = 0;
  let match;
  let linkIndex = 0;
  while ((match = linkPattern.exec(text))) {
    if (match.index > lastIndex) withLinks.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    withLinks.push({ type: 'link', label: match[1], url: match[2], key: `${keyPrefix}-link-${linkIndex++}` });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) withLinks.push({ type: 'text', value: text.slice(lastIndex) });

  const nodes = [];
  withLinks.forEach((part, i) => {
    if (part.type === 'link') {
      nodes.push(
        <a key={part.key} href={part.url} target="_blank" rel="noopener noreferrer">{part.label}</a>
      );
      return;
    }
    nodes.push(...renderEmphasis(part.value, `${keyPrefix}-${i}`));
  });
  return nodes;
}

// ***both***, **bold** / __bold__, *italic* / _italic_. The italic forms
// need a non-space right after the opening marker and right before the
// closing one, and underscores must sit on word boundaries, so "2 * 3 * 4",
// "snake_case_name" and a lone "*" stay literal text.
// No lookbehind: older iOS WebViews can't parse it, and a parse error here
// would take the whole bundle down. Group 5 captures the character before
// an underscore italic so it can be kept as text.
const EMPHASIS = /\*\*\*(\S(?:[^*]*\S)?)\*\*\*|\*\*(\S(?:[^*]*\S)?)\*\*|__(\S(?:[^_]*\S)?)__|\*([^\s*](?:[^*]*[^\s*])?)\*|(^|[^\w])_([^\s_](?:[^_]*[^\s_])?)_(?!\w)/g;

function renderEmphasis(text, keyPrefix) {
  const out = [];
  let last = 0;
  let n = 0;
  let m;
  EMPHASIS.lastIndex = 0;
  while ((m = EMPHASIS.exec(text))) {
    const lead = m[5] || '';
    const start = m.index + lead.length;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyPrefix}-em-${n++}`;
    if (m[1] != null) out.push(<strong key={key}><em>{m[1]}</em></strong>);
    else if (m[2] != null || m[3] != null) out.push(<strong key={key}>{m[2] ?? m[3]}</strong>);
    else out.push(<em key={key}>{m[4] ?? m[6]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderMarkdownLite(text) {
  const raw = String(text || '');
  const lines = raw.split('\n');
  const blocks = [];
  let listBuffer = [];
  let listOrdered = false;

  const flushList = (key) => {
    if (!listBuffer.length) return;
    const Tag = listOrdered ? 'ol' : 'ul';
    blocks.push(
      <Tag key={key} style={{ margin: '0.25rem 0', paddingLeft: '1.25rem' }}>
        {listBuffer.map((item, i) => <li key={i}>{renderInline(item, `${key}-li-${i}`)}</li>)}
      </Tag>
    );
    listBuffer = [];
  };

  lines.forEach((line, i) => {
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)/);
    const numberedMatch = line.match(/^\s*\d+\.\s+(.*)/);
    if (bulletMatch) {
      if (listOrdered) flushList(`list-${i}`);
      listOrdered = false;
      listBuffer.push(bulletMatch[1]);
      return;
    }
    if (numberedMatch) {
      if (!listOrdered) flushList(`list-${i}`);
      listOrdered = true;
      listBuffer.push(numberedMatch[1]);
      return;
    }
    flushList(`list-${i}`);
    if (line.trim()) {
      blocks.push(<p key={`p-${i}`} style={{ margin: '0.15rem 0' }}>{renderInline(line, `p-${i}`)}</p>);
    }
  });
  flushList('list-end');

  return <>{blocks}</>;
}
