/**
 * Calls /api/search-suggestions (Claude on the server). External AI/web
 * discovery is authenticated and consent-gated server-side; ordinary
 * catalog search remains local. Same-origin on Vercel for desktop web; the
 * native mobile app has no server of its own (it loads bundled assets from
 * a local capacitor:// origin), so apiUrl() resolves it against the real
 * deployment there instead.
 *
 * Non-personalized results only are cached in sessionStorage (45 min) --
 * health-sensitive personalized search text/results are never cached.
 */
import { getSupabaseClient } from './supabaseClient.js';
import { apiUrl } from './apiUrl.js';

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

  const res = await fetch(apiUrl('/api/search-suggestions'), {
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
