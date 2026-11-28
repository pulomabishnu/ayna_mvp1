/* Partner Studio chart colors: only ayna's four (espresso, butter, sky, pink) and their tints.
   See docs/design-rules.md. Ordered scales run espresso (strongest) > sky > light sky > pink (needs attention).
   Your brand = espresso, competitors = sky, missing = a butter shade. No green, amber or red. */
export const C = {
  you: '#3e2723',
  rival: '#769ebe',
  rival2: '#c9dcea',
  bench: '#9f8a68',
  good: '#3e2723',
  goodLight: '#769ebe',
  amberLight: '#c9dcea',
  amber: '#f7badd',
  red: '#f7badd',
  missing: '#efdca0',
  pink: '#f7badd',
  skyText: '#4d7699',
};

/** Text color that reads on a given fill. */
export const inkOn = (bg) => (bg === C.you || bg === C.skyText ? '#ffedac' : '#3e2723');
