// Paste into a browser tab on https://www.amazon.com (javascript console or an
// automation pane). m.media-amazon.com, cdn.shopify.com, target.scene7.com and
// most Shopify stores' /products.json answer CORS from there, so one tab can
// search Amazon, read a product's gallery, and normalize any image to the
// catalog standard: background flood-filled to pure white from the edges
// (vs the median border colour), trimmed, ~8% padding, 640px square, WebP
// <= 150KB. Results come back as base64 for scripts/images to write to disk.
/* global L */
window.L = {
  async amzSearch(q) {
    const h = await (await fetch('/s?k=' + encodeURIComponent(q))).text();
    const d = new DOMParser().parseFromString(h, 'text/html');
    return [...d.querySelectorAll('div[data-component-type="s-search-result"]')].slice(0, 8).map((x) =>
      x.dataset.asin + ' | ' + (x.querySelector('[data-cy=title-recipe]')?.textContent || x.querySelector('h2')?.textContent || '')
        .replace(/\s+/g, ' ').replace(/^Sponsored ?(Ad)? ?/, '').trim().slice(0, 110) + ' | ' + (x.querySelector('.a-price .a-offscreen')?.textContent || ''));
  },
  async amzImgs(asin) {
    const h = await (await fetch('/dp/' + asin)).text();
    const d = new DOMParser().parseFromString(h, 'text/html');
    const title = (d.querySelector('#productTitle')?.textContent || '').trim();
    let imgs = [];
    const m = h.match(/'colorImages':\s*\{\s*'initial':\s*A\.\$\.parseJSON\('([\s\S]*?)'\)/);
    if (m) { try { imgs = JSON.parse(m[1].replace(/\\'/g, "'")).map((i) => i.hiRes || i.large).filter(Boolean); } catch { /* ignore */ } }
    return { asin, title, imgs };
  },
  async shop(domain, re) {
    const out = [];
    for (let page = 1; page < 6; page++) {
      const r = await fetch('https://' + domain + '/products.json?limit=250&page=' + page);
      if (!r.ok) break;
      const j = await r.json();
      if (!j.products?.length) break;
      for (const p of j.products) if (!re || new RegExp(re, 'i').test(p.title + ' ' + p.handle)) out.push({ h: p.handle, t: p.title, imgs: p.images.map((i) => i.src) });
    }
    return out;
  },
  async load(u) {
    if (typeof u !== 'string') return u; // already a canvas
    const r = await fetch(u, { mode: 'cors' });
    if (!r.ok) throw new Error(r.status + ' ' + u);
    return createImageBitmap(await r.blob());
  },
  async sheet(urls, size = 220) {
    const cols = Math.min(5, urls.length); const rows = Math.ceil(urls.length / cols);
    const c = document.createElement('canvas'); c.width = cols * size; c.height = rows * size;
    const g = c.getContext('2d'); g.fillStyle = '#ddd'; g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < urls.length; i++) {
      const x = (i % cols) * size, y = Math.floor(i / cols) * size;
      g.fillStyle = '#fff'; g.fillRect(x + 2, y + 2, size - 4, size - 4);
      try {
        const b = await L.load(urls[i]); const s = (size - 8) / Math.max(b.width, b.height);
        g.drawImage(b, x + (size - b.width * s) / 2, y + (size - b.height * s) / 2, b.width * s, b.height * s);
      } catch { g.fillStyle = '#f00'; g.fillRect(x + 10, y + 10, 20, 20); }
      g.fillStyle = '#000'; g.fillRect(x, y, 26, 20); g.fillStyle = '#ff0'; g.font = 'bold 15px sans-serif'; g.fillText(String(i), x + 4, y + 15);
    }
    return c.toDataURL('image/jpeg', 0.6).split(',')[1];
  },
  // opts: pad (0.08), size (640), tol (30), fill (true), crop [x,y,w,h] as fractions
  async proc(u, opts = {}) {
    const { pad = 0.08, size = 640, tol = 30, fill = true, crop } = opts;
    const b = await L.load(u);
    let sx = 0, sy = 0, sw = b.width, sh = b.height;
    if (crop) { sx = crop[0] * b.width; sy = crop[1] * b.height; sw = crop[2] * b.width; sh = crop[3] * b.height; }
    const k = Math.min(1, 1400 / Math.max(sw, sh));
    const W = Math.round(sw * k), H = Math.round(sh * k);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(b, sx, sy, sw, sh, 0, 0, W, H);
    const im = g.getImageData(0, 0, W, H); const p = im.data;
    const bg = new Uint8Array(W * H);
    if (fill) {
      const border = [];
      for (let x = 0; x < W; x++) { border.push(x, (H - 1) * W + x); }
      for (let y = 0; y < H; y++) { border.push(y * W, y * W + W - 1); }
      const med = [0, 1, 2].map((ch) => { const v = border.map((i) => p[i * 4 + ch]).sort((a, z) => a - z); return v[v.length >> 1]; });
      // Compare to the median border colour only (a near-white shortcut ate
      // white products on white backgrounds).
      const near = (i) => Math.abs(p[i * 4] - med[0]) + Math.abs(p[i * 4 + 1] - med[1]) + Math.abs(p[i * 4 + 2] - med[2]) < tol * 1.6;
      const st = [];
      for (const i of border) if (!bg[i] && near(i)) { bg[i] = 1; st.push(i); }
      while (st.length) {
        const i = st.pop(); const x = i % W, y = (i / W) | 0;
        const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
        for (const n of nb) if (n >= 0 && !bg[n] && near(n)) { bg[n] = 1; st.push(n); }
      }
      for (let i = 0; i < W * H; i++) if (bg[i]) { p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = 255; }
      // soften the 1px fringe next to removed background
      for (let i = 0; i < W * H; i++) if (!bg[i]) {
        const x = i % W, y = (i / W) | 0;
        if ((x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (y > 0 && bg[i - W]) || (y < H - 1 && bg[i + W])) for (let ch = 0; ch < 3; ch++) p[i * 4 + ch] = (p[i * 4 + ch] + 255 * 2) / 3 | 0;
      }
      g.putImageData(im, 0, 0);
    }
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (p[i] < 244 || p[i + 1] < 244 || p[i + 2] < 244) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) { x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; }
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    const o = document.createElement('canvas'); o.width = size; o.height = size;
    const og = o.getContext('2d'); og.fillStyle = '#fff'; og.fillRect(0, 0, size, size);
    og.imageSmoothingQuality = 'high';
    const s = size * (1 - 2 * pad) / Math.max(cw, ch);
    og.drawImage(c, x0, y0, cw, ch, (size - cw * s) / 2, (size - ch * s) / 2, cw * s, ch * s);
    let q = 0.86, out;
    do { out = o.toDataURL('image/webp', q).split(',')[1]; q -= 0.08; } while (out.length * 0.75 > 150000 && q > 0.3);
    return out;
  },
  // Brighten a light studio backdrop to white (per-channel levels from the
  // border's `pct` percentile); good for dark products on off-white sweeps.
  async levels(u, { pct = 0.6 } = {}) {
    const b = await L.load(u); const c = document.createElement('canvas'); c.width = b.width; c.height = b.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(b, 0, 0);
    const im = g.getImageData(0, 0, c.width, c.height); const p = im.data; const W = c.width, H = c.height; const border = [];
    for (let x = 0; x < W; x += 2) border.push(x, (H - 1) * W + x); for (let y = 0; y < H; y += 2) border.push(y * W, y * W + W - 1);
    const lv = [0, 1, 2].map((ch) => { const v = border.map((i) => p[i * 4 + ch]).sort((a, z) => a - z); return v[Math.floor(v.length * pct)]; });
    for (let i = 0; i < p.length; i += 4) for (let ch = 0; ch < 3; ch++) p[i + ch] = Math.min(255, p[i + ch] * 255 / lv[ch]);
    g.putImageData(im, 0, 0); return c;
  },
  // Hand-traced cut-out: keep only pixels inside polygons (fractions of the
  // image), everything else white. Used for white products on grey sweeps.
  async poly(u, polys) {
    const b = await L.load(u); const W = b.width, H = b.height; const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.save(); g.beginPath();
    for (const pl of polys) { g.moveTo(pl[0][0] * W, pl[0][1] * H); for (const [x, y] of pl.slice(1)) g.lineTo(x * W, y * H); g.closePath(); }
    g.clip(); g.drawImage(b, 0, 0); g.restore(); return c;
  },
  // Pad tool output past the inline limit so it lands in a file to decode.
  out(s) { if (typeof s !== 'string') s = JSON.stringify(s); return s + '#'.repeat(Math.max(0, 80000 - s.length)); },
  // Process many: items = [[name, url, opts?], ...] -> { name: base64 }
  async batch(items) {
    const res = {};
    for (const [n, u, o] of items) { try { res[n] = await L.proc(u, o || {}); } catch (e) { res[n] = 'ERR ' + e.message; } }
    return res;
  },
};
'ok';
