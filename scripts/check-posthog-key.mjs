// Run before an app (TestFlight) build: says whether PostHog will use this
// laptop's key or the built-in public fallback (src/utils/analyticsPlatform.js).
// Either way the app sends events; this just makes it visible.
import { readFileSync, existsSync } from 'node:fs';

const files = ['.env.production.local', '.env.local', '.env.production', '.env'];
let found = process.env.VITE_PUBLIC_POSTHOG_KEY ? 'environment' : '';
for (const f of files) {
  if (found || !existsSync(f)) continue;
  if (/^\s*VITE_PUBLIC_POSTHOG_KEY\s*=\s*\S+/m.test(readFileSync(f, 'utf8'))) found = f;
}
console.log(found
  ? `[ayna] PostHog key found in ${found}; app analytics on.`
  : '[ayna] No VITE_PUBLIC_POSTHOG_KEY in .env; the app will use the built-in public key. Analytics stay on.');
