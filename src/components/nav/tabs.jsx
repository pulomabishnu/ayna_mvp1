export { MAIN_TABS } from './mainTabs.js';
/**
 * The one set of main tabs for the phone website and the app (P1-7,
 * docs/terminology.md). Same order, names and icons in both places:
 * Library · Shop · Ecosystem (centre) · Community · You. Order agreed with
 * the founders on Oct 11 for the app; the website's phone bar follows it.
 * Ask ayna is an action, not a place, so it lives in the header (Apple HIG:
 * "use a tab bar only for navigation"), never in the bar.
 *
 * Icons: one stroke rule (1.75, round caps). Outline when not selected,
 * filled when selected (HIG tab bar convention), so the current tab reads
 * without colour.
 */

export function TabIcon({ kind, on = false }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, className: 'ay-tabicon' };
  const solid = on ? { fill: 'currentColor' } : {};
  if (kind === 'library') return <svg {...common}><path {...solid} {...(on ? { stroke: 'none' } : {})} d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13V4Z" />{!on && <path d="M7 8h1.5M16 8h1.5" />}</svg>;
  if (kind === 'home') return <svg {...common}><circle {...solid} cx="12" cy="13" r="3" /><circle {...solid} cx="12" cy="4.5" r="1.8" /><circle {...solid} cx="5" cy="18" r="1.8" /><circle {...solid} cx="19" cy="18" r="1.8" /><path d="M12 10V6.3M9.5 14.6l-3 2.2M14.5 14.6l3 2.2" /></svg>;
  if (kind === 'browse') return <svg {...common}><path {...solid} d="M4 8h16l-1 12H5L4 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
  if (kind === 'community') return <svg {...common}><path {...solid} d="M4 5h16v11H9l-5 4V5Z" />{!on && <path d="M8 10h8m-8 3h5" />}</svg>;
  return <svg {...common}><circle {...solid} cx="12" cy="8" r="3.3" /><path {...solid} d="M5 20c0-3.3 2.8-5.5 7-5.5s7 2.2 7 5.5" /></svg>;
}

/** The Ask ayna mark used by the header pill on the phone website and the app. */
export function AskMark() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"><path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" /></svg>;
}
