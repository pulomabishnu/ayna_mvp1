/* global process */
// PubMed E-utilities — free, no API key required
// Add NCBI_API_KEY to Vercel env vars for higher rate limits (optional, free at ncbi.nlm.nih.gov/account)
// Docs: https://www.ncbi.nlm.nih.gov/books/NBK25501/

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { query, limit = '5' } = req.query;
  if (!query || query.trim().length < 3) return res.status(400).json({ error: 'missing_query' });

  const n = Math.min(parseInt(limit, 10) || 5, 10);
  const apiKey = process.env.NCBI_API_KEY;
  const keyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : '';

  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query.trim())}&retmax=${n}&retmode=json&sort=relevance${keyParam}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Ayna-Health-App/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (!searchRes.ok) return res.status(200).json({ articles: [], source: 'PubMed' });
    const searchData = await searchRes.json();
    const ids = searchData?.esearchresult?.idlist || [];
    if (!ids.length) return res.status(200).json({ articles: [], source: 'PubMed' });

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json${keyParam}`;
    const summaryRes = await fetch(summaryUrl, {
      headers: { 'User-Agent': 'Ayna-Health-App/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (!summaryRes.ok) return res.status(200).json({ articles: [], source: 'PubMed' });
    const summaryData = await summaryRes.json();
    const result = summaryData?.result || {};

    const articles = ids.map((id) => {
      const item = result[id];
      if (!item) return null;
      const authors = Array.isArray(item.authors)
        ? item.authors.slice(0, 3).map((a) => a.name).join(', ')
        : '';
      return {
        pmid: id,
        title: item.title || '',
        authors,
        journal: item.fulljournalname || item.source || '',
        year: item.pubdate ? item.pubdate.slice(0, 4) : '',
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        source: 'PubMed',
      };
    }).filter(Boolean);

    return res.status(200).json({ articles, total: ids.length, source: 'PubMed' });
  } catch (e) {
    console.error('PubMed error:', e.message);
    return res.status(200).json({ articles: [], source: 'PubMed', error: e.message });
  }
}
