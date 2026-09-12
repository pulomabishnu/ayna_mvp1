import posthog from 'posthog-js';

/**
 * Calls /api/search-suggestions (multi-provider AI on the server). Same-origin on Vercel.
 */

const HEALTH_ANALYTICS_TERMS = [
  'period', 'menstrual', 'bleeding', 'cramp', 'pelvic', 'vagina', 'vaginal', 'vulva', 'discharge', 'odor',
  'itching', 'uti', 'urinary', 'yeast infection', 'bacterial vaginosis', 'pcos', 'polycystic', 'endometriosis',
  'fibroid', 'ovarian cyst', 'pmdd', 'pms', 'menopause', 'perimenopause', 'fertility', 'infertility', 'pregnan',
  'postpartum', 'birth control', 'contraception', 'hormone', 'sexual health', 'painful sex', 'vaginismus',
  'vulvodynia', 'iron deficiency', 'anemia', 'reproductive', 'cycle', 'hot flash', 'night sweat',
];

function looksHealthSensitive(query) {
  const q = String(query || '').toLowerCase();
  return HEALTH_ANALYTICS_TERMS.some((term) => q.includes(term));
}

function captureSearchAnalytics(event, properties) {
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break search.
  }
}

function baseAnalyticsProps({ query, category, personalized }) {
  return {
    queryLength: String(query || '').length,
    category: category || 'all',
    personalized: Boolean(personalized),
    sensitiveHealthQuery: looksHealthSensitive(query),
  };
}

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
  const analyticsBase = baseAnalyticsProps({ query, category, personalized });

  // Don't cache personalized results — they're user-specific
  const cacheKey = personalized ? null : sessionCacheKey(query, category, symptom, maxResults);
  if (cacheKey) {
    const cached = readSessionCache(cacheKey);
    if (cached) {
      captureSearchAnalytics('ai_search_completed', {
        ...analyticsBase,
        resultCount: cached.suggestions.length,
        fromCache: true,
        providerUsed: 'cache',
      });
      return {
        suggestions: cached.suggestions,
        querySummary: cached.querySummary,
        relatedSearches: cached.relatedSearches || [],
        fromCache: true,
      };
    }
  }

  const res = await fetch('/api/search-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, category, symptom, personalized, profileSummary, dislikedProducts, maxResults }),
    signal: opts?.signal,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    captureSearchAnalytics('ai_search_failed', { ...analyticsBase, code: 'auth_required', status: 401 });
    return {
      suggestions: [],
      querySummary: '',
      error: 'Sign in to search beyond the ayna catalog.',
      code: 'auth_required',
    };
  }

  if (res.status === 429) {
    captureSearchAnalytics('ai_search_failed', { ...analyticsBase, code: 'rate_limited', status: 429 });
    return {
      suggestions: [],
      querySummary: '',
      error: 'Too many AI search requests. Try again in a little while.',
      code: 'rate_limited',
    };
  }

  if (res.status === 503 && (data?.error === 'no_anthropic_key' || data?.error === 'no_ai_provider')) {
    captureSearchAnalytics('ai_search_failed', { ...analyticsBase, code: 'no_ai_provider', status: 503 });
    return {
      suggestions: [],
      querySummary: '',
      error: 'AI search is not configured on the server.',
      code: 'no_key',
    };
  }

  if (!res.ok) {
    const raw = data?.error || '';
    const friendly =
      raw === 'claude_failed' || raw === 'invalid_model_json' || res.status === 502
        ? 'AI search is having trouble right now — try again in a moment.'
        : raw === 'query_too_short'
          ? 'Type a little more to search.'
          : 'Could not load suggestions.';
    captureSearchAnalytics('ai_search_failed', {
      ...analyticsBase,
      code: raw || 'request_failed',
      status: res.status,
    });
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

  captureSearchAnalytics('ai_search_completed', {
    ...analyticsBase,
    resultCount: suggestions.length,
    fromCache: false,
    providerUsed: typeof data.providerUsed === 'string' ? data.providerUsed : 'server_fallback',
    healthRoutingMode: typeof data.healthRoutingMode === 'string' ? data.healthRoutingMode : undefined,
    externalSearchUsed: typeof data.externalSearchUsed === 'boolean' ? data.externalSearchUsed : undefined,
    internalKnowledgeHits: Number.isFinite(Number(data.internalKnowledgeHits)) ? Number(data.internalKnowledgeHits) : undefined,
  });

  return {
    suggestions,
    querySummary,
    relatedSearches,
    providerUsed: data.providerUsed,
    healthRoutingMode: data.healthRoutingMode,
    externalSearchUsed: data.externalSearchUsed,
    internalKnowledgeHits: data.internalKnowledgeHits,
  };
}
