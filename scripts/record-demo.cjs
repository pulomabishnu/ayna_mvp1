// Records the landing page demo video: node scripts/record-demo.cjs <outDir> with `npx vite --port 5175` running.
// Then: ffmpeg -ss 3 -i <out>.webm -vf "crop=390:844:0:0,fps=30" -c:v libx264 -crf 22 -pix_fmt yuv420p -movflags +faststart -an public/videos/ayna-demo.mp4
const { chromium } = require('playwright'); // eslint-disable-line
const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, recordVideo: { dir: OUT, size: { width: 780, height: 1688 } } });
  await ctx.addInitScript(() => { try { localStorage.setItem('ayna_tour_v1', JSON.stringify({ enabled: false })); } catch {} });
  await ctx.addInitScript(() => {
    const css = `.ay-tour,.ay-tour-scrim{display:none!important}
#rec-cur{position:fixed;z-index:99999;left:-50px;top:-50px;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:999px;background:rgba(247,186,221,.55);box-shadow:0 0 0 2.5px #f7badd;pointer-events:none;transition:transform .12s}
#rec-cur.is-down{transform:scale(.7)}
#rec-cap{position:fixed;z-index:99998;left:12px;right:12px;top:14px;display:flex;justify-content:center;pointer-events:none}
#rec-cap span{max-width:340px;padding:12px 18px;border-radius:18px;background:#3e2723;color:#ffedac;font:700 17px/1.3 Figtree,sans-serif;text-align:center;box-shadow:0 0 0 2px #ffedac;opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s}
#rec-cap span.is-on{opacity:1;transform:none}`;
    const add = () => {
      if (document.getElementById('rec-cur')) return;
      const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      const c = document.createElement('div'); c.id = 'rec-cur'; document.body.appendChild(c);
      const cap = document.createElement('div'); cap.id = 'rec-cap'; cap.innerHTML = '<span></span>'; document.body.appendChild(cap);
      addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
      addEventListener('mousedown', () => c.classList.add('is-down'), true);
      addEventListener('mouseup', () => c.classList.remove('is-down'), true);
      window.__cap = (t) => { const s = cap.firstChild; s.classList.remove('is-on'); setTimeout(() => { s.textContent = t; if (t) s.classList.add('is-on'); }, t ? 250 : 0); };
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
  });
  const p = await ctx.newPage();
  const wait = (ms) => p.waitForTimeout(ms);
  const cap = (t) => p.evaluate((t) => window.__cap && window.__cap(t), t);
  let mx = 195, my = 600;
  const tapAt = async (x, y) => { await p.mouse.move(x, y, { steps: 18 }); mx = x; my = y; await wait(150); await p.mouse.down(); await wait(90); await p.mouse.up(); };
  const tap = async (loc) => {
    await loc.scrollIntoViewIfNeeded(); await wait(250);
    const bx = await loc.boundingBox(); if (!bx) { console.log('no box'); return; }
    await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps: 18 }); await wait(120);
    await p.evaluate(() => document.getElementById('rec-cur')?.classList.add('is-down'));
    await loc.click(); await wait(90);
    await p.evaluate(() => document.getElementById('rec-cur')?.classList.remove('is-down'));
  };
  const text = (t) => p.getByText(t, { exact: true }).first();
  const cta = () => p.locator('.aq-cta').first();

  await p.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
  await p.mouse.move(mx, my);
  await wait(1500);
  await cap('ayna matches women’s health products to you.');
  await wait(2600);
  await tap(p.locator('.wl-cta__btn')); await wait(1400);
  await cap('Answer a few quick questions.');
  await p.locator('input[inputmode="numeric"]').first().click(); await p.keyboard.type('24', { delay: 160 }); await wait(700);
  await p.locator('body').evaluate((b) => b.querySelector('input[inputmode="numeric"]').blur());
  await tap(cta()); await wait(1200);
  await tap(text('Regular periods')); await wait(500); await tap(cta()); await wait(1200);
  await p.getByText('Got it').first().click({ timeout: 400 }).catch(() => {});

  await cap('Pick what you want help with.');
  await tap(text('Cramps or period pain')); await wait(350);
  const sl = text('Trouble sleeping'); if (await sl.count()) { await tap(sl); await wait(350); }
  await wait(500); await tap(cta()); await wait(1200);
  for (let i = 0; i < 6; i++) {
    if (await p.locator('.ay-ob-ready').count()) break;
    const label = await p.evaluate(() => document.querySelector('.aq-count')?.innerText || '');
    if (/Safety question 1/.test(label)) await cap('Then 3 safety questions, before any match.');
    for (const o of ['None', 'No', 'Moderate', 'Mild']) {
      const r = p.locator('.aq-answer').getByRole('radio', { name: o, exact: true }).or(p.locator('.aq-answer').getByRole('checkbox', { name: o, exact: true }));
      if (await r.count()) { await tap(r.first()); break; }
    }
    await wait(500);
    if (await cta().isDisabled()) { console.log('STUCK', label, await p.evaluate(() => [...document.querySelectorAll('.aq-answer [role]')].map(e => e.getAttribute('role') + ':' + e.innerText).join(' | '))); break; }
    await tap(cta()); await wait(1300);
  }
  await cap('Your matches, checked for safety first.');
  await p.evaluate(() => window.scrollTo({ top: 0 })); await wait(2800);
  await p.mouse.wheel(0, 260); await wait(1800);
  await cap('Save them free. No card.');
  await p.mouse.move(195, 640, { steps: 20 }); await wait(2200);
  await cap('');
  await wait(600);
  await ctx.close(); await b.close();
})();
