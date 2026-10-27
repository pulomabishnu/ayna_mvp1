// The raining background's contents (kit.jsx Rain). Real catalog packshots only.
// Checked one by one on butter (multiply): each drops its white cleanly, no box left.
// Fun but in the back (founder, Oct 27 11:36): products around the edges with
// four of the app's shapes between them, no numbers.
export const RAIN_PRODUCTS = [
  'p-saalt-cup', 'p-thermacare', 'p-lena-cup', 'p-natracare-pad', 'p-evening-primrose', 'p-flo-gummies',
  'p-cora-disc', 'p-rael-organic-pad', 'p-lola-tampon', 'p-winx-uti-test-treat', 'p-honeypot-pad', 'p-vitex',
];
const P = (i, s = 'm') => ({ k: 'p', id: RAIN_PRODUCTS[i], s });
export const RAIN_COLS = [
  [P(0, 'l'), { k: 'ring' }, P(1), P(2, 's'), { k: 'line' }],
  [P(3), P(4, 'l'), { k: 'dots' }, P(5, 's')],
  [P(6, 'l'), { k: 'match' }, P(7), P(8, 's'), { k: 'ring' }],
  [P(9), { k: 'line' }, P(10, 'l'), P(11, 's'), { k: 'dots' }],
];
