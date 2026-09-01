import fs from 'node:fs/promises';
import { ALL_PRODUCTS } from '../src/data/products.js';
import { PRODUCT_BUY_URLS, PRODUCT_BUY_DISABLED } from '../src/data/productBuyUrls.js';

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

function allowsHomepage(product) {
  return product?.type === 'digital' || String(product?.id || '').startsWith('d-');
}

function isExactUrl(value, allowHomepage = false) {
  if (!value) return false;

  try {
    const u = new URL(String(value).trim());
    const path = u.pathname.toLowerCase().replace(/\/+$/, '');

    // Physical products need a specific page. Digital apps/services may use
    // their official homepage when that is the best cross-platform destination.
    if (!path && !allowHomepage) return false;

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

  return values.find((value) => isExactUrl(value, allowsHomepage(product))) || null;
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    .filter(
      (result) =>
        result?.url && isExactUrl(result.url, allowsHomepage(product))
    )
    .map((result) => ({
      title: String(result.title || '').trim(),
      url: String(result.url || '').trim(),
      content: String(result.content || '').trim().slice(0, 700),
      score: Number(result.score || 0),
    }));
}

async function verifyResolvedUrl(value, allowHomepage = false) {
  try {
    const url = String(value || '').trim();

    if (!isExactUrl(url, allowHomepage) || isMarketplace(url)) {
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

    const botBlocked =
      response.status === 403 ||
      response.status === 429;

    if (!isExactUrl(finalUrl, allowHomepage) || isMarketplace(finalUrl)) {
      return {
        ok: false,
        reason: 'Product page redirected to a homepage, search page, or retailer',
      };
    }

    if (!response.ok && !botBlocked) {
      return {
        ok: false,
        reason: `Product page returned HTTP ${response.status}`,
      };
    }

    if (botBlocked) {
      if (hostname(finalUrl) !== hostname(url)) {
        return {
          ok: false,
          reason: `Blocked page redirected to a different website`,
        };
      }

      return {
        ok: true,
        url: finalUrl,
        softVerified: true,
        status: response.status,
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
3. For physical products, it must be the specific product page, not a generic homepage. For digital apps/services, the official company/app homepage is allowed when it is the best cross-platform destination.
4. Do not choose a search-results page.
5. Do not choose Amazon, Walmart, Target, CVS, Walgreens, iHerb, Sephora, Ulta, Best Buy, or another marketplace.
6. Make sure it is the SAME product, not a similar product from the same company.
7. A dedicated product-family page is acceptable only when the Ayna catalog item itself represents a product family.
8. For an app/service, choose its official website or dedicated app/service landing page. Prefer that over Apple App Store or Google Play so users can choose their device.
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

  let response;
  let lastErrorBody = '';

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    response = await fetch(
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

    if (response.ok) break;

    lastErrorBody = await response.text();

    if (response.status === 503 && attempt < 3) {
      const waitMs = attempt * 10000;
      console.log(
        `Gemini busy; retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/3)`
      );
      await sleep(waitMs);
      continue;
    }

    if (response.status === 429 && attempt < 2) {
      console.log('Gemini rate limit hit; waiting 30s and retrying once');
      await sleep(30000);
      continue;
    }

    const error = new Error(
      `Gemini HTTP ${response.status}: ${lastErrorBody.slice(0, 300)}`
    );

    error.status = response.status;
    throw error;
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

  if (
    result.status !== 'FOUND' ||
    !isExactUrl(url, allowsHomepage(product))
  ) {
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
  const verified = await verifyResolvedUrl(
    matchedCandidate.url,
    allowsHomepage(product)
  );

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
  const disabledEntries = Object.entries(PRODUCT_BUY_DISABLED).sort(
    ([a], [b]) => a.localeCompare(b)
  );

  const body = entries
    .map(([id, url]) => `  ${JSON.stringify(id)}: ${JSON.stringify(url)},`)
    .join('\n');

  const disabledBody = disabledEntries
    .map(
      ([id, reason]) =>
        `  ${JSON.stringify(id)}: ${JSON.stringify(reason)},`
    )
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

/**
 * Catalog items intentionally without a Buy Now destination.
 *
 * These are outdated, discontinued, unavailable, renamed, or do not
 * currently have an exact verified purchase destination.
 */
export const PRODUCT_BUY_DISABLED = {
${disabledBody}
};
`;
}

if (!API_KEY || !TAVILY_API_KEY) {
  console.error(
    'GEMINI_API_KEY and TAVILY_API_KEY are required. No URLs were changed.'
  );
  process.exit(1);
}

const missing = ALL_PRODUCTS.filter(
  (product) =>
    !existingDestination(product) &&
    !PRODUCT_BUY_DISABLED[product.id]
);
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

    if (error.status === 429) {
      console.log(
        'Gemini quota is still unavailable. Stopping this batch early so Tavily searches are not wasted.'
      );
      break;
    }
  }

  // Keep requests spaced out.
  await sleep(4000);
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
