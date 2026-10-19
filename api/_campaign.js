/* global process */
/** Shared helpers for the free product campaign routes. */
import { createClient } from '@supabase/supabase-js';

let _service = null;
/** Service-role client for routes that are not tied to a signed-in user (cron). */
export function getServiceClient() {
  if (_service) return _service;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _service = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _service;
}

export function setPrivateHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

/**
 * Who can open /admin/campaign: the site's ADMIN_EMAILS allowlist (same as
 * api/reviews-admin.js) plus the campaign team in CAMPAIGN_TEAM_EMAIL, who
 * also get the claim and shipping alerts. Both empty means nobody.
 */
export function isAdminEmail(email) {
  if (!email) return false;
  const allow = `${process.env.ADMIN_EMAILS || ''},${process.env.CAMPAIGN_TEAM_EMAIL || ''}`
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(String(email).trim().toLowerCase());
}

/** supabase.rpc that returns { data } or throws a tagged error. */
export async function rpc(client, name, args) {
  const { data, error } = await client.rpc(name, args);
  if (error) {
    const err = new Error(`rpc_${name}_failed`);
    err.cause = error;
    throw err;
  }
  return data;
}
