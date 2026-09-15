/**
 * Calls /api/search-suggestions. External AI/web discovery is authenticated
 * and consent-gated server-side; ordinary catalog search remains local.
 *
 * Health-sensitive search text/results are intentionally not cached in
 * localStorage or sessionStorage.
 */
import { getSupabaseClient } from './supabaseClient.js';

/**
 * @param {{ query: string, category?: string, symptom?: string, signal?: AbortSignal }} opts
 * @returns {Promise<{ suggestions: object[], querySummary?: string, error?: string, code?: string }>}
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

  const headers = { 'Content-Type': 'application/json' };
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  const res = await fetch('/api/search-suggestions', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, category, symptom, personalized, profileSummary, dislikedProducts, maxResults }),
    signal: opts?.signal,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    return {
      suggestions: [],
      querySummary: '',
      error: 'Sign in to search beyond the ayna catalog.',
      code: 'auth_required',
    };
  }

  if (res.status === 403 && data?.error === 'ai_consent_required') {
    return {
      suggestions: [],
      querySummary: '',
      error: 'Turn on AI features in ayna before searching beyond the ayna catalog.',
      code: 'ai_consent_required',
    };
  }

  if (res.status === 429) {
    return {
      suggestions: [],
      querySummary: '',
      error: 'Too many AI search requests. Try again in a little while.',
      code: 'rate_limited',
    };
  }

  if (res.status === 503 && (data?.error === 'no_ai_provider' || data?.error === 'no_anthropic_key')) {
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
        ? 'AI search is having trouble right now. Try again in a moment.'
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
  return { suggestions, querySummary, relatedSearches };
}
