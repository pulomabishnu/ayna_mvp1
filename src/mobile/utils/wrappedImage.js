// Draws the Wrapped summary as a 1080×1920 story image (Spotify-style) so
// sharing sends a picture, not a link. Uses only what's on the final slide.
const C = { ink: '#3e2723', paper: '#ffffff', butter: '#ffedac', pink: '#f7badd', mint: '#769ebe', peri: '#769ebe' };
const DISPLAY = "'ayna Display', 'Figtree', system-ui, sans-serif";
const UI = "'Figtree', system-ui, sans-serif";

function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/); const lines = []; let line = '';
  words.forEach((w) => { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxWidth && line) { lines.push(line); line = w; } else line = t; });
  if (line) lines.push(line);
  return lines;
}
function pill(ctx, x, y, w, h, fill) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
}

export async function renderWrappedImage({ title, picks = 0, areas = 0, topAreas = [], productNames = [] }) {
  try { await document.fonts?.ready; } catch { /* fonts optional */ }
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = C.peri; ctx.fillRect(0, 0, W, H);
  // shapes
  ctx.lineWidth = 6; ctx.strokeStyle = C.ink;
  ctx.fillStyle = C.butter; ctx.beginPath(); ctx.arc(W - 120, 220, 210, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.pink; ctx.save(); ctx.translate(W - 150, H - 100); ctx.rotate(-0.2); ctx.beginPath(); ctx.roundRect(-80, -80, 160, 160, 32); ctx.fill(); ctx.stroke(); ctx.restore();
  // wordmark
  ctx.fillStyle = C.ink; ctx.font = `800 72px ${DISPLAY}`; ctx.fillText('ayna', 90, 170);
  ctx.font = `700 40px ${UI}`; ctx.fillText('My Wrapped', 90, 236);
  // card
  const x = 90, y = 360, w = W - 180, h = 1400;
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.roundRect(x + 14, y + 18, w, h, 56); ctx.fill();
  ctx.fillStyle = C.paper; ctx.beginPath(); ctx.roundRect(x, y, w, h, 56); ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = C.ink; ctx.font = `800 104px ${DISPLAY}`;
  let ty = y + 170;
  wrap(ctx, title || 'My ecosystem', w - 120).slice(0, 2).forEach((l) => { ctx.fillText(l, x + 60, ty); ty += 112; });
  ty += 20;
  [[`${picks}`, picks === 1 ? 'pick' : 'picks', C.butter], [`${areas}`, areas === 1 ? 'area' : 'areas', C.mint]].forEach(([n, label, fill], i) => {
    const bx = x + 60 + i * 420; pill(ctx, bx, ty, 380, 150, fill);
    ctx.fillStyle = C.ink; ctx.font = `800 84px ${DISPLAY}`; ctx.fillText(n, bx + 40, ty + 105);
    const numW = ctx.measureText(n).width;
    ctx.font = `700 40px ${UI}`; ctx.fillText(label, bx + 40 + numW + 18, ty + 98);
  });
  ty += 220;
  const list = (heading, items, fill) => {
    if (!items.length) return;
    ctx.fillStyle = C.ink; ctx.font = `700 38px ${UI}`; ctx.globalAlpha = 0.6; ctx.fillText(heading, x + 60, ty); ctx.globalAlpha = 1; ty += 30;
    items.slice(0, 3).forEach((t) => {
      ty += 20; ctx.font = `700 40px ${UI}`;
      const label = wrap(ctx, t, w - 220)[0];
      pill(ctx, x + 60, ty, Math.min(w - 120, ctx.measureText(label).width + 80), 80, fill);
      ctx.fillStyle = C.ink; ctx.fillText(label, x + 100, ty + 54); ty += 80;
    });
    ty += 64;
  };
  list('Focus', topAreas, C.pink);
  list('Top picks', productNames, C.paper);
  ctx.fillStyle = C.ink; ctx.font = `700 40px ${UI}`; ctx.fillText('aynahealth.co', 90, H - 70);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

/** Share as an image where supported; otherwise download it. Returns 'shared' | 'downloaded' | 'failed'. */
export async function shareWrappedImage(data) {
  const blob = await renderWrappedImage(data);
  if (!blob) return 'failed';
  const file = new File([blob], 'my-ayna-wrapped.png', { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'My ayna Wrapped' }); return 'shared'; }
  } catch (e) { if (e?.name === 'AbortError') return 'shared'; }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'my-ayna-wrapped.png'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
