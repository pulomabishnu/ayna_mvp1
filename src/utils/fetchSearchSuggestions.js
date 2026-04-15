/**
 * Calls /api/search-suggestions (Gemini on the server). Same-origin on Vercel.
 */

function sessionCacheKey(query, category, symptom) {
  const q = `${query.trim().toLowerCase()}|${category || ''}|${symptom || ''}`;
  let h = 0;
  for (let i = 0; i < q.length; i += 1) h = (Math.imul(31, h) + q.charCodeAt(i)) | 0;
  return `ayna-ai-search:${h.toString(16)}`;
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
    return o.suggestions;
  } catch {
    return null;
  }
}

function writeSessionCache(key, suggestions) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), suggestions }));
  } catch {
    /* quota */
  }
}

/**
 * @param {{ query: string, category?: string, symptom?: string, signal?: AbortSignal }} opts
 * @returns {Promise<{ suggestions: object[], error?: string, code?: string }>}
 */
export async function fetchSearchSuggestions(opts) {
  const query = (opts?.query || '').trim();
  if (query.length < 2) {
    return { suggestions: [], error: 'Query too short' };
  }

  const category = opts?.category && opts.category !== 'all' ? String(opts.category) : '';
  const symptom = opts?.symptom && opts.symptom !== 'all' ? String(opts.symptom) : '';
  const cacheKey = sessionCacheKey(query, category, symptom);
  const cached = readSessionCache(cacheKey);
  if (cached) {
    return { suggestions: cached, fromCache: true };
  }

  const res = await fetch('/api/search-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, category, symptom }),
    signal: opts?.signal,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 429) {
    return {
      suggestions: [],
      error: 'Too many AI search requests. Try again in a little while.',
      code: 'rate_limited',
    };
  }

  if (res.status === 503 && data?.error === 'no_gemini_key') {
    return {
      suggestions: [],
      error: 'AI search is not configured on the server (missing GEMINI_API_KEY).',
      code: 'no_key',
    };
  }

  if (!res.ok) {
    return {
      suggestions: [],
      error: data?.message || data?.error || 'Could not load suggestions.',
      code: data?.error || 'request_failed',
    };
  }

  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
  writeSessionCache(cacheKey, suggestions);
  return { suggestions };
}
