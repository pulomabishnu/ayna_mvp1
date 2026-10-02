/* global process */
import { listFeedback } from './_feedbackStore.js';
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

// Team/test accounts whose reviews are hidden from this admin page and left
// out of every count it shows. Read-time filter only: the stored reviews are
// never deleted or modified. Matched case-insensitively after trimming.
const EXCLUDED_REVIEWER_EMAILS = new Set([
  'eliz@aynahealth.co',
  'elizcelik2003@gmail.com',
  'puloma@aynahealth.co',
  'pulomacornell@gmail.com',
  'pulomabackup@gmail.com',
  'pb472@cornell.edu',
  'lalaloops99@gmail.com',
  'o.ameera24@gmail.com',
  'ao369@cornell.edu',
  'ameera@aynahealth.co',
]);

function isExcludedReviewer(email) {
  if (typeof email !== 'string') return false;
  return EXCLUDED_REVIEWER_EMAILS.has(email.trim().toLowerCase());
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
    const offset = Math.max(0, Math.min(1000000, Number.parseInt(req.query?.cursor || '0', 10) || 0));
    const anonymous = await listFeedback(offset);
    const results = [...anonymous.results];
    // Historical replies remain in auth metadata; new replies are stored separately.
    for (let page = 1; offset === 0; page += 1) {
      const { data, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (listError) throw listError;
      const users = data?.users || [];
      for (const reviewer of users) {
        const meta = reviewer.user_metadata || {};
        if (!meta.satisfaction_survey_completed_at) continue;
        if (isExcludedReviewer(reviewer.email)) continue;
        const rating = Number(meta.satisfaction_rating);
        results.push({
          id: `legacy-${results.length}`,
          kind: 'survey',
          campaign: 'legacy',
          rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
          feedback: typeof meta.satisfaction_feedback === 'string' ? meta.satisfaction_feedback : '',
          heardAboutUs: typeof meta.heard_about_us === 'string' ? meta.heard_about_us : '',
          submittedAt: typeof meta.satisfaction_survey_completed_at === 'string' ? meta.satisfaction_survey_completed_at.slice(0, 10) : '',
        });
      }
      if (users.length < 1000) break;
    }
    results.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

    return res.status(200).json({ ok: true, count: results.length, results, nextCursor: anonymous.nextCursor });
  } catch (e) {
    console.error('[reviews-admin] failed:', e?.message);
    return res.status(500).json({ error: 'load_failed' });
  }
}
