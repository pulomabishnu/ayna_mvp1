import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
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
const NATIVE_OAUTH_REDIRECT = 'co.aynahealth.app://auth/callback';

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

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return undefined;

    const supabase = getSupabaseClient();
    if (!supabase) return undefined;

    let listenerHandle = null;
    let cancelled = false;
    let lastHandledUrl = '';

    async function handleNativeOAuthUrl(url) {
      if (!url || !url.startsWith(NATIVE_OAUTH_REDIRECT) || url === lastHandledUrl) return;
      lastHandledUrl = url;

      try {
        await Browser.close();
      } catch {
        // Browser may already be closed.
      }

      const parsed = new URL(url);
      const hashParams = new URLSearchParams(parsed.hash.slice(1));
      const searchParams = parsed.searchParams;

      const errorDescription =
        hashParams.get('error_description') ||
        searchParams.get('error_description');

      if (errorDescription) {
        console.error('[Ayna] Native Google OAuth failed:', errorDescription);
        return;
      }

      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (!accessToken || !refreshToken) {
        console.error('[Ayna] Native Google OAuth callback did not include a complete session.');
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error('[Ayna] Could not establish native Google session:', error.message);
      }
    }

    void CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      void handleNativeOAuthUrl(url);
    }).then((handle) => {
      if (cancelled) {
        void handle.remove();
      } else {
        listenerHandle = handle;
      }
    });

    void CapacitorApp.getLaunchUrl()
      .then((result) => {
        if (result?.url) void handleNativeOAuthUrl(result.url);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (listenerHandle) void listenerHandle.remove();
    };
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
      localStorage.setItem(MOBILE_OAUTH_PENDING_KEY, '1');
    } catch {
      // Storage unavailable.
    }

    if (Capacitor.getPlatform() === 'ios') {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: NATIVE_OAUTH_REDIRECT,
          skipBrowserRedirect: true,
          queryParams: { prompt: 'select_account' },
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('Could not start Google sign-in.');

      await Browser.open({
        url: data.url,
        presentationStyle: 'fullscreen',
      });
      return;
    }

    const callbackUrl = new URL('/auth/callback', window.location.origin);
    const currentParams = new URLSearchParams(window.location.search);

    for (const key of ['x-vercel-protection-bypass', 'x-vercel-set-bypass-cookie']) {
      const value = currentParams.get(key);
      if (value) callbackUrl.searchParams.set(key, value);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
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
