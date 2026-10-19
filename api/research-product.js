/* global process */
/**
 * "Research this product" for the ayna team (/admin/research).
 *
 *   POST  { product: {id, name, brand, url, category, summary, ingredients}, section }
 *         Team admin only. Researches ONE section with Claude + web search,
 *         runs the safety checks in _productResearch.js, checks every link
 *         loads, and saves it as a DRAFT. Nothing is shown on the site yet.
 *   PATCH { id, decision: 'approve' | 'reject', edited? }
 *         Team admin only. Approving makes that section visible on the
 *         product page, where it only fills an empty section.
 *   GET   ?product=<id>   Public: approved sections for one product.
 *   GET   ?list=1         Team admin only: every draft, newest first.
 *
 * Admins are the emails in the ADMIN_EMAILS env var (same list as
 * /admin/reviews). No env var means no one gets in.
 */
import { verifyUser, getServiceClient } from './_usageLimit.js';
import { extractBalancedJsonObject, tryParseJsonCandidate } from './_llm.js';
import { isSafePublicUrl } from './_ssrfSafeFetch.js';
import { SECTIONS, buildPrompt, sanitizeDraft, draftUrls, dropUrls } from './_productResearch.js';

const MODEL = () => process.env.ANTHROPIC_RESEARCH_MODEL || 'claude-sonnet-5-5';

function isAdminEmail(email) {
  const allow = String(process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return Boolean(email) && allow.includes(String(email).trim().toLowerCase());
}

function privateHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

const clip = (v, n) => String(v || '').trim().slice(0, n);

export function cleanProduct(p) {
  const product = {
    id: clip(p?.id, 120) || '',
    name: clip(p?.name, 200),
    brand: clip(p?.brand, 120),
    url: /^https:\/\//.test(String(p?.url || '')) ? clip(p.url, 500) : '',
    category: clip(p?.category, 60),
    summary: clip(p?.summary, 800),
    ingredients: clip(p?.ingredients, 800),
  };
  if (!product.id) product.id = `new-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)}`;
  return product;
}

/** Ask Claude (with web search and page fetching) for one section. */
async function research(product, section) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw Object.assign(new Error('ANTHROPIC_API_KEY is not set'), { code: 'not_configured' });
  // Server tools can pause a long turn (stop_reason 'pause_turn'): send it back to continue,
  // inside the same overall time budget, instead of failing after the searches were paid for.
  const deadline = Date.now() + 48_000;
  const messages = [{ role: 'user', content: buildPrompt(product, section) }];
  let data = null;
  for (let turn = 0; turn < 4; turn += 1) {
    const left = deadline - Date.now();
    if (left < 3_000) throw Object.assign(new Error('research timed out'), { code: 'llm_failed' });
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(left),
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-fetch-2025-09-10',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL(),
        max_tokens: 2000,
        temperature: 0,
        tools: [
          { type: 'web_search_20250305', name: 'web_search', max_uses: 5 },
          { type: 'web_fetch_20250910', name: 'web_fetch', max_uses: 5 },
        ],
        messages,
      }),
    });
    if (!res.ok) throw Object.assign(new Error(`anthropic ${res.status}`), { code: 'llm_failed', status: res.status });
    data = await res.json();
    if (data?.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: data.content || [] });
  }
  // Text can start in a paused turn and finish in the next: read every turn's text.
  const blocks = [...messages.slice(1).flatMap((m) => (Array.isArray(m.content) ? m.content : [])), ...(data?.content || [])];
  const text = blocks.filter((b) => b?.type === 'text').map((b) => b.text).join('\n');
  const parsed = tryParseJsonCandidate(extractBalancedJsonObject(text) || text);
  if (!parsed || typeof parsed !== 'object') throw Object.assign(new Error('no JSON in reply'), { code: 'bad_reply' });
  return parsed;
}

/** A link counts as dead only on 404/410, a 5xx or no answer. Bot walls (401/403/429) are kept and noted. */
async function checkLinks(urls) {
  const dead = new Set();
  const notes = [];
  await Promise.all([...new Set(urls)].map(async (url) => {
    if (!(await isSafePublicUrl(url))) { dead.add(url); notes.push(`Removed a link that isn't a public web page (${url})`); return; }
    try {
      const r = await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'Ayna-Health-App/1.0 (+https://ayna.health)' } });
      if (r.status === 404 || r.status === 410 || r.status >= 500) { dead.add(url); notes.push(`Removed a link that didn't load (${r.status}): ${url}`); }
      else if ([401, 403, 429].includes(r.status)) notes.push(`Couldn't open to double-check (site blocks bots, ${r.status}): ${url}`);
    } catch {
      dead.add(url); notes.push(`Removed a link that didn't load: ${url}`);
    }
  }));
  return { dead, notes };
}

export default async function handler(req, res) {
  // Public: approved research for one product page.
  if (req.method === 'GET' && req.query?.product) {
    const db = getServiceClient();
    if (!db) return res.status(200).json({ sections: {} });
    const id = clip(req.query.product, 120);
    const { data, error } = await db.from('product_research').select('section, approved').eq('product_id', id).not('approved', 'is', null);
    if (error) return res.status(200).json({ sections: {} });
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    const sections = {};
    for (const row of data || []) if (row?.approved) sections[row.section] = row.approved;
    return res.status(200).json({ sections });
  }

  privateHeaders(res);
  const { user, error, admin } = await verifyUser(req);
  if (error || !user || !admin) return res.status(error === 'server_misconfigured' ? 503 : 401).json({ error: error || 'auth_required' });
  if (!user.email_confirmed_at || !isAdminEmail(user.email)) return res.status(403).json({ error: 'forbidden' });

  if (req.method === 'GET') {
    const { data, error: e } = await admin.from('product_research').select('*').order('updated_at', { ascending: false }).limit(500);
    if (e) return res.status(503).json({ error: 'table_missing', detail: 'Run supabase/migrations/20261015120000_product_research.sql once.' });
    return res.status(200).json({ drafts: data || [] });
  }

  if (req.method === 'POST') {
    const section = String(req.body?.section || '');
    if (!SECTIONS.includes(section)) return res.status(400).json({ error: 'bad_section' });
    const product = cleanProduct(req.body?.product);
    if (!product.name) return res.status(400).json({ error: 'name_required' });
    let raw;
    try { raw = await research(product, section); } catch (e) {
      return res.status(e.code === 'not_configured' ? 503 : 502).json({ error: e.code || 'research_failed' });
    }
    const { draft: first, issues } = sanitizeDraft(section, raw);
    const { dead, notes } = await checkLinks(draftUrls(first));
    const draft = dropUrls(first, dead);
    const row = {
      product_id: product.id, product_name: product.name, brand: product.brand || null, product_url: product.url || null,
      section, status: 'draft', draft, issues: [...issues, ...notes],
      // `approved` is left out on purpose: re-running research on a published
      // section keeps the published version live until the new draft is reviewed.
      created_by: user.email, updated_at: new Date().toISOString(),
    };
    const { data, error: e } = await admin.from('product_research').upsert(row, { onConflict: 'product_id,section' }).select().single();
    if (e) return res.status(503).json({ error: 'table_missing', detail: 'Run supabase/migrations/20261015120000_product_research.sql once.', draft: row });
    return res.status(200).json({ draft: data });
  }

  if (req.method === 'PATCH') {
    const id = clip(req.body?.id, 60);
    const decision = req.body?.decision;
    if (!id || !['approve', 'reject'].includes(decision)) return res.status(400).json({ error: 'bad_request' });
    const { data: existing, error: e1 } = await admin.from('product_research').select('*').eq('id', id).single();
    if (e1 || !existing) return res.status(404).json({ error: 'not_found' });
    // An edit goes through the same checks as the research did.
    const approved = decision === 'approve' ? sanitizeDraft(existing.section, req.body?.edited || existing.draft).draft : null;
    const patch = { status: decision === 'approve' ? 'approved' : 'rejected', approved, reviewed_by: user.email, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { data, error: e2 } = await admin.from('product_research').update(patch).eq('id', id).select().single();
    if (e2) return res.status(503).json({ error: 'save_failed' });
    return res.status(200).json({ draft: data });
  }

  res.setHeader('Allow', 'GET, POST, PATCH');
  return res.status(405).json({ error: 'method_not_allowed' });
}
