import React, { useEffect, useMemo, useRef, useState } from 'react';
import ProductTileImage from '../ProductTileImage';
import { prefersReducedMotion } from './campaignClient';

/**
 * The spin: a row of product tiles glides past a fixed frame and settles on
 * the product the SERVER picked. The animation is decoration only: the result
 * is already decided when it starts, it is announced in text, and with
 * prefers-reduced-motion it is skipped entirely.
 */
const TILE_COUNT = 26; // tiles in one run; the winner sits near the end
const DURATION_MS = 2600;


const toTileProduct = (p) => p && ({ id: p.productId, name: p.name, brand: p.brand, image: p.image, type: 'physical' });

function buildStrip(pool, start, winner) {
  const items = [];
  const filler = pool.length ? pool : [winner];
  if (start) items.push(start);
  while (items.length < TILE_COUNT - 3) {
    const pick = filler[Math.floor(Math.random() * filler.length)];
    // Avoid two of the same product side by side when there is a choice.
    if (filler.length > 1 && items.length && items[items.length - 1].rewardProductId === pick.rewardProductId) continue;
    items.push(pick);
  }
  items.push(winner);
  // Two tiles after the winner so the row never ends at the frame.
  for (let i = 0; i < 2; i += 1) items.push(filler[(i + 1) % filler.length]);
  return { items, winnerIndex: items.length - 3 };
}

export default function ProductReel({ pool, spinning, result, onSettled }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  // Idle row. After a reload with a spin already shown, centre that product.
  const [strip, setStrip] = useState(() => {
    const items = pool.slice(0, 7);
    const mid = Math.min(3, Math.max(0, items.length - 1));
    if (result?.product) items[mid] = result.product;
    return { items, winnerIndex: mid };
  });
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const lastResultRef = useRef(result?.spinId || null);
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;

  // Distance from the left of the row to the centre of tile i, minus half the window.
  const offsetFor = (index) => {
    const viewport = viewportRef.current;
    const tile = trackRef.current?.children?.[index];
    if (!viewport || !tile) return 0;
    return tile.offsetLeft + tile.offsetWidth / 2 - viewport.clientWidth / 2;
  };

  // Idle: centre the middle tile.
  useEffect(() => {
    if (spinning || result) return;
    setOffset(offsetFor(strip.winnerIndex));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.length]);

  useEffect(() => {
    if (!spinning || !result || lastResultRef.current === result.spinId) return undefined;
    lastResultRef.current = result.spinId;
    const previous = strip.items[strip.winnerIndex];
    const next = buildStrip(pool, previous, result.product);
    setAnimating(false);
    setStrip(next);
    if (prefersReducedMotion()) {
      requestAnimationFrame(() => {
        setOffset(offsetFor(next.winnerIndex));
        settledRef.current?.();
      });
      return undefined;
    }
    let raf2;
    let timer;
    const raf1 = requestAnimationFrame(() => {
      setOffset(offsetFor(0));
      raf2 = requestAnimationFrame(() => {
        setAnimating(true);
        setOffset(offsetFor(next.winnerIndex));
        timer = setTimeout(() => { setAnimating(false); settledRef.current?.(); }, DURATION_MS + 60);
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, result]);

  // Keep the winner centred if the window is resized.
  useEffect(() => {
    const onResize = () => { if (!animating) setOffset(offsetFor(strip.winnerIndex)); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

  const tiles = useMemo(() => strip.items.map((p, i) => (
    <li key={`${i}-${p?.rewardProductId}`} className={`fp-reel__tile${!spinning && result && i === strip.winnerIndex ? ' is-winner' : ''}`}>
      <ProductTileImage product={toTileProduct(p)} alt="" loading={i < 8 ? 'eager' : 'lazy'} />
    </li>
  )), [strip, spinning, result]);

  return (
    <div className={`fp-reel${spinning ? ' is-spinning' : ''}`} aria-hidden="true">
      <div className="fp-reel__window" ref={viewportRef}>
        <ul
          className="fp-reel__track"
          ref={trackRef}
          style={{
            transform: `translate3d(${-offset}px, 0, 0)`,
            transition: animating ? `transform ${DURATION_MS}ms var(--ease-out)` : 'none',
          }}
        >
          {tiles}
        </ul>
        <span className="fp-reel__frame" />
      </div>
    </div>
  );
}
