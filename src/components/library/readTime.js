import React from 'react';

/** Plain text of a read's JSX body (for word counts). */
export function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return ` ${node} `;
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (React.isValidElement(node)) return textOf(node.props.children);
  return '';
}

// Read time from the article's real words (about 220 a minute), never a fixed number.
const MINUTES = new Map();
export function minutesFor(article) {
  if (!article) return 1;
  if (!MINUTES.has(article.id)) {
    const words = textOf(article.body).split(/\s+/).filter(Boolean).length;
    MINUTES.set(article.id, Math.max(1, Math.ceil(words / 220)));
  }
  return MINUTES.get(article.id);
}
