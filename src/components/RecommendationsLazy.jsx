import React, { Suspense } from 'react';

const RecommendationsImpl = React.lazy(() => import('./RecommendationsImpl.jsx'));

export default function RecommendationsLazy(props) {
  return (
    <Suspense
      fallback={(
        <div className="container" style={{ padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
          Loading recommendations…
        </div>
      )}
    >
      <RecommendationsImpl {...props} />
    </Suspense>
  );
}
