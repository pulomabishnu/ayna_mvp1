// Builds the link preview image for aynahealth.co (public/og/ayna-share.png, 1200x630).
// Founder, Nov 9: the old preview (white, blue, a font we don't use) wasn't on brand.
// Brand only: espresso, butter, pink; ayna Display + Figtree; real catalog packshots on butter tiles,
// like the website hero. Run: node scripts/og/make-og-home.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b64 = (p) => readFileSync(path.join(root, p)).toString('base64');
const font = (p) => `url(data:font/woff2;base64,${b64(p)}) format('woff2')`;
const img = (id) => `data:image/webp;base64,${b64(`public/products/catalog/${id}.webp`)}`;
const LEFT = ['p-saalt-cup', 'p-thermacare', 'p-natracare-pad'];
const RIGHT = ['p-elvie-trainer', 'p-flo-gummies', 'p-joylux-coldher'];
const d = 'M0 0H240V6' + Array.from({ length: 6 }, (_, i) => `Q${230 - i * 40} 12 ${220 - i * 40} 6Q${210 - i * 40} 0 ${200 - i * 40} 6`).join('') + 'Z';
const tile = (id, x, y, s, r) => `<div class="t" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;transform:rotate(${r}deg)"><img src="${img(id)}"></div>`;
const html = `<!doctype html><html><head><style>
@font-face { font-family: D; src: ${font('public/fonts/ayna-display-700.woff2')}; font-weight: 700; }
@font-face { font-family: F; src: ${font('public/fonts/figtree-latin-var.woff2')}; font-weight: 300 900; }
html, body { margin: 0; }
.c { position: relative; width: 1200px; height: 630px; overflow: hidden; background: #3e2723; font-family: F; color: #ffedac; }
.t { position: absolute; border-radius: 26px; background: #ffedac; padding: 14px; box-sizing: border-box; outline: 2px solid rgba(255, 237, 172, .5); outline-offset: 6px; }
.t img { width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply; }
.mid { position: absolute; left: 270px; right: 270px; top: 92px; text-align: center; }
.mark { font: 700 54px/1 D; letter-spacing: -.03em; }
h1 { margin: 34px 0 0; font: 700 70px/1.02 D; letter-spacing: -.03em; }
h1 span { color: #f7badd; display: block; }
p { margin: 26px 0 0; font: 600 25px/1.35 F; }
.pill { display: inline-block; margin-top: 30px; padding: 16px 30px; border-radius: 999px; background: #f7badd; color: #3e2723; font: 800 24px/1 F; box-shadow: 4px 4px 0 #ffedac; }
.wave { position: absolute; left: 0; right: 0; bottom: 0; height: 34px; background: #f7badd; }
.wave svg { position: absolute; left: 0; top: -1px; width: 100%; height: 16px; }
</style></head><body><div class="c">
${tile(LEFT[0], 40, 52, 170, -6)}${tile(LEFT[1], 70, 262, 150, 4)}${tile(LEFT[2], 30, 440, 150, -3)}
${tile(RIGHT[0], 990, 46, 160, 5)}${tile(RIGHT[1], 980, 256, 150, -4)}${tile(RIGHT[2], 1010, 436, 150, 3)}
<div class="mid"><div class="mark">ayna</div><h1>Women’s health products, <span>matched to you.</span></h1>
<p>Take a 1-minute quiz. See what fits and why.</p><div class="pill">aynahealth.co · free</div></div>
<div class="wave"><svg viewBox="0 0 240 12" preserveAspectRatio="none"><path fill="#3e2723" d="${d}"/></svg></div>
</div></body></html>`;
const out = process.env.OG_OUT || path.join(root, 'public/og/ayna-share.png');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await b.close();
console.log('wrote', out);
