/* global process */
/**
 * Last-resort image resolver: Serper.dev's Google Image Search API.
 *
 * Everything else in the resolution chain (Shopify catalog match, og:image
 * scraping, DSLD) only works when a brand's own site is reachable and
 * scrapable — a large share of real brands (Kimberly-Clark, P&G, Walmart,
 * several sex-tech DTC brands) actively block bots, and AI-generated search
 * results have no catalog entry to hand-fix an image into at all. A real
 * image search index is the only thing that reliably finds a photo for an
 * arbitrary product name regardless of whether its own site cooperates.
 *
 * Budget-conscious by construction: only ever called after every free
 * source has already failed (see product-image.js), and every result is
 * cached for 30 days (server) + indefinitely per-browser (client) keyed by
 * name+brand, so a given product spends at most one credit per month
 * total, shared across every visitor. A separate daily cap (see
 * dailyBudgetOk below) protects the account's credit balance from an
 * unexpected traffic spike or bug burning through it in one day.
 */

import { rateLimit } from './_rateLimit.js';
import { isLikelyNonProductImageUrl } from './_ogImageFetch.js';

const SEARCH_TIMEOUT_MS = 5000;

// A hard ceiling on how many Serper credits this app will spend in a single
// day, regardless of how many products need resolving — cheap insurance
// against a bug or traffic spike draining the account unexpectedly. Well
// above realistic organic demand (this only fires on a cache miss after
// every free resolver has already failed) but far below "the whole free
// tier in an afternoon."
const DAILY_BUDGET = 300;

async function dailyBudgetOk() {
  const rl = await rateLimit('serper:daily-budget', { max: DAILY_BUDGET, windowSec: 86400, failClosed: false });
  return rl.ok;
}

// Serper returns each result's actual pixel dimensions — a far more
// reliable "is this a real photo, not an icon" signal than guessing from a
// filename. A logo/icon thumbnail is reliably small on both axes; real
// product photography from a retailer or brand site is not.
const MIN_DIMENSION_PX = 200;

/**
 * @param {string} name
 * @param {string} [brand]
 * @returns {Promise<string|null>} image URL, or null if unavailable/unfound
 */
export async function lookupSerperImage(name, brand) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return null;
  const query = `${brand || ''} ${name || ''}`.trim();
  if (!query) return null;

  if (!(await dailyBudgetOk())) {
    console.warn('[serperImageSearch] daily budget exhausted, skipping');
    return null;
  }

  try {
    const res = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 10, gl: 'us' }),
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      if (res.status !== 400) console.warn('[serperImageSearch] request failed:', res.status);
      return null;
    }
    const data = await res.json();
    const images = Array.isArray(data?.images) ? data.images : [];

    for (const img of images) {
      const url = img?.imageUrl;
      if (typeof url !== 'string' || !url.startsWith('http')) continue;
      if (isLikelyNonProductImageUrl(url)) continue;
      const w = Number(img.imageWidth) || 0;
      const h = Number(img.imageHeight) || 0;
      if (w && w < MIN_DIMENSION_PX) continue;
      if (h && h < MIN_DIMENSION_PX) continue;
      return url;
    }
    return null;
  } catch (e) {
    console.warn('[serperImageSearch] lookup failed:', e?.message);
    return null;
  }
}
