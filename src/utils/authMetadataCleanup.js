const LEGACY_ECOSYSTEM_META_KEY = 'ayna_ecosystem_shadow_v2';
const LEGACY_SAVED_META_KEY = 'ayna_saved_products_v1';
const ECOSYSTEM_SESSION_PREFIX = 'ayna_ecosystem_shadow_v2:';
const SAVED_LOCAL_KEY = 'ayna_saved_for_later_v1';
const SAFE_AUTH_TOKEN_CHARS = 12_000;

let cleanupPromise = null;

function legacyMetadata(user) {
  const meta = user?.user_metadata || {};
  const ecosystem = meta?.[LEGACY_ECOSYSTEM_META_KEY];
  const saved = meta?.[LEGACY_SAVED_META_KEY];
  return {
    ecosystem: ecosystem && typeof ecosystem === 'object' ? ecosystem : null,
    saved: saved && typeof saved === 'object' ? saved : null,
  };
}

function preserveLegacyLocally(userId, ecosystem, saved) {
  if (typeof window === 'undefined' || !userId) return;

  if (ecosystem && typeof ecosystem === 'object') {
    try {
      const key = `${ECOSYSTEM_SESSION_PREFIX}${userId}`;
      const currentRaw = window.sessionStorage.getItem(key);
      const current = currentRaw ? JSON.parse(currentRaw) : null;
      const rows = {
        ...(ecosystem.rows && typeof ecosystem.rows === 'object' ? ecosystem.rows : {}),
        ...(current?.rows && typeof current.rows === 'object' ? current.rows : {}),
      };
      window.sessionStorage.setItem(key, JSON.stringify({
        version: Math.max(Number(ecosystem.version || 0), Number(current?.version || 0), 3),
        resetAt: Math.max(Number(ecosystem.resetAt || 0), Number(current?.resetAt || 0)),
        rows,
      }));
    } catch (_) {}
  }

  if (saved && typeof saved === 'object') {
    try {
      const currentRaw = window.localStorage.getItem(SAVED_LOCAL_KEY);
      const current = currentRaw ? JSON.parse(currentRaw) : {};
      window.localStorage.setItem(SAVED_LOCAL_KEY, JSON.stringify({ ...(current || {}), ...saved }));
    } catch (_) {}
  }
}

/**
 * Older builds copied whole ecosystem/wishlist blobs into Supabase Auth metadata.
 * Supabase embeds user_metadata in the access JWT, so those blobs can inflate the
 * Authorization header past Vercel's request-header limit. Preserve the legacy
 * values in the app's existing browser fallbacks, remove them from Auth metadata,
 * then refresh the session so subsequent API calls get a compact JWT immediately.
 */
export async function compactLegacyAuthMetadata(supabase) {
  if (!supabase) return { session: null, changed: false };
  if (cleanupPromise) return cleanupPromise;

  cleanupPromise = (async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const session = data?.session || null;
    if (!session?.user) return { session, changed: false };

    const { ecosystem, saved } = legacyMetadata(session.user);
    const tokenTooLarge = String(session.access_token || '').length > SAFE_AUTH_TOKEN_CHARS;
    const hasLegacyBlob = Boolean(ecosystem || saved);

    if (!hasLegacyBlob && !tokenTooLarge) {
      return { session, changed: false };
    }

    preserveLegacyLocally(session.user.id, ecosystem, saved);

    if (hasLegacyBlob) {
      // Send ONLY the keys being retired. Never spread user_metadata back into
      // this update, otherwise the huge blobs are simply written right back.
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          [LEGACY_ECOSYSTEM_META_KEY]: null,
          [LEGACY_SAVED_META_KEY]: null,
        },
      });
      if (updateError) throw updateError;
    }

    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) throw refreshError;

    return {
      session: refreshed?.session || session,
      changed: hasLegacyBlob,
      tokenLength: String(refreshed?.session?.access_token || session.access_token || '').length,
    };
  })().finally(() => {
    cleanupPromise = null;
  });

  return cleanupPromise;
}

export async function getCompactAccessToken(supabase, fallbackToken = '') {
  const fallback = String(fallbackToken || '');
  if (!supabase) return fallback;

  try {
    const result = await compactLegacyAuthMetadata(supabase);
    const token = String(result?.session?.access_token || fallback);
    if (token.length > SAFE_AUTH_TOKEN_CHARS) {
      const error = new Error('Authentication token is still too large after metadata cleanup. Please sign out and back in.');
      error.code = 'auth_header_too_large';
      throw error;
    }
    return token;
  } catch (error) {
    if (fallback.length <= SAFE_AUTH_TOKEN_CHARS) return fallback;
    throw error;
  }
}

export const _legacyAuthMetadataKeys = {
  ecosystem: LEGACY_ECOSYSTEM_META_KEY,
  saved: LEGACY_SAVED_META_KEY,
};
