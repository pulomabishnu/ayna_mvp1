/* global process */
// NIH Dietary Supplement Label Database (DSLD) — free, no API key required
// 200,000+ verified supplement labels with real ingredient data
// Docs: https://api.ods.od.nih.gov/dsld/v9/docs

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'unknown';
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { query, limit = '10' } = req.query;
  if (!query || query.trim().length < 2) return res.status(400).json({ error: 'missing_query' });

  // Math.min alone capped the top but not the bottom: ?limit=-500 passed
  // straight through to NIH as size=-500 and 400'd, which was then masked
  // as an empty result set.
  const n = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 25);
  const url = `https://api.ods.od.nih.gov/dsld/v9/label?name=${encodeURIComponent(query.trim())}&status=Y&size=${n}`;

  try {
    const r = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Ayna-Health-App/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return res.status(200).json({ products: [], source: 'NIH DSLD', error: `DSLD ${r.status}` });
    const data = await r.json();
    const hits = Array.isArray(data?.hits?.hits) ? data.hits.hits : [];

    const products = hits.map((hit) => {
      const s = hit?._source || {};
      const brandName = s.brandName || s.manufacturerName || '';
      const productName = s.productName || s.name || '';
      const ingredients = Array.isArray(s.dietaryIngredients)
        ? s.dietaryIngredients.map((i) => i.ingredientName || i.name).filter(Boolean).slice(0, 10)
        : [];
      const imageUrl = (s.imageUrl || '').startsWith('https://') ? s.imageUrl : '';
      const dsldId = s.dsldId || hit._id || '';
      return {
        // Deterministic: a Math.random() id changed on every render, breaking
        // React keys and defeating the resolvedImages cache guard (which
        // re-triggered a paid image lookup per render).
        id: `dsld-${dsldId || slugify(`${brandName}-${productName}`)}`,
        name: productName || brandName,
        brand: brandName,
        category: 'supplement',
        type: 'physical',
        summary: ingredients.length > 0
          ? `Contains: ${ingredients.slice(0, 5).join(', ')}${ingredients.length > 5 ? ', and more' : ''}. NIH-verified label data.`
          : 'Dietary supplement. NIH-verified label. See full label for ingredients.',
        ingredients,
        image: imageUrl,
        price: 'See retailer',
        tags: ['supplement', 'nih-verified'],
        safety: {
          // Deliberately empty. This route only queries NIH DSLD — it never
          // contacts the FDA — so it must not assert anything about recalls.
          // It previously stamped "No active FDA recalls on file at time of
          // retrieval" onto every supplement, which reads as the result of a
          // live check that never happened. The live check is /api/fda-recall.
          recalls: '',
          materials: ingredients.slice(0, 3).join(', ') || '',
          sideEffects: '',
          opinionAlerts: '',
        },
        dsldId,
        dsldVerified: true,
        llmGenerated: false,
        url: dsldId ? `https://dsld.od.nih.gov/product-label/${dsldId}` : '',
        whereToBuy: ['Amazon', 'iHerb', 'Target', 'Brand website'],
        source: 'NIH DSLD',
      };
    }).filter((p) => p.name && p.name.length > 2);

    // Pure function of the query against a slowly-changing NIH label database,
    // so this is an ideal edge-cache candidate. Set on the SUCCESS path only —
    // the two failure branches above return 200 with an empty product list, and
    // caching those would pin an upstream blip for a day.
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({
      products,
      total: data?.hits?.total?.value || products.length,
      source: 'NIH DSLD',
    });
  } catch (e) {
    console.error('DSLD search error:', e.message);
    return res.status(200).json({ products: [], source: 'NIH DSLD', error: e.message });
  }
}
