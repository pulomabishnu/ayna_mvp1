/* global process */
/**
 * /api/startups — serves Airtable-sourced early-stage startups from
 * early_stage_startups, structured identically to api/products.js.
 *
 * Read-only and public, same as /api/products: this is public startup
 * information, served with the anon key so RLS applies. The service-role key
 * belongs only to scripts/sync-startups-from-airtable.mjs.
 *
 * Rows are mapped to the same shape as src/data/startups.js's hardcoded
 * STARTUPS entries (id, name, tagline, description, category, stage,
 * productReleased, url, image, tags, healthFunctions), plus waitlistUrl,
 * badges, and featured — so getPersonalizedStartups() and WaitlistHub.jsx
 * can treat these identically to the hardcoded array.
 */
import { createClient } from '@supabase/supabase-js';

let _client = null;
function getClient() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _client;
}

/** DB row -> the object shape src/data/startups.js's STARTUPS entries have. */
function toClientStartup(row) {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    category: row.category,
    stage: row.stage,
    productReleased: row.product_released === true,
    url: row.url,
    waitlistUrl: row.waitlist_url,
    image: row.image,
    tags: row.tags || [],
    healthFunctions: row.health_functions || [],
    badges: row.badges || [],
    featured: row.featured === true,
    founderNames: row.extra?.founderNames ?? null,
    foundedYear: row.extra?.foundedYear ?? null,
    womenFounded: row.extra?.womenFounded === true,
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const client = getClient();
  if (!client) {
    console.error('[startups] Supabase env not configured');
    return res.status(503).json({ error: 'not_configured', startups: [] });
  }

  try {
    const { data, error } = await client
      .from('early_stage_startups')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (error) throw new Error(error.message);

    const startups = (data || []).map(toClientStartup);

    // Empty here just means "not synced yet" — degrade to an empty list
    // rather than an error, since the hardcoded UNRELEASED_STARTUPS array
    // already covers the Startups page on its own.
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ startups, count: startups.length, source: 'early_stage_startups' });
  } catch (e) {
    console.error('[startups] query failed:', e?.message);
    return res.status(502).json({ error: 'query_failed', startups: [] });
  }
}
