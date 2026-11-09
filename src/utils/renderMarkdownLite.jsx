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
    // Items that bring their own mark (✓ raised, △ worth checking) drop the bullet, so there is one mark per line.
    const marked = !listOrdered && listBuffer.every((item) => /^[✓△✗]\s/.test(item));
    blocks.push(
      <Tag key={key} className={marked ? 'md-marked' : undefined} style={{ margin: '0.25rem 0', paddingLeft: marked ? 0 : '1.25rem', listStyle: marked ? 'none' : undefined }}>
        {listBuffer.map((item, i) => {
          // Nov 9 (founder: Ask answers hard to read): the mark gets its own small round badge.
          const mk = marked ? item.match(/^([✓△✗])\s+(.*)$/) : null;
          return <li key={i}>{mk ? <><span className={`md-mark is-${mk[1] === '✓' ? 'yes' : mk[1] === '✗' ? 'no' : 'check'}`} aria-hidden="true">{mk[1]}</span><span>{renderInline(mk[2], `${key}-li-${i}`)}</span></> : renderInline(item, `${key}-li-${i}`)}</li>;
        })}
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
      // A line that is only **bold** is a section label; "What ayna used" and the closing note are small print.
      const t = line.trim();
      const cls = /^\*\*[^*]+\*\*$/.test(t) ? 'md-kicker' : /^\*\*What ayna used|^The match is how well|^Based on:/.test(t) ? 'md-note' : undefined;
      blocks.push(<p key={`p-${i}`} className={cls} style={{ margin: '0.15rem 0' }}>{renderInline(cls === 'md-kicker' ? t.slice(2, -2) : line, `p-${i}`)}</p>);
    }
  });
  flushList('list-end');

  return <>{blocks}</>;
}
