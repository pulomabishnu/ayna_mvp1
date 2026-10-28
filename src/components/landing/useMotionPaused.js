import { useEffect, useState } from 'react';

/** Pause motion (the footer's setting too): stops the rain and the marquee. */
export default function useMotionPaused() {
  const read = () => { try { return document.documentElement.classList.contains('ay-motion-paused') || localStorage.getItem('ayna_motion_paused') === '1'; } catch { return false; } };
  const [paused, setPaused] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setPaused(document.documentElement.classList.contains('ay-motion-paused')));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  const toggle = () => {
    const next = !paused;
    document.documentElement.classList.toggle('ay-motion-paused', next);
    try { localStorage.setItem('ayna_motion_paused', next ? '1' : '0'); } catch { /* storage unavailable */ }
  };
  return [paused, toggle];
}

