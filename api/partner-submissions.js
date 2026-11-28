/* global process, Buffer */
/**
 * /api/partner-submissions: brand responses to Partner Studio actions.
 *
 *   POST  { brand, actionId, actionTitle, body, links[], files[{ name, type, data(base64) }] }
 *         A brand member (or the ayna team) sends a response for a brand.
 *   GET   ?brand=<name>   Responses for a brand, newest first, with short-lived
 *         signed links to files. Team: any brand (or all, without ?brand).
 *         Brand members: only their own brands.
 *   PATCH { id, status }  Team only: mark a response in_review or done.
 *
 * Off (404) unless PARTNER_STUDIO_ENABLED=1 and PARTNER_STUDIO_SUBMISSIONS=1,
 * and the tables from supabase/migrations/20261128120000_partner_studio_access.sql
 * exist. Never stores health data: it only accepts what a brand types or attaches.
 */
import { verifyUser } from './_usageLimit.js';
import { accessFor, canOpen, submissionsOn } from './_partnerStudio/access.js';
import { parseLinks, checkFiles } from '../src/partnerStudio/engine/submissions.js';

const BUCKET = 'partner-submissions';
const MAX_BODY = 5000;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // Vercel request bodies stop at 4.5 MB.
const STATUSES = ['new', 'in_review', 'done'];

function headers(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

const safeName = (n) => String(n || 'file').replace(/[^\w.\- ]+/g, '_').slice(-120);

/** Pure validation of a POST body. Exported for tests. */
export function validateSubmission(input) {
  const brand = typeof input?.brand === 'string' ? input.brand.trim() : '';
  const actionId = typeof input?.actionId === 'string' ? input.actionId.trim().slice(0, 120) : '';
  if (!brand || !actionId) return { error: 'brand_and_action_required' };
  const body = typeof input.body === 'string' ? input.body.trim().slice(0, MAX_BODY) : '';
  const links = parseLinks(Array.isArray(input.links) ? input.links.join('\n') : '').slice(0, 20);
  const raw = Array.isArray(input.files) ? input.files : [];
  const decoded = raw.map((f) => {
    const data = typeof f?.data === 'string' ? f.data.replace(/^data:[^,]*,/, '') : '';
    const buf = Buffer.from(data, 'base64');
    return { name: safeName(f?.name), type: String(f?.type || ''), size: buf.length, buf };
  });
  const { ok, rejected } = checkFiles(decoded);
  if (rejected.length) return { error: 'file_rejected', rejected: rejected.map((r) => ({ name: r.name, why: r.why })) };
  if (ok.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES) return { error: 'files_too_large' };
  if (!body && !links.length && !ok.length) return { error: 'empty' };
  return { brand, actionId, actionTitle: typeof input.actionTitle === 'string' ? input.actionTitle.slice(0, 300) : null, body, links, files: ok };
}

export default async function handler(req, res) {
  if (process.env.PARTNER_STUDIO_ENABLED !== '1' || !submissionsOn()) return res.status(404).json({ error: 'not_found' });
  headers(res);
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const { user, error, admin } = await verifyUser(req);
  if (error || !user || !admin) return res.status(error === 'auth_required' || error === 'invalid_session' ? 401 : 503).json({ error: error || 'auth_required' });
  const access = await accessFor(admin, user);
  if (!access.team && !access.brands.length) return res.status(403).json({ error: 'forbidden' });

  if (req.method === 'POST') {
    const v = validateSubmission(req.body || {});
    if (v.error) return res.status(400).json(v);
    if (!canOpen(access, v.brand)) return res.status(403).json({ error: 'forbidden' });
    const id = crypto.randomUUID();
    const files = [];
    for (const f of v.files) {
      const path = `${v.brand.replace(/[^\w-]+/g, '_')}/${id}/${f.name}`;
      const { error: upErr } = await admin.storage.from(BUCKET).upload(path, f.buf, { contentType: f.type, upsert: false });
      if (upErr) return res.status(502).json({ error: 'upload_failed' });
      files.push({ path, name: f.name, type: f.type, size: f.size });
    }
    const row = { id, brand: v.brand, action_id: v.actionId, action_title: v.actionTitle, author_user_id: user.id, author_email: String(user.email).toLowerCase(), body: v.body || null, links: v.links, files };
    const { error: insErr } = await admin.from('partner_submissions').insert(row);
    if (insErr) return res.status(502).json({ error: 'save_failed' });
    return res.status(201).json({ id, createdAt: new Date().toISOString() });
  }

  if (req.method === 'PATCH') {
    if (!access.team) return res.status(403).json({ error: 'forbidden' });
    const { id, status } = req.body || {};
    if (typeof id !== 'string' || !STATUSES.includes(status)) return res.status(400).json({ error: 'bad_request' });
    const { error: upErr } = await admin.from('partner_submissions').update({ status, reviewed_at: new Date().toISOString(), reviewed_by: String(user.email).toLowerCase() }).eq('id', id);
    if (upErr) return res.status(502).json({ error: 'save_failed' });
    return res.status(200).json({ ok: true });
  }

  // GET
  const wanted = typeof req.query?.brand === 'string' ? req.query.brand : '';
  if (wanted && !canOpen(access, wanted)) return res.status(403).json({ error: 'forbidden' });
  let q = admin.from('partner_submissions').select('id, brand, action_id, action_title, author_email, body, links, files, status, created_at').order('created_at', { ascending: false }).limit(200);
  if (wanted) q = q.eq('brand', wanted);
  else if (!access.team) q = q.in('brand', access.brands);
  const { data, error: selErr } = await q;
  if (selErr) return res.status(502).json({ error: 'load_failed' });
  const out = [];
  for (const r of data || []) {
    const files = [];
    for (const f of r.files || []) {
      const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(f.path, 3600);
      files.push({ name: f.name, type: f.type, size: f.size, url: signed?.signedUrl || null });
    }
    out.push({ id: r.id, brand: r.brand, actionId: r.action_id, actionTitle: r.action_title, author: access.team ? r.author_email : null, body: r.body, links: r.links, files, status: r.status, createdAt: r.created_at });
  }
  return res.status(200).json({ submissions: out });
}
