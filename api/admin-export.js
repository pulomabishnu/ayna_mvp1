/* global process */
/**
 * Admin export for the founders' "ayna submissions tracker" Google Sheet.
 * Read by scripts/google-sheets/ayna-submissions.gs (see docs/submissions-sheet.md).
 *
 *   GET /api/admin-export?source=<source>[&since=<ISO timestamp>]
 *   Authorization: Bearer <ADMIN_EXPORT_TOKEN>
 *
 * Auth: one long random token in the ADMIN_EXPORT_TOKEN env var (at least 32
 * characters, otherwise every request gets 503: fail closed). Compared in
 * constant time (SHA-256 of both sides, then timingSafeEqual). Anything else
 * gets 401. Rate limited per IP before the token is checked. Responses are
 * no-store. Rows are never logged; errors log only a source name and message.
 *
 * Response: { source, mode, columns, rows, next_since, generated_at }
 *   rows        objects keyed by `columns`; `id` is stable for de-duplication.
 *   mode        how the sheet applies them: 'append' (add new ids only),
 *               'upsert' (add new ids, refresh existing ones) or 'replace'
 *               (rewrite the tab: snapshots and daily counts).
 *   next_since  set when a page was full: call again with since=next_since.
 *
 * Sources (one sheet tab each):
 *   claims            free-product claims: product, status, Shipped?, and the
 *                     shipping name/address/email the person typed to receive
 *                     it (needed to ship). Nothing else about the person.
 *   campaign_feedback campaign feedback answers, keyed by claim when there is one.
 *   survey            "How are you liking ayna?" survey + purchase check-ins, the
 *                     anonymous Upstash records (api/_feedbackStore.js). Stay anonymous.
 *   reviews           community review posts + product-page reviews (user_reviews):
 *                     product, stars, text, date; public @handle only for
 *                     non-anonymous community posts.
 *   contact           contact form messages (public.contact_messages).
 *   topics            suggestions (topic, read and product kinds).
 *   partners          product_submissions + early_stage_startups.
 *   invites           invite_stats per inviter (by public @handle, never email).
 *   signups           daily COUNTS only: new accounts, verified, SMS and email opt-ins.
 *
 * Never exported, by design:
 *   - Health data and quiz answers: user_health_profiles, health_* tables,
 *     health intakes, ecosystems, learning memory, AI usage, SMS conversations.
 *     No query in this file touches them (a test enforces it).
 *   - Users' emails and phone numbers, account ids and auth metadata. The only
 *     contact details exported are the contact-form sender's (they wrote to us),
 *     a claimer's shipping email/address (they typed it to get the product
 *     shipped), and partner applicants' business contact (founder names).
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { getClientIp, rateLimit } from './_rateLimit.js';
import { getServiceClient } from './_usageLimit.js';
import { listFeedback } from './_feedbackStore.js';

export const PAGE_SIZE = 2000;
const MIN_TOKEN_LENGTH = 32;
const MAX_FEEDBACK_PAGES = 200; // 20,000 survey rows
const MAX_USER_PAGES = 100; // 100,000 accounts

function sha256(value) {
  return createHash('sha256').update(String(value)).digest();
}

/** Constant-time bearer check. False when the env token is missing or short. */
export function tokenMatches(header, expected = process.env.ADMIN_EXPORT_TOKEN) {
  if (typeof expected !== 'string' || expected.length < MIN_TOKEN_LENGTH) return false;
  const m = /^Bearer\s+(.+)$/i.exec(String(header || '').trim());
  const given = m ? m[1].trim() : '';
  // Hash both so the comparison is fixed length and leaks nothing about length.
  const ok = timingSafeEqual(sha256(given), sha256(expected));
  return ok && given.length > 0;
}

/** Short, stable, non-reversible id piece (never exposes an account id). */
function opaque(...parts) {
  const salt = process.env.ADMIN_EXPORT_TOKEN || '';
  return createHash('sha256').update(`${salt}|${parts.join('|')}`).digest('hex').slice(0, 16);
}

function iso(v) {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

function check({ data, error }, label) {
  if (error) throw new Error(`${label}: ${error.message || 'query_failed'}`);
  return data || [];
}

function pageResult(rows, tsKey) {
  const full = rows.length >= PAGE_SIZE;
  return { rows, next_since: full ? rows[rows.length - 1][tsKey] : null };
}

async function productNames(admin, ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const data = check(await admin.from('product_catalog').select('id,name,brand').in('id', unique), 'product_catalog');
  return Object.fromEntries(data.map((p) => [p.id, [p.brand, p.name].filter(Boolean).join(' ')]));
}

async function handles(admin, userIds) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return {};
  const data = check(await admin.from('community_profiles').select('user_id,username').in('user_id', unique), 'community_profiles');
  return Object.fromEntries(data.filter((p) => p.username).map((p) => [p.user_id, `@${p.username}`]));
}

// ── Sources ────────────────────────────────────────────────────────────────

const SOURCES = {
  claims: {
    mode: 'upsert',
    columns: ['id', 'claimed_at', 'campaign', 'product', 'status', 'shipped', 'shipped_at',
      'ship_to_name', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'shipping_email', 'updated_at'],
    // Small, capped pool: always the full list, so status changes show up.
    async load(admin) {
      const claims = check(await admin.from('reward_claims')
        .select('id,campaign_id,reward_product_id,product_id,fulfillment_status,claimed_at,shipped_at,updated_at')
        .order('claimed_at', { ascending: true }).limit(5000), 'reward_claims');
      const ids = claims.map((c) => c.id);
      const productIds = [...new Set(claims.map((c) => c.reward_product_id))];
      const products = productIds.length
        ? check(await admin.from('reward_products').select('id,product_id,name,brand').in('id', productIds), 'reward_products')
        : [];
      const shipping = ids.length
        ? check(await admin.from('reward_shipping')
          .select('claim_id,full_name,address_line1,address_line2,city,state,postal_code,email,updated_at')
          .in('claim_id', ids), 'reward_shipping')
        : [];
      const catalog = await productNames(admin, products.map((p) => p.product_id));
      const prodById = Object.fromEntries(products.map((p) => [p.id, p]));
      const shipById = Object.fromEntries(shipping.map((s) => [s.claim_id, s]));
      const rows = claims.map((c) => {
        const p = prodById[c.reward_product_id] || {};
        const s = shipById[c.id] || {};
        const updated = [c.updated_at, s.updated_at].filter(Boolean).sort().pop();
        return {
          id: c.id,
          claimed_at: iso(c.claimed_at),
          campaign: c.campaign_id,
          product: catalog[p.product_id] || [p.brand, p.name].filter(Boolean).join(' ') || c.product_id || '',
          status: c.fulfillment_status,
          shipped: ['shipped', 'delivered'].includes(c.fulfillment_status) ? 'Yes' : 'No',
          shipped_at: iso(c.shipped_at),
          ship_to_name: s.full_name || '',
          address_line1: s.address_line1 || '',
          address_line2: s.address_line2 || '',
          city: s.city || '',
          state: s.state || '',
          postal_code: s.postal_code || '',
          shipping_email: s.email || '',
          updated_at: iso(updated),
        };
      });
      return { rows, next_since: null };
    },
  },

  campaign_feedback: {
    mode: 'upsert',
    columns: ['id', 'created_at', 'updated_at', 'campaign', 'claim_id', 'claimed_product', 'question_key', 'question', 'answer', 'characters', 'complete'],
    async load(admin, since) {
      let q = admin.from('campaign_feedback')
        .select('id,campaign_id,user_id,question_key,question,response,char_count,is_complete,created_at,updated_at')
        .order('updated_at', { ascending: true }).limit(PAGE_SIZE);
      if (since) q = q.gte('updated_at', since);
      const data = check(await q, 'campaign_feedback');
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const claims = userIds.length
        ? check(await admin.from('reward_claims').select('id,campaign_id,user_id,reward_product_id').in('user_id', userIds), 'reward_claims')
        : [];
      const rp = claims.length
        ? check(await admin.from('reward_products').select('id,product_id,name,brand').in('id', [...new Set(claims.map((c) => c.reward_product_id))]), 'reward_products')
        : [];
      const catalog = await productNames(admin, rp.map((p) => p.product_id));
      const rpById = Object.fromEntries(rp.map((p) => [p.id, p]));
      const claimFor = Object.fromEntries(claims.map((c) => [`${c.campaign_id}|${c.user_id}`, c]));
      const rows = data.map((r) => {
        const c = claimFor[`${r.campaign_id}|${r.user_id}`];
        const p = c ? rpById[c.reward_product_id] || {} : {};
        return {
          id: r.id,
          created_at: iso(r.created_at),
          updated_at: iso(r.updated_at),
          campaign: r.campaign_id,
          claim_id: c?.id || '',
          claimed_product: c ? catalog[p.product_id] || [p.brand, p.name].filter(Boolean).join(' ') : '',
          question_key: r.question_key,
          question: r.question,
          answer: r.response,
          characters: r.char_count,
          complete: r.is_complete ? 'Yes' : 'No',
        };
      });
      return pageResult(rows, 'updated_at');
    },
  },

  survey: {
    mode: 'append',
    columns: ['id', 'submitted_on', 'kind', 'rating', 'feedback', 'heard_about_us', 'product_id', 'product_name', 'variant', 'answer'],
    async load(_admin, since, { store } = {}) {
      const sinceDay = since ? since.slice(0, 10) : '';
      const rows = [];
      let offset = 0;
      for (let page = 0; page < MAX_FEEDBACK_PAGES && offset !== null; page += 1) {
        const { results, nextCursor } = await listFeedback(offset, store);
        let older = false;
        for (const r of results) {
          if (sinceDay && String(r.submittedAt || '') < sinceDay) { older = true; continue; }
          rows.push({
            id: r.id,
            submitted_on: r.submittedAt || '',
            kind: r.kind,
            rating: r.rating ?? '',
            feedback: r.feedback || '',
            heard_about_us: r.heardAboutUs || '',
            product_id: r.productId || '',
            product_name: r.productName || '',
            variant: r.variant || '',
            answer: r.answer || '',
          });
        }
        // Newest first: once a page reaches rows older than `since`, stop.
        if (older) break;
        offset = nextCursor;
      }
      rows.sort((a, b) => a.submitted_on.localeCompare(b.submitted_on));
      return { rows, next_since: null };
    },
  },

  reviews: {
    mode: 'upsert',
    columns: ['id', 'created_at', 'where', 'product_id', 'product', 'stars', 'would_recommend', 'text', 'handle', 'status'],
    async load(admin, since) {
      let q = admin.from('community_posts')
        .select('id,author_id,product_id,rating,would_recommend,body,is_anonymous,status,created_at')
        .eq('kind', 'review').order('created_at', { ascending: true }).limit(PAGE_SIZE);
      if (since) q = q.gte('created_at', since);
      const posts = check(await q, 'community_posts');

      let uq = admin.from('user_reviews').select('user_id,product_id,ratings,reviews,updated_at').limit(5000);
      if (since) uq = uq.gte('updated_at', since);
      const pdp = check(await uq, 'user_reviews');

      const named = await handles(admin, posts.filter((p) => !p.is_anonymous).map((p) => p.author_id));
      const names = await productNames(admin, [...posts.map((p) => p.product_id), ...pdp.map((r) => r.product_id)]);

      const rows = posts.map((p) => ({
        id: `post:${p.id}`,
        created_at: iso(p.created_at),
        where: 'community',
        product_id: p.product_id || '',
        product: names[p.product_id] || '',
        stars: p.rating ?? '',
        would_recommend: p.would_recommend == null ? '' : p.would_recommend ? 'Yes' : 'No',
        text: p.body || '',
        handle: p.is_anonymous ? '' : named[p.author_id] || '',
        status: p.status || '',
      }));
      for (const r of pdp) {
        const ratings = Array.isArray(r.ratings) ? r.ratings : [];
        const stars = ratings.length ? ratings[ratings.length - 1] : '';
        (Array.isArray(r.reviews) ? r.reviews : []).forEach((rev, i) => {
          const created = iso(rev?.date);
          if (since && created && created < since) return;
          const text = typeof rev?.text === 'string' ? rev.text : '';
          if (!text) return;
          rows.push({
            id: `pdp:${opaque(r.user_id, r.product_id, rev?.date || '', i)}`,
            created_at: created,
            where: 'product page',
            product_id: r.product_id,
            product: names[r.product_id] || '',
            stars,
            would_recommend: '',
            text,
            handle: '', // product-page reviews have no public handle
            status: '',
          });
        });
      }
      rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
      return { rows, next_since: posts.length >= PAGE_SIZE ? iso(posts[posts.length - 1].created_at) : null };
    },
  },

  contact: {
    mode: 'append',
    columns: ['id', 'created_at', 'name', 'email', 'reason', 'subject', 'message'],
    async load(admin, since) {
      let q = admin.from('contact_messages').select('id,created_at,name,email,reason,subject,message')
        .order('created_at', { ascending: true }).limit(PAGE_SIZE);
      if (since) q = q.gte('created_at', since);
      const rows = check(await q, 'contact_messages').map((r) => ({ ...r, created_at: iso(r.created_at) }));
      return pageResult(rows, 'created_at');
    },
  },

  topics: {
    mode: 'append',
    columns: ['id', 'created_at', 'kind', 'topic', 'product_name', 'link', 'reason', 'where', 'platform'],
    async load(admin, since) {
      let q = admin.from('suggestions').select('id,created_at,kind,topic,product_name,link,reason,context,platform')
        .order('created_at', { ascending: true }).limit(PAGE_SIZE);
      if (since) q = q.gte('created_at', since);
      const rows = check(await q, 'suggestions').map((r) => ({
        id: r.id,
        created_at: iso(r.created_at),
        kind: r.kind,
        topic: r.topic || '',
        product_name: r.product_name || '',
        link: r.link || '',
        reason: r.reason || '',
        where: r.context || '',
        platform: r.platform || '',
      }));
      return pageResult(rows, 'created_at');
    },
  },

  partners: {
    mode: 'upsert',
    columns: ['id', 'created_at', 'type', 'name', 'category', 'stage', 'website', 'business_contact', 'status'],
    async load(admin, since) {
      let sq = admin.from('product_submissions').select('id,name,source,status,created_at')
        .order('created_at', { ascending: true }).limit(PAGE_SIZE);
      if (since) sq = sq.gte('created_at', since);
      const subs = check(await sq, 'product_submissions');
      let eq = admin.from('early_stage_startups').select('id,name,category,stage,url,waitlist_url,extra,is_active,created_at')
        .order('created_at', { ascending: true }).limit(PAGE_SIZE);
      if (since) eq = eq.gte('created_at', since);
      const startups = check(await eq, 'early_stage_startups');
      const rows = [
        ...subs.map((s) => ({
          id: `submission:${s.id}`,
          created_at: iso(s.created_at),
          type: 'product submission',
          name: s.name,
          category: '',
          stage: '',
          website: '',
          business_contact: '',
          status: [s.status, s.source ? `via ${s.source}` : ''].filter(Boolean).join(' '),
        })),
        ...startups.map((s) => ({
          id: `startup:${s.id}`,
          created_at: iso(s.created_at),
          type: 'early-stage startup',
          name: s.name,
          category: s.category || '',
          stage: s.stage || '',
          website: s.url || s.waitlist_url || '',
          business_contact: s.extra?.founderNames ? String(s.extra.founderNames) : '',
          status: s.is_active ? 'active' : 'inactive',
        })),
      ].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const full = subs.length >= PAGE_SIZE || startups.length >= PAGE_SIZE;
      return { rows, next_since: full ? rows[rows.length - 1].created_at : null };
    },
  },

  invites: {
    mode: 'replace',
    columns: ['id', 'inviter', 'links_shared', 'opens', 'signups', 'verified_signups', 'verified_phone', 'all_referral_signups'],
    async load(admin) {
      // Never select invite_stats.email.
      const data = check(await admin.from('invite_stats')
        .select('user_id,links_shared,opens,signups,verified_email,verified_phone,all_referral_signups')
        .order('opens', { ascending: false }).limit(5000), 'invite_stats');
      const named = await handles(admin, data.map((r) => r.user_id));
      const rows = data.map((r) => {
        const id = opaque('inviter', r.user_id);
        return {
          id,
          inviter: named[r.user_id] || `inviter ${id.slice(0, 6)}`,
          links_shared: r.links_shared ?? 0,
          opens: r.opens ?? 0,
          signups: r.signups ?? 0,
          verified_signups: r.verified_email ?? 0,
          verified_phone: r.verified_phone ?? 0,
          all_referral_signups: r.all_referral_signups ?? 0,
        };
      });
      return { rows, next_since: null };
    },
  },

  signups: {
    mode: 'replace',
    columns: ['id', 'date', 'new_accounts', 'verified_accounts', 'sms_opt_ins', 'email_opt_ins'],
    // Counts per UTC day. Nothing per person leaves this function.
    async load(admin) {
      const days = new Map();
      const day = (d) => {
        if (!days.has(d)) days.set(d, { id: d, date: d, new_accounts: 0, verified_accounts: 0, sms_opt_ins: 0, email_opt_ins: 0 });
        return days.get(d);
      };
      const created = new Map();
      for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw new Error(`auth_users: ${error.message}`);
        const users = data?.users || [];
        for (const u of users) {
          if (u.is_anonymous || !u.created_at) continue;
          const d = iso(u.created_at).slice(0, 10);
          created.set(u.id, d);
          const row = day(d);
          row.new_accounts += 1;
          if (u.email_confirmed_at) row.verified_accounts += 1;
        }
        if (users.length < 1000) break;
      }
      const sms = check(await admin.from('sms_preferences').select('user_id,reminders,orders,chat,stopped_at,consent_at').limit(100000), 'sms_preferences');
      for (const s of sms) {
        if (!s.consent_at || s.stopped_at || !(s.reminders || s.orders || s.chat)) continue;
        day(iso(s.consent_at).slice(0, 10)).sms_opt_ins += 1;
      }
      // Email: an account opts out by unsubscribing from everything; every
      // other account (by signup day) can receive ayna emails.
      const unsub = new Set(check(await admin.from('email_preferences').select('user_id').eq('unsubscribed_all', true).limit(100000), 'email_preferences')
        .map((r) => r.user_id));
      for (const [userId, d] of created) if (!unsub.has(userId)) day(d).email_opt_ins += 1;
      const rows = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
      return { rows, next_since: null };
    },
  },
};

export const SOURCE_NAMES = Object.keys(SOURCES);

/** Pure export (no HTTP). Used by the handler and the tests. */
export async function buildExport(source, { admin, since = null, store } = {}) {
  const def = SOURCES[source];
  if (!def) throw new Error('unknown_source');
  const { rows, next_since } = await def.load(admin, since, { store });
  return {
    source,
    mode: def.mode,
    columns: def.columns,
    rows: rows.map((r) => Object.fromEntries(def.columns.map((c) => [c, r[c] ?? '']))),
    next_since: next_since || null,
    generated_at: new Date().toISOString(),
  };
}

export function parseSince(value) {
  if (value == null || value === '') return { since: null };
  const s = String(value);
  if (s.length > 40 || !/^\d{4}-\d{2}-\d{2}/.test(s)) return { error: true };
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? { error: true } : { since: d.toISOString() };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const limit = await rateLimit(`admin-export:${getClientIp(req)}`, { max: 120, windowSec: 600 });
  if (!limit.ok) {
    res.setHeader('Retry-After', String(limit.retryAfterSec || 600));
    return res.status(429).json({ error: 'rate_limited' });
  }

  const configured = String(process.env.ADMIN_EXPORT_TOKEN || '');
  if (configured.length < MIN_TOKEN_LENGTH) return res.status(503).json({ error: 'export_not_configured' });
  if (!tokenMatches(req.headers?.authorization, configured)) {
    res.setHeader('WWW-Authenticate', 'Bearer');
    return res.status(401).json({ error: 'unauthorized' });
  }

  const source = String(req.query?.source || '');
  if (!SOURCES[source]) return res.status(400).json({ error: 'unknown_source', sources: SOURCE_NAMES });
  const { since, error: sinceError } = parseSince(req.query?.since);
  if (sinceError) return res.status(400).json({ error: 'invalid_since' });

  const admin = getServiceClient();
  if (!admin) return res.status(503).json({ error: 'server_misconfigured' });

  try {
    return res.status(200).json(await buildExport(source, { admin, since }));
  } catch (e) {
    // Source name and message only, never row content.
    console.error(`[admin-export] ${source} failed:`, String(e?.message || e).slice(0, 200));
    return res.status(500).json({ error: 'source_failed', source });
  }
}

// Exported for tests: the tables this file is allowed to read.
export const READ_TABLES = Object.freeze([
  'reward_claims', 'reward_products', 'reward_shipping', 'campaign_feedback', 'product_catalog',
  'community_posts', 'community_profiles', 'user_reviews', 'contact_messages', 'suggestions',
  'product_submissions', 'early_stage_startups', 'invite_stats', 'sms_preferences', 'email_preferences',
]);
