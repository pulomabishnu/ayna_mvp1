// Build-time guard for TestFlight/Android: check the actual compiled JS,
// not merely a local env variable. This is NOT a live ingestion check.
// PostHog still needs to be verified on an installed device after upload.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function allJs(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) return allJs(full);
    if (!entry.isFile() || !entry.name.endsWith('.js')) return [];
    return [full];
  });
}

const files = allJs('dist');
if (!files.length) {
  console.error('[ayna] No compiled JS found in dist. Native build cannot be shipped.');
  process.exitCode = 1;
} else {
  const bundle = files.map((file) => readFileSync(file, 'utf8')).join('\n');
  const checks = {
    'PostHog ingestion endpoint': 'us.i.posthog.com',
    'native host override': 'native.aynahealth.co',
    'iOS platform tag': 'ios_app',
    'plain native event transport': 'disable_compression',
    'native lifecycle event': 'Application Opened',
  };
  const failures = Object.entries(checks).filter(([, needle]) => !bundle.includes(needle));
  if (failures.length) {
    for (const [label] of failures) console.error(`[ayna] Missing from compiled native app: ${label}`);
    process.exitCode = 1;
  } else {
    console.log('[ayna] Native analytics preflight PASSED: endpoint, host, platform, transport and app-open events bundled.');
    console.log('[ayna] This does not prove PostHog received events. Verify live TestFlight telemetry before release.');
  }
}
