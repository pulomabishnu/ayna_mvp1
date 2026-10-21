import { useMemo } from 'react';
// Lazy wrappers: the engine (and the catalog it reads) loads after first paint.
import { analyzeSearch, searchFallbacks, useSearchReady } from '../../utils/search/lazy.js';
import './smart-search.css';

/**
 * One calm line under a search box:
 *   - "Did you mean menstrual cramps?" when a word was corrected (results
 *     are already shown for the corrected words; tapping it puts them in the box);
 *   - "We don't recognize 'xyz'." plus a few things to try, when a word could
 *     not be matched with confidence and nothing was found.
 * Renders nothing otherwise.
 *
 * Props: query, onUse(text), resultCount (number | null), variant ('web' | 'app'), className,
 *   showTries (false where the page already has its own empty state)
 */
export default function SearchAssist({ query = '', onUse, resultCount = null, variant = 'web', className = '', tryLabel = 'Try', showTries = true }) {
  const q = String(query || '').trim();
  const ready = useSearchReady();
  const a = useMemo(() => (q.length >= 2 ? analyzeSearch(q) : null), [q, ready]);
  // Things to try only when nothing was found: with results on screen, one quiet line is enough.
  const tries = useMemo(() => (a && a.unknown.length && !a.didYouMean && resultCount === 0 && showTries ? searchFallbacks(q, 4) : []), [a, q, resultCount, showTries]);
  if (!a) return null;
  const cls = `ays-assist ays-assist--${variant}${className ? ` ${className}` : ''}`;
  if (a.didYouMean) {
    const extra = a.unknown.length ? ` We don't recognize ${a.unknown.map((w) => `‘${w}’`).join(', ')}.` : '';
    return <p className={cls} role="status" aria-live="polite">
      Did you mean <button type="button" className="ays-assist__fix" onClick={() => onUse?.(a.didYouMean)}>{a.didYouMean}</button>?{extra}
    </p>;
  }
  if (a.unknown.length) {
    const words = a.unknown.map((w) => `‘${w}’`).join(', ');
    const none = resultCount === 0 && showTries;
    return <div className={cls} role="status" aria-live="polite">
      <p>{none ? <>No results for {words}.</> : <>We don&apos;t recognize {words}.</>}{tries.length > 0 && <> {tryLabel}:</>}</p>
      {tries.length > 0 && <div className="ays-assist__chips">
        {tries.map((t) => <button type="button" key={t} onClick={() => onUse?.(t)}>{t}</button>)}
      </div>}
    </div>;
  }
  return null;
}
