/**
 * Real snapshot of the open-source packages actually shipped in the ayna
 * mobile app — the browser bundle (react, react-dom, posthog-js,
 * @supabase/supabase-js and their runtime sub-dependencies) plus the
 * Capacitor packages that ship inside the native iOS/Android container.
 *
 * Deliberately excludes:
 * - devDependencies (eslint, vite, vitest, etc.) — never shipped to a user.
 * - @capacitor/cli's own dependency tree — developer tooling used locally
 *   to manage the Xcode/Android project, never code that runs on a user's
 *   device.
 * - TypeScript type-only packages (@types/*, csstype, undici-types) — .d.ts
 *   declarations only, no runtime code ships from them.
 * - Optional peer dependencies that aren't actually installed (bufferutil,
 *   utf-8-validate, preact-render-to-string) — listed by some tools as
 *   possible deps of ws/posthog-js, but not present in node_modules here.
 *
 * To regenerate after a dependency change: re-run the walk documented in
 * scripts/ (see the "Open source licences" work in git history for the
 * exact node one-liner used against `npm ls --all --omit=dev --json`
 * filtered to these roots: react, react-dom, posthog-js,
 * @supabase/supabase-js, @capacitor/core, @capacitor/android,
 * @capacitor/ios), cross-checked against `npx license-checker --production`.
 */
export const OPEN_SOURCE_PACKAGES = [
  { name: '@capacitor/android', version: '8.5.1', license: 'MIT' },
  { name: '@capacitor/core', version: '8.5.1', license: 'MIT' },
  { name: '@capacitor/ios', version: '8.5.1', license: 'MIT' },
  { name: '@posthog/browser-common', version: '0.6.0', license: 'MIT' },
  { name: '@posthog/core', version: '1.48.11', license: 'MIT' },
  { name: '@posthog/types', version: '1.407.0', license: 'MIT' },
  { name: '@supabase/auth-js', version: '2.103.1', license: 'MIT' },
  { name: '@supabase/functions-js', version: '2.103.1', license: 'MIT' },
  { name: '@supabase/phoenix', version: '0.4.0', license: 'MIT' },
  { name: '@supabase/postgrest-js', version: '2.103.1', license: 'MIT' },
  { name: '@supabase/realtime-js', version: '2.103.1', license: 'MIT' },
  { name: '@supabase/storage-js', version: '2.103.1', license: 'MIT' },
  { name: '@supabase/supabase-js', version: '2.103.1', license: 'MIT' },
  { name: 'core-js', version: '3.49.0', license: 'MIT' },
  { name: 'dompurify', version: '3.4.14', license: '(MPL-2.0 OR Apache-2.0)' },
  { name: 'fflate', version: '0.4.8', license: 'MIT' },
  { name: 'iceberg-js', version: '0.8.1', license: 'MIT' },
  { name: 'posthog-js', version: '1.421.0', license: '(Apache-2.0 AND MIT)' },
  { name: 'preact', version: '10.29.8', license: 'MIT' },
  { name: 'query-selector-shadow-dom', version: '1.0.1', license: 'MIT' },
  { name: 'react', version: '19.2.4', license: 'MIT' },
  { name: 'react-dom', version: '19.2.4', license: 'MIT' },
  { name: 'scheduler', version: '0.27.0', license: 'MIT' },
  { name: 'tslib', version: '2.8.1', license: '0BSD' },
  { name: 'web-vitals', version: '5.3.0', license: 'Apache-2.0' },
  { name: 'web-vitals-soft-navs', version: '6.0.0', license: 'Apache-2.0' },
  { name: 'ws', version: '8.19.0', license: 'MIT' },
];

// Short "MIT, Apache 2.0, 0BSD"–style summary for the Legal screen's row
// subtitle — every distinct exact license string present, most-common
// first, lightly reformatted for readability. Matches on the exact license
// string rather than a substring check, since e.g. '0BSD'.includes('BSD')
// would otherwise wrongly claim a plain "BSD" license is present too.
const FRIENDLY_NAMES = {
  'Apache-2.0': 'Apache 2.0',
};

export function summarizeLicenses(packages = OPEN_SOURCE_PACKAGES) {
  const counts = new Map();
  for (const pkg of packages) {
    counts.set(pkg.license, (counts.get(pkg.license) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([license]) => FRIENDLY_NAMES[license] || license);
}
