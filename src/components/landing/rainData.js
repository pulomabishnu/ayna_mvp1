// The raining background's contents (kit.jsx Rain). Real catalog packshots only.
// Checked one by one on butter (multiply): each drops its white cleanly, no box left.
// Founder, Oct 27 12:11: spread evenly, products and the app's features taking
// turns ("your products + your data together"), each feature recognisable with
// a one-word label (no numbers).
export const RAIN_PRODUCTS = [
  'p-saalt-cup', 'p-thermacare', 'p-lena-cup', 'p-natracare-pad', 'p-evening-primrose', 'p-flo-gummies',
  'p-cora-disc', 'p-rael-organic-pad', 'p-lola-tampon', 'p-winx-uti-test-treat', 'p-honeypot-pad', 'p-vitex',
];
const P = (i, s = 'm') => ({ k: 'p', id: RAIN_PRODUCTS[i], s });
const W = (k) => ({ k });
export const RAIN_COLS = [
  [P(0, 'l'), W('ring'), P(1), W('spark'), P(2, 'l'), W('ask')],
  [W('sleep'), P(3, 'l'), W('match'), P(4), W('month'), P(5, 'l')],
  [P(6), W('fit'), P(7, 'l'), W('sleep'), P(8), W('match')],
  [W('month'), P(9), W('spark'), P(10, 'l'), W('streak'), P(11)],
];

/* Nov 9 (founder: "why is it the same products"): the website hero (espresso, each packshot on its
   own butter tile, so no white-drop check is needed) draws from a much bigger pool, a different mix
   on every visit, five products and five app widgets per column. */
export const RAIN_POOL_WIDE = [
  ...RAIN_PRODUCTS,
  'p-diva-cup', 'p-elvie-trainer', 'p-hello-disc', 'p-knix-underwear', 'p-thinx', 'p-viboos-heating-pad',
  'p-sootheher-elaris-pod', 'p-joylux-coldher', 'p-oboo-cool-spray', 'p-neycher-vaginal-moisturizer',
  'p-love-wellness-bloat', 'p-goodbug-gut-balance', 'p-magnesium-glycinate', 'p-proov-complete',
  'p-surearly-smart-ovulation-test', 'p-intimina-kegel', 'p-mypelvicbra-classic', 'p-snoogle-pillow',
  'p-frida-mom-kit', 'p-lansinoh-pads', 'p-uqora-control', 'p-gina-starter-kit', 'p-seventh-gen-tampon',
  'p-organicup', 'p-period-nirvana-disc', 'p-vio2-mouth-tape', 'p-tampax-pure', 'p-modibodi',
  'p-joylux-juicy-like-a-peach', 'p-portable-heating',
];
const WIDGET_TURNS = [
  ['ring', 'spark', 'ask', 'streak', 'fit'],
  ['sleep', 'match', 'month', 'spark', 'ring'],
  ['fit', 'sleep', 'match', 'streak', 'ask'],
  ['month', 'spark', 'ask', 'ring', 'match'],
];
/** Four columns from a shuffled pool: no product twice on screen. `rand` is injectable for tests. */
export function wideRainCols(rand = Math.random, pool = RAIN_POOL_WIDE) {
  const ids = [...pool];
  for (let i = ids.length - 1; i > 0; i -= 1) { const j = Math.floor(rand() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  let n = 0;
  return WIDGET_TURNS.map((ws, c) => ws.flatMap((w, i) => {
    const prod = { k: 'p', id: ids[n++ % ids.length], s: (c + i) % 3 === 0 ? 'l' : 'm' };
    return c % 2 ? [{ k: w }, prod] : [prod, { k: w }];
  }));
}

/** Same numbers for the same seed (mulberry32). Lets the prerendered home page and the app's first
 *  render show the same products in the rain, so nothing swaps when the page code starts. */
export function seededRandom(seed) {
  let a = (Number(seed) >>> 0) || 1;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The seed the prerendered home page used, if its HTML is still on screen; otherwise a new one. */
export function rainSeed() {
  try {
    const v = Number(document.querySelector('[data-ay-pre] .wl-hero[data-rain-seed]')?.getAttribute('data-rain-seed'));
    if (Number.isFinite(v) && v > 0) return v;
  } catch { /* no document */ }
  return 1 + Math.floor(Math.random() * 2147483646);
}
