import { useEffect, useState } from 'react';
import './sticky-bar.css';

/**
 * The product stays in view while she reads the rest of the page (Notion AYNA-88, "Product image should
 * be sticky"). Once the photo and Buy button scroll up out of sight, a slim bar pins under the site
 * header with the photo, the name, the price and the same Buy link; it slides away when they're back.
 */
export default function StickyProductBar({ watchRef, image = '', name = '', price = '', buy = null }) {
  const [shown, setShown] = useState(false);
  // Right under the site menu while it is on screen, at the very top once it has scrolled away.
  const [top, setTop] = useState(0);
  useEffect(() => {
    if (!shown) return undefined;
    let raf = 0;
    const place = () => { raf = 0; const nav = document.querySelector('.ay-nav'); setTop(Math.max(0, Math.round(nav?.getBoundingClientRect().bottom || 0))); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(place); };
    place();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [shown]);
  useEffect(() => {
    const el = watchRef?.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    // Shown only once the Buy row is above the top of the screen, not while it is still below.
    const io = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [watchRef]);
  return (
    <div className={`ay-stickybar${shown ? ' is-shown' : ''}`} style={{ top }} aria-hidden={!shown} inert={!shown ? true : undefined}>
      <div className="ay-stickybar__in">
        {image ? <span className="ay-stickybar__img"><img src={image} alt="" /></span> : null}
        <span className="ay-stickybar__txt"><b>{name}</b>{price ? <small>{price}</small> : null}</span>
        {buy}
      </div>
    </div>
  );
}
