/**
 * Die-cut product stickers from the catalog photos (founder, Oct 25: "a
 * clean die-cut product cutout, not a polaroid"). The catalog photos are
 * product shots on white, so the background is removed in the browser:
 * a flood fill from the photo's edges clears the near-white backdrop (white
 * inside the product, like a label, is never reached), then the shape gets
 * a thin white die-cut edge and an espresso hairline outside it.
 *
 * A photo that is not on white (a lifestyle shot) comes back as `clean:
 * false` with the same edge around its rounded rectangle, so callers can
 * prefer clean cutouts. Anything that cannot be read (a remote image
 * without CORS, no canvas) returns null and the caller shows the plain photo.
 * Decoration only: the stickers are aria-hidden.
 */

const SIZE = 192; // canvas px (the stickers show at 50-92 css px, so this is about 2x)
const EDGE = 7; // white die-cut edge, canvas px
const LINE = 3; // espresso hairline outside it
const cache = new Map();

const canRun = () => typeof window !== 'undefined' && typeof document !== 'undefined'
  && !/jsdom/i.test(window.navigator?.userAgent || '');

function load(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (/^https?:/i.test(src) && !src.startsWith(window.location.origin)) img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Clear the near-white backdrop reachable from the border. Returns the share of the photo area cleared. */
function clearBackdrop(data, w, h, box) {
  const px = data.data;
  const seen = new Uint8Array(w * h);
  const stack = [];
  const near = (i) => {
    const o = i * 4;
    const r = px[o], g = px[o + 1], b = px[o + 2], a = px[o + 3];
    if (a < 16) return true;
    return r > 232 && g > 232 && b > 228 && Math.max(r, g, b) - Math.min(r, g, b) < 18;
  };
  const push = (x, y) => {
    if (x < box.x || y < box.y || x >= box.x + box.w || y >= box.y + box.h) return;
    const i = y * w + x;
    if (seen[i] || !near(i)) return;
    seen[i] = 1; stack.push(i);
  };
  for (let x = box.x; x < box.x + box.w; x += 1) { push(x, box.y); push(x, box.y + box.h - 1); }
  for (let y = box.y; y < box.y + box.h; y += 1) { push(box.x, y); push(box.x + box.w - 1, y); }
  let cleared = 0;
  while (stack.length) {
    const i = stack.pop();
    cleared += 1;
    px[i * 4 + 3] = 0;
    const x = i % w, y = (i - x) / w;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  // Soften the cut: a pixel next to the cleared backdrop that is still very light gets half alpha.
  for (let y = box.y + 1; y < box.y + box.h - 1; y += 1) {
    for (let x = box.x + 1; x < box.x + box.w - 1; x += 1) {
      const i = y * w + x;
      if (seen[i]) continue;
      if (seen[i - 1] || seen[i + 1] || seen[i - w] || seen[i + w]) {
        const o = i * 4;
        const light = (px[o] + px[o + 1] + px[o + 2]) / 3;
        if (light > 215) px[o + 3] = Math.round(px[o + 3] * 0.5);
      }
    }
  }
  return cleared / (box.w * box.h);
}

/** The shape (alpha only) grown by r px, filled with one colour. */
function grown(shape, r, color) {
  const c = document.createElement('canvas');
  c.width = SIZE; c.height = SIZE;
  const x = c.getContext('2d');
  const steps = 24;
  for (let k = 0; k < steps; k += 1) {
    const a = (k / steps) * Math.PI * 2;
    x.drawImage(shape, Math.cos(a) * r, Math.sin(a) * r);
  }
  x.drawImage(shape, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, SIZE, SIZE);
  return c;
}

async function build(src) {
  const img = await load(src);
  const pad = EDGE + LINE + 2;
  const room = SIZE - pad * 2;
  const s = Math.min(room / img.naturalWidth, room / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * s));
  const h = Math.max(1, Math.round(img.naturalHeight * s));
  const box = { x: Math.round((SIZE - w) / 2), y: Math.round((SIZE - h) / 2), w, h };

  const shape = document.createElement('canvas');
  shape.width = SIZE; shape.height = SIZE;
  const sx = shape.getContext('2d', { willReadFrequently: true });
  if (!sx) return null;
  sx.drawImage(img, box.x, box.y, w, h);
  const data = sx.getImageData(0, 0, SIZE, SIZE); // throws on a tainted (cross-origin) canvas
  const share = clearBackdrop(data, SIZE, SIZE, box);
  const clean = share > 0.08;
  if (clean) sx.putImageData(data, 0, 0);
  else {
    // Not on white: keep the photo, cut as a rounded rectangle.
    sx.clearRect(0, 0, SIZE, SIZE);
    sx.save();
    sx.beginPath();
    if (sx.roundRect) sx.roundRect(box.x, box.y, w, h, 14); else sx.rect(box.x, box.y, w, h);
    sx.clip();
    sx.drawImage(img, box.x, box.y, w, h);
    sx.restore();
  }

  const out = document.createElement('canvas');
  out.width = SIZE; out.height = SIZE;
  const o = out.getContext('2d');
  o.drawImage(grown(shape, EDGE + LINE, '#3e2723'), 0, 0);
  o.drawImage(grown(shape, EDGE, '#ffffff'), 0, 0);
  o.drawImage(shape, 0, 0);
  return { url: out.toDataURL('image/png'), clean };
}

/** Resolves to { url, clean } or null. Cached per photo for the session. */
export function dieCut(src) {
  if (!src || !canRun()) return Promise.resolve(null);
  if (!cache.has(src)) cache.set(src, build(src).catch(() => null));
  return cache.get(src);
}
