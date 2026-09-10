/* global process */

import { createClient } from '@supabase/supabase-js';

const AUTH_TIMEOUT_MS = 8000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('auth_timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Local-safe auth fallback for endpoints whose tables are protected by RLS.
 * Uses the caller's JWT plus the public Supabase key, never service_role.
 */
export async function verifyUserWithRls(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { user: null, error: 'auth_required', client: null };

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('[userScopedSupabase] Supabase URL or public key is not set');
    return { user: null, error: 'server_misconfigured', client: null };
  }

  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  try {
    const { data, error } = await withTimeout(client.auth.getUser(token), AUTH_TIMEOUT_MS);
    if (error || !data?.user) {
      return { user: null, error: 'invalid_session', client: null };
    }

    return { user: data.user, error: null, client };
  } catch (error) {
    console.error('[userScopedSupabase] verify user error:', error?.message);
    return { user: null, error: 'auth_error', client: null };
  }
}
