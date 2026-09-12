import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, text) { fs.writeFileSync(path, text); }
function replaceOne(path, before, after) {
  const text = read(path);
  const count = text.split(before).length - 1;
  if (count !== 1) throw new Error(`${path}: expected one exact match, found ${count}`);
  write(path, text.replace(before, after));
}
function replaceRegex(path, re, after) {
  const text = read(path);
  const match = text.match(re);
  if (!match) throw new Error(`${path}: regex did not match ${re}`);
  write(path, text.replace(re, after));
}

// ── Analytics: on by default, persistent opt-out, GPC honored before capture ──
replaceOne(
  'src/main.jsx',
  "import { applyStoredConsent } from './utils/analyticsConsent';",
  "import { applyStoredConsent, getStoredConsent } from './utils/analyticsConsent';"
);
replaceOne(
  'src/main.jsx',
  "const GPC_ENABLED = typeof navigator !== 'undefined' && navigator.globalPrivacyControl === true;\nconst ANALYTICS_ID_PREFIX = 'ayna_analytics_id_v1:';",
  "const GPC_ENABLED = typeof navigator !== 'undefined' && navigator.globalPrivacyControl === true;\nconst STORED_ANALYTICS_PREF = getStoredConsent();\nconst ANALYTICS_ID_PREFIX = 'ayna_analytics_id_v1:';"
);
replaceRegex(
  'src/main.jsx',
  /    \/\/ Always start opted out[\s\S]*?    opt_out_capturing_by_default: true,/,
  `    // Usage analytics are on by default, but a prior opt-out or Global\n    // Privacy Control must be honored before PostHog can emit the initial\n    // pageview. Health free text and direct identifiers are still stripped by\n    // before_send below, and session recording/autocapture remain disabled.\n    opt_out_capturing_by_default: GPC_ENABLED || STORED_ANALYTICS_PREF === 'denied',`
);

replaceOne(
  'src/utils/analyticsConsent.js',
  "export function getStoredConsent() {\n  const record = readRaw();\n  if (!record || isExpired(record)) return undefined;\n  return record.decision;\n}",
  "export function getStoredConsent() {\n  const record = readRaw();\n  if (!record) return undefined;\n  // An opt-out is a persistent privacy preference. Never silently turn\n  // analytics back on just because the old consent TTL elapsed.\n  if (record.decision === 'denied') return 'denied';\n  if (isExpired(record)) return undefined;\n  return record.decision;\n}"
);
replaceRegex(
  'src/utils/analyticsConsent.js',
  /\/\*\*[\s\S]*?Called once from main\.jsx's posthog\.init `loaded` callback[\s\S]*?\*\/\nexport function applyStoredConsent/,
  `/**\n * Called once from main.jsx's PostHog loaded callback. Analytics is on by\n * default unless the visitor previously opted out. GPC is handled in main.jsx\n * before this runs and always takes priority.\n */\nexport function applyStoredConsent`
);
replaceOne(
  'src/utils/analyticsConsent.js',
  "  ph.opt_out_capturing(); // truly undecided — stay out until the banner is answered",
  "  ph.opt_in_capturing(); // undecided — analytics is on by default until the visitor opts out"
);
replaceOne(
  'src/utils/analyticsConsent.js',
  "export function grantConsent(ph) {\n  persist('granted');\n  ph.opt_in_capturing();\n  ph.capture('$pageview');\n}",
  "export function acknowledgeAnalytics(ph) {\n  persist('granted');\n  ph.opt_in_capturing();\n}\n\nexport function grantConsent(ph) {\n  persist('granted');\n  ph.opt_in_capturing();\n  ph.capture('$pageview');\n}"
);

replaceOne(
  'src/utils/analyticsConsent.test.js',
  "  getStoredConsent, hasRecordedChoice, applyStoredConsent,\n  grantConsent, denyConsent, CONSENT_STORAGE_KEY, CONSENT_TTL_MS,",
  "  getStoredConsent, hasRecordedChoice, applyStoredConsent, acknowledgeAnalytics,\n  grantConsent, denyConsent, CONSENT_STORAGE_KEY, CONSENT_TTL_MS,"
);
replaceOne(
  'src/utils/analyticsConsent.test.js',
  "  it('applyStoredConsent opts out when nothing is stored anywhere', () => {\n    applyStoredConsent(ph);\n    expect(ph.opt_out_capturing).toHaveBeenCalled();\n    expect(ph.opt_in_capturing).not.toHaveBeenCalled();\n  });",
  "  it('applyStoredConsent opts in when nothing is stored anywhere', () => {\n    applyStoredConsent(ph);\n    expect(ph.opt_in_capturing).toHaveBeenCalled();\n    expect(ph.opt_out_capturing).not.toHaveBeenCalled();\n  });"
);
replaceOne(
  'src/utils/analyticsConsent.test.js',
  "  it('a decision older than the TTL is treated as unset', () => {\n    const stale = new Date(Date.now() - CONSENT_TTL_MS - 1000).toISOString();\n    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ decision: 'granted', timestamp: stale }));\n    expect(getStoredConsent()).toBeUndefined();\n    expect(hasRecordedChoice()).toBe(false);\n  });",
  "  it('an old grant expires to the default-on state, but an opt-out never silently expires', () => {\n    const stale = new Date(Date.now() - CONSENT_TTL_MS - 1000).toISOString();\n    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ decision: 'granted', timestamp: stale }));\n    expect(getStoredConsent()).toBeUndefined();\n    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ decision: 'denied', timestamp: stale }));\n    expect(getStoredConsent()).toBe('denied');\n    expect(hasRecordedChoice()).toBe(true);\n  });"
);
replaceOne(
  'src/utils/analyticsConsent.test.js',
  "  it('grantConsent opts in, fires a pageview, and persists with a timestamp', () => {",
  "  it('acknowledgeAnalytics persists the default-on choice without duplicating a pageview', () => {\n    acknowledgeAnalytics(ph);\n    expect(ph.opt_in_capturing).toHaveBeenCalled();\n    expect(ph.capture).not.toHaveBeenCalled();\n    expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)).decision).toBe('granted');\n  });\n\n  it('grantConsent opts in, fires a pageview, and persists with a timestamp', () => {"
);

replaceOne(
  'src/components/ConsentBanner.jsx',
  "import { hasRecordedChoice, grantConsent, denyConsent } from '../utils/analyticsConsent'",
  "import { hasRecordedChoice, acknowledgeAnalytics, denyConsent } from '../utils/analyticsConsent'"
);
replaceRegex(
  'src/components/ConsentBanner.jsx',
  /      <p>\n        We use analytics[\s\S]*?      <\/p>/,
  `      <p>\n        Usage analytics are on by default so we can understand how people use ayna and improve it.\n        We don&apos;t use analytics for advertising or sell it. Health-search text, account email, direct\n        account IDs and common health-profile fields are stripped from analytics; session recording and\n        automatic text/click capture are off. You can turn analytics off now or anytime from Privacy\n        Preferences. Read our{' '}\n        <a href="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>.\n      </p>`
);
replaceOne(
  'src/components/ConsentBanner.jsx',
  "          onClick={() => { denyConsent(ph); setVisible(false) }}\n        >\n          Necessary only",
  "          onClick={() => { denyConsent(ph); setVisible(false) }}\n        >\n          Turn analytics off"
);
replaceOne(
  'src/components/ConsentBanner.jsx',
  "          onClick={() => { grantConsent(ph); setVisible(false) }}\n        >\n          Accept",
  "          onClick={() => { acknowledgeAnalytics(ph); setVisible(false) }}\n        >\n          Got it"
);
replaceOne(
  'src/components/ConsentBanner.jsx',
  "<div role=\"dialog\" aria-live=\"polite\" aria-label=\"Analytics consent\" className=\"consent-banner\">",
  "<div role=\"dialog\" aria-live=\"polite\" aria-label=\"Analytics notice\" className=\"consent-banner\">"
);

replaceRegex(
  'src/components/PrivacyPreferencesLink.jsx',
  /export default function PrivacyPreferencesLink\(\{ style \}\) \{[\s\S]*?  return \(\n/,
  `export default function PrivacyPreferencesLink({ style }) {\n  if (typeof window === 'undefined' || !window.posthog) return null\n\n  const stored = getStoredConsent()\n  let sdkStatus\n  try { sdkStatus = window.posthog.get_explicit_consent_status?.() } catch { sdkStatus = undefined }\n  const current = stored || (sdkStatus === 'denied' ? 'denied' : 'granted')\n\n  const toggle = () => {\n    if (current === 'granted') denyConsent(window.posthog)\n    else grantConsent(window.posthog)\n    window.location.reload()\n  }\n\n  return (\n`
);
replaceOne(
  'src/components/PrivacyPreferencesLink.jsx',
  "        {current === 'granted' ? 'Switch to necessary only' : 'Turn analytics back on'}",
  "        {current === 'granted' ? 'Turn usage analytics off' : 'Turn usage analytics on'}"
);

// ── AI providers: all three are first-class fallbacks ───────────────────────
replaceOne(
  'api/product-insights.js',
  "  const fallback = ['anthropic', 'openai'];",
  "  const fallback = ['anthropic', 'openai', 'gemini'];"
);
replaceOne(
  'api/product-insights.js',
  "      'product-insights: no provider keys visible to this function. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in Vercel and redeploy.'",
  "      'product-insights: no provider keys visible to this function. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in Vercel and redeploy.'"
);
replaceOne(
  'api/product-insights.js',
  "        'No AI provider key set. Add ANTHROPIC_API_KEY (Claude) or OPENAI_API_KEY in Vercel.',",
  "        'No AI provider key set. Add ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in Vercel.',"
);
replaceOne(
  'api/product-insights.js',
  "        'In Vercel: Project → Settings → Environment Variables → add ANTHROPIC_API_KEY for Production (and Preview if you test previews). Save, then Deployments → Redeploy — env vars apply at deploy time.',",
  "        'In Vercel: Project → Settings → Environment Variables → add at least one configured provider key for Production (and Preview if you test previews), then redeploy.',"
);

replaceOne(
  '.env.example',
  "# Optional: try providers in order (default: claude,openai — no Gemini unless you add it).\n# Anthropic only: AI_INSIGHTS_PROVIDER_ORDER=claude\n# Include Gemini: AI_INSIGHTS_PROVIDER_ORDER=claude,gemini,openai",
  "# Optional provider order overrides. Production routes default to all three:\n# anthropic,openai,gemini. Change these only if you intentionally want a different order.\n# AI_INSIGHTS_PROVIDER_ORDER=anthropic,openai,gemini\n# AI_RECOMMENDATIONS_PROVIDER_ORDER=anthropic,openai,gemini\n# AI_DISCOVERY_PROVIDER_ORDER=anthropic,openai,gemini\n# AI_SMS_PROVIDER_ORDER=anthropic,openai,gemini"
);

// ── Sensitive external search: ayna DB first; external only on true DB miss ──
replaceOne(
  'api/search-suggestions.js',
  "import { ALL_PRODUCTS } from '../src/data/products.js';",
  "import { ALL_PRODUCTS } from '../src/data/products.js';\nimport { routeHealthQuery } from './_healthKnowledge.js';"
);
replaceRegex(
  'api/search-suggestions.js',
  /async function searchWebForQuery\(query\) \{[\s\S]*?\n\}\n\nfunction formatSearchHitsForPrompt\(hits\) \{[\s\S]*?\n\}\n\nfunction clampTypicalRating/,
  `async function searchWebForQuery(query) {\n  const routing = await routeHealthQuery(query, { limit: 4 });\n  if (routing.sensitive && routing.internalHits.length) return routing.internalHits;\n  if (routing.sensitive && !routing.allowExternal) return null;\n\n  const serperKey = process.env.SERPER_API_KEY;\n  if (!serperKey) return null;\n  const externalQuery = routing.sensitive ? routing.minimizedQuery : query;\n  try {\n    const r = await fetch('https://google.serper.dev/search', {\n      method: 'POST',\n      headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },\n      body: JSON.stringify({ q: \`${'${externalQuery}'} buy\`, num: 8, gl: 'us' }),\n      signal: AbortSignal.timeout(5000),\n    });\n    if (!r.ok) return null;\n    const data = await r.json();\n    const hits = (data?.organic || [])\n      .filter((h) => h.title && h.snippet)\n      .slice(0, 6)\n      .map((h) => ({ title: h.title, snippet: h.snippet.slice(0, 200), url: h.link || '', sourceType: 'web' }));\n    return hits.length ? hits : null;\n  } catch {\n    return null;\n  }\n}\n\nfunction formatSearchHitsForPrompt(hits) {\n  if (!hits || !hits.length) return '';\n  const internal = hits.every((h) => h.sourceType === 'ayna_knowledge');\n  if (internal) {\n    const lines = hits.map((h, i) => {\n      const sources = Array.isArray(h.sourceNames) && h.sourceNames.length ? \` Sources: \${h.sourceNames.join(', ')}.\` : '';\n      return \`\${i + 1}. \${h.title} — \${h.snippet}\${sources}\`;\n    });\n    return \`\\n\\nAYNA INTERNAL HEALTH KNOWLEDGE (reviewed first-party context; do not treat this as proof that a particular brand/product exists):\\n\${lines.join('\\n')}\`;\n  }\n  const lines = hits.map((h, i) => \`\${i + 1}. \${h.title} — \${h.snippet}\${h.url ? \` (\${h.url})\` : ''}\`);\n  return \`\\n\\nLIVE WEB SEARCH RESULTS (external search is used only after ayna's health knowledge database has no adequate match for a sensitive health query). Only report what these results actually show:\\n\${lines.join('\\n')}\`;\n}\n\nfunction clampTypicalRating`
);

replaceOne(
  'api/llm-recommendations.js',
  "import { isPremiumUser, hasLegacyClientPremiumFlag } from './_entitlement.js';",
  "import { isPremiumUser, hasLegacyClientPremiumFlag } from './_entitlement.js';\nimport { routeHealthQuery, minimizeExternalHealthQuery } from './_healthKnowledge.js';"
);
replaceRegex(
  'api/llm-recommendations.js',
  /async function searchProductsForConcerns\(concerns, intake\) \{[\s\S]*?\n\}\n\n\/\/ ─── Concurrency limiter/,
  `async function searchProductsForConcerns(concerns, intake) {\n  if (!concerns.length) return null;\n\n  const serperKey = process.env.SERPER_API_KEY;\n  const profile =\n    intake?.fullHealthIntake && typeof intake.fullHealthIntake === 'object'\n      ? intake.fullHealthIntake\n      : intake;\n\n  const rawPrefs =\n    Array.isArray(profile?.preferredFormats) && profile.preferredFormats.length > 0\n      ? profile.preferredFormats\n      : (Array.isArray(intake?.productPreferences) ? intake.productPreferences : []);\n  const prefs = rawPrefs.slice(0, 3).join(' ');\n\n  const rawConditions =\n    Array.isArray(profile?.diagnosisSelections) && profile.diagnosisSelections.length > 0\n      ? profile.diagnosisSelections\n      : (Array.isArray(intake?.conditions) ? intake.conditions : []);\n  const conditionsForInternalLookup = rawConditions\n    .filter((c) => !['none', 'other', 'none that i know of', 'prefer not to say'].includes(String(c).toLowerCase()))\n    .slice(0, 6)\n    .join(' ');\n\n  const results = {};\n  await Promise.all(\n    concerns.map(async (concern) => {\n      const cleanConcern = concern.replace(/\\(.*?\\)/g, '').trim();\n      const internalQuery = [cleanConcern, conditionsForInternalLookup].filter(Boolean).join(' ');\n      const routing = await routeHealthQuery(internalQuery, { limit: 4 });\n\n      if (routing.internalHits.length) {\n        results[concern] = routing.internalHits;\n        return;\n      }\n      if (routing.sensitive && !routing.allowExternal) return;\n      if (!serperKey) return;\n\n      // External fallback receives only the topic plus non-sensitive product\n      // format preferences. The user's diagnosis list/profile is never appended.\n      const topicOnly = minimizeExternalHealthQuery(cleanConcern);\n      const query = [\`best \${topicOnly} product women\`, prefs, '2025 2026 brand']\n        .filter(Boolean)\n        .join(' ');\n\n      try {\n        const r = await fetch('https://google.serper.dev/search', {\n          method: 'POST',\n          headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },\n          body: JSON.stringify({ q: query, num: 8, gl: 'us' }),\n          signal: AbortSignal.timeout(5000),\n        });\n        if (!r.ok) return;\n        const data = await r.json();\n        const hits = (data?.organic || [])\n          .filter((h) => h.title && h.snippet)\n          .slice(0, 6)\n          .map((h) => ({ title: h.title, snippet: h.snippet.slice(0, 180), url: h.link || '', sourceType: 'web' }));\n        if (hits.length) results[concern] = hits;\n      } catch {\n        // search failure is non-fatal\n      }\n    })\n  );\n\n  return Object.keys(results).length ? results : null;\n}\n\n// ─── Concurrency limiter`
);
replaceRegex(
  'api/llm-recommendations.js',
  /function formatSearchContextForConcern\(concern, hits\) \{[\s\S]*?\n\}\n\n\/\/ ─── Single-concern prompt/,
  `function formatSearchContextForConcern(concern, hits) {\n  if (!hits?.length) return '';\n  const internal = hits.every((h) => h.sourceType === 'ayna_knowledge');\n  const lines = [internal\n    ? \`\\nAYNA INTERNAL HEALTH KNOWLEDGE for "\${concern}":\`\n    : \`\\nLIVE EXTERNAL SEARCH for "\${concern}":\`];\n  hits.forEach((h, i) => {\n    lines.push(\`  \${i + 1}. \${h.title}\`);\n    if (h.snippet) lines.push(\`     \${h.snippet}\`);\n    if (!internal && h.url) lines.push(\`     Source: \${h.url}\`);\n    if (internal && Array.isArray(h.sourceNames) && h.sourceNames.length) {\n      lines.push(\`     Reviewed sources: \${h.sourceNames.join(', ')}\`);\n    }\n  });\n  lines.push(internal\n    ? 'Use as clinical context. It is not evidence that a particular commercial product exists.'\n    : 'Use as discovery signal only — quality bar still applies.');\n  return lines.join('\\n');\n}\n\n// ─── Single-concern prompt`
);

// ── Public disclosures/documentation ────────────────────────────────────────
replaceOne(
  'src/components/PrivacyPolicy.jsx',
  "  ['PostHog', 'Optional product analytics. Analytics starts only after consent. ayna uses a dedicated analytics identifier rather than your Supabase account ID, removes raw health-search text, account email, direct account identifiers and common health-profile fields at the analytics boundary, and has session recording and automatic text/click capture disabled.'],",
  "  ['PostHog', 'Product analytics are on by default with an opt-out available from Privacy Preferences and account privacy controls. ayna honors Global Privacy Control where supported, uses a dedicated analytics identifier rather than your Supabase account ID, removes raw health-search text, account email, direct account identifiers and common health-profile fields at the analytics boundary, and has session recording and automatic text/click capture disabled.'],"
);
replaceOne(
  'src/components/PrivacyPolicy.jsx',
  "  ['Search providers', 'Some product-discovery features may use an external search service to locate public product information. If a feature sends the text of a search, that provider may process the text.'],",
  "  ['Search providers', 'For sensitive symptom or condition searches, ayna checks its reviewed first-party health knowledge before using an external search service. External search is permitted only after the internal database has no adequate match; the fallback query is minimized and does not append your saved diagnosis list or health profile. Ordinary non-health product discovery may still use external search directly.'],"
);
replaceOne(
  'src/components/PrivacyPolicy.jsx',
  "            ayna uses PostHog for optional product analytics only after the visitor has made an explicit analytics choice. Analytics starts opted out by default for a visitor who has not yet decided. Session recording, automatic click/text capture and automatic exception capture are disabled, and IP collection is disabled in ayna's PostHog configuration.",
  "            ayna uses PostHog for product analytics that are on by default. You can opt out at any time from Privacy Preferences or account privacy controls, and a prior opt-out is honored before analytics starts on a later visit. Global Privacy Control is also honored where supported. Session recording, automatic click/text capture and automatic exception capture are disabled, and IP collection is disabled in ayna's PostHog configuration."
);

replaceOne(
  'public/consumer-health-data.html',
  "      <tr><td><strong>Search providers</strong></td><td>Some product-discovery features may use an external search provider to locate public product information. If that feature sends the text of a search, the search provider may process that text.</td></tr>",
  "      <tr><td><strong>Search providers</strong></td><td>For sensitive symptom or condition searches, ayna checks its reviewed first-party health knowledge before external search. External search is permitted only after the internal database has no adequate match; the fallback query is minimized and does not append your saved diagnosis list or health profile. Ordinary non-health product discovery may still use external search directly.</td></tr>"
);
replaceOne(
  'public/consumer-health-data.html',
  "      <tr><td><strong>PostHog</strong></td><td>Receives optional product-usage analytics only after analytics consent. ayna disables session recording and automatic text/click capture and is designed to strip raw health-search text, account email, direct account IDs, and common health-profile fields from analytics payloads.</td></tr>",
  "      <tr><td><strong>PostHog</strong></td><td>Receives product-usage analytics, which are on by default with an opt-out available from Privacy Preferences and account privacy controls. ayna honors Global Privacy Control where supported, disables session recording and automatic text/click capture, disables IP collection, and is designed to strip raw health-search text, account email, direct account IDs, and common health-profile fields from analytics payloads.</td></tr>"
);

replaceOne(
  'docs/PRIVACY_VENDOR_CHECKLIST.md',
  "- PostHog — consent-based product analytics",
  "- PostHog — default-on product analytics with persistent opt-out / GPC handling"
);
replaceOne(
  'docs/PRIVACY_VENDOR_CHECKLIST.md',
  "- External search provider(s) — product discovery/search where configured",
  "- External search provider(s) — ordinary product discovery, plus minimized sensitive-health fallback only after the reviewed internal database has no adequate match"
);

console.log('analytics + privacy-first health routing patch applied');
