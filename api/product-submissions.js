/* global process */
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp } from './_rateLimit.js';

function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function normalizeName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function safeSource(value) {
  return value === 'global_search' ? 'global_search' : 'browse';
}

async function optionalUser(admin, req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const { data, error } = await admin.auth.getUser(token);
    if (error) return null;
    return data?.user || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const ip = getClientIp(req);
  const limited = await rateLimit(`product-submit:${ip}`, { max: 20, windowSec: 3600 });
  if (!limited.ok) {
    res.setHeader('Retry-After', String(limited.retryAfterSec || 3600));
    return res.status(429).json({ error: 'too_many_submissions' });
  }

  const name = String(req.body?.name || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 160) {
    return res.status(400).json({ error: 'invalid_name' });
  }

  const admin = adminClient();
  if (!admin) return res.status(503).json({ error: 'server_misconfigured' });

  const user = await optionalUser(admin, req);
  const source = safeSource(req.body?.source);
  const normalizedName = normalizeName(name);
  const clientSubmissionId = String(req.body?.clientSubmissionId || '').trim().slice(0, 120) || null;

  try {
    if (clientSubmissionId) {
      const { data: existing } = await admin
        .from('product_submissions')
        .select('id,name,status,created_at')
        .eq('client_submission_id', clientSubmissionId)
        .maybeSingle();
      if (existing) return res.status(200).json({ ok: true, submission: existing, duplicate: true });
    }

    const { data, error } = await admin
      .from('product_submissions')
      .insert({
        name,
        normalized_name: normalizedName,
        source,
        user_id: user?.id || null,
        client_submission_id: clientSubmissionId,
      })
      .select('id,name,status,created_at')
      .single();

    if (error) throw error;
    return res.status(201).json({ ok: true, submission: data });
  } catch (error) {
    console.error('[product-submissions] insert failed:', error?.message);
    return res.status(500).json({ error: 'submission_failed' });
  }
}
