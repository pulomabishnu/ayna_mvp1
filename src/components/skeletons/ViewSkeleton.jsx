import React, { useEffect, useState } from 'react';
import './skeletons.css';

/**
 * Generic page skeleton used as the Suspense fallback for lazy-loaded views
 * and as the ecosystem data-loading placeholder. Calm blocks in the brand
 * palette instead of a bare "Loading…" line or a blank screen.
 *
 * Also owns the "never spin forever" rule: after `slowAfterMs` it names what
 * is slow and, when the caller provides `onRetry`, offers a retry. It only
 * ever REPLACES the placeholder copy; it never clears any data.
 */
export default function ViewSkeleton({
  label = 'Loading',
  cards = 0,
  lines = 3,
  slowAfterMs = 8000,
  onRetry = null,
}) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!slowAfterMs) return undefined;
    const t = setTimeout(() => setSlow(true), slowAfterMs);
    return () => clearTimeout(t);
  }, [slowAfterMs]);

  return (
    <div className="ay-skel" role="status" aria-label={label}>
      <div className="ay-skel__bar is-title" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`ay-skel__bar ${i === lines - 1 ? 'is-short' : 'is-sub'}`} />
      ))}
      {cards > 0 && (
        <div className="ay-skel__grid">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="ay-skel__card" />
          ))}
        </div>
      )}
      <div className="ay-skel__status" aria-live="polite">
        {slow ? (
          <>
            This is taking longer than usual.
            {onRetry ? (
              <button type="button" className="ay-skel__retry" onClick={onRetry}>Retry</button>
            ) : null}
          </>
        ) : (
          `${label}…`
        )}
      </div>
    </div>
  );
}
