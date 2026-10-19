import { useMemo } from 'react';
import { buildRoutine, buildShoppingList } from '../../health/plan.js';
import { getBuyUrl } from '../data/buyUrl.js';
import { safeProductImageSrc } from '../../utils/resolveProductImage.js';
import { productImageOverride } from '../../data/productImageOverrides.js';

/**
 * Her routine and shopping list (src/health/plan.js), used at the end of the
 * quiz and in Ecosystem -> Routine. `have` marks what she already owns; it is
 * a shopping convenience kept on this device, not health data.
 */

function Thumb({ product }) {
  const src = productImageOverride(product) || safeProductImageSrc(product.image || product.imageUrl || product.images?.[0]);
  return <span className="ay-rt-thumb">{src ? <img src={src} alt="" loading="lazy" /> : <span aria-hidden="true">{(product.brand || product.name || '?').charAt(0)}</span>}</span>;
}

export function Routine({ products, insights, onOpenProduct }) {
  const routine = useMemo(() => buildRoutine(products, insights), [products, insights]);
  if (!routine.slots.length) return null;
  return (
    <section className="ay-rt" aria-labelledby="ay-rt-title">
      <h2 id="ay-rt-title">Your routine</h2>
      <p className="ay-rt-lede">Where each of your matches fits in your week, with a how-to line from its own instructions.</p>
      {routine.slots.map((slot) => (
        <div key={slot.id} className={`ay-rt-slot is-${slot.id}`}>
          <h3>{slot.title}</h3>
          {slot.note && <p className="ay-rt-note">{slot.note}</p>}
          <ul>
            {slot.items.map(({ product, how }) => (
              <li key={product.id}>
                <button type="button" className="ay-rt-item" onClick={() => onOpenProduct?.(product)}>
                  <Thumb product={product} />
                  <span className="ay-rt-text">
                    <b>{product.name}</b>
                    {how && <span className="ay-rt-how">{how.text}</span>}
                    {how?.source && <small>From {how.source}</small>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export function ShoppingList({ products, insights, have = {}, onToggleHave, onOpenProduct }) {
  const list = useMemo(() => buildShoppingList(products, insights, { getBuyUrl }), [products, insights]);
  if (!list.count) return null;
  const owned = list.groups.flatMap((g) => g.items).filter((i) => have[i.product.id]).length;
  return (
    <section className="ay-sl" aria-labelledby="ay-sl-title">
      <div className="ay-sl-head"><h2 id="ay-sl-title">Shopping list</h2><span>{owned} of {list.count} ready</span></div>
      {list.groups.map((g) => (
        <div key={g.id} className="ay-sl-group">
          <h3>{g.title}</h3>
          <ul>
            {g.items.map(({ product, price, where, buyUrl }) => {
              const got = Boolean(have[product.id]);
              return (
                <li key={product.id} className={got ? 'is-have' : ''}>
                  <label className="ay-sl-check">
                    <input type="checkbox" checked={got} onChange={() => onToggleHave?.(product.id)} />
                    <span className="ay-sl-box" aria-hidden="true" />
                    <span className="ay-sl-sr">I have {product.name}</span>
                  </label>
                  <button type="button" className="ay-sl-name" onClick={() => onOpenProduct?.(product)}>
                    <b>{product.name}</b>
                    <small>{[price, where.length ? where.join(', ') : null].filter(Boolean).join(' · ')}</small>
                  </button>
                  {buyUrl && !got && <a className="ay-sl-buy" href={buyUrl} target="_blank" rel="noopener noreferrer sponsored">Buy<span className="ay-sl-sr"> {product.name}</span></a>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
