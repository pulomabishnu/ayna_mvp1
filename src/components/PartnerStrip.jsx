import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_PRODUCTS } from '../data/products.js';
import { PARTNER_BRANDS } from '../utils/partnerBrands';
import '../styles/partner-strip.css';

/**
 * "Our brand partners" strip, shared by the website (variant="web") and the
 * app (variant="app"). Shows the contracted partners from partnerBrands.js as
 * plain wordmark text, optionally with one real catalog product photo on a
 * white tile. The visible set refreshes every ~2.5s with a short fade; it
 * pauses on hover/focus, via the pause button, and stays static when the
 * viewer prefers reduced motion. No logos are drawn or invented here.
 *
 * Props:
 *   variant: 'web' | 'app'
 *   onSelectBrand(name): optional; when given each brand is a button that
 *     opens that brand's products (Shop search). Without it the strip is
 *     display only.
 *   showPhotos: default true; set false for a text-only strip.
 */

const ROTATE_MS = 2500;
const FADE_MS = 180;

function firstPhotoFor(pattern) {
  const hit = ALL_PRODUCTS.find((p) => p?.image && pattern.test(`${p.brand || ''} ${p.name || ''}`.toLowerCase()));
  return hit ? { src: hit.image, alt: hit.name || '' } : null;
}

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false));
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

function PartnerTile({ brand, onSelectBrand, showPhotos }) {
  const [imgOk, setImgOk] = useState(true);
  const body = (
    <>
      {showPhotos && brand.photo && imgOk && (
        <span className="ay-partner-photo" aria-hidden="true">
          <img src={brand.photo.src} alt="" loading="lazy" decoding="async" width="48" height="48" onError={() => setImgOk(false)} />
        </span>
      )}
      <span className="ay-partner-name">{brand.name}</span>
    </>
  );
  if (!onSelectBrand) return <li className="ay-partner-tile">{body}</li>;
  return (
    <li className="ay-partner-tile">
      <button type="button" className="ay-partner-btn" onClick={() => onSelectBrand(brand.name)} aria-label={`See ${brand.name} products`}>
        {body}
      </button>
    </li>
  );
}

export default function PartnerStrip({ variant = 'web', onSelectBrand, showPhotos = true, title = 'Our brand partners', className = '' }) {
  const brands = useMemo(() => PARTNER_BRANDS.map((b) => ({ ...b, photo: firstPhotoFor(b.pattern) })), []);
  const reducedMotion = usePrefersReducedMotion();
  const rootRef = useRef(null);
  const [perView, setPerView] = useState(variant === 'app' ? 2 : 4);
  const [start, setStart] = useState(0);
  const [fading, setFading] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  // How many tiles fit. App is a fixed 390-ish column, so 2; web scales with width.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const min = variant === 'app' ? 150 : 200;
      const n = Math.max(2, Math.min(variant === 'app' ? 2 : 6, Math.floor(w / min)));
      setPerView(n);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [variant]);

  const isStatic = reducedMotion || brands.length <= perView;
  const paused = isStatic || hoverPaused || userPaused;

  useEffect(() => {
    if (paused) return undefined;
    let fadeTimer;
    const id = window.setInterval(() => {
      setFading(true);
      fadeTimer = window.setTimeout(() => {
        setStart((s) => (s + perView) % brands.length);
        setFading(false);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => { window.clearInterval(id); window.clearTimeout(fadeTimer); setFading(false); };
  }, [paused, perView, brands.length]);

  // Reduced motion: show every partner at once, no rotation.
  const visible = isStatic
    ? brands
    : Array.from({ length: perView }, (_, i) => brands[(start + i) % brands.length]);

  const onBlur = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHoverPaused(false); };

  return (
    <section
      ref={rootRef}
      className={`ay-partners ay-partners--${variant}${isStatic ? ' is-static' : ''} ${className}`.trim()}
      aria-label={title}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setHoverPaused(true)}
      onBlur={onBlur}
    >
      <div className="ay-partners-head">
        <h2 className="ay-partners-title">{title}</h2>
        {!isStatic && (
          <button type="button" className="ay-partners-pause" onClick={() => setUserPaused((p) => !p)} aria-pressed={userPaused} aria-label={userPaused ? 'Play partner rotation' : 'Pause partner rotation'}>
            {userPaused
              ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7-4.5z" /></svg>
              : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9M11 3.5v9" /></svg>}
          </button>
        )}
      </div>
      <ul className={`ay-partners-list${fading ? ' is-fading' : ''}`} style={{ '--ay-partners-cols': isStatic ? undefined : perView }} aria-live="off">
        {visible.map((b) => <PartnerTile key={b.name} brand={b} onSelectBrand={onSelectBrand} showPhotos={showPhotos} />)}
      </ul>
    </section>
  );
}
