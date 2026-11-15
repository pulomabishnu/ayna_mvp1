/* global process */
/**
 * Production health check (backlog Nov 14, "run automated production health checks").
 *
 *   GET /api/status                    -> cheap checks (catalog, tables, provider keys), no model call
 *   GET /api/status  + cron secret     -> also one tiny model call through the normal fallback order
 *
 * Runs daily from vercel.json. Failures are logged as `[status] FAIL <check>` (no user data, no
 * profile content), so they show in Vercel logs. Nothing here reads anyone's health data.
 */
import { createClient } from '@supabase/supabase-js';
import { callWithFallback, parseProviderOrder, providerConfigured } from './_llm.js';

function client() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

async function timed(name, fn) {
  const t = Date.now();
  try {
    const detail = await fn();
    return { name, ok: true, ms: Date.now() - t, detail };
  } catch (e) {
    return { name, ok: false, ms: Date.now() - t, detail: String(e?.message || e).slice(0, 160) };
  }
}

export async function runChecks({ withModel = false, db = client() } = {}) {
  const checks = [];
  checks.push(await timed('catalog', async () => {
    if (!db) throw new Error('supabase env missing');
    const { count, error } = await db.from('product_catalog').select('id', { count: 'exact', head: true }).eq('is_active', true);
    if (error) throw new Error(error.message);
    if (!count) throw new Error('no active products');
    return `${count} active products`;
  }));
  checks.push(await timed('providers', async () => {
    const order = parseProviderOrder('AI_INSIGHTS_PROVIDER_ORDER', 'anthropic,openai,gemini');
    const live = order.filter((p) => providerConfigured(p));
    if (!live.length) throw new Error('no model provider key set');
    return `order: ${live.join(' > ')}`;
  }));
  if (withModel) {
    checks.push(await timed('model', async () => {
      const order = parseProviderOrder('AI_INSIGHTS_PROVIDER_ORDER', 'anthropic,openai,gemini');
      const out = await callWithFallback(order, {
        system: 'Reply with the single word OK.',
        prompt: 'Health check. Reply OK.',
        maxTokens: 5,
        timeoutMs: 15_000,
        trace: { name: 'status-check', messages: [{ role: 'user', content: 'Daily health check' }], formatOutput: (t) => t },
      });
      if (!/ok/i.test(out?.text || '')) throw new Error('unexpected reply');
      return `answered by ${out?.provider || 'provider'}`;
    }));
  }
  return { ok: checks.every((c) => c.ok), at: new Date().toISOString(), checks };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const secret = process.env.CRON_SECRET;
  const withModel = Boolean(secret) && (req.headers.authorization || '') === `Bearer ${secret}`;
  const out = await runChecks({ withModel });
  out.checks.filter((c) => !c.ok).forEach((c) => console.error(`[status] FAIL ${c.name}: ${c.detail}`));
  res.setHeader('Cache-Control', 'no-store');
  return res.status(out.ok ? 200 : 503).json(out);
}
