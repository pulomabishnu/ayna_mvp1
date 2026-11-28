/* global process */
/**
 * GET /api/partner-studio?brand=<name>
 *
 * ayna Partner Studio, Phase 1 (behind a feature flag). Returns one brand's
 * precomputed rollup: counts, denominators, versions and source references
 * from a synthetic benchmark over public catalog facts, plus aggregate
 * per-product ayna app activity counts (no people). There is no
 * consumer-data endpoint here and none should ever be added (Phase 1 plan,
 * pp.13 and 17).
 *
 * Gates, all on the server:
 * - PARTNER_STUDIO_ENABLED=1, otherwise 404 (feature flag).
 * - A confirmed @aynahealth.co admin (isAdminUser). Brand tenants come in a
 *   later phase with their own row-level security; until then no brand
 *   account can call this.
 * - brand must be one of the snapshot's partner brands.
 *
 * Local design QA only: with no VERCEL_ENV (never set off Vercel) and
 * PARTNER_STUDIO_LOCAL_DEMO=1, the admin check is skipped. Vercel always sets
 * VERCEL_ENV, so this cannot open on a preview or production deploy.
 */
import snapshot from './_partnerStudio/snapshot.js';
import { verifyUser } from './_usageLimit.js';
import { isAdminUser, ADMIN_DOMAIN } from './_admin.js';

function headers(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
}

export function brandList(snap = snapshot) {
  return Object.entries(snap.brands).map(([name, b]) => ({
    name,
    skus: b.skus?.length || 0,
    inScope: (b.skus || []).filter((s) => s.inScope).length,
    empty: Boolean(b.empty),
  }));
}

export default async function handler(req, res) {
  if (process.env.PARTNER_STUDIO_ENABLED !== '1') return res.status(404).json({ error: 'not_found' });
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  headers(res);

  const localDemo = !process.env.VERCEL_ENV && process.env.PARTNER_STUDIO_LOCAL_DEMO === '1';
  if (!localDemo) {
    const { user, error, admin } = await verifyUser(req);
    if (error || !user || !admin) {
      return res.status(error === 'auth_required' || error === 'invalid_session' ? 401 : 503).json({ error: error || 'auth_required' });
    }
    if (!isAdminUser(user)) {
      // Tell the signed-in person why, about their own account only (never the allowlist itself).
      const email = String(user.email || '').toLowerCase();
      const reason = !user.email_confirmed_at ? 'unconfirmed' : !email.endsWith(ADMIN_DOMAIN) ? 'not_team_domain' : 'not_listed';
      return res.status(403).json({ error: 'forbidden', reason, email: user.email || null });
    }
  }

  if (!snapshot.run) return res.status(503).json({ error: 'no_snapshot' });
  const brands = brandList();
  // Vercel fills req.query; the local dev proxy may not, so fall back to the URL.
  let query = req.query;
  if (!query && typeof req.url === 'string') {
    try { query = Object.fromEntries(new URL(req.url, 'http://local').searchParams); } catch { query = {}; }
  }
  const wanted = typeof query?.brand === 'string' ? query.brand : '';
  if (wanted && !Object.hasOwn(snapshot.brands, wanted)) return res.status(404).json({ error: 'unknown_brand' });
  const name = wanted || brands.slice().sort((a, b) => b.inScope - a.inScope)[0]?.name;

  return res.status(200).json({
    run: snapshot.run,
    categories: snapshot.categories,
    // Earlier comparable runs (slot counts only) for trends; empty until run history is stored.
    history: snapshot.history || [],
    // Every catalog product with public facts and aggregate app activity, for whole-catalog comparisons.
    catalog: snapshot.catalog || [],
    outOfScope: snapshot.outOfScope,
    brands,
    brand: { name, ...snapshot.brands[name] },
  });
}
