/* global process */
import { verifyUser } from './_usageLimit.js';
import { getProductById } from '../src/data/products.js';

function setPrivateResponseHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
}

// Comma-separated allowlist, e.g. "ameera@ayna.com,puloma@ayna.com,eliz@ayna.com".
// Set in Vercel project env vars — never hardcoded, so the list can change
// without a deploy. No env var set means no one gets in (fail closed).
function isAdminEmail(email) {
  if (!email) return false;
  const allow = String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(String(email).trim().toLowerCase());
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  setPrivateResponseHeaders(res);

  const { user, error, admin } = await verifyUser(req);
  if (error || !user || !admin) {
    return res.status(error === 'auth_required' || error === 'invalid_session' ? 401 : 503).json({
      error: error || 'auth_required',
    });
  }

  if (!isAdminEmail(user.email)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  try {
    const { data: rows, error: rowsError } = await admin
      .from('user_reviews')
      .select('user_id, product_id, ratings, reviews');
    if (rowsError) throw new Error(rowsError.message);

    // user_reviews has no email column — look reviewers up via the auth
    // admin API instead of joining a table that doesn't carry it. Paginated
    // defensively; a beta-stage product won't have more than a page or two.
    const emailByUserId = new Map();
    for (let page = 1; page <= 10; page += 1) {
      const { data, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (listError || !data?.users?.length) break;
      for (const u of data.users) emailByUserId.set(u.id, u.email || u.phone || u.id);
      if (data.users.length < 1000) break;
    }

    const results = (rows || [])
      .filter((row) => (row.reviews?.length || 0) > 0 || (row.ratings?.length || 0) > 0)
      .map((row) => {
        const product = getProductById(row.product_id);
        return {
          productId: row.product_id,
          productName: product?.name || row.product_id,
          reviewerEmail: emailByUserId.get(row.user_id) || row.user_id,
          ratings: Array.isArray(row.ratings) ? row.ratings : [],
          // { text, date } entries — see src/data/aynaReviews.js addReview().
          reviews: Array.isArray(row.reviews) ? row.reviews : [],
        };
      })
      // Newest activity first: most recent review date per product, falling
      // back to product name so rating-only rows still sort predictably.
      .sort((a, b) => {
        const aLatest = a.reviews.map((r) => r.date || '').sort().pop() || '';
        const bLatest = b.reviews.map((r) => r.date || '').sort().pop() || '';
        return bLatest.localeCompare(aLatest) || a.productName.localeCompare(b.productName);
      });

    return res.status(200).json({ ok: true, count: results.length, results });
  } catch (e) {
    console.error('[reviews-admin] failed:', e?.message);
    return res.status(500).json({ error: 'load_failed' });
  }
}
