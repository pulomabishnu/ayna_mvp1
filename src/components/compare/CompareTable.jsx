import { useEffect, useMemo, useState } from 'react';
import { loadResearch } from '../../data/researchLoader.js';
import { withResearch } from '../../data/products.js';
import { NOT_ON_FILE } from '../pdp/glance.js';
import { safeProductImageSrc } from '../../utils/resolveProductImage.js';
import { productImageOverride } from '../../data/productImageOverrides.js';
import { bestForProfile, compareSetRows, COMPARE_MIN } from './compareSet.js';
import './compare.css';

function Thumb({ product }) {
  const src = productImageOverride(product) || safeProductImageSrc(product?.image || product?.imageUrl || product?.images?.[0]);
  const [broken, setBroken] = useState(false);
  return <span className="ay-cmp2__thumb" aria-hidden="true">{src && !broken ? <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} /> : <span>{(product?.brand || product?.name || '?').charAt(0)}</span>}</span>;
}

/**
 * The compare table for 2 to 4 products (app and website). Rows from
 * compareSet.js. "Best match for your profile" shows only when the engine
 * has enough to say so, with why.
 */
export default function CompareTable({ products: picked = [], matchFor = null, detailsFor = null, ratingFor = null, onOpen, onRemove, variant = 'app', headingId }) {
  // Label warnings live in the on-demand research file (same as the product page).
  const [research, setResearch] = useState(null);
  useEffect(() => { let live = true; loadResearch().then((r) => { if (live) setResearch(r); }); return () => { live = false; }; }, []);
  const products = useMemo(() => (research ? picked.map((p) => withResearch(p, research)) : picked), [picked, research]);
  const rows = compareSetRows(products, { matchFor, detailsFor, ratingFor });
  const best = bestForProfile(products, detailsFor);
  if (products.length < COMPARE_MIN) return null;
  return (
    <div className={`ay-cmp2 is-${variant}`}>
      {best
        ? <p className="ay-cmp2__best"><b>Best match for your profile: {best.product.name}.</b> {best.why}</p>
        : detailsFor && <p className="ay-cmp2__nobest">Too close to call from what you’ve shared, so ayna doesn’t pick one.</p>}
      <div className="ay-cmp2__scroll" role="region" aria-labelledby={headingId} tabIndex={0}>
        <table>
          <thead>
            <tr>
              <td />
              {products.map((p) => (
                <th key={p.id} scope="col" className={best?.product.id === p.id ? 'is-best' : undefined}>
                  <Thumb product={p} />
                  {onOpen ? <button type="button" className="ay-cmp2__name" onClick={() => onOpen(p)}>{p.name}</button> : <span className="ay-cmp2__name">{p.name}</span>}
                  {onRemove && <button type="button" className="ay-cmp2__x" onClick={() => onRemove(p)} aria-label={`Remove ${p.name} from comparison`}>Remove</button>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.label}{r.hint && <small>{r.hint}</small>}</th>
                {r.values.map((v, i) => (
                  <td key={products[i].id} className={v === NOT_ON_FILE ? 'is-unknown' : undefined}>
                    {v === NOT_ON_FILE ? 'Not on file' : v}
                    {r.notes?.[i] && <small>{r.notes[i]}</small>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
