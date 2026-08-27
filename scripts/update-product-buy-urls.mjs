import fs from 'node:fs/promises';
import { ALL_PRODUCTS } from '../src/data/products.js';
import { PRODUCT_BUY_URLS } from '../src/data/productBuyUrls.js';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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

function sameDomain(a, b) {
  const x = hostname(a);
  const y = hostname(b);
  if (!x || !y) return false;
  return x === y || x.endsWith(`.${y}`) || y.endsWith(`.${x}`);
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
  let text = data?.output_text || '';
  const citations = [];

  for (const step of data?.steps || []) {
    if (step?.type !== 'model_output') continue;

    for (const block of step?.content || []) {
      if (block?.type === 'text' && !text) text += block.text || '';

      for (const annotation of block?.annotations || []) {
        if (annotation?.type === 'url_citation' && annotation?.url) {
          citations.push({
            url: annotation.url,
            title: annotation.title || '',
          });
        }
      }
    }
  }

  return { text, citations };
}

async function research(product) {
  const prompt = `
You are researching the correct Buy Now destination for a women's-health marketplace called Ayna.

CATALOG ITEM
ID: ${product.id}
Name: ${product.name}
Brand: ${product.brand || 'Not explicitly stored'}
Type: ${product.type || 'unknown'}
Category: ${product.category || 'unknown'}
Currently listed retailers: ${(product.whereToBuy || []).join(', ') || 'none'}

Use Google Search.

Find the exact current OFFICIAL company product or service page for this exact catalog item.

Rules:
1. Prefer the official brand/company website.
2. The URL must lead to the specific product/service, not the company's generic homepage.
3. Do not invent a URL based on a site's URL pattern.
4. Do not return Google Shopping or search-results pages.
5. Do not return Amazon, Walmart, Target, CVS, iHerb, Sephora, Ulta, or another retailer if an official brand page exists.
6. For an app, prefer the official app's dedicated webpage. An exact Apple App Store or Google Play listing is acceptable if there is no dedicated official page.
7. If the Ayna item describes a product FAMILY rather than one SKU, a dedicated official product-family page is acceptable.
8. If the exact official page cannot be verified, return NEEDS_REVIEW.
9. Verify that the page is for the same product, not merely a similar product from the same company.

Return ONLY JSON:
{
  "status": "FOUND" or "NEEDS_REVIEW",
  "url": "https://..." or null,
  "brand": "official brand name",
  "confidence": 0.0 to 1.0,
  "reason": "short explanation"
}
`.trim();

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/interactions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY,
      },
      body: JSON.stringify({
        model: MODEL,
        input: prompt,
        tools: [{ type: 'google_search' }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini HTTP ${response.status}`);
  }

  const data = await response.json();
  const { text, citations } = extractResponse(data);
  const result = cleanJson(text);

  if (!result) {
    return { approved: false, reason: 'Gemini did not return valid JSON' };
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

  // Retailers should be manually reviewed rather than silently auto-added.
  if (isMarketplace(url)) {
    return {
      approved: false,
      url,
      reason: 'Retailer URL requires manual review',
    };
  }

  // High-confidence only.
  if (confidence < 0.9) {
    return {
      approved: false,
      url,
      reason: `Confidence too low: ${confidence}`,
    };
  }

  // Require Google Search grounding from the same domain.
  const grounded = citations.some((citation) => sameDomain(citation.url, url));

  if (!grounded) {
    return {
      approved: false,
      url,
      reason: 'Returned URL was not grounded by a citation from the same domain',
    };
  }

  return {
    approved: true,
    url,
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

if (!API_KEY) {
  console.error('GEMINI_API_KEY is not available. No URLs were changed.');
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
    console.log(`ERROR → ${error.message}`);
  }

  // Keep requests spaced out.
  await new Promise((resolve) => setTimeout(resolve, 400));
}

console.log(`\nVerified this run: ${Object.keys(approved).length}`);
console.log(`Needs review: ${reviewCount}`);

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
