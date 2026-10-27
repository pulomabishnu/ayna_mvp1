import { useEffect, useState } from 'react';
import { isPlainLeftClick } from '../../utils/productRoute.js';

/*
 * Shared pieces for Library reads a writer designed as a full page (her own
 * layout, colours and image placement, converted from her HTML file).
 * Each page's root element carries the class "ay-read".
 */

// The site keeps its theme on <html data-ay-theme>: 'brand-dark' is dark mode.
export function useSiteDark() {
  const read = () => typeof document !== 'undefined' && document.documentElement.dataset.ayTheme === 'brand-dark';
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ay-theme'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

/** How far down the page she is (0 to 1), for the top bar and the read label. */
export function useReadProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return p;
}

export const readLabelFor = (p, minutes) => (p >= 0.97 ? 'Finished' : p > 0.02 ? `${Math.round(p * 100)}% read` : `${minutes} min read`);

/** In-page "In this article" links: the targets live in the shadow root. */
export function jumpTo(e, onBeforeScroll) {
  const id = e.currentTarget.getAttribute('href').slice(1);
  const el = e.currentTarget.getRootNode().getElementById(id);
  if (!el) return;
  e.preventDefault();
  onBeforeScroll?.(id);
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** A same-site link that opens in place on a plain click (new tab still works). */
export function inPlace(handler) {
  return (e) => { if (!handler || !isPlainLeftClick(e)) return; e.preventDefault(); handler(e); };
}

// The page-level rules from the writers' files, shared by every designed read.
// Colours are variables so the page follows the site theme: her brown design
// in dark mode, the site's yellow with espresso type in light mode. Pink and
// sky stay as box colours; as text they turn espresso so they read on yellow.
export const DESIGNED_BASE_CSS = `
:host { all: initial; display: block; }
.ay-read { font-family: 'Figtree', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.ay-read, .ay-read * { box-sizing: border-box; }
.ay-read [id] { scroll-margin-top: 96px !important; }
.ay-read aside { top: 96px !important; }
/* One column on phones: the contents list sits above the read instead of
   sticking over it. */
@media (max-width: 760px) { .ay-read aside { position: static !important; } }
.ay-read { --g-bg: #43292a; --g-fg: #ffedac; --g-fg-rgb: 255, 237, 172; --g-butter: #ffedac; --g-pink: #f7badd; --g-sky: #769ebe; }
.ay-read.is-light { --g-bg: #ffedac; --g-fg: #3e2723; --g-fg-rgb: 62, 39, 35; --g-butter: #fff; --g-pink: #3e2723; --g-sky: #3e2723; }
.ay-read a { color: var(--g-fg); }
.ay-read a:hover { color: var(--g-fg); text-decoration-thickness: 2px; }
.ay-read:not(.is-light) a:hover { color: #f7badd; }
.ay-read a.ay-read__btn, .ay-read a.ay-read__btn:hover { color: #ffedac; }
.ay-read ::selection { background: #f7badd; color: #3e2723; }
.ay-read .ay-read__next:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #f7badd !important; color: #3e2723 !important; }
`;

