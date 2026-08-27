import fs from 'node:fs/promises';
import { ALL_PRODUCTS } from '../src/data/products.js';
import { PRODUCT_BUY_URLS } from '../src/data/productBuyUrls.js';

const API_KEY = process.env.GEMINI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const limitArg = process.argv.find((x) => x.startsWith('--limit='));
const LIMIT = limitArg ? Math.max(1, Number(limitArg.split('=')[1]) || 20) : 20;
const DRY_RUN = process.argv.includes('--dry-run');

const MARKETPLACES = [
  'amazon.com',
  'target.com',
  'walmart.com',
  'cvs.com',
  'walgreens.com',
  'iherb.com',
  'sephora.com',
  'ulta.com',
  'bestbuy.com',
];

function hostname(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function isMarketplace(value) {
  const h = hostname(value);
  return MARKETPLACES.some((domain) => h === domain || h.endsWith(`.${domain}`));
}

function isExactUrl(value) {
  if (!value) return false;

  try {
    const u = new URL(String(value).trim());
    const path = u.pathname.toLowerCase().replace(/\/+$/, '');

    // A specific product/service page needs something after the domain.
    if (!path) return false;

    // Never use search-result pages.
    if (/(^|\/)(s|search)(\/|$)/.test(path)) return false;

    if (
      u.searchParams.has('k') ||
      u.searchParams.has('searchTerm') ||
      u.searchParams.has('Ntt') ||
      u.searchParams.get('tbm') === 'shop'
    ) return false;

    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function existingDestination(product) {
  const values = [
    PRODUCT_BUY_URLS[product.id],
    product.affiliateUrl,
    product.productUrl,
    product.buyUrl,
    product.url,
    ...Object.values(product.whereToBuyLinks || {}),
  ];

  return values.find(isExactUrl) || null;
}

function cleanJson(text) {
  const trimmed = String(text || '').trim();

  try {
    return JSON.parse(trimmed);
  } catch {}

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function extractResponse(data) {
  const candidate = data?.candidates?.[0];

  return (candidate?.content?.parts || [])
    .map((part) => part?.text || '')
    .join('');
}

function canonicalUrl(value) {
  try {
    const u = new URL(String(value || '').trim());
    u.hash = '';

    if (u.pathname !== '/') {
      u.pathname = u.pathname.replace(/\/+$/, '');
    }

    return u.toString();
  } catch {
    return '';
  }
}

async function searchWeb(product) {
  const brand = product.brand ? ` ${product.brand}` : '';
  const query = `"${product.name}"${brand} official product`;

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TAVILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      search_depth: 'basic',
      topic: 'general',
      max_results: 8,
      include_answer: false,
      include_raw_content: false,
      include_images: false,
      safe_search: true,
      exclude_domains: MARKETPLACES,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Tavily HTTP ${response.status}: ${errorBody.slice(0, 300)}`
    );
  }

  const data = await response.json();

  return (data?.results || [])
    .filter((result) => result?.url && isExactUrl(result.url))
    .map((result) => ({
      title: String(result.title || '').trim(),
      url: String(result.url || '').trim(),
      content: String(result.content || '').trim().slice(0, 700),
      score: Number(result.score || 0),
    }));
}

async function verifyResolvedUrl(value) {
  try {
    const url = String(value || '').trim();

    if (!isExactUrl(url) || isMarketplace(url)) {
      return { ok: false, reason: 'URL is not an exact official product page' };
    }

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; AynaProductVerifier/1.0; +https://www.aynahealth.co)',
      },
    });

    const finalUrl = response.url || url;

    try {
      await response.body?.cancel();
    } catch {}

    if (!response.ok) {
      return {
        ok: false,
        reason: `Product page returned HTTP ${response.status}`,
      };
    }

    if (!isExactUrl(finalUrl) || isMarketplace(finalUrl)) {
      return {
        ok: false,
        reason: 'Product page redirected to a homepage, search page, or retailer',
      };
    }

    return { ok: true, url: finalUrl };
  } catch (error) {
    return {
      ok: false,
      reason: `Could not verify product page: ${error.message}`,
    };
  }
}

async function research(product) {
  const candidates = await searchWeb(product);

  if (candidates.length === 0) {
    return {
      approved: false,
      reason: 'Tavily returned no exact-looking candidate pages',
    };
  }

  const candidateBlock = candidates
    .map(
      (candidate, index) =>
        `${index + 1}. ${candidate.title}
URL: ${candidate.url}
SEARCH EXCERPT: ${candidate.content}`
    )
    .join('\n\n');

  const prompt = `
You are verifying the correct Buy Now destination for a women's-health marketplace called Ayna.

CATALOG ITEM
ID: ${product.id}
Name: ${product.name}
Brand: ${product.brand || 'Not explicitly stored'}
Type: ${product.type || 'unknown'}
Category: ${product.category || 'unknown'}

A separate web-search system returned the candidate pages below.

CANDIDATES
${candidateBlock}

Choose the exact current OFFICIAL company product or service page for this exact Ayna catalog item.

STRICT RULES:
1. You may ONLY return a URL appearing in the candidate list above.
2. Prefer the official brand/company website.
3. It must be the specific product/service page, not a generic homepage.
4. Do not choose a search-results page.
5. Do not choose Amazon, Walmart, Target, CVS, Walgreens, iHerb, Sephora, Ulta, Best Buy, or another marketplace.
6. Make sure it is the SAME product, not a similar product from the same company.
7. A dedicated product-family page is acceptable only when the Ayna catalog item itself represents a product family.
8. For an app/service, choose its official dedicated service page.
9. If none of the candidates can be verified as the exact official destination, return NEEDS_REVIEW.
10. Do not invent or modify a URL.

Return ONLY JSON:
{
  "status": "FOUND" or "NEEDS_REVIEW",
  "url": "exact candidate URL" or null,
  "confidence": 0.0 to 1.0,
  "reason": "short explanation"
}
`.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gemini HTTP ${response.status}: ${errorBody.slice(0, 300)}`
    );
  }

  const data = await response.json();
  const text = extractResponse(data);
  const result = cleanJson(text);

  if (!result) {
    return {
      approved: false,
      reason: 'Gemini did not return valid JSON',
    };
  }

  const url = String(result.url || '').trim();
  const confidence = Number(result.confidence || 0);

  if (result.status !== 'FOUND' || !isExactUrl(url)) {
    return {
      approved: false,
      url,
      reason: result.reason || 'No verified exact URL',
    };
  }

  if (isMarketplace(url)) {
    return {
      approved: false,
      url,
      reason: 'Marketplace URL rejected',
    };
  }

  if (confidence < 0.9) {
    return {
      approved: false,
      url,
      reason: `Confidence too low: ${confidence}`,
    };
  }

  // Gemini is not allowed to invent a destination.
  // The returned URL must match one Tavily actually found.
  const matchedCandidate = candidates.find(
    (candidate) => canonicalUrl(candidate.url) === canonicalUrl(url)
  );

  if (!matchedCandidate) {
    return {
      approved: false,
      url,
      reason: 'Gemini returned a URL that was not in the Tavily results',
    };
  }

  // Finally make sure the real webpage actually opens.
  const verified = await verifyResolvedUrl(matchedCandidate.url);

  if (!verified.ok) {
    return {
      approved: false,
      url,
      reason: verified.reason,
    };
  }

  return {
    approved: true,
    url: verified.url,
    confidence,
    reason: result.reason || 'Verified',
  };
}

function renderFile(map) {
  const entries = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));

  const body = entries
    .map(([id, url]) => `  ${JSON.stringify(id)}: ${JSON.stringify(url)},`)
    .join('\n');

  return `/**
 * Exact Buy Now destinations verified by Ayna.
 *
 * This file is maintained by scripts/update-product-buy-urls.mjs.
 * Affiliate URLs still override these destinations.
 */
export const PRODUCT_BUY_URLS = {
${body}
};
`;
}

if (!API_KEY || !TAVILY_API_KEY) {
  console.error(
    'GEMINI_API_KEY and TAVILY_API_KEY are required. No URLs were changed.'
  );
  process.exit(1);
}

const missing = ALL_PRODUCTS.filter((product) => !existingDestination(product));
const batch = missing.slice(0, LIMIT);

console.log(`Catalog products: ${ALL_PRODUCTS.length}`);
console.log(`Already have exact destination: ${ALL_PRODUCTS.length - missing.length}`);
console.log(`Need research: ${missing.length}`);
console.log(`Researching this run: ${batch.length}`);

const approved = {};
let reviewCount = 0;
let apiFailures = 0;

for (const [index, product] of batch.entries()) {
  process.stdout.write(
    `[${index + 1}/${batch.length}] ${product.id} — ${product.name} ... `
  );

  try {
    const result = await research(product);

    if (result.approved) {
      approved[product.id] = result.url;
      console.log(`VERIFIED → ${result.url}`);
    } else {
      reviewCount += 1;
      console.log(`REVIEW → ${result.reason}${result.url ? ` (${result.url})` : ''}`);
    }
  } catch (error) {
    reviewCount += 1;
    apiFailures += 1;
    console.log(`ERROR → ${error.message}`);
  }

  // Keep requests spaced out.
  await new Promise((resolve) => setTimeout(resolve, 4000));
}

console.log(`\nVerified this run: ${Object.keys(approved).length}`);
console.log(`Needs review: ${reviewCount}`);

if (batch.length > 0 && apiFailures === batch.length) {
  console.error('Every Gemini request failed. Refusing to report this run as successful.');
  process.exit(1);
}

if (DRY_RUN) {
  console.log('Dry run: productBuyUrls.js was not changed.');
  process.exit(0);
}

if (Object.keys(approved).length === 0) {
  console.log('No new verified URLs to save.');
  process.exit(0);
}

const merged = {
  ...PRODUCT_BUY_URLS,
  ...approved,
};

await fs.writeFile(
  new URL('../src/data/productBuyUrls.js', import.meta.url),
  renderFile(merged)
);

console.log('Updated src/data/productBuyUrls.js');
