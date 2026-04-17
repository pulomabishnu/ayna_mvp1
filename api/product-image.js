/* global process */
// Returns a product image URL using Serper.dev Google Image Search API
// Required Vercel env var: SERPER_API_KEY
// Get a free key at serper.dev — 2,500 free searches/month
// If not configured, returns empty string — UI falls back to 🌸 placeholder gracefully

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { name, brand } = req.query;
  if (!name) return res.status(400).json({ error: 'missing_name' });

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return res.status(200).json({ imageUrl: '' });

  const query = `${brand || ''} ${name} product`.trim().replace(/\s+/g, ' ');

  try {
    const r = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 3 }),
    });

    if (!r.ok) return res.status(200).json({ imageUrl: '' });
    const data = await r.json();

    // Find first https image result
    const images = Array.isArray(data?.images) ? data.images : [];
    const imageUrl = images.map((i) => i.imageUrl || i.url || '').find((u) => u.startsWith('https://')) || '';

    return res.status(200).json({ imageUrl });
  } catch {
    return res.status(200).json({ imageUrl: '' });
  }
}
