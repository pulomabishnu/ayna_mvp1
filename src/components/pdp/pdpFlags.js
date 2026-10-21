/**
 * Product page switches.
 *
 * CHIPS_MODE: how the row of section chips (Overview, Expert view, Research,
 * Reviews, Safety, How to use, Details) behaves while the page scrolls.
 *   'scrolling' (default): the row stays where it is in the page and scrolls
 *     away with it (docs/anti-vibe-checklist.md, "No sticky-on-scroll").
 *   'pinned': the row attaches under the site header (website) or the top of
 *     the app screen while the tabs are on screen, then lets go after the last
 *     tab panel. Off on short phones (under 700px tall).
 *
 * In development builds `localStorage.ayna_pdp_chips = 'pinned' | 'scrolling'`
 * overrides it, so both can be compared on the same page.
 */
export const CHIPS_MODE = 'scrolling';

export function chipsMode() {
  try {
    if (import.meta.env?.DEV && typeof window !== 'undefined') {
      const v = window.localStorage.getItem('ayna_pdp_chips');
      if (v === 'pinned' || v === 'scrolling') return v;
    }
  } catch { /* storage blocked */ }
  return CHIPS_MODE;
}
