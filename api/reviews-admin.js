/* global process */
import { verifyUser } from './_usageLimit.js';

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
    const results = [];
    // The popup stores its response in auth metadata, not user_reviews.
    for (let page = 1; ; page += 1) {
      const { data, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (listError) throw listError;
      const users = data?.users || [];
      for (const reviewer of users) {
        const meta = reviewer.user_metadata || {};
        if (!meta.satisfaction_survey_completed_at) continue;
        const rating = Number(meta.satisfaction_rating);
        results.push({
          userId: reviewer.id,
          reviewerEmail: reviewer.email || reviewer.phone || reviewer.id,
          rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
          feedback: typeof meta.satisfaction_feedback === 'string' ? meta.satisfaction_feedback : '',
          heardAboutUs: typeof meta.heard_about_us === 'string' ? meta.heard_about_us : '',
          submittedAt: typeof meta.satisfaction_survey_completed_at === 'string' ? meta.satisfaction_survey_completed_at : '',
        });
      }
      if (users.length < 1000) break;
    }
    results.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

    return res.status(200).json({ ok: true, count: results.length, results });
  } catch (e) {
    console.error('[reviews-admin] failed:', e?.message);
    return res.status(500).json({ error: 'load_failed' });
  }
}
