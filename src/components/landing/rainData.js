// The raining background's contents (kit.jsx Rain). Real catalog packshots only.
// Checked one by one on butter (multiply): each drops its white cleanly, no box left.
// Calm (founder, Oct 27 11:29 and 11:32): mostly products, wide apart, two
// small shapes in all and no numbers. `dark: false` items sit out in dark
// mode, so there are fewer butter circles.
export const RAIN_PRODUCTS = ['p-saalt-cup', 'p-thermacare', 'p-lena-cup', 'p-natracare-pad', 'p-evening-primrose', 'p-flo-gummies', 'p-cora-disc', 'p-rael-organic-pad'];
const P = (i, s, dark = true) => ({ k: 'p', id: RAIN_PRODUCTS[i], s, dark });
export const RAIN_COLS = [
  [P(0, 'l'), { k: 'ring' }, P(1, 'm', false)],
  [P(2, 'm', false), P(3, 'l')],
  [P(4, 'l'), { k: 'dots' }, P(5, 'm', false)],
  [P(6, 'm', false), P(7, 'l')],
];
