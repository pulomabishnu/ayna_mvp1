import { createClient } from '@supabase/supabase-js';

/**
 * Guest identity for Community (people using ayna without an account).
 *
 * A guest who posts or comments gets a Supabase *anonymous* sign-in: a real
 * auth.uid() with `is_anonymous: true` in its JWT. That makes ownership
 * (edit/delete your own post), rate limits and every RLS rule work exactly as
 * they do for accounts, while restrictive policies in supabase/community.sql
 * keep guests to anonymous discussions/questions/comments and reports.
 *
 * It lives on a SECOND client with its own storage key so the rest of ayna
 * (App auth state, quiz sync, account pages) never sees a guest as "signed
 * in". The session is only created the first time a guest actually writes —
 * browsing stays keyless (the `anon` role).
 *
 * The guest id is never shown anywhere: the feed views return author_id = null
 * for anonymous content, and analytics never receive it.
 */
const STORAGE_KEY = 'ayna-community-guest';

let guestClient = null;

export function getGuestClient() {
  if (guestClient) return guestClient;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    guestClient = createClient(url, anonKey, {
      auth: {
        storageKey: STORAGE_KEY,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // never consume an OAuth redirect meant for the main client
      },
    });
  } catch {
    return null;
  }
  return guestClient;
}

/** The current guest's id if this device already has a guest session. */
export async function getGuestId() {
  const client = getGuestClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    const user = data?.session?.user;
    return user?.is_anonymous ? user.id : null;
  } catch {
    return null;
  }
}

export class GuestPostingUnavailable extends Error {
  constructor() {
    super('community_guest_unavailable');
    this.name = 'GuestPostingUnavailable';
  }
}

let pending = null;

/** Returns the guest id, creating the anonymous session on first use. */
export async function ensureGuestSession() {
  const existing = await getGuestId();
  if (existing) return existing;
  const client = getGuestClient();
  if (!client) throw new GuestPostingUnavailable();
  if (!pending) {
    pending = client.auth.signInAnonymously()
      .then(({ data, error }) => {
        if (error || !data?.user?.id) throw new GuestPostingUnavailable();
        return data.user.id;
      })
      .finally(() => { pending = null; });
  }
  return pending;
}
