import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../utils/supabaseClient.js';

// Real Supabase identity for the mobile app — separate from
// useEcosystemSession.js's local app-data cache (products, quiz answers),
// which stays device-local for now; this hook is only about who's signed
// in. Every call here mirrors src/components/AuthGate.jsx's calls exactly
// (same options shapes, same consent metadata, same confirmation-email
// target), so mobile authenticates through the exact same Supabase
// project/flow as desktop instead of a second, parallel auth system.
const CONSENT_VERSION = 'v1';
// aynahealth.co, not window.location.origin — a confirmation email has to
// link somewhere that works for the person reading it, not wherever this
// build happens to be running (localhost, a preview URL). Matches
// AuthGate.jsx's own hardcoded target exactly.
const EMAIL_CONFIRM_REDIRECT = 'https://www.aynahealth.co/confirmed';

// Google's OAuth redirect leaves the app entirely and comes back on
// /auth/callback, which main.jsx always renders via the DESKTOP App.jsx
// (it picks App vs MobileApp purely by URL path, before any React code
// runs) — this flag is how AuthCallback.jsx knows to send that redirect
// back to /mobile-preview instead of running desktop's own post-auth
// navigation, and how MobileApp.jsx then knows this particular mount is
// "returning from a sign-in that just completed," not just an ordinary
// reopen with an old session (which must NOT force-navigate a returning
// user into a screen built for an ecosystem that only exists locally on
// whatever device originally built it).
export const MOBILE_OAUTH_PENDING_KEY = 'ayna_mobile_oauth_pending';

export function useSupabaseAuth() {
  const [user, setUser] = useState(null);
  // Starts false (nothing to wait for) when there's no client at all, so
  // the effect below never needs to set state synchronously in that branch
  // — it only ever calls setAuthLoading from the getSession() callback.
  const [authLoading, setAuthLoading] = useState(() => Boolean(getSupabaseClient()));

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;

    supabase.auth.getSession()
      .then(({ data }) => setUser(data?.session?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signUpWithPassword({ email, password, firstName }) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Sign-in is not configured right now.');
    const consentAt = new Date().toISOString();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: EMAIL_CONFIRM_REDIRECT,
        data: {
          first_name: firstName,
          full_name: firstName,
          consent_given_at: consentAt,
          consent_version: CONSENT_VERSION,
        },
      },
    });
    if (error) throw error;
    if (data.user?.identities?.length === 0) {
      const dup = new Error('An account with this email already exists. Sign in instead.');
      dup.code = 'email_already_exists';
      throw dup;
    }
    // A live session here means this project's "Confirm email" setting is
    // off — no confirmation email is coming, and onAuthStateChange above
    // has already picked up the new session.
    return { needsConfirmation: !data.session };
  }

  async function signInWithPassword({ email, password }) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Sign-in is not configured right now.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function resendConfirmation(email) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Sign-in is not configured right now.');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: EMAIL_CONFIRM_REDIRECT },
    });
    if (error) throw error;
  }

  async function signInWithGoogle() {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Sign-in is not configured right now.');
    try {
      sessionStorage.setItem(MOBILE_OAUTH_PENDING_KEY, '1');
    } catch {
      // Private browsing / storage disabled — AuthCallback.jsx will just
      // fall through to desktop's own post-auth handling in that case.
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
  }

  async function signOut() {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
  }

  return { user, authLoading, signUpWithPassword, signInWithPassword, signInWithGoogle, signOut, resendConfirmation };
}
