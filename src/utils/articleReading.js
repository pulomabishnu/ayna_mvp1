/**
 * Reading helpers for the Health Articles Library (ported from the mobile
 * app's ArticleDetailScreen + nextArticle util). Pure functions — no DOM —
 * so they can be unit-tested in the node vitest environment.
 */
import { Children, isValidElement } from 'react';

/** Flatten a React node tree to its plain text. */
export function extractText(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (isValidElement(node)) return extractText(node.props.children);
  return '';
}

/** ~200 words per minute, minimum 1 minute. */
export function estimateReadMinutes(body) {
  const words = extractText(body).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Every article body ends with a <p><strong>Sources:</strong></p> paragraph
 * followed by a <ul> of citation links. Split there so the citations render
 * in their own Sources section rather than inline in the prose. If the
 * convention isn't found, the whole body is returned untouched as mainBody.
 */
export function splitBodyAndSources(body) {
  const kids = body?.props?.children ? Children.toArray(body.props.children) : [];
  const splitIndex = kids.findIndex(
    (child) => isValidElement(child) && child.type === 'p' && /^\s*sources:\s*$/i.test(extractText(child.props.children))
  );
  if (splitIndex < 0) return { mainBody: kids.length ? kids : body, sourceLinks: [] };

  const sourcesList = kids[splitIndex + 1];
  let sourceLinks = [];
  if (isValidElement(sourcesList) && sourcesList.type === 'ul') {
    sourceLinks = Children.toArray(sourcesList.props.children)
      .filter(isValidElement)
      .map((li) => {
        const link = Children.toArray(li.props.children).find((c) => isValidElement(c) && c.type === 'a');
        return link ? { href: link.props.href, text: extractText(link.props.children) } : null;
      })
      .filter(Boolean);
  }
  // If the list after "Sources:" couldn't be parsed, keep everything inline
  // rather than dropping citations.
  if (sourceLinks.length === 0) return { mainBody: kids, sourceLinks: [] };
  const mainBody = [...kids.slice(0, splitIndex), ...kids.slice(splitIndex + 2)];
  return { mainBody, sourceLinks };
}

/**
 * Pick the article to suggest after `current`: next unseen one in the same
 * topic (wrapping), else the first unseen profile-suggested one, else the
 * first unseen article overall. Returns { article, label } or null.
 */
export function getNextArticle(current, articles, categories = [], seenIds = [], suggestedArticles = []) {
  if (!current?.id || !Array.isArray(articles)) return null;
  const byId = new Map(articles.map((article) => [article.id, article]));
  const seen = new Set(seenIds);
  seen.add(current.id);

  const topic = (categories || []).find((category) => category.articleIds.includes(current.id));
  if (topic) {
    const index = topic.articleIds.indexOf(current.id);
    const orderedIds = [...topic.articleIds.slice(index + 1), ...topic.articleIds.slice(0, index)];
    const nextId = orderedIds.find((id) => byId.has(id) && !seen.has(id));
    if (nextId) return { article: byId.get(nextId), label: `Next in ${topic.label}` };
  }

  const suggested = (suggestedArticles || []).find((article) => byId.has(article.id) && !seen.has(article.id));
  if (suggested) return { article: byId.get(suggested.id), label: 'Suggested for you' };

  const next = articles.find((article) => !seen.has(article.id));
  return next ? { article: next, label: 'Keep reading' } : null;
}
