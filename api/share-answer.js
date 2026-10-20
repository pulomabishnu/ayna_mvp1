/* global process */
/**
 * Shared Ask ayna answers.
 *
 *   POST   /api/share-answer               { question, answer, sources? }  (Bearer token)
 *          -> { slug, url }  Creates a link. Real accounts only, rate limited.
 *   DELETE /api/share-answer?slug=<slug>                                   (Bearer token)
 *          -> { ok: true }   Stops sharing (owner only).
 *   GET    /api/share-answer?slug=<slug>
 *          -> { question, answer, sources, created_at, owner: { display_name, username, avatar_url, user_id } }
 *          Counts one open per visitor per link per day (salted daily hash, no IP stored).
 *   GET    /api/share-answer?slug=<slug>&format=html
 *          The site's index.html with this link's title, preview tags and noindex
 *          (vercel.json rewrites /a/<slug> here so link previews read right).
 *
 * Stores only what she chose to share. Needs supabase/shared_answers_2026-10-20.sql.
 */
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp } from './_rateLimit.js';
import { verifyUser } from './_usageLimit.js';
import {
  generateSlug, isValidSlug, validateShareInput, sharedAnswerUrl, sharedAnswerTitle, firstNameOf, PUBLIC_SITE,
} from '../src/utils/sharedAnswer.js';

let _admin = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

const isMissingTable = (error) => error && (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message || ''));
const BOT_UA = /bot|crawl|spider|preview|facebookexternalhit|slack|whatsapp|telegram|discord|embedly|vkshare|skype|headless/i;

function siteOrigin(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  // Only our own hosts; anything else gets the public site.
  if (/^(www\.)?aynahealth\.co$/i.test(host) || /^[a-z0-9-]+\.vercel\.app$/i.test(host)) return `https://${host}`;
  return PUBLIC_SITE;
}

/** Salted, day-scoped visitor key. The IP never leaves this function. */
export function visitorKey({ ip, ua, slug, day, salt }) {
  return crypto.createHmac('sha256', String(salt || 'ayna-share-open')).update(`${day}|${slug}|${ip}|${ua}`).digest('hex').slice(0, 32);
}

function parseBody(req) {
  if (req.body == null) return {};
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return null; } }
  return req.body;
}

async function ownerProfile(admin, ownerId) {
  const owner = { user_id: ownerId, display_name: '', username: '', avatar_url: '' };
  try {
    const { data } = await admin.from('community_profiles').select('display_name, username, avatar_url').eq('user_id', ownerId).maybeSingle();
    if (data) Object.assign(owner, { display_name: data.display_name || '', username: data.username || '', avatar_url: data.avatar_url || '' });
  } catch { /* profile is optional */ }
  if (!owner.display_name) {
    // No Community profile yet: her first name only, as she typed it at sign-up.
    try {
      const { data } = await admin.auth.admin.getUserById(ownerId);
      const meta = data?.user?.user_metadata || {};
      owner.display_name = firstNameOf(meta.first_name || meta.full_name || meta.name || '');
    } catch { /* stays empty: "An answer from ayna" */ }
  }
  return owner;
}

async function loadShared(admin, slug) {
  const { data, error } = await admin.from('shared_answers')
    .select('id, owner_id, question, answer, sources, created_at, revoked_at').eq('id', slug).maybeSingle();
  if (error) throw error;
  return data && !data.revoked_at ? data : null;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let _template = null;
async function indexTemplate(origin) {
  if (_template) return _template;
  try {
    const r = await fetch(`${origin}/index.html`, { headers: { accept: 'text/html' } });
    if (r.ok) { _template = await r.text(); return _template; }
  } catch { /* fall back below */ }
  return null;
}

export function injectMeta(html, { title, description, url }) {
  const tags = [
    `<title>${esc(title)}</title>`,
    '<meta name="robots" content="noindex, nofollow" />',
    `<meta name="description" content="${esc(description)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    '<meta property="og:type" content="article" />',
  ].join('\n  ');
  const stripped = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+(?:name|property)="(?:description|og:title|og:description|og:url|og:type|robots)"[^>]*>\s*/gi, '');
  return stripped.replace(/<head([^>]*)>/i, `<head$1>\n  ${tags}`);
}

async function handleHtml(req, res, admin, slug) {
  const origin = siteOrigin(req);
  let title = 'An answer from ayna';
  let description = 'This answer isn’t shared anymore. Ask ayna your own question.';
  if (admin && isValidSlug(slug)) {
    try {
      const row = await loadShared(admin, slug);
      if (row) {
        const owner = await ownerProfile(admin, row.owner_id);
        title = sharedAnswerTitle(owner.display_name);
        description = 'Read the answer, then ask ayna your own question.';
      }
    } catch { /* generic tags */ }
  }
  const meta = { title, description, url: `${PUBLIC_SITE}/a/${isValidSlug(slug) ? slug : ''}` };
  const template = await indexTemplate(origin);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
  if (template) return res.status(200).send(injectMeta(template, meta));
  return res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />${injectMeta('<head></head>', meta).replace(/^<head>|<\/head>$/g, '')}</head><body><p><a href="${PUBLIC_SITE}">Open ayna</a></p></body></html>`);
}

async function handleGet(req, res, admin) {
  const slug = String(req.query?.slug || '');
  if (req.query?.format === 'html') return handleHtml(req, res, admin, slug);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'invalid_slug' });
  const ip = getClientIp(req);
  const ipKey = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
  const rl = await rateLimit(`share-answer:read:${ipKey}`, { max: 120, windowSec: 60 });
  if (!rl.ok) { res.setHeader('Retry-After', String(rl.retryAfterSec || 60)); return res.status(429).json({ error: 'rate_limited' }); }
  if (!admin) return res.status(503).json({ error: 'not_configured' });

  let row;
  try { row = await loadShared(admin, slug); } catch (error) {
    if (isMissingTable(error)) return res.status(404).json({ error: 'not_found' });
    console.error('[share-answer] read failed:', error?.message);
    return res.status(502).json({ error: 'query_failed' });
  }
  if (!row) return res.status(404).json({ error: 'not_found' });
  const owner = await ownerProfile(admin, row.owner_id);

  // Count the open: not the owner, not a link-preview bot, once per visitor per day.
  const ua = String(req.headers['user-agent'] || '');
  let viewerId = null;
  if (req.headers.authorization) { try { viewerId = (await verifyUser(req)).user?.id || null; } catch { /* anonymous open */ } }
  let counted = false;
  if (viewerId !== row.owner_id && !BOT_UA.test(ua)) {
    const day = new Date().toISOString().slice(0, 10);
    const key = visitorKey({ ip, ua, slug, day, salt: process.env.SHARE_OPEN_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY });
    try {
      const { error } = await admin.from('shared_answer_opens').insert({ slug, day, visitor_key: key });
      counted = !error;
    } catch { /* counting never blocks the page */ }
  }

  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).json({
    slug: row.id,
    question: row.question,
    answer: row.answer,
    sources: Array.isArray(row.sources) ? row.sources : [],
    created_at: row.created_at,
    owner,
    is_owner: viewerId === row.owner_id,
    first_open_today: counted,
  });
}

async function handlePost(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const { user, error, admin } = await verifyUser(req);
  if (!user) return res.status(401).json({ error: error || 'auth_required' });
  const body = parseBody(req);
  if (body === null) return res.status(400).json({ error: 'invalid_json' });
  const check = validateShareInput(body);
  if (!check.ok) return res.status(400).json({ error: check.error });

  const hour = await rateLimit(`share-answer:create:h:${user.id}`, { max: 20, windowSec: 3600 });
  const day = hour.ok ? await rateLimit(`share-answer:create:d:${user.id}`, { max: 100, windowSec: 86400 }) : hour;
  if (!hour.ok || !day.ok) { res.setHeader('Retry-After', String((hour.ok ? day : hour).retryAfterSec || 3600)); return res.status(429).json({ error: 'rate_limited' }); }

  const db = getAdmin() || admin;
  if (!db) return res.status(503).json({ error: 'not_configured' });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = generateSlug();
    const { error: insertError } = await db.from('shared_answers').insert({ id: slug, owner_id: user.id, ...check.value });
    if (!insertError) return res.status(200).json({ slug, url: sharedAnswerUrl(slug, PUBLIC_SITE) });
    if (insertError.code === '23505') continue; // slug taken, draw again
    if (isMissingTable(insertError)) return res.status(503).json({ error: 'not_ready' });
    console.error('[share-answer] insert failed:', insertError.message);
    return res.status(502).json({ error: 'insert_failed' });
  }
  return res.status(502).json({ error: 'insert_failed' });
}

async function handleDelete(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const { user, error, admin } = await verifyUser(req);
  if (!user) return res.status(401).json({ error: error || 'auth_required' });
  const body = parseBody(req) || {};
  const slug = String(req.query?.slug || body.slug || '');
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'invalid_slug' });
  const db = getAdmin() || admin;
  if (!db) return res.status(503).json({ error: 'not_configured' });
  const { error: updateError } = await db.from('shared_answers')
    .update({ revoked_at: new Date().toISOString() }).eq('id', slug).eq('owner_id', user.id).is('revoked_at', null);
  if (updateError) { console.error('[share-answer] revoke failed:', updateError.message); return res.status(502).json({ error: 'update_failed' }); }
  return res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Content-Type', 'application/json');
    const allowList = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
    if (req.headers.origin && allowList.includes(req.headers.origin)) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  if (req.method === 'GET') return handleGet(req, res, getAdmin());
  if (req.method === 'POST') return handlePost(req, res);
  if (req.method === 'DELETE') return handleDelete(req, res);
  res.setHeader('Content-Type', 'application/json');
  return res.status(405).json({ error: 'Method not allowed' });
}
