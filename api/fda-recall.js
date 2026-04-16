/* global process */
// OpenFDA — free, no API key required for basic use
// Add OPENFDA_API_KEY to Vercel env vars for higher rate limits (optional, free at open.fda.gov)
// Docs: https://open.fda.gov/apis/
//
// Important: OpenFDA text search can return unrelated rows (e.g. short names matching substrings
// inside other words, or broad index matches). We post-filter every row so the recall text must
// contain the product name or brand as a whole word/phrase.

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { name, brand, category } = req.query;
  if (!name) return res.status(400).json({ error: 'missing_name' });

  const cat = typeof category === 'string' ? category.trim().toLowerCase() : '';
  // Clinics, virtual care, and similar are not FDA device/drug SKU recalls in this database.
  if (cat === 'telehealth') {
    return res.status(200).json({
      hasRecalls: false,
      recalls: [],
      checkedAt: new Date().toISOString(),
      source: 'OpenFDA',
      skipped: true,
      skipReason: 'telehealth_service',
    });
  }

  const apiKey = process.env.OPENFDA_API_KEY;
  const keyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : '';
  const searchTerm = encodeURIComponent(`"${(brand ? brand + ' ' : '') + name}"`);

  const endpoints = [
    `https://api.fda.gov/device/recall.json?search=product_description:${searchTerm}&limit=10${keyParam}`,
    `https://api.fda.gov/drug/enforcement.json?search=product_description:${searchTerm}&limit=10${keyParam}`,
  ];

  try {
    const results = await Promise.allSettled(
      endpoints.map((url) =>
        fetch(url, {
          headers: { 'User-Agent': 'Ayna-Health-App/1.0' },
          signal: AbortSignal.timeout(8000),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    const raw = [];
    for (const r of results) {
      if (r.status !== 'fulfilled' || !r.value?.results) continue;
      for (const item of r.value.results) {
        raw.push(item);
      }
    }

    const recalls = [];
    for (const item of raw) {
      if (!recallRecordMatchesProduct(item, name, brand)) continue;
      recalls.push({
        recallNumber: item.recall_number || item.id || '',
        date: item.recall_initiation_date || item.report_date || '',
        reason: (item.reason_for_recall || item.voluntary_mandated || '').slice(0, 200),
        status: item.status || '',
        description: (item.product_description || '').slice(0, 200),
      });
      if (recalls.length >= 4) break;
    }

    return res.status(200).json({
      hasRecalls: recalls.length > 0,
      recalls,
      checkedAt: new Date().toISOString(),
      source: 'OpenFDA',
    });
  } catch (e) {
    console.error('OpenFDA error:', e.message);
    return res.status(200).json({ hasRecalls: false, recalls: [], error: e.message, source: 'OpenFDA' });
  }
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function flattenOpenfda(val) {
  if (val == null) return '';
  if (Array.isArray(val)) return val.filter(Boolean).join(' ');
  return String(val);
}

function recallBlob(item) {
  const o = item.openfda || {};
  return [
    item.product_description,
    item.reason_for_recall,
    item.voluntary_mandated,
    item.code_info,
    flattenOpenfda(o.brand_name),
    flattenOpenfda(o.generic_name),
    flattenOpenfda(o.manufacturer_name),
    flattenOpenfda(o.device_name),
    item.product_type,
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Require product name or brand to appear as a whole word (or full multi-word phrase),
 * so we do not show unrelated recalls (e.g. "Tia" matching substrings in other product text).
 */
function recallRecordMatchesProduct(item, name, brand) {
  const blob = recallBlob(item);
  if (!blob.trim()) return false;

  const n = String(name || '').trim();
  const b = String(brand || '').trim();

  if (n.length >= 2 && wordOrPhraseMatches(blob, n)) return true;
  if (b.length >= 2 && wordOrPhraseMatches(blob, b)) return true;
  return false;
}

function wordOrPhraseMatches(blob, token) {
  const t = token.trim();
  if (t.length < 2) return false;

  // 2-character tokens are too ambiguous unless paired with brand elsewhere — reject alone
  if (t.length === 2) return false;

  // Whole phrase (e.g. "Ritual Prenatal Vitamin") or single word with word boundaries
  const re = new RegExp(`\\b${escapeRegex(t)}\\b`, 'i');
  return re.test(blob);
}
