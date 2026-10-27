import React, { useRef } from 'react';
import useCardViews from '../../components/explore/useCardViews.js';

/** A row of cards in the app's Explore; sends card views for CTR (useCardViews). */
export function AppRow({ items = [], where, render }) {
  const ref = useRef(null);
  useCardViews(ref, where, [items.length, items[0]?.id]);
  return <div className="ax-row" ref={ref}>{items.map((p, i) => render(p, i, where))}</div>;
}

/** A two-column grid of cards in the app's Explore, with the same view tracking. */
export function AppGrid({ items = [], where, render }) {
  const ref = useRef(null);
  useCardViews(ref, where, [items.length, items[0]?.id]);
  return <div className="ax-grid" ref={ref}>{items.map((p, i) => render(p, i, where))}</div>;
}
