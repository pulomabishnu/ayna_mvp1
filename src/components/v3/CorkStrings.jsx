import React, { useEffect, useState } from 'react';

/* Pink "investigation board" string between pinned items on the product
   page. Finds the pinned elements inside `rootRef` (by selector, in order),
   and draws a sagging string from pin to pin. Purely decorative. */
export default function CorkStrings({ rootRef, selectors, hub = false, arcUp = false, drape = false }) {
  const [paths, setPaths] = useState([]);
  const key = selectors.join('|');
  const star = Boolean(hub);
  const hang = Boolean(drape);
  const up = !hang && (Boolean(arcUp) || star);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return undefined;
    let frame = 0;
    const draw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = root.getBoundingClientRect();
        const pts = key.split('|')
          .map((sel) => { const [q, at] = sel.split('@'); return [root.querySelector(q), at]; })
          .filter(([el]) => el && el.offsetParent !== null)
          .map(([el, at]) => {
            const r = el.getBoundingClientRect();
            if (at === 'left') return [r.left + 16 - box.left, r.top + r.height / 2 - box.top];
            if (at === 'bottom') return [r.left + r.width / 2 - box.left, r.bottom - 8 - box.top];
            if (at === 'center') return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
            return [r.left + r.width / 2 - box.left, r.top + 10 - box.top];
          });
        if (hang && pts.length > 2) {
          // only the top row of a wrapped grid gets a string, so none run across a card
          const top = Math.min(...pts.slice(1).map((p) => p[1]));
          pts.splice(1, pts.length, ...pts.slice(1).filter((p) => p[1] < top + 40));
        }
        const out = [];
        for (let i = 1; i < pts.length; i += 1) {
          const [x1, y1] = star ? pts[0] : pts[i - 1]; const [x2, y2] = pts[i];
          const sag = Math.min(90, Math.hypot(x2 - x1, y2 - y1) * 0.18);
          if (hang) {
            // hangs from the hub and settles into the pin, never dipping below it
            const low = y2 >= y1 ? [x2, y2] : [x1, y1];
            const cx = (x1 + x2) / 2 + (low[0] - (x1 + x2) / 2) * 0.35;
            out.push(`M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${Math.max(y1, y2).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
            continue;
          }
          const cy = up ? Math.min(y1, y2) - Math.min(48, sag * 0.6) : Math.max(y1, y2) + sag;
          out.push(`M${x1.toFixed(1)} ${y1.toFixed(1)} Q${((x1 + x2) / 2).toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
        }
        setPaths(out);
      });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(root);
    window.addEventListener('resize', draw);
    const tick = window.setInterval(draw, 400);
    const t = window.setTimeout(() => window.clearInterval(tick), 4000);
    root.addEventListener('load', draw, true);
    root.addEventListener('transitionend', draw, true);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); window.removeEventListener('resize', draw); window.clearTimeout(t); window.clearInterval(tick); root.removeEventListener('load', draw, true); root.removeEventListener('transitionend', draw, true); };
  }, [rootRef, key, star, up]);
  if (!paths.length) return null;
  return (
    <svg className="ay3-strings" aria-hidden="true" focusable="false">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
