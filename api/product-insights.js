/**
 * Vercel serverless: AI-assisted sourcing for clinical guidance, literature, and community starting points.
 * Requires OPENAI_API_KEY in project env. Never expose the key to the client.
 */
/* global process */

const ALLOWED_HOST_PATTERNS = [
  /^(.+\.)?pubmed\.ncbi\.nlm\.nih\.gov$/i,
  /^(.+\.)?ncbi\.nlm\.nih\.gov$/i,
  /^(.+\.)?pmc\.ncbi\.nlm\.nih\.gov$/i,
  /^(.+\.)?cdc\.gov$/i,
  /^(.+\.)?who\.int$/i,
  /^(.+\.)?acog\.org$/i,
  /^(.+\.)?merckmanuals\.com$/i,
  /^(.+\.)?mayoclinic\.org$/i,
  /^(.+\.)?cochranelibrary\.com$/i,
  /^(.+\.)?nice\.org\.uk$/i,
  /^(.+\.)?clinicaltrials\.gov$/i,
  /^(.+\.)?medlineplus\.gov$/i,
  /^(.+\.)?nih\.gov$/i,
  /^(.+\.)?uspreventiveservicestaskforce\.org$/i,
  /^(.+\.)?womenhealth\.gov$/i,
  /^(.+\.)?ahrq\.gov$/i,
];

const COMMUNITY_HOST_PATTERNS = [
  /^(.+\.)?reddit\.com$/i,
  /^(.+\.)?youtube\.com$/i,
  /^(.+\.)?youtu\.be$/i,
  /^(.+\.)?tiktok\.com$/i,
  /^(.+\.)?instagram\.com$/i,
  /^(.+\.)?facebook\.com$/i,
  /^(.+\.)?fb\.com$/i,
  /^(.+\.)?x\.com$/i,
  /^(.+\.)?twitter\.com$/i,
];

function hostAllowed(url, community = false) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const host = u.hostname.replace(/^www\./, '');
    const list = community ? [...ALLOWED_HOST_PATTERNS, ...COMMUNITY_HOST_PATTERNS] : ALLOWED_HOST_PATTERNS;
    return list.some((re) => re.test(host));
  } catch {
    return false;
  }
}

function sanitizeLink(url, title, summary, community) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return null;
  if (!hostAllowed(trimmed, community)) return null;
  return {
    url: trimmed.startsWith('http://') ? trimmed.replace('http://', 'https://') : trimmed,
    text: typeof title === 'string' && title.trim() ? title.trim().slice(0, 200) : 'Reference',
    summary: typeof summary === 'string' ? summary.trim().slice(0, 500) : '',
    justification: community ? 'AI-suggested community starting point — not medical advice' : 'AI-suggested authoritative reference — verify with your clinician',
  };
}

function buildUserPrompt(product) {
  const name = product?.name || 'Unknown product';
  const category = product?.category || '';
  const summary = product?.summary || '';
  const tags = Array.isArray(product?.tags) ? product.tags.join(', ') : '';
  const type = product?.type || '';
  return `Product name: ${name}
Category: ${category}
Type: ${type}
Summary: ${summary}
Tags: ${tags}

Return JSON with this exact shape:
{
  "clinicalNarrative": "2-4 sentences: general clinical context for this product category or ingredient class. Educational only, no direct medical advice.",
  "clinicianLinks": [ { "url": "https://...", "title": "short label", "why": "one sentence" } ],
  "literatureLinks": [ { "url": "https://...", "title": "short label", "why": "one sentence" } ],
  "communityLinks": [ { "url": "https://...", "platform": "reddit|youtube|tiktok|instagram|facebook|other", "description": "what to search for / why" } ]
}

Rules:
- clinicianLinks and literatureLinks: ONLY use URLs you know exist on PubMed (pubmed.ncbi.nlm.nih.gov), CDC, WHO, ACOG, NIH/NLM, MedlinePlus, Cochrane, NICE, clinicaltrials.gov, Merck Manual, or Mayo Clinic. Prefer PubMed article URLs or official society pages.
- If you cannot name a specific real URL, use a PubMed search URL like https://pubmed.ncbi.nlm.nih.gov/?term=ENCODED_QUERY with terms related to the product (no spaces in path — encode).
- communityLinks: only reddit.com, youtube.com, tiktok.com, instagram.com, or facebook.com search or subpath URLs.
- At least 2 literatureLinks and 1 clinicianLinks when possible; communityLinks 2-4 items.
- No paywalled-only journal homepages; prefer free-to-read portals above.
- Do not fabricate PubMed IDs; use search URLs if unsure.`;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'not_configured',
      message: 'OPENAI_API_KEY is not set. Add it in Vercel project settings to enable live research.',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const product = body?.product;
  if (!product || typeof product !== 'object') {
    return res.status(400).json({ error: 'Missing product' });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.35,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You help women\'s health researchers surface reputable public links. Output valid JSON only. Never invent PubMed PMIDs; use pubmed search URLs when needed. No diagnosis or treatment instructions for the user.',
          },
          { role: 'user', content: buildUserPrompt(product) },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error', openaiRes.status, errText.slice(0, 500));
      return res.status(502).json({ error: 'upstream_error', message: 'AI service unavailable' });
    }

    const data = await openaiRes.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw || typeof raw !== 'string') {
      return res.status(502).json({ error: 'empty_response' });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'parse_error' });
    }

    const clinicalNarrative =
      typeof parsed.clinicalNarrative === 'string' ? parsed.clinicalNarrative.trim().slice(0, 2000) : '';

    const clinicianLinks = [];
    for (const row of Array.isArray(parsed.clinicianLinks) ? parsed.clinicianLinks : []) {
      const s = sanitizeLink(row?.url, row?.title, row?.why, false);
      if (s) clinicianLinks.push(s);
    }

    const literatureLinks = [];
    for (const row of Array.isArray(parsed.literatureLinks) ? parsed.literatureLinks : []) {
      const s = sanitizeLink(row?.url, row?.title, row?.why, false);
      if (s) literatureLinks.push(s);
    }

    const communityLinks = [];
    for (const row of Array.isArray(parsed.communityLinks) ? parsed.communityLinks : []) {
      const s = sanitizeLink(row?.url, row?.description || row?.title, row?.description, true);
      if (s) {
        communityLinks.push({
          ...s,
          platform: typeof row?.platform === 'string' ? row.platform.toLowerCase().slice(0, 32) : 'other',
        });
      }
    }

    return res.status(200).json({
      clinicalNarrative,
      clinicianLinks,
      literatureLinks,
      communityLinks,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error' });
  }
}
