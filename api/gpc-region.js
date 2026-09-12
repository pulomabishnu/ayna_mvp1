/**
 * /api/gpc-region — tells the browser whether it's connecting from a US
 * state that legally requires honoring Global Privacy Control (GPC).
 *
 * This app is a pure client-side SPA (no server rendering), so the browser
 * has no way to know its own region on its own — Vercel populates
 * geolocation headers on every request that reaches a Function, this just
 * reads and reports them. See _gpcRegions.js for the state list and its
 * legal caveats.
 *
 * FAILS CLOSED: on any uncertainty (missing/unrecognized region, the
 * request wasn't routed through Vercel's geolocation, rate-limited, etc.)
 * this returns mandatory: true. src/utils/analyticsConsent.js's client-side
 * caller also fails closed on top of that (network error, timeout). Being
 * wrong in the "assumed mandatory" direction just means one fewer visitor
 * saw a banner they were technically eligible for; being wrong the other
 * way means asking someone the law says we may not.
 */
import { rateLimit, getClientIp } from './_rateLimit.js';
import { isMandatoryGpcRegion } from './_gpcRegions.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'GET') return res.status(405).end();

  // Response is per-visitor geolocation — must never be cached by a shared/
  // CDN cache, or one visitor's region gets served to the next.
  res.setHeader('Cache-Control', 'private, max-age=0, no-store');

  // Cheap and carries no user data — light rate limit purely to stop the
  // endpoint being hammered, not because the response itself is sensitive.
  const rl = await rateLimit(`gpc-region:ip:${getClientIp(req)}`, { max: 120, windowSec: 3600, failClosed: false });
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfterSec || 60));
    return res.status(429).json({ mandatory: true }); // fail closed even under rate-limiting
  }

  const country = req.headers['x-vercel-ip-country'];
  const region = req.headers['x-vercel-ip-country-region'];

  let mandatory = true;
  try {
    mandatory = country ? isMandatoryGpcRegion(String(country), region ? String(region) : '') : true;
  } catch {
    mandatory = true; // fail closed
  }

  return res.status(200).json({ mandatory });
}
