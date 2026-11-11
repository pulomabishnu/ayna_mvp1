export { MAIN_TABS, APP_TABS, EXPLORE_SECTIONS, YOU_SECTIONS } from './mainTabs.js';
/**
 * The one set of main tabs for the website and the app (docs/terminology.md).
 * Same order, names and icons everywhere: Today · Explore · Ask ayna (centre)
 * · Community · You (founder, Oct 24 2026). Ask ayna is also a place now, with
 * its own tab; the header pill stays as a shortcut from any screen.
 *
 * Icons: one stroke rule (1.75, round caps). Outline when not selected,
 * filled when selected (HIG tab bar convention), so the current tab reads
 * without colour.
 */

export function TabIcon({ kind, on = false }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, className: 'ay-tabicon' };
  const solid = on ? { fill: 'currentColor' } : {};
  if (kind === 'today') return <svg {...common}><circle {...solid} cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></svg>;
  if (kind === 'explore') return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path {...solid} d="m15.2 8.8-2 4.4-4.4 2 2-4.4 4.4-2Z" /></svg>;
  if (kind === 'ask') return <svg {...common}><path {...solid} d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" /></svg>;
  if (kind === 'library') return <svg {...common}><path {...solid} {...(on ? { stroke: 'none' } : {})} d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13V4Z" />{!on && <path d="M7 8h1.5M16 8h1.5" />}</svg>;
  // The app's centre tab, Home: a plain house, same stroke rule.
  if (kind === 'home') return <svg {...common}><path {...solid} d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5Z" /></svg>;
  // Services: a calendar with a check (care you book).
  if (kind === 'services') return <svg {...common}><rect {...solid} x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M8 3.5v4M16 3.5v4M4 10h16" /><path d="m9 15 2 2 4-4" {...(on ? { stroke: 'var(--ay-tab-on-ink, #FFEDAC)' } : {})} /></svg>;
  if (kind === 'browse' || kind === 'shop') return <svg {...common}><path {...solid} d="M4 8h16l-1 12H5L4 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
  if (kind === 'community') return <svg {...common}><path {...solid} d="M4 5h16v11H9l-5 4V5Z" />{!on && <path d="M8 10h8m-8 3h5" />}</svg>;
  return <svg {...common}><circle {...solid} cx="12" cy="8" r="3.3" /><path {...solid} d="M5 20c0-3.3 2.8-5.5 7-5.5s7 2.2 7 5.5" /></svg>;
}

/** The round profile button's person mark (You moved out of the tab bar, Oct 26). */
export function ProfileMark() {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" /></svg>;
}

/** The Ask ayna mark used by the header pill on the phone website and the app. */
export function AskMark() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"><path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" /></svg>;
}

/** Header cart (founder, Nov 10): the products she saved to buy. Opens Saved. */
export function CartMark() {
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.3" /><circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></svg>;
}

/** Header bell (founder, Nov 10): updates to her ecosystem, check-ins, community replies, ayna news. */
export function BellMark() {
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" /><path d="M10 20.5a2.1 2.1 0 0 0 4 0" /></svg>;
}
