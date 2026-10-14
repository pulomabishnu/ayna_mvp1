// Builds the static share image for ayna Wrapped links (public/og/wrapped.png).
// Pure brand tokens, no user data of any kind. Rendered with the repo's
// Playwright Chromium so the founder can re-run it any time:
//   node scripts/og/make-og.mjs
// Playwright is resolved from wherever it is installed (repo, or a tools
// checkout via NODE_PATH); any chromium works, PW_CHROME overrides the path.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(process.env.PW_REQUIRE_FROM ? path.join(process.env.PW_REQUIRE_FROM, 'noop.js') : import.meta.url);
const { chromium } = require('playwright');
const out = process.env.OG_OUT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/og/wrapped.png');
const html = `<!doctype html><meta charset="utf-8">
<style>
  :root { --ink: #1d1a2b; --paper: #fffcf5; --peri: #b9c2f4; --butter: #f6e7a2; --pink: #f6cfe0; --mint: #cfe8d8; }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: var(--paper); font-family: 'Poppins', system-ui, sans-serif; color: var(--ink); overflow: hidden; position: relative; }
  .frame { position: absolute; inset: 26px; border: 3px solid var(--ink); border-radius: 36px; background: var(--paper); overflow: hidden; }
  .blob { position: absolute; border: 3px solid var(--ink); border-radius: 50%; }
  .b1 { width: 340px; height: 340px; right: -90px; top: -110px; background: var(--peri); }
  .b2 { width: 230px; height: 230px; right: 150px; bottom: -120px; background: var(--pink); }
  .b3 { width: 150px; height: 150px; right: 70px; top: 250px; background: var(--butter); }
  .b4 { width: 90px; height: 90px; right: 320px; top: 120px; background: var(--mint); }
  .wordmark { position: absolute; left: 70px; top: 64px; display: flex; align-items: center; gap: 14px; }
  .wordmark b { font-family: 'Bricolage Grotesque', 'Poppins', sans-serif; font-weight: 800; font-size: 54px; letter-spacing: -0.04em; }
  .tag { padding: 8px 18px; border: 3px solid var(--ink); border-radius: 999px; background: var(--butter); font-weight: 700; font-size: 22px; }
  h1 { position: absolute; left: 70px; top: 196px; width: 860px; font-family: 'Bricolage Grotesque', 'Poppins', sans-serif; font-weight: 800; font-size: 82px; line-height: 1.06; letter-spacing: -0.04em; }
  h1 em { font-style: normal; background: var(--peri); border-radius: 18px; padding: 0 14px; }
  p { position: absolute; left: 70px; top: 420px; width: 760px; font-size: 26px; font-weight: 500; line-height: 1.3; white-space: nowrap; color: rgba(29, 26, 43, .78); }
  .pill { position: absolute; left: 70px; bottom: 44px; display: inline-flex; align-items: baseline; gap: 10px; padding: 16px 28px; border-radius: 999px; background: var(--ink); color: var(--paper); font-weight: 800; font-size: 28px; }
  .pill span { font-weight: 500; opacity: .8; }
</style>
<body>
  <div class="frame">
    <div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="blob b4"></div>
    <div class="wordmark"><b>ayna</b><span class="tag">Wrapped</span></div>
    <h1>Your health picks, <em>matched</em> to you.</h1>
    <p>A personal ecosystem of women's health products, built from your answers.</p>
    <div class="pill">aynahealth.co <span>· build yours</span></div>
  </div>
</body>`;

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html.replace('<meta charset="utf-8">', `<meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Poppins:wght@500;700;800&display=swap" rel="stylesheet">`), { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: out });
await browser.close();
console.log('wrote', out);
