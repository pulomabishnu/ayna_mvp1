import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/*
 * Runs the original five-pass signed-in browser QA with corrections found
 * during visual review of the actual screenshots:
 * 1. the fixture represents a completed personalization profile, which is what
 *    mounts the real Ask Ayna launcher in App.jsx;
 * 2. the ecosystem panel deliberately clips oversized decorative orbit/glow
 *    geometry. Browser/page overflow and interactive child bounds are still
 *    checked, but that intentional decorative scrollWidth is not treated as a
 *    content-clipping failure;
 * 3. the exact branch build is served with Vite, so Vercel serverless routes
 *    are not present locally. ProductTileImage intentionally sends external
 *    product photos through /api/image-proxy in the real deployment. During
 *    this visual-only local run, follow that proxy request to the original
 *    fixture image URL so the screenshots can actually verify image layout;
 * 4. fail QA when the selected physical product photo is still missing. This
 *    prevents a blank cream fallback from being reported as a visual pass.
 */
const sourcePath = path.resolve('scripts/qa-v6-signedin-ecosystem.mjs');
const tempPath = path.resolve('scripts/.qa-v6-signedin-ecosystem-runtime.mjs');
let source = await fs.readFile(sourcePath, 'utf8');

source = source.replace(
  "  anythingElse: '',\n};",
  "  anythingElse: '',\n  personalizationCompleted: true,\n};"
);

source = source.replace(
  "const clipped = critical.map((s) => q(s)).filter(visible).filter((el) => el.scrollWidth > el.clientWidth + 3).map((el) => el.className || el.tagName);",
  "const clipped = critical.filter((s) => s !== '.v6-ecosystem-panel').map((s) => q(s)).filter(visible).filter((el) => el.scrollWidth > el.clientWidth + 3).map((el) => el.className || el.tagName);"
);

source = source.replace(
  "    if (u.pathname === '/api/ask-ayna') return req.respond({ status: 200, headers: corsHeaders(), body: JSON.stringify({ answer: 'QA response.', profileUpdate: {} }) });\n    return req.continue();",
  "    if (u.pathname === '/api/ask-ayna') return req.respond({ status: 200, headers: corsHeaders(), body: JSON.stringify({ answer: 'QA response.', profileUpdate: {} }) });\n    if (u.pathname === '/api/image-proxy') {\n      const target = u.searchParams.get('url');\n      if (target && /^https?:\\/\\//i.test(target)) {\n        return req.respond({ status: 302, headers: { location: target, 'cache-control': 'no-store' } });\n      }\n      return req.respond({ status: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'invalid_image_url' }) });\n    }\n    return req.continue();"
);

source = source.replace(
  "      hasProduct: visible(q('.v6-eco-product-card:not(.empty)')),\n      overflowX:",
  "      hasProduct: visible(q('.v6-eco-product-card:not(.empty)')),\n      productImageLoaded: (() => { const img = q('.v6-eco-product-image img'); return !!img && visible(img) && img.complete && img.naturalWidth > 0; })(),\n      overflowX:"
);

source = source.replace(
  "  if (!result.hasProduct) fail('selected product card missing');\n  if (result.overflowX > 3)",
  "  if (!result.hasProduct) fail('selected product card missing');\n  if (!result.productImageLoaded) fail('selected physical product image did not load');\n  if (result.overflowX > 3)"
);

source = source.replace(
  "  await sleep(900);",
  "  await page.waitForFunction(() => { const img = document.querySelector('.v6-eco-product-image img'); return !!img && img.complete && img.naturalWidth > 0; }, { timeout: 7000 }).catch(() => {});\n  await sleep(150);"
);

if (!source.includes('personalizationCompleted: true')) {
  throw new Error('QA runtime patch failed to mark the intake complete');
}
if (!source.includes("s !== '.v6-ecosystem-panel'")) {
  throw new Error('QA runtime patch failed to exempt decorative panel clipping');
}
if (!source.includes("u.pathname === '/api/image-proxy'")) {
  throw new Error('QA runtime patch failed to route image-proxy requests to fixture photos');
}
if (!source.includes('productImageLoaded')) {
  throw new Error('QA runtime patch failed to add product-image verification');
}

await fs.writeFile(tempPath, source);
try {
  await import(`${pathToFileURL(tempPath).href}?t=${Date.now()}`);
} finally {
  await fs.unlink(tempPath).catch(() => {});
}
