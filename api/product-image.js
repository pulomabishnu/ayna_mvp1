/* global process */
// Returns a real product image URL using Google Custom Search Image API
// Required Vercel env vars: GOOGLE_CSE_API_KEY, GOOGLE_CSE_CX
// If not configured, returns empty string — UI falls back to 🌸 placeholder gracefully

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { name, brand } = req.query;
  if (!name) return res.status(400).json({ error: 'missing_name' });

  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;

  if (!apiKey || !cx) {
    return res.status(200).json({ imageUrl: '' });
  }

  const query = encodeURIComponent(`${brand || ''} ${name} product`.trim().replace(/\s+/g, ' '));
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&searchType=image&num=1&imgSize=medium&safe=active&imgType=photo`;

  try {
    const r = await fetch(url);
    if (!r.ok) return res.status(200).json({ imageUrl: '' });
    const data = await r.json();
    const imageUrl = data?.items?.[0]?.link || '';
    if (!imageUrl.startsWith('https://')) return res.status(200).json({ imageUrl: '' });
    return res.status(200).json({ imageUrl });
  } catch {
    return res.status(200).json({ imageUrl: '' });
  }
}
