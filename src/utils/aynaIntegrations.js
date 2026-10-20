import { HEALTH_SOURCES } from '../mobile/data/healthConnections.js';

/**
 * "Works with" for apps and devices, shared by the app and website product
 * pages so both say the same thing.
 *
 * The list is the product's own platforms and integrations, plus "ayna" when
 * the product's data reaches ayna through a source on the Health data screen
 * (src/mobile/data/healthConnections.js) that can actually be connected in
 * this build. A match names the source it goes through, so the claim always
 * maps to a real connection.
 */

// Availability states on the Health data screen that are a real way in today.
const CONNECTABLE = new Set(['device', 'oauth', 'upload', 'import_only']);

// Which Health data source a product's data comes through. `via` lists the
// sources tried in order; the first connectable one wins. The indirect rows
// follow the notes on that screen: "Apple Watch, Oura and other apps that
// share with Apple Health come through here", "Samsung Health, Fitbit and
// other Android apps that share with Health Connect come through here", and
// Garmin/Strava data "can still reach ayna" through Apple Health or Health
// Connect.
const RULES = [
  { test: /\bapple health\b/i, via: ['apple_health'] },
  { test: /\bapple watch\b/i, via: ['apple_health'] },
  { test: /\boura\b/i, via: ['oura', 'apple_health'] },
  { test: /\bwhoop\b/i, via: ['whoop'] },
  { test: /\bhealth connect\b/i, via: ['health_connect'] },
  { test: /\b(samsung health|fitbit)\b/i, via: ['health_connect'] },
  { test: /\bgarmin\b/i, via: ['garmin', 'apple_health', 'health_connect'] },
  { test: /\bstrava\b/i, via: ['strava', 'apple_health', 'health_connect'] },
  // The Flo app (an export import), never Flo-branded physical products.
  { test: /\bflo\b/i, via: ['flo'], digitalOnly: true },
];

const clean = (s) => String(s ?? '').replace(/\s+[–—]\s+/g, ', ').replace(/[–—]/g, '-').trim();

const isDigital = (product) => product?.type === 'digital';

/** The product's own name, brand and id: what it is, not what it lists as integrations. */
function identity(product) {
  return [product?.name, product?.brand, String(product?.id || '').replace(/^[a-z]-/, '').replace(/-/g, ' ')].filter(Boolean).join(' | ');
}

/**
 * The Health data source this product's data reaches ayna through, or null.
 * @returns {{ id: string, name: string } | null}
 */
export function aynaSourceFor(product, sources = HEALTH_SOURCES) {
  if (!product) return null;
  const who = identity(product);
  for (const rule of RULES) {
    if (!rule.test.test(who)) continue;
    if (rule.digitalOnly && !isDigital(product)) continue;
    for (const id of rule.via) {
      const src = sources.find((s) => s.id === id);
      if (src && CONNECTABLE.has(src.availability)) return { id: src.id, name: src.name };
    }
  }
  return null;
}

/** Platforms ("iOS, Android") split into single items. */
function platformItems(platform) {
  return clean(platform).split(/\s*,\s*/).filter(Boolean);
}

/**
 * Everything the product works with, in order: platforms, integrations, then
 * "ayna" when it can connect. Empty for products that are neither apps nor
 * devices with integrations.
 * @returns {{ items: string[], ayna: { id: string, name: string } | null }}
 */
export function worksWith(product) {
  if (!product) return { items: [], ayna: null };
  const integrations = (product.integrations || []).map((x) => clean(typeof x === 'string' ? x : x?.name)).filter(Boolean);
  const items = [...platformItems(product.platform), ...integrations];
  const ayna = aynaSourceFor(product);
  if (!items.length && !ayna) return { items: [], ayna: null };
  const seen = new Set();
  const out = items.filter((t) => { const k = t.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  if (ayna && !seen.has('ayna')) out.push('ayna');
  return { items: out, ayna };
}
