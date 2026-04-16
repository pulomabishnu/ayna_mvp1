/* global process */
// OpenFDA — free, no API key required for basic use
// Add OPENFDA_API_KEY to Vercel env vars for higher rate limits (optional, free at open.fda.gov)
// Docs: https://open.fda.gov/apis/

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { name, brand } = req.query;
  if (!name) return res.status(400).json({ error: 'missing_name' });

  const apiKey = process.env.OPENFDA_API_KEY;
  const keyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : '';
  const searchTerm = encodeURIComponent(`"${(brand ? brand + ' ' : '') + name}"`);

  const endpoints = [
    `https://api.fda.gov/device/recall.json?search=product_description:${searchTerm}&limit=3${keyParam}`,
    `https://api.fda.gov/drug/enforcement.json?search=product_description:${searchTerm}&limit=3${keyParam}`,
  ];

  try {
    const results = await Promise.allSettled(
      endpoints.map((url) =>
        fetch(url, {
          headers: { 'User-Agent': 'Ayna-Health-App/1.0' },
          signal: AbortSignal.timeout(5000),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    const recalls = [];
    for (const r of results) {
      if (r.status !== 'fulfilled' || !r.value?.results) continue;
      for (const item of r.value.results.slice(0, 2)) {
        recalls.push({
          recallNumber: item.recall_number || item.id || '',
          date: item.recall_initiation_date || item.report_date || '',
          reason: (item.reason_for_recall || item.voluntary_mandated || '').slice(0, 200),
          status: item.status || '',
          description: (item.product_description || '').slice(0, 200),
        });
      }
    }

    return res.status(200).json({
      hasRecalls: recalls.length > 0,
      recalls: recalls.slice(0, 4),
      checkedAt: new Date().toISOString(),
      source: 'OpenFDA',
    });
  } catch (e) {
    console.error('OpenFDA error:', e.message);
    return res.status(200).json({ hasRecalls: false, recalls: [], error: e.message, source: 'OpenFDA' });
  }
}
