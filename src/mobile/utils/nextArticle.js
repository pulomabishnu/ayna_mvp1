import { ARTICLE_CATEGORIES } from '../data/articleRows.js';

export function getNextArticle(current, articles, seenIds, suggestedArticles = []) {
  if (!current?.id || !Array.isArray(articles)) return null;
  const byId = new Map(articles.map((article) => [article.id, article]));
  const seen = new Set(seenIds);
  seen.add(current.id);

  const topic = ARTICLE_CATEGORIES.find((category) => category.articleIds.includes(current.id));
  if (topic) {
    const index = topic.articleIds.indexOf(current.id);
    const orderedIds = [...topic.articleIds.slice(index + 1), ...topic.articleIds.slice(0, index)];
    const nextId = orderedIds.find((id) => byId.has(id) && !seen.has(id));
    if (nextId) return { article: byId.get(nextId), label: `Next in ${topic.label}` };
  }

  const suggested = suggestedArticles.find((article) => byId.has(article.id) && !seen.has(article.id));
  if (suggested) return { article: byId.get(suggested.id), label: 'Suggested for you' };

  const next = articles.find((article) => !seen.has(article.id));
  return next ? { article: next, label: 'Keep reading' } : null;
}
