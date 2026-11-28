/* global process */
/**
 * Who may open Partner Studio, and which brands.
 *
 * - ayna team (isAdminUser): every brand.
 * - Brand members: only the brands listed for their confirmed email in
 *   public.partner_brand_members, and only when PARTNER_STUDIO_BRAND_ACCESS=1.
 *   Until then (and until the migration is run) brand accounts get nothing.
 *
 * Fail closed: any error reading the members table means no brand access.
 */
import { isAdminUser } from '../_admin.js';

export const brandAccessOn = () => process.env.PARTNER_STUDIO_BRAND_ACCESS === '1';
export const submissionsOn = () => process.env.PARTNER_STUDIO_SUBMISSIONS === '1';

/** Pure: the brands a member row list grants, ignoring revoked rows. */
export function brandsFromRows(rows) {
  return [...new Set((rows || []).filter((r) => r && !r.revoked_at && r.brand).map((r) => String(r.brand)))];
}

/**
 * @returns {Promise<{ team: boolean, brands: string[] }>}
 */
export async function accessFor(admin, user) {
  if (isAdminUser(user)) return { team: true, brands: [] };
  if (!brandAccessOn() || !admin || !user?.email || !user.email_confirmed_at || user.is_anonymous) return { team: false, brands: [] };
  try {
    const { data, error } = await admin
      .from('partner_brand_members')
      .select('brand, revoked_at')
      .eq('email', String(user.email).trim().toLowerCase());
    if (error) return { team: false, brands: [] };
    return { team: false, brands: brandsFromRows(data) };
  } catch {
    return { team: false, brands: [] };
  }
}

/** May this access open this brand? */
export const canOpen = (access, brand) => Boolean(access?.team || access?.brands?.includes(brand));

/**
 * Pure: the catalog a brand member may see. Their own products keep per-product
 * activity; other brands keep public facts only, and their activity is folded
 * into one combined row per category so category totals and shares still add up
 * without showing any single competitor's numbers.
 */
export function scopeCatalog(catalog, brands) {
  const own = new Set(brands || []);
  const out = [];
  const agg = new Map();
  for (const p of catalog || []) {
    if (own.has(p.brand)) { out.push(p); continue; }
    const { eng, src, ...facts } = p;
    out.push(facts);
    const k = p.category || 'other';
    const a = agg.get(k) || { id: `agg-${k}`, name: 'Other brands combined', brand: 'Other brands combined', category: k, partner: false, aggregate: true, members: 0, eng: { seen: 0, opened: 0, detail: 0, buy: 0 }, src: { search: 0, browse: 0, other: 0 } };
    a.members += 1;
    for (const key of Object.keys(a.eng)) a.eng[key] += Number(eng?.[key]) || 0;
    for (const key of Object.keys(a.src)) a.src[key] += Number(src?.[key]) || 0;
    agg.set(k, a);
  }
  return [...out, ...agg.values()];
}

/** Pure: benchmark categories with other brands' per-product activity removed. */
export function scopeCategories(categories, brands) {
  const own = new Set(brands || []);
  return (categories || []).map((c) => ({
    ...c,
    products: (c.products || []).map((p) => {
      if (own.has(p.brand)) return p;
      const { eng: _eng, ...facts } = p;
      return facts;
    }),
  }));
}
