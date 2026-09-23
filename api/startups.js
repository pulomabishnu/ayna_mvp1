/* global process */
/**
 * /api/startups — the Early Stage startups the team manages in Airtable.
 *
 * Before the 2026-09-22 audit this route only existed on the iOS branch (the
 * live site returned its HTML shell, so the app's Early Stage page was
 * always empty), and it only read the early_stage_startups table, which is
 * filled by a manual script. Now: read Airtable live when AIRTABLE_API_KEY /
 * AIRTABLE_BASE_ID are set, so a startup added in Airtable shows up within
 * minutes; otherwise fall back to the synced table.
 */
import { createClient } from '@supabase/supabase-js';
import { airtableConfigured, fetchActiveAirtableRecords, airtableRecordToRow, rowToClientStartup } from './_airtableStartups.js';

let _client = null;
function getClient() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _client;
}

async function fromTable() {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client.from('early_stage_startups').select('*').eq('is_active', true).order('id', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(rowToClientStartup);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (airtableConfigured()) {
    try {
      const records = await fetchActiveAirtableRecords({ signal: AbortSignal.timeout(8000) });
      const startups = records
        .map(airtableRecordToRow)
        .filter((r) => r.id && r.name)
        .map(rowToClientStartup);
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
      return res.status(200).json({ startups, count: startups.length, source: 'airtable' });
    } catch (e) {
      console.error('[startups] live Airtable read failed, falling back to table:', e?.message);
    }
  }

  try {
    const startups = await fromTable();
    if (startups === null) return res.status(503).json({ error: 'not_configured', startups: [] });
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json({ startups, count: startups.length, source: 'early_stage_startups' });
  } catch (e) {
    console.error('[startups] query failed:', e?.message);
    return res.status(502).json({ error: 'query_failed', startups: [] });
  }
}
