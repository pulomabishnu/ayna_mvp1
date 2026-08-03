/**
 * Calls /api/search-suggestions (Claude on the server). Same-origin on Vercel.
 */

function sessionCacheKey(query, category, symptom, maxResults) {
  const q = `${query.trim().toLowerCase()}|${category || ''}|${symptom || ''}|${maxResults || 20}`;
  let h = 0;
  for (let i = 0; i < q.length; i += 1) h = (Math.imul(31, h) + q.charCodeAt(i)) | 0;
  return `ayna-ai-search-v2:${h.toString(16)}`;
}

function readSessionCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object' || !Array.isArray(o.suggestions)) return null;
    const ts = o.ts || 0;
    if (Date.now() - ts > 45 * 60 * 1000) {
      sessionStorage.removeItem(key);
      return null;
    }
    return {
      suggestions: o.suggestions,
      querySummary: typeof o.querySummary === 'string' ? o.querySummary : '',
      // Was read at the call site but never persisted, so the "related
      // searches" row silently vanished for 45 minutes on any repeated query.
      relatedSearches: Array.isArray(o.relatedSearches) ? o.relatedSearches : [],
    };
  } catch {
    return null;
  }
}

function writeSessionCache(key, suggestions, querySummary, relatedSearches) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        ts: Date.now(),
        suggestions,
        querySummary: querySummary || '',
        relatedSearches: Array.isArray(relatedSearches) ? relatedSearches : [],
      })
    );
  } catch {
    /* quota */
  }
}

/**
 * @param {{ query: string, category?: string, symptom?: string, signal?: AbortSignal }} opts
 * @returns {Promise<{ suggestions: object[], querySummary?: string, error?: string, code?: string, fromCache?: boolean }>}
 */
export async function fetchSearchSuggestions(opts) {
  const query = (opts?.query || '').trim();
  if (query.length < 2) {
    return { suggestions: [], querySummary: '', error: 'Query too short' };
  }

  const category = opts?.category && opts.category !== 'all' ? String(opts.category) : '';
  const symptom = opts?.symptom && opts.symptom !== 'all' ? String(opts.symptom) : '';
  const personalized = !!opts?.personalized;
  const profileSummary = typeof opts?.profileSummary === 'string' ? opts.profileSummary : '';
  const dislikedProducts = typeof opts?.dislikedProducts === 'string' ? opts.dislikedProducts : '';
  const maxResults = typeof opts?.maxResults === 'number' ? opts.maxResults : 20;
  // Don't cache personalized results — they're user-specific
  const cacheKey = personalized ? null : sessionCacheKey(query, category, symptom, maxResults);
  if (cacheKey) {
    const cached = readSessionCache(cacheKey);
    if (cached) return { suggestions: cached.suggestions, querySummary: cached.querySummary, relatedSearches: cached.relatedSearches || [], fromCache: true };
  }

  const res = await fetch('/api/search-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, category, symptom, personalized, profileSummary, dislikedProducts, maxResults }),
    signal: opts?.signal,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 429) {
    return {
      suggestions: [],
      querySummary: '',
      error: 'Too many AI search requests. Try again in a little while.',
      code: 'rate_limited',
    };
  }

  if (res.status === 503 && data?.error === 'no_anthropic_key') {
    return {
      suggestions: [],
      querySummary: '',
      error: 'AI search is not configured on the server (missing ANTHROPIC_API_KEY).',
      code: 'no_key',
    };
  }

  if (!res.ok) {
    // Discovery renders `error` verbatim, so raw server codes used to reach the
    // user as e.g. "Showing 0 results. claude_failed". Map them to human copy
    // and keep the raw code on `code` for telemetry.
    const raw = data?.error || '';
    const friendly =
      raw === 'claude_failed' || raw === 'invalid_model_json' || res.status === 502
        ? 'AI search is having trouble right now — try again in a moment.'
        : raw === 'query_too_short'
          ? 'Type a little more to search.'
          : 'Could not load suggestions.';
    return {
      suggestions: [],
      querySummary: '',
      error: friendly,
      code: raw || 'request_failed',
    };
  }

  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
  const querySummary = typeof data.querySummary === 'string' ? data.querySummary : '';
  const relatedSearches = Array.isArray(data.relatedSearches) ? data.relatedSearches : [];
  if (cacheKey) writeSessionCache(cacheKey, suggestions, querySummary, relatedSearches);
  return { suggestions, querySummary, relatedSearches };
}
