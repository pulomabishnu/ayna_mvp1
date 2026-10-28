import { useEffect, useMemo, useState } from 'react';
import ArticlesCore, { ARTICLES } from './ArticlesCore.jsx';
import ProFeatureGate from './ProFeatureGate.jsx';

export * from './ArticlesCore.jsx';

/**
 * Pro-aware boundary around the existing Library. Public visitors can still
 * discover/read the Library. Once signed in, every opened Read participates in
 * the Free weekly allowance; Pro is unlimited.
 */
export default function Articles(props) {
  const [activeArticleId, setActiveArticleId] = useState(props.initialArticleId || null);

  useEffect(() => {
    setActiveArticleId(props.initialArticleId || null);
  }, [props.initialArticleId]);

  const title = useMemo(
    () => ARTICLES.find((article) => article.id === activeArticleId)?.title || 'Read',
    [activeArticleId]
  );

  const handleArticleChange = (id) => {
    const next = id || null;
    setActiveArticleId(next);
    props.onArticleChange?.(next);
  };

  const library = (
    <ArticlesCore
      {...props}
      initialArticleId={activeArticleId}
      onArticleChange={handleArticleChange}
    />
  );

  if (!activeArticleId || !props.userId) return library;

  return (
    <ProFeatureGate
      feature="reads"
      readId={activeArticleId}
      title={title}
      onBack={() => handleArticleChange(null)}
    >
      {library}
    </ProFeatureGate>
  );
}