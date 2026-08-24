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

// Google Image Search always returns its best-effort top hits, even when
// nothing in the index is a real match — the exact same failure mode fixed
// for DSLD earlier (see lookupDsldProduct in llm-recommendations.js: "Always
// Infinity" matched "Rhino Infinity 10K" on the shared word "infinity").
// Caught live here too: querying "Happi Pelvic Floor App" (a catalog entry
// that turned out not to be independently confirmable as a real, distinct
// product at all) returned "Happy Pelvis Pelvic Floor Therapy" (an
// unrelated clinic) and "Happy Floor: Pelvic Exercises" (a different real
// app) as its top image results.
//
// A first pass at scoring the whole query ("<brand> <name>") against the
// title as one undifferentiated word bag was NOT enough: "Happy Floor..."
// shares "pelvic"/"floor"/"app" with the query — 3 of 4 tokens — purely
// because those are generic category words any pelvic-floor-app
// description would contain, clearing the same 0.75 threshold proven safe
// for Shopify/DSLD even with ZERO actual brand-name match ("happi" vs
// "happy" never overlap as tokens). Category-word overlap can outweigh a
// completely wrong brand when the query itself is mostly generic words.
//
// Fixed by gating on the brand separately and first: when a brand is
// given, it must actually appear in the title before category-word
// overlap counts for anything at all. The brand name is the one token
// that's actually specific to THIS product; everything else in a query
// like "Pelvic Floor App" is category vocabulary shared by every
// competitor's listing too.
// Crude singularization (strip a lone trailing "s", never "ss") — real
// listings routinely phrase the same product as singular/plural
// differently ("Crystal Wand" vs "Crystal Pleasure Wands"). Without this,
// a genuinely correct match (chakrubs.com's own listing for exactly this
// product) scored 2/3 — below threshold — purely because "wand" and
// "wands" didn't match as exact strings, a false NEGATIVE on top of the
// false-POSITIVE risk this scoring already guards against.
function singularize(t) {
  return t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t;
}

function normalizeTokens(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((t) => t.length > 2)
    .map(singularize);
}

function titleMatchScore(queryTokens, titleTokens) {
  if (queryTokens.length === 0 || titleTokens.length === 0) return { score: 0, overlap: 0 };
  const titleSet = new Set(titleTokens);
  const querySet = new Set(queryTokens);
  let overlap = 0;
  for (const t of querySet) {
    if (titleSet.has(t)) overlap += 1;
  }
  const smaller = Math.min(querySet.size, titleSet.size);
  return { score: overlap / smaller, overlap };
}

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

  const brandTokens = normalizeTokens(brand);
  const nameTokens = normalizeTokens(name);

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

    let best = null;
    let bestScore = 0;
    let bestOverlap = 0;
    for (const img of images) {
      const url = img?.imageUrl;
      if (typeof url !== 'string' || !url.startsWith('http')) continue;
      if (isLikelyNonProductImageUrl(url)) continue;
      const w = Number(img.imageWidth) || 0;
      const h = Number(img.imageHeight) || 0;
      if (w && w < MIN_DIMENSION_PX) continue;
      if (h && h < MIN_DIMENSION_PX) continue;

      const titleTokens = normalizeTokens(img?.title);
      const titleSet = new Set(titleTokens);

      // The brand gate: when a brand is given, it must actually appear in
      // the title before this candidate is even scored — see the comment
      // above titleMatchScore for why (category-word overlap alone can
      // outweigh a completely wrong brand).
      if (brandTokens.length > 0 && !brandTokens.some((t) => titleSet.has(t))) continue;

      const { score, overlap } = titleMatchScore(nameTokens, titleTokens);
      if (score > bestScore) {
        bestScore = score;
        bestOverlap = overlap;
        best = url;
      }
    }

    // Same threshold already proven for Shopify catalog matching and DSLD —
    // the smaller of {query, title} token set must be (almost) fully
    // contained in the other, with at least 2 real tokens in common. When
    // there's no brand to gate on (nameTokens alone must clear this), err
    // toward no image over a wrong one.
    if (!best || bestScore < 0.75 || bestOverlap < 2) return null;
    return best;
  } catch (e) {
    console.warn('[serperImageSearch] lookup failed:', e?.message);
    return null;
  }
}
