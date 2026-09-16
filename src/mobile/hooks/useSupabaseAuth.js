import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { CONSENT_VERSION, stashPendingConsent, flushPendingConsent } from '../../utils/pendingConsent.js';
import { resetChipPosition } from '../utils/askAynaChipPosition.js';
import { debugLog } from '../../utils/aynaDebugLog.js';

// Real Supabase identity for the mobile app — separate from
// useEcosystemSession.js's local app-data cache (products, quiz answers),
// which stays device-local for now; this hook is only about who's signed
// in. Every call here mirrors src/components/AuthGate.jsx's calls exactly
// (same options shapes, same consent metadata, same confirmation-email
// target), so mobile authenticates through the exact same Supabase
// project/flow as desktop instead of a second, parallel auth system.
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

    // TEMPORARY diagnostic (2026-09-16) — see handleNativeOAuthUrl below.
    // getSession() here runs on every mount and shares GoTrueClient's one
    // lock with every other auth call; if THIS hangs, everything queued
    // behind it (including a later setSession() from native sign-in) would
    // wait forever regardless of which lock implementation is used.
    debugLog('mount getSession() starting...');
    const mountGetSessionStart = Date.now();
    supabase.auth.getSession()
      .then(({ data }) => {
        debugLog('mount getSession() resolved in', Date.now() - mountGetSessionStart, 'ms, has session:', !!data?.session);
        setUser(data?.session?.user ?? null);
      })
      .catch((e) => {
        debugLog('mount getSession() REJECTED after', Date.now() - mountGetSessionStart, 'ms:', e?.message);
        setUser(null);
      })
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
      // TEMPORARY diagnostic logging (2026-09-16) — the "bounced back to
      // sign-in" report couldn't be pinned down from the existing
      // console.error calls alone (nothing was showing up in Safari Web
      // Inspector, filtered view or genuinely silent, unclear which).
      // Every branch below logs explicitly with this prefix, and the whole
      // body is now wrapped in try/catch so nothing can fail as a silent
      // unhandled rejection. Remove once the real cause is found.
      debugLog('appUrlOpen fired, url:', url);
      if (!url || !url.startsWith(NATIVE_OAUTH_REDIRECT) || url === lastHandledUrl) {
        debugLog('ignored — no url / prefix mismatch / duplicate. lastHandledUrl =', lastHandledUrl);
        return;
      }
      lastHandledUrl = url;

      try {
        await Browser.close();
      } catch (closeErr) {
        debugLog('Browser.close() threw (probably already closed):', closeErr?.message);
      }

      try {
        const parsed = new URL(url);
        const hashParams = new URLSearchParams(parsed.hash.slice(1));
        const searchParams = parsed.searchParams;

        const errorDescription =
          hashParams.get('error_description') ||
          searchParams.get('error_description');

        if (errorDescription) {
          console.error('[Ayna] Native Google OAuth failed:', errorDescription);
          debugLog('OAuth error_description:', errorDescription);
          return;
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        debugLog('accessToken present:', !!accessToken, 'refreshToken present:', !!refreshToken);

        if (!accessToken || !refreshToken) {
          console.error('[Ayna] Native Google OAuth callback did not include a complete session.');
          debugLog('missing tokens — hash keys:', Object.keys(Object.fromEntries(hashParams)));
          return;
        }

        // Isolates whether the LOCK ITSELF is what's stuck (a trivial
        // no-op function queued on the exact same lock name GoTrueClient
        // uses internally) vs something inside setSession()'s own body
        // once the lock is already held.
        try {
          const lockName = `lock:${supabase.auth.storageKey}`;
          debugLog('testing raw lock acquisition, name:', lockName, '...');
          const lockTestStart = Date.now();
          const lockResult = await Promise.race([
            supabase.auth.lock(lockName, 5000, async () => 'ACQUIRED'),
            new Promise((resolve) => setTimeout(() => resolve('LOCK_TIMED_OUT'), 6000)),
          ]);
          debugLog('raw lock test finished in', Date.now() - lockTestStart, 'ms, result:', lockResult);
        } catch (lockErr) {
          debugLog('raw lock test THREW after', 'ms:', lockErr?.name, lockErr?.message);
        }

        // Raw network probe, completely bypassing the Supabase JS client's
        // locking/state machine.
        try {
          const healthUrl = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`;
          const probeStart = Date.now();
          const probeController = new AbortController();
          const probeTimeout = setTimeout(() => probeController.abort(), 8000);
          const probeRes = await fetch(healthUrl, { signal: probeController.signal });
          clearTimeout(probeTimeout);
          debugLog('raw fetch probe finished in', Date.now() - probeStart, 'ms, status:', probeRes.status);
        } catch (probeErr) {
          debugLog('raw fetch probe FAILED/timed out:', probeErr?.name, probeErr?.message);
        }

        const setSessionPromise = supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve({ __timedOut: true }), 8000);
        });
        debugLog('calling setSession now...');
        const raceResult = await Promise.race([setSessionPromise, timeoutPromise]);
        if (raceResult?.__timedOut) {
          debugLog('setSession did NOT resolve within 8000ms — confirmed hang.');
          setSessionPromise
            .then((r) => debugLog('setSession eventually resolved (late):', !!r?.data?.session, r?.error?.message))
            .catch((e) => debugLog('setSession eventually REJECTED (late):', e?.message));
          return;
        }
        const { data: setSessionData, error } = raceResult;

        if (error) {
          console.error('[Ayna] Could not establish native Google session:', error.message);
          debugLog('setSession error:', error.message);
          return;
        }

        debugLog('setSession succeeded, user id:', setSessionData?.session?.user?.id);

        // This native flow never passes through AuthCallback.jsx (that only
        // renders for the web/preview OAuth redirect) — it's the one place
        // that would otherwise silently skip writing the consent stashed
        // before the redirect by signInWithGoogle below.
        await flushPendingConsent(supabase);
        debugLog('flushPendingConsent completed — native Google sign-in flow finished successfully.');
      } catch (err) {
        debugLog('handleNativeOAuthUrl threw an unexpected error:', err?.message);
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

    // Stashed before EITHER redirect path below, same as AuthGate.jsx's
    // handleGoogle — Supabase's Google provider auto-provisions a real
    // account for any unseen address the instant this redirect completes,
    // with no consent checkboxes shown at all in mobile's "sign in" mode.
    stashPendingConsent();

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
    resetChipPosition();
  }

  return { user, authLoading, signUpWithPassword, signInWithPassword, signInWithGoogle, signOut, resendConfirmation };
}
