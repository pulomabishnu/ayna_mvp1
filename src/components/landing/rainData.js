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
  [P(0, 'l'), W('ring'), P(1), W('ask'), P(2, 'l'), W('streak')],
  [W('sleep'), P(3, 'l'), W('match'), P(4), W('month'), P(5, 'l')],
  [P(6), W('streak'), P(7, 'l'), W('sleep'), P(8), W('match')],
  [W('month'), P(9), W('ask'), P(10, 'l'), W('ring'), P(11)],
];
