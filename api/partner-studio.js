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
 * - A confirmed @aynahealth.co admin (isAdminUser) sees every brand. A brand
 *   member sees only their own brands, and only when
 *   PARTNER_STUDIO_BRAND_ACCESS=1 (see _partnerStudio/access.js). Until then
 *   no brand account can call this.
 * - brand must be a partner brand or a brand in the catalog.
 *
 * Local design QA only: with no VERCEL_ENV (never set off Vercel) and
 * PARTNER_STUDIO_LOCAL_DEMO=1, the admin check is skipped. Vercel always sets
 * VERCEL_ENV, so this cannot open on a preview or production deploy.
 */
import snapshot from './_partnerStudio/snapshot.js';
import { verifyUser } from './_usageLimit.js';
import { ADMIN_DOMAIN } from './_admin.js';
import { accessFor, brandAccessOn, canOpen, scopeCatalog, scopeCategories, submissionsOn } from './_partnerStudio/access.js';
import { DISCOVERY, DISC_FROM, DISC_TO } from './_partnerStudio/discovery.js';

function headers(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
}

export function brandList(snap = snapshot) {
  const out = Object.entries(snap.brands).map(([name, b]) => ({
    name,
    skus: b.skus?.length || 0,
    inScope: (b.skus || []).filter((s) => s.inScope).length,
    empty: Boolean(b.empty),
    partner: true,
  }));
  // Every other brand in the catalog gets a general view built from public facts and aggregate activity.
  const known = new Set(out.map((b) => b.name));
  const counts = new Map();
  for (const p of snap.catalog || []) if (!known.has(p.brand)) counts.set(p.brand, (counts.get(p.brand) || 0) + 1);
  for (const [name, n] of [...counts].sort((a, b) => a[0].localeCompare(b[0]))) out.push({ name, skus: n, inScope: 0, empty: false, partner: false });
  return out;
}

/** A catalog-only brand: no benchmark rollup, just the shape the screens expect. */
export function catalogBrand(name) {
  return { brand: name, skus: [], categories: [], competitors: [], simulations: [], feed: [], actions: [], catalogOnly: true };
}

export default async function handler(req, res) {
  if (process.env.PARTNER_STUDIO_ENABLED !== '1') return res.status(404).json({ error: 'not_found' });
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  headers(res);

  const localDemo = !process.env.VERCEL_ENV && process.env.PARTNER_STUDIO_LOCAL_DEMO === '1';
  let access = { team: true, brands: [] };
  if (!localDemo) {
    const { user, error, admin } = await verifyUser(req);
    if (error || !user || !admin) {
      return res.status(error === 'auth_required' || error === 'invalid_session' ? 401 : 503).json({ error: error || 'auth_required' });
    }
    access = await accessFor(admin, user);
    if (!access.team && !access.brands.length) {
      // Tell the signed-in person why, about their own account only (never the allowlist itself).
      const email = String(user.email || '').toLowerCase();
      const reason = !user.email_confirmed_at ? 'unconfirmed' : !email.endsWith(ADMIN_DOMAIN) ? (brandAccessOn() ? 'no_brand_access' : 'not_team_domain') : 'not_listed';
      return res.status(403).json({ error: 'forbidden', reason, email: user.email || null });
    }
  }

  if (!snapshot.run) return res.status(503).json({ error: 'no_snapshot' });
  // Brand members only ever see their own brands in the picker and payload.
  const brands = brandList().filter((x) => access.team || canOpen(access, x.name));
  if (!brands.length) return res.status(403).json({ error: 'forbidden', reason: access.team ? 'not_listed' : 'no_brand_access' });
  // Vercel fills req.query; the local dev proxy may not, so fall back to the URL.
  let query = req.query;
  if (!query && typeof req.url === 'string') {
    try { query = Object.fromEntries(new URL(req.url, 'http://local').searchParams); } catch { query = {}; }
  }
  const wanted = typeof query?.brand === 'string' ? query.brand : '';
  if (wanted && !brands.some((b) => b.name === wanted)) return res.status(404).json({ error: 'unknown_brand' });
  const name = wanted || brands.filter((b) => b.partner).sort((a, b) => b.inScope - a.inScope)[0]?.name;

  return res.status(200).json({
    run: snapshot.run,
    categories: access.team ? snapshot.categories : scopeCategories(snapshot.categories, access.brands),
    // Earlier comparable runs (slot counts only) for trends; empty until run history is stored.
    history: snapshot.history || [],
    // Every catalog product with public facts and aggregate app activity, for whole-catalog comparisons.
    // Website discovery source per product (search, browse, other) rides along with activity.
    // Brand accounts never see another brand's per-product numbers: those fold into one combined row per category.
    catalog: (() => {
      const full = (snapshot.catalog || []).map((p) => (DISCOVERY.has(p.id) ? { ...p, src: DISCOVERY.get(p.id) } : p));
      return access.team ? full : scopeCatalog(full, access.brands);
    })(),
    discoveryRange: { from: DISC_FROM, to: DISC_TO },
    access: access.team ? 'team' : 'brand',
    features: { submissions: submissionsOn() },
    outOfScope: snapshot.outOfScope,
    brands,
    brand: { name, ...(Object.hasOwn(snapshot.brands, name) ? snapshot.brands[name] : catalogBrand(name)) },
  });
}
