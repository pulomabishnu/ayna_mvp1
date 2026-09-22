import { createClient } from '@supabase/supabase-js';
import { processLock } from '@supabase/auth-js';
import { Capacitor } from '@capacitor/core';

// Supabase's publishable client credentials are intentionally safe to ship in
// browser/native bundles. Row Level Security remains the authorization boundary.
// Environment variables still override these values for alternate projects.
const PRODUCTION_SUPABASE_URL = 'https://mvvwgyspcohqxxcqkfrv.supabase.co';
const PRODUCTION_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_osUmc6fdapgq2mi5EAhkrA_LLW9OQH_';

let client = null;

export function getSupabaseClient() {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL || PRODUCTION_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || PRODUCTION_SUPABASE_PUBLISHABLE_KEY;
  try {
    client = createClient(url, anonKey, {
      auth: {
        flowType: 'implicit',   // avoids PKCE verifier storage — Chrome bounce tracking deletes it
        detectSessionInUrl: false, // AuthCallback.jsx handles implicit OAuth tokens explicitly
        // GoTrueClient auto-selects the browser's navigator.locks API to
        // serialize auth calls whenever it's merely present — true in a
        // WKWebView, but not necessarily reliable there. processLock is
        // Supabase's own single-process alternative, built for exactly
        // this (their docs: "React Native or other non-browser
        // single-process environments") — same category as a Capacitor
        // native app, so used there instead.
        ...(Capacitor.isNativePlatform() ? { lock: processLock } : {}),
      },
    });
  } catch (e) {
    // createClient throws synchronously on a malformed override. Falling back
    // to the production publishable config above means ordinary Xcode/local
    // builds work without copying credentials into .env.local.
    console.error('[Ayna] Supabase client init failed — check any VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY overrides:', e);
    return null;
  }
  return client;
}

export async function getSupabaseUser() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user || null;
}
