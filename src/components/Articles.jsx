import React from 'react';
import { getRecommendedArticles } from './articleRecommendations';

// Keep the recommendation helper lightweight while deferring the full article
// library (article bodies, startups, and article-specific product logic) until
// someone actually opens the Articles view.
const ArticlesPage = React.lazy(() => import('./ArticlesPage'));

export { getRecommendedArticles };

export default function Articles(props) {
  return <ArticlesPage {...props} />;
}
