import { useEffect, useMemo, useState } from 'react';
import { loadResearch } from '../../data/researchLoader.js';
import { withResearch } from '../../data/products.js';
import { NOT_ON_FILE } from '../pdp/glance.js';
import { safeProductImageSrc } from '../../utils/resolveProductImage.js';
import { productImageOverride } from '../../data/productImageOverrides.js';
import { bestForProfile, compareSetRows, COMPARE_MIN } from './compareSet.js';
import { Plate } from '../ui/ay';
import './compare.css';

/* The product on the shared white scalloped plate (signature 1); the brand name on the plain plate if the photo fails. */
function Thumb({ product }) {
  const src = productImageOverride(product) || safeProductImageSrc(product?.image || product?.imageUrl || product?.images?.[0]);
  const [broken, setBroken] = useState(false);
  return <span className="ay-cmp2__thumb" aria-hidden="true"><Plate src={src && !broken ? src : ''} alt="" fallback={product?.brand || product?.name || ''} imgProps={{ onError: () => setBroken(true) }} /></span>;
}

// Rows whose cells are prose: a two-line preview, the full text one tap away (nothing is cut for good).
const LONG_ROWS = new Set(['use', 'ingredients', 'safety', 'prefs']);
const isLong = (r) => LONG_ROWS.has(r.id) || r.values.some((v) => String(v || '').length > 72);
const NO_PROFILE = 'Needs your health profile';

/**
 * The compare table for 2 to 4 products (app and website), critique Oct 27:
 * one product per column, its photo and name on top, then rows of short
 * values. Only objective rows (cost per use, lifespan, FSA/HSA) can mark a
 * value, in butter, and only where the data is on file (compareSet.js
 * objectiveRows). Prose rows open on tap. On a phone two products fit; three
 * or four scroll sideways. "Best match for your profile" shows only when the
 * engine has enough to say so, with why.
 */
export const SEE_YOUR_MATCH = 'See your match';

export default function CompareTable({ products: picked = [], matchFor = null, detailsFor = null, ratingFor = null, onOpen, onRemove, canRemove = null, variant = 'app', headingId, onSeeMatch = null, thisId = null }) {
  // Label warnings live in the on-demand research file (same as the product page).
  const [research, setResearch] = useState(null);
  useEffect(() => { let live = true; loadResearch().then((r) => { if (live) setResearch(r); }); return () => { live = false; }; }, []);
  const products = useMemo(() => (research ? picked.map((p) => withResearch(p, research)) : picked), [picked, research]);
  const [open, setOpen] = useState({});
  // Without her answers the match row never shows a number. One "Get matched" line replaces the
  // match and preferences rows that would say "Needs your health profile" in every column.
  const noProfile = !matchFor && !detailsFor;
  const rows = compareSetRows(products, { matchFor, detailsFor, ratingFor, ...(onSeeMatch ? { noProfileText: SEE_YOUR_MATCH } : {}) })
    .filter((r) => !(noProfile && (r.id === 'match' || (r.id === 'prefs' && r.values.every((v) => v === NO_PROFILE)))));
  const best = bestForProfile(products, detailsFor);
  if (products.length < COMPARE_MIN) return null;
  const marks = rows.some((r) => r.better?.some(Boolean));
  return (
    <div className={`ay-cmp2 is-${variant}`} style={{ '--cmp-n': products.length }}>
      {best
        ? <p className="ay-cmp2__best"><b>Best match for your profile: {best.product.name}.</b> {best.why}</p>
        : detailsFor && <p className="ay-cmp2__nobest">Too close to call from what you’ve shared, so ayna doesn’t pick one.</p>}
      {noProfile && (
        <p className="ay-cmp2__getmatched">
          <span>Get matched to see how each one fits you.</span>
          {onSeeMatch && <button type="button" onClick={onSeeMatch}>Get matched</button>}
        </p>
      )}
      {marks && <p className="ay-cmp2__legend"><i aria-hidden="true" /> Marked: the lower cost per use, the longer stated life, or FSA/HSA eligible.</p>}
      <div className="ay-cmp2__scroll" role="region" aria-labelledby={headingId} tabIndex={0}>
        <table>
          <thead>
            <tr>
              <td />
              {products.map((p) => (
                <th key={p.id} scope="col" className={best?.product.id === p.id ? 'is-best' : undefined}>
                  <Thumb product={p} />
                  {onOpen && p.id !== thisId ? <button type="button" className="ay-cmp2__name" onClick={() => onOpen(p)}>{p.name}</button> : <span className="ay-cmp2__name">{p.name}</span>}
                  {p.id === thisId && <small className="ay-cmp2__this">This product</small>}
                  {onRemove && (!canRemove || canRemove(p)) && <button type="button" className="ay-cmp2__x" onClick={() => onRemove(p)} aria-label={`Remove ${p.name} from comparison`}>Remove</button>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const long = isLong(r);
              const expanded = Boolean(open[r.id]);
              const label = <span className="ay-cmp2__label"><span>{r.label}</span>{r.hint && <small>{r.hint}</small>}</span>;
              return (
                <tr key={r.id} className={`${long ? 'is-long' : ''}${expanded ? ' is-open' : ''}`.trim() || undefined}>
                  <th scope="row">
                    {long
                      ? <button type="button" className="ay-cmp2__rowbtn" aria-expanded={expanded} onClick={() => setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))}>
                          {label}
                          <span className="ay-cmp2__chev" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg></span>
                          <span className="sr-only">{expanded ? ', shown in full' : ', tap to read in full'}</span>
                        </button>
                      : label}
                  </th>
                  {r.values.map((v, i) => {
                    const unknown = v === NOT_ON_FILE;
                    const better = Boolean(r.better?.[i]);
                    // The full text is always there; a closed prose row clamps it to two lines (CSS), so nothing is cut twice.
                    const text = unknown ? 'Not on file' : long && r.full?.[i] ? r.full[i] : String(v).replace(/\s*More on its page\.$/, '');
                    return (
                      <td key={products[i].id} className={[unknown && 'is-unknown', better && 'is-better'].filter(Boolean).join(' ') || undefined}>
                        {r.noProfile && onSeeMatch && !unknown
                          ? <button type="button" className="ay-cmp2__see" onClick={onSeeMatch}>{v}</button>
                          : <span className="ay-cmp2__val">{text}{better && <span className="sr-only"> (marked)</span>}</span>}
                        {r.notes?.[i] && <small>{r.notes[i]}</small>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
