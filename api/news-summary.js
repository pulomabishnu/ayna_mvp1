/* global process */
// GET /api/news-summary: a short, plain-English summary of the latest ayna
// announcement for the landing page's "ayna news" slide. The summary is
// written by the model from the announcement text only (nothing added), and
// cached per announcement so the model runs once per post, not per visit.
import { createClient } from '@supabase/supabase-js';
import { callWithFallback, parseProviderOrder, noEmDash } from './_llm.js';

let _admin = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

/** Markdown off, whitespace collapsed: what a reader would see. */
export function plainText(md) {
  return String(md || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_|`|~~)/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** No-model fallback: the first sentence or two, cut at a word. */
export function fallbackSummary(body, max = 170) {
  const t = plainText(body).replace(/^(hi|hey|hello)[^.!?]*[.!?]\s*/i, '').replace(/(^|\s)\d{1,2}[.)]\s+/g, '$1').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return stop > 60 ? cut.slice(0, stop + 1) : `${cut.replace(/\s+\S*$/, '')}…`;
}

const cache = new Map(); // announcement id -> summary

export async function summarize(a, { call = callWithFallback } = {}) {
  if (cache.has(a.id)) return cache.get(a.id);
  let summary = null;
  try {
    const { text } = await call(parseProviderOrder('AI_NEWS_PROVIDER_ORDER', 'anthropic,openai,gemini'), {
      system: 'You write one-line news summaries for ayna, a women\'s health product discovery site. Use only facts in the announcement. Never add claims. Lowercase, warm, plain English, no markdown, no emoji, no em dashes, no quotation marks. One or two short sentences, under 170 characters.',
      prompt: `Announcement title: ${a.title}\n\nAnnouncement text:\n${plainText(a.body).slice(0, 3000)}\n\nWrite the summary.`,
      maxTokens: 120,
      temperature: 0.2,
      maxAttempts: 2,
      timeoutMs: 12_000,
    });
    summary = noEmDash(String(text || '').replace(/^["'\s]+|["'\s]+$/g, '').replace(/[*_`#]/g, '').trim());
    if (!summary || summary.length > 260) summary = null;
  } catch { summary = null; }
  const out = { summary: summary || fallbackSummary(a.body), ai: Boolean(summary) };
  if (summary) cache.set(a.id, out);
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'method_not_allowed' }); }
  const admin = getAdmin();
  if (!admin) return res.status(200).json({ item: null });
  const { data, error } = await admin.from('community_announcements').select('id, title, body, created_at').order('created_at', { ascending: false }).limit(1);
  if (error || !data?.[0]) return res.status(200).json({ item: null });
  const a = data[0];
  const { summary, ai } = await summarize(a);
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
  return res.status(200).json({ item: { id: a.id, title: plainText(a.title).slice(0, 120), summary, ai, created_at: a.created_at } });
}
