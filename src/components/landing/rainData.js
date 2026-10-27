// The raining collage's contents (kit.jsx Rain). Real catalog packshots only.
// Checked one by one on butter (multiply): each drops its white cleanly, no box left.
// Left out: kits and bundles shot on a boxed backdrop, and sexual wellness items.
export const RAIN_PRODUCTS = [
  'p-saalt-cup', 'p-thermacare', 'p-rael-organic-pad', 'p-lola-tampon', 'p-winx-uti-test-treat', 'p-flo-gummies',
  'p-lena-cup', 'p-evening-primrose', 'p-natracare-pad', 'p-elvie-trainer', 'p-neycher-botanical-vulva-balm', 'p-vitex',
  'p-cora-disc', 'p-honeypot-pad', 'p-magnumsolace-nighttime-magnesium-cream', 'p-thinx', 'p-tampax-pure', 'p-buni-transform-scar-body-oil',
];
const P = (i, s) => ({ k: 'p', id: RAIN_PRODUCTS[i], s });
// Columns: cut-outs and widgets interleaved, every column a different mix, size and speed.
export const RAIN_COLS = [
  [P(0, 'l'), { k: 'ring' }, P(1), { k: 'ask' }, P(2, 's'), { k: 'streak' }],
  [{ k: 'spark' }, P(3, 'l'), { k: 'match' }, P(4), { k: 'month' }, P(5, 's')],
  [P(6), { k: 'sleep' }, P(7, 'l'), { k: 'rundown' }, P(8), { k: 'streak' }],
  [{ k: 'month' }, P(9, 'l'), { k: 'ring' }, P(10, 's'), { k: 'spark' }, P(11)],
  [P(12), { k: 'match' }, P(13, 'l'), { k: 'sleep' }, P(14, 's'), { k: 'streak' }],
  [{ k: 'rundown' }, P(15), { k: 'ask' }, P(16, 'l'), { k: 'ring' }, P(17)],
];
