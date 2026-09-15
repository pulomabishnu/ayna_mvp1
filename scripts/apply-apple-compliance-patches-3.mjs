import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, text) { fs.writeFileSync(path, text); }
function replaceExact(path, before, after) {
  let text = read(path);
  if (text.includes(after)) return false;
  if (!text.includes(before)) throw new Error(`Missing patch anchor in ${path}: ${before.slice(0, 140)}`);
  text = text.replace(before, after);
  write(path, text);
  return true;
}
function replaceRegex(path, pattern, replacement, marker) {
  let text = read(path);
  if (marker && text.includes(marker)) return false;
  if (!pattern.test(text)) throw new Error(`Missing regex patch anchor in ${path}: ${String(pattern)}`);
  text = text.replace(pattern, replacement);
  write(path, text);
  return true;
}

// ---------------------------------------------------------------------------
// 1) ONE LIVE PRODUCT CATALOG FOR WEBSITE + MOBILE
// ---------------------------------------------------------------------------
// Mobile used to combine the bundled catalog with only source==='discovered'
// rows from /api/products. That meant a normal curated row added to Supabase
// could appear on the website but never appear in the iPhone app. Browse now
// treats the complete live /api/products result as canonical, with the bundled
// catalog used only when the API itself falls back.
replaceRegex(
  'src/mobile/MobileApp.jsx',
  /function buildBrowseProducts\(discoveredProducts\) \{[\s\S]*?\n\}\n\n\/\/ No single brand should crowd out/,
  `function buildBrowseProducts(catalogProducts) {
  const source = Array.isArray(catalogProducts) && catalogProducts.length ? catalogProducts : ALL_PRODUCTS;
  const liveProducts = filterPrescriptionCareGate(source).map((p) => ({ ...p, isStartup: false }));
  const seen = new Set(liveProducts.map((p) => String(p?.id || '')));
  const releasedStartups = RELEASED_STARTUPS
    .filter((s) => !seen.has(String(s?.id || '')))
    .map((s) => ({
      ...s,
      isStartup: false,
      type: 'digital',
      summary: s.description || s.tagline,
      price: s.stage || '',
    }));
  return [...liveProducts, ...releasedStartups];
}

// No single brand should crowd out`,
  'function buildBrowseProducts(catalogProducts)'
);

replaceRegex(
  'src/mobile/MobileApp.jsx',
  /  \/\/ Same loadProductCatalog\(\) call Discovery\.jsx makes[\s\S]*?  const browseProducts = buildBrowseProducts\(discoveredProducts\);/,
  `  // Website and iPhone now consume the exact same live product_catalog feed.
  // Start with the bundled copy so Browse is never empty, then replace it with
  // the complete API catalog. Force-refresh while the app stays open and when
  // it returns to the foreground so a newly added/edited/deactivated product
  // propagates without shipping a new iOS build.
  const [catalogProducts, setCatalogProducts] = useState(ALL_PRODUCTS);
  useEffect(() => {
    let cancelled = false;
    const applyCatalog = ({ products }) => {
      if (cancelled || !Array.isArray(products) || !products.length) return;
      setCatalogProducts(products);
    };
    const refresh = () => loadProductCatalog({ force: true }).then(applyCatalog).catch(() => {});

    loadProductCatalog().then(applyCatalog).catch(() => {});
    const timer = setInterval(refresh, 5 * 60 * 1000);
    const onVisibility = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') refresh();
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  const browseProducts = buildBrowseProducts(catalogProducts);`,
  'const [catalogProducts, setCatalogProducts] = useState(ALL_PRODUCTS);'
);

// Reduce client catalog staleness to five minutes and allow an intentional
// foreground refresh to bypass memo/localStorage.
{
  const path = 'src/utils/productCatalog.js';
  let text = read(path);
  text = text.replace('const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour', 'const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes');
  text = text.replace('export async function loadProductCatalog() {\n  if (memo) return memo;\n\n  const cached = readCache();', "export async function loadProductCatalog({ force = false } = {}) {\n  if (force) memo = null;\n  if (memo) return memo;\n\n  const cached = force ? null : readCache();");
  write(path, text);
}

// CDN cache follows the same five-minute refresh target.
{
  const path = 'api/products.js';
  let text = read(path);
  text = text.replace("res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');", "res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');");
  write(path, text);
}

// ---------------------------------------------------------------------------
// 2) EXTERNAL AI SEARCH: SIGNED IN + CURRENT EXPLICIT AI CONSENT ONLY
// ---------------------------------------------------------------------------
// Server gate is mandatory now. Local/catalog search is still available to
// everyone and never sends the typed query to an external AI/search provider.
replaceExact(
  'api/search-suggestions.js',
  "import { verifyUser } from './_usageLimit.js';",
  "import { verifyUser } from './_usageLimit.js';\nimport { requireAiConsent } from './_privacyConsent.js';"
);
replaceRegex(
  'api/search-suggestions.js',
  /(  if \(req\.method !== 'POST'\) return res\.status\(405\)\.json\(\{ error: 'Method not allowed' \}\);)/,
  `$1

  // Raw search text may contain symptoms/conditions. Never send it to Serper,
  // Anthropic, OpenAI, or Gemini unless the account has current explicit AI
  // consent and the 18+ confirmation.
  const { user: searchUser, error: searchAuthError } = await verifyUser(req);
  if (!searchUser) return res.status(401).json({ error: searchAuthError || 'auth_required' });
  if (!requireAiConsent(searchUser, res)) return;`,
  'const { user: searchUser, error: searchAuthError } = await verifyUser(req);'
);

// The client must actually attach the session token now that the route is
// protected. Also do not keep AI-search result caches in sessionStorage: a
// cached health query must not keep working after logout/consent withdrawal.
replaceExact(
  'src/utils/fetchSearchSuggestions.js',
  "/**\n * Calls /api/search-suggestions (Claude on the server). Same-origin on Vercel.\n */",
  "/**\n * Calls /api/search-suggestions. External AI/web discovery is authenticated\n * and consent-gated server-side; ordinary catalog search remains local.\n */\nimport { getSupabaseClient } from './supabaseClient.js';"
);
{
  const path = 'src/utils/fetchSearchSuggestions.js';
  let text = read(path);
  text = text.replace(
    "  // Don't cache personalized results — they're user-specific\n  const cacheKey = personalized ? null : sessionCacheKey(query, category, symptom, maxResults);\n  if (cacheKey) {\n    const cached = readSessionCache(cacheKey);\n    if (cached) return { suggestions: cached.suggestions, querySummary: cached.querySummary, relatedSearches: cached.relatedSearches || [], fromCache: true };\n  }",
    "  // Do not persist AI-search results in browser storage. Search text can be\n  // health-sensitive, and a stored result must not outlive logout or consent withdrawal.\n  const cacheKey = null;"
  );
  text = text.replace(
    "  const res = await fetch('/api/search-suggestions', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },",
    "  const headers = { 'Content-Type': 'application/json' };\n  const supabase = getSupabaseClient();\n  if (supabase) {\n    const { data } = await supabase.auth.getSession();\n    if (data?.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;\n  }\n\n  const res = await fetch('/api/search-suggestions', {\n    method: 'POST',\n    headers,"
  );
  text = text.replace(
    "  if (res.status === 429) {",
    "  if (res.status === 403 && data?.error === 'ai_consent_required') {\n    return {\n      suggestions: [],\n      querySummary: '',\n      error: 'Turn on AI features in ayna before searching beyond the ayna catalog.',\n      code: 'ai_consent_required',\n    };\n  }\n\n  if (res.status === 429) {"
  );
  write(path, text);
}

// ---------------------------------------------------------------------------
// 3) MINIMIZE PRODUCT-INSIGHT HEALTH CONTEXT
// ---------------------------------------------------------------------------
// Drop unrelated free-text notes, wearable summaries, exact product-brand
// history and contraception details. Keep bounded safety-relevant fields.
{
  const path = 'src/utils/userHealthContextForInsights.js';
  let text = read(path);
  text = text.replace('const MAX_TOTAL = 4000;', 'const MAX_TOTAL = 2500;');
  text = text.replace(
    "function stripEmails(s) {\n  return String(s).replace(/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b/g, '[redacted]');\n}\n\nfunction truncateItem(s, max) {\n  return stripEmails(String(s).trim().slice(0, max));\n}",
    "function stripDirectIdentifiers(s) {\n  return String(s)\n    .replace(/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b/g, '[redacted]')\n    .replace(/(?<!\\d)(?:\\+?1[\\s.-]?)?(?:\\(?\\d{3}\\)?[\\s.-]?)\\d{3}[\\s.-]?\\d{4}(?!\\d)/g, '[redacted]');\n}\n\nfunction truncateItem(s, max) {\n  return stripDirectIdentifiers(String(s).trim().slice(0, max));\n}"
  );
  text = text.replace(/\n\s*currentProductBrands,/, '');
  text = text.replace(/\n\s*contraceptionUse,\n\s*contraceptionPreference,/, '');
  text = text.replace(
    "    const customListed = [\n      ...(Array.isArray(currentProductBrands) ? currentProductBrands : []),\n      ...(Array.isArray(currentMedications) ? currentMedications : []),\n      ...(Array.isArray(currentSupplements) ? currentSupplements : []),\n    ].filter(Boolean);",
    "    const customListed = [\n      ...(Array.isArray(currentMedications) ? currentMedications : []),\n      ...(Array.isArray(currentSupplements) ? currentSupplements : []),\n    ].filter(Boolean);"
  );
  text = text.replace('User-listed products/meds/supplements:', 'User-listed medications/supplements:');
  text = text.replace(/\n\s*if \(contraceptionUse[\s\S]*?\n\s*}\n\s*if \(Array\.isArray\(contraceptionPreference\)[\s\S]*?\n\s*}/, '');
  text = text.replace(/\n\s*if \(hp\.notes\?\.trim\(\)\)[\s\S]*?\n\s*}\n\s*if \(hp\.intakeSummary\?\.trim\(\)\)[\s\S]*?\n\s*}\n\s*if \(hp\.wearableSummary\?\.text\?\.trim\(\)\)[\s\S]*?\n\s*}/, '');
  write(path, text);
}

// ---------------------------------------------------------------------------
// 4) ANALYTICS ID PRIVACY
// ---------------------------------------------------------------------------
// Do not put the Supabase UUID into a localStorage key. PostHog receives only
// the separate random analytics ID, and local storage contains no account ID.
{
  const path = 'src/utils/posthogPrivacy.js';
  let text = read(path);
  text = text.replace("  const storageKey = `ayna_analytics_id:${String(authId)}`;", "  const storageKey = 'ayna_analytics_id';");
  write(path, text);
}

// ---------------------------------------------------------------------------
// 5) SOCIAL SIGN-IN + 18+ CONSENT EDGE
// ---------------------------------------------------------------------------
// OAuth/id-token providers can auto-create an unseen account. Because the app
// cannot know whether Google/Apple will be a new or returning account before
// the provider completes, show the current confirmations on the sign-in screen
// too and require them before Google/Apple. Email/password returning-user sign
// in remains unaffected.
{
  const path = 'src/mobile/screens/SigninScreen.jsx';
  let text = read(path);
  text = text.replace('const [checked, setChecked] = useState([false, false, false]);', 'const [checked, setChecked] = useState([false, false, false, false]);');
  text = text.replace(
    "          {mode === 'signup' && (\n            <div style={{ marginTop: 6, marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>",
    "          {(mode === 'signup' || mode === 'signin') && (\n            <div style={{ marginTop: 6, marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>"
  );
  text = text.replace("    if (mode === 'signup' && !allConsented) {", "    if (!allConsented) {");
  text = text.replace("await onGoogleSignIn({ consented: mode === 'signup' && allConsented });", "await onGoogleSignIn({ consented: true });");
  text = text.replace("await onAppleSignIn({ consented: mode === 'signup' && allConsented });", "await onAppleSignIn({ consented: true });");
  write(path, text);
}

// Existing endpoint tests should model a user who has already granted current
// consent; dedicated gate tests below cover denial/no-consent behavior.
{
  const path = 'api/_test-helpers.js';
  let text = read(path);
  text = text.replace(
    "user = { id: 'user-1', email: 'u@x.com', app_metadata: {}, user_metadata: {} },",
    "user = { id: 'user-1', email: 'u@x.com', app_metadata: {}, user_metadata: { consent_version: 'v2-18plus', consent_given_at: '2026-09-13T00:00:00.000Z', age_18_confirmed: true } },"
  );
  write(path, text);
}

// Focused pure tests for the consent contract itself.
if (!fs.existsSync('api/_privacyConsent.test.js')) {
  write('api/_privacyConsent.test.js', `import { describe, it, expect, vi } from 'vitest';
import { hasRequiredAiConsent, requireAiConsent, REQUIRED_AI_CONSENT_VERSION } from './_privacyConsent.js';

describe('AI privacy consent gate', () => {
  const valid = { user_metadata: { consent_version: REQUIRED_AI_CONSENT_VERSION, consent_given_at: '2026-09-13T00:00:00.000Z', age_18_confirmed: true } };

  it('allows only the current version with a timestamp and 18+ confirmation', () => {
    expect(hasRequiredAiConsent(valid)).toBe(true);
    expect(hasRequiredAiConsent({ user_metadata: { ...valid.user_metadata, consent_version: 'old' } })).toBe(false);
    expect(hasRequiredAiConsent({ user_metadata: { ...valid.user_metadata, consent_given_at: null } })).toBe(false);
    expect(hasRequiredAiConsent({ user_metadata: { ...valid.user_metadata, age_18_confirmed: false } })).toBe(false);
  });

  it('returns a 403 without leaking data when consent is missing', () => {
    const json = vi.fn();
    const res = { status: vi.fn(() => ({ json })) };
    expect(requireAiConsent({ user_metadata: {} }, res)).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: 'ai_consent_required' }));
  });
});
`);
}

console.log('Catalog sync and final Apple privacy patches applied.');
